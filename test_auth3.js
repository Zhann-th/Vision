async function test() {
    const apiKey = "YOUR_API_KEY";
    console.log("Listing models...")
    try {
        var res = await fetch(`https:
            method: 'GET', 
            headers: {'x-goog-api-key': apiKey}
        });
        var data = await res.json();
        console.log("Models:", JSON.stringify(data, null, 2))
    } catch (e) { console.log(e); }
}
test();