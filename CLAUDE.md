# Fence — Browser Extension for Custom Site Styles & Scripts

## What this is
A Chrome/Safari MV3 browser extension that injects custom CSS and JS into websites based on URL pattern matching. All configuration and per-site code is edited directly via Claude Code — there is no popup or settings UI.

## Project structure
- `manifest.json` — Extension manifest (MV3)
- `background.js` — Service worker: loads config, injects CSS/JS into matching tabs, handles live reload
- `config.json` — Maps URL patterns to CSS/JS files. Edit this to add/remove site rules
- `sites/<site-name>/` — Per-site directories containing `style.css` and/or `script.js`
- `dev.mjs` — Zero-dependency dev server for live reload (`node dev.mjs`)

## How to add a new site
1. Create a directory under `sites/` (e.g., `sites/youtube/`)
2. Add `style.css` and/or `script.js` in that directory
3. Add a rule to `config.json` with the URL match pattern pointing to those files
4. Add a brief description of the site and what its scripts do to `README.md` under the Sites section

## URL match patterns
Patterns in `config.json` use a simple glob syntax: `*://example.com/*`
- `*` matches any sequence of characters
- Protocol, host, and path are all part of the pattern

## Development
Run `node dev.mjs` to start the live reload server. The extension's background script connects to `ws://localhost:18923` and auto-reloads when any file changes.

## No build step
The extension files are used directly — no bundling or compilation. Edit files and they take effect on reload.
