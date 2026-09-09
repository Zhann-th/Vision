async function test() {
    const apiKey = "YOUR_API_KEY";
    console.log("Testing x-goog-api-key header...");
    try {
        let res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`, {
            method: 'POST', 
            headers: {'Content-Type': 'application/json', 'x-goog-api-key': apiKey},
            body: JSON.stringify({contents: [{parts: [{text: "Say hello"}]}]})
        })
        const data = await res.json();
        console.log("x-goog-api-key Status:", res.status, data.error?.message || data);
    } catch (e) { console.log(e); }
}
test();
