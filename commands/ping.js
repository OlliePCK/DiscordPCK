module.exports = {
	name: 'ping',
	desc: 'This is a ping command',
	execute(message) {
		if(message.member.premiumSince) {
			message.channel.send('🏓');
		}
		else {
			message.channel.send('Boost the server donkey');
		}
		return;
	},
};