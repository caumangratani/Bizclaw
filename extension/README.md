# BizClaw Browser Relay Extension

Rebranded Chrome extension for BizClaw. Built from the OpenClaw Clawdbot extension with BizClaw branding.

## Build

The extension JS/HTML files are copied from the OpenClaw build output and rebranded by `scripts/brand-patch.sh`. Icons should be placed in `extension/icons/` with BizClaw branding.

## Install

1. Build BizClaw: `./scripts/build.sh`
2. Chrome -> `chrome://extensions` -> enable "Developer mode"
3. "Load unpacked" -> select this `extension/` directory
4. Pin the extension. Click the icon on a tab to attach/detach.
