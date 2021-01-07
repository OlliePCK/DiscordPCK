module.exports.run = (message, args, client, queue) => {
	const serverQueue = queue.get(message.guild.id);
	if (!serverQueue || serverQueue.connection.dispatcher == null) {
		return message.channel.send('There is no music currently playing!');
	}
	if(message.member.voice.channel != message.guild.me.voice.channel) {
		return message.channel.send('You need to join the voice chat and play a song first!');
	}
	if(serverQueue.connection.dispatcher.paused) {
		return message.channel.send('The song is already paused');
	}
	serverQueue.connection.dispatcher.pause();
	return message.channel.send('The song has been paused!');
};

module.exports.config = {
	name: 'pause',
	desc: 'Pause the currently playing music',
};