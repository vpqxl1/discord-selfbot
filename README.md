# SelfBot

![License: MIT](https://img.shields.io/badge/License-MIT-blue)
![Node.js v16+](https://img.shields.io/badge/Node.js-v16%2B-green)

> **WARNING:** Selfbots are against [Discord's Terms of Service](https://discord.com/terms). Use at your own risk. This project is for **educational purposes only**.

---

## Features & Commands

### 🎛️ Utility
- `!help` – Show available commands
- `!avatar` – Get user avatar
- `!userinfo` – Display user information
- `!serverinfo` – Display server info
- `!guildicon` – Show server icon
- `!roles` – Analyze role distribution
- `!setnickname` – Change your nickname
- `!qrcode` – Generate QR codes
- `!translate` – Translate text between languages
- `!timezone` – Show time in specific timezone
- `!weather` – Get weather information
- `!dictionary` – Word definitions
- `!math` – Evaluate math expressions
- `!encode` – Encode/decode text
- `!exchange` – Currency conversion
- `!crypto` – Cryptocurrency information
- `!iplookup` – IP address information
- `!gitsearch` – Search GitHub repositories
- `!gituser` – Get GitHub user info
- `!addy` – Display Litecoin wallet address

### 🔒 Moderation
- `!ban` – Ban users from server
- `!kick` – Kick users from server
- `!clear` – Delete your messages
- `!spam` – Spam messages
- `!backup-channels` – Backup channel data
- `!restore-channels` – Restore from backup
- `!log` – Log messages to file
- `!security` – Server security assessment

### 📊 Analytics
- `!analyze` – Comprehensive server/DM analysis
- `!botstats` – Bot performance metrics
- `!hwinfo` – System info (Neofetch-style)
- `!ping` – Check bot latency
- `!charcount` – Text analysis and counting
- `!textstats` – Advanced text statistics

### 🎮 Fun & Games
- `!coinflip` – Flip a coin
- `!slotmachine` – Slot machine game
- `!funfact` – Random fun facts
- `!quote` – Inspirational quotes
- `!gayrate` – Rate how gay someone is
- `!loverate` – Check compatibility between users
- `!autoreact` – Auto react to messages
- `!8ball` – Ask the magic 8ball
- `!dadjoke` – Random dad jokes
- `!dice` – Roll custom dice
- `!mock` – Mock someone's text
- `!numberfact` – Interesting number facts
- `!blackjack` – Play Blackjack
- `!geography` – Geography quiz
- `!guess` – Number guessing game
- `!hangman` – Hangman with categories
- `!roulette` – Roulette with betting
- `!rps` – Rock Paper Scissors

### 🎨 Customization & Status
- `!status` – Set custom status
- `!status2` – Rich presence status
- `!status3` – Rotating status with images

### 🔧 Tools
- `!base64` – Base64 encoding/decoding
- `!binary` – Binary conversion
- `!color` – Color information
- `!convert` – Unit conversion
- `!countdown` – Countdown timer
- `!markdown` – Markdown preview
- `!metadata` – File metadata extraction
- `!palette` – Color palette generation
- `!password` – Secure password generation
- `!qrdecode` – QR code decoding
- `!shorten` – URL shortening
- `!unshorten` – URL unshortening
- `!ascii` – ASCII art conversion
- `!compress` – Text compression
- `!encrypt` – Text encryption
- `!reverse` – Reverse text
- `!textstyle` – Apply text styles

### ℹ️ Information
- `!apod` – NASA Astronomy Picture of the Day
- `!covid` – COVID-19 statistics
- `!etymology` – Word origins
- `!imdb` – Movie information
- `!urban` – Urban Dictionary definitions
- `!worldtime` – Worldwide time zones

---

## Installation

```bash
git clone https://github.com/vpqxl1/discord-selfbot.git
cd discord-selfbot
npm install
````

---

## Configuration

* Edit `config.js`

    token: "YOUR_TOKEN_HERE",
    prefix: "PREFIX",
    allowedUserIDs: ['userid1', 'userid2', 'userid3'],
    nasaApiKey: "NASAKEY" // Using DEMO_KEY for NASA API (only needed for apod)
};

⚠️ **Never share your token.**

---

## Usage

```bash
node index.js
```

Use commands in Discord with your configured prefix:

```text
!help
```

---

## Requirements

* Node.js **v16+**
* npm
* A Discord account

---

## Disclaimer

This project **violates Discord’s ToS** and may result in account termination. Use at your own risk. Educational purposes only.

---

## License

MIT License – see [LICENSE](LICENSE).

---

## Credits

* Original selfbot by **devrock07**
* Deobfuscation & improvements by **vpqxl1**

```
```
