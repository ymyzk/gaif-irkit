const fs = require("fs");

const axios = require("axios");
const firebase = require("firebase");

const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
const ENDPOINT = config.irkit.endpoint;
const MESSAGES = config.irkit.messages;
const ACTIONS = config.actions;
const path = config.path;

firebase.initializeApp(config.firebase);

const db = firebase.database();
let initial = true;

const DRY_RUN = !!process.env.DRY_RUN;

db.ref(path).on("value", async function(changedSnapshot) {
  if (initial) {
    initial = false;
    return;
  }

  const value = changedSnapshot.val();
  console.log(value);
  const [command, createdAt, ...options] = value.split(" ");
  const option = options[0];
  const commandActions = ACTIONS[command];
  if (!commandActions) {
    console.log(`Unsupported command: ${command}`);
    return;
  }
  const action = commandActions[option];
  if (!action) {
    console.log(`Unsupported command & options: ${command} / ${options}`);
    return;
  }

  const message = MESSAGES[action];
  if (!message) {
    console.log(`Failed to find message for command & action: ${command} / ${action}`);
    return;
  }

  if (DRY_RUN) {
    console.log("DRY_RUN is set, skipping...");
    return;
  }

  await axios.post(ENDPOINT, message, {
    headers: { "X-Requested-With": "axios" }
  });
});

process.on("unhandledRejection", console.error);
