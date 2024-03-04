// Require connection to commands
const fs = require('node:fs');
const path = require('node:path');
const { Collection } = require('discord.js');

// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require('discord.js');
const { BOT_TOKEN } = require('./config.json');

// Create a new client instance
const client = new Client({ intents: 128 }); // REFER TO https://ziad87.net/intents/

// --- start: connect to commands --- //
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async interaction => {
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
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

// --- end: connect to commands --- ///

//TODO: get user_id, check for specific voice channel, get log time
//TODO: store details in a readable log file
// --- start: activate when user joins/leaves a voice channel --- //
client.on("voiceStateUpdate", (past, present) => {

		//debugging
		console.log("VoiceStateUpdate is activated");

		let past_channel = past.channelId;
		let present_channel = present.channelId;

		let past_username = past.member.user.username;
		let present_username = present.member.user.username;

		// TODO: activate only if user joined/left voice channel 'Residency'
		if (past_channel_name == true || present_channel_name == true) {
			if (past_channel == null && present_channel != null) {
				// user joins voice channel
				console.log(present_username, "joined a voice channel");
		
				} else if (present_channel == null) {
				// user left voice channel
				console.log(past_username, "left the voice channel");
				}
		}
		
})

// --- end: activate when user joins/leaves a voice channel --- //

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client.login(BOT_TOKEN);