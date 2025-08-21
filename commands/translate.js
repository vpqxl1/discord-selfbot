// commands/translate.js
const { translate } = require('@vitalets/google-translate-api');

module.exports = {
  name: 'translate',
  description: 'Translates a text from one language to another.',
  /**
   * Executes the command.
   *
     * @param {Channel} channel The channel where the command was executed.
     * @param {Message} message The message object for the command.
     * @param {Client} client The client or bot instance.
     * @param {String[]} args The arguments passed with the command.
   */
  async execute(channel, message, client, args) {
    // Checks if all arguments are fullfilled
    if (args.length < 4 || args[1].toLowerCase() !== 'to') {
      message.channel.send('Usage: [Sourcelanguage] to [Targetlanguage] [Text]'); //Usage 
      return;
    }

    // Extracting of the Source- and targetlangue and text to translate
    const sourceLanguage = args[0].toLowerCase();
    const targetLanguage = args[2].toLowerCase();
    const textToTranslate = args.slice(3).join(' ');

    try {
      // Translates the text
      const res = await translate(textToTranslate, { from: sourceLanguage, to: targetLanguage });
      message.channel.send(`Translated: ${res.text}`);
    } catch (error) {
      console.error('Error while translating:', error);
      message.channel.send('❌ Error Translating. Try again later.');
    }
  }
};
