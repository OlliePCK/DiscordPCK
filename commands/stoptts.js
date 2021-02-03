module.exports.run = (message, args, client, queue, ttsqueue) => {
	const serverQueue = ttsqueue.get(message.guild.id);
	if (!serverQueue || serverQueue.connection.dispatcher == null) {
		return message.channel.send('There is no TTS currently playing!');
	}
	if(message.member.voice.channel != message.guild.me.voice.channel) {
		return message.channel.send('You need to join the voice chat and use !tts first!');
	}
	message.delete();
	serverQueue.tts = [];
	return serverQueue.connection.dispatcher.end();
};

module.exports.config = {
	name: 'stoptts',
	desc: 'Stop the TTS bot',
};