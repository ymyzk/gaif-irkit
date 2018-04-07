const fs = require("fs");

const axios = require("axios");
const debug = require("debug")("index");
const firebase = require("firebase");

const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
const ENDPOINT = config.irkit.endpoint;
const MESSAGES = config.irkit.messages;
const ACTIONS = config.actions;
const path = config.path;

debug("starting");

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
  const [command, createdAt, ...options] = value.split(" ");
  debug("requested: %s %s %o", command, createdAt, options);
  const option = options[0];
  const commandActions = ACTIONS[command];
  if (!commandActions) {
    debug("unsupported command: %s", command);
    return;
  }
  const action = commandActions[option];
  if (!action) {
    debug("unsupported command & options: %s %o", command, options);
    return;
  }

  const message = MESSAGES[action];
  if (!message) {
    debug("failed to find message for command & action: %s %s", command, action);
    return;
  }

  debug("selected action: %s", action);

  if (DRY_RUN) {
    debug("DRY_RUN is set, skipping...");
    return;
  }

  await axios.post(ENDPOINT, message, {
    headers: { "X-Requested-With": "axios" }
  });
});

debug("started");

process.on("unhandledRejection", console.error);
