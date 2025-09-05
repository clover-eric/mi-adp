import React from 'react'

export default function ProgressBar({ progress = 0 }) {
  const pct = Math.max(0, Math.min(100, progress))
  return (
    <div className="w-full h-3 bg-gray-200 rounded">
      <div
        className="h-3 bg-blue-600 rounded"
        style={{ width: `${pct}%`, transition: 'width .2s ease' }}
      />
    </div>
  )
}
