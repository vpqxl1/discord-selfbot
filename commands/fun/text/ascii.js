module.exports = {
    name: 'ascii',
    description: 'Convert text to ASCII art',
    execute(channel, message, client, args) {
        if (!args.length) {
            return channel.send('Please provide text to convert.');
        }
        
        const text = args.join(' ').toUpperCase();
        const asciiMap = {
            'A': ' █████╗ ', 'B': '█████╗ ', 'C': ' ██████╗', 'D': '█████╗ ', 'E': '███████╗',
            'F': '███████╗', 'G': ' ██████╗ ', 'H': '█╗  ██╗', 'I': '██╗', 'J': '     ██╗',
            'K': '█╗  ██╗', 'L': '█╗      ', 'M': '███╗   ███╗', 'N': '███╗  ██╗', 'O': ' ██████╗ ',
            'P': '█████╗ ', 'Q': ' ██████╗ ', 'R': '█████╗ ', 'S': ' ███████╗', 'T': '████████╗',
            'U': '█╗   ██╗', 'V': '█╗   ██╗', 'W': '█╗    ██╗    ██╗', 'X': '█╗  ██╗', 'Y': '█╗   ██╗',
            'Z': '███████╗', ' ': '   ', '0': ' ██████╗ ', '1': '  ██╗', '2': '██████╗ ',
            '3': '██████╗ ', '4': '██╗  ██╗', '5': '███████╗', '6': ' ██████╗ ', '7': '███████╗',
            '8': ' █████╗ ', '9': ' ██████╗ '
        };
        
        let asciiArt = '';
        for (let i = 0; i < 3; i++) {
            for (const char of text) {
                asciiArt += asciiMap[char] || '   ';
            }
            asciiArt += '\n';
        }
        
        channel.send(`\`\`\`\n${asciiArt}\`\`\``);
    }
};
