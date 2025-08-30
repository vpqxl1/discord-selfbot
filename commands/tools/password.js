module.exports = {
    name: 'password',
    description: 'Generate a secure random password',
    execute(channel, message, client, args) {
        const length = parseInt(args[0]) || 12;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
        let password = '';
        
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        
        channel.send(`🔒 Generated Password: ||${password}||\n\n*Copy it quickly before it disappears!*`).then(msg => {
            setTimeout(() => {
                msg.edit(`🔒 Generated Password: ||********||\n\n*Password hidden for security*`);
            }, 10000);
        });
    }
};
