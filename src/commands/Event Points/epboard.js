const { EmbedBuilder, SlashCommandBuilder } = require('@discordjs/builders');
const { epModel } = require('../../Schemas/ep');
const { google } = require('googleapis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('epboard')
        .setDescription('The top weekly and total EP users!'),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        // Fetch data from the database
        const data = await epModel.findOne({ Guild: interaction.guild.id, Name: 'EP' });

        if (!data) {
            await interaction.editReply('No EP data found for this server.');
            return;
        }

        const { Sheetid, Range, Weeklyoffset, Totaloffset } = data;

        console.log('Sheet ID:', Sheetid);
        console.log('EP Board command started');

        try {
            // Initialize Google Sheets API
            const auth = new google.auth.GoogleAuth({
                keyFile: 'credentials.json',
                scopes: 'https://www.googleapis.com/auth/spreadsheets',
            });
            const sheets = google.sheets({ version: 'v4', auth });

            // Fetch data from the spreadsheet
            const res = await sheets.spreadsheets.values.get({
                spreadsheetId: Sheetid,
                range: Range,
            });

            const values = res.data.values;

            if (!values || values.length === 0) {
                await interaction.editReply('No data found in the spreadsheet.');
                return;
            }

            // Parse and process data
            const leaderboard = [];
            const weeklyLeaderboard = [];
            
            for (let rIndex = 0; rIndex < values.length; rIndex++) {
                const row = values[rIndex];
                if (row.length < Totaloffset + 1) continue; // Skip rows that don't have enough columns

                let username = row[0]; // Assuming username is in the first column
                if (!username || username.trim() === '') continue;

                // Get EP values
                const totalEp = parseInt(row[Totaloffset] || '0', 10);
                const weeklyEp = parseInt(row[Weeklyoffset] || '0', 10);

                if (totalEp > 0) {
                    leaderboard.push({ username, totalEp });
                }
                if (weeklyEp > 0) {
                    weeklyLeaderboard.push({ username, weeklyEp });
                }
            }

            // Sort leaderboards
            leaderboard.sort((a, b) => b.totalEp - a.totalEp);
            weeklyLeaderboard.sort((a, b) => b.weeklyEp - a.weeklyEp);

            // Create embed message
            const embed = new EmbedBuilder()
                .setAuthor({ name: interaction.user.username })
                .setTitle('EP Leaderboard')
                .setColor(0x00fff6);

            const topWeeklyEpUsers = weeklyLeaderboard.slice(0, 3).map((member, index) => {
                return `${getRankText(index)} ${index + 1} - Weekly EP: ${member.username} (*${member.weeklyEp} Weekly EP*)`;
            }).join('\n');

            const topTotalEpUsers = leaderboard.slice(0, 3).map((member, index) => {
                return `${getRankText(index)} ${index + 1} - Total EP: ${member.username} (*${member.totalEp} EP*)`;
            }).join('\n');

            const description = `**Top Weekly EP Users:**\n${topWeeklyEpUsers}\n\n**Top Total EP Users:**\n${topTotalEpUsers}`;

            embed.setDescription(description)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

            // Send response
            if (!interaction.replied) {
                await interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error fetching data from Google Sheets:', error);
            if (!interaction.replied) {
                await interaction.editReply('An error occurred while fetching data from Google Sheets.');
            }
        }

        // Function to get rank text
        function getRankText(index) {
            if (index === 0) {
                return ':first_place:';
            } else if (index === 1) {
                return ':second_place:';
            } else if (index === 2) {
                return ':third_place:';
            } else {
                return `${index + 1}th`;
            }
        }
    },
};
