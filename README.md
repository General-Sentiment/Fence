# Fence

A boilerplate MV3 browser extension for injecting custom styles and scripts into websites. Zero configuration. You describe what you want to change about a site to Claude Code and it writes the CSS and JS for you.

## Getting started

Chrome is the easiest way to develop. Load the extension unpacked, run the dev server, and changes take effect immediately — no build step. Safari works too but requires converting to an Xcode project first.

### Chrome

1. Go to `chrome://extensions` and enable **Developer mode**
2. Click **Load unpacked** and select this project directory
3. Run `node dev.mjs` for live reload while you work

### Safari

1. Run `xcrun safari-web-extension-converter /path/to/fence --project-location ./fence-safari --app-name Fence`
2. Open the generated Xcode project, build and run
3. In Safari, go to Settings > Extensions and enable Fence
4. You may need to enable **Allow Unsigned Extensions** in the Develop menu

## Sites

### YouTube

Removes Shorts entirely and hides the suggested videos sidebar so the player goes full width. Homepage redirects to subscriptions.
