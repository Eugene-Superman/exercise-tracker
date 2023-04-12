const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

const User = require("./models/user");
const Exercise = require("./models/exercise");

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users/:_id/logs", async (req, res) => {
	const { _id } = req.params;
	const { from, to, limit } = req.query;
	if (!_id) {
		return res.json({ error: "Id is not provided" });
	}
	const currentUser = await User.findById(_id, "-__v");
	const searchParams = {
		user: {
			_id,
		},
	};
	if (from || to) {
		searchParams.date = {
			...(from ? { $gte: new Date(from) } : {}),
			...(to ? { $lte: new Date(to) } : {}),
		};
	}
	const userExercises = await Exercise.find(
		searchParams,
		"description duration date -_id"
	)
		.limit(limit || 0)
		.lean();

	res.json({
		...currentUser._doc,
		count: userExercises.length,
		log: userExercises.map((exercise) => ({
			...exercise,
			date: exercise.date.toDateString(),
		})),
	});
});

app.get("/api/users", async (req, res) => {
	const userList = await User.find({}, "-__v");
	res.json(userList);
});

app.post("/api/users", async (req, res) => {
	const { username } = req.body;
	if (!username) {
		return res.json({ error: "User name is required" });
	}
	const newUser = new User({
		username,
	});
	await newUser.save();
	const { __v, ...userDataToDisplay } = newUser._doc;
	res.json(userDataToDisplay);
});

app.post("/api/users/:_id/exercises", async (req, res) => {
	const { description, duration, date } = req.body;
	const { _id: userId } = req.params;

	const currentUser = await User.findById(userId);
	if (!currentUser) {
		return res.json({ error: "No user found" });
	}
	const selectedDate = new Date(date);
	const exerciseDuration = +duration;

	if (!description) {
		return res.json({ error: "Description is required" });
	}
	if (!duration || isNaN(exerciseDuration)) {
		return res.json({ error: "Duration is not a number" });
	}
	if (date && isNaN(selectedDate)) {
		return res.json({ error: "Date is not valid" });
	}

	const newExercise = new Exercise({
		user: currentUser,
		description,
		duration: exerciseDuration,
		date: date ? selectedDate : new Date(),
	});

	await newExercise.save();

	const { __v, _id, user, ...exerciseToDisplay } = newExercise._doc;
	res.json({
		...exerciseToDisplay,
		date: exerciseToDisplay.date.toDateString(),
		username: user.username,
		_id: user._id,
	});
});

const listener = app.listen(process.env.PORT || 3000, () => {
	mongoose.connect(process.env.MONGO_URI);
	console.log("Your app is listening on port " + listener.address().port);
});
