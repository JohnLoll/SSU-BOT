const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("purge")
        .setDescription("Purge a specific amount of messages from a target or channel")
        .addSubcommand(subcommand =>
            subcommand
                .setName("all")
                .setDescription("Remove all messages")
                .addIntegerOption(options =>
                    options
                        .setName("count")
                        .setDescription("Input count")
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("user")
                .setDescription("Remove all messages from the specified user")
                .addIntegerOption(options =>
                    options
                        .setName("count")
                        .setDescription("Input count")
                        .setMinValue(1)
                        .setRequired(true)
                )
                .addUserOption(options =>
                    options
                        .setName("user")
                        .setDescription("Input user")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("bot")
                .setDescription("Remove messages sent by bots")
                .addIntegerOption(options =>
                    options
                        .setName("count")
                        .setDescription("Input count")
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("links")
                .setDescription("Remove messages containing links")
                .addIntegerOption(options =>
                    options
                        .setName("count")
                        .setDescription("Input count")
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("caps")
                .setDescription("Remove messages containing all capital letters")
                .addIntegerOption(options =>
                    options
                        .setName("count")
                        .setDescription("Input count")
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("images")
                .setDescription("Remove messages containing images/GIFs/files")
                .addIntegerOption(options =>
                    options
                        .setName("count")
                        .setDescription("Input count")
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("reactions")
                .setDescription("Remove messages containing reactions")
                .addIntegerOption(options =>
                    options
                        .setName("count")
                        .setDescription("Input count")
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("mentions")
                .setDescription("Remove messages containing mentions")
                .addIntegerOption(options =>
                    options
                        .setName("count")
                        .setDescription("Input count")
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("embed")
                .setDescription("Remove messages containing embeds")
                .addIntegerOption(options =>
                    options
                        .setName("count")
                        .setDescription("Input count")
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("emojis")
                .setDescription("Remove messages containing emojis")
                .addIntegerOption(options =>
                    options
                        .setName("count")
                        .setDescription("Input count")
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("stickers")
                .setDescription("Remove messages containing stickers")
                .addIntegerOption(options =>
                    options
                        .setName("count")
                        .setDescription("Input count")
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("webhooks")
                .setDescription("Remove messages sent by webhooks")
                .addIntegerOption(options =>
                    options
                        .setName("count")
                        .setDescription("Input count")
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("pins")
                .setDescription("Remove pinned messages")
                .addIntegerOption(options =>
                    options
                        .setName("count")
                        .setDescription("Input count")
                        .setMinValue(1)
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            await interaction.reply({
                content: "You do not have **Manage Messages** permission.",
                ephemeral: true,
            });
            return;
        }

        let amount = interaction.options.getInteger("count");
        if (amount > 100) amount = 100;
        if (amount < 1) amount = 1;

        const fetch = await interaction.channel.messages.fetch({ limit: amount });
        const user = interaction.options.getUser("user");

        const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

        async function results(deletedMessages, type, user) {
            if (deletedMessages.size === 0) {
                const embed = new EmbedBuilder()
                    .setDescription(`:warning: There is no **${type}** to purge.`)
                    .setColor("#a4aafe");

                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }

            const results = {};
            for (const [, deleted] of deletedMessages) {
                const user = `${deleted.author.username}`;
                if (!results[user]) results[user] = 0;
                results[user]++;
            }
          
            const userMessageMap = Object.entries(results);
          
            const finalResult = userMessageMap
                .map(([user, messages]) => `**\`${user} - ${messages}\`**`)
                .join("\n");

            const embed = new EmbedBuilder()
                .setTitle(`Purged ${type} (${deletedMessages.size})`)
                .setDescription(finalResult)
                .setColor("#a4aafe");

            await interaction.reply({ embeds: [embed] });
        }

        let filtered;
        let deletedMessages;

        try {
            switch (interaction.options.getSubcommand()) {
                case "all":
                    filtered = fetch.filter(m => m.createdTimestamp > fourteenDaysAgo);
                    deletedMessages = await interaction.channel.bulkDelete(filtered, true);
                    await results(deletedMessages, "Messages");
                    break;

                case "bot":
                    filtered = fetch.filter(m => m.author.bot && m.createdTimestamp > fourteenDaysAgo);
                    deletedMessages = await interaction.channel.bulkDelete(filtered, true);
                    await results(deletedMessages, "Bot messages");
                    break;

                case "user":
                    filtered = fetch.filter(m => m.author.id === user.id && m.createdTimestamp > fourteenDaysAgo);
                    deletedMessages = await interaction.channel.bulkDelete(filtered, true);
                    await results(deletedMessages, "User messages", user);
                    break;

                case "links":
                    filtered = fetch.filter(m => /https?:\/\/\S+/i.test(m.content) && m.createdTimestamp > fourteenDaysAgo);
                    deletedMessages = await interaction.channel.bulkDelete(filtered, true);
                    await results(deletedMessages, "Links");
                    break;

                case "caps":
                    filtered = fetch.filter(m => m.content.match(/[A-Z]/g) !== null && m.createdTimestamp > fourteenDaysAgo);
                    deletedMessages = await interaction.channel.bulkDelete(filtered, true);
                    await results(deletedMessages, "Capital letters");
                    break;

                case "images":
                    filtered = fetch.filter(m =>
                        (m.attachments.some(attachment =>
                            /\.(png|jpe?g|gif|bmp|webp)$/i.test(attachment.url)
                        ) ||
                        /\/\/\S+\.(png|jpe?g|gif|bmp|webp)$/i.test(m.content)) &&
                        m.createdTimestamp > fourteenDaysAgo
                    );
                    deletedMessages = await interaction.channel.bulkDelete(filtered, true);
                    await results(deletedMessages, "Images");
                    break;

                case "reactions":
                    filtered = fetch.filter(m => m.reactions.cache.size > 0 && m.createdTimestamp > fourteenDaysAgo);
                    deletedMessages = await interaction.channel.bulkDelete(filtered, true);
                    await results(deletedMessages, "Reactions");
                    break;

                case "mentions":
                    filtered = fetch.filter(m => m.mentions.users.size > 0 && m.createdTimestamp > fourteenDaysAgo);
                    deletedMessages = await interaction.channel.bulkDelete(filtered, true);
                    await results(deletedMessages, "Mentions");
                    break;

                case "embed":
                    filtered = fetch.filter(m => m.embeds.length > 0 && m.createdTimestamp > fourteenDaysAgo);
                    deletedMessages = await interaction.channel.bulkDelete(filtered, true);
                    await results(deletedMessages, "Embeds");
                    break;

                case "emojis":
                    filtered = fetch.filter(m => /<:.+?:\d+>|<a:.+?:\d+>/i.test(m.content) && m.createdTimestamp > fourteenDaysAgo);
                    deletedMessages = await interaction.channel.bulkDelete(filtered, true);
                    await results(deletedMessages, "Emojis");
                    break;

                case "stickers":
                    filtered = fetch.filter(m => m.stickers.size > 0 && m.createdTimestamp > fourteenDaysAgo);
                    deletedMessages = await interaction.channel.bulkDelete(filtered, true);
                    await results(deletedMessages, "Stickers");
                    break;

                case "webhooks":
                    filtered = fetch.filter(m => m.webhookId && m.createdTimestamp > fourteenDaysAgo);
                    try {
                        deletedMessages = await interaction.channel.bulkDelete(filtered, true);
                        await results(deletedMessages, "Webhooks");
                    } catch (error) {
                        console.error("[PURGE]", error);
                        await interaction.reply({
                            content: "An error occurred while processing the purge webhook command.",
                            ephemeral: true,
                        });
                    }
                    break;

                case "pins":
                    filtered = fetch.filter(m => m.pinned && m.createdTimestamp > fourteenDaysAgo);
                    deletedMessages = await interaction.channel.bulkDelete(filtered, true);
                    await results(deletedMessages, "Pins");
                    break;

                default:
                    await interaction.reply({
                        content: "Unknown purge subcommand.",
                        ephemeral: true,
                    });
                    break;
            }
        } catch (error) {
            console.error("[PURGE]", error);
            await interaction.reply({
                content: "An error occurred while processing the purge command.",
                ephemeral: true,
            });
        }
    }
};
