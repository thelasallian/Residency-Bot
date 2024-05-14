// for production
const express = require("express");
const app = express();
app.get("/", (req, res) => {
  res.send("The Residency bot server is active.");
});
// Require connection to commands
const fs = require("node:fs");
const path = require("node:path");
const { Collection, TextChannel } = require("discord.js");

// Require the necessary discord.js classes
const { savetoSheet, savetoLogs } = require("./toSheet.js");
const { Client, Events, GatewayIntentBits } = require("discord.js");
//const { BOT_TOKEN } = require('./config.json');

const dotenv = require("dotenv");
dotenv.config();
const BOT_TOKEN = process.env.BOT_TOKEN;

// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
}); // REFER TO https://ziad87.net/intents/

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

function formatTimestamp(timestamp) {
  // Convert milliseconds to seconds
  const sec = Math.floor(timestamp / 1000);

  // Create a new Date object from the seconds
  const dateObj = new Date(sec * 1000);

  // Calculate the Philippine time offset (UTC+8) in minutes
  const philippinesOffset = 8 * 60;

  // Adjust the date object to Philippine time
  const philippineTime = new Date(
    dateObj.getTime() + philippinesOffset * 60000
  );

  // Extract hours, minutes, and seconds (zero-padded for two digits)
  const hours = philippineTime.getUTCHours().toString().padStart(2, "0");
  const minutes = philippineTime.getUTCMinutes().toString().padStart(2, "0");
  const seconds = philippineTime.getUTCSeconds().toString().padStart(2, "0");

  // Format the time string (e.g., 08:49:04)
  return `${hours}:${minutes}:${seconds}`;
}

// Function to write logs to CSV file / FOR CHECKING ONLY
function writeLogToCSV(username, totalTime, date) {
  let logString = username + "," + formatTime(totalTime) + "," + date + "\n";

  fs.appendFile("logs.csv", logString, (err) => {
    if (err) {
      console.error("Error appending data to file:", err);
    } else {
      console.log("Log entry added to logs.csv");
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

async function sendAlert(time, member, text) {
  const textChannelID = "1238148714011299860";

  try {
    const logChannel = await client.channels.fetch(textChannelID);
    logChannel.send(
      `${member} ${text} residency channel at ${formatTimestamp(time)}`
    );
  } catch (error) {
    console.error("Error fetching or sending message in channel:", error);
  }
}

client.on(Events.VoiceStateUpdate, async (past, present) => {
  //debugging
  console.log("\nVoiceStateUpdate is activated");

  let user = past.member || present.member;

  let past_channel = past.channelId;
  let present_channel = present.channelId;

  let past_user = past.member.user;
  let present_user = present.member.user;

  console.log("present", present.channelId);

  // TODO: activate only if user joined/left voice channel 'Residency'

  if (
    present_channel != null &&
    (present.channelId == 1214250569125077003 ||
      present.channelId == 1238149023135957044)
  ) {
    // user joins a voice channel
    console.log(present_user.username, "joined a voice channel");

    // User joins RESIDENCY voice channel
    if (
      present.channelId == 1214250569125077003 ||
      present.channelId == 1238149023135957044
    ) {
      console.log(present_user.username, "joined a RESIDENCY voice channel");
      users.set(user.id, new Date().getTime());
      sendAlert(users.get(user.id), present_user.username, "joined");
    }
  } else if (
    present_channel == null ||
    past.channelId == 1214250569125077003 ||
    past.channelId == 1238149023135957044
  ) {
    // user left a voice channel
    console.log(past_user.username, "left the voice channel");

    // User left RESIDENCY voice channel
    if (
      past.channelId == 1214250569125077003 ||
      past.channelId == 1238149023135957044
    ) {
      if (users.get(user.id) != undefined) {
        const timeOut = new Date().getTime();
        const totalTime = new Date().getTime() - users.get(user.id);
        const today = getCurrentDate();
        sendAlert(timeOut, past_user.username, "left");

        // FOR CHECKING ONLY
        // past_user.username
        //writeLogToCSV(past_user.username, totalTime, today);
        savetoLogs(
          past_user.username,
          today,
          formatTimestamp(users.get(user.id)),
          formatTimestamp(timeOut),
          formatTime(totalTime),
          (error) => {
            if (error) {
              console.error("Callback error:", error);
            } else {
              // run after async writing on logs (latest log should be recorded)
              savetoSheet();
            }
          }
        );
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
