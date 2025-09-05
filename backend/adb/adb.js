import { spawn } from 'child_process';

const ADB_PATH = process.env.ADB_PATH || 'adb';

function runCommand(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(ADB_PATH, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()))
    child.stderr.on('data', (d) => (stderr += d.toString()))
    child.on('error', reject)
    child.on('close', (code) => {
      resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() });
    })
  })
}

export async function adbConnect(hostWithPort) {
  return runCommand(['connect', hostWithPort]);
}

export async function adbInstall(apkPath, device) {
  const args = [];
  if (device) args.push('-s', device);
  args.push('install', '-r', apkPath);
  return runCommand(args);
}

export async function adbListPackages(device) {
  const args = [];
  if (device) args.push('-s', device);
  args.push('shell', 'pm', 'list', 'packages');
  return runCommand(args);
}

export async function adbUninstall(packageName, device) {
  const args = [];
  if (device) args.push('-s', device);
  args.push('uninstall', packageName);
  return runCommand(args);
}
