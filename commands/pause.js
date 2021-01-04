module.exports.run = (message, args, client, queue) => {
	const serverQueue = queue.get(message.guild.id);
	if(!serverQueue.connection) {
		return message.channel.send('There is no music currently playing!');
	}
	if(!message.member.voice.channel) {
		return message.channel.send('You are not in the voice channel!');
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