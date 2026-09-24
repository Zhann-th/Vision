const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mammoth = require('mammoth');
const xlsx = require('xlsx')
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;
app.use(cors())
app.use(express.static('./')); 
const storage = multer.memoryStorage();
var upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } 
});
app.post('/api/extract', upload.array('images', 10), async (req, res) => {
    try {
        if ((!req.files || req.files.length === 0) && !req.body.rawText) {
            return res.status(400).json({ error: 'No files or text provided' });
        }
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Server configuration error: API key missing.' });
        }
        var mode = req.body.mode || 'simple';
        var taskType = req.body.taskType || 'code';
        let prompt = '';
        if (taskType === 'excel') {
            prompt = `You are a precise data extraction specialist.
            Your job: extract ALL structured data from the provided image(s) or document(s) — tables, invoices, receipts, price lists, forms, and any grid-like information.
            Rules:
            - Return ONLY a valid JSON array of objects. Each object = one row. Keys = column headers.
            - Infer sensible column names if none are visible.
            - Merge multi-line cell content into a single string.
            - Numbers should be numbers (not strings). Dates should be ISO strings.
            - If multiple separate tables exist, flatten them with a "__table" key.
            - NO markdown, NO backticks, NO explanations. Raw JSON only.`
        } else if (taskType === 'ocr') {
            prompt = `You are a context-aware text digitization expert, not just a character scanner.
            Your job: extract ALL handwritten or printed text from the image(s) with the following priorities:
            1. ACCURACY over verbatim copying — if a word is clearly misspelled due to messy handwriting, correct it if the intended word is unambiguous.
            2. Preserve paragraph structure, indentation, bullet points, and numbered lists.
            3. If a diagram or table is present alongside text, represent it in plain text (e.g., ASCII table or labeled items).
            4. Output ONLY the cleaned, readable text. No markdown wrappers, no commentary.`
        } else {
            prompt = `You are a world-class senior Frontend Engineer and UI designer being asked to convert a sketch into a real, beautiful website.
STEP 1 — ANALYZE the sketch carefully:
- What is the product/service/purpose of this website?
- Who is the target audience? (young creatives, enterprises, developers, consumers?)
- What is the visual mood? (energetic, calm, luxurious, playful, minimal?)
- What industry is this? (tech, food, fashion, finance, health, education?)
STEP 2 — DESIGN with intention:
Based on your analysis, choose a design direction that FITS this specific product. Do not apply the same template to everything.
- Pick a color palette that suits the brand (not just "dark with purple gradients" every time).
- Use typography that matches the mood — large editorial fonts for luxury, rounded sans-serif for friendly tech, mono for developer tools, etc.
- Choose a layout style appropriate for the content — editorial grid, single-scroll narrative, cards, split-screen, etc.
STEP 3 — BUILD it:
HARD RULES:
1. Output a SINGLE complete HTML document. All CSS must be inside a <style> tag. All JS (if any) inside a <script> tag.
2. Do NOT output markdown wrappers (\`\`\`html). Start directly with <!DOCTYPE html>.
3. Use REAL placeholder photos from: https:
4. Use Google Fonts — pick one that matches the brand personality.
5. Add smooth CSS transitions on hover states (buttons, cards, links).
6. The result must be visually polished: proper spacing, consistent font sizing, clear hierarchy.
7. Interpret any handwritten labels, arrows, or notes as design instructions.\n`;
            if (mode === 'creative') {
                prompt += `\nMODE: CREATIVE — TOTAL DESIGN FREEDOM
Treat the sketch as a rough idea, not a blueprint. Your job is to design a PREMIUM, MEMORABLE website that someone would be genuinely impressed by.
CREATIVE DIRECTIVES:
- Break the grid occasionally. Not everything needs to be aligned — use large asymmetric hero text, overlapping elements, or full-bleed sections.
- Choose ONE strong visual identity and commit to it fully (e.g., "brutalist editorial with uppercase headlines and thick borders", or "clean luxury with lots of whitespace and gold accents", or "vibrant gen-z with big bold gradients and unusual font pairings").
- Add scroll-triggered CSS animations using @keyframes (fade-up on sections, scale on card hover, underline on link hover, etc.)
- Add micro-interactions: smooth button press effect (transform: scale(0.97)), card elevation on hover (box-shadow), link underline animation.
- Write REAL, engaging placeholder copy that matches the product — imagine you're a copywriter. Not "Lorem ipsum" — actual taglines, CTAs, feature descriptions.
- Add these premium sections if they make sense: sticky nav with blur backdrop, hero with layered text + image, features grid, testimonial, CTA banner, footer with links.
- Use CSS custom properties (--color-primary, --font-heading, etc.) for the design system.
- The final result should look like it costs $50,000 to build.`;
            } else {
                prompt += `\nMODE: STRICT — FAITHFUL RECONSTRUCTION
Follow the sketch closely. Your job is to build exactly what was drawn, cleanly and professionally.
- Match the layout structure of the sketch as precisely as possible.
- Do not add sections, UI elements, or content that wasn't in the sketch.
- Still apply proper modern CSS (clean spacing, readable typography, appropriate colors if not specified).
- Add basic hover states on interactive elements (buttons, links) for polish.
- Make it responsive — it should look good on both desktop and mobile.`;
            }
        }
        let docText = '';
        const imageParts = [];
        for (let file of req.files) {
            const isWord = file.mimetype === 'application/msword' || 
                           file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                           file.originalname.endsWith('.doc') || 
                           file.originalname.endsWith('.docx')
            const isPdf = file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf');
            if (isWord) {
                const result = await mammoth.extractRawText({ buffer: file.buffer });
                docText += `\n\n--- Content of ${file.originalname} ---\n${result.value}\n--- End of ${file.originalname} ---\n\n`;
            } else if (isPdf) {
                imageParts.push({
                    inline_data: {
                        mime_type: 'application/pdf',
                        data: file.buffer.toString('base64')
                    }
                });
            } else {
                imageParts.push({
                    inline_data: {
                        mime_type: 'image/jpeg',
                        data: file.buffer.toString('base64')
                    }
                });
            }
        }
        if (docText.length > 0) {
            prompt += `\n\nAdditionally, I have provided the following text extracted from Word documents to assist you:\n${docText}`;
        }
        if (req.body.rawText) {
            prompt += `\n\nHere is some raw text/instructions provided by the user:\n${req.body.rawText}`;
        }
        let requestBody = {
            contents: [{
                parts: [
                    { text: prompt },
                    ...imageParts
                ]
            }]
        }
        let response = await fetch(`https:
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify(requestBody)
        })
        const data = await response.json();
        if (!response.ok) {
            console.error('Google API Error:', data.error);
            throw new Error(data.error?.message || 'Google API returned an error');
        }
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (taskType === 'excel') {
            try {
                let cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
                var jsonData = JSON.parse(cleanedText)
                if (!Array.isArray(jsonData) || jsonData.length === 0) {
                    throw new Error("No structured data could be extracted.");
                }
                const ws = xlsx.utils.json_to_sheet(jsonData);
                const wb = xlsx.utils.book_new()
                xlsx.utils.book_append_sheet(wb, ws, "Data");
                const excelBase64 = xlsx.write(wb, { type: 'base64', bookType: 'xlsx' });
                return res.json({ 
                    excelBase64: excelBase64,
                    jsonData: jsonData,
                    filename: 'extracted_data.xlsx'
                })
            } catch (err) {
                console.error("Failed to parse JSON for Excel:", text, err);
                return res.status(500).json({ error: "Failed to generate Excel file from AI output. It may not have found a clear table structure." });
            }
        }
        text = text.replace(/^```(html)?\n/i, '').replace(/\n```$/i, '')
        res.json({ text: text.trim() || 'No code could be generated.' });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message || 'Failed to process image' });
    }
});
app.listen(port, () => {
    console.log(`Server is running at http:
    console.log('To stop the server, press Ctrl+C');
});