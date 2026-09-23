# VISION AI Studio

VISION (previously called gemini-research) is a multimodal workspace I built around the Gemini API. The main idea was to see how well an AI could handle visual tasks like turning hand-drawn sketches into working code, or extracting structured data from messy documents.

## What it can do
- **Sketch to Code:** You can upload a wireframe or a rough sketch, and it will generate the HTML and CSS for it. There is a strict mode for exact copies and a creative mode where the AI takes some design liberties.
- **OCR and Data Extraction:** It reads handwritten or printed text and can parse things like invoices or tables into clean JSON data.
- **Interface:** I built the UI to look like a clean, floating dark-mode IDE using CSS glassmorphism.

## Running the project locally
1. Run npm install to get the dependencies.
2. Create a .env file and add your GEMINI_API_KEY. You can also specify a PORT (defaults to 3000).
3. Start the server with node server.js.
4. Open http://localhost:3000 in your browser.
