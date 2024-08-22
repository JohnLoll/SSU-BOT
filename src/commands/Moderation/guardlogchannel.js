const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { guardlogchannelModel } = require('../../Schemas/guardlogchannel');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('guardlogchannel')
    .setDescription('The guard log channel')
    .addSubcommand(command => command.setName('add').setDescription('Add a guard log channel to the database')
    .addChannelOption(option => option.setName('channel').setDescription('The guard log channel').setRequired(true)))
    .addSubcommand(command => command.setName('remove').setDescription('Remove the guard log channel from the database'))
    .addSubcommand(command => command.setName('check').setDescription('Check the guard log channel'))
    .setDMPermission(false),
    
    async execute (interaction) {

        const { options } = interaction;
        const sub = options.getSubcommand();
        var data = await guardlogchannelModel.find({ Guild: interaction.guild.id});

        async function sendMessage (message) {
            const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setDescription(message);

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        async function checkData (add) {
            var check;
            var guardlogchannel = options.getChannel('channel');
            


            await data.forEach(async value => {
                if (value.guardlogchannel == guardlogchannel) return check = true;
            });

            return check;
        }

        const ownerid = '721500712973893654'
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && interaction.member.id !== ownerid) {
            return await interaction.reply({ content: `⚠️ You don't have perms to use this!`, ephemeral: true });
        }

        switch (sub) {
            case 'add':
                var check = await checkData(true);
                var guardlogchannel = options.getChannel('channel');
                if (check) {
                    return await sendMessage(`⚠️ Looks like that is already the log channel!`);
                } else {
                    await guardlogchannelModel.create({
                        Guild: interaction.guild.id,
                        Channel: guardlogchannel.id,
                    });

                    return await sendMessage(`🌍 I have added the ${guardlogchannel} to the database as the log channel!`);
                }
            break;
            case 'remove':
               
            
                
                var data = await guardlogchannelModel.findOne({ Guild: interaction.guild.id});
            
                if (!data) {
                    // If the configuration is not found, return a message indicating so
                    return await sendMessage(`⚠️ Looks like there is no guard log channel configuration for this guild in the database, so I can't remove it!`);
                } else {
                    // If the configuration is found, remove it from the database
                    await guardlogchannelModel.deleteOne({ Guild: interaction.guild.id});
                    return await sendMessage(`The guard log channel has been successfully removed from the database!`);
                }
            break;
            
            case 'check':
                var values = [];
                await data.forEach(async value => {
                    if (!value.Channel) return;
                    else {
                       
                        values.push(`**Channel:** <#${value.Channel}>`);
                    }
                });

                if (values.length > 0) {
                    await sendMessage(`🌍 **Log Channel**\n\n${values.join('\n')}`);
                } else {
                    await sendMessage(`⚠️ Looks like there is Guard Log Channel configured in the database!`);
                }
        }
        
    }
}