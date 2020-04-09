const fetch = require("node-fetch")

const RASARequest = async(uri, message, sender) => {
    const response = await fetch.default(
        `${uri}/webhooks/rest/webhook`, {
            method: "POST",
            contentType: "application/json",
            body: JSON.stringify({ message: message, sender: sender })
        }
    );
    return await response.json();
}

// const RASARequest = async(uri, user, name, policy, confidence) => {
//     const response = await fetch.default(
//         `${uri}/conversations/${user}/execute`, {
//             method: "POST",
//             contentType: "application/json",
//             body: JSON.stringify({ name: message, sender: sender })
//         }
//     );
//     return await response.json();
// }


module.exports = {
    RASARequest
}