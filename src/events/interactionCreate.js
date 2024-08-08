const { Interaction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, PermissionsBitField } = require("discord.js");
const Discord = require('discord.js');
const block = require('../Schemas/blockcmd');
const modrole = require('../Schemas/modrole');
const officerrole = require('../Schemas/officerrole');

const ownerid = '721500712973893654'
module.exports = {
    name: 'interactionCreate',
    officer: true,
    async execute(interaction, client) {

        if (interaction.customId) {
            
            if (interaction.customId.includes("bugSolved - ")) {
                var stringId = interaction.customId;
                stringId = stringId.replace("bugSolved - ", "");

                var member = await client.users.fetch(stringId);
                await member.send(`🌍 This message was initialized by the developers indicating that the bug you reported has been solved.`).catch(err => {});
                await interaction.reply({ content: `🌍 I have notified the member that their report is now solved.`, ephemeral: true });
                await interaction.message.delete().catch(err => {});
            }
        }
        if (interaction.customId) {
            if (interaction.customId.includes("denied - ")) {
                var stringId = interaction.customId;
                stringId = stringId.replace("denied - ", "");

                var member = await client.users.fetch(stringId);
                await member.send(`❌ Your guarding log that you requested has been DENIED.`).catch(err => {});
                await interaction.reply({ content: `🌍 I have notified the member that their guard log is denied.`, ephemeral: true });
                await interaction.message.delete().catch(err => {});
            }
        }
        if (interaction.customId) {
            let staffmember = null;
            let { epModel, Sheetid, Range, Weeklyoffset, Totaloffset } = require('../Schemas/ep');
let logchannel = null;
const { logchannelModel } = require('../Schemas/logchannel');
            if (interaction.customId.includes("approved - ")) {
                var stringId = interaction.customId;
                stringId = stringId.replace("approved - ", "");
        
                var member = await client.users.fetch(stringId);
                
                // Fetch the guild member to get the nickname
                var guild = await client.guilds.fetch('1069439785984344096');
                var guildMember = await guild.members.fetch(stringId);
        staffmember = interaction.user.id
                console.log(`User's nickname in the server: ${guildMember.nickname || guildMember.user.username}`);
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
  
   
   
                const amountToAdd = 1;
                await addep(guildMember.nickname, amountToAdd)
                function getColumnLetter(columnIndex) {
                    let letter = '';
                  
                    while (columnIndex >= 0) {
                      const remainder = columnIndex % 26;
                      letter = String.fromCharCode(65 + remainder) + letter;
                      columnIndex = Math.floor(columnIndex / 26) - 1;
                    }
                  
                    return letter;
                  }
                async function addep(officerNickname, amountToAdd){
                  try {
                   
                
                    const { google } = require('googleapis');
                    
                      const range = Range;
                      const auth = new google.auth.GoogleAuth({
                        keyFile: 'credentials.json', // Use your credentials file
                        scopes: 'https://www.googleapis.com/auth/spreadsheets',
                      });
                      const sheets = google.sheets({ version: 'v4', auth });
                      const res = await sheets.spreadsheets.values.get({
                        spreadsheetId : Sheetid,
                        range,
                      });
                
                      const values = res.data.values;
                
                      if (values) {
                        let rowIndex;
                        let found = false;
                        let modifiedCells = [];
                
                        for (let rIndex = 0; rIndex < values.length; rIndex++) {
                          rowIndex = rIndex;
                
                          const row = values[rIndex];
                
                          for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
                            const currentNickname = row[columnIndex];
                
                            if (currentNickname) {
                            const cleanedCurrentNickname = currentNickname.trim().replace(/[^\w\s]/gi, '');
                            const officerNicknameLower = officerNickname.trim().replace(/[^\w\s]/gi, '').toLowerCase();
                
                            if (cleanedCurrentNickname.toLowerCase() === officerNicknameLower) {
                              const weeklyPointsColumn = columnIndex + Weeklyoffset;
                              const totalPointsColumn = columnIndex + Totaloffset;
                
                              const currentWeeklyPoints = parseInt(values[rowIndex][weeklyPointsColumn]);
                              const currentTotalPoints = parseInt(values[rowIndex][totalPointsColumn]);
                
                              const newWeeklyPoints = currentWeeklyPoints + amountToAdd;
                              const newTotalPoints = currentTotalPoints + amountToAdd;
                
                              values[rowIndex][weeklyPointsColumn] = newWeeklyPoints.toString();
                              values[rowIndex][totalPointsColumn] = newTotalPoints.toString();
                
                              const weeklyColumnLetter = getColumnLetter(weeklyPointsColumn + 1);
                              const totalColumnLetter = getColumnLetter(totalPointsColumn + 2);
              
                              modifiedCells.push({
                                range: `${weeklyColumnLetter}${rowIndex + 6}:${totalColumnLetter}${rowIndex + 6}`,
                                values: [[newWeeklyPoints.toString(), newTotalPoints.toString()]],
                              });
                              
              console.log(`${weeklyColumnLetter}${rowIndex + 6}:${totalColumnLetter}${rowIndex + 6}`);
                              found = true;
                              break;
                            }
                          }
                        }
              
                        if (found) {
                          break;
                        }
                      }
                        if (found) {
                          // Update only the modified cells
                          await sheets.spreadsheets.values.batchUpdate({
                            spreadsheetId: Sheetid,
                            resource: {
                              data: modifiedCells,
                              valueInputOption: 'USER_ENTERED',
                            },
                          });
                        } else {
                          console.log(`User with Discord nickname "${officerNickname}" not found in the spreadsheet.`);
                          //interaction.channel.send(`User with Discord nickname "${officerNickname}" not found in the range: ${range}`);
                          return;
                        }
                      } else {
                        console.log('Spreadsheet data not found.');
                      }
                    
                  } catch (error) {
                    console.error('Error adding points to the spreadsheet:', error);
                  }
                  console.log(`Added **${amountToAdd}** event points to ${officerNickname}`);
                  //interaction.channel.send(`Added **${amountToAdd}** Event Points to ${officerNickname}`);
                  const guilds =interaction.guild
       
     
                  const logEmbed = {
                    color: 0xff0000, // Red color
                    title: 'Guard Log Approved',
                    description: 'Guard Log Approved',
                    fields: [
                      {
                        name: 'Staff Memnber',
                        value: `<@${staffmember}>`,
                        inline: true,
                      },
                      {
                        name: 'Users Affected',
                        value: `<@${stringId}>`,
                        inline: true,
                      },
                      {
                        name: 'Amount Added',
                        value: `1`,
                        inline: true,
                      },
                    ],
                    footer: {
                      text: 'Command executed',
                    },
                    timestamp: new Date(),
                  };
                  
                      // Send the log message to the log channel
                       const logChannel = guilds.channels.cache.get(logchannel);
                      if (logChannel instanceof Discord.TextChannel) { // Use 'Discord.TextChannel' to check if it's a text channel
                        await logChannel.send({ embeds: [logEmbed] });
                      }
                }
            
                await member.send(`✅ Your guarding log that you requested has been APPROVED. You received 1 Event Point for guarding.`).catch(err => {});
                await interaction.reply({ content: `🌍 I have notified the member that their guard log is approved.`, ephemeral: true });
                await interaction.message.delete().catch(err => {});
            }
 
        }
        
        if (!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (command.owner == true) {
            if (interaction.user.id !== '721500712973893654') return await interaction.reply({ content: `You cant use this command`, ephemeral: true });
        }

        //block cmd 
        try {
            var data = await block.find({ Guild: interaction.guild.id });
            var match = [];
            await data.forEach(async value => {
                if (value.Command == interaction.commandName) return match.push(value);
            });
    
            //mod role
            if (command.mod) {
                const modRoleData = await modrole.find({ Guild: interaction.guild.id });
            
                let check = false;
            
                // Check if the user has a specific role
                if (modRoleData.length > 0) {
                    const mRoles = interaction.member.roles.cache.map(role => role.id);
                    for (const value of modRoleData) {
                        if (mRoles.includes(value.Role)) {
                            check = true;
                            break;
                        }
                    }
                }
            
                // Check if the user has the specific user ID or is an administrator
                if (interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    userHasCompanyRole = true;
                } else if(interaction.user.id === ownerid) 
                    userHasCompanyRole = true;
                
            
                if (!check) {
                    return await interaction.reply({
                        content: `⚠️ Only **moderators** can use this command!`,
                        ephemeral: true
                    });
                }
            }
          // officer role
          if (command.officer) {
            try {
                // Fetch officer role data
                var officerRoleData = await officerrole.find({ Guild: interaction.guild.id });
                
                if (officerRoleData.length > 0) {
                    var userHasCompanyRole = false;
                    
                    // Check if the user is an administrator
                    if (interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                        userHasCompanyRole = true;
                    } else if (interaction.user.id === interaction.guild.ownerId) {
                        userHasCompanyRole = true;
                    } else {
                        // Iterate through each officer role configuration
                        for (const value of officerRoleData) {
                            // Iterate through the user's roles
                            for (const userRole of interaction.member.roles.cache.values()) {
                                // Check if the user has a role that matches any role in the company's role array
                                if (value.Role.includes(userRole.id)) {
                                    userHasCompanyRole = true;
                                    break; // Exit the loop if a match is found
                                }
                            }
                            if (userHasCompanyRole) {
                                break; // Exit the loop if a match is found
                            }
                        }
                    }
                    
                    if (!userHasCompanyRole) {
                        return await interaction.reply({ content: `⚠️Only **Officers** can use this command !`, ephemeral: true });
                    }
                } else {
                    console.log('No officer role data found.');
                }
            } catch (error) {
                console.error('Error fetching officer roles:', error);
                return await interaction.reply({ content: `⚠️ An error occurred while checking roles. Please try again later.`, ephemeral: true });
            }
        }

            if (match.length > 0) {
                return await interaction.reply({ content: `⚠️ Sorry! Looks like the server has this command **blocked from use!**`, ephemeral: true });
            }
            //
        } catch (e) {
            console.log(e);
        }
        

        if (!command) return
        
        //error handling
        try{
            const cmd = await command.execute(interaction, client);
        } catch (error) {
            console.log(error);
            await interaction.reply({
                content: 'There was an error while executing this command!', 
                ephemeral: true
            }).catch(err => {});


            //error flag system
            var guild = interaction.guild;
            var member = interaction.member;
            var channel = interaction.channel;
            var errorTime = `<t:${Math.floor(Date.now() / 1000)}:R>`;

            const sendChannel = await client.channels.fetch('1170500543504982016');
            const options = interaction.options.data.map(option => {
              return `${option.name}: ${option.value}`;
          }).join('\n') || 'No options provided';
            const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setTitle(`⚠️ Flagged Error!`)
            .setDescription('An error has been flagged while using a slash command.  All other forms of interaction will not be logged with this system')
            .addFields({ name: "Error Command", value: `\`${interaction.commandName}\``})
            .addFields({ name: "Error Stack", value: `\`${error.stack}\``})
            .addFields({ name: "Error Message", value: `\`${error.message}\``})
            .addFields({ name: "Command Options", value: `\`${options}\``, inline: true })
            .addFields({ name: "Error Timestamp", value: `${errorTime}`})
            .setFooter({ text: `Error Flag System`})
            .setTimestamp();

           

            const msg = await sendChannel.send({ embeds: [embed]}).catch(err => {});

           

            collector.on('collect', async i => {
                if (i.customId == 'fetchErrorUserInfo') {
                    const userEmbed = new EmbedBuilder()
                    .setColor("Blurple")
                    .addFields({ name: "Error Guild", value: `\`${guild.name} (${guild.id})\``})
                    .addFields({ name: "Error User", value: `\`${member.user.username} (${member.id})\``})
                    .addFields({ name: "Error Command Channel", value: `\`${channel.name} (${channel.id})\``})
                    .setDescription('This user has triggered a slash command error while using one of the commands listed above.')
                    .setTimestamp();

                    await i.reply({ embeds: [userEmbed], ephemeral: true });
                }
            });

            collector.on('end', async () => {
                button.setDisabled(true);
                embed.setFooter({ text: "Error Flag System -- your user fetch button has expired."});
                await msg.edit({ embeds: [embed]});
            });

        } 

    },
    


};