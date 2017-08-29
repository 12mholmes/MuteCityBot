const Discord = require('discord.js');
const bot = new Discord.Client();
const config = require('./config.json');
var muteCityPath = config.mutepath; 
var dispatcher;
var connection;

function PlayMuteCity() {
	if(connection !== null) {
		dispatcher = connection.playFile(muteCityPath);
		dispatcher.on('end', () => {
			if(connection !== null) {
				PlayMuteCity(connection);
			}
		})
	}
}


bot.on("ready", () => {
	console.log('Bot started');
});

bot.on('voiceStateUpdate', (oldMember, newMember) => {
	let newUserChannel = newMember.voiceChannel
	let oldUserChannel = oldMember.voiceChannel

	if(newUserChannel && newUserChannel.name === 'Mute City' && bot.voiceConnections.size === 0) {
		console.log('enter voice chann');
		//User joins voice cahnnel
		if(newMember.voiceChannel.name === 'Mute City' && bot.voiceConnections.size === 0) {
			console.log('enter mute city');
			newMember.voiceChannel.join().then(connect => {
				connection = connect;
				bot.guilds.first().member(bot.user).setMute(false);
				PlayMuteCity();
			}).catch(console.log);
		}
	} else if(bot.voiceConnections.size !== 0 && bot.voiceConnections.first().channel.members.size === 1) {
		//User leaves voice channel
		console.log('exit voice chann');
		bot.voiceConnections.first().channel.leave();
		connection = null;
		dispatcher = null;
	}
});

bot.login(config.token);
