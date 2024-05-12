const { EmbedBuilder, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
let logchannel = null;
const { guardlogchannelModel } = require('../Schemas/guardlogchannel');
module.exports = {
    name: Events.InteractionCreate,
    async execute (interaction, client) {
        var logdata = await guardlogchannelModel.find({ Guild: interaction.guild.id});
        var logvalues = [];
        await logdata.forEach(async value => {
            if (!value.Channel) return;
            else {
               
                logvalues.push(logchannel = value.Channel);
            }
        });
        if (!interaction.guild) return;
        if (!interaction.isModalSubmit()) return;

        if (interaction.customId === 'guardlog') {
            const username = interaction.fields.getTextInputValue('username');
            const guard = interaction.fields.getTextInputValue('guard');
            const amount = interaction.fields.getTextInputValue('time');
            const proof = interaction.fields.getTextInputValue('proof');
            const id = interaction.user.id;
            const member = interaction.member;

            const channel = await client.channels.cache.get(logchannel);

            const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setTitle(`📬 New Guarding Log!`)
            .addFields({ name: "Rquesting member", value: `<@${id}>, ${username}`})
            .addFields({ name: "Amount of time", value: `${amount}`})
            .addFields({ name: `The person being guarded`, value: `> ${guard}`})
            .addFields({ name: `Proof`, value: `> ${proof}`})
            .setTimestamp()
            .setFooter({ text: `Guard Logging System`});

            const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setCustomId(`denied - ${id}`)
                .setStyle(ButtonStyle.Success)
                .setLabel(`Approve`)
            )
            .addComponents(
                new ButtonBuilder()
                .setCustomId(`approved - ${id}`)
                .setStyle(ButtonStyle.Danger)
                .setLabel(`Deny`)
            );
            await channel.send({ embeds: [embed], components: [button] }).catch(err => {});
            await interaction.reply({ content: `🌍 Your guard log request has been recorded.  You will be notifed if it gets accepted or denied.`, ephemeral: true });
        }



    }
}