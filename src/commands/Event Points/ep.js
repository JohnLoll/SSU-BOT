
const { SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const Discord = require('discord.js');
const { google } = require('googleapis');
let { epModel, Name, Guild, Sheetid, Range, Weeklyoffset, Totaloffset, Start  } = require('../../Schemas/ep');
const { range } = require('mathjs');
const { logchannelModel } = require('../../Schemas/logchannel');
const { start } = require('pm2');
let logchannel = null;
let reason = null;
let avatar = '';
module.exports = {
  officer: true,
    data: new SlashCommandBuilder()
      .setName('ep')
      .setDescription('Manage the amount of event points for users.')
      .addIntegerOption(option =>
        option
          .setName('amount')
          .setDescription('Amount of event points to add.')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('reason')
          .setDescription('The reason for adding event points.')
          .setRequired(true))
          .addStringOption(option =>
            option.setName('action')
                .setDescription('How would you like to manage the users EP?')
                .setRequired(true)
                .addChoices(
                    { name: 'Add', value: 'Add' },
                    { name: 'Remove', value: 'Remove' },
                ))
                .addStringOption(option =>
                  option.setName('user')
                  .setDescription('The user to add/remove EP from.')
                  .setRequired(true))
                  .setDMPermission(false),
          
    async execute(interaction) {
      interaction.reply('Please wait...');
      const mentionedUser = interaction.user.id;
      var logdata = await logchannelModel.find({ Guild: interaction.guild.id});
      var data = await epModel.find({ Guild: interaction.guild.id, Name: 'EP' });
      var values = [];
                  await data.forEach(async value => {
                      if (!value.Name) return;
                      else {
                         
                          values.push(Sheetid = value.Sheetid,Range =  value.Range, Weeklyoffset = value.Weeklyoffset, Totaloffset = value.Totaloffset, Start = value.Start, Trooperstart = value.Trooperstart, Trooperrange = value.Trooperrange);
                      }
                  });
                  var logvalues = [];
                  await logdata.forEach(async value => {
                      if (!value.Channel) return;
                      else {
                         
                          logvalues.push(logchannel = value.Channel);
                      }
                  });
  
   
   
     
      
        amountToAdd = 0;
        amountToRemove = 0;

const mentionedUsersString = interaction.options.getString('user');
const mentionedUsers = mentionedUsersString.match(/<@!?(\d+)>/g)?.map(mention => mention.match(/\d+/)[0]) || [];

function getNicknameWithoutTimezone(user) {
    const nickname = user.nickname || user.user.username;
    return nickname.replace(/\s*\[.*\]\s*$/, ''); // Remove the timezone information
}

reason = interaction.options.getString('reason');
const action = interaction.options.getString('action');
 amount = interaction.options.getInteger('amount');

for (const mentionedUserId of mentionedUsers) {
    console.log(`Processing mentioned user ID: ${mentionedUserId}`);
    
    let officerNickname = null;
    try {
        const officer = interaction.guild.members.cache.get(mentionedUserId);
      
        if (!officer) {
            console.error(`Member with ID ${mentionedUserId} not found.`);
            continue; 
        }

        officerNickname = getNicknameWithoutTimezone(officer);
        console.log(`Officer nickname: ${officerNickname}`);

      
        await modifyEPAndSendDM(officer.user, action === 'Add' ? amount : -amount, reason, action.toLowerCase());
        
    } catch (error) {
        console.error(`Error getting officer nickname: ${error}`);
    }

            async function modifyEPAndSendDM(user, amount, reason, operation) {
              try {

                  const dmChannel = await user.createDM();
                  dmChannel.send({
                      embeds: [
                          new EmbedBuilder()
                              .setTitle(`EP ${operation === 'add' ? 'Addition' : 'Removal'}`)
                              .setDescription(`<@${mentionedUser}> ${operation === 'add' ? 'added' : 'removed'} ${amount} EP, for reason: ${reason}`)
                              .setColor(operation === 'add' ? '#00FF00' : '#FF0000') // Green or Red
                              .setTimestamp()
                              .setFooter({
                                text: interaction.guild.name,
                                iconURL: interaction.guild.iconURL() 
                              })
                      ]
                  });
              } catch (error) {
                  console.error(`Error sending DM to ${user.username}: ${error}`);
              }
          }
          
          
          if( action === 'Add') {
            amountToAdd = interaction.options.getInteger('amount');
            await addep(officerNickname, amountToAdd)
            async function addep(officerNickname, amountToAdd){
              try {
                const guild =interaction.guild 
            
                const { google } = require('googleapis');
                
                  const range = Range;
                  const auth = new google.auth.GoogleAuth({
                    keyFile: 'credentials.json', 
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
                            range: `${weeklyColumnLetter}${rowIndex + Start}:${totalColumnLetter}${rowIndex + Start}`,
                            values: [[newWeeklyPoints.toString(), newTotalPoints.toString()]],
                          });
                          
          console.log(`${weeklyColumnLetter}${rowIndex + Start}:${totalColumnLetter}${rowIndex + Start}`);
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
                        spreadsheetId: Sheetid,
                        resource: {
                          data: modifiedCells,
                          valueInputOption: 'USER_ENTERED',
                        },
                      });
                    } else {
                      console.log(`User with Discord nickname "${officerNickname}" not found in the spreadsheet.`);
                      interaction.channel.send(`User with Discord nickname "${officerNickname}" not found in the range: ${range}`);
                      return;
                    }
                  } else {
                    console.log('Spreadsheet data not found.');
                  }
                
              } catch (error) {
                console.error('Error adding points to the spreadsheet:', error);
              }
              console.log(`Added **${amountToAdd}** event points to ${officerNickname}`);
              interaction.channel.send(`Added **${amountToAdd}** Event Points to ${officerNickname}`);

            }

      
          } else if (action ==='Remove') {
            amountToRemove = interaction.options.getInteger('amount');
            await addep(officerNickname, amountToRemove)
            async function addep(officerNickname, amountToRemove){
              try {
                const guild =interaction.guild 
            
                const { google } = require('googleapis');
                
                  const range = Range;
                  const auth = new google.auth.GoogleAuth({
                    keyFile: 'credentials.json',
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
            
                          const newWeeklyPoints = currentWeeklyPoints - amountToRemove;
                          const newTotalPoints = currentTotalPoints - amountToRemove;
            
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
                      await sheets.spreadsheets.values.batchUpdate({
                        spreadsheetId: Sheetid,
                        resource: {
                          data: modifiedCells,
                          valueInputOption: 'USER_ENTERED',
                        },
                      });
                    } else {
                      console.log(`User with Discord nickname "${officerNickname}" not found in the spreadsheet.`);
                      interaction.channel.send(`User with Discord nickname "${officerNickname}" not found in the range: ${range}`);
                      return;
                    }
                  } else {
                    console.log('Spreadsheet data not found.');
                  }
                
              } catch (error) {
                console.error('Error removing Event Points from the spreadsheet:', error);
              }
              console.log(`Removed **${amountToAdd}** Event Points from ${officerNickname}`);
              interaction.channel.send(`Removed **${amountToRemove}** Event Points from ${officerNickname}`);

            }
          }
       
      
      
      

       
    const { google } = require('googleapis');


    const auth = new google.auth.GoogleAuth({
      keyFile: 'credentials.json', 
      scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });
    sheets = google.sheets({ version: 'v4', auth });
    function getColumnLetter(columnIndex) {
      let letter = '';
    
      while (columnIndex >= 0) {
        const remainder = columnIndex % 26;
        letter = String.fromCharCode(65 + remainder) + letter;
        columnIndex = Math.floor(columnIndex / 26) - 1;
      }
    
      return letter;
    }
  
 
    
  
    
  
    
        
   
   
    
    
      }
      if (amountToAdd > 0){

  
  
        const guild =interaction.guild
             
           
        const logEmbed = {
          color: 0xff0000, // Red color
          title: 'EP Addition Command',
          fields: [
            {
              name: 'Command Issued by',
              value: `<@${mentionedUser}>`,
              inline: true,
            },
            {
              name: 'Users Affected',
              value: `${mentionedUsersString}`,
              inline: true,
            },
            {
              name: 'Amount Added',
              value: `${amountToAdd}`,
              inline: true,
            },
            {
              name: 'Reason',
              value: `${reason}`,
              inline: true,
            },
          ],
          footer: {
            text: 'Logging System',
          },
          timestamp: new Date(),
        };
        
            
             const logChannel = guild.channels.cache.get(logchannel);
            if (logChannel instanceof Discord.TextChannel) { 
              await logChannel.send({ embeds: [logEmbed] });
            }
            
          
          }
          if(amountToRemove > 0){
              const guild =interaction.guild
                  
           
           
        
        
        const logEmbed = {
          color: 0xff0000, // Red color
          title: 'EP Removal Command',
          fields: [
            {
              name: 'Command Issued by',
              value: `<@${mentionedUser}>`,
              inline: true,
            },
            {
              name: 'Users Affected',
              value: `${mentionedUsersString}`,
              inline: true,
            },
            {
              name: 'Amount Removed',
              value: `${amountToRemove}`,
              inline: true,
            },
            {
              name: 'Reason',
              value: `${reason}`,
              inline: true,
            },
          ],
          footer: {
            text: 'Logging System',
          },
          timestamp: new Date(),
        };
            // Send the log message to the log channel
          
             const logChannel = guild.channels.cache.get(logchannel);
            if (logChannel instanceof Discord.TextChannel) { // Use 'Discord.TextChannel' to check if it's a text channel
              await logChannel.send({ embeds: [logEmbed] });
            }
          }
    }
    }
    
      
    
  