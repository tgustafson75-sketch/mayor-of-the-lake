// Desktop shell. The game is the web app in dist/; the AI talk runs on the public
// API (see VITE_API_BASE in the build), so no key lives in the desktop app.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running Mayor of the Lake");
}
