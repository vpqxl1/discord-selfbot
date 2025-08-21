module.exports = {
  name: 'loverate',
  description: 'Rates the compatibility of two mentioned users as lovers.',
  execute(channel, message) {
    // Try deleting the trigger message
    if (message.deletable !== false) {
      message.delete().catch(() => {});
    }

    const users = message.mentions?.users;
    if (!users || users.size !== 2) {
      return channel.send('Please mention exactly two users to rate their compatibility as lovers.');
    }

    const [u1, u2] = [...users.values()];
    const compatibility = Math.floor(Math.random() * 101);

    // Progress bar
    const filled = Math.round(compatibility / 10);
    const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);

    // Verdict based on score
    const verdict =
      compatibility >= 90 ? '💖 Perfect match!' :
      compatibility >= 70 ? '💘 Great chemistry!' :
      compatibility >= 50 ? '💞 Could work with effort.' :
      compatibility >= 30 ? '💔 Not ideal, but who knows?' :
                            '🧊 It’s complicated...';

    channel.send(
      [
        '💘 **Love Compatibility**',
        `> <@${u1.id}> + <@${u2.id}>`,
        `**${compatibility}%**  | ${bar}`,
        verdict
      ].join('\n')
    );
  }
};

