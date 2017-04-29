const Discord = require('discord.js');

// Entry
const points = function(message) {
	// message = msg;
	userDatabase.findOne({'userId': message.author.id}, function(err,user) {
		if (user == null) {
			const newUser = {
				name: message.author.username,
				userId: message.author.id,
				points: 500
			}
			userDatabase.create(newUser);
		}
		const points = user ? user.points : 500;
		message.channel.sendMessage(`**${message.author.username}** has ${points} points`);
	})
	return;
}

const gamble = function(message) {
	// message = msg;
	const splits = message.content.split(' ');
	const gambleAmount = Math.min(Number(splits[2]),1000);

	// id = message.author.id;

	if (Number.isNaN(gambleAmount)) {
		message.channel.sendMessage('Please gamble with proper amount baka');
		return;
	}

	getUser(message, gambleAmount)
		.then(conditional);
}

////////////////////////////
const getUser = function(message, gambleAmount) {
	const promise = new Promise((resolve, reject) => {
		userDatabase.findOne({'userId': message.author.id}, function(err, user) {
			resolve({user: user, message: message, gambleAmount: gambleAmount});
		})
	});
	return promise;
}

const gambling = function(user, message, gambleAmount) {
	const promise = new Promise((resolve, reject) => {
		const currentAmount = user.points;
		const win = Math.random() < 0.33 ? true : false;
		// jackpot(win);
		const newAmount = win ? (currentAmount + gambleAmount) : (currentAmount - gambleAmount);

		message.channel.sendMessage(`**${message.author.username}**-sama you ${win ? 'win' : 'lose'}, ${currentAmount} => ${newAmount}`)
		resolve({newAmount: newAmount, message: message});
	});
	return promise;
}

// const jackpot = function(win) {
// 	if (win) {
// 		message.channel.sendMessage("jackpot won");
// 	} else {
// 		pot++
// 	}
// 	message.channel.sendMessage(pot);
// }

const updateUser = function ({newAmount, message}) {
	userDatabase.update({'userId': message.author.id}, {$set: {'points': newAmount}}, function (err, user) {
		if (err) return handleError(err);
	});
	return;
}

const conditional = function({user, message, gambleAmount}) {
	if (user == null) {
		message.channel.sendMessage(`**${message.author.username}**-sama, do credits first <3`);
		return;
	} else if (user.points <= 0) {
		message.channel.sendMessage(`**${message.author.username}**-sama, your such a peasant, you have ${user.points} points :,(`);
		return;
	} else {
		return gambling(user, message, gambleAmount).then(updateUser);
	}
}

module.exports = {points, gamble};