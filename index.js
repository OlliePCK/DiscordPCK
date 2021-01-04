/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
const fs = require('fs');
const Discord = require('discord.js');
const { prefix } = require('./config.json');
const { api, token } = require('./keys.json');
const ytdl = require('ytdl-core');
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
	command.config.aliases.forEach(alias => {
		client.aliases.set(alias, commandName);
	});
}

client.once('ready', async () => {
	console.log('Ready!');
	await resetSent();
	gameExpose(client);
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

	const serverQueue = queue.get(message.guild.id);

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	const command = client.commands.get(commandName) || client.commands.get(client.aliases.get(commandName));

	if (!command) {return;}

	try {
		command.execute(message, args, client);
	}
	catch (error) {
		console.error(error);
		message.reply('There was an error trying to execute that command!');
	}

	if (!client.commands.has(commandName)) {
		if (commandName == 'play') {
			execute(message, serverQueue);
			return;
		}
		else if (commandName == 'stop') {
			stop(message, serverQueue);
			return;
		}
		else if (commandName == 'skip') {
			skip(message, serverQueue);
			return;
		}
		else if (commandName == 'pause') {
			pause(serverQueue);
			return;
		}
		else {
			return;
		}
	}

	async function execute(message, serverQueue) {
		const vc = message.member.voice.channel;
		if(!args.length) {
			if(!serverQueue.connection) {return message.channel.send('There is no music currently playing!');}
			if(!message.member.voice.channel) {return message.channel.send('You are not in the voice channel!');}
			if(serverQueue.connection.dispatcher.resumed) {return message.channel.send('The song is already playing!');}
			serverQueue.connection.dispatcher.resume();
			return message.channel.send('The song has been resumed!');
		}
		if(!vc) {
			return message.channel.send('Please join a voice chat first');
		}
		else{
			const query = args.join(' ') + ' audio';
			const result = await searcher.search(query, { type: 'video' });
			const songInfo = await ytdl.getInfo(result.first.url);

			const song = {
				title: songInfo.videoDetails.title,
				url: songInfo.videoDetails.video_url,
			};

			if(!serverQueue) {
				const queueConstructor = {
					txtChannel: message.channel,
					vChannel: vc,
					connection: null,
					songs: [],
					volume: 9,
					playing: true,
				};
				queue.set(message.guild.id, queueConstructor);

				queueConstructor.songs.push(song);

				try{
					const connection = await vc.join();
					await connection.voice.setSelfDeaf(true);
					queueConstructor.connection = connection;
					play(message.guild, queueConstructor.songs[0]);
				}
				catch (err) {
					console.error(err);
					queue.delete(message.guild.id);
					return message.channel.send(`Unable to join the voice chat ${err}`);
				}
			}
			else{
				serverQueue.songs.push(song);
				return message.channel.send(`The song has been added ${song.url}`);
			}
		}
	}
	function play(guild, song) {
		const serverQueue = queue.get(guild.id);
		if(!song) {
			serverQueue.vChannel.leave();
			queue.delete(guild.id);
			return;
		}
		const dispatcher = serverQueue.connection
			.play(ytdl(song.url))
			.on('finish', () =>{
				serverQueue.songs.shift();
				play(guild, serverQueue.songs[0]);
			});
		serverQueue.txtChannel.send(`Now playing ${serverQueue.songs[0].url}`);
	}
	function stop(message, serverQueue) {
		if(!message.member.voice.channel) {return message.channel.send('You need to join the voice chat first!');}
		serverQueue.songs = [];
		serverQueue.connection.dispatcher.end();
	}
	function skip(message, serverQueue) {
		if(!message.member.voice.channel) {return message.channel.send('You need to join the voice chat first');}
		if(!serverQueue) {return message.channel.send('There is nothing to skip!');}
		serverQueue.connection.dispatcher.end();
	}
	function pause(serverQueue) {
		if(!serverQueue.connection) {return message.channel.send('There is no music currently playing!');}
		if(!message.member.voice.channel) {return message.channel.send('You are not in the voice channel!');}
		if(serverQueue.connection.dispatcher.paused) {return message.channel.send('The song is already paused');}
		serverQueue.connection.dispatcher.pause();
		message.channel.send('The song has been paused!');
	}
});


client.login(token);
