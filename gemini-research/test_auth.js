const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
    const apiKey = "YOUR_API_KEY";
    console.log("Testing SDK...");
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const res = await model.generateContent("Say hello");
        console.log("SDK Success:", res.response.text());
    } catch(e) {
        console.log("SDK Error:", e.message);
    }

    console.log("Testing raw fetch (?key)...");
    try {
        const res1 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({contents: [{parts: [{text: "Say hello"}]}]})
        });
        const d1 = await res1.json();
        console.log("Raw fetch (?key) Status:", res1.status, d1.error?.message || "Success");
    } catch (e) { console.log(e); }

    console.log("Testing raw fetch (Bearer)...");
    try {
        const res2 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`, {
            method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`},
            body: JSON.stringify({contents: [{parts: [{text: "Say hello"}]}]})
        });
        const d2 = await res2.json();
        console.log("Raw fetch (Bearer) Status:", res2.status, d2.error?.message || "Success");
    } catch (e) { console.log(e); }
}
test();
