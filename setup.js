const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
    console.log('='.repeat(60));
    console.log('Discord Selfbot Setup - Cross-Platform Edition');
    console.log('='.repeat(60));
    console.log('');
    
    // Detect platform
    const platform = process.platform;
    const isWindows = platform === 'win32';
    const isLinux = platform === 'linux';
    const isMac = platform === 'darwin';
    
    console.log(`Detected Platform: ${isWindows ? 'Windows' : isLinux ? 'Linux' : isMac ? 'macOS' : 'Unknown'}`);
    console.log('');
    
    // Check if config.js exists
    const configPath = path.join(__dirname, 'config.js');
    let needsConfig = !fs.existsSync(configPath);
    
    if (needsConfig) {
        console.log('Config file not found. Let\'s create one!');
        console.log('');
        
        const token = await question('Enter your Discord token: ');
        const prefix = await question('Enter command prefix (default: !): ') || '!';
        const userId = await question('Enter your Discord user ID: ');
        const nasaApiKey = await question('Enter NASA API key (optional, press Enter to skip): ') || 'DEMO_KEY';
        
        const configContent = `module.exports = {
    token: "${token}",
    prefix: "${prefix}",
    allowedUserIDs: ["${userId}"],
    nasaApiKey: "${nasaApiKey}"
};
`;
        
        fs.writeFileSync(configPath, configContent, 'utf8');
        console.log('✓ Config file created successfully!');
    } else {
        console.log('✓ Config file already exists.');
    }
    
    // Create necessary directories
    console.log('');
    console.log('Creating necessary directories...');
    
    const dirs = [
        path.join(__dirname, 'commands', 'logs'),
        path.join(__dirname, 'commands', 'logs', 'temp')
    ];
    
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`✓ Created: ${dir}`);
        } else {
            console.log(`✓ Already exists: ${dir}`);
        }
    }
    
    // Create empty log files if they don't exist
    const logFiles = [
        path.join(__dirname, 'commands', 'logs', 'apod_channels.json'),
        path.join(__dirname, 'commands', 'logs', 'autoreact_rules.json'),
        path.join(__dirname, 'commands', 'logs', 'airesponse_rules.json'),
        path.join(__dirname, 'commands', 'logs', 'notes.json'),
        path.join(__dirname, 'commands', 'logs', 'todos.json')
    ];
    
    console.log('');
    console.log('Initializing log files...');
    
    for (const file of logFiles) {
        if (!fs.existsSync(file)) {
            const defaultContent = file.includes('airesponse_rules') 
                ? JSON.stringify({ enabled: false, ollamaUrl: 'http://localhost:11434', model: 'llama2', rules: [] }, null, 2)
                : '[]';
            fs.writeFileSync(file, defaultContent, 'utf8');
            console.log(`✓ Created: ${path.basename(file)}`);
        } else {
            console.log(`✓ Already exists: ${path.basename(file)}`);
        }
    }
    
    // Platform-specific instructions
    console.log('');
    console.log('='.repeat(60));
    console.log('Setup Complete!');
    console.log('='.repeat(60));
    console.log('');
    
    if (isWindows) {
        console.log('Windows-specific notes:');
        console.log('• Run: npm start');
        console.log('• For AI features, install Ollama from: https://ollama.ai/download');
        console.log('• After installing Ollama, run: ollama pull llama2');
    } else if (isLinux) {
        console.log('Linux-specific notes:');
        console.log('• Run: npm start');
        console.log('• For AI features, install Ollama: curl https://ollama.ai/install.sh | sh');
        console.log('• After installing Ollama, run: ollama pull llama2');
    } else if (isMac) {
        console.log('macOS-specific notes:');
        console.log('• Run: npm start');
        console.log('• For AI features, install Ollama from: https://ollama.ai/download');
        console.log('• After installing Ollama, run: ollama pull llama2');
    }
    
    console.log('');
    console.log('To start the selfbot, run: npm start');
    console.log('');
    
    rl.close();
}

setup().catch(error => {
    console.error('Setup failed:', error);
    rl.close();
    process.exit(1);
});
