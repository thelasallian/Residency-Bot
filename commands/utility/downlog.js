const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const { readCSV } = require("../../toSheet.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("downlog")
    .setDescription("Reads from sheet"),
  async execute(interaction) {
    try {
      // change later to download csv from sheet
      readCSV();
    } catch (error) {
      console.error("Error reading from sheets:", error);
      await interaction.reply("An error occurred while reading from sheets.");
      return;
    }
    // interaction.guild is the object representing the Guild in which the command was run
    await interaction.reply(`Reading from sheets...`);
  },
};
