# Discord Selfbot - Cross-Platform Edition

![License: MIT](https://img.shields.io/badge/License-MIT-blue)
![Node.js v16+](https://img.shields.io/badge/Node.js-v16%2B-green)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey)

> **WARNING:** Selfbots are against [Discord's Terms of Service](https://discord.com/terms). Use at your own risk. This project is for **educational purposes only**.

A powerful, feature-rich Discord selfbot with **AI auto-response capabilities**, utilities, games, and information commands. **Fully compatible with Windows 11, Linux (Ubuntu), and macOS.**

---

## 🌟 Key Features

- 🤖 **AI Auto-Response System** - Powered by Ollama with configurable triggers
- 🛠️ **50+ Commands** - Utilities, games, information, and more
- 🌍 **Cross-Platform** - Works on Windows, Linux, and macOS
- 📝 **Productivity Tools** - Notes, todo lists, timers, reminders
- 🎮 **Interactive Games** - Trivia, blackjack, hangman, and more
- 📰 **Information Access** - Weather, crypto, news, movies, Reddit, and more

---

## 📋 Requirements

- **Node.js** 16.0.0 or higher
- **npm** (comes with Node.js)
- **Discord account** (for selfbot token)
- **Ollama** (optional, for AI features)

---

## 🚀 Quick Start

### Windows 11

1. **Install Node.js**
   - Download from: https://nodejs.org/
   - Choose LTS version and run installer

2. **Clone Repository**
   ```cmd
   git clone https://github.com/vpqxl1/discord-selfbot.git
   cd discord-selfbot
   ```

3. **Install Dependencies**
   ```cmd
   npm install
   ```

4. **Run Setup**
   ```cmd
   npm run setup
   ```

5. **Start the Selfbot**
   ```cmd
   npm start
   ```

### Linux (Ubuntu)

1. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Clone Repository**
   ```bash
   git clone https://github.com/vpqxl1/discord-selfbot.git
   cd discord-selfbot
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Run Setup**
   ```bash
   npm run setup
   ```

5. **Start the Selfbot**
   ```bash
   npm start
   ```

### macOS

1. **Install Node.js**
   ```bash
   brew install node
   ```

2. **Clone Repository**
   ```bash
   git clone https://github.com/vpqxl1/discord-selfbot.git
   cd discord-selfbot
   ```

3. **Install Dependencies & Setup**
   ```bash
   npm install
   npm run setup
   npm start
   ```

---

## 🤖 AI Auto-Response Setup (Optional)

### Windows 11
```cmd
# Download from https://ollama.ai/download
ollama pull llama2
ollama serve
```

### Linux (Ubuntu)
```bash
curl https://ollama.ai/install.sh | sh
ollama pull llama2
ollama serve
```

### macOS
```bash
# Download from https://ollama.ai/download
ollama pull llama2
```

**Enable in Discord:**
```
!airesponse enable
!airesponse add mention You are a helpful assistant
```

---

## 📖 Configuration

### Automated Setup
Run `npm run setup` and follow the prompts.

### Manual Configuration
Create `config.js` in the root directory:

```javascript
module.exports = {
    token: "YOUR_DISCORD_TOKEN",
    prefix: "!",
    allowedUserIDs: ["YOUR_USER_ID"],
    nasaApiKey: "YOUR_NASA_API_KEY" // Optional
};
```

**Getting Your Discord Token:**
1. Open Discord in browser
2. Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (macOS)
3. Go to Console tab
4. Paste: `(webpackChunkdiscord_app.push([[''],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken()`

**Getting Your User ID:**
1. Enable Developer Mode (Settings → Advanced → Developer Mode)
2. Right-click your username → Copy ID

---

## 🎯 Command Categories

### 🤖 AI System
- `!airesponse` – Configure AI auto-responses with Ollama

### 🛠️ Utility (20+)
- `!help` – Show all commands
- `!notes` – Personal note-taking system
- `!todo` – Task management
- `!timer` – Countdown timers
- `!reminder` – Set reminders
- `!purge` – Bulk message deletion
- `!qr` – QR code generator
- `!screenshot` – Website screenshots
- `!avatar` – User avatars
- `!userinfo` – User information
- `!serverinfo` – Server information
- `!translate` – Language translation
- `!math` – Math expressions
- `!calculator` – Advanced calculator
- `!embed` – Custom embeds
- `!ping` – Latency check
- And more...

### 🎮 Fun & Games (20+)
- `!roast` – Generate roasts
- `!compliment` – Give compliments
- `!8ball` – Magic 8-ball
- `!coinflip` – Flip a coin
- `!dice` – Roll dice
- `!joke` – Random jokes
- `!meme` – Reddit memes
- `!cat` / `!dog` – Animal images
- `!ascii-art` – ASCII art generator
- `!wouldyourather` – WYR game
- `!truthordare` – Truth or Dare
- `!rate` – Rate anything
- `!trivia` – Trivia game
- `!blackjack` – Blackjack
- `!hangman` – Hangman
- `!rps` – Rock Paper Scissors
- And more...

### 📰 Information (20+)
- `!weather` – Weather info
- `!crypto` – Cryptocurrency prices
- `!github` – GitHub search
- `!steam` – Steam games
- `!wiki` – Wikipedia
- `!anime` – Anime info
- `!movie` – Movie info
- `!news` – Latest headlines
- `!reddit` – Subreddit posts
- `!define` – Word definitions
- `!lyrics` – Song lyrics
- `!quote` – Inspirational quotes
- `!urban` – Urban Dictionary
- `!apod` – NASA Picture of the Day
- `!covid` – COVID-19 stats
- `!imdb` – Movie database
- And more...

### 🔧 Tools (15+)
- `!base64` – Base64 encoding
- `!binary` – Binary conversion
- `!color` – Color information
- `!convert` – Unit conversion
- `!password` – Password generator
- `!shorten` – URL shortener
- `!encrypt` – Text encryption
- `!compress` – Text compression
- And more...

---

## 💡 Usage Examples

### AI Auto-Response
```
!airesponse enable                              # Enable AI
!airesponse add mention You are helpful         # Respond when mentioned
!airesponse add channel 123456 You are funny    # Respond in channel
!airesponse add dm You are friendly             # Respond in DMs
!airesponse list                                # List rules
!airesponse test Hello!                         # Test AI
```

### Productivity
```
!notes add Buy groceries        # Add note
!todo add Finish homework       # Add task
!timer 60 Pizza ready!          # Set timer
!reminder 30 Check oven         # Set reminder
```

### Fun
```
!joke                   # Random joke
!meme                   # Random meme
!roast @user            # Roast someone
!trivia                 # Trivia question
!wouldyourather         # WYR question
```

### Information
```
!weather London         # Weather
!crypto bitcoin         # Crypto price
!movie Inception        # Movie info
!news technology        # Tech news
!reddit memes           # Reddit posts
```

---

## 🔧 Troubleshooting

### Windows
- **"npm not recognized"** → Restart terminal after Node.js install
- **Ollama not connecting** → Check system tray, restart Ollama

### Linux
- **Permission denied** → `sudo npm install -g npm`
- **Port in use** → `sudo lsof -i :11434` then `sudo kill -9 <PID>`

### General
- **Invalid token** → Get new token, check for spaces in config
- **Commands not working** → Check prefix and user ID
- **AI not responding** → Verify Ollama is running: `ollama list`

---

## 📁 Project Structure

```
discord-selfbot/
├── commands/           # All command files
│   ├── fun/           # Fun commands
│   ├── games/         # Game commands
│   ├── information/   # Info commands
│   ├── tools/         # Tools (AI, etc.)
│   ├── utility/       # Utility commands
│   └── logs/          # Data storage
├── config.js          # Configuration
├── index.js           # Main entry
├── setup.js           # Setup script
└── package.json       # Dependencies
```

---

## ⚠️ Important Notes

1. **Selfbots violate Discord ToS** - Use at your own risk
2. **Never share your token** - Keep it private
3. **Rate limiting** - Don't spam commands
4. **Backup data** - Keep backups of logs folder

---

## 🔄 Updating

```bash
git pull origin main
npm install
```

---

## 📝 License

MIT License - See LICENSE file

---

## 🤝 Credits

- Original selfbot by **devrock07**
- Deobfuscation & improvements by **vpqxl1**
- AI integration and cross-platform support by community
- Built with discord.js-selfbot-v13
- AI powered by Ollama

---

**Made with ❤️ for the Discord community**
