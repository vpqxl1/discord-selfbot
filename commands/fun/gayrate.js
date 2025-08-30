module.exports = {
  name: 'gayrate',
  description: 'Rates how gay a user is.',
  execute(channel, message) {
    // Use mentioned user or the message author
    const member = message.mentions?.members?.first();
    const username = member ? member.user.username : message.author.username;

    const gayness = Math.floor(Math.random() * 101);

    // Simple progress bar
    const filled = Math.round(gayness / 10);
    const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);

    // Send clean output
    channel.send(
      `**Gayness Rating**\n> ${username}\n[${bar}] ${gayness}%`
    );
  }
};

