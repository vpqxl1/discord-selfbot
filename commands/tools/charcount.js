const CommandBase = require('../CommandBase');

module.exports = {
    name: 'charcount',
    description: 'Count characters, words, and analyze text',
    aliases: ['count', 'textcount', 'wc'],
    usage: 'charcount <text>',
    cooldown: 2000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length === 0) {
            return base.sendError(channel, 'Please provide text to analyze. Usage: v!charcount Your text here');
        }

        const text = args.join(' ');
        
        const stats = this.analyzeText(text);
        
        const response = `
📊 **Text Analysis**
**Text:** ${text.length > 50 ? text.substring(0, 50) + '...' : text}

**Basic Stats:**
• Characters: ${stats.characters}
• Words: ${stats.words}
• Sentences: ${stats.sentences}
• Lines: ${stats.lines}

**Advanced Stats:**
• Avg. word length: ${stats.avgWordLength.toFixed(2)} chars
• Avg. sentence length: ${stats.avgSentenceLength.toFixed(2)} words
• Reading time: ${stats.readingTime} minute${stats.readingTime !== 1 ? 's' : ''}

**Character Frequency (Top 5):**
${stats.topCharacters.map(([char, count]) => `• "${char}": ${count} time${count !== 1 ? 's' : ''}`).join('\n')}

**Word Frequency (Top 5):**
${stats.topWords.map(([word, count]) => `• "${word}": ${count} time${count !== 1 ? 's' : ''}`).join('\n')}
        `.trim();

        await base.safeSend(channel, response);
    },

    analyzeText(text) {
        // Basic stats
        const characters = text.length;
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const lines = text.split('\n').length;

        // Character frequency
        const charFrequency = {};
        for (const char of text.toLowerCase().replace(/\s/g, '')) {
            charFrequency[char] = (charFrequency[char] || 0) + 1;
        }
        const topCharacters = Object.entries(charFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        // Word frequency
        const wordFrequency = {};
        const cleanWords = words.map(word => word.toLowerCase().replace(/[^a-z0-9]/g, ''));
        for (const word of cleanWords) {
            if (word.length > 0) {
                wordFrequency[word] = (wordFrequency[word] || 0) + 1;
            }
        }
        const topWords = Object.entries(wordFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        return {
            characters,
            words: words.length,
            sentences: sentences.length,
            lines,
            avgWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length,
            avgSentenceLength: words.length / sentences.length,
            readingTime: Math.ceil(words.length / 200),
            topCharacters,
            topWords
        };
    }
};
