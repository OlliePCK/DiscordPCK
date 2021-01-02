module.exports = {
	name: 'ping',
	desc: 'This is a ping command',
	execute(message) {
		if(message.member.roles.cache.has('585604448181551109')) {
			message.channel.send('pong <:Pog:758867585650655245>');
		}
		else {
			message.channel.send('Boost the server donkey');
		}
		return;
	},
};