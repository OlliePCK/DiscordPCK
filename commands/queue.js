module.exports.run = (message, args, client, queue) => {
	const serverQueue = queue.get(message.guild.id);
	if (!serverQueue) {
		return message.channel.send('There is no music currently playing!');
	}
	if(message.member.voice.channel != message.guild.me.voice.channel) {
		return message.channel.send('You need to join the voice chat first!');
	}
	const nowPlaying = serverQueue.songs[0];
	let queueMessage = `Now playing: ${nowPlaying.title}\n-----------------------\n`;

	for (let i = 1; i < serverQueue.songs.length; i++) {
		queueMessage += `${i}. ${serverQueue.songs[i].title}\n`;
	}

	message.channel.send('```' + queueMessage + 'Requested by: ' + message.author.username + '```');
};

module.exports.config = {
	name: 'queue',
	aliases: ['q', 'que', 'queued'],
	desc: 'Show the music queue',
};