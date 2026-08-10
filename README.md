# JSON UI Renderer

A lightweight React + Vite frontend app that loads arbitrary JSON data, validates only that it is valid JSON, and renders a visual preview.

## Features

- Upload `.json` files
- Edit JSON manually in the editor
- Render any valid JSON value
- View raw parsed JSON
- Explore objects, arrays, primitives, booleans, numbers, strings, and null
- Analyze JSON structure with a local summary
- Responsive developer-style interface

## Quick start

1. Install Node.js and npm.
2. Open a terminal in the project folder:
   ```bash
   cd /home/thafsirsiyath/JSON
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the local URL shown in the terminal.

## Usage

- Click **Upload JSON** to load a `.json` file. Valid JSON is rendered immediately.
- Edit JSON in the left editor.
- Click **Render** to parse and render your manual edits.
- Use **Raw JSON** to view the parsed JSON output from `JSON.stringify(parsedJson, null, 2)`.
- Click **Analyze with AI** to see a structure summary of the data.

## New behavior

This app no longer requires schema-specific fields like `type`, `components`, or `page`.
It accepts any valid JSON value, including:

- Object
- Array
- String
- Number
- Boolean
- Null

## Example JSON

The project includes `examples/dashboard.json` with sample organization and user data.

## Notes

- Only valid JSON is required for rendering.
- Invalid JSON shows a friendly parsing error.
- The preview is driven by the runtime data shape rather than fixed UI component types.
- There is no backend; the app is frontend-only.
