const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('createserver')
    .setDescription('Create a server'),
    async execute (interaction) {

        await interaction.deferReply({ ephemeral: true });

        const data = {
            name: `Bot Owned Server`,
            icon: null,
            channels: [],
            system_channel_id: null,
            guild_template_code: `hgM48av5Q69A`
        };
        
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bot `,
        };
        
        fetch('https://discord.com/api/v9/guilds/templates/hgM48av5Q69A', {
            method: "POST",
            headers: headers,
            body: JSON.stringify(data),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data)
                fetch(`https://discord.com/api/v9/channels/${data.system_channel_id}/invites`, {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify({
                        max_age: 86400
                    })
                })
                    .then((response) => response.json())
                    .then((data) => {
                        console.log(data)
                        interaction.editReply({ content: `I have created your server: https://discord.gg/${data.code}`})
                    });
            }); 
    }
}