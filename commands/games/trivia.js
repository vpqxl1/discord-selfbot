const axios = require('axios');
const CommandBase = require('../CommandBase');

module.exports = {
    name: 'trivia',
    description: 'Play a trivia game',
    aliases: ['quiz'],
    usage: 'trivia [category]',
    cooldown: 5000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        try {
            // Using Open Trivia Database
            const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
            const data = response.data.results[0];
            
            if (!data) {
                throw new Error('Failed to fetch trivia question');
            }

            // Decode HTML entities
            const decodeHTML = (html) => {
                return html.replace(/&quot;/g, '"')
                          .replace(/&#039;/g, "'")
                          .replace(/&amp;/g, '&')
                          .replace(/&lt;/g, '<')
                          .replace(/&gt;/g, '>');
            };

            const question = decodeHTML(data.question);
            const correctAnswer = decodeHTML(data.correct_answer);
            const incorrectAnswers = data.incorrect_answers.map(a => decodeHTML(a));
            
            // Shuffle answers
            const allAnswers = [correctAnswer, ...incorrectAnswers].sort(() => Math.random() - 0.5);
            const correctIndex = allAnswers.indexOf(correctAnswer);
            
            const emojis = ['🇦', '🇧', '🇨', '🇩'];
            const letters = ['A', 'B', 'C', 'D'];

            let triviaText = `🎯 **Trivia Question**\n\n`;
            triviaText += `**Category:** ${data.category}\n`;
            triviaText += `**Difficulty:** ${data.difficulty.toUpperCase()}\n\n`;
            triviaText += `**${question}**\n\n`;
            
            allAnswers.forEach((answer, i) => {
                triviaText += `${emojis[i]} ${letters[i]}. ${answer}\n`;
            });

            const triviaMsg = await base.safeSend(channel, triviaText);
            if (!triviaMsg) return;

            // Add reactions
            for (let i = 0; i < allAnswers.length; i++) {
                await triviaMsg.react(emojis[i]);
            }

            // Wait for answer
            const filter = (reaction, user) => {
                return emojis.includes(reaction.emoji.name) && user.id === message.author.id;
            };

            const collected = await triviaMsg.awaitReactions({ filter, max: 1, time: 30000 });
            
            if (collected.size === 0) {
                await base.safeSend(channel, `⏰ Time's up! The correct answer was: **${letters[correctIndex]}. ${correctAnswer}**`);
            } else {
                const reaction = collected.first();
                const answerIndex = emojis.indexOf(reaction.emoji.name);
                
                if (answerIndex === correctIndex) {
                    await base.safeSend(channel, `✅ Correct! The answer was **${letters[correctIndex]}. ${correctAnswer}**`);
                } else {
                    await base.safeSend(channel, `❌ Wrong! The correct answer was **${letters[correctIndex]}. ${correctAnswer}**`);
                }
            }

        } catch (error) {
            console.error('Trivia command error:', error);
            await base.sendError(channel, 'Failed to fetch trivia question.');
        }
    }
};
