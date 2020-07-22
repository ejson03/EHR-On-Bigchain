const MongoClient = require("mongodb").MongoClient;
const fetch = require("node-fetch");
const rasa = require("../config").rasa;

const RASARequest = async (message, sender) => {
  const response = await fetch.default(`${rasa.url}/webhooks/rest/webhook`, {
    method: "POST",
    contentType: "application/json",
    body: JSON.stringify({ message: message, sender: sender }),
  });
  return await response.json();
};

const getRasaHistory = async (email) => {
  const db = await MongoClient.connect(rasa.mongo);
  const result = await db.db("rasa")
    .collection("conversations")
    .findOne({ sender_id: email });

  const start = 0;
  const intents = [];
  // let intent = {};
  for (const event of result.events) {
    if (event.event == "session_started") {
      start = new Date(event.timestamp * 1000);
    }
    if (event.event == "user") {
      intent = {
        text: event.text,
        intent: event.parse_data.intent.name,
        entities: event.parse_data.entities,
        message_time: new Date(event.timestamp * 1000),
      };
    }
    if (event.event == "bot") {
      intent["reply"] = event.text;
      intent["reply_time"] = new Date(event.timestamp * 1000);
      intents.push(intent);
      intent = {};
    }
  }
  return intents;
};

module.exports = {
  RASARequest,
  getRasaHistory,
};
