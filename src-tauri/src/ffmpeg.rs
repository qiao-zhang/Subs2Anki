use serde::{Deserialize, Serialize};
use std::{
  env, fs,
  path::{Path, PathBuf},
  process::Command,
  sync::Mutex,
  time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager, State};

pub struct FfmpegState {
  video_source_path: Mutex<Option<PathBuf>>,
}

impl Default for FfmpegState {
  fn default() -> Self {
    Self {
      video_source_path: Mutex::new(None),
    }
  }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtractAudioClipRequest {
  start: f64,
  end: f64,
  volume: f64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PickedSubtitleFile {
  path: String,
  file_name: String,
  content: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FfmpegStatus {
  available: bool,
  message: String,
  binary_path: Option<String>,
  target_triple: String,
}

#[tauri::command]
pub fn pick_video_file() -> Result<Option<String>, String> {
  let selected = pick_video_file_impl()?;
  Ok(selected.map(|path| path.display().to_string()))
}

#[tauri::command]
pub fn set_video_source_path(
  app: AppHandle,
  state: State<'_, FfmpegState>,
  path: String,
) -> Result<(), String> {
  let normalized_path = normalize_video_path(path)?;
  allow_asset_path(&app, &normalized_path)?;

  let mut video_source_path = state
    .video_source_path
    .lock()
    .map_err(|_| "failed to acquire ffmpeg source path lock".to_string())?;

  *video_source_path = Some(normalized_path);
  Ok(())
}

#[tauri::command]
pub fn clear_video_source_path(state: State<'_, FfmpegState>) -> Result<(), String> {
  let mut video_source_path = state
    .video_source_path
    .lock()
    .map_err(|_| "failed to acquire ffmpeg source path lock".to_string())?;

  *video_source_path = None;
  Ok(())
}

#[tauri::command]
pub fn get_ffmpeg_status(app: AppHandle) -> FfmpegStatus {
  probe_ffmpeg_status(&app)
}

#[tauri::command]
pub fn extract_audio_clip(
  app: AppHandle,
  state: State<'_, FfmpegState>,
  request: ExtractAudioClipRequest,
) -> Result<Vec<u8>, String> {
  let source_video = {
    let video_source_path = state
      .video_source_path
      .lock()
      .map_err(|_| "failed to acquire ffmpeg source path lock".to_string())?;

    video_source_path
      .as_ref()
      .cloned()
      .ok_or_else(|| "no source video path is available".to_string())?
  };

  if !source_video.is_file() {
    return Err(format!(
      "source video does not exist anymore: {}",
      source_video.display()
    ));
  }

  let duration = clip_duration(request.start, request.end)?;
  let volume = normalized_volume(request.volume);
  let cache_dir = ensure_cache_dir()?;
  let output_path = cache_dir.join(format!("clip-{}.wav", unique_suffix()));
  let ffmpeg_binary = ensure_ffmpeg_available(&app)?;

  let output = Command::new(&ffmpeg_binary)
    .arg("-ss")
    .arg(format!("{:.3}", request.start.max(0.0)))
    .arg("-t")
    .arg(format!("{:.3}", duration))
    .arg("-i")
    .arg(&source_video)
    .arg("-vn")
    .arg("-af")
    .arg(format!("volume={volume}"))
    .arg("-acodec")
    .arg("pcm_s16le")
    .arg("-ar")
    .arg("44100")
    .arg("-y")
    .arg(&output_path)
    .output()
    .map_err(|error| {
      format!(
        "failed to start ffmpeg at {}: {error}",
        ffmpeg_binary.display()
      )
    })?;

  if !output.status.success() {
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let _ = fs::remove_file(&output_path);

    return Err(if stderr.is_empty() {
      format!("ffmpeg exited with status {}", output.status)
    } else {
      format!("ffmpeg failed: {stderr}")
    });
  }

  let audio = fs::read(&output_path)
    .map_err(|error| format!("failed to read extracted audio clip: {error}"))?;
  let _ = fs::remove_file(output_path);

  Ok(audio)
}

#[tauri::command]
pub fn pick_subtitle_file() -> Result<Option<PickedSubtitleFile>, String> {
  let Some(path) = pick_file_with_filters(FilePickerKind::Subtitle)? else {
    return Ok(None);
  };

  Ok(Some(read_subtitle_payload(path)?))
}

#[tauri::command]
pub fn write_subtitle_file(path: String, content: String) -> Result<(), String> {
  let path = PathBuf::from(path);
  if let Some(parent) = path.parent() {
    fs::create_dir_all(parent)
      .map_err(|error| format!("failed to create subtitle parent directory: {error}"))?;
  }

  fs::write(&path, content).map_err(|error| format!("failed to write subtitle file: {error}"))
}

#[derive(Clone, Copy)]
enum FilePickerKind {
  Video,
  Subtitle,
}

fn normalize_video_path(path: String) -> Result<PathBuf, String> {
  let candidate = PathBuf::from(path);
  let normalized = candidate
    .canonicalize()
    .unwrap_or(candidate);

  if !normalized.is_file() {
    return Err(format!(
      "selected video path is not a readable file: {}",
      normalized.display()
    ));
  }

  Ok(normalized)
}

fn allow_asset_path(app: &AppHandle, path: &Path) -> Result<(), String> {
  app
    .asset_protocol_scope()
    .allow_file(path)
    .map_err(|error| format!("failed to authorize local media path: {error}"))?;

  Ok(())
}

fn read_subtitle_payload(path: PathBuf) -> Result<PickedSubtitleFile, String> {
  let file_name = path
    .file_name()
    .and_then(|name| name.to_str())
    .map(|name| name.to_string())
    .unwrap_or_else(|| path.display().to_string());
  let content = fs::read_to_string(&path)
    .map_err(|error| format!("failed to read subtitle file: {error}"))?;

  Ok(PickedSubtitleFile {
    path: path.display().to_string(),
    file_name,
    content,
  })
}

fn probe_ffmpeg_status(app: &AppHandle) -> FfmpegStatus {
  let target_triple = option_env!("TAURI_ENV_TARGET_TRIPLE")
    .unwrap_or("unknown-target")
    .to_string();

  match resolve_ffmpeg_binary(app) {
    Ok(binary_path) => match run_ffmpeg_version_check(&binary_path) {
      Ok(message) => FfmpegStatus {
        available: true,
        message,
        binary_path: Some(binary_path.display().to_string()),
        target_triple,
      },
      Err(error) => FfmpegStatus {
        available: false,
        message: error,
        binary_path: Some(binary_path.display().to_string()),
        target_triple,
      },
    },
    Err(error) => FfmpegStatus {
      available: false,
      message: error,
      binary_path: None,
      target_triple,
    },
  }
}

fn ensure_ffmpeg_available(app: &AppHandle) -> Result<PathBuf, String> {
  let binary_path = resolve_ffmpeg_binary(app)?;
  run_ffmpeg_version_check(&binary_path)?;
  Ok(binary_path)
}

fn run_ffmpeg_version_check(binary_path: &Path) -> Result<String, String> {
  let output = Command::new(binary_path)
    .arg("-version")
    .output()
    .map_err(|error| {
      format!(
        "FFmpeg is not available. Tried `{}` but failed to launch it: {error}",
        binary_path.display()
      )
    })?;

  if !output.status.success() {
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    return Err(if stderr.is_empty() {
      format!(
        "FFmpeg is not available. `{}` exited with status {} while checking `-version`.",
        binary_path.display(),
        output.status
      )
    } else {
      format!(
        "FFmpeg is not available. `{}` reported: {stderr}",
        binary_path.display()
      )
    });
  }

  let version_line = String::from_utf8_lossy(&output.stdout)
    .lines()
    .next()
    .map(|line| line.trim().to_string())
    .filter(|line| !line.is_empty())
    .unwrap_or_else(|| format!("FFmpeg is available at {}", binary_path.display()));

  Ok(version_line)
}

fn pick_video_file_impl() -> Result<Option<PathBuf>, String> {
  pick_file_with_filters(FilePickerKind::Video)
}

fn pick_file_with_filters(kind: FilePickerKind) -> Result<Option<PathBuf>, String> {
  #[cfg(target_os = "windows")]
  {
    let filter = match kind {
      FilePickerKind::Video => "Video Files|*.mp4;*.mkv;*.mov;*.avi;*.webm;*.m4v;*.flv|All Files|*.*",
      FilePickerKind::Subtitle => "Subtitle Files|*.srt;*.vtt|All Files|*.*",
    };
    let title = match kind {
      FilePickerKind::Video => "Choose a video file",
      FilePickerKind::Subtitle => "Choose a subtitle file",
    };
    let script = format!(r#"
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Filter = '{filter}'
$dialog.Title = '{title}'
$dialog.Multiselect = $false
if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {{
  [Console]::WriteLine($dialog.FileName)
}}
"#);

    return run_picker_command("powershell.exe", &["-NoProfile", "-STA", "-Command", &script]);
  }

  #[cfg(target_os = "macos")]
  {
    let prompt = match kind {
      FilePickerKind::Video => "Choose a video file",
      FilePickerKind::Subtitle => "Choose a subtitle file",
    };
    return run_picker_command(
      "osascript",
      &[
        "-e",
        &format!(r#"set pickedFile to choose file with prompt \"{prompt}\""#),
        "-e",
        r#"POSIX path of pickedFile"#,
      ],
    );
  }

  #[cfg(target_os = "linux")]
  {
    let (title, filter) = match kind {
      FilePickerKind::Video => ("Choose a video file", "Video files | *.mp4 *.mkv *.mov *.avi *.webm *.m4v *.flv"),
      FilePickerKind::Subtitle => ("Choose a subtitle file", "Subtitle files | *.srt *.vtt"),
    };

    if let Ok(selection) = run_picker_command(
      "zenity",
      &[
        "--file-selection",
        &format!("--title={title}"),
        &format!("--file-filter={filter}"),
        "--file-filter=All files | *",
      ],
    ) {
      return Ok(selection);
    }

    if let Ok(selection) = run_picker_command(
      "kdialog",
      &["--getopenfilename", ".", filter],
    ) {
      return Ok(selection);
    }

    return Err("no supported native file picker was found on this Linux system".to_string());
  }

  #[allow(unreachable_code)]
  Err("file picking is not supported on this platform".to_string())
}

fn run_picker_command(program: &str, args: &[&str]) -> Result<Option<PathBuf>, String> {
  let output = Command::new(program)
    .args(args)
    .output()
    .map_err(|error| format!("failed to launch native picker with {program}: {error}"))?;

  if output.status.success() {
    let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if path.is_empty() {
      return Ok(None);
    }

    return Ok(Some(PathBuf::from(path)));
  }

  let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
  let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
  if stderr.is_empty() && stdout.is_empty() {
    return Ok(None);
  }

  if stderr.contains("-128") || stderr.contains("User canceled") {
    return Ok(None);
  }

  Err(if !stderr.is_empty() {
    format!("native picker failed: {stderr}")
  } else {
    format!("native picker failed: {stdout}")
  })
}

fn ensure_cache_dir() -> Result<PathBuf, String> {
  let mut cache_dir = env::temp_dir();
  cache_dir.push("subs2anki");
  cache_dir.push("ffmpeg-cache");

  fs::create_dir_all(&cache_dir)
    .map_err(|error| format!("failed to create ffmpeg cache directory: {error}"))?;

  Ok(cache_dir)
}

fn clip_duration(start: f64, end: f64) -> Result<f64, String> {
  if !start.is_finite() || !end.is_finite() {
    return Err("clip times must be finite numbers".to_string());
  }

  if end <= start {
    return Err("clip end time must be greater than start time".to_string());
  }

  Ok((end - start).max(0.1))
}

fn normalized_volume(volume: f64) -> f64 {
  if !volume.is_finite() {
    return 1.5;
  }

  volume.max(0.0)
}

fn resolve_ffmpeg_binary(app: &AppHandle) -> Result<PathBuf, String> {
  if let Ok(path) = env::var("SUBS2ANKI_FFMPEG_PATH") {
    let candidate = PathBuf::from(path);
    if candidate.is_file() {
      return Ok(candidate);
    }

    return Err(format!(
      "SUBS2ANKI_FFMPEG_PATH does not point to a valid file: {}",
      candidate.display()
    ));
  }

  let target_triple = option_env!("TAURI_ENV_TARGET_TRIPLE").unwrap_or("unknown-target");
  let binary_names = ffmpeg_binary_names(target_triple);
  let mut candidates: Vec<PathBuf> = Vec::new();

  // Prefer runtime deployment locations first (packaged app resources / exe dir),
  // then fall back to development-time source locations.
  if let Ok(resource_dir) = app.path().resource_dir() {
    for binary_name in &binary_names {
      candidates.push(resource_dir.join(binary_name));
      candidates.push(resource_dir.join("bin").join(binary_name));
    }
  }

  if let Ok(current_exe) = env::current_exe() {
    if let Some(exe_dir) = current_exe.parent() {
      for binary_name in &binary_names {
        candidates.push(exe_dir.join(binary_name));
      }
    }
  }

  let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
  for binary_name in &binary_names {
    candidates.push(manifest_dir.join("bin").join(binary_name));
  }

  if let Some(existing_binary) = candidates.into_iter().find(|candidate| candidate.is_file()) {
    return Ok(existing_binary);
  }

  Ok(PathBuf::from(if cfg!(target_os = "windows") {
    "ffmpeg.exe"
  } else {
    "ffmpeg"
  }))
}

fn ffmpeg_binary_names(target_triple: &str) -> Vec<String> {
  if cfg!(target_os = "windows") {
    return vec![
      format!("ffmpeg-{target_triple}.exe"),
      "ffmpeg.exe".to_string(),
    ];
  }

  vec![format!("ffmpeg-{target_triple}"), "ffmpeg".to_string()]
}

fn unique_suffix() -> u128 {
  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .map(|duration| duration.as_nanos())
    .unwrap_or(0)
}

#[cfg(test)]
mod tests {
  use std::path::Path;
  use super::{clip_duration, ffmpeg_binary_names, normalized_volume, run_ffmpeg_version_check};

  #[test]
  fn clip_duration_rejects_invalid_ranges() {
    assert!(clip_duration(10.0, 10.0).is_err());
    assert!(clip_duration(f64::NAN, 12.0).is_err());
    assert_eq!(clip_duration(10.0, 10.02).unwrap(), 0.1);
  }

  #[test]
  fn normalized_volume_handles_invalid_numbers() {
    assert_eq!(normalized_volume(f64::INFINITY), 1.5);
    assert_eq!(normalized_volume(-2.0), 0.0);
    assert_eq!(normalized_volume(1.2), 1.2);
  }

  #[test]
  fn ffmpeg_binary_names_include_plain_binary_name() {
    let names = ffmpeg_binary_names("x86_64-pc-windows-msvc");
    assert!(names.iter().any(|name| name.starts_with("ffmpeg-")));
    assert!(names.iter().any(|name| name == "ffmpeg.exe" || name == "ffmpeg"));
  }

  #[test]
  fn missing_binary_reports_a_clear_error() {
    let result = run_ffmpeg_version_check(Path::new("definitely-not-a-real-ffmpeg-binary"));
    assert!(result.is_err());
    assert!(result.err().unwrap().contains("FFmpeg is not available"));
  }
}

