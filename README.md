# JSON UI Renderer

A React + Vite frontend app for visualizing arbitrary JSON data and exploring structured dashboards.

## Features

- Upload or paste any valid JSON input
- Edit JSON manually in the editor and re-render
- Structural analysis and summary of JSON content
- Heuristic domain detection based on metadata fields or keyword classification
- Explicit template override via `domain` or `template` fields
- Six live domain templates:
  - `ecommerce`
  - `hrms`
  - `security`
  - `compliance`
  - `monitoring`
  - `project_management`
- Generic recursive JSON viewer fallback for unsupported or unexpected inputs
- README generation and download from parsed JSON and classification metadata

## Quick start

1. Install Node.js and npm.
2. Open a terminal in the project folder:
   ```bash
   cd JSON
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the local URL shown in the terminal.

## How it works

The app parses JSON and performs a structural summary of the dataset.
It then decides which renderer to use by checking, in order:

1. The explicit `domain` field
2. The explicit `template` field
3. Keyword-based classification over the JSON shape and content

If the JSON does not map to one of the supported dashboard domains, the app renders the data with a generic recursive JSON viewer.

## Supported domains and templates

- `ecommerce`
- `hrms`
- `security`
- `compliance`
- `monitoring`
- `project_management`

Any other JSON content will use the generic renderer.

## README generation

The app can generate a README-style summary from the parsed JSON and classification metadata, then make it available for download.

## Example JSON

Use `examples/dashboard.json` to test the renderer and domain detection flow.

## Notes

- The app works entirely in the browser; there is no backend.
- Invalid JSON input shows a parsing error instead of crashing.
- Domain template rendering is protected by an error boundary, so unexpected data shapes fall back to the raw JSON viewer.
