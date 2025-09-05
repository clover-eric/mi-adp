import React, { useCallback, useRef, useState } from 'react'

export default function UploadBox({ onFileSelected }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const onDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    if (e.dataTransfer?.files?.length) {
      const file = e.dataTransfer.files[0]
      onFileSelected?.(file)
    }
  }, [onFileSelected])

  return (
    <div
      className={`border-2 border-dashed rounded p-6 text-center cursor-pointer ${dragOver ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
    >
      <p className="text-gray-700 mb-2">拖拽 APK 到此处，或点击选择文件</p>
      <p className="text-xs text-gray-500">仅支持 .apk 文件</p>
      <input
        ref={inputRef}
        type="file"
        accept=".apk"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFileSelected?.(file)
        }}
      />
    </div>
  )
}
