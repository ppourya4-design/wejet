use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use sysinfo::{Components, Disks, Networks, System};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemMetrics {
    pub cpu_percent: f32,
    pub ram_used_gb: f64,
    pub ram_total_gb: f64,
    pub ram_percent: f32,
    pub disk_used_gb: f64,
    pub disk_total_gb: f64,
    pub disk_percent: f32,
    pub net_rx_kbps: f64,
    pub net_tx_kbps: f64,
    pub cpu_temp_c: Option<f32>,
}

pub struct TelemetryCollector {
    sys: System,
    disks: Disks,
    networks: Networks,
    components: Components,
}

impl Default for TelemetryCollector {
    fn default() -> Self {
        let mut sys = System::new();
        sys.refresh_cpu_usage();
        sys.refresh_memory();
        let disks = Disks::new_with_refreshed_list();
        let networks = Networks::new_with_refreshed_list();
        let components = Components::new_with_refreshed_list();
        Self {
            sys,
            disks,
            networks,
            components,
        }
    }
}

impl TelemetryCollector {
    pub fn sample(&mut self) -> SystemMetrics {
        self.sys.refresh_cpu_usage();
        self.sys.refresh_memory();
        self.networks.refresh();
        self.disks.refresh();
        self.components.refresh();

        let cpu_percent = self.sys.global_cpu_usage().clamp(0.0, 100.0);

        let ram_total = self.sys.total_memory() as f64;
        let ram_used = self.sys.used_memory() as f64;
        let gb = 1_073_741_824.0_f64;
        let ram_percent = if ram_total > 0.0 {
            ((ram_used / ram_total) * 100.0) as f32
        } else {
            0.0
        };

        let mut disk_total_bytes: u64 = 0;
        let mut disk_avail_bytes: u64 = 0;
        if let Some(first_disk) = self.disks.list().first() {
            disk_total_bytes = first_disk.total_space();
            disk_avail_bytes = first_disk.available_space();
        }
        let disk_used_bytes = disk_total_bytes.saturating_sub(disk_avail_bytes);
        let disk_percent = if disk_total_bytes > 0 {
            ((disk_used_bytes as f64 / disk_total_bytes as f64) * 100.0) as f32
        } else {
            0.0
        };

        let mut rx_bytes: u64 = 0;
        let mut tx_bytes: u64 = 0;
        for (_name, data) in &self.networks {
            rx_bytes = rx_bytes.saturating_add(data.received());
            tx_bytes = tx_bytes.saturating_add(data.transmitted());
        }

        // Optional temperature — cleanly hidden on platforms where sensors aren't exposed
        let cpu_temp_c = self
            .components
            .list()
            .iter()
            .map(|c| c.temperature())
            .find(|t| t.is_finite() && *t > 5.0 && *t < 125.0);

        SystemMetrics {
            cpu_percent,
            ram_used_gb: ram_used / gb,
            ram_total_gb: ram_total / gb,
            ram_percent,
            disk_used_gb: disk_used_bytes as f64 / gb,
            disk_total_gb: disk_total_bytes as f64 / gb,
            disk_percent,
            net_rx_kbps: rx_bytes as f64 / 1024.0,
            net_tx_kbps: tx_bytes as f64 / 1024.0,
            cpu_temp_c,
        }
    }
}

#[tauri::command]
pub fn get_system_metrics(state: tauri::State<'_, Mutex<TelemetryCollector>>) -> SystemMetrics {
    state.lock().sample()
}
