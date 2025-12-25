# Fullsize Option for YouTube Embeds

A WordPress plugin that adds a "Fullsize Mode" toggle to YouTube embed blocks, allowing them to dynamically resize to match their container width, just like they appear in the Gutenberg editor.

## Features

- Adds a toggle control in the block sidebar for YouTube embed blocks
- Only applies to `wp-block-embed-youtube` blocks
- Opt-in feature - must be enabled per embed block
- Dynamically requests appropriate oEmbed sizes based on container width
- Handles window resize events
- Maintains WordPress responsive embed classes and aspect ratios

## Installation

1. Upload the plugin folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Build the editor assets: `npm install && npm run build`

## Usage

1. Add a YouTube embed block to your post/page
2. In the block sidebar, you'll see a "YouTube Settings" panel
3. Toggle "Fullsize Mode" to enable the feature
4. The embed will now dynamically resize to match its container width on the frontend

## Development

### Building

```bash
npm install
npm run build
```

### Development Mode

```bash
npm run start
```

## Requirements

- WordPress 5.0+
- Gutenberg block editor
- Modern browser with JavaScript enabled

