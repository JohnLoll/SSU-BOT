const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder } = require('discord.js');
let { epModel, Name, Guild, Sheetid, Range, Weeklyoffset, Totaloffset } = require('../../Schemas/ep');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('View Event Points')
        .setType(ApplicationCommandType.User),
    async execute(interaction) {
        var data = await epModel.find({ Guild: interaction.guild.id, Name: 'EP' });
        var values = [];
        await data.forEach(async value => {
            if (!value.Name) return;
            else {
                values.push(Sheetid = value.Sheetid, Range = value.Range, Weeklyoffset = value.Weeklyoffset, Totaloffset = value.Totaloffset);
            }
        });
        let targetUser = interaction.targetUser.id;

        if (!targetUser) {
            targetUser = interaction.member;
        }

        const officer = await interaction.guild.members.fetch(targetUser);
        let officerNickname = officer.nickname || officer.user.username;

        // Remove the timezone information from the nickname
        officerNickname = officerNickname.replace(/\s*\[.*\]\s*$/, '');

        console.log('Command started');
        console.log('Calling Google Sheets API');

        try {
            const { google } = require('googleapis');
            const auth = new google.auth.GoogleAuth({
                keyFile: 'credentials.json',
                scopes: 'https://www.googleapis.com/auth/spreadsheets',
            });

            const sheets = google.sheets({ version: 'v4', auth });

            const res = await sheets.spreadsheets.values.get({
                spreadsheetId: Sheetid,
                range: Range,
            });

            console.log('Data retrieved from Google Sheets');

            const values = res.data.values;

            if (values) {
                console.log('Searching in the specified range:');
                let rowIndex;
                let columnIndex;
                let found = false;

                for (let rIndex = 0; rIndex < values.length; rIndex++) {
                    const row = values[rIndex];
                    for (let cIndex = 0; cIndex < row.length; cIndex++) {
                        const currentNickname = row[cIndex];
                        if (currentNickname) {
                            const cleanedCurrentNickname = currentNickname.trim();
                            const officerNicknameLower = officerNickname.trim().toLowerCase();

                            if (cleanedCurrentNickname.toLowerCase() === officerNicknameLower) {
                                const totalEp = parseInt(row[cIndex + Totaloffset]);
                                const weeklyEp = parseInt(row[cIndex + Weeklyoffset]);

                                console.log(`User found in the sheet.`);
                                console.log(`User's Total EP: ${totalEp}`);
                                console.log(`User's Weekly EP: ${weeklyEp}`);
                                console.log(`Location: row ${rIndex + 60}, column ${String.fromCharCode(65 + cIndex)}`);

                                const embed = new EmbedBuilder()
                                    .setTitle(`${officerNickname}'s Event Points`)
                                    .addFields(
                                        { name: 'Total EP', value: `${totalEp}`, inline: true },
                                        { name: 'Weekly EP', value: `${weeklyEp}`, inline: true }
                                        
                                    )
                                    .setColor('Green')
                                    .setFooter({
                                        text: `${interaction.commandName} | ${interaction.client.user.username}`,
                                        iconURL: interaction.client.user.displayAvatarURL()
                                      });

                                await interaction.reply({ embeds: [embed], ephemeral: true });
                                return true;
                            }
                        }
                    }
                }

                if (!found) {
                    console.log(`User with Discord nickname "${officerNickname}" not found in the sheet.`);
                    const errorEmbed = new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription(`User with Discord nickname "${officerNickname}" not found in the sheet.`)
                    .setColor(0xff0000);
                     await interaction.reply({ embeds: [errorEmbed] });
                }
            } else {
                console.log('Spreadsheet data not found.');
                const errorEmbed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription(`Spreadsheet data not found.`)
                .setColor(0xff0000);
                 await interaction.reply({ embeds: [errorEmbed] });
            }
        } catch (error) {
            console.error('Error fetching data from Google Sheets:', error);
            const errorEmbed = new EmbedBuilder()
            .setTitle('Error')
            .setDescription(`An error occurred while fetching data from Google Sheets.`)
            .setColor(0xff0000);
             await interaction.reply({ embeds: [errorEmbed] });
        }
    }
};
