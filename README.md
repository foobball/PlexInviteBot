
# Plex Invite Bot

A simple bot that makes inviting people through Discord easier.

  
## Invite manually through commands
<img  src='https://media.discordapp.net/attachments/803420577540603944/812355628017647656/unknown.png'>

<img  src='https://media.discordapp.net/attachments/803420577540603944/812355709429743626/unknown.png'>

## Automatically invite people when they send a message to a specific channel
Video example: https://i.gyazo.com/10561ad7466ce6dbee92fa5a87c7a1ff.mp4
(*The bot deleted the message, but my client glitched out lol*)

DMs the author with their invite link

<img  src='https://media.discordapp.net/attachments/803420577540603944/812356479796641792/unknown.png'>

---
# Commands

The prefix will differ if you've changing it

[] = Required, () = Optional

|Command|Description|
|---|---|
|!inv [email] (discord id)|Invites the email specified. If a Discord user ID is provided, it DMs them the link.|
|!slots|Checks slots for each server.|
|!chktokens|Checks the tokens for each Plex account.|
|!switch [server id]|Switches the invite server to the ID provided.|

---
# Setup

- Install [node.js](https://nodejs.org/en/) (Select "LTS")
- Clone this repo
- Open it in terminal and type `npm install`
- Edit config.json:
```js
{
    "bot_token": "AAAAAAAAAABBBBBBBBBBBBBBBBBCCCCCCCCCCCCCCC", // Discord bot token
    // https://www.writebots.com/discord-bot-token/

    "prefix": "!", // Bot prefix

    "accounts": [{
        "bonjour": "server 1 name", // Friendly name of the account
        
        "token": "plextoken", // The Plex Token
        // https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/
        "machineid": "aaaaaaaaaaaaaaaaaaabbbbbbbbbbbbbbbbbbbbbb", // The machine identifier

        "capacity": 100, // Keep this at 100
        "id": 1 // Number ID of this account
    }],
    "inv_account": 0, // Index of the account people will be invited to, starts at 0

    "verify_channel_id": "803399347470991401", // Automatic verify channel id
    "logs_channel_id": "803430175752585237", // Verification logs channel

    "welcome_msg": {
        "enabled": true, // Enable the welcome message or not
        "msg": "Welcome to the server" // Message displayed on join
    }
}
```
- Use `node app` to start the bot

---

DM me on Discord at [foob#9889](https://discord.com/users/219541416760705024) if you need support.
