module.exports.run = (message, args, client, queue, searcher) => {
	console.log('Sim queue');
};

module.exports.config = {
	name: 'queue',
	aliases: ['q', 'que', 'queued'],
	desc: 'Show the music queue',
};