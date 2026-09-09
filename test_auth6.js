async function test() {
    const apiKey = "YOUR_API_KEY";
    console.log("Testing server.js logic...");
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify({contents: [{parts: [{text: "Say hello"}]}]})
        });
        const data = await res.json();
        console.log("Status:", res.status, JSON.stringify(data));
    } catch (e) { console.log(e); }
}
test();
