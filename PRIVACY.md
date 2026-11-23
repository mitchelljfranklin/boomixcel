# Privacy & Data

**Boomi Xcel does not collect, transmit, or store any data from your Boomi platform environment for its own purposes.** There are no analytics, no telemetry, no tracking, and no third-party servers.

- The extension runs entirely in your browser. Your settings and any Boomi data it reads stay on your machine.
- The only external requests made by the extension are:
  - a call to `status.boomi.com` to display the Boomi platform operational status (no data is sent); and
  - when you configure a Boomi API token, calls to `https://api.boomi.com` for the features you use (Runtime Status Panel, Component References, Run Process From Deployment, and JSON Profile Export). These requests go only to Boomi's API, using the credentials you provide.
- Your feature-toggle preferences and optional Boomi API email/token are stored locally via `chrome.storage.sync` so they follow you across browsers you're signed into. The token is sent only to `api.boomi.com` — never to any other server.
- Permission `storage` is required to save your preferences.
- Permission `downloads` is used solely for the auto-rename documents feature — it intercepts download filenames to include process names and timestamps.
- Host permissions for `https://platform.boomi.com/*` and `https://api.boomi.com/*` are required to inject UI enhancements onto Boomi pages and to support the optional API-powered features.

You can verify all of this yourself — the source is 100% open and right here in this repository.
