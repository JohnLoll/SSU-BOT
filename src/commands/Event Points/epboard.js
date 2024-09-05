const { EmbedBuilder, SlashCommandBuilder } = require('@discordjs/builders');
const { epModel } = require('../../Schemas/ep');
const { google } = require('googleapis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('epboard')
        .setDescription('The top weekly and total EP users!')
        .setDMPermission(false),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
    
        const data = await epModel.findOne({ Guild: interaction.guild.id, Name: 'EP' });

        if (!data) {
            const errorEmbed = new EmbedBuilder()
                  .setTitle('Error')
                  .setDescription('No EP data found for this server.')
                  .setColor(0xff0000);
                   await interaction.editReply({ embeds: [errorEmbed] });
            return;
        }

        const { Sheetid, Range, Weeklyoffset, Totaloffset } = data;

        console.log('Sheet ID:', Sheetid);
        console.log('EP Board command started');

        try {
 
            const auth = new google.auth.GoogleAuth({
                keyFile: 'credentials.json',
                scopes: 'https://www.googleapis.com/auth/spreadsheets',
            });
            const sheets = google.sheets({ version: 'v4', auth });

           
            const res = await sheets.spreadsheets.values.get({
                spreadsheetId: Sheetid,
                range: Range,
            });

            const values = res.data.values;

            if (!values || values.length === 0) {
                const errorEmbed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription('No data found in the spreadsheet.')
                .setColor(0xff0000);
                 await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }

       
            const leaderboard = [];
            const weeklyLeaderboard = [];
            
            for (let rIndex = 0; rIndex < values.length; rIndex++) {
                const row = values[rIndex];
                if (row.length < Totaloffset + 1) continue; 

                let username = row[0];
                if (!username || username.trim() === '') continue;

            
                const totalEp = parseInt(row[Totaloffset] || '0', 10);
                const weeklyEp = parseInt(row[Weeklyoffset] || '0', 10);

                if (totalEp > 0) {
                    leaderboard.push({ username, totalEp });
                }
                if (weeklyEp > 0) {
                    weeklyLeaderboard.push({ username, weeklyEp });
                }
            }

         
            leaderboard.sort((a, b) => b.totalEp - a.totalEp);
            weeklyLeaderboard.sort((a, b) => b.weeklyEp - a.weeklyEp);

         
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
            .setFooter({
                text: `${interaction.commandName} | ${interaction.client.user.username}`,
                iconURL: interaction.client.user.displayAvatarURL()
              });

         
            if (!interaction.replied) {
                await interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error fetching data from Google Sheets:', error);
            if (!interaction.replied) {
                const errorEmbed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription('An error occurred while fetching data from Google Sheets.')
                .setColor(0xff0000);
                 await interaction.editReply({ embeds: [errorEmbed] });
            }
        }

       
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
