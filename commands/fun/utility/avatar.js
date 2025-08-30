module.exports = {
    name: 'avatar',
    description: 'Get user avatar',
    execute(channel, message, client, args) {
        message.delete().catch(() => {});
        
        const user = message.mentions.users.first() || message.author;
        const avatarURL = user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });
        
        message.channel.send(`${user.username}'s avatar: ${avatarURL}`);
    }
};
