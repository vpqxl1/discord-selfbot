const CommandBase = require('../CommandBase');

module.exports = {
    name: 'textstats',
    description: 'Analyze text statistics and information',
    aliases: ['stats', 'analyzetext', 'wordcount'],
    usage: 'textstats <text>',
    cooldown: 3000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length === 0) {
            return base.sendError(channel, 'Please provide some text to analyze. Usage: v!textstats Your text here');
        }

        const text = args.join(' ');
        
        // Basic statistics
        const charCount = text.length;
        const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
        const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
        const lineCount = text.split('\n').length;
        
        // Advanced statistics
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const wordFrequency = {};
        words.forEach(word => {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        });
        
        const mostCommon = Object.entries(wordFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
        const avgSentenceLength = wordCount / sentenceCount;
        
        // Readability scores (simplified)
        const readingTime = Math.ceil(wordCount / 200); // 200 wpm
        const readingLevel = this.calculateReadingLevel(text);
        
        const stats = `
📊 **Text Statistics**
• **Characters:** ${charCount}
• **Words:** ${wordCount}
• **Sentences:** ${sentenceCount}
• **Lines:** ${lineCount}
• **Avg. word length:** ${avgWordLength.toFixed(2)} chars
• **Avg. sentence length:** ${avgSentenceLength.toFixed(2)} words
• **Reading time:** ~${readingTime} minute${readingTime !== 1 ? 's' : ''}
• **Reading level:** ${readingLevel}

📈 **Most Common Words:**
${mostCommon.map(([word, count]) => `• "${word}": ${count} time${count !== 1 ? 's' : ''}`).join('\n')}
        `.trim();

        await base.safeSend(channel, stats);
    },

    calculateReadingLevel(text) {
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const syllables = this.countSyllables(text);
        
        if (words.length < 30 || sentences.length < 3) {
            return 'Basic';
        }
        
        // Simple Flesch-Kincaid approximation
        const avgWordsPerSentence = words.length / sentences.length;
        const avgSyllablesPerWord = syllables / words.length;
        
        const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
        
        if (score >= 90) return 'Very Easy (5th grade)';
        if (score >= 80) return 'Easy (6th grade)';
        if (score >= 70) return 'Fairly Easy (7th grade)';
        if (score >= 60) return 'Standard (8th-9th grade)';
        if (score >= 50) return 'Fairly Difficult (10th-12th grade)';
        if (score >= 30) return 'Difficult (College)';
        return 'Very Difficult (Post-graduate)';
    },

    countSyllables(text) {
        text = text.toLowerCase();
        let count = 0;
        const words = text.split(/\s+/);
        
        words.forEach(word => {
            if (word.length <= 3) {
                count += 1;
                return;
            }
            
            word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
            word = word.replace(/^y/, '');
            
            const matches = word.match(/[aeiouy]{1,2}/g);
            count += matches ? matches.length : 1;
        });
        
        return Math.max(1, count);
    }
};
