/**
 * Plex Invite Bot 😳
 * Github: https://github.com/foobball
 */

const Discord = require('discord.js');
const fetch = require('node-fetch');
const async = require('async');
const axios = require('axios').default;
const config = require('./config.json');
const client = new Discord.Client();
const prefix = config.prefix;

let invtoken = config.inv_account;
const servers = config.accounts;

let openslots = 0;
let totalslots = 0;

async function countSlots(callback) {
    let totalSlots = 0;
    let totalUsed = 0;
    let string = ``;
    totalslots = 0;

    await async.forEachOf(servers, async(server) => {
        let err = false;
        let xml = await axios.get("https://plex.tv/api/users?X-Plex-Token=" + server.token)
            .catch(() => {
                string += `**Server ${server.bonjour} (id ${server.id}):** ??/${server.capacity}\n`;
                err = true;
            });

        if (!err) {
            xml = xml.data;
            let slots = Number(xml.split('totalSize="')[1].split("\"")[0]);
            if (slots < 0) slots = 0;
            if (slots > 100) slots = 100;

            totalSlots += server.capacity;
            totalslots += server.capacity;
            totalUsed += slots;
            string += `**Server ${server.bonjour} (id ${server.id}):** ${slots}/${server.capacity}\n`;
        }
    })

    openslots = totalSlots - totalUsed;
    string += `\n**Open Slots**: ${totalSlots - totalUsed}/${totalSlots}`

    callback(string);
}

async function checkTokens(callback) {
    let tokenstr = ``;
    await async.forEachOf(servers, async(server) => {
        await axios.get("https://plex.tv/api/users?X-Plex-Token=" + server.token).then(() => {
            tokenstr += `:white_check_mark: **Server ${server.bonjour}**\n`;
        }).catch(() => {
            tokenstr += `:x: **Server ${server.bonjour}**\n`;
        });
    })

    callback(tokenstr);
}

function invite(email, callback) {
    fetch("https://plex.tv/api/v2/shared_servers?X-Plex-Product=Plex%20Web&X-Plex-Version=4.51.1&X-Plex-Client-Identifier=o827vglf9rocj0uytttqsjdz&X-Plex-Platform=Chrome&X-Plex-Platform-Version=87.0&X-Plex-Sync-Version=2&X-Plex-Features=external-media%2Cindirect-media&X-Plex-Model=hosted&X-Plex-Device=Windows&X-Plex-Device-Name=Chrome&X-Plex-Device-Screen-Resolution=1600x799%2C1600x900&X-Plex-Token=" + servers[invtoken].token + "&X-Plex-Language=en", {
            "headers": {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "accept-language": "en",
                "content-type": "application/json",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site"
            },
            "referrer": "https://app.plex.tv/",
            "referrerPolicy": "origin-when-cross-origin",
            "body": "{\"machineIdentifier\":\"" + servers[invtoken].machineid + "\",\"librarySectionIds\":[],\"settings\":{},\"invitedEmail\":\"" + email + "\"}",
            "method": "POST",
            "mode": "cors",
            "credentials": "omit"
        }).then(res => res.json())
        .then(body => {
            if (body.errors) {
                let errcode = body.errors[0].code;
                if (Number(errcode) == 1999) errcode = 'Unable to send invite.';
                if (Number(errcode) == 1000) errcode = 'Invalid request.';

                return callback({ err: true, code: errcode, msg: ':x: Error inviting user to the plex server.\n**Error Code:** ' + body.errors[0].code });
            }

            let url = 'https://plex.tv/servers/shared_servers/accept?invite_token=' + body.inviteToken;
            let user = body.invitedEmail;

            if (body.invited !== undefined) {
                user = body.invited.username || body.invitedEmail;
            }

            callback({ user: user, msg: `:white_check_mark: Successfully sent an invite to ${user}`, url: url })
        }).catch((e) => {
            console.error(e);
            callback({ err: true, code: 'Unabled to fetch endpoint.' })
        });
}

client.on('ready', () => {
    console.log(`Ready as ${client.user.tag}`);

    countSlots((slots) => {
        console.log(slots.replace(/\*/g, ''));
    })
})

client.on('guildMemberAdd', (member) => {
    if (config.welcome_msg.enabled) member.send(
        new Discord.MessageEmbed()
        .setDescription(
            `${config.welcome_msg.msg}\n` +
            `There's currently ${openslots}/${totalslots} slots open.`
        ).setThumbnail(member.guild.iconURL())
    );
})

client.on('message', (message) => {
    const logschannel = client.channels.cache.get(config.logs_channel_id);

    if (!message.guild) return;
    if (message.author.bot) return;
    if (message.channel.id == logschannel.id) {
        let invit = message.content;

        message.delete();
        if (message.content.search(/ /g) > -1) {
            logschannel.send(`:x: Error while verifying <@!${message.author.id}> (\`${invit}\`): Space in username`);
            return message.author.send(':x: **Invalid email/username provided**')
        }
        if (message.content.length > 100) {
            logschannel.send(`:x: Error while verifying <@!${message.author.id}> (\`${invit.substr(0,35)}\`): Username/email over 100 characters`);
            return message.author.send(':x: **Invalid email/username provided**')
        }

        invite(invit, (res) => {
            if (res.err) {
                logschannel.send(`:x: Error while verifying <@!${message.author.id}> (\`${invit}\`): ${res.code}`);

                return message.author.send(
                    `:x: You couldn't be invited to the plex server.`
                ).catch();
            }

            logschannel.send(`:white_check_mark: Successfully sent an invite to <@!${message.author.id}> (\`${invit}\`)`);
            const embed = new Discord.MessageEmbed()
                .setColor('GREEN')
                .setURL(res.url)
                .setTitle('You\'ve been successfully invited to the Plex Server')
                .setDescription(`To accept this invite, check your email for the Plex account \`${res.user}\`, or click the following link:\n${res.url}`)
            message.author.send(embed);
        });
        return;
    }

    if (!message.member.hasPermission('ADMINISTRATOR')) return;
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(' ');
    const command = args.shift().toLowerCase();

    if (command == 'inv') {
        if (args.length == 1) {
            invite(args[0], (res) => {
                message.channel.send(res.msg);
            });
        } else if (args.length == 2) {
            let user = client.users.cache.get(args[1]);

            if (user == null || user == undefined) return message.channel.send(':x: Invalid User ID');

            message.guild.fetch().then(() => {
                invite(args[0], (res) => {
                    message.channel.send(res.msg);
                    if (res.err == true) return;

                    const embed = new Discord.MessageEmbed()
                        .setColor('RED')
                        .setURL(res.url)
                        .setTitle('You\'ve been invited to the Plex Server')
                        .setDescription(`To accept this invite, check your email for the Plex account **${res.user}**, or click the following link:\n${res.url}`)
                    user.send(embed).catch(() => {
                        message.channel.send(':x: This user has DMs disabled, so they couldn\'t be notified.');
                    });
                });
            }).catch(() => { message.channel.send("err") })
        }
    } else if (command == 'slots') {
        message.channel.send(new Discord.MessageEmbed().setDescription('Checking slots of each server...')).then((newmsg) => {
            countSlots((desc) => {
                const embed = new Discord.MessageEmbed()
                    .setTitle('Current Server Capacity')
                    .setDescription(desc + `\n**Invite Server:** ${servers[invtoken].bonjour} (id ${invtoken})`)
                    .setTimestamp()
                newmsg.edit(embed);
            })
        });
    } else if (command == 'chktokens') {
        message.channel.send(new Discord.MessageEmbed().setDescription('Checking token of each Plex account...')).then((newmsg) => {
            checkTokens((desc) => {
                const embed = new Discord.MessageEmbed()
                    .setTitle('Token Status')
                    .setDescription(desc)
                    .setTimestamp()
                newmsg.edit(embed);
            })
        });
    } else if (command == 'switch') {
        if (args.length !== 1) return message.channel.send(`\`${prefix}switch [id]\``);
        let slotnum = Number(args[0]);
        if (isNaN(slotnum)) return message.channel.send('\`invalid id\`');
        if (servers.length < slotnum || slotnum < 0) return message.channel.send('\`invalid id\`');

        servers.forEach((server) => {
            if (server.id == slotnum) {
                invtoken = slotnum - 1;
                return message.channel.send(`**Invite server set to ${server.bonjour} (id ${server.id})**\n**Machine Identifier**: ${server.machineid}\n**ID**: ${invtoken}`);
            }
        })
    }
})

client.login(config.bot_token);