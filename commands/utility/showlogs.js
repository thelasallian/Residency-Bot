const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('showlogs')
        .setDescription('Displays all the contents of the logs in CSV format.'),
    async execute(interaction) {
        // Load the logs from the file
        let logs;
        try {
            logs = fs.readFileSync('./logs.csv', 'utf-8');
        } catch (error) {
            console.error("Error reading logs file:", error);
            await interaction.reply('An error occurred while reading the logs file.');
            return;
        }

        // Check if logs are empty
        if (!logs.trim()) {
            await interaction.reply('No logs available.');
            return;
        }

        // Reply with the logs
        await interaction.reply('Here are the logs:\n```\n' + logs + '\n```');
    },
};
