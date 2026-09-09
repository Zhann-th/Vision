async function findWorkingModel() {
    const apiKey = "YOUR_API_KEY";
    const modelsToTry = [
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash-lite",
        "gemini-2.5-pro",
        "gemini-omni-flash-preview",
        "gemini-3.7-flash",
        "gemini-3.5-flash"
    ];

    for (var model of modelsToTry) {
        console.log(`Trying ${model}...`);
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                body: JSON.stringify({contents: [{parts: [{text: "Say hello"}]}]})
            });
            const data = await res.json();
            if (res.ok) {
                console.log(`✅ SUCCESS with ${model}:`, data.candidates[0].content.parts[0].text);
                return model; 
            } else {
                console.log(`❌ FAILED with ${model}:`, res.status, data.error?.message);
            }
        } catch (e) {
            console.log(`Error on ${model}:`, e.message);
        }
    }
}
findWorkingModel()
