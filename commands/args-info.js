module.exports.run = (message, args, client, queue, searcher) => {
	if (!args.length) {
		return message.channel.send(`You didn't provide any arguments, ${message.author}!`);
	}
	else if (args[0] === 'foo') {
		return message.channel.send('bar');
	}

	message.channel.send(`Arguments: ${args}\nArguments length: ${args.length}`);
};

module.exports.config = {
	name: 'args-info',
	aliases: ['args'],
	description: 'Information about the arguments provided.',
};