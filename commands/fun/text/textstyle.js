module.exports = {
    name: 'textstyle',
    description: 'Apply text styles',
    execute(channel, message, client, args) {
        if (args.length < 2) {
            return channel.send('Usage: !textstyle <style> <text>');
        }
        
        const style = args[0].toLowerCase();
        const text = args.slice(1).join(' ');
        
        const styles = {
            'bold': `**${text}**`,
            'italic': `*${text}*`,
            'underline': `__${text}__`,
            'strike': `~~${text}~~`,
            'code': `\`${text}\``,
            'spoiler': `||${text}||`,
            'reverse': text.split('').reverse().join(''),
            'upper': text.toUpperCase(),
            'lower': text.toLowerCase()
        };
        
        if (!styles[style]) {
            return channel.send(`Available styles: ${Object.keys(styles).join(', ')}`);
        }
        
        channel.send(styles[style]);
    }
};
