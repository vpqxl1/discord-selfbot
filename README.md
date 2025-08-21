# Discord Selfbot

> **⚠️ WARNING:**  
> Selfbots are against [Discord's Terms of Service](https://discord.com/terms). Use at your own risk. This project is for educational purposes only.

## Features

This Node.js-based Discord selfbot offers a comprehensive suite of automation, analytics, and utility commands:

```
🔸 !addy → Sends your Litecoin (LTC) wallet address in a styled message with emojis.
🔸 !analyze → Comprehensive analysis tool for DMs and servers with detailed statistics (use -h for help).
🔸 !autoreact → Automatically react to messages from specific users or with keywords
🔸 !avatar → Displays the avatar of the mentioned user.
🔸 !backup-channels → Export the guild channels (name, type, topic, position, parent) and roles & permissions to a JSON file.
🔸 !bal → Checks the balance of a Litecoin (LTC) wallet address and its equivalent in USD and INR.
🔸 !ban → Bans a user from the server.
🔸 !botstats → Monitor and analyze bot performance metrics
🔸 !clear → Delete messages off a channel
🔸 !coinflip → Flips a coin.
🔸 !crypto → Fetches detailed info about any cryptocurrency.
🔸 !dictionary → Look up definitions using free dictionary APIs
🔸 !encode → Encode/decode text using various methods
🔸 !exchange → Converts an amount from one currency to another.
🔸 !funfact → Displays a random fun fact from an API.
🔸 !gayrate → Rates how gay a user is.
🔸 !gitsearch → Searches GitHub for repositories.
🔸 !gituser → Retrieves information about a GitHub user.
🔸 !guildicon → Displays the guild icon.
🔸 !help → Shows a list of available commands.
🔸 !hwinfo → Neofetch-style system info with pixel-art logos, bars and extended GPU/CPU details.
🔸 !iplookup → Lookup information about an IP address.
🔸 !kick → Kicks a user from the server.
🔸 !log → Log messages from a channel to a file
🔸 !loverate → Rates the compatibility of two mentioned users as lovers.
🔸 !math → Evaluates a mathematical expression.
🔸 !ping → Checks the bot's latency.
🔸 !qrcode → Generates a QR code for a given link.
🔸 !quote → Get inspirational quotes by category (philosophy, fiction, authors, etc.)
🔸 !randnum → undefined
🔸 !restore-channels → Restore roles, channels and channel permission overwrites from a JSON backup created by backup-channels.
🔸 !roles → Analyze role distribution and permission usage
🔸 !security → Comprehensive server security assessment
🔸 !serverinfo → Shows server info or DM info with detailed statistics and analytics.
🔸 !setnickname → Changes your own nickname.
🔸 !slotmachine → Play a simple slot machine.
🔸 !spam → Spams a message multiple times.
🔸 !status → Sets the bot's status.
🔸 !status2 → Set a custom status with Rich Presence.
🔸 !status3 → Change the status automatically with different images in a loop.
🔸 !timezone → Provides the current time for a specified timezone.
🔸 !translate → Translates a text from one language to another.
🔸 !userinfo → Displays information about a user.
🔸 !weather → Provides current weather information for a specified location.
```

## Installation

1. **Clone the repository**
    ```bash
    git clone https://github.com/vpqxl1/discord-selfbot.git
    cd discord-selfbot
    ```

2. **Install dependencies**
    ```bash
    npm i```

3. **Configure your config**
    - Edit the config.js file and add your Discord token, userID and prefix

    - **Never share your token with anyone!**

## Usage

- Start the selfbot:
    ```bash
    node index.js
    ```
- Use commands in any Discord channel or DM (as yourself), for example:
    ```
    !help
    ```

## Requirements

- Discord account (user account)
- Node.js v16+ and npm
- All required packages (see `package.json`)

## Disclaimer

- **Selfbots are against Discord's Terms of Service.**
- This project is for educational and personal use only.
- The author is not responsible for any bans, account losses, or misuse.

## Contributing

I favor discord as it's easier to communicate for me, but:

Pull requests and suggestions are welcome! Please open an issue to discuss major changes.

## License

MIT

---

**Automate your Discord experience responsibly!**
