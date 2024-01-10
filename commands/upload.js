const { SlashCommandBuilder } = require('discord.js');
const config = require("../config.json");
const path = require('path');
const fs = require('fs')
const axios = require('axios')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deploy')
        .setDescription('ファイルをサーバーにデプロイ')
        .addAttachmentOption(option =>
            option
                .setName("file")
                .setRequired(true)
                .setDescription("デプロイするファイル")
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
        let tmp = interaction.options.getAttachment('file');
		let res = await axios.get(tmp.attachment.proxyURL,{ responseType: "arraybuffer" });
		await interaction.editReply(`Trying to download from ${tmp.attachment.proxyURL}...`)
		console.log(tmp.attachment.proxyURL)
		let file = Buffer.from(res.data);

        try {
            // サーバー内の保存ディレクトリのパス
            const saveDirectory = config.savepath
            
            // ファイルの保存先のパス
            const filePath = path.join(saveDirectory, filename);

            // ファイルを保存
            await fs.writeFileSync(filePath, file);

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
