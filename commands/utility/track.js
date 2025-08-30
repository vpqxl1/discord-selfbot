const fs = require('fs');
const path = require('path');
const { prefix } = require("../../config");

// Store tracking data
let trackedUsers = new Map();
let isTracking = false;
let eventListeners = new Map();

// Path for tracking data
const trackingDataPath = path.resolve(__dirname, "../../tracking_data.json");

// Load existing tracking data
function loadTrackingData() {
  if (fs.existsSync(trackingDataPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(trackingDataPath, "utf8"));
      trackedUsers.clear();
      for (const [userId, userData] of Object.entries(data)) {
        trackedUsers.set(userId, userData);
      }
      console.log("Loaded existing tracking data");
    } catch (err) {
      console.error("Error loading tracking data:", err);
    }
  }
}

// Save tracking data
function saveTrackingData() {
  const data = {};
  for (const [userId, userData] of trackedUsers) {
    data[userId] = userData;
  }
  
  try {
    fs.writeFileSync(trackingDataPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error saving tracking data:", err);
  }
}

// Log user activity
function logUserActivity(client, user, activityType, details, message = null) {
  if (!trackedUsers.has(user.id)) return;
  
  const userData = trackedUsers.get(user.id);
  const timestamp = new Date().toISOString();
  
  const serverName = message && message.guild ? 
    (message.guild.name || `ID: ${message.guild.id}`) : "DM";
  
  const channelName = message && message.channel ? 
    (message.channel.name || `ID: ${message.channel.id}`) : "Unknown";
  
  const logEntry = {
    timestamp,
    activityType,
    details,
    server: serverName,
    channel: channelName
  };
  
  userData.activities.push(logEntry);
  
  // Keep only recent activities (limit to 1000)
  if (userData.activities.length > 1000) {
    userData.activities = userData.activities.slice(-1000);
  }
  
  // Write to text file
  const safeDetails = details.replace(/`/g, "'").substring(0, 200);
  const logLine = `[${timestamp}] ${user.tag} (${user.id}) - ${activityType}: ${safeDetails} (Server: ${serverName}, Channel: ${channelName})\n`;
  
  try {
    fs.appendFileSync(userData.logFilePath, logLine);
    saveTrackingData();
  } catch (err) {
    console.error("Error writing to log file:", err);
  }
}

// Setup event listeners for tracking
function setupEventListeners(client) {
  if (isTracking) return;
  
  const listeners = {
    messageCreate: (message) => {
      if (!message.author || message.author.bot) return;
      if (trackedUsers.has(message.author.id)) {
        logUserActivity(
          client, 
          message.author, 
          "MESSAGE", 
          `"${message.content.replace(/`/g, "'").substring(0, 100)}"`, 
          message
        );
      }
    },
    
    messageDelete: (message) => {
      if (message.author && trackedUsers.has(message.author.id)) {
        logUserActivity(
          client,
          message.author,
          "MESSAGE_DELETE",
          `Deleted: "${message.content ? message.content.replace(/`/g, "'").substring(0, 100) : "Unknown content"}"`,
          message
        );
      }
    },
    
    messageUpdate: (oldMessage, newMessage) => {
      if (oldMessage.author && trackedUsers.has(oldMessage.author.id)) {
        logUserActivity(
          client,
          oldMessage.author,
          "MESSAGE_EDIT",
          `Edited: "${oldMessage.content ? oldMessage.content.replace(/`/g, "'").substring(0, 50) : "Unknown"}" → "${newMessage.content ? newMessage.content.replace(/`/g, "'").substring(0, 50) : "Unknown"}"`,
          oldMessage
        );
      }
    },
    
    guildMemberUpdate: (oldMember, newMember) => {
      if (newMember.user && trackedUsers.has(newMember.user.id)) {
        // Check for role changes
        const oldRoles = oldMember.roles.cache.map(role => role.name);
        const newRoles = newMember.roles.cache.map(role => role.name);
        
        if (oldRoles.join() !== newRoles.join()) {
          const added = newRoles.filter(role => !oldRoles.includes(role));
          const removed = oldRoles.filter(role => !newRoles.includes(role));
          
          let changeDesc = "Role changes: ";
          if (added.length > 0) changeDesc += `Added: ${added.join(", ").substring(0, 50)}. `;
          if (removed.length > 0) changeDesc += `Removed: ${removed.join(", ").substring(0, 50)}.`;
          
          logUserActivity(
            client,
            newMember.user,
            "ROLE_UPDATE",
            changeDesc
          );
        }
        
        // Check for nickname changes
        if (oldMember.nickname !== newMember.nickname) {
          const oldName = oldMember.nickname || oldMember.user.username;
          const newName = newMember.nickname || newMember.user.username;
          logUserActivity(
            client,
            newMember.user,
            "NICKNAME_CHANGE",
            `"${oldName}" → "${newName}"`
          );
        }
      }
    },
    
    voiceStateUpdate: (oldState, newState) => {
      const user = newState.member ? newState.member.user : null;
      if (user && trackedUsers.has(user.id)) {
        // User joined a voice channel
        if (!oldState.channelId && newState.channelId && newState.channel) {
          logUserActivity(
            client,
            user,
            "VOICE_JOIN",
            `Joined voice channel: ${newState.channel.name}`
          );
        }
        
        // User left a voice channel
        if (oldState.channelId && !newState.channelId && oldState.channel) {
          logUserActivity(
            client,
            user,
            "VOICE_LEAVE",
            `Left voice channel: ${oldState.channel.name}`
          );
        }
        
        // User switched voice channels
        if (oldState.channelId && newState.channelId && 
            oldState.channelId !== newState.channelId && 
            oldState.channel && newState.channel) {
          logUserActivity(
            client,
            user,
            "VOICE_SWITCH",
            `Switched voice channels: ${oldState.channel.name} → ${newState.channel.name}`
          );
        }
      }
    }
  };
  
  // Add all listeners
  for (const [event, listener] of Object.entries(listeners)) {
    client.on(event, listener);
    eventListeners.set(event, listener);
  }
  
  isTracking = true;
  console.log("Tracking event listeners activated");
}

// Remove event listeners
function removeEventListeners(client) {
  for (const [event, listener] of eventListeners) {
    client.removeListener(event, listener);
  }
  eventListeners.clear();
  isTracking = false;
  console.log("Tracking event listeners removed");
}

// Check if we need listeners
function checkListenersNeeded() {
  if (trackedUsers.size > 0 && !isTracking) {
    return true;
  } else if (trackedUsers.size === 0 && isTracking) {
    return false;
  }
  return null;
}

// Load data on require
loadTrackingData();

module.exports = {
  name: "track",
  description: "Track user activities across servers",
  usage: `${prefix}track <start|stop|status|list|clean> [user]`,

  async execute(channel, message, client, args) {
    if (args.length === 0) {
      return channel.send(
        `**Track Commands:**\n` +
        `- \`${prefix}track start <user>\` - Start tracking a user\n` +
        `- \`${prefix}track stop <user>\` - Stop tracking a user\n` +
        `- \`${prefix}track status\` - Show tracking status\n` +
        `- \`${prefix}track list\` - List all tracked users\n` +
        `- \`${prefix}track clean\` - Clean up unavailable users`
      );
    }

    const subcommand = args[0].toLowerCase();
    
    // Check if we need to setup/remove listeners
    const listenersNeeded = checkListenersNeeded();
    if (listenersNeeded === true) {
      setupEventListeners(client);
    } else if (listenersNeeded === false) {
      removeEventListeners(client);
    }

    switch (subcommand) {
      case "start":
        if (args.length < 2) {
          return channel.send("❌ Please specify a user to track (ID or mention)");
        }
        
        let targetUser;
        const userInput = args[1];
        
        // Check if it's a mention
        if (userInput.match(/<@!?(\d+)>/)) {
          const userId = userInput.match(/<@!?(\d+)>/)[1];
          targetUser = client.users.cache.get(userId);
        } 
        // Check if it's a user ID
        else if (userInput.match(/^\d+$/)) {
          targetUser = client.users.cache.get(userInput);
        }
        
        if (!targetUser) {
          return channel.send("❌ User not found in cache. Please make sure the user is in a shared server.");
        }
        
        // Check if already tracking
        if (trackedUsers.has(targetUser.id)) {
          return channel.send(`❌ Already tracking user ${targetUser.tag}`);
        }
        
        // Create user tracking entry
        const logFileName = `tracking_${targetUser.id}_${Date.now()}.txt`;
        const logFilePath = path.resolve(__dirname, `../../logs/${logFileName}`);
        
        // Ensure logs directory exists
        if (!fs.existsSync(path.dirname(logFilePath))) {
          fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
        }
        
        // Create initial log file
        const initialLog = `Tracking started for ${targetUser.tag} (${targetUser.id}) at ${new Date().toISOString()}\n`;
        fs.writeFileSync(logFilePath, initialLog);
        
        trackedUsers.set(targetUser.id, {
          user: {
            id: targetUser.id,
            tag: targetUser.tag
          },
          logFilePath,
          activities: [],
          startTime: new Date().toISOString()
        });
        
        saveTrackingData();
        
        // Setup listeners if this is the first user being tracked
        if (checkListenersNeeded() === true) {
          setupEventListeners(client);
        }
        
        channel.send(`✅ Started tracking user ${targetUser.tag}. Log file: \`${logFileName}\``);
        break;
        
      case "stop":
        if (args.length < 2) {
          return channel.send("❌ Please specify a user to stop tracking (ID or mention)");
        }
        
        let stopTargetId;
        const stopInput = args[1];
        
        if (stopInput.match(/<@!?(\d+)>/)) {
          stopTargetId = stopInput.match(/<@!?(\d+)>/)[1];
        } else if (stopInput.match(/^\d+$/)) {
          stopTargetId = stopInput;
        }
        
        if (!stopTargetId || !trackedUsers.has(stopTargetId)) {
          return channel.send("❌ Not tracking this user or user not found");
        }
        
        const stopTarget = trackedUsers.get(stopTargetId);
        
        // Add stop entry to log
        const stopLog = `Tracking stopped at ${new Date().toISOString()}\n`;
        fs.appendFileSync(stopTarget.logFilePath, stopLog);
        
        trackedUsers.delete(stopTargetId);
        saveTrackingData();
        
        // Check if we need to remove listeners
        if (checkListenersNeeded() === false) {
          removeEventListeners(client);
        }
        
        channel.send(`✅ Stopped tracking user ${stopTarget.user.tag}`);
        break;
        
      case "status":
        if (trackedUsers.size === 0) {
          return channel.send("📊 Not tracking any users currently");
        }
        
        let statusMsg = "📊 **Currently Tracking:**\n";
        for (const [userId, userData] of trackedUsers) {
          const user = client.users.cache.get(userId) || { tag: `Unknown (${userId})` };
          const activityCount = userData.activities.length;
          const startTime = new Date(userData.startTime).toLocaleString();
          
          statusMsg += `• **${user.tag}** - ${activityCount} activities (since ${startTime})\n`;
        }
        
        statusMsg += `\n**Total tracked users:** ${trackedUsers.size}`;
        channel.send(statusMsg);
        break;
        
      case "list":
        if (trackedUsers.size === 0) {
          return channel.send("📋 No tracked users found");
        }
        
        try {
          const logFiles = [];
          for (const [userId, userData] of trackedUsers) {
            const user = client.users.cache.get(userId) || { tag: `Unknown (${userId})` };
            const stats = fs.statSync(userData.logFilePath);
            logFiles.push({
              user: user.tag,
              file: path.basename(userData.logFilePath),
              size: (stats.size / 1024).toFixed(2) + ' KB',
              activities: userData.activities.length
            });
          }
          
          const fileList = logFiles.map(file => 
            `• **${file.user}** - \`${file.file}\` (${file.size}, ${file.activities} activities)`
          ).join('\n');
          
          channel.send(`📋 **Tracked Users Log Files:**\n${fileList}`);
        } catch (error) {
          channel.send('❌ Error reading log files');
        }
        break;
        
      case "clean":
        // Remove users that are no longer trackable (left servers, etc)
        let removedCount = 0;
        for (const [userId, userData] of trackedUsers) {
          const user = client.users.cache.get(userId);
          if (!user) {
            // Add a note to the log file
            const cleanupNote = `User became unavailable, tracking stopped at ${new Date().toISOString()}\n`;
            try {
              fs.appendFileSync(userData.logFilePath, cleanupNote);
            } catch (err) {
              console.error("Error writing cleanup note:", err);
            }
            trackedUsers.delete(userId);
            removedCount++;
          }
        }
        
        if (removedCount > 0) {
          saveTrackingData();
          
          // Check if we need to remove listeners
          if (checkListenersNeeded() === false) {
            removeEventListeners(client);
          }
        }
        
        channel.send(`✅ Cleaned up ${removedCount} unavailable users from tracking.`);
        break;
        
      default:
        channel.send(`❌ Invalid subcommand. Use \`${prefix}track start\`, \`${prefix}track stop\`, \`${prefix}track status\`, \`${prefix}track list\`, or \`${prefix}track clean\``);
    }
  }
};

// Export functions for external access
module.exports.trackedUsers = trackedUsers;
module.exports.saveTrackingData = saveTrackingData;
