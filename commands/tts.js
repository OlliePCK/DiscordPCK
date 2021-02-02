const tts = require('../tts/ttsApi');

module.exports.run = async (message, args) => {
	const vc = message.member.voice.channel;
	if (!vc) {
		return message.reply('You need to be in a voice channel to play music!');
	}
	// Check if the argument count is correct
	if (args.length < 1) {
		message.channel.send('Invalid arguments for `tts` command');
		return;
	}
	const ttsUrl = await tts.getTTSUrl(args.join(' '), 'Brian');
	let audioPlayer;
	vc.join().then(async (connection) => {
		console.log('Connected to voice channel');
		/**
		 * Wait until the end of the audio stream
		 * @param {discord.StreamDispatcher} currentPlayer The current voice connection to the server
		 */
		const waitUntilEnd = (currentPlayer) => {
			return new Promise((resolve) => {
				currentPlayer.on('end', () => resolve());
			});
		};

		while (connection) {
			const audioUrl = ttsUrl;
			if (!connection || ttsUrl === undefined) break;
			audioPlayer = connection.play(audioUrl);
			await waitUntilEnd(audioPlayer);
			connection.dispatcher.end();
		}
	});
};

module.exports.config = {
	name: 'tts',
	aliases: ['brian'],
	desc: 'Text to speech',
};