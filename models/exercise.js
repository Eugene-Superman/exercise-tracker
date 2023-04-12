const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema({
	user: {
		type: "ObjectId",
		ref: "User",
	},
	description: {
		type: String,
		required: true,
	},
	duration: {
		type: Number,
		required: true,
	},
	date: {
		type: Date,
		required: true,
	},
});

module.exports = mongoose.model("Exercise", exerciseSchema);
