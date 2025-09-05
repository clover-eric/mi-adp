import axios from 'axios'

const apiBase = import.meta.env.VITE_API_BASE || '/api'

export async function connectDevice(ip) {
  const { data } = await axios.post(`${apiBase}/connect`, { ip })
  return data
}

export async function installApk(file, device) {
  const form = new FormData()
  form.append('apk', file)
  if (device) form.append('device', device)
  const { data } = await axios.post(`${apiBase}/install`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: () => {},
  })
  return data
}

export async function listApps(device) {
  const { data } = await axios.get(`${apiBase}/apps`, { params: { device } })
  return data
}

export async function uninstallApp(pkg, device) {
  const { data } = await axios.delete(`${apiBase}/apps/${encodeURIComponent(pkg)}`, { params: { device } })
  return data
}
