const Discord = require('discord.js');
const unirest = require('unirest');

const define = function(message) {
	var splits = message.content.split(' ');
	splits.splice(0, 2);
	const search = splits.join('+');
	const word = splits.join(' ');

	unirest.get('http://api.urbandictionary.com/v0/define?term='+search)
		.end(function(res) {
    		if (res.error) {
    			message.channel.sendMessage('Something bad happenened... T______T');
    		} else {
    			if (res.body.result_type == 'exact') {
    				const item = res.body.list[0];
    				const definition = item.definition ? `${item.definition}` : '';
    				const example = item.example ? `${item.example}` : '';
    				message.channel.sendEmbed({ description: 
    					`
							**${word}**

							_Definition_
							${definition}

							_Example_
							${example}
						`
					});
				} else {
					message.channel.sendMessage(`What the hell is ${word} retard...`);
				};
    		};
    	});
	return;
}

module.exports = {define};