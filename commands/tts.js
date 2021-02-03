/* eslint-disable no-shadow */
const tts = require('../tts/ttsApi');

module.exports.run = async (message, args, client, queue, ttsqueue) => {
	const vc = message.member.voice.channel;
	if (!vc) {
		return message.reply('You need to be in a voice channel to use TTS!');
	}
	await ttsHandler(message, vc);
	async function ttsHandler(message, vc) {
		const serverttsqueue = ttsqueue.get(message.guild.id);
		const ttsUrl = await tts.getTTSUrl(args.join(' '), 'Brian');
		if(!serverttsqueue || serverttsqueue.connection.dispatcher == null) {
			const ttsqueueConstructor = {
				txtChannel: message.channel,
				vChannel: vc,
				connection: null,
				tts: [],
				volume: 10,
				playing: true,
			};
			ttsqueue.set(message.guild.id, ttsqueueConstructor);

			ttsqueueConstructor.tts.push(ttsUrl);

			try{
				const connection = await ttsqueueConstructor.vChannel.join();
				ttsqueueConstructor.connection = connection;
				await message.guild.me.voice.setSelfDeaf(true);
				await play(message.guild, ttsqueueConstructor.tts[0]);
			}
			catch (err) {
				console.error(err);
				ttsqueue.delete(message.guild.id);
				return message.channel.send(`Unable to join the voice chat ${err}`);
			}
		}
		else{
			serverttsqueue.tts.push(ttsUrl);
		}
	}
	message.delete();
	async function play(guild, tts) {
		if (!tts) {
			return;
		}
		const serverttsqueue = ttsqueue.get(guild.id);
		serverttsqueue.connection
			.play(tts)
			.on('finish', () =>{
				serverttsqueue.tts.shift();
				play(guild, serverttsqueue.tts[0]);
			});
	}
};

module.exports.config = {
	name: 'tts',
	desc: 'Use Brian text-to-speech',
};