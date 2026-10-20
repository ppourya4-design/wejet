use crate::services::cache::{load_cached, save_cached, CachedResult};
use crate::services::storage::StorageService;
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ForecastDay {
    pub date: String,
    pub weather_code: i32,
    pub temp_min: f64,
    pub temp_max: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WeatherPayload {
    pub city: String,
    pub latitude: f64,
    pub longitude: f64,
    pub temperature_c: f64,
    pub feels_like_c: f64,
    pub humidity: u32,
    pub wind_kph: f64,
    pub weather_code: i32,
    pub is_day: bool,
    pub temp_min_c: f64,
    pub temp_max_c: f64,
    pub forecast: Vec<ForecastDay>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CitySearchItem {
    pub name: String,
    pub country: String,
    pub admin1: Option<String>,
    pub latitude: f64,
    pub longitude: f64,
}

pub trait WeatherProvider: Send + Sync {
    fn name(&self) -> &'static str;
    fn fetch_weather(&self, city: &str, lat: f64, lon: f64) -> Result<WeatherPayload, String>;
    fn search_city(&self, query: &str) -> Result<Vec<CitySearchItem>, String>;
}

pub struct OpenMeteoProvider {
    agent: ureq::Agent,
}

impl Default for OpenMeteoProvider {
    fn default() -> Self {
        let agent = ureq::AgentBuilder::new()
            .timeout_connect(Duration::from_secs(4))
            .timeout_read(Duration::from_secs(5))
            .build();
        Self { agent }
    }
}

#[derive(Deserialize)]
struct OpenMeteoResponse {
    current: OpenMeteoCurrent,
    daily: OpenMeteoDaily,
}

#[derive(Deserialize)]
struct OpenMeteoCurrent {
    temperature_2m: f64,
    apparent_temperature: f64,
    relative_humidity_2m: u32,
    wind_speed_10m: f64,
    weather_code: i32,
    is_day: i32,
}

#[derive(Deserialize)]
struct OpenMeteoDaily {
    time: Vec<String>,
    weather_code: Vec<i32>,
    temperature_2m_max: Vec<f64>,
    temperature_2m_min: Vec<f64>,
}

#[derive(Deserialize)]
struct GeocodingResponse {
    results: Option<Vec<GeocodingItem>>,
}

#[derive(Deserialize)]
struct GeocodingItem {
    name: String,
    country: Option<String>,
    admin1: Option<String>,
    latitude: f64,
    longitude: f64,
}

impl WeatherProvider for OpenMeteoProvider {
    fn name(&self) -> &'static str {
        "Open-Meteo"
    }

    fn fetch_weather(&self, city: &str, lat: f64, lon: f64) -> Result<WeatherPayload, String> {
        let url = format!(
            "https://api.open-meteo.com/v1/forecast?latitude={lat:.4}&longitude={lon:.4}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5"
        );
        let parsed: OpenMeteoResponse = self
            .agent
            .get(&url)
            .call()
            .map_err(|e| format!("Weather request failed: {e}"))?
            .into_json()
            .map_err(|e| format!("Weather parse failed: {e}"))?;

        let temp_min_c = parsed
            .daily
            .temperature_2m_min
            .first()
            .copied()
            .unwrap_or(parsed.current.temperature_2m - 4.0);
        let temp_max_c = parsed
            .daily
            .temperature_2m_max
            .first()
            .copied()
            .unwrap_or(parsed.current.temperature_2m + 4.0);

        let mut forecast = Vec::with_capacity(4);
        for idx in 1..parsed.daily.time.len().min(5) {
            forecast.push(ForecastDay {
                date: parsed.daily.time[idx].clone(),
                weather_code: parsed.daily.weather_code.get(idx).copied().unwrap_or(0),
                temp_min: parsed
                    .daily
                    .temperature_2m_min
                    .get(idx)
                    .copied()
                    .unwrap_or(14.0),
                temp_max: parsed
                    .daily
                    .temperature_2m_max
                    .get(idx)
                    .copied()
                    .unwrap_or(24.0),
            });
        }

        Ok(WeatherPayload {
            city: city.to_string(),
            latitude: lat,
            longitude: lon,
            temperature_c: parsed.current.temperature_2m,
            feels_like_c: parsed.current.apparent_temperature,
            humidity: parsed.current.relative_humidity_2m,
            wind_kph: parsed.current.wind_speed_10m,
            weather_code: parsed.current.weather_code,
            is_day: parsed.current.is_day == 1,
            temp_min_c,
            temp_max_c,
            forecast,
        })
    }

    fn search_city(&self, query: &str) -> Result<Vec<CitySearchItem>, String> {
        let trimmed = query.trim();
        if trimmed.len() < 2 {
            return Ok(Vec::new());
        }
        let encoded: String = trimmed
            .bytes()
            .flat_map(|b| match b {
                b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' => {
                    vec![b as char]
                }
                b' ' => vec!['+'],
                _ => format!("%{b:02X}").chars().collect(),
            })
            .collect();
        let url = format!(
            "https://geocoding-api.open-meteo.com/v1/search?name={encoded}&count=6&language=en&format=json"
        );
        let resp: GeocodingResponse = self
            .agent
            .get(&url)
            .call()
            .map_err(|e| format!("City search failed: {e}"))?
            .into_json()
            .map_err(|e| format!("City parse failed: {e}"))?;

        Ok(resp
            .results
            .unwrap_or_default()
            .into_iter()
            .map(|r| CitySearchItem {
                name: r.name,
                country: r.country.unwrap_or_default(),
                admin1: r.admin1,
                latitude: r.latitude,
                longitude: r.longitude,
            })
            .collect())
    }
}

pub struct WeatherService {
    provider: Box<dyn WeatherProvider>,
    last_attempt: Mutex<Option<Instant>>,
}

impl Default for WeatherService {
    fn default() -> Self {
        Self {
            provider: Box::new(OpenMeteoProvider::default()),
            last_attempt: Mutex::new(None),
        }
    }
}

impl WeatherService {
    const TTL_SECONDS: u64 = 1800; // 30 minutes
    const CACHE_KEY: &'static str = "cache/weather.json";

    pub fn get_weather(
        &self,
        storage: &StorageService,
        city: &str,
        lat: f64,
        lon: f64,
        force_refresh: bool,
    ) -> CachedResult<WeatherPayload> {
        if let Some(existing) = load_cached::<WeatherPayload>(storage, Self::CACHE_KEY) {
            let same_coords = (existing.data.latitude - lat).abs() < 0.05
                && (existing.data.longitude - lon).abs() < 0.05;
            let current = existing.clone().into_result(false);
            if same_coords && !force_refresh && !current.is_stale {
                return current;
            }
            // Rate limit rapid retries to max 1 network hit per 15s unless coords changed
            if same_coords {
                let guard = self.last_attempt.lock();
                if let Some(prev) = *guard {
                    if prev.elapsed() < Duration::from_secs(15) && !force_refresh {
                        return existing.into_result(true);
                    }
                }
            }
        }

        *self.last_attempt.lock() = Some(Instant::now());
        match self.provider.fetch_weather(city, lat, lon) {
            Ok(fresh) => save_cached(
                storage,
                Self::CACHE_KEY,
                fresh,
                Self::TTL_SECONDS,
                self.provider.name(),
            ),
            Err(_) => {
                if let Some(cached) = load_cached::<WeatherPayload>(storage, Self::CACHE_KEY) {
                    cached.into_result(true)
                } else {
                    CachedResult {
                        data: offline_seed_weather(city, lat, lon),
                        fetched_at: chrono::Utc::now().timestamp() - 1620,
                        age_seconds: 1620,
                        is_stale: true,
                        provider: "Offline Cache".to_string(),
                    }
                }
            }
        }
    }

    pub fn search_cities(&self, query: &str) -> Vec<CitySearchItem> {
        if let Ok(items) = self.provider.search_city(query) {
            if !items.is_empty() {
                return items;
            }
        }
        builtin_cities_fallback(query)
    }
}

fn offline_seed_weather(city: &str, lat: f64, lon: f64) -> WeatherPayload {
    WeatherPayload {
        city: city.to_string(),
        latitude: lat,
        longitude: lon,
        temperature_c: 21.0,
        feels_like_c: 20.0,
        humidity: 34,
        wind_kph: 11.5,
        weather_code: 1,
        is_day: true,
        temp_min_c: 14.0,
        temp_max_c: 24.0,
        forecast: vec![
            ForecastDay {
                date: "2026-10-21".to_string(),
                weather_code: 0,
                temp_min: 14.0,
                temp_max: 24.0,
            },
            ForecastDay {
                date: "2026-10-22".to_string(),
                weather_code: 2,
                temp_min: 13.0,
                temp_max: 22.0,
            },
            ForecastDay {
                date: "2026-10-23".to_string(),
                weather_code: 61,
                temp_min: 11.0,
                temp_max: 19.0,
            },
            ForecastDay {
                date: "2026-10-24".to_string(),
                weather_code: 1,
                temp_min: 12.0,
                temp_max: 21.0,
            },
        ],
    }
}

fn builtin_cities_fallback(query: &str) -> Vec<CitySearchItem> {
    let q = query.trim().to_lowercase();
    let presets = vec![
        CitySearchItem {
            name: "Tehran / تهران".to_string(),
            country: "Iran".to_string(),
            admin1: Some("Tehran".to_string()),
            latitude: 35.6892,
            longitude: 51.3890,
        },
        CitySearchItem {
            name: "Isfahan / اصفهان".to_string(),
            country: "Iran".to_string(),
            admin1: Some("Isfahan".to_string()),
            latitude: 32.6546,
            longitude: 51.6680,
        },
        CitySearchItem {
            name: "Shiraz / شیراز".to_string(),
            country: "Iran".to_string(),
            admin1: Some("Fars".to_string()),
            latitude: 29.5918,
            longitude: 52.5837,
        },
        CitySearchItem {
            name: "Mashhad / مشهد".to_string(),
            country: "Iran".to_string(),
            admin1: Some("Razavi Khorasan".to_string()),
            latitude: 36.2605,
            longitude: 59.6168,
        },
        CitySearchItem {
            name: "Tabriz / تبریز".to_string(),
            country: "Iran".to_string(),
            admin1: Some("East Azerbaijan".to_string()),
            latitude: 38.0962,
            longitude: 46.2738,
        },
        CitySearchItem {
            name: "Amsterdam".to_string(),
            country: "Netherlands".to_string(),
            admin1: Some("North Holland".to_string()),
            latitude: 52.3676,
            longitude: 4.9041,
        },
        CitySearchItem {
            name: "London".to_string(),
            country: "United Kingdom".to_string(),
            admin1: Some("England".to_string()),
            latitude: 51.5072,
            longitude: -0.1276,
        },
        CitySearchItem {
            name: "New York".to_string(),
            country: "United States".to_string(),
            admin1: Some("New York".to_string()),
            latitude: 40.7128,
            longitude: -74.0060,
        },
    ];
    presets
        .into_iter()
        .filter(|c| {
            q.is_empty()
                || c.name.to_lowercase().contains(&q)
                || c.country.to_lowercase().contains(&q)
        })
        .collect()
}
