const { ContextMenuCommandBuilder, EmbedBuilder, ApplicationCommandType, ActionRowBuilder, StringSelectMenuBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
    .setName('Moderate')
    .setType(ApplicationCommandType.User),
    async execute (interaction) {

        const ownerid = '721500712973893654'
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && interaction.member.id !== ownerid) {
            return await interaction.reply({ content: `⚠️ You don't have perms to use this!`, ephemeral: true });
        }

        const user = await interaction.guild.members.fetch(interaction.targetId);

        const menu = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
            .setCustomId('Moderate')
            .setMinValues(1)
            .setMaxValues(2)
            .setPlaceholder('Nothing Selected!')
            .addOptions(
                {
                    label: 'Ban',
                    description: 'Ban the member',
                    value: `ban ${interaction.targetId}`
                },
                {
                    label: 'Kick',
                    description: 'Kick the member',
                    value: `kick ${interaction.targetId}`
                }
            )
        );

        const embed = new EmbedBuilder()
        .setColor("Blurple")
        .setDescription(`🗝️ **Moderate** ${user} below!`);

        await interaction.reply({ embeds: [embed], components: [menu], ephemeral: true });

    }
}