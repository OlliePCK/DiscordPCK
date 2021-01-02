/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
const fs = require('fs');
const Discord = require('discord.js');
const { prefix, live, general } = require('./config.json');
const db = require('quick.db');
const gameExpose = new db.table('gameExpose');
const { executionAsyncResource } = require('async_hooks');
const ytdl = require('ytdl-core');
const { YTSearcher } = require('ytsearcher');

const searcher = new YTSearcher({
	key: process.env.YTapi,
	revealed: true,
});

const queue = new Map();

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

const d = new Date();

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.once('ready', () => {
	console.log('Ready!');
});

function resetSent() {
	const table = gameExpose.all();
	const arrayLength = table.length;
	// eslint-disable-next-line no-var
	for (var i = 0; i < arrayLength; i++) {
		gameExpose.set(table[i].ID, 'false');
	}
	return;
}

setInterval(resetSent, 14400000);

client.on('presenceUpdate', (oldPresence, newPresence) => {
	console.log('Presence update detected');
	const expName = newPresence.user.username.toString();
	if (!gameExpose.get(expName)) {
		gameExpose.set(expName, 'false');
	}
	if (gameExpose.get(expName) == 'false') {
		if (newPresence.activities.find(activity => activity.timestamps)) {
			const date = newPresence.activities.find(activity => activity.timestamps);
			const n = d.getTime();
			const g = date.timestamps.start.getTime();
			const hours = Math.abs(n - g) / 36e5;
			if (hours >= 4) {
				gameExpose.set(expName, 'true');
				console.log(`${newPresence.user.username} has been playing ${date.name} for ${Math.round(hours)} hours, time to wrap it the fuck up and go outside or get some sleep.`);
				client.channels.cache.get(general).send(`${newPresence.user.username} has been playing ${date.name} for ${Math.round((hours) * 100) / 100} hours, time to wrap it the fuck up and go outside or get some sleep.`);
			}
		}
	}
	if (oldPresence == undefined) {
		return;
	}
	const oldStreamingStatus = oldPresence.activities.find(activity => activity.type === 'STREAMING') ? true : false;
	const newStreamingStatus = newPresence.activities.find(activity => activity.type === 'STREAMING') ? true : false;
	const discName = newPresence.user.username;
	if (newStreamingStatus === true && oldStreamingStatus === false) {
		const streamURL = newPresence.activities.find(activity => activity.type === 'STREAMING').url;
		console.log(`${discName}, just went live!`);
		if (newPresence.user.id == '417114664783314945') {
			return;
		}
		newPresence.member.roles.add('767677351412629505');
		return client.channels.cache.get(live).send(`**${discName}** just went live! Watch: ${streamURL}`).catch(console.error);
	}
	else if (oldStreamingStatus === true && newStreamingStatus === false) {
		newPresence.member.roles.remove('767677351412629505');
		return console.log(`${discName}, just stopped streaming.`);
	}
});


client.on('message', async (message) => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	const serverQueue = queue.get(message.guild.id);

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
			const result = await searcher.search(args.join(' '), { type: 'video' });
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

	const command = client.commands.get(commandName);

	try {
		command.execute(message, args, client);
	}
	catch (error) {
		console.error(error);
		message.reply('There was an error trying to execute that command!');
	}
});


client.login(process.env.token);
