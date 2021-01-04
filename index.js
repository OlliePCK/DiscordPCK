const fs = require('fs');
const Discord = require('discord.js');
const { prefix } = require('./config.json');
const { api, token } = require('./keys.json');
const { YTSearcher } = require('ytsearcher');

const gameExpose = require('./presence_functions/game-expose');
const liveNoti = require('./presence_functions/live-noti');


const mongo = require('./mongo');
const exposeSchema = require('./schemas/expose-schema');

const searcher = new YTSearcher({
	key: api,
	revealed: true,
});

const queue = new Map();

const client = new Discord.Client();
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	const commandName = command.config.name;
	client.commands.set(commandName, command);
	if (command.config.aliases) {
		command.config.aliases.forEach(alias => {
			client.aliases.set(alias, commandName);
		});
	}
}

client.once('ready', async () => {
	console.log('Ready!');
	await resetSent();
	// gameExpose(client);
	liveNoti(client);
	setInterval(resetSent, 3600000);
});

async function resetSent() {
	await mongo().then(async mongoose => {
		try {
			const res = await exposeSchema.updateMany(
				{
					sent: true,
				},
				{
					sent: false,
				},
			);
			const matched = await res.n;
			const modded = await res.nModified;
			console.log(`Reset ${modded} of ${matched} matches!`);
		}
		finally {
			mongoose.connection.close();
		}
	});
}


client.on('message', async (message) => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	const command = client.commands.get(commandName) || client.commands.get(client.aliases.get(commandName));

	if (!command) {return;}

	try {
		command.run(message, args, client, queue, searcher);
	}
	catch (err) {
		console.error(err);
		message.reply('There was an error trying to execute that command!');
	}
});


client.login(token);
