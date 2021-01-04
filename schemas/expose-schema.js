const mongoose = require('mongoose');

const reqString = {
	type: String,
	required: true,
};
const reqBool = {
	type: Boolean,
	required: true,
};

const exposeSchema = mongoose.Schema({
	guildid: reqString,
	userid: reqString,
	sent: reqBool,
});

module.exports = mongoose.model('sent-exposes', exposeSchema);