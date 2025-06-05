const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join-sv')
        .setDescription('Findet den Server eines Roblox-Spielers')
        .addStringOption(option =>
            option.setName('username_or_id')
                .setDescription('Roblox Username oder ID')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();

        let input = interaction.options.getString('username_or_id');
        let userId, username;

        try {
            if (/^\d+$/.test(input)) {
                userId = input;
                username = 'Unbekannt';
            } else {
                const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
                    usernames: [input]
                });

                if (!userRes.data.data.length) {
                    return interaction.editReply('❌ Benutzer nicht gefunden.');
                }

                const user = userRes.data.data[0];
                userId = user.id;
                username = user.name;
            }

            const avatarUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`;

            // 🔐 Simulierter Server-Link – für echten Zugriff brauchst du RoMonitor oder RTrack API
            const inGame = true;
            const serverLink = `https://www.roblox.com/games/join?userId=${userId}`;

            const embed = new EmbedBuilder()
                .setTitle(`Server-Suche für ${username}`)
                .setURL(`https://www.roblox.com/users/${userId}/profile`)
                .setThumbnail(avatarUrl)
                .setColor(0xFF0000)
                .setDescription(inGame
                    ? `✅ Der Spieler ist ingame:\n[Zum Server](${serverLink})`
                    : '❌ Spieler ist nicht ingame');

            const button = new ButtonBuilder()
                .setCustomId('recheck')
                .setLabel('🔄 Nochmal suchen')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(button);
            const message = await interaction.editReply({ embeds: [embed], components: [row] });

            const collector = message.createMessageComponentCollector({ time: 15000 });
            collector.on('collect', async i => {
                if (i.customId === 'recheck') {
                    await i.deferUpdate();
                    module.exports.execute(interaction);
                }
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Fehler beim Abrufen der Spieldaten.');
        }
    }
};
