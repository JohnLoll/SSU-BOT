const { Channel } = require('diagnostics_channel');
const { Client, GatewayIntentBits, ActivityType, EmbedBuilder, Events, Partials, PermissionsBitField, Permissions, MessageManager, Embed, Collection, ButtonBuilder, ActionRowBuilder, ButtonStyle, DefaultDeviceProperty, ChannelType, AttachmentBuilder } = require(`discord.js`);
const fs = require('fs');
const internal = require('stream');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessageTyping, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.GuildVoiceStates], partials: [Partials.Message, Partials.Channel, Partials.Reaction] }); 

client.commands = new Collection();

require('dotenv').config();

const functions = fs.readdirSync("./src/functions").filter(file => file.endsWith(".js"));
const eventFiles = fs.readdirSync("./src/events").filter(file => file.endsWith(".js"));
const commandFolders = fs.readdirSync("./src/commands");

(async () => {
    for (file of functions) {
        require(`./functions/${file}`)(client);
    }
    client.handleEvents(eventFiles, "./src/events");
    client.handleCommands(commandFolders, "./src/commands");
    client.login(process.env.token)
})();


client.on(Events.MessageCreate, async message => {
    if (!message.guild) return;
    if (message.author.bot) return;

    if (message.content.includes("https://discord.com/channels/")) {

        try {
            const regex = message.content.match(/https:\/\/discord\.com\/channels\/\d+\/(\d+)\/(\d+)/);
            const [, channelId, messageId] = regex;
            const directmessage = await message.channel.messages.fetch(messageId);

            const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setAuthor({ name: directmessage.author.username, iconURL: directmessage.author.avatarURL()})
            .setDescription(directmessage.content)

            const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setLabel('View Message')
                .setURL(regex[0])
                .setStyle(ButtonStyle.Link)
            );

            await message.reply({ embeds: [embed], components: [button] });
        } catch (e) {
            return console.log(e);
        }

    } else {
        return;
    }

});

//nqn
client.on(Events.MessageCreate, async message => {
    if (!message.guild) return;
    if (message.author.bot) return;


 /*
    const regex = await message.content.match(/<a:[a-zA-Z0-9_]+:[0-9]+>/g);
    
    if (regex) {
        const ID = await message.content.match(/(?<=<a:.*:)(\d+)(?=>)/g);
        const emoji = await message.guild.emojis.fetch(ID).catch(err => {});

        if (emoji) {
            const member = await message.guild.members.fetch(message.author.id);
            console.log(member.premiumSubscriptionCount)
        }
    } */
});

//mod user
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.guild) return;

    if (interaction.customId !== "Moderate") return;
    else {
        const string = await interaction.values.toString();

        if (string.includes('ban')) {
            const userId = await interaction.values[0].replace(/ban/g, '');
            const reason = `Moderated by ${interaction.user.id}`;
            const ban = await interaction.guild.bans.create(userId, {reason}).catch(async err => {
                await interaction.reply({ content: `I couldn't ban that user!`, ephemeral: true });
            });

            if (ban) await interaction.reply({ content: `I have banned${userId}!`, ephemeral: true });
        }

        if (string.includes('kick')) {
            const userId = await interaction.values[0].replace(/kick/g, '');
            const member = await interaction.guild.members.fetch(userId);
            const kick = await member.kick({ reason: `Moderated by ${interaction.user.id}`}).catch(async err => {
                await interaction.reply({ content: `I couldn't kick that user!`, ephemeral: true });
            });

            if (kick) await interaction.reply({ content: `I have kicked${userId}!`, ephemeral: true });
        }
    }

});

const puppeteer = require('puppeteer');
client.on(Events.MessageCreate, async message => {
    if (message.channel.type !== ChannelType.DM) return;
    if (message.author.bot) return;

    var value;
    await message.channel.sendTyping();
    setTimeout(async () => {
        if (!value) await message.channel.sendTyping();
    }, 10000);

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('https://chat-app-f2d296.zapier.app/');

    const textBoxSelector = 'textarea[aria-label="chatbot-user-prompt"]';
    await page.waitForSelector(textBoxSelector);
    await page.type(textBoxSelector, message.content);

    await page.keyboard.press("Enter");

    await page.waitForSelector('[data-testid="final-bot-response"] p').catch(err => {
        return;
    });

    value = await page.$$eval('[data-testid="final-bot-response"]', async (elements) => {
        return elements.map((element) => element.textContent);
    });

    await browser.close();

    value.shift()

    const output = value.join('\n\n\n\n');
    if (output.length > 2000) {
        const chunks = output.match(/.{1,2000}/g);

        for (let i = 0; i < chunks.length; i++) {
            await message.author.send(chunks[i]).catch(err => {
                console.log(err)
                message.author.send("I can't find what you are looking for right now.").catch(err => {});
            });
        } 
    } else {
        await message.author.send(output).catch(err => {
            message.author.send("I can't find what you are looking for right now.").catch(err => {});
        });
    }

});

