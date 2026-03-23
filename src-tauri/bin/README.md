# FFmpeg sidecar

Place target-specific FFmpeg binaries in this folder before running `tauri build`.

Expected filenames:

- `ffmpeg-x86_64-pc-windows-msvc.exe`
- `ffmpeg-aarch64-pc-windows-msvc.exe`
- `ffmpeg-x86_64-apple-darwin`
- `ffmpeg-aarch64-apple-darwin`
- `ffmpeg-x86_64-unknown-linux-gnu`
- `ffmpeg-aarch64-unknown-linux-gnu`

You can also prepare one with:

```bash
npm run prepare:ffmpeg-sidecar -- <path-to-ffmpeg-binary> <target-triple>
```

Validation helpers:

```bash
npm run validate:ffmpeg-sidecars
npm run validate:ffmpeg-bundle
```

- `validate:ffmpeg-sidecars` checks that the expected source binaries exist under `src-tauri/bin/`.
- `validate:ffmpeg-bundle` should be run after a native `tauri build`; it scans the bundle output and fails if FFmpeg was not embedded.
- CI uses host-specific placeholder executables only to validate packaging behavior. Release builds should still provide real FFmpeg binaries for each target.
- `src-tauri/build.rs` warns in debug builds and fails desktop release builds with a clear target-specific message when the current sidecar is missing.

When a matching file exists, `src-tauri/build.rs` injects `bundle.externalBin` automatically so `tauri build` bundles the sidecar into the installer/app image.

- The desktop Settings modal can re-run the FFmpeg availability check without restarting the app and now shows step-by-step recovery instructions when detection fails.
