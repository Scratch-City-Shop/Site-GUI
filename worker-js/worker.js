export default {
  async fetch(request, env) {
    const { method } = request;

    const key = "my-data";
    const jsonBinBackupUrl = "https://api.jsonbin.io/v3/b/YOUR_BIN_ID";
    const jsonBinApiKey = "YOUR_JSONBIN_API_KEY";

    if (method === "GET") {
      try {
        const value = await env.MY_KV_NAMESPACE.get(key);
        if (value) {
          return new Response(value, { headers: { "Content-Type": "application/json" } });
        } else {
          // Fallback to JSONBin
          const res = await fetch(`${jsonBinBackupUrl}/latest`, {
            headers: { "X-Access-Key": jsonBinApiKey }
          });
          const json = await res.json();
          return new Response(JSON.stringify(json.record), { headers: { "Content-Type": "application/json" } });
        }
      } catch (err) {
        return new Response("Error fetching data", { status: 500 });
      }
    }

    if (method === "POST") {
      try {
        const body = await request.text();
        await env.MY_KV_NAMESPACE.put(key, body);

        // Backup to JSONBin
        await fetch(jsonBinBackupUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Access-Key": jsonBinApiKey
          },
          body: JSON.stringify({ data: JSON.parse(body) })
        });

        return new Response("Saved successfully", { status: 200 });
      } catch (err) {
        return new Response("Failed to save", { status: 500 });
      }
    }

    return new Response("Not found", { status: 404 });
  }
};
