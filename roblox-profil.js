const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const STATUS_COLOR = {
    Offline: 0x808080,
    Online: 0xADD8E6,
    InGame: 0x00FF00,
    Studio: 0xFFA500
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roblox-profil')
        .setDescription('Zeigt Roblox-Profil, Avatar und Status')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Roblox Username')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const username = interaction.options.getString('username');

        try {
            const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
                usernames: [username]
            });

            if (!userRes.data.data.length) {
                return interaction.editReply('❌ Benutzer nicht gefunden.');
            }

            const user = userRes.data.data[0];
            const userId = user.id;

            const avatarRes = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot`, {
                params: {
                    userIds: userId,
                    size: '150x150',
                    format: 'Png',
                    isCircular: false
                }
            });

            const avatarUrl = avatarRes.data.data[0].imageUrl;

            const presenceRes = await axios.post('https://presence.roblox.com/v1/presence/users', {
                userIds: [userId]
            });

            const statusCode = presenceRes.data.userPresences[0].userPresenceType;
            const statusMap = ['Offline', 'Online', 'InGame', 'Studio'];
            const status = statusMap[statusCode] || 'Offline';
            const color = STATUS_COLOR[status];

            const embed = new EmbedBuilder()
                .setTitle(`${user.displayName}'s Roblox-Profil`)
                .setURL(`https://www.roblox.com/users/${userId}/profile`)
                .setThumbnail(avatarUrl)
                .setDescription(`**Status:** ${status}`)
                .setColor(color)
                .setFooter({ text: `Nutzername: ${user.name}` });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Fehler beim Abrufen der Roblox-Daten.');
        }
    }
};
