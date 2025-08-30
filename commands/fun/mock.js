module.exports = {
    name: 'mock',
    description: 'MoCk SoMeOnE\'s TeXt',
    execute(channel, message, client, args) {
        if (!args.length) {
            return channel.send('Please provide text to mock.');
        }
        
        const text = args.join(' ');
        let mocked = '';
        
        for (let i = 0; i < text.length; i++) {
            mocked += i % 2 === 0 ? text[i].toLowerCase() : text[i].toUpperCase();
        }
        
        channel.send(mocked);
    }
};
