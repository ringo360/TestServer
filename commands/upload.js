const { SlashCommandBuilder } = require('discord.js');
const config = require("../config.json");
const path = require('path');
const fs = require('fs')
const axios = require('axios')
const { Rcon } = require('rcon-client');

async function replaceColorsWithANSI(input) {
    const colorMap = {
        '0': '\x1b[30m', // Black
        '1': '\x1b[34m', // Dark Blue
        '2': '\x1b[32m', // Dark Green
        '3': '\x1b[36m', // Dark Aqua
        '4': '\x1b[31m', // Dark Red
        '5': '\x1b[35m', // Dark Purple
        '6': '\x1b[33m', // Gold
        '7': '\x1b[37m', // Gray
        '8': '\x1b[90m', // Dark Gray
        '9': '\x1b[94m', // Blue
        'a': '\x1b[92m', // Green
        'b': '\x1b[96m', // Aqua
        'c': '\x1b[91m', // Red
        'd': '\x1b[95m', // Light Purple
        'e': '\x1b[93m', // Yellow
        'f': '\x1b[97m', // White
        'r': '\x1b[0m',  // Reset
		'l': '\x1b[1m',  // Bold
        'o': '\x1b[3m',  // Italic
    };

    return input.replace(/§([0-9a-fr])/ig, (match, group) => colorMap[group.toLowerCase()] || '');
}


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
			return;
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
			const length = await result.length
			let parsedmsg = 'なし'
			let shouldattachment = false
			if (length >= 1800) {
				const colorCodeRegex = /§[0-9a-fklmnor]/g;
				parsedmsg = await result.replace(colorCodeRegex, '');
				shouldattachment = true
			} else {
				parsedmsg = await replaceColorsWithANSI(result)
				shouldattachment = false
			}
			
			console.log(await rcon.send(`say ${attachment.name}がデプロイされました！`))
			console.log(await rcon.send(`discord bcast ${attachment.name}がデプロイされました！(実行者: ${interaction.user.username})`))
			console.log("Closing Connection...")
			await rcon.end()
			if (shouldattachment === true) {
				return interaction.editReply({
					content: `${attachment.name}をデプロイしました!\n実行結果:`,
					files: [{
						attachment: Buffer.from(parsedmsg),
						name: `result.txt`
					}]
				})
			} else {
				return interaction.editReply('`' + attachment.name + '`をデプロイしました!\n実行結果:\n```ansi\n' + parsedmsg + '\n```');
			}
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
