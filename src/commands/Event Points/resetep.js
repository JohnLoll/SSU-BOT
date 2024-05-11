const { SlashCommandBuilder } = require('discord.js');
const { google } = require('googleapis');
const Discord = require('discord.js');
let logchannel = null;
let { epModel, Name, Guild, Sheetid, Range, Weeklyoffset, Totaloffset } = require('../../Schemas/ep');
const { logchannelModel } = require('../../Schemas/logchannel');
module.exports = {
    officer: true,
  data: new SlashCommandBuilder()
    .setName('resetep')
    .setDescription('Resets the weekly EP.'),
  async execute(interaction) {
    var logdata = await logchannelModel.find({ Guild: interaction.guild.id});
    var data = await epModel.find({ Guild: interaction.guild.id, Name: 'EP' });
    var values = [];
                await data.forEach(async value => {
                    if (!value.Name) return;
                    else {
                       
                        values.push(Sheetid = value.Sheetid,Range =  value.Range, Weeklyoffset = value.Weeklyoffset, Totaloffset = value.Totaloffset);
                    }
                });
                var logvalues = [];
                await logdata.forEach(async value => {
                    if (!value.Channel) return;
                    else {
                       
                        logvalues.push(logchannel = value.Channel);
                    }
                });
    const guild = interaction.guild;


  
      const { google } = require('googleapis');
      if (!guild) {
        console.error('Guild not found');
        return;
      }

      // Set up your authentication and the Google Sheets client
      auth = new google.auth.GoogleAuth({
        keyFile: 'credentials.json', // Use your credentials file
        scopes: 'https://www.googleapis.com/auth/spreadsheets',
      });

      sheets = google.sheets({ version: 'v4', auth });

      const range = Range

      // Debug statement 1: Check if the command starts
      console.log('Command started');

      // Debug statement 2: Check if the Google Sheets API is being called
      console.log('Calling Google Sheets API');

      // Fetch data from Google Sheets
      try {
        res = await sheets.spreadsheets.values.get({
          spreadsheetId: Sheetid,
          range,
        });

        // Debug statement 3: Check if data is retrieved from Google Sheets
        console.log('Data retrieved from Google Sheets');

        const values = res.data.values;

        if (values) {
          console.log('Searching in the specified range:');

          // Create a new array to store modified values
          const modifiedValues = [];

          // Iterate through all users in the range
          values.forEach((row, rowIndex) => {
            const modifiedRow = [];
            row.forEach((currentNickname, columnIndex) => {
              if (currentNickname) {
                // Clean up the currentNickname by removing extra spaces and special characters
                const cleanedCurrentNickname = currentNickname.trim().replace(/[^\w\s]/gi, '');

                // Check if it's a valid nickname
                if (cleanedCurrentNickname.length > 0) {
                  // Calculate the column for EP and weekly EP, which are the same column
                  const epColumn = columnIndex + Weeklyoffset;

                  if (values[rowIndex][epColumn] > 0) {
                    // Reset the EP and weekly EP to zero
                    modifiedRow[epColumn] = '0';
                  }
                }
              }
            });

            // Add the modified row to the new array
            modifiedValues.push(modifiedRow);
          });

          // Update only the modified cells in the spreadsheet
          await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: Sheetid,
            resource: {
              data: [
                {
                  range,
                  values: modifiedValues,
                },
              ],
              valueInputOption: 'USER_ENTERED',
            },
          });

          const logEmbed = {
            color: 0x34c759, // Green color
            title: 'EP Reset Command',
            author: {
              name: interaction.user.tag,
              icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
            },
            description: 'Weekly EP reset for all users.',
            fields: [
              {
                name: 'Command Issued by',
                value: `<@${interaction.user.id}>`,
                inline: true,
              },
              {
                name: 'User Affected',
                value: 'All Users',
                inline: true,
              },
            ],
            footer: {
              text: 'Command executed',
            },
            timestamp: new Date(),
          };

          // Send the log message to the log channel
          const logChannel = guild.channels.cache.get(logchannel);
          if (logChannel instanceof Discord.TextChannel) {
            await logChannel.send({ embeds: [logEmbed] });
          }

          console.log('EPs reset for all users');
          await interaction.reply('EPs reset for all users.');
        } else {
          // Debug statement 4: Check if the data is not found
          console.log('Spreadsheet data not found.');
          await interaction.reply('Spreadsheet data not found.');
        }
      } catch (error) {
        // Debug statement 5: Check if an error occurs
        console.error('Error resetting EPs in Google Sheets:', error);
        await interaction.reply('An error occurred while resetting EPs in Google Sheets.');
      }
   
  },
};
