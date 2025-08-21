module.exports = {
    name: 'hwinfo',
    description: 'Neofetch-style system info with pixel-art logos, bars and extended GPU/CPU details.',
    /**
     * Usage:
     *  - !sysinfo                -> auto-detect and display info + logo
     *  - !sysinfo <name>         -> force a specific logo/name (e.g. ubuntu, arch, windows)
     *  - !sysinfo --no-color     -> plain (no ANSI) output (can be combined with a forced name)
     */
    async execute(channel, message, client, args) {
        const os = require('os');
        const util = require('util');
        const child_process = require('child_process');
        const exec = util.promisify(child_process.exec);

        const LOGOS = {
            ubuntu: [
                '         _',
                '     ---(_)',
                ' _/  ---  \\',
                '(_) |   |',
                '  \\  --- _/',
                '     ---(_)'
            ],
            default: [
                '  ____',
                ' / __ \\',
                '| |  | |',
                '| |  | |',
                ' \\____/'
            ]
        };

        function getLogo(name) {
            name = (name || '').toLowerCase();
            return LOGOS[name] || LOGOS.default;
        }

        async function tryExec(cmd) {
            try {
                const { stdout } = await exec(cmd);
                return (stdout || '').trim();
            } catch (e) {
                return '';
            }
        }

        function makeBar(percent, length = 24) {
            const p = Math.max(0, Math.min(100, Number(percent) || 0));
            const filled = Math.round((p / 100) * length);
            const empty = length - filled;
            const fillChar = '█';
            const emptyChar = '░';
            const bar = fillChar.repeat(filled) + emptyChar.repeat(empty);
            // color emojis/text not necessary in --no-color mode; but keep for ANSI
            return `[${bar}] ${p}%`;
        }

        try {
            const platform = os.platform();
            const arch = os.arch();
            const hostname = os.hostname();
            const cpus = os.cpus() || [];
            const cpuModel = cpus[0] ? cpus[0].model.replace(/\s+/g, ' ').trim() : 'Unknown';
            const cpuCount = cpus.length;
            const totalMemGB = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
            const usedMemGBNum = (os.totalmem() - os.freemem()) / 1024 / 1024 / 1024;
            const usedMemGB = usedMemGBNum.toFixed(2);
            const memPercent = (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(0);

            let distro = '';
            let kernel = os.release();
            let shell = process.env.SHELL || process.env.COMSPEC || '';
            let gpu = 'N/A', gpuTemp = 'N/A', gpuUsage = 0, gpuClock = 'N/A';
            let cpuTemp = 'N/A', cpuUsage = 'N/A';

            // args
            const flags = args.filter(a => a.startsWith('-'));
            const noColor = flags.includes('--no-color') || flags.includes('-n');
            const forcedArg = args.find(a => !a.startsWith('-')) || null;
            const forced = forcedArg ? forcedArg.toLowerCase() : null;

            if (forced) distro = forced;

            if (!forced && platform === 'linux') {
                const osr = await tryExec('cat /etc/os-release 2>/dev/null || lsb_release -ds 2>/dev/null || true');
                const m = osr.match(/PRETTY_NAME="?([^"\n]*)"?/);
                distro = (m && m[1]) ? m[1] : (osr.trim() || '');

                // GPU name parsing from lspci -mm
                const lsp = await tryExec('lspci -mm | grep -i "vga\\|3d\\|display" -m1 2>/dev/null || true');
                if (lsp) {
                    const quoted = [...lsp.matchAll(/"([^"]+)"/g)].map(x => x[1]);
                    if (quoted.length >= 4) {
                        const vendor = quoted[2].replace(/\s*$$.*?$$\s*/g, '').trim();
                        const model = quoted[3].replace(/\s*$$.*?$$\s*/g, '').trim();
                        let board = '';
                        if (quoted.length >= 6) board = quoted[5].replace(/\s*$$.*?$$\s*/g, '').trim();
                        gpu = `${vendor} ${model}` + (board ? ` (Board: ${board})` : '');
                    } else {
                        gpu = lsp.replace(/^[0-9a-f:.]+\s*/i, '').replace(/ -\S+/g, '').replace(/\t/g, ' ').trim();
                    }
                } else {
                    const nname = await tryExec('nvidia-smi --query-gpu=name --format=csv,noheader -i 0 2>/dev/null || true');
                    if (nname) gpu = nname;
                }

                // GPU metrics
                const nvidiaMetrics = await tryExec('nvidia-smi --query-gpu=temperature.gpu,utilization.gpu,clocks.current.graphics --format=csv,noheader 2>/dev/null || true');
                if (nvidiaMetrics) {
                    const parts = nvidiaMetrics.split(',').map(p => p.trim());
                    gpuTemp = parts[0] ? parts[0].replace(/[^0-9.]/g, '') + '°C' : gpuTemp;
                    gpuUsage = parts[1] ? Number(parts[1].replace(/[^0-9.]/g, '')) : gpuUsage;
                    gpuClock = parts[2] ? parts[2].replace(/[^0-9.]/g, '') + ' MHz' : gpuClock;
                } else {
                    // AMD/sysfs attempts
                    const amdgpuUtil = await tryExec('cat /sys/class/drm/card*/device/gpu_busy_percent 2>/dev/null | head -n1 || true');
                    if (amdgpuUtil) gpuUsage = Number(amdgpuUtil.trim()) || gpuUsage;
                    const amdgpuTemp = await tryExec('cat /sys/class/drm/card*/device/hwmon/hwmon*/temp1_input 2>/dev/null | head -n1 || true');
                    if (amdgpuTemp) {
                        const v = parseFloat(amdgpuTemp);
                        gpuTemp = v > 1000 ? (v / 1000).toFixed(1) + '°C' : v.toFixed(1) + '°C';
                    }
                    const amdgpuClock = await tryExec('cat /sys/class/drm/card*/device/clock 2>/dev/null | head -n1 || true');
                    if (amdgpuClock) {
                        const c = parseInt(amdgpuClock, 10);
                        if (!isNaN(c)) gpuClock = `${c} MHz`;
                    }
                }

                // CPU temp
                const sensorsOut = await tryExec('sensors -u 2>/dev/null || true');
                if (sensorsOut) {
                    const t = sensorsOut.match(/temp1_input:\s*([\d.]+)/) || sensorsOut.match(/temp\d+_input:\s*([\d.]+)/);
                    if (t) cpuTemp = `${parseFloat(t[1]).toFixed(1)}°C`;
                } else {
                    const sysT = await tryExec('cat /sys/class/thermal/thermal_zone*/temp 2>/dev/null | head -n1 || true');
                    if (sysT) {
                        const v = parseFloat(sysT);
                        cpuTemp = v > 1000 ? (v / 1000).toFixed(1) + '°C' : v.toFixed(1) + '°C';
                    }
                }

                // CPU usage sample
                try {
                    const s1 = await tryExec("awk '/^cpu /{for(i=2;i<=NF;i++)sum+=$i;print $5\",\"sum;}' /proc/stat");
                    await new Promise(r => setTimeout(r, 350));
                    const s2 = await tryExec("awk '/^cpu /{for(i=2;i<=NF;i++)sum+=$i;print $5\",\"sum;}' /proc/stat");
                    if (s1 && s2) {
                        const [idle1,total1] = s1.split(',').map(Number);
                        const [idle2,total2] = s2.split(',').map(Number);
                        const idleDiff = idle2 - idle1;
                        const totalDiff = total2 - total1;
                        const usage = (1 - idleDiff / totalDiff) * 100;
                        cpuUsage = `${usage.toFixed(0)}%`;
                    }
                } catch (e) { cpuUsage = 'N/A'; }

            } else if (platform === 'win32') {
                distro = distro || 'Windows';
                const w = await tryExec('wmic os get Caption /value');
                const mm = w.match(/Caption=(.*)/i);
                if (mm && mm[1]) distro = mm[1].trim();
                const g = await tryExec('wmic path win32_VideoController get name 2>NUL');
                if (g) {
                    const lines = g.split('\n').map(l => l.trim()).filter(Boolean);
                    gpu = lines.slice(1).join('; ') || lines.join('; ');
                }
                const n = await tryExec('nvidia-smi --query-gpu=temperature.gpu,utilization.gpu,clocks.current.graphics --format=csv,noheader 2>NUL || true');
                if (n) {
                    const p = n.split(',').map(x => x.trim());
                    if (p[0]) gpuTemp = p[0].replace(/[^0-9.]/g,'') + '°C';
                    if (p[1]) gpuUsage = Number(p[1].replace(/[^0-9.]/g,'')) || 0;
                    if (p[2]) gpuClock = p[2].replace(/[^0-9.]/g,'') + ' MHz';
                }
            } else if (platform === 'darwin') {
                distro = distro || 'macOS';
                const mv = await tryExec('sw_vers -productName 2>/dev/null || true');
                if (mv) distro = mv;
                const sp = await tryExec('system_profiler SPDisplaysDataType 2>/dev/null || true');
                if (sp) {
                    const nameM = sp.match(/Chipset Model:\s*(.+)/i) || sp.match(/Model:\s*(.+)/i);
                    if (nameM) gpu = nameM[1].trim();
                }
            }

            // logo selection (simple)
            const logoKey = (forced || distro || '').toLowerCase();
            const logo = getLogo(logoKey);

            // ANSI helpers
            const C = {
                reset: noColor ? '' : '\x1b[0m',
                cyan: noColor ? '' : '\x1b[1;36m',
                white: noColor ? '' : '\x1b[1;37m',
                blue: noColor ? '' : '\x1b[1;34m',
                green: noColor ? '' : '\x1b[1;32m',
                magenta: noColor ? '' : '\x1b[1;35m',
                yellow: noColor ? '' : '\x1b[1;33m'
            };

            // Build info lines with bars
const title = `${hostname} @ 🟠 System Information`;
const infoLines = [
  `${C.cyan}╭─ ${title} ───────────────────────────╮${C.reset}`,
  `${C.white}│${C.reset}  ${C.blue}🖥️ OS:       ${C.reset} ${distro} (${arch})`,
  `${C.white}│${C.reset}  ${C.blue}🏠 Host:     ${C.reset} ${hostname}`,
  `${C.white}│${C.reset}  ${C.blue}⚙️ Kernel:   ${C.reset} ${kernel}`,
  `${C.white}│${C.reset}  ${C.blue}⏰ Uptime:   ${C.reset} ${(os.uptime() / 3600).toFixed(1)}h`,
  `${C.white}│${C.reset}  ${C.blue}🐚 Shell:    ${C.reset} ${shell}`,
  `${C.white}│${C.reset}  ${C.blue}🟢 Runtime:  ${C.reset} Node.js ${process.version} (selfbot-v13)`,
  `${C.white}├─────────────────────────────────────╮${C.reset}`,
  `${C.white}│${C.reset}  ${C.green}🧠 CPU:      ${C.reset} ${cpuModel} (${cpuCount} cores)`,
  `${C.white}│${C.reset}  ${C.green}📊 CPU Load: ${C.reset} ${cpuUsage} ${cpuTemp !== 'N/A' ? `| ${C.green}🌡 Temp:${C.reset} ${cpuTemp}` : ''}`,
  `${C.white}│${C.reset}  ${C.magenta}🎮 GPU:      ${C.reset} ${gpu}`,
  `${C.white}│${C.reset}  ${C.magenta}📈 GPU Load: ${C.reset} ${gpuUsage !== 'N/A' ? (gpuUsage ? `${gpuUsage}% ` : '0% ') : 'N/A '} ${makeBar(gpuUsage || 0)}`,
  `${C.white}│${C.reset}  ${C.magenta}⏱️ GPU Temp: ${C.reset} ${gpuTemp} ${gpuClock !== 'N/A' ? `| ${gpuClock}` : ''}`,
  `${C.white}│${C.reset}  ${C.yellow}💾 Memory:   ${C.reset} ${usedMemGB}GB / ${totalMemGB}GB`,
  `${C.white}│${C.reset}  ${C.yellow}📊 RAM Use:  ${C.reset} ${makeBar(memPercent)}`,
  `${C.cyan}╰─────────────────────────────────────╯${C.reset}`
];

            // Merge logo and info
            const box = [];
            box.push('```ansi');
            const maxLines = Math.max(logo.length, infoLines.length);
            for (let i = 0; i < maxLines; i++) {
                const l = logo[i] || '';
                const r = infoLines[i] || '';
                box.push(l.padEnd(22, ' ') + ' ' + r);
            }
            box.push('```');

            let out = box.join('\n');
            if (out.length > 1900) out = out.slice(0, 1900) + '\n...(truncated)';

            return message.channel.send(out).catch(console.error);
        } catch (err) {
            console.error('Error running sysinfo:', err);
            return message.channel.send('Failed to gather system information.').catch(console.error);
        }
    }
};
