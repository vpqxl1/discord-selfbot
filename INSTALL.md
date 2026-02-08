# Installation Guide - Cross-Platform

This guide provides detailed installation instructions for Windows 11, Linux (Ubuntu), and macOS.

---

## Table of Contents

1. [Windows 11 Installation](#windows-11-installation)
2. [Linux (Ubuntu) Installation](#linux-ubuntu-installation)
3. [macOS Installation](#macos-installation)
4. [Ollama Setup (AI Features)](#ollama-setup-ai-features)
5. [Common Issues](#common-issues)

---

## Windows 11 Installation

### Step 1: Install Node.js

1. Visit https://nodejs.org/
2. Download the **LTS (Long Term Support)** version
3. Run the installer (`node-vXX.XX.X-x64.msi`)
4. Follow the installation wizard:
   - Accept the license agreement
   - Choose default installation path
   - **Check** "Automatically install necessary tools"
5. Click "Install" and wait for completion
6. Restart your computer

### Step 2: Verify Installation

Open **Command Prompt** (Win + R, type `cmd`, press Enter):

```cmd
node --version
npm --version
```

You should see version numbers (e.g., v18.17.0 and 9.6.7).

### Step 3: Install Git (if not installed)

1. Visit https://git-scm.com/download/win
2. Download and run the installer
3. Use default settings during installation

### Step 4: Clone the Repository

```cmd
cd %USERPROFILE%\Desktop
git clone https://github.com/vpqxl1/discord-selfbot.git
cd discord-selfbot
```

### Step 5: Install Dependencies

```cmd
npm install
```

This may take a few minutes.

### Step 6: Run Setup

```cmd
npm run setup
```

Follow the prompts to enter:
- Discord token
- Command prefix (default: !)
- Your Discord user ID
- NASA API key (optional)

### Step 7: Start the Selfbot

```cmd
npm start
```

You should see "Logged in as [YourUsername]#0000".

---

## Linux (Ubuntu) Installation

### Step 1: Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 2: Install Node.js

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 3: Install Git

```bash
sudo apt install git -y
```

### Step 4: Clone the Repository

```bash
cd ~
git clone https://github.com/vpqxl1/discord-selfbot.git
cd discord-selfbot
```

### Step 5: Install Dependencies

```bash
npm install
```

If you encounter permission errors:
```bash
sudo npm install --unsafe-perm
```

### Step 6: Run Setup

```bash
npm run setup
```

### Step 7: Start the Selfbot

```bash
npm start
```

### Optional: Run as Background Service

Create a systemd service:

```bash
sudo nano /etc/systemd/system/discord-selfbot.service
```

Add:
```ini
[Unit]
Description=Discord Selfbot
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/discord-selfbot
ExecStart=/usr/bin/node index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable discord-selfbot
sudo systemctl start discord-selfbot
sudo systemctl status discord-selfbot
```

---

## macOS Installation

### Step 1: Install Homebrew (if not installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Step 2: Install Node.js

```bash
brew install node
```

Verify:
```bash
node --version
npm --version
```

### Step 3: Install Git

```bash
brew install git
```

### Step 4: Clone the Repository

```bash
cd ~/Desktop
git clone https://github.com/vpqxl1/discord-selfbot.git
cd discord-selfbot
```

### Step 5: Install Dependencies

```bash
npm install
```

### Step 6: Run Setup

```bash
npm run setup
```

### Step 7: Start the Selfbot

```bash
npm start
```

---

## Ollama Setup (AI Features)

### Windows 11

1. **Download Ollama**
   - Visit: https://ollama.ai/download
   - Download "Ollama for Windows"
   - Run the installer

2. **Verify Installation**
   ```cmd
   ollama --version
   ```

3. **Pull AI Model**
   ```cmd
   ollama pull llama2
   ```
   
   Other models:
   - `ollama pull mistral` (7B, fast)
   - `ollama pull codellama` (code-focused)
   - `ollama pull llama2:13b` (larger, better quality)

4. **Start Ollama** (usually auto-starts)
   - Check system tray for Ollama icon
   - Or run: `ollama serve`

5. **Test Ollama**
   ```cmd
   ollama run llama2 "Hello, how are you?"
   ```

### Linux (Ubuntu)

1. **Install Ollama**
   ```bash
   curl https://ollama.ai/install.sh | sh
   ```

2. **Pull AI Model**
   ```bash
   ollama pull llama2
   ```

3. **Start Ollama**
   ```bash
   ollama serve
   ```
   
   Or run as service:
   ```bash
   sudo systemctl enable ollama
   sudo systemctl start ollama
   ```

4. **Test Ollama**
   ```bash
   ollama run llama2 "Hello!"
   ```

### macOS

1. **Download Ollama**
   - Visit: https://ollama.ai/download
   - Download "Ollama for macOS"
   - Install the app

2. **Pull AI Model**
   ```bash
   ollama pull llama2
   ```

3. **Ollama runs automatically** in the background

4. **Test**
   ```bash
   ollama run llama2 "Hello!"
   ```

### Enable AI in Selfbot

Once Ollama is running:

```
!airesponse enable
!airesponse config model llama2
!airesponse add mention You are a helpful assistant
!airesponse test Hello, how are you?
```

---

## Common Issues

### Windows

**Issue: "node is not recognized"**
- Solution: Restart terminal after Node.js installation
- Or add to PATH manually: System Properties → Environment Variables

**Issue: "npm install" fails**
- Solution: Run as Administrator
- Or: `npm cache clean --force` then `npm install`

**Issue: Ollama not connecting**
- Solution: Check system tray, restart Ollama
- Or: Open Task Manager, end Ollama, restart it

### Linux

**Issue: Permission denied**
```bash
sudo chown -R $USER:$USER ~/.npm
sudo chown -R $USER:$USER ~/discord-selfbot
```

**Issue: Port 11434 already in use (Ollama)**
```bash
sudo lsof -i :11434
sudo kill -9 <PID>
ollama serve
```

**Issue: Module not found**
```bash
rm -rf node_modules package-lock.json
npm install
```

### macOS

**Issue: "command not found: brew"**
- Solution: Install Homebrew (see Step 1)

**Issue: Permission errors**
```bash
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### All Platforms

**Issue: Invalid Discord token**
- Get a new token (see README.md)
- Check for extra spaces in config.js
- Ensure token is in quotes

**Issue: Commands not working**
- Verify prefix in config.js
- Check if your user ID is in allowedUserIDs
- Make sure bot is logged in (check console)

**Issue: AI not responding**
- Check Ollama is running: `ollama list`
- Verify AI is enabled: `!airesponse list`
- Test connection: `!airesponse test Hello`
- Check Ollama URL: `!airesponse config url http://localhost:11434`

---

## Getting Help

If you encounter issues not covered here:

1. Check the main README.md
2. Search existing GitHub issues
3. Create a new issue with:
   - Your operating system and version
   - Node.js version (`node --version`)
   - Error messages
   - Steps to reproduce

---

**Happy selfbotting! 🎉**
