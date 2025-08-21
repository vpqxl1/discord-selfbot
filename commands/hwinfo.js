const os = require("os");
const fs = require("fs");
const { execSync } = require("child_process");

module.exports = {
    name: "hwinfo",
    description: "Shows your PC specs and memory usage in enhanced neofetch style",
    async execute(channel, message, client, args) {
        try {
            const totalMemGB = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
            const freeMemGB = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
            const usedMemGB = (totalMemGB - freeMemGB).toFixed(2);
            let cpuModel = os.cpus()[0].model;
            const cpuCores = os.cpus().length;
            
            // Clean up CPU name
            cpuModel = cpuModel
                .replace(/\(R\)/g, '')
                .replace(/\(TM\)/g, '')
                .replace(/\d+th Gen Intel /gi, '')
                .replace(/\d+nd Gen Intel /gi, '')
                .replace(/\d+rd Gen Intel /gi, '')
                .replace(/\d+st Gen Intel /gi, '')
                .replace(/Intel Core /gi, 'Intel ')
                .replace(/AMD Ryzen /gi, 'AMD ')
                .replace(/\s+/g, ' ')
                .replace(/CPU @ .*?GHz/gi, '')
                .replace(/\s+processor/gi, '')
                .trim();
            
            // Get CPU temperature
            let cpuTemp = "N/A";
            try {
                if (os.platform() === 'linux') {
                    try {
                        const sensorsOutput = execSync('sensors 2>/dev/null | grep -E "(Core|Tctl|CPU|Package)" | head -1', { encoding: 'utf8', timeout: 2000, stdio: ['ignore', 'pipe', 'ignore'] });
                        const tempMatch = sensorsOutput.match(/\+(\d+(?:\.\d+)?)°C/);
                        if (tempMatch) {
                            cpuTemp = tempMatch[1] + "°C";
                        }
                    } catch (e) {
                        try {
                            const thermalOutput = execSync('cat /sys/class/thermal/thermal_zone*/temp 2>/dev/null | head -1', { encoding: 'utf8', timeout: 1000, stdio: ['ignore', 'pipe', 'ignore'] });
                            if (thermalOutput && thermalOutput.trim()) {
                                const tempMillidegrees = parseInt(thermalOutput.trim());
                                if (tempMillidegrees > 1000) {
                                    const tempCelsius = (tempMillidegrees / 1000).toFixed(1);
                                    cpuTemp = tempCelsius + "°C";
                                }
                            }
                        } catch (e2) {
                            try {
                                const acpiOutput = execSync('cat /proc/acpi/thermal_zone/*/temperature 2>/dev/null | head -1', { encoding: 'utf8', timeout: 1000, stdio: ['ignore', 'pipe', 'ignore'] });
                                const acpiMatch = acpiOutput.match(/(\d+) C/);
                                if (acpiMatch) {
                                    cpuTemp = acpiMatch[1] + "°C";
                                }
                            } catch (e3) {}
                        }
                    }
                } else if (os.platform() === 'win32') {
                    try {
                        const wmiTemp = execSync('wmic /namespace:\\\\root\\wmi PATH MSAcpi_ThermalZoneTemperature get CurrentTemperature /value 2>nul', { encoding: 'utf8', timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] });
                        const tempMatch = wmiTemp.match(/CurrentTemperature=(\d+)/);
                        if (tempMatch) {
                            const tempKelvin = parseInt(tempMatch[1]) / 10;
                            const tempCelsius = (tempKelvin - 273.15).toFixed(1);
                            if (tempCelsius > 0 && tempCelsius < 150) {
                                cpuTemp = tempCelsius + "°C";
                            }
                        }
                    } catch (e) {}
                }
            } catch (e) {
                cpuTemp = "N/A";
            }
            
            // Enhanced platform info and ASCII art with better styling
            let platformName = os.platform();
            let osIcon = "💻";
            let asciiArt = "";
            let distro = "";
            
            switch (platformName) {
                case 'win32':
                    platformName = 'Windows';
                    osIcon = "🪟";
                    asciiArt = `        ████████████████
        ████████████████
        ████            
        ████            
        ████            
        ████████████████
        ████████████████
        ████            
        ████            
        ████            
        ████████████████
        ████████████████`;
                    break;
                case 'linux':
                    osIcon = "🐧";
                    asciiArt = `            .---.
           |o_o |
           |:_/ |
          //   \\ \\
         (|     | )
        /'\_   _/\`\\
        \\___)=(___)`;
                    break;
                case 'darwin':
                    platformName = 'macOS';
                    osIcon = "🍎";
                    asciiArt = `                    'c.
                 ,xNMM.
               .OMMMMo
               OMMM0,
     .;loddo:' loolloddol;.
   cKMMMMMMMMMMNWMMMMMMMMMM0:
 .KMMMMMMMMMMMMMMMMMMMMMMMWd.
 XMMMMMMMMMMMMMMMMMMMMMMMX.
;MMMMMMMMMMMMMMMMMMMMMMMM:
:MMMMMMMMMMMMMMMMMMMMMMMM:
.MMMMMMMMMMMMMMMMMMMMMMMMX.
 kMMMMMMMMMMMMMMMMMMMMMMMMWd.
 .XMMMMMMMMMMMMMMMMMMMMMMMMMMk
  .XMMMMMMMMMMMMMMMMMMMMMMMMK.`;
                    break;
            }
            
            // Get Linux distribution with enhanced ASCII art
            if (platformName === 'linux') {
                try {
                    if (fs.existsSync('/etc/os-release')) {
                        const osRelease = fs.readFileSync('/etc/os-release', 'utf8');
                        const nameMatch = osRelease.match(/PRETTY_NAME="(.+)"/);
                        const idMatch = osRelease.match(/^ID=(.+)$/m);
                        
                        if (nameMatch) {
                            distro = nameMatch[1];
                        }
                        
                        if (idMatch) {
                            const distroId = idMatch[1].replace(/"/g, '').toLowerCase();
                            switch (distroId) {
                                case 'ubuntu':
                                    osIcon = "🟠";
                                    asciiArt = `         _
     ---(_)
 _/  ---  \\
(_) |   |
  \\  --- _/
     ---(_)`;
                                    break;
                                case 'debian':
                                    osIcon = "🔴";
                                    asciiArt = `       _,met$$$$$gg.
    ,g$$$$$$$$$$$$$$$P.
  ,g$$P"     """Y$$.".  
 ,$$P'              \`$$$.
',$$P       ,ggs.     \`$$b:
\`d$$'     ,$P"'   .    $$$
 $$P      d$'     ,    $$P 
 $$:      $$.   -    ,d$$' 
 $$;      Y$b._   _,d$P'   
 Y$$.    \`."Y$$$$P"'       
 \`$$b      "-.__           
  \`Y$$                     
   \`Y$$.                   
     \`$$b.                 
       \`Y$$b.              
          \`"Y$b._          
              \`"""`;
                                    break;
                                case 'arch':
                                    osIcon = "⚡";
                                    asciiArt = `                   -\`
                  .o+\`
                 \`ooo/
                \`+oooo:
               \`+oooooo:
               -+oooooo+:
             \`/:-:++oooo+:
            \`/++++/+++++++:
           \`/++++++++++++++:
          \`/+++ooooooooo+++/
         ./ooosssso++osssssso+\`
        .oossssso-\`\`\`\`/ossssss+\`
       -osssssso.      :ssssssso.
      :osssssss/        osssso+++.
     /ossssssss/        +ssssooo/-
   \`/ossssso+/:-        -:/+osssso+-
  \`+sso+:-\`                 \`.-/+oso:
 \`++:.                           \`-/+/
 .\`                                 \`/`;
                                    break;
                                case 'fedora':
                                    osIcon = "🔵";
                                    asciiArt = `        ,''''.
       |   ,,,,|
       |   ||||'
       |   ''''.
       |   ,,,,|
       |   ||||'
        '''''''
      .---||||||'''
     /    ||||||   \\
    |     ||||||    |
     \\    ||||||   /
      '---||||||---'
          ||||||
          ||||||
          ||||||
          ''''''`;
                                    break;
                            }
                        }
                    }
                } catch (e) {
                    try {
                        distro = execSync('lsb_release -d', { encoding: 'utf8', timeout: 2000 })
                                .split('\t')[1]?.trim() || 'Linux';
                    } catch (e2) {
                        distro = 'Linux';
                    }
                }
                platformName = distro || 'Linux';
            }
            
            const arch = os.arch();
            const hostname = os.hostname();
            const uptime = (os.uptime() / 60 / 60).toFixed(1);
            
            // Get actual kernel version
            let kernelVersion = "Unknown";
            try {
                if (os.platform() === 'linux') {
                    kernelVersion = execSync('uname -r', { encoding: 'utf8', timeout: 2000 }).trim();
                } else if (os.platform() === 'win32') {
                    const winver = execSync('ver', { encoding: 'utf8', timeout: 2000 });
                    const match = winver.match(/Version (\d+\.\d+\.\d+)/);
                    if (match) {
                        kernelVersion = match[1];
                    }
                } else if (os.platform() === 'darwin') {
                    kernelVersion = execSync('uname -r', { encoding: 'utf8', timeout: 2000 }).trim();
                }
            } catch (e) {
                kernelVersion = os.release();
            }
            
            // Get actual shell
            let userShell = "Unknown";
            try {
                if (os.platform() === 'linux' || os.platform() === 'darwin') {
                    userShell = process.env.SHELL?.split('/').pop() || 'bash';
                } else if (os.platform() === 'win32') {
                    userShell = process.env.ComSpec?.split('\\').pop() || 'cmd.exe';
                }
            } catch (e) {
                userShell = "Terminal";
            }
            
            // Get CPU usage
            let cpuUsage = "N/A";
            try {
                const cpus = os.cpus();
                let totalIdle = 0;
                let totalTick = 0;
                
                cpus.forEach(cpu => {
                    for (type in cpu.times) {
                        totalTick += cpu.times[type];
                    }
                    totalIdle += cpu.times.idle;
                });
                
                const idle = totalIdle / cpus.length;
                const total = totalTick / cpus.length;
                const usage = 100 - ~~(100 * idle / total);
                cpuUsage = usage + "%";
            } catch (e) {
                cpuUsage = "N/A";
            }
            
            // Get GPU info (existing logic preserved)
            let gpuInfo = "N/A";
            let gpuUsage = "N/A";
            let gpuUsagePercent = 0;
            let gpuTemp = "N/A";
            
            try {
                if (os.platform() === 'linux') {
                    try {
                        const lspciOutput = execSync('lspci | grep -i "vga\\|3d\\|display"', { encoding: 'utf8', timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] });
                        const lines = lspciOutput.split('\n').filter(line => line.trim());
                        if (lines.length > 0) {
                            let gpuLine = lines[0];
                            const match = gpuLine.match(/^\S+\s+[^:]+:\s*(.+)$/);
                            if (match) {
                                gpuInfo = match[1].trim();
                                gpuInfo = gpuInfo.replace(/^(NVIDIA Corporation|Advanced Micro Devices, Inc\.|AMD|Intel Corporation)\s*/i, '');
                                gpuInfo = gpuInfo.replace(/\s*\[.*?\]/g, '');
                                gpuInfo = gpuInfo.replace(/\s*\(.*?\)/g, '');
                                gpuInfo = gpuInfo.replace(/\s+/g, ' ').trim();
                                
                                if (gpuInfo.toLowerCase().includes('navi')) {
                                    if (gpuInfo.toLowerCase().includes('navi 32')) {
                                        gpuInfo = "AMD Radeon RX 7800 XT";
                                    } else if (gpuInfo.toLowerCase().includes('navi 31')) {
                                        gpuInfo = "AMD Radeon RX 7900 XTX";
                                    } else if (gpuInfo.toLowerCase().includes('navi 33')) {
                                        gpuInfo = "AMD Radeon RX 7600";
                                    } else if (gpuInfo.toLowerCase().includes('navi 21')) {
                                        gpuInfo = "AMD Radeon RX 6800/6900";
                                    } else if (gpuInfo.toLowerCase().includes('navi 22')) {
                                        gpuInfo = "AMD Radeon RX 6700 XT";
                                    } else if (gpuInfo.toLowerCase().includes('navi 23')) {
                                        gpuInfo = "AMD Radeon RX 6600";
                                    } else if (gpuInfo.toLowerCase().includes('navi 24')) {
                                        gpuInfo = "AMD Radeon RX 6400/6500";
                                    } else {
                                        gpuInfo = "AMD " + gpuInfo;
                                    }
                                } else if (gpuInfo.toLowerCase().includes('radeon') && !gpuInfo.toLowerCase().includes('amd')) {
                                    gpuInfo = "AMD " + gpuInfo;
                                }
                                
                                if (gpuInfo.length > 30) {
                                    gpuInfo = gpuInfo.substring(0, 27) + "...";
                                }
                            }
                        }
                    } catch (e) {}
                    
                    try {
                        try {
                            const radeontopOutput = execSync('timeout 2 radeontop -d - -l 1 2>/dev/null | grep "gpu" | head -1', { encoding: 'utf8', timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] });
                            const usageMatch = radeontopOutput.match(/gpu\s+(\d+(?:\.\d+)?)%/i);
                            if (usageMatch) {
                                gpuUsagePercent = parseFloat(usageMatch[1]);
                                gpuUsage = gpuUsagePercent.toFixed(1) + "%";
                            }
                        } catch (e) {
                            try {
                                const gpuBusyPercent = execSync('cat /sys/class/drm/card0/device/gpu_busy_percent 2>/dev/null', { encoding: 'utf8', timeout: 1000, stdio: ['ignore', 'pipe', 'ignore'] });
                                if (gpuBusyPercent && gpuBusyPercent.trim()) {
                                    gpuUsagePercent = parseFloat(gpuBusyPercent.trim());
                                    gpuUsage = gpuUsagePercent.toFixed(1) + "%";
                                }
                            } catch (e2) {
                                try {
                                    const nvidiaOutput = execSync('nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits 2>/dev/null', { encoding: 'utf8', timeout: 2000, stdio: ['ignore', 'pipe', 'ignore'] });
                                    if (nvidiaOutput && nvidiaOutput.trim()) {
                                        gpuUsagePercent = parseFloat(nvidiaOutput.trim());
                                        gpuUsage = gpuUsagePercent.toFixed(1) + "%";
                                    }
                                } catch (e3) {
                                    if (gpuInfo !== "N/A") {
                                        gpuUsage = "No tools";
                                    }
                                }
                            }
                        }
                    } catch (e) {}
                    
                } else if (os.platform() === 'win32') {
                    try {
                        const wmiOutput = execSync('wmic path win32_VideoController get name /value 2>nul', { encoding: 'utf8', timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] });
                        const gpuMatch = wmiOutput.match(/Name=(.+)/);
                        if (gpuMatch) {
                            gpuInfo = gpuMatch[1].trim();
                            if (gpuInfo.length > 30) {
                                gpuInfo = gpuInfo.substring(0, 27) + "...";
                            }
                        }
                    } catch (e) {}
                }
            } catch (e) {}
            
            // Enhanced progress bars with better characters and colors
            const createProgressBar = (percentage, length = 20) => {
                const filled = Math.round((percentage / 100) * length);
                const empty = length - filled;
                
                let bar = "";
                let color = "";
                
                // Color coding based on usage
                if (percentage < 30) {
                    color = "🟢"; // Green for low usage
                } else if (percentage < 70) {
                    color = "🟡"; // Yellow for medium usage
                } else {
                    color = "🔴"; // Red for high usage
                }
                
                bar = "█".repeat(filled) + "░".repeat(empty);
                return `${color} [${bar}] ${percentage}%`;
            };
            
            // Memory usage percentage
            const memUsagePercent = ((usedMemGB / totalMemGB) * 100).toFixed(1);
            
            // Get temperature color indicator
            const getTempColor = (temp) => {
                if (temp === "N/A") return "❓";
                const tempNum = parseFloat(temp);
                if (tempNum < 50) return "🟢";
                else if (tempNum < 70) return "🟡";
                else if (tempNum < 85) return "🟠";
                else return "🔴";
            };
            
            // Truncate CPU name if too long
            let displayCPU = cpuModel;
            if (displayCPU.length > 32) {
                displayCPU = displayCPU.substring(0, 29) + "...";
            }
            
            // Get Node.js version for runtime info
            const nodeVersion = process.version.replace('v', '');
            
            // Enhanced reply with better formatting and emojis
            let reply = "```ansi\n";
            reply += asciiArt + "\n\n";
            reply += `\u001b[1;36m╭─ ${hostname}@${osIcon} System Information ─╮\u001b[0m\n`;
            reply += `\u001b[1;37m│\u001b[0m \u001b[1;34m🖥️  OS:\u001b[0m ${platformName} (${arch})\n`;
            reply += `\u001b[1;37m│\u001b[0m \u001b[1;34m🏠 Host:\u001b[0m ${hostname}\n`;
            reply += `\u001b[1;37m│\u001b[0m \u001b[1;34m⚙️  Kernel:\u001b[0m ${kernelVersion}\n`;
            reply += `\u001b[1;37m│\u001b[0m \u001b[1;34m⏰ Uptime:\u001b[0m ${uptime}h\n`;
            reply += `\u001b[1;37m│\u001b[0m \u001b[1;34m🐚 Shell:\u001b[0m ${userShell}\n`;
            reply += `\u001b[1;37m│\u001b[0m \u001b[1;34m🟢 Runtime:\u001b[0m Node.js v${nodeVersion} (selfbot-v13)\n`;
            reply += `\u001b[1;37m├─────────────────────────────────────╮\u001b[0m\n`;
            reply += `\u001b[1;37m│\u001b[0m \u001b[1;32m🧠 CPU:\u001b[0m ${displayCPU} (${cpuCores} cores)\n`;
            reply += `\u001b[1;37m│\u001b[0m \u001b[1;32m📊 CPU Usage:\u001b[0m ${cpuUsage} | ${getTempColor(cpuTemp)} Temp: ${cpuTemp}\n`;
            
            if (gpuInfo !== "N/A") {
                reply += `\u001b[1;37m│\u001b[0m \u001b[1;35m🎮 GPU:\u001b[0m ${gpuInfo}\n`;
                if (gpuUsage !== "N/A" && gpuUsage !== "No tools") {
                    reply += `\u001b[1;37m│\u001b[0m \u001b[1;35m📈 GPU Usage:\u001b[0m ${createProgressBar(parseFloat(gpuUsagePercent))}\n`;
                } else {
                    reply += `\u001b[1;37m│\u001b[0m \u001b[1;35m📈 GPU Usage:\u001b[0m ${gpuUsage}\n`;
                }
            }
            
            reply += `\u001b[1;37m│\u001b[0m \u001b[1;33m💾 Memory:\u001b[0m ${usedMemGB}GB / ${totalMemGB}GB\n`;
            reply += `\u001b[1;37m│\u001b[0m \u001b[1;33m📊 RAM Usage:\u001b[0m ${createProgressBar(parseFloat(memUsagePercent))}\n`;
            reply += `\u001b[1;36m╰─────────────────────────────────────╯\u001b[0m\n`;
            reply += "```";

            // Send to the channel
            await channel.send(reply);
            
        } catch (err) {
            console.error("Error in pcinfo command:", err);
            try {
                await channel.send("❌ Could not fetch PC info.");
            } catch (sendErr) {
                console.error("Could not send error message:", sendErr);
            }
        }
    },
};
