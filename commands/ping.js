module.exports.run = (message) => {
	if(message.member.premiumSince) {
		message.channel.send('🏓');
	}
	else {
		message.channel.send('Boost the server donkey');
	}
	return;
};

module.exports.config = {
	name: 'ping',
	desc: 'This is a ping command',
};