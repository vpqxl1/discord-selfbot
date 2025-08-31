const CommandBase = require('../CommandBase');

// Quiz questions
const geographyQuestions = [
    {
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        answer: 2
    },
    {
        question: "Which is the largest ocean?",
        options: ["Atlantic", "Indian", "Arctic", "Pacific"],
        answer: 3
    },
    {
        question: "Mount Everest is located in which mountain range?",
        options: ["Andes", "Himalayas", "Alps", "Rockies"],
        answer: 1
    },
    {
        question: "Which country has the most natural lakes?",
        options: ["Canada", "Russia", "USA", "China"],
        answer: 0
    },
    {
        question: "What is the longest river in the world?",
        options: ["Amazon", "Nile", "Mississippi", "Yangtze"],
        answer: 1
    }
];

// Active quizzes
const activeQuizzes = new Map();

module.exports = {
    name: 'geography',
    description: 'Test your geography knowledge with a quiz',
    aliases: ['geo', 'quiz'],
    usage: 'geography',
    cooldown: 10000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        // Check if there's already an active quiz in this channel
        if (activeQuizzes.has(channel.id)) {
            return base.sendError(channel, 'There is already an active quiz in this channel.');
        }

        // Select a random question
        const question = geographyQuestions[Math.floor(Math.random() * geographyQuestions.length)];
        const quiz = {
            question: question,
            participants: new Map(),
            startTime: Date.now(),
            message: null
        };

        activeQuizzes.set(channel.id, quiz);

        // Display the question
        let display = `🌍 **Geography Quiz**\n\n`;
        display += `**${question.question}**\n\n`;
        
        question.options.forEach((option, index) => {
            display += `${index + 1}. ${option}\n`;
        });
        
        display += `\nReply with the number of your answer.`;
        
        quiz.message = await channel.send(display);
        
        // Set up answer collector
        this.setupAnswerCollector(channel, quiz, base);
    },

    setupAnswerCollector(channel, quiz, base) {
        const filter = m => !m.author.bot && m.content.match(/^[1-4]$/);
        const collector = channel.createMessageCollector({ filter, time: 30000 });
        
        collector.on('collect', m => {
            const answer = parseInt(m.content) - 1;
            const participant = m.author.username;
            
            if (!quiz.participants.has(participant)) {
                quiz.participants.set(participant, {
                    answer: answer,
                    time: Date.now() - quiz.startTime
                });
                
                m.react('✅').catch(() => {});
            }
        });
        
        collector.on('end', () => {
            this.endQuiz(channel, quiz, base);
            activeQuizzes.delete(channel.id);
        });
    },

    endQuiz(channel, quiz, base) {
        const correctAnswer = quiz.question.options[quiz.question.answer];
        let results = `🌍 **Geography Quiz Results**\n\n`;
        results += `**Question:** ${quiz.question.question}\n`;
        results += `**Correct Answer:** ${correctAnswer}\n\n`;
        
        if (quiz.participants.size === 0) {
            results += `No one participated in this quiz.`;
        } else {
            results += `**Participants:**\n`;
            
            let fastestCorrect = null;
            
            quiz.participants.forEach((data, participant) => {
                const isCorrect = data.answer === quiz.question.answer;
                results += `• ${participant}: ${isCorrect ? '✅' : '❌'} (${(data.time / 1000).toFixed(1)}s)\n`;
                
                if (isCorrect && (!fastestCorrect || data.time < fastestCorrect.time)) {
                    fastestCorrect = { participant, time: data.time };
                }
            });
            
            if (fastestCorrect) {
                results += `\n🏆 **Fastest Correct Answer:** ${fastestCorrect.participant} (${(fastestCorrect.time / 1000).toFixed(1)}s)`;
            }
        }
        
        channel.send(results);
    }
};
