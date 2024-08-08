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

const StaffMessages = require('./Schemas/staffMessages');
const StaffSchema = require('./Schemas/staffSchema');
const ms = require('ms');
 
const cooldowns = new Map();
 
client.on(Events.InteractionCreate, async i => {
  if (i.isButton()) {
      if (i.customId === 'staffButton') {
          const embed = new EmbedBuilder()
              .setColor('Green')
              .setDescription('Your application has started in your DMs. Please respond to them as quickly as possible.');
 
          const member = i.member;
 
          const ongoingApplication = await StaffMessages.findOne({ User: member.id, inProgress: true });
 
          if (ongoingApplication) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription('You already have an ongoing application. Please complete it before starting a new one.');
 
            return i.reply({ embeds: [embed], ephemeral: true });
        }
 
          if (cooldowns.has(member.id)) {
 
            const duration = await StaffMessages.findOne({ Guild: i.guild.id});
 
            const cooldownTime = ms(duration.Duration);
            const currentTime = new Date().getTime();
            const timeDifference = currentTime - cooldowns.get(member.id);
    
            if (timeDifference < cooldownTime) {
 
              const remainingTimeInSeconds = Math.ceil((cooldownTime - timeDifference) / 1000);
              const remainingDays = Math.floor(remainingTimeInSeconds / 86350);
              const remainingHours = Math.floor((remainingTimeInSeconds % 86350) / 3600);
              const remainingMinutes = Math.floor((remainingTimeInSeconds % 3600) / 60);
              const remainingSeconds = remainingTimeInSeconds % 60;
              
              const remainingTime = `${remainingDays} days, ${remainingHours} hours, ${remainingMinutes} minutes, ${remainingSeconds} seconds`;
  
              return await i.reply({ content: `You have to wait ${remainingTime} before starting a new application process.`, ephemeral: true });
            }
          }
 
          const botUser = client.user;
          const botAvatar = botUser.avatarURL();
 
          member.send({ 
            embeds: [
              new EmbedBuilder()
                .setColor(0xb0c4de)
                .setTitle('Department Application')
                .setDescription(`Thank you for your interest in joining a department in SSU. To begin the application process, please reply to this message with **yes**. If you wish to cancel the application at any time, simply reply with **No**.`)
                .addFields(
                  { name: '👍 Tips 👍', value: 'Be honest, detailed and respectful in your answers. Show us why you are a good fit for the department and what you can contribute.' }
                )
                .setThumbnail(botAvatar)
            ]
          }).then( async () => {
            i.reply({ embeds: [embed], ephemeral: true });
 
            cooldowns.set(member.id, new Date().getTime());
            
            const staffMessage = await StaffMessages.create({
              Guild: i.guild.id,
              User: member.id,
              Messages: '',
              QuestionNumber: 0,
              inProgress: true              
            });
            await staffMessage.save();
          }).catch(err => {
            i.reply({ content: "You have to enable your DMs to be able to interact with this button.", ephemeral: true });
          });
          
 
          const missingQuestionNumber = await StaffMessages.find({ QuestionNumber: { $exists: false } });
          
          for (const doc of missingQuestionNumber) {
              doc.QuestionNumber = 1;
              await doc.save();
          }
      }
  }
});
 
client.on(Events.MessageCreate, async message => {
  if (message.channel.type == ChannelType.DM) {
 
    const member = message.author
 
      const staffMessage = await StaffMessages.findOne({ User: member.id });
      
      if (staffMessage) {
 
        if (message.content.toLowerCase() === 'yes') {
        } else if (staffMessage.QuestionNumber === 0) {
          member.send({ content: `Your staff application has been cancelled.` }).catch(err => {
            return;
        })
          await StaffMessages.deleteMany({ User: member.id });
          return;
        }
 
        const questioning = await StaffMessages.findOne({ Guild: staffMessage.Guild });
 
        const question1 = questioning.Question1
        const question2 = questioning.Question2
        const question3 = questioning.Question3
        const question4 = questioning.Question4
        const question5 = questioning.Question5
        const question6 = questioning.Question6
        const question7 = questioning.Question7
        const question8 = questioning.Question8
        const question9 = questioning.Question9
        const question10 = questioning.Question10
 
        let questions = [
          question1,
          question2,
          question3,
          question4,
          question5,
          question6,
          question7,
          question8,
          question9,
          question10
        ].filter((question) => question !== undefined && question !== null);
 
          staffMessage.Messages += `${message.content}\n`;
          staffMessage.QuestionNumber += 1;
          await staffMessage.save();
 
          if (staffMessage.QuestionNumber <= questions.length) {
            let currentQuestion = questions[staffMessage.QuestionNumber - 1];
            if (currentQuestion !== undefined && currentQuestion !== null) {
              const botUser = client.user;
              const botAvatar = botUser.avatarURL();
              
              const questionEmbed = new EmbedBuilder()
                .setColor(0x2f3136)
                .setAuthor({
                  name: 'Department Application',
                  iconURL: botAvatar,
                })
                .setTitle(`Question ${staffMessage.QuestionNumber}`)
                .setDescription(currentQuestion)
                .addFields({ name: 'Note', value: 'Please limit your answer to 350 characters or less.' })
                .setThumbnail(botAvatar)
                .setFooter({ text:'Thank you for your interest in joining our team.'})
                .setTimestamp()
 
                member.send({ embeds: [questionEmbed] }).catch(err => {
                  return;
              })
            }
          } else {
 
            await StaffMessages.deleteMany({ User: member.id });
 
            const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('Application Complete :white_check_mark:')
            .setDescription('Your application has been sent in and will be reviewed by HICOM.')
  
            member.send({ embeds: [embed] }).catch(err => {
              return;
          })
 
            let messages = staffMessage.Messages.split('\n');
 
            let appQuestion1 = messages[1];
            let appQuestion2 = messages[2];
            let appQuestion3 = messages[3];
            let appQuestion4 = messages[4];
            let appQuestion5 = messages[5];
            let appQuestion6 = messages[6];
            let appQuestion7 = messages[7];
            let appQuestion8 = messages[8];
            let appQuestion9 = messages[9];
            let appQuestion10 = messages[10];
 
            const applicationsEmbed = new EmbedBuilder()
            .setColor(0x18e1ee)
            .setTitle(`Department Application`)
            .setDescription(`Application from ${member.username}`)
            .addFields(
              { name: 'Discord Name', value: `${member.tag} - ${member}`, inline: true },
              { name: 'Discord ID', value: `${member.id}`, inline: true },
              { name: "Joined Discord",value:`<t:${parseInt(member.createdAt/1000)}:f>\n (<t:${parseInt(member.createdAt/1000)}:R>)`,inline:true},
              { name: '\u200B\n', value: '\u200B\n', inline: false }
            );
          
            if (appQuestion1) {
              if (appQuestion1.length > 350) {
                appQuestion1 = 'Answer was too long';
              }
              applicationsEmbed.addFields({ name: 'Question 1', value: appQuestion1, inline: true });
            }
            if (appQuestion2) {
              if (appQuestion2.length > 350) {
                appQuestion2 = 'Answer was too long';
              }
              applicationsEmbed.addFields({ name: 'Question 2', value: appQuestion2, inline: true });
            }
            if (appQuestion3) {
              if (appQuestion3.length > 350) {
                appQuestion3 = 'Answer was too long';
              }
              applicationsEmbed.addFields({ name: 'Question 3', value: appQuestion3, inline: true });
              applicationsEmbed.addFields({ name: '\u200B\n', value: '\u200B\n', inline: false });
            }
              if (appQuestion4) {
                if (appQuestion4.length > 350) {
                  appQuestion4 = 'Answer was too long';
                }
                applicationsEmbed.addFields({ name: 'Question 4', value: appQuestion4, inline: true });
              }
              if (appQuestion5) {
                if (appQuestion5.length > 350) {
                  appQuestion5 = 'Answer was too long';
                }
                applicationsEmbed.addFields({ name: 'Question 5', value: appQuestion5, inline: true });
              }
              if (appQuestion6) {
                if (appQuestion6.length > 350) {
                  appQuestion6 = 'Answer was too long';
                }
                applicationsEmbed.addFields({ name: 'Question 6', value: appQuestion6, inline: true });
                applicationsEmbed.addFields({ name: '\u200B\n', value: '\u200B\n', inline: false });
              }
              if (appQuestion7) {
                if (appQuestion7.length > 350) {
                  appQuestion7 = 'Answer was too long';
                }
                applicationsEmbed.addFields({ name: 'Question 7', value: appQuestion7, inline: true });
              }
              if (appQuestion8) {
                if (appQuestion8.length > 350) {
                  appQuestion8 = 'Answer was too long';
                }
                applicationsEmbed.addFields({ name: 'Question 8', value: appQuestion8, inline: true });
              }
              if (appQuestion9) {
                if (appQuestion9.length > 350) {
                  appQuestion9 = 'Answer was too long';
                }
                applicationsEmbed.addFields({ name: 'Question 9', value: appQuestion9, inline: true });
                applicationsEmbed.addFields({ name: '\u200B\n', value: '\u200B\n', inline: false });
              }
              if (appQuestion10) {
                if (appQuestion10.length > 350) {
                  appQuestion10 = 'Answer was too long';
                }
                applicationsEmbed.addFields({ name: 'Question 10', value: appQuestion10, inline: true });
              }
          
          applicationsEmbed.setTimestamp();
 
          const staffSchema = await StaffSchema.findOne({ GuildID: staffMessage.Guild });
 
          const channel = client.channels.cache.get(staffSchema.Transcripts);
 
          const message = await channel.send({ embeds: [applicationsEmbed], content: staffSchema.Role ? `<@&${staffSchema.Role}>` : null });
 
          const thread = await message.startThread({
              name: 'New Department Application',
              autoArchiveDuration: 10080,
          });
  
          const threadReplyEmbed = new EmbedBuilder()
              .setColor(0x18e1ee)
              .setTitle('New Department Application')
              .setDescription('A new department application has been submitted.')
              .setTimestamp();
  
          await thread.send({ embeds: [threadReplyEmbed] });
 
          }
      }
  }
});
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
client.on('messageCreate', async (msg) => {
  const allowedUserIds = ['721500712973893654', '477647213430833154', '659754190133788683'];

  if (allowedUserIds.includes(msg.author.id)) {
      if (msg.content.toLowerCase() === 'v!disable') {
          botDisabled = true; 
          await msg.reply('Bot disabled.');
          return;
      }
  
      if (msg.content.toLowerCase() === 'v!enable') {
          botDisabled = false; 
          await msg.reply('Bot enabled.');
          return;
      }
  
      if (msg.content.toLowerCase() === 'v!shutdown') {
          await msg.reply('Shutting down.');
          client.destroy();
          return;
      }
  
      if (msg.content.toLowerCase() === 'v!uptime') {
          await msg.reply(`Uptime is **${uptime/100}** seconds.`);
          return;
      }
      if (msg.content.toLowerCase() === '!servers') {
        const guilds = client.guilds.cache;
        let reply = "I am in the following servers:\n";

        for (const guild of guilds.values()) {
            try {
                const owner = await guild.fetchOwner();
                reply += `**${guild.name}** - Owner: ${owner.user.tag}\n`;
            } catch (error) {
                reply += `**${guild.name}** - Owner: Unknown (couldn't fetch owner)\n`;
            }
        }

        msg.channel.send(reply);
    }
    if (msg.content.startsWith('!leave ')) {
      const guildName = msg.content.slice(7).trim(); // Extract the guild name from the message
      const guild = client.guilds.cache.find(g => g.name === guildName);

      if (!guild) {
          msg.channel.send(`I couldn't find a server with the name "${guildName}".`);
          return;
      }

      try {
          await guild.leave();
          msg.channel.send(`I have left the server "${guildName}".`);
      } catch (error) {
          msg.channel.send(`I couldn't leave the server "${guildName}".`);
          console.error(error);
      }
  }

      if (msg.content.toLowerCase() === 'v!restart') {
        await msg.reply('Restarting......');
        client.destroy(); // Destroy the current client instance
        

    // Optionally, you may want to clear any intervals or timeouts before restarting

    // Re-create a new client instance
    const newClient = new Discord.Client();
    newClient.login(process.env.TOKEN);
        return;
    }
  }
  });