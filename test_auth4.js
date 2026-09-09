async function test() {
    const apiKey = "YOUR_API_KEY";
    let pageToken = "";
    do {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=100&pageToken=${pageToken}`, {
            headers: {'x-goog-api-key': apiKey}
        })
        let data = await res.json();
        if(data.models) {
            data.models.forEach(m => console.log(m.name));
        }
        pageToken = data.nextPageToken;
    } while(pageToken);
}
test();
