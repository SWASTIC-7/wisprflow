// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            // Get the main window and configure WebKitGTK permissions on Linux
            #[cfg(target_os = "linux")]
            {
                let window = app.get_webview_window("main").unwrap();
                window.with_webview(|webview| {
                    use webkit2gtk::{PermissionRequest, WebViewExt};
                    
                    // Get the WebView and connect to permission-request signal
                    let wv = webview.inner();
                    wv.connect_permission_request(|_webview, request| {
                        // Auto-grant media (microphone/camera) permissions

                        use webkit2gtk::glib::ObjectExt;
                        if request.is::<webkit2gtk::UserMediaPermissionRequest>() {
                            use webkit2gtk::PermissionRequestExt;

                            request.allow();
                            return true;
                        }
                        false
                    });
                }).ok();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
