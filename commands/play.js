/* eslint-disable no-shadow */
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const { YTSearcher } = require('ytsearcher');
// const { api } = require('../keys.json');
const Discord = require('discord.js');

const searcher = new YTSearcher({
	key: process.env.api,
	revealed: true,
});

module.exports.run = async (message, args, client, queue) => {
	const vc = message.member.voice.channel;
	if (!vc) {
		return message.reply('You need to be in a voice channel to play music!');
	}
	const url = args.join('');
	if(url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
		try {
			await ytpl(url).then(async playlist => {
				message.channel.send(`The playlist ${playlist.title} had been added!`);
				playlist.items.forEach(async item => {
					await videoHandler(await ytdl.getInfo(item.shortUrl), message, vc, true);
				});
			});
		}
		catch (error) {
			console.error();
		}
	}
	else {
		const result = await searcher.search(args.join(' '), { type: 'video' });
		if (result.first == null) {
			return message.channel.send('There are no results for the search!');
		}
		const songInfo = await ytdl.getInfo(result.first.url);
		return videoHandler(songInfo, message, vc);
	}
	async function videoHandler(songInfo, message, vc, playlist = false) {
		const serverQueue = queue.get(message.guild.id);
		if(!args.length) {
			if(!serverQueue || serverQueue.connection.dispatcher == null) {
				return message.channel.send('There is no music currently playing!');
			}
			if(!message.member.voice.channel) {
				return message.channel.send('You are not in the voice channel!');
			}
			if (serverQueue.connection.dispatcher != null) {
				if(serverQueue.connection.dispatcher.resumed) {
					return message.channel.send('The song is already playing!');
				}
				else {
					await serverQueue.connection.dispatcher.resume();
					return message.channel.send('The song has been resumed!');
				}
			}
		}
		const song = {
			title: songInfo.videoDetails.title,
			url: songInfo.videoDetails.video_url,
			vLength: songInfo.videoDetails.lengthSeconds,
			thumbnail: songInfo.videoDetails.thumbnails[3].url,
		};
		if(!serverQueue || serverQueue.connection.dispatcher == null) {
			const queueConstructor = {
				txtChannel: message.channel,
				vChannel: vc,
				connection: null,
				songs: [],
				volume: 10,
				playing: true,
			};
			queue.set(message.guild.id, queueConstructor);

			queueConstructor.songs.push(song);

			try{
				const connection = await queueConstructor.vChannel.join();
				queueConstructor.connection = connection;
				await message.guild.me.voice.setSelfDeaf(true);
				await play(message.guild, queueConstructor.songs[0]);
			}
			catch (err) {
				console.error(err);
				queue.delete(message.guild.id);
				return message.channel.send(`Unable to join the voice chat ${err}`);
			}
		}
		else{
			serverQueue.songs.push(song);
			if(playlist) {
				return undefined;
			}
			const dur = `${parseInt(song.vLength / 60)}:${song.vLength - 60 * parseInt(song.vLength / 60)}`;
			const msg = new Discord.MessageEmbed()
				.setTitle('Song Added')
				.addField(song.title, '______')
				.addField('Song duration: ', dur)
				.setThumbnail(song.thumbnail)
				.setColor('#00ffcc')
				.setURL(song.url);
			return message.channel.send(msg);
		}
	}
	async function play(guild, song) {
		const serverQueue = queue.get(guild.id);
		if(!song) {
			await serverQueue.vChannel.leave();
			queue.delete(guild.id);
			return;
		}
		const stream = ytdl(song.url, { highWaterMark: 1 << 25, filter: 'audioonly' });
		serverQueue.connection
			.play(stream)
			.on('finish', () =>{
				serverQueue.songs.shift();
				play(guild, serverQueue.songs[0]);
			});
		const dur = `${parseInt(serverQueue.songs[0].vLength / 60)}:${serverQueue.songs[0].vLength - 60 * parseInt(serverQueue.songs[0].vLength / 60)}`;
		const msg = new Discord.MessageEmbed()
			.setTitle('Now Playing')
			.addField(serverQueue.songs[0].title, '______')
			.addField('Song duration: ', dur)
			.setThumbnail(serverQueue.songs[0].thumbnail)
			.setColor('#00ffcc')
			.setURL(serverQueue.songs[0].url);
		return serverQueue.txtChannel.send(msg);
	}
};

module.exports.config = {
	name: 'play',
	aliases: ['p', 'pl', 'resume'],
	desc: 'Play music in a voice channel',
};