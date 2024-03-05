# Residency-Bot
A Discord bot that tracks the online residency hours of users via activity in a voice channel.

# Update the commands
1. Run `node deploy-commands.js`

# Run locally
1. Run `npm install discord.js`
2. Create a `config.json` file with the following content
```
{
	"BOT_TOKEN": "<>",
	"APP_ID": "<>",
	"PUBLIC_KEY": "<>",
	"AUTH": "<>",
	"CLIENT_ID": "<>",
	"GUILD_ID": "<>"
}
```
3. Start with `node index.js`
