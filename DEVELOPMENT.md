# WEJET Developer & Architecture Guide (`DEVELOPMENT.md`)

## 1. Architectural Principles

1. **Single Desktop Layer WebView**: Never spawn one `WebviewWindow` per widget. Every desktop widget mounts inside `window=desktop`, keeping WebView2 memory flat whether 2 or 12 widgets are active.
2. **Code-Split Control Center**: `src/App.tsx` loads `ManagerWindow` exclusively via `React.lazy(() => import('./manager/ManagerWindow'))` when `?window=manager` is requested.
3. **Zero Database, Crash-Safe Persistence**: `src-tauri/src/services/storage.rs` serializes writes behind `parking_lot::Mutex<()>`, flushes to a PID-scoped temporary file (`*.tmp.<pid>`), calls `sync_all()`, and atomically renames over the target JSON file in `%APPDATA%\com.wejet.desktop`.
4. **Centralized Network Services**: React widgets never call third-party HTTP APIs directly in native mode. All external requests go through `WeatherService` (`services/weather.rs`) and `PriceService` (`services/prices.rs`) with 4–5s socket timeouts, rate limiting, and disk caching in `cache/`.
5. **Security & Path Hygiene**: `commands/launcher.rs` validates all targets before calling Win32 `ShellExecuteW("open", ...)`, rejecting shell metacharacters, null bytes, and unsafe schemes (`javascript:`, `vbscript:`, `ms-msdt:`).

---

## 2. Adding a New Widget

1. Create `src/widgets/MyWidget.tsx` exporting both `myWidgetManifest: WidgetManifest` (with `id`, `defaultSize`, `minSize`, and `settingsSchema`) and `MyWidget: React.FC<{ instance: WidgetInstance }>`.
2. Register it in `src/widgets/registry.tsx`:
   ```ts
   WidgetRegistry.register({ manifest: myWidgetManifest, component: MyWidget });
   ```
3. Because both `WidgetSettingsModal` and the Widget Gallery inspect `WidgetRegistry.list()` dynamically, your widget automatically gains:
   - Live gallery preview card & category filter
   - Drag, 8px snap, magnetic edge alignment guides, resize bounds, duplicate, lock, hide, and 20%–100% glass opacity
   - Auto-generated settings drawer controls (`boolean`, `select`, `text`)
   - `.wejet` export/import and profile persistence

---

## 3. Windows Integration Modules (`src-tauri/src/windows/`)

- `workerw.rs`: Sends `0x052C` to `Progman`, supports both classic top-level `WorkerW` enumeration and Windows 11 24H2 layered `Progman` child `WorkerW`, and gracefully degrades to `SetWindowPos(..., HWND_BOTTOM, ...)` + `WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE`.
- `backdrop.rs`: Configures `DWMWA_USE_IMMERSIVE_DARK_MODE`, `DWMWA_WINDOW_CORNER_PREFERENCE`, and `DWMWA_SYSTEMBACKDROP_TYPE` via `windows::Win32::Graphics::Dwm::DwmSetWindowAttribute`, with `window-vibrancy` Acrylic fallback.
- `smart_hide.rs`: Polls `GetForegroundWindow()` every 1500ms (~0.00% CPU), ignoring desktop shell windows (`Progman`, `WorkerW`, `Shell_TrayWnd`) and Wejet's own HWNDs, automatically hiding the Desktop Layer when a fullscreen app or game occupies the monitor bounds.

---

## 4. Cross-Checking Windows Code from Linux/macOS

Developers working on Linux or macOS can type-check, lint, and cross-build the full Win32/WinRT Rust target using [`cargo-xwin`](https://github.com/rust-cross/cargo-xwin):

```bash
rustup target add x86_64-pc-windows-msvc
cargo xwin clippy --manifest-path src-tauri/Cargo.toml --target x86_64-pc-windows-msvc -- -D warnings
npx tauri build --runner cargo-xwin --target x86_64-pc-windows-msvc --bundles nsis
```

On native Windows machines or GitHub Actions (`windows-latest`), build both MSI (WiX) and NSIS installers directly:

```bash
npx tauri build --bundles msi,nsis
```
