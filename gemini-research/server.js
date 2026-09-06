const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static('./')); // Serve frontend files from the same directory

// Configure Multer for memory storage (we just need the buffer)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// API Endpoint
app.post('/api/extract', upload.array('images', 10), async (req, res) => {
    try {
        if ((!req.files || req.files.length === 0) && !req.body.rawText) {
            return res.status(400).json({ error: 'No files or text provided' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Server configuration error: API key missing.' });
        }

        const mode = req.body.mode || 'simple';
        const taskType = req.body.taskType || 'code';
        
        let prompt = '';

        if (taskType === 'excel') {
            prompt = `You are a data extraction AI.
            Extract all structured data (like tables, receipts, invoices, or lists) from the provided image(s) or document(s).
            Organize the data logically into columns and rows.
            Return ONLY a valid JSON array of objects, where each object represents a row, and keys are column names.
            Do not include any markdown wrappers (like \`\`\`json) or additional text. Just output the raw JSON array.`;
        } else if (taskType === 'ocr') {
            prompt = `You are a highly accurate handwriting recognition AI.
            Extract all handwritten or printed text from the provided image(s).
            Preserve the original formatting, line breaks, and spelling.
            Do not add any additional commentary, markdown wrappers, or explanations. 
            Just return the exact text found in the images.`;
        } else {
            prompt = `You are an expert Frontend Developer. 
            I will provide you with one or more sketches, wireframes, or mockups of a website or UI component.
            Your task is to convert this visual design into clean, functional, and responsive HTML and CSS.
            
            RULES:
            1. Output a SINGLE valid HTML document containing embedded CSS within a <style> tag.
            2. Use modern CSS (Flexbox/Grid), pleasing default colors if none are specified, and ensure it looks polished.
            3. Interpret handwritten notes or labels as instructions for the layout or text content.
            4. Do NOT output any markdown wrappers like \`\`\`html. Output ONLY the raw HTML code starting with <!DOCTYPE html>.
            5. IMPORTANT: For images, use REAL placeholder photos by generating a URL like: https://loremflickr.com/800/600/{keyword}. For example, if the site is about a coffee shop, use https://loremflickr.com/800/600/coffee. The images MUST match the theme of the website!\n`;

            if (mode === 'creative') {
                prompt += `\nMODE: CREATIVE. You are now an award-winning, elite UI/UX designer. You have ABSOLUTE CREATIVE LIBERTY! 
                Do NOT just strictly copy the sketch - use it only as a loose foundation. 
                - Add stunning, modern design elements: glassmorphism, glowing shadows, smooth gradients, and beautiful typography.
                - Add CSS animations (hover effects, fade-ins, floating elements).
                - Add realistic and engaging placeholder text (thematic content, not just lorem ipsum).
                - Expand the UI with extra details that make sense for a premium website: a sticky navigation bar, a gorgeous footer, social icons, micro-interactions, and decorative background patterns.
                - Make it look incredibly expensive and state-of-the-art!`;
            } else {
                prompt += `\nMODE: SIMPLE. Strictly follow the sketch. Do not add any extra sections, buttons, or creative liberties that are not explicitly drawn or written on the sketch. Keep the design clean and exactly as outlined.`;
            }
        }

        let docText = '';
        const imageParts = [];

        for (const file of req.files) {
            const isWord = file.mimetype === 'application/msword' || 
                           file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                           file.originalname.endsWith('.doc') || 
                           file.originalname.endsWith('.docx');
            
            const isPdf = file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf');

            if (isWord) {
                // Extract text from Word Document using Mammoth
                const result = await mammoth.extractRawText({ buffer: file.buffer });
                docText += `\n\n--- Content of ${file.originalname} ---\n${result.value}\n--- End of ${file.originalname} ---\n\n`;
            } else if (isPdf) {
                // Gemini 1.5 supports PDF inline_data
                imageParts.push({
                    inline_data: {
                        mime_type: 'application/pdf',
                        data: file.buffer.toString('base64')
                    }
                });
            } else {
                // Regular Image
                imageParts.push({
                    inline_data: {
                        mime_type: 'image/jpeg',
                        data: file.buffer.toString('base64')
                    }
                });
            }
        }

        // Append Word document text to the prompt if any
        if (docText.length > 0) {
            prompt += `\n\nAdditionally, I have provided the following text extracted from Word documents to assist you:\n${docText}`;
        }
        
        // Append Raw Text input if any
        if (req.body.rawText) {
            prompt += `\n\nHere is some raw text/instructions provided by the user:\n${req.body.rawText}`;
        }

        // Using direct REST API instead of the SDK to bypass strict API key format validation
        const requestBody = {
            contents: [{
                parts: [
                    { text: prompt },
                    ...imageParts
                ]
            }]
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Google API Error:', data.error);
            throw new Error(data.error?.message || 'Google API returned an error');
        }

        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // If Excel mode, parse the JSON and generate XLSX buffer
        if (taskType === 'excel') {
            try {
                // Strip markdown wrappers if AI still included them
                const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
                const jsonData = JSON.parse(cleanedText);
                
                if (!Array.isArray(jsonData) || jsonData.length === 0) {
                    throw new Error("No structured data could be extracted.");
                }

                // Create a new workbook and add the JSON data
                const ws = xlsx.utils.json_to_sheet(jsonData);
                const wb = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(wb, ws, "Data");
                
                // Write the workbook to a base64 string
                const excelBase64 = xlsx.write(wb, { type: 'base64', bookType: 'xlsx' });
                
                return res.json({ 
                    excelBase64: excelBase64,
                    jsonData: jsonData,
                    filename: 'extracted_data.xlsx'
                });
            } catch (err) {
                console.error("Failed to parse JSON for Excel:", text, err);
                return res.status(500).json({ error: "Failed to generate Excel file from AI output. It may not have found a clear table structure." });
            }
        }
        
        // Strip markdown blocks if the model accidentally includes them
        text = text.replace(/^```(html)?\n/i, '').replace(/\n```$/i, '');
        
        res.json({ text: text.trim() || 'No code could be generated.' });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message || 'Failed to process image' });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    console.log('To stop the server, press Ctrl+C');
});
