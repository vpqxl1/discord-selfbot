# Troubleshooting Guide

This comprehensive guide covers common issues and solutions for running the Discord selfbot on Windows 11, Linux (Ubuntu), and macOS.

---

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Configuration Issues](#configuration-issues)
3. [Runtime Errors](#runtime-errors)
4. [Command Issues](#command-issues)
5. [AI/Ollama Issues](#aiollama-issues)
6. [Performance Issues](#performance-issues)
7. [Network Issues](#network-issues)
8. [Platform-Specific Issues](#platform-specific-issues)
9. [Advanced Troubleshooting](#advanced-troubleshooting)

---

## Installation Issues

### Node.js Not Found

**Symptoms:**
```
'node' is not recognized as an internal or external command
node: command not found
```

**Solutions:**

**Windows:**
```cmd
# Verify installation
where node

# If not found, reinstall Node.js from https://nodejs.org/
# After installation, restart terminal

# Add to PATH manually if needed:
# System Properties → Environment Variables → Path → Add Node.js path
# Typical path: C:\Program Files\nodejs\
```

**Linux:**
```bash
# Check if installed
which node

# If not found, install:
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

**macOS:**
```bash
# Check if installed
which node

# If not found:
brew install node

# Or download from https://nodejs.org/
```

---

### NPM Install Fails

**Symptoms:**
```
npm ERR! code EACCES
npm ERR! permission denied
npm WARN deprecated
```

**Solutions:**

**Windows:**
```cmd
# Run as Administrator
# Right-click Command Prompt → Run as Administrator

# Clear cache and retry
npm cache clean --force
npm install

# If still failing, delete and reinstall
rmdir /s /q node_modules
del package-lock.json
npm install
```

**Linux:**
```bash
# Fix permissions
sudo chown -R $USER:$USER ~/.npm
sudo chown -R $USER:$USER ~/discord-selfbot

# If still failing
sudo npm install --unsafe-perm

# Or use without sudo
npm config set unsafe-perm true
npm install
```

**macOS:**
```bash
# Fix permissions
sudo chown -R $(whoami) /usr/local/lib/node_modules
sudo chown -R $(whoami) ~/.npm

# Retry
npm install
```

---

### Git Clone Fails

**Symptoms:**
```
fatal: unable to access 'https://github.com/...'
Permission denied (publickey)
```

**Solutions:**

**All Platforms:**
```bash
# Use HTTPS instead of SSH
git clone https://github.com/vpqxl1/discord-selfbot.git

# If SSL certificate error
git config --global http.sslVerify false
git clone https://github.com/vpqxl1/discord-selfbot.git

# Download as ZIP alternative
# Visit: https://github.com/vpqxl1/discord-selfbot
# Click "Code" → "Download ZIP"
# Extract and navigate to folder
```

---

## Configuration Issues

### Config File Not Found

**Symptoms:**
```
Error: Cannot find module './config'
Config file not found
```

**Solutions:**

**All Platforms:**
```bash
# Run setup script
npm run setup

# Or create manually
# Create config.js in root directory with:
```

```javascript
module.exports = {
    token: "YOUR_DISCORD_TOKEN",
    prefix: "!",
    allowedUserIDs: ["YOUR_USER_ID"],
    nasaApiKey: "DEMO_KEY"
};
```

**Verify file exists:**
```bash
# Windows
dir config.js

# Linux/macOS
ls -la config.js
```

---

### Invalid Discord Token

**Symptoms:**
```
Error: Incorrect login details were provided
Error: Invalid token
```

**Solutions:**

1. **Get a fresh token:**
   - Open Discord in browser (not app)
   - Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (macOS)
   - Go to Console tab
   - Paste:
   ```javascript
   (webpackChunkdiscord_app.push([[''],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken()
   ```
   - Copy the token (without quotes)

2. **Update config.js:**
   ```javascript
   token: "YOUR_NEW_TOKEN_HERE",  // No extra spaces!
   ```

3. **Common mistakes:**
   - Extra spaces before/after token
   - Missing quotes around token
   - Using bot token instead of user token
   - Token expired (get new one)

---

### Wrong User ID

**Symptoms:**
```
❌ You don't have permission to use this command.
Commands not responding
```

**Solutions:**

1. **Get your User ID:**
   - Enable Developer Mode (Settings → Advanced → Developer Mode)
   - Right-click your username → Copy ID

2. **Update config.js:**
   ```javascript
   allowedUserIDs: ["YOUR_USER_ID"],  // Must be in quotes and array
   ```

3. **Multiple users:**
   ```javascript
   allowedUserIDs: ["123456789", "987654321"],
   ```

---

## Runtime Errors

### Selfbot Won't Start

**Symptoms:**
```
Error: Cannot find module 'discord.js-selfbot-v13'
Unhandled promise rejection
```

**Solutions:**

**All Platforms:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json  # Linux/macOS
rmdir /s /q node_modules && del package-lock.json  # Windows

npm install

# If specific module missing
npm install discord.js-selfbot-v13
npm install axios
npm install tinycolor2

# Check Node.js version (must be 16+)
node --version
```

---

### Selfbot Crashes on Start

**Symptoms:**
```
TypeError: Cannot read property 'X' of undefined
Segmentation fault
```

**Solutions:**

1. **Check logs:**
   ```bash
   # Run with verbose logging
   node index.js 2>&1 | tee error.log
   ```

2. **Common fixes:**
   ```bash
   # Clear cache
   npm cache clean --force
   
   # Reinstall
   rm -rf node_modules
   npm install
   
   # Update Node.js to latest LTS
   ```

3. **Check config.js syntax:**
   - Must be valid JavaScript
   - All strings in quotes
   - Commas between properties
   - No trailing commas

---

### Memory Leaks / High CPU Usage

**Symptoms:**
- Selfbot becomes slow over time
- High memory usage
- CPU constantly at 100%

**Solutions:**

1. **Restart the selfbot regularly:**
   ```bash
   # Stop with Ctrl+C
   # Start again
   npm start
   ```

2. **Reduce command usage:**
   - Don't spam commands
   - Increase cooldowns if needed

3. **Clear logs folder:**
   ```bash
   # Windows
   del /q commands\logs\temp\*
   
   # Linux/macOS
   rm -f commands/logs/temp/*
   ```

4. **Monitor resources:**
   ```bash
   # Windows
   tasklist | findstr node
   
   # Linux/macOS
   top -p $(pgrep node)
   ```

---

## Command Issues

### Commands Not Working

**Symptoms:**
- Bot doesn't respond to commands
- No errors shown

**Solutions:**

1. **Check prefix:**
   ```javascript
   // In config.js
   prefix: "!",  // Make sure you're using the right prefix
   ```

2. **Verify bot is logged in:**
   - Check console for "Logged in as [username]"
   - If not, check token

3. **Check permissions:**
   - Verify your user ID in allowedUserIDs
   - Try in different channel/DM

4. **Test basic command:**
   ```
   !ping
   !help
   ```

---

### Specific Command Fails

**Symptoms:**
```
❌ An error occurred while executing the command.
Command returns error
```

**Solutions:**

1. **Check command syntax:**
   ```
   !help <command_name>
   ```

2. **Common command issues:**

   **Weather command:**
   ```bash
   # If API fails, try different city name
   !weather "New York"
   !weather London
   ```

   **Crypto command:**
   ```bash
   # Use full name or symbol
   !crypto bitcoin
   !crypto btc
   ```

   **Translate command:**
   ```bash
   # Correct format
   !translate en es Hello world
   ```

3. **Check API availability:**
   - Some commands rely on external APIs
   - APIs may be down or rate-limited
   - Try again later

---

### Cooldown Issues

**Symptoms:**
```
⏳ Please wait before using this command again.
```

**Solutions:**

1. **Wait for cooldown to expire** (usually 2-5 seconds)

2. **Modify cooldowns (advanced):**
   ```javascript
   // In command file
   cooldown: 3000,  // Change to 1000 for 1 second
   ```

---

## AI/Ollama Issues

### Ollama Not Connecting

**Symptoms:**
```
Ollama is not running
ECONNREFUSED localhost:11434
AI response failed
```

**Solutions:**

**Windows:**
```cmd
# Check if Ollama is running
tasklist | findstr ollama

# Start Ollama
# Check system tray for Ollama icon
# Or run: ollama serve

# Test connection
ollama list
```

**Linux:**
```bash
# Check if running
ps aux | grep ollama

# Start Ollama
ollama serve

# Or as service
sudo systemctl start ollama
sudo systemctl status ollama

# Test connection
ollama list
```

**macOS:**
```bash
# Check if running
ps aux | grep ollama

# Ollama should auto-start
# If not, open Ollama app

# Test connection
ollama list
```

---

### AI Model Not Found

**Symptoms:**
```
Error: model 'llama2' not found
```

**Solutions:**

**All Platforms:**
```bash
# Pull the model
ollama pull llama2

# List available models
ollama list

# Try different model
ollama pull mistral
ollama pull codellama

# Update selfbot config
!airesponse config model mistral
```

---

### AI Responses Too Slow

**Symptoms:**
- AI takes 30+ seconds to respond
- Timeout errors

**Solutions:**

1. **Use smaller model:**
   ```bash
   ollama pull llama2:7b  # Smaller, faster
   !airesponse config model llama2:7b
   ```

2. **Check system resources:**
   - Ollama requires significant RAM
   - Close other applications
   - Minimum 8GB RAM recommended

3. **Use remote Ollama:**
   ```bash
   # If you have a powerful server
   !airesponse config url http://your-server:11434
   ```

---

### AI Not Responding to Mentions

**Symptoms:**
- AI system enabled but not responding
- No errors shown

**Solutions:**

1. **Verify AI is enabled:**
   ```
   !airesponse list
   ```

2. **Check rules:**
   ```
   !airesponse add mention You are helpful
   ```

3. **Test AI:**
   ```
   !airesponse test Hello, how are you?
   ```

4. **Check Ollama:**
   ```bash
   ollama run llama2 "test"
   ```

5. **Restart both:**
   - Restart Ollama
   - Restart selfbot

---

## Performance Issues

### Slow Command Execution

**Symptoms:**
- Commands take long to execute
- Lag between command and response

**Solutions:**

1. **Check internet connection:**
   ```bash
   # Windows
   ping discord.com
   
   # Linux/macOS
   ping -c 4 discord.com
   ```

2. **Reduce concurrent commands:**
   - Don't run multiple commands simultaneously
   - Wait for one to finish

3. **Clear temporary files:**
   ```bash
   # Windows
   del /q commands\logs\temp\*
   
   # Linux/macOS
   rm -rf commands/logs/temp/*
   ```

4. **Check system resources:**
   - Close unnecessary applications
   - Ensure sufficient RAM available

---

### High Memory Usage

**Symptoms:**
- Node.js using excessive RAM
- System becomes slow

**Solutions:**

1. **Restart selfbot regularly:**
   ```bash
   # Stop with Ctrl+C
   npm start
   ```

2. **Limit command history:**
   - Clear old notes/todos
   - Clean up logs folder

3. **Increase Node.js memory limit:**
   ```bash
   # Windows
   set NODE_OPTIONS=--max-old-space-size=4096
   npm start
   
   # Linux/macOS
   export NODE_OPTIONS=--max-old-space-size=4096
   npm start
   ```

---

## Network Issues

### Rate Limiting

**Symptoms:**
```
429 Too Many Requests
You are being rate limited
```

**Solutions:**

1. **Wait before retrying:**
   - Discord rate limits aggressive usage
   - Wait 10-60 seconds

2. **Reduce command frequency:**
   - Don't spam commands
   - Respect cooldowns

3. **Avoid bulk operations:**
   - Don't purge too many messages at once
   - Limit to 50 messages per purge

---

### API Timeouts

**Symptoms:**
```
ETIMEDOUT
Request timeout
API not responding
```

**Solutions:**

1. **Check internet connection:**
   ```bash
   ping 8.8.8.8
   ```

2. **Try again later:**
   - External APIs may be down
   - Check API status pages

3. **Use VPN if blocked:**
   - Some APIs may be region-blocked
   - Try different network

---

## Platform-Specific Issues

### Windows-Specific

**Issue: "Windows protected your PC"**
- Click "More info" → "Run anyway"
- Or right-click → Properties → Unblock

**Issue: PowerShell execution policy**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Issue: Path too long**
```cmd
# Enable long paths
reg add HKLM\SYSTEM\CurrentControlSet\Control\FileSystem /v LongPathsEnabled /t REG_DWORD /d 1 /f
```

**Issue: Antivirus blocking**
- Add exception for Node.js
- Add exception for selfbot folder

---

### Linux-Specific

**Issue: Permission denied**
```bash
sudo chown -R $USER:$USER ~/discord-selfbot
chmod +x setup.js
```

**Issue: Port already in use**
```bash
# Find process using port
sudo lsof -i :11434

# Kill process
sudo kill -9 <PID>
```

**Issue: Missing dependencies**
```bash
# Ubuntu/Debian
sudo apt-get install build-essential

# Fedora
sudo dnf install gcc-c++ make
```

**Issue: systemd service not starting**
```bash
# Check logs
sudo journalctl -u discord-selfbot -f

# Restart service
sudo systemctl restart discord-selfbot
```

---

### macOS-Specific

**Issue: "App is damaged and can't be opened"**
```bash
xattr -cr /path/to/app
```

**Issue: Homebrew not found**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Issue: Permission denied on /usr/local**
```bash
sudo chown -R $(whoami) /usr/local
```

**Issue: Gatekeeper blocking**
```bash
# Allow app
sudo spctl --master-disable
# After installation
sudo spctl --master-enable
```

---

## Advanced Troubleshooting

### Enable Debug Logging

**All Platforms:**

1. **Create debug script:**

   **Windows (debug.bat):**
   ```batch
   @echo off
   set DEBUG=*
   node index.js
   ```

   **Linux/macOS (debug.sh):**
   ```bash
   #!/bin/bash
   DEBUG=* node index.js
   ```

2. **Run debug script:**
   ```bash
   # Windows
   debug.bat
   
   # Linux/macOS
   chmod +x debug.sh
   ./debug.sh
   ```

---

### Capture Error Logs

**All Platforms:**

```bash
# Windows
node index.js > error.log 2>&1

# Linux/macOS
node index.js 2>&1 | tee error.log
```

---

### Reset to Default

**All Platforms:**

```bash
# Backup config
cp config.js config.backup.js  # Linux/macOS
copy config.js config.backup.js  # Windows

# Remove all data
rm -rf node_modules commands/logs/*.json  # Linux/macOS
rmdir /s /q node_modules && del /q commands\logs\*.json  # Windows

# Reinstall
npm install
npm run setup
```

---

### Check Dependencies

**All Platforms:**

```bash
# List installed packages
npm list

# Check for outdated packages
npm outdated

# Update packages (careful!)
npm update

# Verify specific package
npm list discord.js-selfbot-v13
```

---

### Network Diagnostics

**All Platforms:**

```bash
# Test Discord connectivity
ping discord.com

# Test DNS
nslookup discord.com

# Test HTTPS
curl -I https://discord.com

# Check proxy settings
npm config get proxy
npm config get https-proxy
```

---

## Getting Help

If your issue isn't covered here:

1. **Check existing GitHub issues:**
   - https://github.com/vpqxl1/discord-selfbot/issues

2. **Create a new issue with:**
   - Operating system and version
   - Node.js version (`node --version`)
   - Full error message
   - Steps to reproduce
   - What you've already tried

3. **Include logs:**
   ```bash
   node index.js 2>&1 | tee error.log
   # Attach error.log to issue
   ```

4. **Provide config (sanitized):**
   ```javascript
   // Remove token and user IDs before sharing!
   {
       token: "REDACTED",
       prefix: "!",
       allowedUserIDs: ["REDACTED"]
   }
   ```

---

## Prevention Tips

1. **Keep backups:**
   - Backup config.js
   - Backup commands/logs/ folder

2. **Update regularly:**
   ```bash
   git pull origin main
   npm install
   ```

3. **Monitor resources:**
   - Check CPU/RAM usage
   - Restart if memory leaks

4. **Use version control:**
   - Track your changes
   - Easy to revert

5. **Test in DMs first:**
   - Try new commands in DMs
   - Avoid public embarrassment

---

**Last Updated:** 2024
**Version:** 2.0

For more help, visit the [GitHub repository](https://github.com/vpqxl1/discord-selfbot).
