# Privacy & Data

**Boomi Xcel does not collect, transmit, or store any data from your Boomi platform environment.** Period.

- The extension runs entirely in your browser. No data ever leaves your machine.
- No analytics, no telemetry, no tracking, no external servers.
- No third-party services are contacted at runtime (the only external requests made are those already present on your Boomi platform page).
- The only data stored is your feature-toggle preferences, saved locally via `chrome.storage.sync` so they follow you across browsers you're signed into.
- Permission `storage` is required to save your preferences.
- Permission `downloads` is used solely for the auto-rename documents feature — it intercepts download filenames to include process names and timestamps.
- Host permission for `https://platform.boomi.com/*` is required to inject UI enhancements onto Boomi platform pages.

You can verify all of this yourself — the source is 100% open and right here in this repository.
