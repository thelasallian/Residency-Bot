const express = require("express");
const app = express();
app.get("/", (req, res) => {
	res.send("Residency bot is active.");
  });
  

// Require connection to commands
const fs = require("node:fs");
const path = require("node:path");
const { Collection } = require("discord.js");

// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require("discord.js");
//const { BOT_TOKEN } = require("./config.json");
const { savetoSheet } = require("./toSheet.js");
require("dotenv").config();
const BOT_TOKEN = process.env.BOT_TOKEN;

// Create a new client instance
const client = new Client({ intents: 128 }); // REFER TO https://ziad87.net/intents/

// Create map for logs
const users = new Map();

// --- start: connect to commands --- //
client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

// --- end: connect to commands --- ///

//TODO: make command to download logs.csv file
// --- start: activate when user joins/leaves a voice channel --- //
function formatTime(milliseconds) {
  let hours = Math.floor(milliseconds / (1000 * 60 * 60));
  let minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  let seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
  return hours + "h " + minutes + "m " + seconds + "s";
}

// Function to write logs to CSV file / FOR CHECKING ONLY
function writeLogToCSV(username, totalTime, date, callback) {
  let logString = username + "," + formatTime(totalTime) + "," + date + "\n";

  fs.appendFile("logs.csv", logString, (err) => {
    if (err) {
      console.error("Error appending data to file:", err);
      callback(err); // Call the callback with the error
    } else {
      console.log("Log entry added to logs.csv");
      callback(null); // Call the callback with no error
    }
  });
}

function getCurrentDate() {
  const currentDate = new Date();
  return currentDate.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

client.on(Events.VoiceStateUpdate, async (past, present) => {
  //debugging
  console.log("VoiceStateUpdate is activated");

  let user = past.member || present.member;

  let past_channel = past.channelId;
  let present_channel = present.channelId;

  let past_user = past.member.user;
  let present_user = present.member.user;

  console.log("present", present.channelId);

  // TODO: activate only if user joined/left voice channel 'Residency'
  if (true) {
    if (present_channel != null) {
      // user joins a voice channel
      console.log(present_user.username, "joined a voice channel");

      // User joins RESIDENCY voice channel
      if (present.channelId == 1214250569125077003) {
        console.log(present_user.username, "joined a RESIDENCY voice channel");
        users.set(user.id, new Date().getTime());
      }
    } else if (present_channel == null) {
      // user left a voice channel
      console.log(past_user.username, "left the voice channel");

      // User left RESIDENCY voice channel
      if (past.channelId == 1214250569125077003) {
        if (users.get(user.id) != undefined) {
          const totalTime = new Date().getTime() - users.get(user.id);
          console.log("Total time: ", formatTime(totalTime));
          const today = getCurrentDate();

          //store time in logs
          //  ORIGINAL - change later
          //  writeLogToCSV(past_user.username, totalTime);

          // FOR CHECKING ONLY
          // past_user.username
          writeLogToCSV(past_user.username, totalTime, today, (error) => {
            if (error) {
              console.error("Callback error:", error);
            } else {
              // run after async writing on logs (latest log should be recorded)
              savetoSheet();
            }
          });
        }
      }
    } else if (present_channel != null && past_channel == 1214250569125077003) {
      console.log("HELLO");

      if (users.get(user.id) != undefined) {
        const totalTime = new Date().getTime() - users.get(user.id);
        console.log("Total time: ", formatTime(totalTime));
        const today = getCurrentDate();

        //store time in logs
        //  ORIGINAL - change later
        //  writeLogToCSV(past_user.username, totalTime);

        // FOR CHECKING ONLY
        // past_user.username
        writeLogToCSV(past_user.username, totalTime, today, (error) => {
          if (error) {
            console.error("Callback error:", error);
          } else {
            // run after async writing on logs (latest log should be recorded)
            savetoSheet();
          }
        });
      }
    } else if (present_channel == 1214250569125077003 && past_channel != null) {
      console.log("RPSENT");
      if (users.get(user.id) != undefined) {
        const totalTime = new Date().getTime() - users.get(user.id);
        console.log("Total time: ", formatTime(totalTime));
        const today = getCurrentDate();

        //store time in logs
        //  ORIGINAL - change later
        //  writeLogToCSV(past_user.username, totalTime);

        // FOR CHECKING ONLY
        // past_user.username
        writeLogToCSV(past_user.username, totalTime, today, (error) => {
          if (error) {
            console.error("Callback error:", error);
          } else {
            // run after async writing on logs (latest log should be recorded)
            savetoSheet();
          }
        });
      }
    }
  }
});

// --- end: activate when user joins/leaves a voice channel --- //

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client.login(BOT_TOKEN);

app.listen(3000, () => console.log("Server started at port 3000"));