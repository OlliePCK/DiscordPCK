const mongo = require('../mongo');
const exposeSchema = require('../schemas/expose-schema');
const { general } = require('../config.json');

module.exports = client => {
	client.on('presenceUpdate', async (newPresence) => {
		if (newPresence == undefined) {
			return;
		}
		else {
			const act = newPresence.activities.find(activity => activity.timestamps != null);
			if (act) {
				const userid = newPresence.user.id;
				const username = newPresence.user.username;
				const guild = newPresence.guild.id;
				console.log('Presence activity update detected:');
				console.log(`Username: ${username}\nGuild ID: ${guild}\nUser ID: ${newPresence.user.id}`);
				const n = new Date();
				const g = act.timestamps.start;
				if (g <= 0) {
					return;
				}
				const hours = Math.abs(n - g) / 36e5;
				if (hours >= 4) {
					await mongo().then(async mongoose => {
						try {
							console.log('Connected to MongoDB');
							await exposeSchema.findOne({ guildid: guild, userid: userid }, async function(err, doc) {
								if (err) return;
								if (doc) {
									if (doc.sent == true) {return;}
									else if (doc.sent == false) {
										await exposeSchema.findOneAndReplace({
											guildid: guild,
											userid: userid,
										}, {
											guildid: guild,
											userid: userid,
											sent: true,
										}, {
											upsert: true,
										});
										console.log(`${newPresence.user.username} has been playing ${act.name} for ${Math.round(hours)} hours.`);
										if (newPresence.member.nickname == null || newPresence.member.nickname == undefined) {
											return client.channels.cache.get(general).send(`${newPresence.user.username} has been playing ${act.name} for ${Math.round((hours) * 100) / 100} hours.`);
										}
										else {
											return client.channels.cache.get(general).send(`${newPresence.user.nickname} has been playing ${act.name} for ${Math.round((hours) * 100) / 100} hours.`);
										}
									}
								}
								else {
									await exposeSchema({
										guildid: guild,
										userid: userid,
										sent: false,
									}).save();
									console.log(`${username} added to database`);
									return;
								}
							});
						}
						finally {
							await mongoose.connection.close();
							console.log('Disconnected from MongoDB');
						}
					});
				}
			}
		}
	});
};