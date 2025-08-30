const { DateTime } = require('luxon');

module.exports = {
    name: 'worldtime',
    description: 'Get current time in different timezones',
    execute(channel, message, client, args) {
        const timezones = [
            'America/New_York', 'Europe/London', 'Asia/Tokyo', 
            'Australia/Sydney', 'Europe/Paris', 'Asia/Dubai'
        ];
        
        let timeInfo = '🌍 **World Time**\n\n';
        
        timezones.forEach(tz => {
            const now = DateTime.now().setZone(tz);
            const city = tz.split('/')[1].replace('_', ' ');
            timeInfo += `**${city}**: ${now.toFormat('HH:mm:ss')} (${now.toFormat('ZZZZ')})\n`;
        });
        
        timeInfo += `\n*Current server time: ${new Date().toLocaleTimeString()}*`;
        
        channel.send(timeInfo);
    }
};
