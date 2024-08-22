const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { google } = require('googleapis');
const Discord = require('discord.js');
let logchannel = null;
let { epModel, Name, Guild, Sheetid, Range, Weeklyoffset, Totaloffset } = require('../../Schemas/ep');
const { logchannelModel } = require('../../Schemas/logchannel');

module.exports = {
    officer: true,
    data: new SlashCommandBuilder()
        .setName('resetep')
        .setDescription('Resets the weekly EP.')
        .setDMPermission(false),
    async execute(interaction) {
        var logdata = await logchannelModel.find({ Guild: interaction.guild.id });
        var data = await epModel.find({ Guild: interaction.guild.id, Name: 'EP' });
        var values = [];
        await data.forEach(async value => {
            if (!value.Name) return;
            else {
                values.push(Sheetid = value.Sheetid, Range = value.Range, Weeklyoffset = value.Weeklyoffset, Totaloffset = value.Totaloffset);
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

        if (!guild) {
            console.error('Guild not found');
            return;
        }

        // Set up your authentication and the Google Sheets client
        const auth = new google.auth.GoogleAuth({
            keyFile: 'credentials.json', // Use your credentials file
            scopes: 'https://www.googleapis.com/auth/spreadsheets',
        });

        const sheets = google.sheets({ version: 'v4', auth });

        const range = Range;

        // Debug statement 1: Check if the command starts
        console.log('Command started');

        // Debug statement 2: Check if the Google Sheets API is being called
        console.log('Calling Google Sheets API');

        // Fetch data from Google Sheets
        try {
            const res = await sheets.spreadsheets.values.get({
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
                    const modifiedRow = [...row]; // Copy the current row
                    const currentNickname = row[0];

                    if (currentNickname) {
                        // Clean up the currentNickname by removing extra spaces and special characters
                        const cleanedCurrentNickname = currentNickname.trim().replace(/[^\w\s]/gi, '');

                        // Check if it's a valid nickname
                        if (cleanedCurrentNickname.length > 0) {
                            // Calculate the column for the first EP, which should be Weeklyoffset
                            const firstEpColumn = Weeklyoffset;

                            if (values[rowIndex][firstEpColumn] > 0) {
                                // Reset the first EP to zero
                                modifiedRow[firstEpColumn] = '0';
                            }
                        }
                    }

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

                const logEmbed = new EmbedBuilder()
                    .setColor(0x34c759) // Green color
                    .setTitle('EP Reset Command in testing sheet')
                    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                    .setDescription('Weekly EP reset for all users.')
                    .addFields(
                        { name: 'Command Issued by', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'User Affected', value: 'All Users', inline: true }
                    )
                    .setFooter({ text: 'Command executed' })
                    .setTimestamp(new Date());

                // Send the log message to the log channel
                const logChannel = guild.channels.cache.get(logchannel);
                if (logChannel instanceof Discord.TextChannel) {
                    await logChannel.send({ embeds: [logEmbed] });
                }

                console.log('EPs reset for all users');
                const replyEmbed = new EmbedBuilder()
                    .setColor(0x34c759)
                    .setTitle('EP Reset')
                    .setDescription('EPs have been reset for all users.')
                    .setTimestamp()
                    .setFooter({ text: `resetep | SSU Bot` }); // Set your bot's name here
                await interaction.reply({ embeds: [replyEmbed] });
            } else {
                // Debug statement 4: Check if the data is not found
                console.log('Spreadsheet data not found.');
                const embed = new EmbedBuilder()
                    .setColor('#ffcc00')
                    .setTitle('Spreadsheet Data Not Found')
                    .setDescription('Could not find data in the specified spreadsheet range.')
                    .setTimestamp()
                    .setFooter({ text: `resetep | SSU Bot` }); // Set your bot's name here
                await interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            // Debug statement 5: Check if an error occurs
            console.error('Error resetting EPs in Google Sheets:', error);
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Error Resetting EPs')
                .setDescription('An error occurred while resetting EPs in Google Sheets.')
                .setTimestamp()
                .setFooter({ text: `resetep | SSU Bot` }); // Set your bot's name here
            await interaction.reply({ embeds: [embed] });
        }
    },
};
