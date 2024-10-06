const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');
const NodeCache = require('node-cache');
const { filteringlogchannelModel } = require('../../Schemas/filteringlogchannel');
const noblox = require('noblox.js');

const inventoryCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
let premiumStatus;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const checkInventoryVisibility = async (userId) => {
    const cachedInventory = inventoryCache.get(userId);
    if (cachedInventory !== undefined) {
        return cachedInventory;
    }

    const maxRetries = 20;
    let attempt = 0;
    let delayTime = 5000;

    while (attempt < maxRetries) {
        try {
            const response = await axios.get(`https://inventory.roblox.com/v1/users/${userId}/can-view-inventory`);
            const canView = response.data.canView;
            inventoryCache.set(userId, canView);
            return canView;
        } catch (error) {
            if (error.response && error.response.status === 429) {
                console.log(`Rate limit exceeded. Retrying in ${delayTime / 1000} seconds... Attempt ${attempt + 1}`);
                await delay(delayTime);
                delayTime *= 2;
                attempt++;
            } else {
                console.error(`Error checking inventory visibility for userId ${userId}:`, error.response ? error.response.data : error.message);
                throw new Error('Error checking inventory visibility');
            }
        }
    }

    throw new Error('Max retries reached while checking inventory visibility');
};

const fetchInventory = async (assetTypeId, userId) => {
    let totalCount = 0;
    let nextPageCursor = null;
    const badgeCreators = {};
    let robloxAccessoryCount = 0;

    const makeRequest = async (url, params) => {
        try {
            const response = await axios.get(url, { params });
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 429) {
                console.log('Rate limit exceeded. Retrying...');
                await delay(5000);
                return makeRequest(url, params);
            } else {
                throw error;
            }
        }
    };

    do {
        const response = await makeRequest('https://www.roblox.com/users/inventory/list-json', {
            userId,
            assetTypeId,
            cursor: nextPageCursor
        });

        const items = response.Data?.Items || [];

        if (assetTypeId === 34) {
            const filteredItems = items.filter(item => item.Creator && item.Creator.Id !== userId);
            totalCount += filteredItems.length;
        } else if (assetTypeId === 21) {
            items.forEach(item => {
                const creatorId = item.Creator?.Id;
                if (creatorId) {
                    if (!badgeCreators[creatorId]) {
                        badgeCreators[creatorId] = 0;
                    }
                    badgeCreators[creatorId]++;
                    if (badgeCreators[creatorId] <= 30) {
                        totalCount++;
                    }
                }
            });
        } else {
            items.forEach(item => {
                if (item.Creator?.Id === 1) {
                    robloxAccessoryCount++;
                } else {
                    totalCount++;
                }
            });
        }

        nextPageCursor = response.Data?.nextPageCursor || null;
    } while (nextPageCursor);

    if (assetTypeId === 8 && robloxAccessoryCount > 5) {
        totalCount += 5;
    } else {
        totalCount += robloxAccessoryCount;
    }

    return totalCount;
};



const calculateExpectedValues = (accountAge) => {
    return {
        expectedClothing: accountAge > 2000 ? Math.min(80 + Math.floor(accountAge / 30), 300) : Math.min(50 + Math.floor(accountAge / 50), 200),
        expectedAccessories: accountAge > 2000 ? Math.min(70 + Math.floor(accountAge / 15), 1500) : Math.min(40 + Math.floor(accountAge / 25), 500),
        expectedGamePasses: accountAge > 2000 ? Math.min(50 + Math.floor(accountAge / 30), 600) : Math.min(30 + Math.floor(accountAge / 50), 500),
        expectedBadges: accountAge > 2000 ? Math.min(350 + Math.floor(accountAge / 20), 5000) : Math.min(200 + Math.floor(accountAge / 25), 3000),
        expectedGroups: accountAge > 2000 ? Math.min(40 + Math.floor(accountAge / 70), 250) : Math.min(20 + Math.floor(accountAge / 100), 200)
    };
};

const assessAccount = (accountDetails, metrics) => {
    const { accountAge, clothingCount, accessoryCount, gamepassCount, badgeCount, groupCount } = metrics;
    const { expectedClothing, expectedAccessories, expectedGamePasses, expectedBadges, expectedGroups } = calculateExpectedValues(accountAge);

    let score = 0;

    const ageFactor = accountAge > 2000 ? 0.10 : 0.20;

    // Stricter scoring conditions
    if (clothingCount < expectedClothing * 0.25) score += 5;  // Stricter threshold
    else if (clothingCount < expectedClothing * 0.40) score += 4;  // Stricter threshold

    if (accessoryCount < expectedAccessories * 0.25) score += 4;  // Stricter threshold
    else if (accessoryCount < expectedAccessories * 0.40) score += 3;  // Stricter threshold

    if (gamepassCount < expectedGamePasses * 0.25) score += 4;  // Stricter threshold
    else if (gamepassCount < expectedGamePasses * 0.40) score += 3;  // Stricter threshold

    if (badgeCount < expectedBadges * ageFactor * 0.70) score += 5;  // Stricter threshold
    else if (badgeCount < expectedBadges * 0.50) score += 4;  // Stricter threshold

    if (groupCount < expectedGroups * ageFactor * 0.70) score += 4;  // Stricter threshold
    else if (groupCount < expectedGroups * 0.50) score += 3;  // Stricter threshold

    // Increased penalties for excessive amounts
    if (clothingCount > expectedClothing * 1.5) score -= 4;  // Increased penalty
    if (accessoryCount > expectedAccessories * 1.5) score -= 3;  // Increased penalty
    if (gamepassCount > expectedGamePasses * 1.5) score -= 4;  // Increased penalty
    if (badgeCount > expectedBadges * 1.5) score -= 5;  // Increased penalty
    if (groupCount > expectedGroups * 1.5) score -= 3;  // Increased penalty

    return score;
};


const categorizeAlt = (score) => {
    if (score >= 10) return 'High';
    if (score >= 6) return 'Medium';
    return 'Low';
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('filtering')
        .setDescription('Collects data for the filtering process.')
        .addStringOption(option =>
            option.setName('roblox_username')
                .setDescription('Your Roblox username')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('roblox_profile')
                .setDescription('Link to your Roblox profile')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('tryout_host')
                .setDescription('The person who hosted the tryout')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('group_pending')
                .setDescription('Have you requested to join the group?')
                .setRequired(true)
                .addChoices(
                    { name: 'Yes', value: 'yes' },
                    { name: 'No', value: 'no' }
                )),

    async execute(interaction) {
        await interaction.reply({ content: 'Please wait while your data is being processed, this may take up to **five** minutes. If you are having issues, please contact <@721500712973893654>', ephemeral: true });
        
        const logdata = await filteringlogchannelModel.find({ Guild: interaction.guild.id });
        let logchannel = null;
        const logvalues = logdata.map(value => value.Channel).filter(Boolean);
        if (logvalues.length > 0) {
            logchannel = logvalues[0];
        }

        const robloxUsername = interaction.options.getString('roblox_username');
        const robloxProfile = interaction.options.getString('roblox_profile');
        const tryoutHost = interaction.options.getMember('tryout_host');
        const groupPending = interaction.options.getString('group_pending');

        const profileIdMatch = robloxProfile.match(/\/users\/(\d+)\//);
        if (!profileIdMatch) {
            await interaction.followUp({ content: 'The provided Roblox profile link is invalid. Please check the link and try again.', ephemeral: true });
            return;
        }
        const userId = profileIdMatch[1];

        let userData;
        try {
            const userResponse = await fetch(`https://users.roblox.com/v1/users/${userId}`);
            userData = await userResponse.json();

            if (!userResponse.ok || !userData || !userData.name) {
                throw new Error('Invalid response when fetching username');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            await interaction.followUp({ content: 'The provided Roblox userid associated with the profile link is invalid. Please check your inputs and try again.', ephemeral: true });
            return;
        }

        const fetchedUsername = userData.name;

        if (robloxUsername.toLowerCase() !== fetchedUsername.toLowerCase()) {
            await interaction.followUp({ content: 'The provided Roblox username does not match the username associated with the profile link. Please check your inputs and try again.', ephemeral: true });
            return;
        }

        if (groupPending !== 'yes') {
            await interaction.followUp({ content: 'Please resubmit this command after you have requested to join the group: https://www.roblox.com/groups/33963728/Speci-l-Service-Unit#!/about', ephemeral: true });
            return;
        }

        console.log('Fetching target channel...');

        const info = await noblox.getPlayerInfo(userId);
        const canViewInventory = await checkInventoryVisibility(userId);
        if (!canViewInventory) {
            const privateEmbed = new EmbedBuilder()
                .setColor('#ffcc00')
                .setTitle('Inventory Private')
                .setDescription('Your roblox inventory is set to private. Please change this to public and try again.')
                .setTimestamp()
                .setFooter({ text: 'Points Tracker' });
            return await interaction.followUp({ embeds: [privateEmbed] });
        }

        const [accountResponse, shirtCount, pantsCount, accessoryCount, gamepassCount, badgeCount, groupResponse, friendsResponse, followingResponse] = await Promise.all([
            axios.get(`https://users.roblox.com/v1/users/${userId}`),
            fetchInventory(11, userId),
            fetchInventory(12, userId),
            fetchInventory(8, userId),
            fetchInventory(34, userId),
            fetchInventory(21, userId),
            axios.get(`https://groups.roblox.com/v2/users/${userId}/groups/roles`),
            axios.get(`https://friends.roblox.com/v1/users/${userId}/friends/count`),
            axios.get(`https://friends.roblox.com/v1/users/${userId}/followings/count`)
        ]);

        const accountDetails = accountResponse.data;
        const accountCreatedDate = new Date(accountDetails.created);
        const accountAge = Math.floor((Date.now() - accountCreatedDate) / (1000 * 60 * 60 * 24));

        const clothingCount = shirtCount + pantsCount;
        const groupCount = groupResponse.data.data.length;
        const friendsCount = friendsResponse.data.count;
        const followingCount = followingResponse.data.count;

        const metrics = {
            accountAge,
            clothingCount,
            accessoryCount,
            gamepassCount,
            badgeCount,
            groupCount
        };

        const score = assessAccount(accountDetails, metrics);
        const altCategory = categorizeAlt(score);

        let embedColor;
        if (altCategory === 'High') {
            embedColor = '#FF0000';
        } else if (altCategory === 'Medium') {
            embedColor = '#FFA500';
        } else {
            embedColor = '#00FF00';
        }

        const targetChannelId = logchannel;
        const targetChannel = interaction.client.channels.cache.get(targetChannelId);

        if (!targetChannel) {
            console.error('Target channel not found. Check if the channel ID is correct and if the bot has access to the channel.');
            return;
        }

            const embed = new EmbedBuilder()
            .setTitle(`User Analysis: ${robloxUsername}`)
            .addFields(
                { name: 'Account Age', value: `${accountAge} days`, inline: true },
                { name: 'Clothing Count', value: `${clothingCount}`, inline: true },
                { name: 'Accessories Count', value: `${accessoryCount}`, inline: true },
                { name: 'Game Passes Count', value: `${gamepassCount}`, inline: true },
                { name: 'Badges Count', value: `${badgeCount}`, inline: true },
                { name: 'Groups Count', value: `${groupCount}`, inline: true },
                { name: 'Friends List Count', value: `${friendsCount}`, inline: true },
                { name: 'Following List Count', value: `${followingCount}`, inline: true },
                { name: 'Alt Account Likelihood', value: `${altCategory}`, inline: true },
                { name: 'Roblox Profile', value: `[View Profile](https://www.roblox.com/users/${userId}/profile)`, inline: true },
                { name: 'Tryout Host', value: `<@${tryoutHost.id}>`, inline: true },
                { name: 'Ban Status', value: info.isBanned ? "True" : "False", inline: true },
              
                 
            )
            
            .setColor(embedColor)
            .setFooter({
                text: `${interaction.commandName} | ${interaction.client.user.username}`,
                iconURL: interaction.client.user.displayAvatarURL()
              });

        try {
            await targetChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error sending message to channel:', error);
            //await interaction.editReply({ content: 'Failed to send the embed. Please try again later.', ephemeral: true });
            return;
        }

        await interaction.followUp({ content: 'Your filtering info has been **successfully** logged.', ephemeral: true });
    }
};
