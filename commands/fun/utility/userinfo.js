module.exports = {
    name: 'userinfo',
    description: 'Displays information about a user.',
    execute(channel, message, client, args) {
        let user;

        // If in a guild and someone is mentioned
        if (message.mentions && message.mentions.members && message.mentions.members.size > 0) {
            user = message.mentions.members.first().user;
        } 
        // If in a guild but no one is mentioned
        else if (message.guild) {
            user = message.member.user;
        } 
        // If in a DM
        else {
            user = message.author;
        }

        // Send user info
        const info = `
**User Info**
> Username: ${user.username}
> Discriminator: #${user.discriminator}
> ID: ${user.id}
> Created At: ${user.createdAt.toDateString()}
> Bot: ${user.bot ? 'Yes' : 'No'}
`;

        message.channel.send(info).catch(console.log);
    }
};

