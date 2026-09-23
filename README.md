# VISION AI Studio

**VISION** (formerly gemini-research) is a multimodal AI workspace that leverages the Gemini API to turn sketches into code, perform advanced OCR, and extract structured data from images and documents.

## Features
- **Sketch to Code (Strict & Creative Modes):** Upload a hand-drawn wireframe or UI sketch, and VISION generates a clean, responsive HTML/CSS website. The "Creative" mode acts as an autonomous UI/UX designer.
- **Context-Aware OCR:** Extracts handwritten and printed text accurately, preserving document structure and correcting obvious handwriting errors.
- **Data Extraction:** Parses complex grid-like information (invoices, receipts, tables) into clean JSON structures.
- **Dark IDE Aesthetic:** A floating window, premium dark-mode interface built with CSS glassmorphism.

## Tech Stack
- **AI Core:** Google Gemini API (Multimodal Inference)
- **Backend:** Node.js, Express, Multer (for file handling)
- **Frontend:** Vanilla JavaScript, HTML5, Modern CSS Variables

## Running Locally

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   PORT=3000
   ```

3. **Start the Server:**
   ```bash
   node server.js
   ```
   Then, open `http://localhost:3000` in your browser.
