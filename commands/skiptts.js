module.exports.run = (message, args, client, queue, ttsqueue) => {
	const serverQueue = ttsqueue.get(message.guild.id);
	if (!serverQueue || serverQueue.connection.dispatcher == null) {
		return message.channel.send('There is nothing to skip!');
	}
	if(message.member.voice.channel != message.guild.me.voice.channel) {
		return message.channel.send('You need to join the voice chat and use !tts first!');
	}
	message.delete();
	return serverQueue.connection.dispatcher.end();
};

module.exports.config = {
	name: 'skiptts',
	aliases: ['stts'],
	desc: 'Skip the currently playing TTS',
};