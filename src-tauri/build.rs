use std::{env, fs, path::PathBuf};

fn main() {
  println!("cargo:rerun-if-changed=tauri.conf.json");
  println!("cargo:rerun-if-changed=bin");

  let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").expect("missing CARGO_MANIFEST_DIR"));
  let config_path = manifest_dir.join("tauri.conf.json");
  let target = env::var("TARGET").expect("missing TARGET");

  let config = fs::read_to_string(&config_path).expect("failed to read tauri.conf.json");
  let mut config_json: serde_json::Value = serde_json::from_str(&config).expect("failed to parse tauri.conf.json");

  let sidecar_name = if target.contains("windows") {
    format!("ffmpeg-{target}.exe")
  } else {
    format!("ffmpeg-{target}")
  };

  let sidecar_path = manifest_dir.join("bin").join(&sidecar_name);
  if sidecar_path.is_file() {
    config_json["bundle"]["externalBin"] = serde_json::json!(["bin/ffmpeg"]);
  }

  env::set_var("TAURI_CONFIG", serde_json::to_string(&config_json).expect("failed to serialize tauri config"));
  tauri_build::build()
}
