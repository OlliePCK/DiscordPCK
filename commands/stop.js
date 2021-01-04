module.exports.run = (message, args, client, queue) => {
	const serverQueue = queue.get(message.guild.id);
	if (!serverQueue || serverQueue.connection.dispatcher == null) {
		return message.channel.send('There is no music currently playing!');
	}
	if(message.member.voice.channel != message.guild.me.voice.channel) {
		return message.channel.send('You need to join the voice chat first!');
	}
	serverQueue.songs = [];
	serverQueue.connection.dispatcher.end();
};

module.exports.config = {
	name: 'stop',
	aliases: ['dc'],
	desc: 'Stop the music bot',
};