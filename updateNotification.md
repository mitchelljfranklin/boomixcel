Welcome to BoomiXcel — same extension you love, now with a fresh name and a massive overhaul under the hood. [See all changes](https://github.com/mitchelljfranklin/BoomiXcel/blob/1.8.0.0/REFACTOR.md)

- Dashboard 7-day auto-select never fired — replaced guard condition with direct check for time range selectors and moved polling to centralized listener
- Elapsed time counter red text not displaying — inline style.color was overridden by Boomi !important CSS, replaced with CSS class at matching cascade tier
- Download renamer corrupted ZIP/binary files — binary content was misidentified as CSV/TXT, added isBinaryContent() helper with null byte and printable-ratio checks
- Reverse modal buttons not working on "No" dialogs — only matched "Cancel" text; now filters visible buttons and matches both "Cancel" and "No"
- Convention audit — fixed 5 implicit globals and 44+ abbreviated variable names across all content scripts
- Document viewer DB table view — "See table" toggle renders sortable, searchable, paginated table from DBSTART| format
- Custom refresh button — live countdown with zero-padded seconds, pulse animation on each refresh, last-refreshed tooltip, persisted state across navigation
- Configurable dashboard default time range via options page dropdown (7d / 1m / 3m / 6m / 1y / Max)
- Revision History checkboxes for Boomi GPT compare prompts — check 2 revisions to auto-build and submit a compare prompt
- View in Process Reporting from deployed process context menus and build page with auto-applied filter
- Copy button in Component XML popup — decodes HTML-encoded XML and writes clean XML to clipboard
- Removed note group feature — no longer needed as Boomi platform now handles note grouping natively
