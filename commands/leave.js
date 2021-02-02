module.exports.run = (message) => {
	if (!message.guild) return;
	// Check if sender is connected to voice channel
	if (!message.member.voice.channel) {
		message.channel.send(`<@${message.member.id}>, you're not in a voice channel`);
		return;
	}
	console.log('Left voice channel');
	message.member.voice.channel.leave();
	return message.delete();

};

module.exports.config = {
	name: 'leave',
	aliases: ['l'],
	desc: 'Stop the tts',
};