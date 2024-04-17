# Residency-Bot
A Discord bot that tracks the online residency hours of users via activity in a voice channel.

# Update the commands
1. Run `node deploy-commands.js`

# Run locally
1. Run `npm install discord.js`
1. Create a `.env` file with the following content
```
SHEET_ID = <>
CLIENT_EMAIL = <>
PRIVATE_KEY = <>
CLIENT_ID = <>
GUILD_ID = <>
BOT_TOKEN = <>
APP_ID = <>
PUBLIC_KEY = <>
AUTH = <>
```
1. Start with `node index.js`

# TLS instructions
1. Enable the bot on the discord server
1. Check if the bot is running via the given website
1. If the bot is not running, redeploy the repository on render on a different region
1. Logs may be seen on the given sheets link.
1. Remove all entries on the hidden logs sheets to reset the data 

# Technologies
![Express](https://img.shields.io/badge/Express-000000.svg?style=for-the-badge&logo=Express&logoColor=white)
![NodeJS](https://img.shields.io/badge/Node.js-339933.svg?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Javascript](https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=for-the-badge&logo=JavaScript&logoColor=black)
![Google Sheets](https://img.shields.io/badge/Google%20Sheets-34A853.svg?style=for-the-badge&logo=Google-Sheets&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7.svg?style=for-the-badge&logo=Render&logoColor=white)
