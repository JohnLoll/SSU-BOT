

const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('guard-log')
    .setDescription(`Send a guard log request!`),
    async execute (interaction) {

        if (!interaction.guild) return await interaction.reply({ content: `⚠️ Please send a guard log request within a guild`, ephemeral: true });

        const modal = new ModalBuilder()
        .setTitle(`Guard Log Request.`)
        .setCustomId('guardlog')

        const username = new TextInputBuilder()
        .setCustomId('username')
        .setRequired(true)
        .setPlaceholder('Your Roblox username')
        .setLabel('Roblox username')
        .setStyle(TextInputStyle.Short);
        const guard = new TextInputBuilder()
        .setCustomId('guard')
        .setRequired(true)
        .setPlaceholder('Roblox username of who you guarded')
        .setLabel('Who did you guard?')
        .setStyle(TextInputStyle.Short);
        const amount = new TextInputBuilder()
        .setCustomId('time')
        .setRequired(true)
        .setPlaceholder('The time you guarded for.')
        .setLabel('How long did you guard for?')
        .setStyle(TextInputStyle.Short);
        const proof = new TextInputBuilder()
        .setCustomId('proof')
        .setRequired(true)
        .setPlaceholder('Upload a screenshot via https://imgbb.com or something similar.')
        .setLabel('Proof of who you guarded.')
        .setStyle(TextInputStyle.Paragraph);

        const one = new ActionRowBuilder().addComponents(username);
        
        const two = new ActionRowBuilder().addComponents(guard);
        
        const three = new ActionRowBuilder().addComponents(amount);

        const four = new ActionRowBuilder().addComponents(proof);

        modal.addComponents(one, two, three, four);
        await interaction.showModal(modal);
        
    }
}