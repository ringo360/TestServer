//* Discord.js Bot - by ringoXD -
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = '1';
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const fs = require("fs");
const path = require("path");
const config = require('./config.json');

const creset = '\x1b[0m';
const cgreen = '\x1b[32m';
const cred = '\x1b[31m';

let commands = [];

//!RUN=======================

console.log('Starting...')
let cmdscount = 0;
fs.readdirSync(path.join(__dirname, "commands"), {
    withFileTypes: true
}).forEach((file) => {
    if (!file.isFile() || path.extname(file.name) != ".js")
        return;
    let cmds = require(path.join(__dirname, "commands", file.name));
	cmdscount++;
    if (Array.isArray(cmds))
        commands = [...commands, ...cmds];
    else
        commands.push(cmds);
})

const options = {
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.MessageContent
	],
};

console.log(`${cgreen}Loaded ${cmdscount} commands!${creset}`)
const client = new Client(options);


client.on('ready', async () => {
	client.templinks = [];
	console.log(`${cgreen}Logged in as${creset} ${client.user.tag}`);
	client.user.setPresence({
		activities: [{
			name: `Created by ringoXD`,
			state: `uwu`,
			type: ActivityType.Playing,
		}],
		status: "dnd",
	});
	console.log(`Registering commands...`)
	await client.application.commands.set(commands.map(x => x.data.toJSON()));
	console.log(`${cgreen}Ready!${creset}`);
	let SyslogChannel = client.channels.cache.get("1151139585791901746");
	SyslogChannel.send('Discord.js Bot is Ready!')
})


client.on("interactionCreate", async interaction => {
	if (!interaction.isCommand()) return;

	let command = commands.find(x => x.data.name == interaction.commandName);
	if (!command) {
		console.error(`${interaction.commandName}というコマンドには対応していません。`);
		return;
	}
	try {
		await command.execute(interaction);
	} catch (error) {
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'コマンド実行時にエラーになりました。', ephemeral: true });
		} else {
			await interaction.reply({ content: 'コマンド実行時にエラーになりました。', ephemeral: true });
		}
		throw error;
	}
});

client.login(config.token);

process.on('uncaughtException', function (err) {
	console.error(err);
});
