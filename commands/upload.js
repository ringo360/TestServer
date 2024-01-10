const { SlashCommandBuilder } = require('discord.js');
const config = require("../config.json");
const path = require('path')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('upload')
        .setDescription('ファイルをcdnにアップロード')
        .addAttachmentOption(option =>
            option
                .setName("file")
                .setRequired(true)
                .setDescription("アップロードするファイル"))
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

            interaction.editReply(`${filename}をアップロードしました!`);
			/*
            const user = interaction.user;
            const dmChannel = await user.createDM();
            dmChannel.send({
                embeds: [{
                    title: `${res2.data.fileName}がアップロードされました!` + (isPrivate ? " (プライベート)" : ""),
                    color: 0x5865f2,
                    fields: [{
                        name: "URL",
                        value: "```" + "https://cdn.mcsv.life/" + (isPrivate ? " private/" : "") + res2.data.fileName + "```" + "\n[Click to copy!](https://paste-pgpj.onrender.com/?p=" + "https://cdn.mcsv.life/" + (isPrivate ? " private/" : "") + `${res2.data.fileName})`,
                    }]
                }]
            });
			*/
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
