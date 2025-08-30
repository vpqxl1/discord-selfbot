module.exports = {
  async handleError(channel, error, context = '') {
    console.error(`Error${context ? ` (${context})` : ''}:`, error);
    if (channel && typeof channel.send === 'function') {
      try {
        await channel.send(`❌ ${context ? context + ': ' : ''}${error.message || error}`);
      } catch (sendErr) {
        console.error('Failed to send error message:', sendErr);
      }
    }
  }
};
