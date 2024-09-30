const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
let { epModel, Name, Guild, Sheetid, Range, Weeklyoffset, Totaloffset } = require('../../Schemas/ep');

const { google } = require('googleapis');
const axios = require('axios');
const your_channel_id = '1069723801916547123';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('View the user\'s information.')
    .addUserOption(option => option.setName('user').setDescription('The user to get the info of.').setRequired(false))
    .setDMPermission(false),
  async execute(interaction) {
    // Fetch EP data settings from your database
    var data = await epModel.find({ Guild: interaction.guild.id, Name: 'EP' });
    var values = [];
    await data.forEach(async value => {
      if (!value.Name) return;
      else {
        values.push(Sheetid = value.Sheetid, Range = value.Range, Weeklyoffset = value.Weeklyoffset, Totaloffset = value.Totaloffset);
      }
    });


    let totalEps = 0;
    let weeklyEps = 0;

    let userFound = false; 

 
    let targetUser = interaction.options.getMember('user') || interaction.member;
    if (!targetUser) {
      targetUser = interaction.member;
    }

    await interaction.deferReply();
    const officer = interaction.guild.members.cache.get(targetUser.id);
    const officerNickname = officer.nickname || officer.user.username;
    const officerNicknameWithoutTimezone = officerNickname.replace(/\s*\|.*$/, '');

    const auth = new google.auth.GoogleAuth({
      keyFile: 'credentials.json', // Use your credentials file
      scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const range = Range; 

    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: Sheetid,
        range,
      });

      const values = res.data.values;

      if (values) {
        console.log('Searching in the specified range:');
        for (let rIndex = 0; rIndex < values.length; rIndex++) {
          const row = values[rIndex];
          for (let cIndex = 0; cIndex < row.length; cIndex++) {
            const currentNickname = row[cIndex];
            const currentNicknameWithoutTimezone = currentNickname.replace(/\s*\|.*$/, '');
            if (currentNicknameWithoutTimezone) {
              const cleanedCurrentNickname = currentNicknameWithoutTimezone.trim();
              const officerNicknameLower = officerNicknameWithoutTimezone.trim().toLowerCase();
              if (cleanedCurrentNickname.toLowerCase() === officerNicknameLower) {
                totalEps = parseInt(row[cIndex + Totaloffset]);
                weeklyEps = parseInt(row[cIndex + Weeklyoffset]);
                console.log('User found in the sheet');
                console.log('User\'s Total EP:', totalEps);
                console.log('User\'s Weekly EP:', weeklyEps);
                const robloxUsername = officerNicknameWithoutTimezone; 
                const userIdResponse = await axios.post('https://users.roblox.com/v1/usernames/users', {
                  usernames: [robloxUsername]
                });
                const robloxUserId = userIdResponse.data.data[0].id;
                const friendsCountResponse = await axios.get(`https://friends.roblox.com/v1/users/${robloxUserId}/friends/count`);
                const followersCountResponse = await axios.get(`https://friends.roblox.com/v1/users/${robloxUserId}/followers/count`);

                const friendsCount = friendsCountResponse.data.count || 'N/A';
                const followersCount = followersCountResponse.data.count || 'N/A';

                const joinDate = officer.joinedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

               
                const channel = interaction.guild.channels.cache.get(your_channel_id);
                if (!channel) {
                  const errorEmbed = new EmbedBuilder()
                  .setTitle('Error')
                  .setDescription(`The specified event logs channel does not exist.`)
                  .setColor(0xff0000);
                   interaction.editReply({ embeds: [errorEmbed] });
                  return;
                }

             
                const today = new Date();
                const dayOfWeek = today.getDay();
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - dayOfWeek);

                const messages = await channel.messages.fetch({ limit: 100 }).catch(err => {
                  console.error('Error fetching messages:', err);
                  const errorEmbed = new EmbedBuilder()
              .setTitle('Error')
              .setDescription(`An error occurred while fetching messages from the channel.`)
              .setColor(0xff0000);
               interaction.editReply({ embeds: [errorEmbed] });
                  return;
                });

                if (!messages) return;

                let weeklyEventsHosted = 0;

                const rolesString = '1070129491483033732,1069748926565068810,1069748871225425960,1232175887084949605'; 
                const rolesArray = rolesString.split(',');

                const userHasRole = rolesArray.some(role => targetUser.roles.cache.has(role));

                if (userHasRole) {
                  const eventMessages = messages.filter(msg =>
                    msg.author.id === targetUser.id &&
                    !msg.attachments.some(att => att.contentType && att.contentType.startsWith('image')) &&
                    msg.createdAt >= startOfWeek
                  );
                  weeklyEventsHosted = eventMessages.size;
                } else {
                  const mentionMessages = messages.filter(msg =>
                    msg.mentions.has(targetUser.id) &&
                    msg.createdAt >= startOfWeek
                  );
                  weeklyEventsHosted = mentionMessages.size;
                }

                const fields = [
                  { name: 'Username', value: officerNicknameWithoutTimezone, inline: true },
                  { name: 'Roblox ID', value: robloxUserId, inline: true },
                  { name: 'Discord', value: `<@${targetUser.id}>`, inline: true },
                  { name: ' ', value: ' ', inline: false },
                  { name: 'Statistics', value: `Friends: ${friendsCount}\nFollowers: ${followersCount}\nJoin Date: ${joinDate}\n`, inline: false },
                  { name: ' ', value: ' ', inline: false },
                  { name: 'Weekly EP', value: weeklyEps, inline: true },
                  { name: 'Total EP', value: totalEps, inline: true }
                ];

                if (userHasRole) {
                  fields.push({ name: 'Events Hosted This Week', value: weeklyEventsHosted.toString(), inline: true });
                } else {
                  fields.push({ name: 'Events Attended This Week', value: weeklyEventsHosted.toString(), inline: true });
                }

                console.log('Location: row', rIndex + 60, 'column', String.fromCharCode(65 + cIndex));
                userFound = true;

                // Create the user information embed
                await interaction.editReply({
                  embeds: [{
                    title: `User Information | ${officerNicknameWithoutTimezone}`,
                    color: 0x00FF00,
                    fields: fields,
                    footer: { text: `${interaction.commandName} | ${interaction.client.user.username} `}, 
                  }]
                });
              }
            }
          }
        }
      }

      if (!userFound) {
        const robloxUsername = officerNicknameWithoutTimezone; 
        const userIdResponse = await axios.post('https://users.roblox.com/v1/usernames/users', {
          usernames: [robloxUsername]
        });
        const robloxUserId = userIdResponse.data.data[0].id;
        const friendsCountResponse = await axios.get(`https://friends.roblox.com/v1/users/${robloxUserId}/friends/count`);
        const followersCountResponse = await axios.get(`https://friends.roblox.com/v1/users/${robloxUserId}/followers/count`);

        const friendsCount = friendsCountResponse.data.count || 'N/A';
        const followersCount = followersCountResponse.data.count || 'N/A';

        const joinDate = officer.joinedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

        const fields = [
          { name: 'Username', value: officerNicknameWithoutTimezone, inline: true },
          { name: 'Roblox ID', value: robloxUserId, inline: true },
          { name: 'Discord', value: `<@${targetUser.id}>`, inline: true },
          { name: ' ', value: ' ', inline: false },
          { name: 'Statistics', value: `Friends: ${friendsCount}\nFollowers: ${followersCount}\nJoin Date: ${joinDate}\n`, inline: false },
          { name: ' ', value: ' ', inline: false },
          { name: 'Weekly EP', value: '0', inline: true },
          { name: 'Total EP', value: '0', inline: true }
        ];

    
        const userHasRole = rolesArray.some(role => targetUser.roles.cache.has(role));
        if (!userHasRole) {
      
          const channel = interaction.guild.channels.cache.get(your_channel_id);
          if (channel) {
            const messages = await channel.messages.fetch({ limit: 100 }).catch(err => {
              console.error('Error fetching messages:', err);
              const errorEmbed = new EmbedBuilder()
              .setTitle('Error')
              .setDescription(`An error occurred while fetching messages from the event logs channel.`)
              .setColor(0xff0000);
               interaction.editReply({ embeds: [errorEmbed] });
              return;
            });

            if (messages) {
              const startOfWeek = new Date();
              startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

              const mentionMessages = messages.filter(msg =>
                msg.mentions.has(targetUser.id) &&
                msg.createdAt >= startOfWeek
              );

              const weeklyMentions = mentionMessages.size;
              fields.push({ name: 'Events Attended This Week', value: weeklyMentions.toString(), inline: true });
            }
          }
        }

    
        await interaction.editReply({
          embeds: [{
            title: `User Information | ${officerNicknameWithoutTimezone}`,
            color: 0x00FF00,
            fields: fields,
            footer: { text: `${interaction.commandName} | ${interaction.client.user.username} `},
          }]
        });
      }
    } catch (err) {
      console.error('Error fetching data from Google Sheets:', err);
      const errorEmbed = new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription(`User not found in the EP sheet`)
                    .setColor(0xff0000);
                     await interaction.editReply({ embeds: [errorEmbed] });
      return;
    }
  }
};
