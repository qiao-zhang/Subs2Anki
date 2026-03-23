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

When a matching file exists, `src-tauri/build.rs` injects `bundle.externalBin` automatically so `tauri build` bundles the sidecar into the installer/app image.

