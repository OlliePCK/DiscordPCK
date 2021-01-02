module.exports = {
	name: 'purge',
	desc: 'This is a command to purge a specified number of messages',
	execute(message, args) {
		const amount = parseInt(args[0]) + 1;

		if (isNaN(amount)) {
			return message.reply('That isn\'t a valid number <:Pepega:758867585738866719><a:Clap:758867584048693258>');
		}
		else if (amount < 1 || amount > 100) {
			return message.reply('You tryna nuke us? Can only purge max 100 messages at a time <:HYPERBRUH:758867584204013598>');
		}

		message.channel.bulkDelete(amount, true).catch(err => {
			console.error(err);
			message.channel.send('Try again <a:peepoRiot:758867587097821204>');
			return;
		});
	},
};