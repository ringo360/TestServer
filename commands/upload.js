const { SlashCommandBuilder } = require('discord.js');
const config = require("../config.json");
const path = require('path');
const fs = require('fs').promises

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deploy')
        .setDescription('ファイルをcdnにデプロイ')
        .addAttachmentOption(option =>
            option
                .setName("file")
                .setRequired(true)
                .setDescription("デプロイするファイル"))
        .addStringOption(option =>
            option
                .setName("filename")
                .setDescription("ファイル名")
        ),
    execute: async function (
        /** @type {import('discord.js').CommandInteraction} */
        interaction) {
        if (!config.allowlist) {
            return interaction.reply("ねえなんで設定ファイルに`allowlist`が記述されてないの？");
        }
        if (!config.allowlist.includes(interaction.user.id)) {
            return interaction.reply({
                content: "ねえ君権限ないよ？ざぁこざぁこ♡www権限ないのに好奇心でコマンド実行しちゃうなんてかわいいね",
                ephemeral: true
            });
        }
        await interaction.deferReply();
        const file = interaction.options.getAttachment('file');
        const filename = interaction.options.getString('filename') || file.name;

        try {
            // サーバー内の保存ディレクトリのパス
            const saveDirectory = config.savepath
            
            // ファイルの保存先のパス
            const filePath = path.join(saveDirectory, filename);

            // ファイルを保存
            await fs.writeFile(filePath, file.content);

            interaction.editReply(`${filename}をデプロイしました!`);
        } catch (e) {
            await interaction.editReply({
                embeds: [{
                    title: "エラー",
                    description: '管理者がミスをしました。鯖ログを見るよう指示してください。' + '\n```' + e + '\n```',
                    color: 0xff0000,
                    footer: {
                        text: "uwu"
                    }
                }]
            })
			console.log(e);
        }
    },
};
