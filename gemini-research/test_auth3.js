async function test() {
    const apiKey = "YOUR_API_KEY";
    console.log("Listing models...");
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models`, {
            method: 'GET', 
            headers: {'x-goog-api-key': apiKey}
        });
        const data = await res.json();
        console.log("Models:", JSON.stringify(data, null, 2));
    } catch (e) { console.log(e); }
}
test();
