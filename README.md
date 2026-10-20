# WEJET

> **Your desktop. Your space.**  
> **میزکار شما. فضای شخصی شما.**

**[مستندات کامل فارسی (`README.fa.md`)](./README.fa.md)** · **[Architecture & Developer Guide (`DEVELOPMENT.md`)](./DEVELOPMENT.md)** · **[MIT License](./LICENSE)**

**WEJET** is a fast, native, translucent glass personal desktop environment for **Windows 11 & Windows 10**, built with **Rust**, **Tauri 2**, **React 19**, **TypeScript**, and the system **WebView2** runtime.

Unlike Electron-based widget tools or multi-window web wrappers, Wejet renders **all desktop widgets inside a single transparent Desktop Layer WebView** anchored behind normal application windows via Win32 `WorkerW` integration—delivering a ~**2.2 MB** installer, ~**5.2 MB** installed binary payload, near-**0% idle CPU**, and zero cloud or account dependencies.

---

## Visual Preview & Architecture Highlights

| View | Role |
| :--- | :--- |
| **Desktop Layer (`?window=desktop`)** | Fullscreen borderless transparent layer attached via `WorkerW` (with automatic `HWND_BOTTOM` fallback). Hosts free-form 8px grid-snapped glass widgets floating directly over your real Windows wallpaper. |
| **Control Center (`?window=manager`)** | Lazy-split Windows 11 glass control center with interactive Live Desktop Preview, Widget Gallery, Spaces switcher, Glass Theme Studio, Mini Tools, Clipboard History, Safe Windows Mods, `.wejet` Setup Export/Import, and Versioned Backups. |
| **Command Center (`Ctrl + Space`)** | Instant keyboard-first glass palette supporting app/link launching, inline math (`145 * 1.09`), quick timers (`25 min`), inline notes (`note Buy keyboard`), space switching, and theme switching. |
| **Quick Note (`Ctrl + Alt + N`)** | Instant floating glass scratchpad saving straight into local atomic JSON storage. |

---

## Core Features

1. **4-Tier Optical Glass & Compositor System**
   - Native Windows DWM attributes (`DWMWA_SYSTEMBACKDROP_TYPE`, `DWMWA_USE_IMMERSIVE_DARK_MODE`, `DWMWA_WINDOW_CORNER_PREFERENCE`) + `window-vibrancy` Acrylic tint, degrading gracefully to WebView2 CSS `backdrop-filter`, translucent surfaces, or high-contrast solid surfaces without crashing on older GPUs.
   - Independent per-widget surface opacity (**20%–100%**) preserving crisp, readable foreground typography even at sheer translucency.
2. **8 Built-in Glass Themes + Wallpaper Accent Extraction**
   - `Dark Glass`, `Light Glass`, `Midnight`, `Frost`, `Minimal`, `Aurora`, `Warm`, and `System` (live OS light/dark tracking), plus automatic vibrant accent extraction from the user's Windows wallpaper (`HKCU\Control Panel\Desktop\WallPaper`) cached by file modification timestamp.
3. **Bilingual Persian (RTL) & English (LTR) First-Class UX**
   - Persian (`فارسی`) enabled by default with proper `dir="rtl"`, optional Persian digits (`۰۱۲۳۴۵۶۷۸۹`), tabular numerals (`tabular-nums`), isolated `ltr` code/URL/time spans, and one-click live switching to English.
4. **8 Native-Backed Widgets via Central `WidgetRegistry`**
   - **Clock & Dual Date** — `Minimal Glass`, `Classic Analog Glass` (SVG dial), and `Large Editorial` styles; 12h/24h; simultaneous Jalali + Gregorian dates; isolated 1s timer.
   - **Jalali Calendar** — Full Solar Hijri monthly grid, Gregorian month range subtitle, bundled occasions/holidays JSON, month navigation, and per-day custom events.
   - **Weather** — Backed by Rust `WeatherService` (`OpenMeteoProvider`), city search, °C/°F unit toggle, 4-day forecast, 30-minute disk cache, and graceful offline stale timestamps (*"Last updated X min ago"*).
   - **System Monitor** — Backed by Rust `sysinfo` polling CPU, RAM, Disk, Network RX/TX, and optional CPU sensor temperature once per second with a zero-dependency **60-second pure SVG `<SparklineChart />`**.
   - **Market Prices** — Backed by Rust `PriceService` displaying **USD**, **EUR**, **18K Gold**, **Iranian Emami Coin**, **BTC**, and **ETH** with retry, timeout, rate limiting, and disk cache.
   - **Notes + Todo Checklist** — Multiple notes, pinning, checklist checkboxes, and atomic temp-file-rename persistence in `notes.json`.
   - **Quick Launcher** — Launch apps, folders, files, and URLs via `ShellExecuteW` with strict path/scheme security validation, native file browse dialog, Start Menu discovery, and Explorer drag & drop.
   - **Windows Media Controller** — Native WinRT `GlobalSystemMediaTransportControlsSessionManager` (`windows::Media::Control`) displaying live track title, artist, album art stream, and `Previous` / `Play-Pause` / `Next` controls.
5. **Spaces, Smart Fullscreen Auto-Hide, Tray & Safe Windows Mods**
   - Instant profile switching (`Personal & Productivity`, `Work`, `Gaming`, `Study`, `Minimal`, `Development`, plus custom user spaces) via UI, Tray menu, or `Ctrl + Alt + 1..3`.
   - Lightweight 1500ms `GetForegroundWindow` fullscreen/game detector automatically hiding desktop widgets during fullscreen apps or games.
   - Optional safe `HKCU` Desktop Icon Visibility toggle that backs up prior registry values to `mods-backup.json` before applying changes and provides **Revert All**.

---

## Measured Build & Performance Metrics

Measured from actual release compilation (`lto = true`, `opt-level = "z"`, `strip = true`, `codegen-units = 1`, `panic = "abort"`, `webviewInstallMode: "downloadBootstrapper"`):

| Metric | Target | Measured Output |
| :--- | :--- | :--- |
| **NSIS Windows Setup Installer (`Wejet_1.0.0_x64-setup.exe`)** | `< 15 MB` | **2.20 MiB (`2.31 MB`)** |
| **Installed Native Binary (`wejet.exe`)** | `< 40 MB` | **5.20 MB** |
| **Desktop Layer CSS Bundle (gzipped)** | Minimal | **1.94 kB** |
| **Manager Window Chunk (`manager-*.js`)** | Lazy Split | **22.06 kB gzipped** *(0 kB loaded on Desktop Layer until Manager opens)* |
| **Idle CPU (Locked Desktop Layer)** | `< 1%` | **~0.0% – 0.3%** *(1s tick isolated to Clock/System when visible)* |
| **Expected Working Set RAM (Single WebView2)** | `80–150 MB` | **~85 – 125 MB** *(Rust process ~14 MB + single shared WebView2 renderer)* |

---

## Requirements

- **Operating System**: Windows 10 (1809+) or Windows 11 (x64) with system Microsoft Edge WebView2 Runtime (automatically installed via bootstrapper if missing).
- **Development Toolchain**:
  - [Node.js](https://nodejs.org/) **v20 LTS** or newer (`npm >= 10`)
  - [Rust](https://rustup.rs/) **stable** (`>= 1.77.2`)
  - On Windows: **Microsoft Visual Studio C++ Build Tools** ("Desktop development with C++" workload) + Windows 10/11 SDK.

---

## Quick Start & Build Instructions

### 1. Install Dependencies
```bash
git clone https://github.com/wejet-desktop/wejet.git
cd wejet
npm install
```

### 2. Run in Development Mode
```bash
# Native Tauri desktop development (opens both Desktop Layer & Manager windows):
npm run tauri:dev

# Frontend browser preview server only (port 1420):
npm run dev
```

### 3. Run Automated Tests & Static Analysis
```bash
# TypeScript strict check + ESLint + Vitest suite
npm run typecheck
npm run lint
npm test

# Rust formatting, Clippy strict lints, and unit tests
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
```

### 4. Build Production Windows Installers (MSI + NSIS EXE)
```bash
npm run tauri:build
```
Generated installers are written to:
- `src-tauri/target/release/bundle/msi/Wejet_1.0.0_x64_en-US.msi`
- `src-tauri/target/release/bundle/nsis/Wejet_1.0.0_x64-setup.exe`
- `src-tauri/target/release/wejet.exe`

---

## GitHub Actions CI & Automated Releases

### Continuous Build Artifact (`build-windows.yml`)
Every push to `main` or pull request runs on `windows-latest`, executes TypeScript, ESLint, Vitest, `rustfmt`, `clippy`, and `cargo test`, builds both `.msi` and `.exe` installers, validates sizes and process startup telemetry, and publishes **`Wejet-Windows-x64-Installers`** directly under **GitHub → Actions → Artifacts**.

### Creating a Versioned GitHub Release (`release.yml`)
Push any semantic version tag matching `v*.*.*`:
```bash
git tag v1.0.0
git push origin v1.0.0
```
GitHub Actions automatically builds the production `.msi`, `-setup.exe`, portable `.exe`, and `SHA256SUMS.txt` and attaches them to a new GitHub Release.

---

## Local Data Storage Layout (`%APPDATA%\com.wejet.desktop\`)

Wejet uses zero databases and zero cloud servers. All data is persisted atomically in human-readable JSON:
- `settings.json` — Language, theme, accent, hotkeys, smart-hide, startup preferences
- `layout.json` — Active monitor-aware widget coordinates, dimensions, opacity, and widget settings
- `profiles.json` — Saved desktop Spaces (`Work`, `Gaming`, `Study`, `Minimal`, `Productivity`, `Development`, custom)
- `notes.json` — Pinned & inbox notes + todo checklists
- `launcher.json` — Validated application, folder, file, and URL shortcuts
- `clipboard.json` — Bounded local clipboard history (capped at 15 entries)
- `mods-backup.json` — Pre-modification registry backups for instant one-click restore
- `cache/weather.json`, `cache/prices.json`, `cache/wallpaper.json` — Offline-first network & wallpaper caches

---

## Project Structure

```text
wejet/
├── .github/workflows/
│   ├── build-windows.yml      # Windows CI: lint + test + MSI/EXE build + telemetry check
│   └── release.yml            # Tag-triggered GitHub Release publisher + SHA-256 checksums
├── public/
│   └── logo.svg               # Minimal geometric WEJET vector mark
├── scripts/
│   └── generate-icons.py      # Reproducible high-DPI PNG/ICO/ICNS icon generator
├── src/
│   ├── __tests__/             # Vitest unit tests (registry, Jalali math, themes, .wejet IO)
│   ├── command-center/        # Ctrl+Space keyboard-first glass Command Center
│   ├── components/            # DesktopCanvas, DesktopLayerWindow, QuickNote, Onboarding, SVG Icons
│   ├── context/               # Cross-window synchronized state store
│   ├── data/                  # Compact bundled Jalali calendar occasions & holidays JSON
│   ├── i18n/                  # Full Persian (RTL) & English (LTR) localization dictionary
│   ├── manager/               # Lazy-loaded Windows 11 Control Center & Live Desktop Preview
│   ├── services/              # Typed Tauri IPC bridge + offline browser preview fallback
│   ├── styles/                # Centralized CSS design tokens & 4-tier optical glass rules
│   ├── themes/                # 8 glass material theme presets + OS scheme synchronization
│   ├── tools/                 # Mini Calculator, Pomodoro Timer, Stopwatch, Converter, Color Picker
│   ├── types/                 # Shared TypeScript interfaces & widget manifest schemas
│   ├── utils/                 # Pure Jalali calendar engine, Persian digits, safe math parser
│   └── widgets/               # Clock, Calendar, Weather, System, Prices, Notes, Launcher, Music
├── src-tauri/
│   ├── capabilities/          # Least-privilege Tauri v2 security permissions
│   ├── icons/                 # Multi-size Windows .ico & PNG icons
│   ├── src/
│   │   ├── commands/          # Organized Tauri command handlers
│   │   ├── models/            # Strongly-typed Serde data models & curated defaults
│   │   ├── services/          # Atomic Storage, Cache, Weather, Prices, SMTC Media, Mods, Wallpaper
│   │   ├── windows/           # Win32 WorkerW, DWM Backdrop, Smart-Hide, Click-Through, Manager
│   │   ├── tray.rs            # Native Windows System Tray menu & space/theme switchers
│   │   ├── lib.rs             # App initialization, global hotkeys & plugin wiring
│   │   └── main.rs            # Windows GUI subsystem entry point
│   ├── Cargo.toml             # Size-optimized release profile (LTO, opt-level = "z", strip)
│   └── tauri.conf.json        # Dual-window config + downloadBootstrapper WebView2 setup
├── DEVELOPMENT.md             # Deep-dive architecture & contributor guide
├── LICENSE                    # MIT License
└── README.md
```

---

## Known Limitations & Design Trade-offs

- **Primary Monitor Canvas in v1.0**: Widget coordinates store normalized `anchorXRatio` / `anchorYRatio` plus `monitorId` for multi-monitor readiness, while v1.0 attaches the single Desktop Layer WebView to the primary display to keep idle WebView2 RAM under ~125 MB.
- **Third-Party Desktop Wallpaper Replacers**: Tools that also hook `WorkerW` (such as Wallpaper Engine) share the desktop Z-order layer; if `WorkerW` parenting is contested on custom setups, Wejet cleanly falls back to a non-activating bottom-most desktop tool window (`HWND_BOTTOM`) rather than crashing or injecting DLLs.
- **CPU Temperature Sensors on Restricted VMs**: Windows requires vendor WMI/driver exposure for die thermal sensors; when unavailable, `SystemWidget` hides the temperature badge cleanly with zero error banners.

---

## Contributing & License

Contributions, custom widgets, and translations are welcome! Please read [DEVELOPMENT.md](./DEVELOPMENT.md) before opening a pull request.

Released under the [MIT License](./LICENSE).
