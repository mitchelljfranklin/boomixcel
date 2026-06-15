# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Boomi Xcel, please **do not** open a public issue. Instead, report it privately:

1. **Email** the details to the repository owner
2. Include:
   - A description of the vulnerability
   - Steps to reproduce
   - The affected version(s)
   - Any potential impact

We will acknowledge your report within 48 hours and provide a timeline for resolution within 5 business days.

## Scope

The extension runs as a browser extension on Boomi platform pages (`https://platform.boomi.com/*`). Security concerns include:

- Data leakage (the extension must never exfiltrate data)
- Permission escalation
- DOM injection vulnerabilities (XSS via injected buttons/HTML)
- Supply chain risks (dependency integrity)

## What We Do Not Consider Vulnerabilities

- The extension's required permissions (`storage`, `downloads`, host permissions) — these are declared in the manifest and necessary for functionality
- The absence of a feature — feature requests should be filed as issues, not security reports
- Browser-level behaviors outside our control

## Disclosure

After a fix is released, we will credit the reporter (with permission) in the release notes and on this page. We follow a coordinated disclosure process — you'll have visibility into our progress throughout.

## Supported Versions

| Version | Supported |
|---|---|
| 1.x (latest) | Yes |
| < 1.0 | No |
