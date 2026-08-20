# Wavecraft

A browser-only M4A and MP3 to WAV converter powered by FFmpeg.wasm. Files are processed locally in the browser and are never uploaded.

## Run

Serve this folder from a local HTTP server so the FFmpeg worker can load correctly. For example:

```powershell
npx serve .
```

Then open the local URL shown by the server. An internet connection is required the first time the FFmpeg browser bundle and core are loaded from the CDN.

## Pages

- `index.html` - WAV duration calculator and CSV export.
- `converter.html` - M4A/MP3 to WAV converter with individual and ZIP downloads.

## Notes

- Accepts multiple `.m4a` and `.mp3` files up to 500 MB each.
- Files can be selected individually, dragged in as a group, or loaded from a parent folder.
- Converts the queue sequentially and provides one WAV download per source file.
- Provides a `Download all` action that packages successful conversions into a ZIP named with the export date and time, such as `wav-converted-2026-08-21_14-30-05.zip`.
- Produces PCM signed 16-bit WAV output.
- Conversion requires a modern browser with WebAssembly support.
