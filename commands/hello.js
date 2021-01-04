module.exports = {
	name: 'hello',
	aliases: ['hi'],
	desc: 'This is a ping command',
	execute(message) {
		message.channel.send('Hello');
	},
};