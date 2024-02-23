const { SlashCommandBuilder } = require('discord.js');
const config = require("../config.json");
const path = require('path');
const fs = require('fs')
const axios = require('axios')
const { Rcon } = require('rcon-client');

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
        let attachment = interaction.options.getAttachment('file');
		await interaction.editReply(`${attachment.attachment}をデプロイ中...`)
		console.log(attachment.attachment);
		let res = await axios.get(attachment.attachment,{ responseType: "arraybuffer" });
		let file = Buffer.from(res.data);

        try {
            // サーバー内の保存ディレクトリのパス
            const saveDirectory = config.savepath
            
            // ファイルの保存先のパス
            const filePath = path.join(saveDirectory, attachment.name);

            // ファイルを保存
            await fs.writeFileSync(filePath, file);
        } catch (e) {
            await interaction.editReply({
                embeds: [{
                    title: "エラー",
                    description: 'ねえ、このエラーどうにかしてよ。' + '\n```' + e + '\n```',
                    color: 0xff0000,
                    footer: {
                        text: "failed to upload!"
                    }
                }]
            })
			console.log(e);
        }
        try {
			console.log(`Connecting to ${config.rconhost1}:${config.rconport1}...`)
			const rcon = new Rcon({
				host: config.rconhost1,
				port: config.rconport1,
				password: config.rconpass1
			});
			await rcon.connect()
			console.log("Sending Request...")
			const result = await rcon.send(`sk reload ${attachment.name}`)
			console.log(await rcon.send(`say ${attachment.name}がデプロイされました！`))
			console.log(await rcon.send(`discord bcast ${attachment.name}がデプロイされました！(実行者: ${interaction.user.username})`))
			console.log("Closing Connection...")
			await rcon.end()
			interaction.editReply('`' + attachment.name + '`をデプロイしました!\n実行結果:\n```' + result + '\n```');
		} catch (e) {
			await interaction.editReply({
                embeds: [{
                    title: "エラー",
                    description: 'ねえ、このエラーどうにかしてよ。' + '\n```' + e + '\n```',
                    color: 0xff0000,
                    footer: {
                        text: "failed to reload skript!"
                    }
                }]
            })
			console.log(e);
		}
    },
};
