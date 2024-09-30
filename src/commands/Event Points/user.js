const { EmbedBuilder } = require('@discordjs/builders');
let { epModel, Name, Guild, Sheetid, Range, Weeklyoffset, Totaloffset, Trooperrange, Trooperstart } = require('../../Schemas/ep');
const { logchannelModel } = require('../../Schemas/logchannel');
const axios = require('axios');
const { REST, Routes } = require('discord.js');
const Discord = require('discord.js');
let logchannel = null;
let officerNickname = null;


const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  officer: true,
    data: new SlashCommandBuilder()
    .setName('users')
    .setDescription('Manage users in the EP sheet.') .addStringOption(option =>
        option.setName('action')
            .setDescription('How would you like to manage the users in the EP sheet?')
            .setRequired(true)
            .addChoices(
                { name: 'Add', value: 'Add' },
                { name: 'Remove', value: 'Remove' },
            ))
            .addStringOption(option =>
              option.setName('user')
              .setDescription('The user to add/remove from the EP sheet.')
              .setRequired(true))
              .setDMPermission(false),
  async execute(interaction) {
    interaction.reply('Please wait...');
    var logdata = await logchannelModel.find({ Guild: interaction.guild.id});
      var data = await epModel.find({ Guild: interaction.guild.id, Name: 'EP' });
      var values = [];
                  await data.forEach(async value => {
                      if (!value.Name) return;
                      else {
                         
                          values.push(Sheetid = value.Sheetid,Range =  value.Range, Weeklyoffset = value.Weeklyoffset, Totaloffset = value.Totaloffset, Trooperrange = value.Trooperrange, Trooperstart = value.Trooperstart);
                      }
                  });
                  var logvalues = [];
                  await logdata.forEach(async value => {
                      if (!value.Channel) return;
                      else {
                         
                          logvalues.push(logchannel = value.Channel);
                      }
                  });
                  function getNicknameWithoutTimezone(user) {
                    const nickname = user.nickname || user.user.username;
                    return nickname.replace(/\s*\|.*$/, ''); // Remove everything including "|" and to the right of it
                }
                const action = interaction.options.getString('action');
                const mentionedUsersString = interaction.options.getString('user');
                const mentionedUsers = mentionedUsersString.match(/(\d+)/g); 
                for (const mentionedUserId of mentionedUsers) {
                  console.log(`Processing mentioned user ID: ${mentionedUserId}`);
                  try {
                    const officer = interaction.guild.members.cache.get(mentionedUserId); // No need to trim, as IDs don't have leading/trailing spaces
                    officerNickname = getNicknameWithoutTimezone(officer);
                    console.log(`Officer nickname: ${officerNickname}`);
                } catch (error) {
                    console.error(`Error sending DM to ${officerNickname}: ${error}`);
                }
                

                
                 
                    if (action === 'Add') {
                        await AddUser(interaction, Sheetid, officerNickname);
                       
                    } else if (action === 'Remove') 

                        await RemoveUser(interaction, Sheetid, officerNickname);
                          console.log('User removed from CEP successfully');
                       
                      
                    }
                                
                  const logEmbed = {
                    color: 0xff0000,
                    title: 'User command.',
    
                    fields: [
                      {
                        name: 'Command Issued by',
                        value: `<@${interaction.user.id}>`,
                        inline: true,
                      },
                      {
                        name: 'User Affected',
                        value: `${officerNickname}`,
                        inline: true,
                      },
                      {
                        name: 'Action',
                        value: `${action}`,
                        inline: true,
                      },
                    ],
                    footer: {
                      text: 'Logging System',
                    },
                    timestamp: new Date(),
                  };
              
                  
                  const guild = interaction.guild
                  const logChannel = guild.channels.cache.get(logchannel);
                  if (logChannel instanceof Discord.TextChannel) { 
                    await logChannel.send({ embeds: [logEmbed] });
                  }
                }
            }
 

            async function AddUser(interaction, spreadsheetId, officerNickname) {
                try {
                  
                  const { google } = require('googleapis');
                  const auth = new google.auth.GoogleAuth({
                    keyFile: 'credentials.json', 
                    scopes: 'https://www.googleapis.com/auth/spreadsheets',
                  });
                  const sheets = google.sheets({ version: 'v4', auth });
                  const res = await sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range: Trooperrange,
                  });
              
                  const values = res.data.values;
              

                  let foundEmptyRow = false;
                  let newRowIndex;
              
                  for (let rowIndex = 0; rowIndex < values.length; rowIndex++) {
                    const row = values[rowIndex];
              
                   
                    if (!row[0]) {
                      foundEmptyRow = true;
                      newRowIndex = rowIndex;
              
      
                      const newRow = new Array(values[0].length).fill('');
                      newRow[0] = officerNickname;
                      newRow[Weeklyoffset] = '0';
                      newRow[Totaloffset] = '0';
              
                    
                      const match = Trooperrange.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
              
                      if (!match) {
                        throw new Error('Invalid cepRange format');
                      }
              
                      const startColumn = match[1];
                      const startRow = parseInt(match[2], 10);
                      const endColumn = match[3];
              
                  
                      values[newRowIndex] = newRow;
              
                
                      await sheets.spreadsheets.values.update({
                        spreadsheetId: Sheetid,
                        range: `${startColumn}${newRowIndex + startRow}:${endColumn}${newRowIndex + startRow}`, 
                        valueInputOption: 'USER_ENTERED',
                        resource: { values: [newRow] },
                      });
              
                      break;
                    }
                  }
              
                  if (foundEmptyRow) {
              
                    interaction.channel.send(`Added ${officerNickname} to the EP Sheet.`);
                } else {
                    interaction.channel.send(`No empty row found in the EP Sheet range.`);
                }
            } catch (error) {
                console.error(`Error adding user to EP Sheet`, error);
                interaction.channel.send(`Error adding user to EP Sheet`, error);
                throw error;
            }
              }

              async function RemoveUser(interaction, spreadsheetId, officerNickname) {

                function getColumnLetter(columnIndex) {
                  let letter = '';
                
                  while (columnIndex >= 0) {
                    const remainder = columnIndex % 26;
                    letter = String.fromCharCode(65 + remainder) + letter;
                    columnIndex = Math.floor(columnIndex / 26) - 1;
                  }
                
                  return letter;
                }
                try {
                 
              
                  
              
                    const range = Trooperrange;
                    const { google } = require('googleapis');
                    const auth = new google.auth.GoogleAuth({
                      keyFile: 'credentials.json', 
                      scopes: 'https://www.googleapis.com/auth/spreadsheets',
                    });
                    const sheets = google.sheets({ version: 'v4', auth });
                    const res = await sheets.spreadsheets.values.get({
                      spreadsheetId: Sheetid,
                      range,
                    });
              
                    const values = res.data.values;
              
                    if (values) {
                      let rowIndex;
                      let found = false;
                      let modifiedCells = [];
                      let userNickname;
                      let userWeeklyPoints;
                      let userTotalPoints;
                      let removedNickname;
              
                      for (let rIndex = 0; rIndex < values.length; rIndex++) {
                        rowIndex = rIndex;
              
                        const row = values[rIndex];
              
                        for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
                          const currentNickname = row[columnIndex];
              
                          if (currentNickname) {
                            const cleanedCurrentNickname = currentNickname.trim().replace(/\s*\|.*$/, '');
                            const officerNicknameLower = officerNickname.trim().replace(/\s*\|.*$/, '').toLowerCase();
              
                            if (cleanedCurrentNickname.toLowerCase() === officerNicknameLower) {
                              const weeklyPointsColumn = columnIndex + Weeklyoffset;
                              const totalPointsColumn = columnIndex + Totaloffset;
              
                              userNickname = cleanedCurrentNickname;
                              userWeeklyPoints = parseInt(values[rowIndex][weeklyPointsColumn]);
                              userTotalPoints = parseInt(values[rowIndex][totalPointsColumn]);
                              Dischargetotalep = userTotalPoints;
                              console.log('User Data:', {
                                userNickname,
                                userWeeklyPoints,
                                userTotalPoints,
                                weeklyPointsColumn,
                                totalPointsColumn,
                              });
              
                              
                              const newWeeklyPoints = '0';
                              const newTotalPoints = '0';
              
                              removedNickname = cleanedCurrentNickname;
              
                         
                              values[rowIndex][weeklyPointsColumn] = newWeeklyPoints.toString();
              values[rowIndex][totalPointsColumn] = newTotalPoints.toString();
              values[rowIndex][columnIndex] = ''; 
              
              const usernameColumnLetter = getColumnLetter(columnIndex + 1);
              const weeklyColumnLetter = getColumnLetter(weeklyPointsColumn + 3);
              const totalColumnLetter = getColumnLetter(totalPointsColumn + 3);
              
              console.log('Update Range:', {
                weeklyColumnLetter,
                totalColumnLetter,
                rowIndex,
              });
              
              modifiedCells.push({
                range: `${usernameColumnLetter}${rowIndex + Trooperstart}:${totalColumnLetter}${rowIndex + Trooperstart }`,
                values: [['', newWeeklyPoints.toString(), newTotalPoints.toString(), newTotalPoints.toString()]],
              });
              console.log(`${usernameColumnLetter}${rowIndex + Trooperstart}:${totalColumnLetter}${rowIndex + Trooperstart}`)
              
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
                     
                        await sheets.spreadsheets.values.batchUpdate({
                          spreadsheetId,
                          resource: {
                            data: modifiedCells,
                            valueInputOption: 'USER_ENTERED',
                          },
                        });
              
                     
                        console.log(`Removed nickname: ${removedNickname}`);
                        interaction.channel.send(`Removed ${officerNickname} from the EP spreadsheet.`);
              
                        return { userNickname, userWeeklyPoints, userTotalPoints, removedNickname };
                      } else {
                        console.log(`User with Discord nickname "${officerNickname}" not found in the spreadsheet.`);
                       interaction.channel.send(`User with Discord nickname "${officerNickname}" not found in the EP sheet.`);
                        return null;
                      }
                    } else {
                      console.log('Spreadsheet data not found.');
                      interaction.channel.send('Spreadsheet data not found.');
                      return null;
                    }
                  
                } catch (error) {
                  console.error('Error getting and removing user data:', error);
                  interaction.channel.send('Error getting and removing user data:', error);
                  return null;
                }
              }