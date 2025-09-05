import React, { useMemo, useState } from 'react'
import UploadBox from './components/UploadBox.jsx'
import ProgressBar from './components/ProgressBar.jsx'
import { connectDevice, installApk, listApps } from './api/index.js'

export default function App() {
  const [ip, setIp] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [connected, setConnected] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [apps, setApps] = useState([])

  const canConnect = useMemo(() => ip.trim().length > 0, [ip])

  async function handleConnect() {
    setBusy(true)
    setMessage('正在连接设备...')
    try {
      const res = await connectDevice(ip.trim())
      if (res.ok) {
        setConnected(true)
        setMessage('连接成功')
      } else {
        setMessage(res.stderr || res.error || '连接失败')
      }
    } catch (e) {
      setMessage(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleUpload(file) {
    if (!connected) {
      setMessage('请先连接设备')
      return
    }
    setBusy(true)
    setProgress(10)
    setMessage('正在上传并安装 APK...')
    try {
      const res = await installApk(file, deviceId || undefined)
      setProgress(90)
      if (res.ok) {
        setMessage('安装成功')
        setProgress(100)
        const appsRes = await listApps(deviceId || undefined).catch(() => null)
        if (appsRes?.ok) setApps(appsRes.list)
      } else {
        setMessage(res.stderr || '安装失败')
      }
    } catch (e) {
      setMessage(e.message)
    } finally {
      setBusy(false)
      setTimeout(() => setProgress(0), 800)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">小米电视 APK 安装工具</h1>
        <p className="text-sm text-gray-500">通过浏览器上传 APK，远程安装到电视</p>
      </header>

      <section className="bg-white rounded shadow p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">电视 IP 地址</label>
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="例如 192.168.1.100"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
            />
          </div>
          <button
            className={`px-4 py-2 rounded text-white ${connected ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}
            disabled={!canConnect || busy}
            onClick={handleConnect}
          >
            {connected ? '已连接' : '连接设备'}
          </button>
        </div>
        <div>
          <label className="block text-sm mb-1">设备序列号（可选）</label>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="adb -s {serial}，留空默认"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
          />
        </div>
      </section>

      <section className="bg-white rounded shadow p-4 space-y-4">
        <UploadBox onFileSelected={handleUpload} />
        {busy && <ProgressBar progress={progress} />}
        {message && <p className="text-sm text-gray-700">{message}</p>}
      </section>

      {apps?.length > 0 && (
        <section className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2">已安装应用（节选）</h2>
          <ul className="text-sm space-y-1 max-h-48 overflow-auto">
            {apps.slice(0, 50).map((pkg) => (
              <li key={pkg} className="font-mono">{pkg}</li>
            ))}
          </ul>
        </section>
      )}

      <footer className="text-xs text-gray-400">
        <p>请在电视开启开发者模式与 ADB 网络调试。上传文件仅用于安装过程，随后清理。</p>
      </footer>
    </div>
  )
}
