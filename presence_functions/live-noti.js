const { live } = require('../config.json');


module.exports = client => {
	client.on('presenceUpdate', async (oldPresence, newPresence) => {
		if (oldPresence == undefined) {
			return;
		}
		const oldStreamingStatus = oldPresence.activities.find(activity => activity.type === 'STREAMING') ? true : false;
		const newStreamingStatus = newPresence.activities.find(activity => activity.type === 'STREAMING') ? true : false;
		const discName = newPresence.user.username;
		if (newStreamingStatus === true && oldStreamingStatus === false) {
			const streamURL = newPresence.activities.find(activity => activity.type === 'STREAMING').url;
			console.log(`${discName}, just went live!`);
			if (newPresence.user.id == '417114664783314945') {
				return;
			}
			newPresence.member.roles.add('767677351412629505');
			return client.channels.cache.get(live).send(`**${discName}** just went live! Watch: ${streamURL}`).catch(console.error);
		}
		else if (oldStreamingStatus === true && newStreamingStatus === false) {
			newPresence.member.roles.remove('767677351412629505');
			return console.log(`${discName}, just stopped streaming.`);
		}
	});
};