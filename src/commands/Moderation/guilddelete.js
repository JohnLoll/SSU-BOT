const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('deleteguild')
    .setDescription(`Delete a guild`),
    async execute (interaction, client) {
        const guild = await client.guilds.cache.get('1130990765284274268');
        await guild.delete()
    }
}