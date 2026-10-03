import { useState, useRef } from 'react'

export default function ExpenseAttachments({ attachments = [], onUpload, onDelete, isLoading = false }) {
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = (files) => {
    for (let i = 0; i < files.length; i++) {
      onUpload(files[i])
    }
  }

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return 'picture_as_pdf'
    if (fileType?.includes('image')) return 'image'
    if (fileType?.includes('word') || fileType?.includes('document')) return 'description'
    if (fileType?.includes('sheet') || fileType?.includes('excel')) return 'table_chart'
    return 'attachment'
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-[var(--accent-orange)] bg-[var(--accent-orange)]/10'
            : 'border-[var(--border-color)] hover:border-[var(--accent-orange)]/50'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleChange}
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
        />

        <span className="material-symbols-outlined text-4xl text-[var(--accent-orange)] inline-block">
          cloud_upload
        </span>
        <p className="mt-2 font-semibold text-white">Arrastra archivos aquí o haz clic para seleccionar</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          PDF, Imágenes, Documentos (máx. 10 MB)
        </p>
      </div>

      {/* Attachments List */}
      {attachments && attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-white text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-[var(--accent-orange)]">attachment</span>
            Documentos Adjuntos ({attachments.length})
          </h4>

          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="material-symbols-outlined text-lg text-blue-400">
                    {getFileIcon(attachment.file_type)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {attachment.file_name}
                      </p>
                      {attachment.is_verified && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
                          <span className="material-symbols-outlined text-xs">check</span>
                          Verificado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                      <span>{formatFileSize(attachment.file_size)}</span>
                      <span>•</span>
                      <span>{formatDate(attachment.uploaded_at)}</span>
                      {attachment.uploaded_by?.email && (
                        <>
                          <span>•</span>
                          <span>{attachment.uploaded_by.email.split('@')[0]}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-2 flex-shrink-0">
                  <a
                    href={attachment.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary btn-small"
                    title="Descargar"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                  </a>
                  <button
                    onClick={() => onDelete(attachment.id, attachment.file_path)}
                    disabled={isLoading}
                    className="btn-danger btn-small"
                    title="Eliminar"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!attachments || attachments.length === 0) && (
        <p className="text-center text-sm text-[var(--text-tertiary)] py-4">
          Sin documentos adjuntos
        </p>
      )}
    </div>
  )
}
