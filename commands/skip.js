module.exports.run = (message, args, client, queue) => {
	const serverQueue = queue.get(message.guild.id);
	if (!serverQueue || serverQueue.connection.dispatcher == null) {
		return message.channel.send('There is nothing to skip!');
	}
	if(message.member.voice.channel != message.guild.me.voice.channel) {
		return message.channel.send('You need to join the voice chat and play a song first!');
	}
	serverQueue.connection.dispatcher.end();
	return message.channel.send('The song has been skipped!');

};

module.exports.config = {
	name: 'skip',
	aliases: ['next', 's'],
	desc: 'Skip the currently playing music',
};