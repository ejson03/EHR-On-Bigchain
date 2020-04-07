const fetch = require("node-fetch")
export default async function RASARequest(uri, message, sender) {
    const response = await fetch.default(
        `${uri}/webhooks/rest/webhook`,
        {
            method: "POST",
            contentType: "application/json",
            body: JSON.stringify({ message: message, sender: sender })
        }
    );
    return await response.json();
}
