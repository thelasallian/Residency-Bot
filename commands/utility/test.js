// Warning: command name must be 1-32 characters and without caps
const { SlashCommandBuilder } = require('discord.js');

// This function tests to see if bot is active with /test command
// Replies "I am active"
module.exports = {
	data: new SlashCommandBuilder()
		.setName('test') //test is the command name
		.setDescription('Replies to test if bot is active.'),
	async execute(interaction) {
		await interaction.reply('I am active.');
	},
};