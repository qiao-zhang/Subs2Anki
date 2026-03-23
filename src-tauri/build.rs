use std::{env, fs, path::PathBuf};

fn main() {
  println!("cargo:rerun-if-changed=tauri.conf.json");
  println!("cargo:rerun-if-changed=bin");

  let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").expect("missing CARGO_MANIFEST_DIR"));
  let config_path = manifest_dir.join("tauri.conf.json");
  let target = env::var("TARGET").expect("missing TARGET");
  let profile = env::var("PROFILE").unwrap_or_else(|_| "debug".to_string());

  let config = fs::read_to_string(&config_path).expect("failed to read tauri.conf.json");
  let mut config_json: serde_json::Value = serde_json::from_str(&config).expect("failed to parse tauri.conf.json");

  let sidecar_name = expected_sidecar_name(&target);
  let sidecar_path = manifest_dir.join("bin").join(&sidecar_name);

  if sidecar_path.is_file() {
    config_json["bundle"]["externalBin"] = serde_json::json!(["bin/ffmpeg"]);
  } else if is_desktop_target(&target) {
    let message = format!(
      "Missing FFmpeg sidecar for target `{target}`. Expected file: {}. Place the binary under `src-tauri/bin/` or run `npm run prepare:ffmpeg-sidecar -- <path-to-ffmpeg-binary> {target}` before `tauri build`.",
      sidecar_path.display()
    );

    if profile == "release" && env::var("SUBS2ANKI_SKIP_SIDECAR_CHECK").ok().as_deref() != Some("1") {
      panic!("{message}");
    }

    println!("cargo:warning={message}");
  }

  env::set_var("TAURI_CONFIG", serde_json::to_string(&config_json).expect("failed to serialize tauri config"));
  tauri_build::build()
}

fn expected_sidecar_name(target: &str) -> String {
  if target.contains("windows") {
    format!("ffmpeg-{target}.exe")
  } else {
    format!("ffmpeg-{target}")
  }
}

fn is_desktop_target(target: &str) -> bool {
  target.contains("windows") || target.contains("darwin") || target.contains("linux")
}
