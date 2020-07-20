let MongoClient = require("mongodb").MongoClient;
const rasa = require("../config").rasa;
const moment = require("moment");

const exclude = ["action_session_start", "action_listen", "action_restart"];

const getConversationCollection = async () => {
  const db = await MongoClient.connect(rasa.mongo);
  const rasa = db.db("rasa");
  return rasa.collection("conversations");
};

const getDate = (day, state) => {
  return [moment(day).utc().startOf(state), moment.utc().endOf(state)];
};

const getUsers = async () => {
  let collection = await getConversationCollection();
  let users = await collection.find();
  users = users.filter((user) => {
    return user["sender_id"];
  });
  return users;
};

const getSingleUser = async (id) => {
  let collection = await getConversationCollection();
  return await collection.findOne({ sender_id: id });
};

const getRasaHistory = async (email) => {
  let user = getSingleUser(email);
  let date = getDate;
  user.events.forEach((event) => {
    if (event.event == "session_started") {
      start = new Date(event.timestamp * 1000);
    }
    if (event.event == "user") {
      int = {
        text: event.text,
        intent: event.parse_data.intent.name,
        entities: event.parse_data.entities,
        message_time: new Date(event.timestamp * 1000),
      };
    }
    if (event.event == "bot") {
      int["reply"] = event.text;
      int["reply_time"] = new Date(event.timestamp * 1000);
      data.push(int);
      int = {};
    }
  });
  return data;
};
