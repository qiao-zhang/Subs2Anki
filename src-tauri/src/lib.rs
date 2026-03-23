mod ffmpeg;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(ffmpeg::FfmpegState::default())
    .invoke_handler(tauri::generate_handler![
      ffmpeg::pick_video_file,
      ffmpeg::pick_subtitle_file,
      ffmpeg::get_ffmpeg_status,
      ffmpeg::set_video_source_path,
      ffmpeg::clear_video_source_path,
      ffmpeg::write_subtitle_file,
      ffmpeg::extract_audio_clip,
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
