const fetch = require("node-fetch")
    // mongo connection
let MongoClient = require('mongodb').MongoClient;
let url = "mongodb://192.168.33.160:27017/";
// bigchaindb connection
const API_PATH = 'http://192.168.33.160:9984/api/v1/'
const driver = require('bigchaindb-driver')
const conn = new driver.Connection(API_PATH)

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

const getRasaHistory = async(email) => {
    let data = []
    let db = await MongoClient.connect(url);
    let dbo = db.db("rasa");
    let result = await dbo.collection('conversations').findOne({ sender_id: email });
    let start = 0
    result.events.forEach((event) => {
        if (event.event == 'session_started') {
            start = new Date(event.timestamp * 1000)
        }
        if (event.event == 'user') {
            int = {
                'text': event.text,
                'intent': event.parse_data.intent.name,
                'entities': event.parse_data.entities,
                'message_time': new Date(event.timestamp * 1000)
            }
        }
        if (event.event == 'bot') {
            int['reply'] = event.text;
            int['reply_time'] = new Date(event.timestamp * 1000);
            data.push(int);
            int = {};
        }
    })
    return data;

};


module.exports = {
    RASARequest,
    getRasaHistory
}