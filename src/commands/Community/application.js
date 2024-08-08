const {SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType} = require('discord.js');
const axios = require('axios');
const staffSchema = require('../../Schemas/staffSchema');
 
module.exports = {
    data: new SlashCommandBuilder()
    .setName('applications-setup')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDescription('Create an application system.')
    .addChannelOption((option) =>
    option
      .setName('channel')
      .setDescription('Select the channel where the applications panel should be sent to.')
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText)
  )
  .addChannelOption((option) =>
    option
      .setName('app-logs')
      .setDescription('Select the channel where the applications should be sent to be reviewed.')
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText)
  )
  .addStringOption((option) =>
    option
      .setName('description')
      .setDescription('Choose a description for the applications embed.')
      .setRequired(true)
      .setMaxLength(1000)
  )
  .addStringOption((option) =>
    option
      .setName('button')
      .setDescription('Choose a name for the applications embed.')
      .setRequired(true)
      .setMaxLength(80)
  )
  .addStringOption((option) =>
    option
      .setName('emoji')
      .setDescription('Choose a style, so choose a emoji.')
      .setRequired(true)
      )
      .addStringOption(option => option.setName('duration').setDescription('Select the length of time the member cannot apply for a department.').setRequired(true).addChoices(
        { name: '60 Seconds', value: '60s' },
        { name: '2 Minutes', value: '2m' },
        { name: '5 Minutes', value: '5m' },
        { name: '10 Minutes', value: '10m' },
        { name: '15 Minutes', value: '15m' },
        { name: '20 Minutes', value: '20m' },
        { name: '30 Minutes', value: '30m' },
        { name: '45 Minutes', value: '45m' },
        { name: '1 Hour', value: '1h' },
        { name: '2 Hours', value: '2h' },
        { name: '3 Hours', value: '3h' },
        { name: '5 Hours', value: '5h' },
        { name: '10 Hours', value: '10h' },
        { name: '1 Day', value: '1d' },
        { name: '2 Days', value: '2d' },
        { name: '3 Days', value: '3d' },
        { name: '5 Days', value: '5d' },
        { name: 'One Week', value: '1w' },
        { name: 'Two Weeks', value: '2w' },
        { name: 'Three Weeks', value: '3w' },
        { name: 'One Month', value: '30d' }
      ))
  .addStringOption((option) =>
    option
      .setName('question-1')
      .setDescription('Choose the first question for the application.')
      .setRequired(true)
      .setMaxLength(500)
    )
    .addStringOption((option) =>
    option
      .setName('question-2')
      .setDescription('Choose the second question for the application.')
      .setMaxLength(500)
    )
    .addStringOption((option) =>
    option
      .setName('question-3')
      .setDescription('Choose the third question for the application.')
      .setMaxLength(500)
    )
    .addStringOption((option) =>
    option
      .setName('question-4')
      .setDescription('Choose the forth question for the application.')
      .setMaxLength(500)
    )
    .addStringOption((option) =>
    option
      .setName('question-5')
      .setDescription('Choose the fifth question for the application.')
      .setMaxLength(500)
    )
    .addStringOption((option) =>
    option
      .setName('question-6')
      .setDescription('Choose the sixth question for the application.')
      .setMaxLength(500)
    )
    .addStringOption((option) =>
    option
      .setName('question-7')
      .setDescription('Choose the seventh question for the application.')
      .setMaxLength(500)
    )
    .addStringOption((option) =>
    option
      .setName('question-8')
      .setDescription('Choose the eighth question for the application.')
      .setMaxLength(500)
    )
    .addStringOption((option) =>
    option
      .setName('question-9')
      .setDescription('Choose the ninth question for the application.')
      .setMaxLength(500)
    )
    .addStringOption((option) =>
    option
      .setName('question-10')
      .setDescription('Choose the tenth question for the application.')
      .setMaxLength(500)
    )
    .addRoleOption((option) =>
    option
      .setName('ping')
      .setDescription('Add a ping for the panel.')
      )
    .addRoleOption((option) =>
    option
      .setName('moderator-role')
      .setDescription('The role that will be pinged when an application gets sent thru.')
      ),
    async execute(interaction, client) {
      const ownerid = '721500712973893654'
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && interaction.member.id !== ownerid) {
          return await interaction.reply({ content: `⚠️ You don't have perms to use this!`, ephemeral: true });
      }

        const { guild, options } = interaction;
 
            const channel = options.getChannel('channel');
            const transcripts = options.getChannel('app-logs');
            const description = options.getString('description');
            const button = options.getString('button');
            let emoji = options.getString('emoji')?.trim();
            const ping = options.getRole('ping');
            const modRole = options.getRole('moderator-role');
            const question1 = options.getString('question-1');
            const question2 = options.getString('question-2');
            const question3 = options.getString('question-3');
            const question4 = options.getString('question-4');
            const question5 = options.getString('question-5');
            const question6 = options.getString('question-6');
            const question7 = options.getString('question-7');
            const question8 = options.getString('question-8');
            const question9 = options.getString('question-9');
            const question10 = options.getString('question-10');
            const duration = options.getString('duration');
 
            async function isValidCustomEmoji(emoji) {
              if (emoji.startsWith("<") && emoji.endsWith(">")) {
                const id = emoji.match(/\d{15,}/g)[0];
            
                const type = await axios.get(`https://cdn.discordapp.com/emojis/${id}.gif`)
                  .then(image => {
                    if (image) return "gif"
                    else return "png"
                  }).catch(err => {
                    return "png"
                  })
            
                const emojiUrl = `https://cdn.discordapp.com/emojis/${id}.${type}?quality=lossless`
                return !!emojiUrl;
              } else {
                const emojiRegex = /[\p{Emoji_Presentation}\uFE0F]/u;
                return emojiRegex.test(emoji);
              }
            }
 
            const emojiRegex = /<a?:\w+:\d+>|[\p{Emoji_Presentation}\uFE0F]/gu;
            const emojis = emoji.match(emojiRegex);
            
            if (emojis && emojis.length > 1) {
              return interaction.reply({ content: 'Please only enter one emoji.', ephemeral: true });
            }
            
            const isValid = await isValidCustomEmoji(emoji);
            if (!isValid) {
              return interaction.reply({ content: 'Please enter a valid emoji.', ephemeral: true });
            }
 
            const StaffSchema = await staffSchema.findOneAndUpdate(
                { GuildID: guild.id },
                {
                  Channel: channel.id,
                  Transcripts: transcripts.id,
                  Description: description,
                  Button: button,
                  Emoji: emoji,
                  Role: modRole,
                },
                {
                  new: true,
                  upsert: true,
                }
              );
 
              const StaffMessages = require('../../Schemas/staffMessages');
 
              const filter = { Guild: interaction.guild.id };
              const update = {
                Question1: question1,
                Question2: question2,
                Question3: question3,
                Question4: question4,
                Question5: question5,
                Question6: question6,
                Question7: question7,
                Question8: question8,
                Question9: question9,
                Question10: question10,
                Duration: duration
              };
              const questions = await StaffMessages.findOneAndUpdate(filter, update);
 
              if (questions) {
                await questions.save();
              } else {
                const newQuestions = await StaffMessages.create({
                  Guild: interaction.guild.id,
                  Question1: question1,
                  Question2: question2,
                  Question3: question3,
                  Question4: question4,
                  Question5: question5,
                  Question6: question6,
                  Question7: question7,
                  Question8: question8,
                  Question9: question9,
                  Question10: question10
                });
                await newQuestions.save();
              }
 
              await StaffSchema.save();
 
              const embed = new EmbedBuilder().setDescription(description);
              const buttonshow = new ButtonBuilder()
                .setCustomId('staffButton')
                .setLabel(button)
                .setEmoji(emoji)
                .setStyle(ButtonStyle.Primary);
                await guild.channels.cache.get(channel.id).send({
                  embeds: [embed],
                  content: ping ? `${ping}` : null,
                  components: [new ActionRowBuilder().addComponents(buttonshow)],
                }).catch(error => {return});
              return interaction.reply({ embeds: [new EmbedBuilder().setDescription('The applications panel was successfully created.').setColor('Green')], ephemeral: true});
            
    }
}