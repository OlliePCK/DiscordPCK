const mongoose = require('mongoose');
// const { mongoPath } = require('./keys.json');
const mongoPath = process.env.mongodb;

module.exports = async () => {
	await mongoose.connect(mongoPath, {
		useNewUrlParser: true,
		useUnifiedTopology: false,
		useFindAndModify: false,
		poolSize: 100,
	});
	return mongoose;
};