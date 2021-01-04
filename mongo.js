const mongoose = require('mongoose');
const mongoPath = process.env.mogno;

module.exports = async () => {
	await mongoose.connect(mongoPath, {
		useNewUrlParser: true,
		useUnifiedTopology: false,
		useFindAndModify: false,
		poolSize: 100,
	});
	return mongoose;
};
