import React, { useState, useCallback } from 'react'
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { supabase } from '@/integrations/supabase/client'

interface CSVUploaderProps {
  supplierId?: string
  onUploadComplete?: (jobId: string) => void
}

interface UploadedFile {
  file: File
  preview: {
    headers: string[]
    rows: string[][]
  } | null
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error'
  error?: string
  jobId?: string
}

export const CSVUploader: React.FC<CSVUploaderProps> = ({
  supplierId,
  onUploadComplete,
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const parseCSVPreview = async (file: File): Promise<{ headers: string[]; rows: string[][] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n').filter((line) => line.trim())

          if (lines.length === 0) {
            reject(new Error('Fichier CSV vide'))
            return
          }

          const headers = lines[0].split(/[,;]/).map((h) => h.trim())
          const rows = lines.slice(1, 6).map((line) =>
            line.split(/[,;]/).map((cell) => cell.trim())
          )

          resolve({ headers, rows })
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'))
      reader.readAsText(file)
    })
  }

  const handleFiles = useCallback(async (fileList: FileList) => {
    const csvFiles = Array.from(fileList).filter(
      (file) => file.type === 'text/csv' || file.name.endsWith('.csv')
    )

    if (csvFiles.length === 0) {
      alert('Veuillez sélectionner uniquement des fichiers CSV')
      return
    }

    const newFiles: UploadedFile[] = []

    for (const file of csvFiles) {
      try {
        const preview = await parseCSVPreview(file)
        newFiles.push({
          file,
          preview,
          status: 'pending',
        })
      } catch (error) {
        newFiles.push({
          file,
          preview: null,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erreur de lecture',
        })
      }
    }

    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files)
      }
    },
    [handleFiles]
  )

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFile = async (index: number) => {
    const fileData = files[index]
    if (!fileData || fileData.status !== 'pending') return

    try {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: 'uploading' as const } : f))
      )

      const fileName = `${Date.now()}-${fileData.file.name}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('supplier-imports')
        .upload(fileName, fileData.file)

      if (uploadError) throw uploadError

      // Create import job
      const { data: job, error: jobError } = await supabase
        .from('import_jobs')
        .insert({
          supplier_id: supplierId,
          file_name: fileName,
          file_size: fileData.file.size,
          status: 'pending',
          import_type: 'csv',
        })
        .select()
        .single()

      if (jobError) throw jobError

      // Invoke Edge Function to process CSV
      const { data: processData, error: processError } = await supabase.functions.invoke(
        'supplier-import-csv',
        {
          body: {
            jobId: job.id,
            fileName: fileName,
            supplierId,
          },
        }
      )

      if (processError) throw processError

      // Update status to success
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? { ...f, status: 'success' as const, jobId: job.id }
            : f
        )
      )

      onUploadComplete?.(job.id)
    } catch (error) {
      console.error('Upload error:', error)
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: 'error' as const,
                error: error instanceof Error ? error.message : 'Erreur d\'upload',
              }
            : f
        )
      )
    }
  }

  const uploadAll = async () => {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'pending') {
        await uploadFile(i)
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card
        className={`p-8 border-2 border-dashed transition-colors cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('csv-file-input')?.click()}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Glissez-déposez vos fichiers CSV ici
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            ou cliquez pour sélectionner des fichiers
          </p>
          <input
            id="csv-file-input"
            type="file"
            accept=".csv,text/csv"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
          <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
            Sélectionner des fichiers
          </Button>
        </div>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">
              Fichiers sélectionnés ({files.length})
            </h4>
            <Button
              onClick={uploadAll}
              disabled={!files.some((f) => f.status === 'pending')}
            >
              Tout importer
            </Button>
          </div>

          {files.map((fileData, index) => (
            <Card key={index} className="p-4">
              <div className="space-y-3">
                {/* File Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <FileSpreadsheet className="w-8 h-8 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium truncate">
                        {fileData.file.name}
                      </h5>
                      <p className="text-sm text-gray-500">
                        {(fileData.file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {fileData.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {fileData.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    {fileData.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => uploadFile(index)}
                        disabled={fileData.preview === null}
                      >
                        Importer
                      </Button>
                    )}
                    {fileData.status === 'uploading' && (
                      <span className="text-sm text-blue-600">Upload en cours...</span>
                    )}
                    {fileData.status === 'processing' && (
                      <span className="text-sm text-blue-600">Traitement...</span>
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-gray-100 rounded"
                      disabled={fileData.status === 'uploading' || fileData.status === 'processing'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Preview */}
                {fileData.preview && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          {fileData.preview.headers.map((header, i) => (
                            <th
                              key={i}
                              className="px-3 py-2 text-left font-medium text-gray-700 border-b"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fileData.preview.rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-b">
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="px-3 py-2 text-gray-600 max-w-xs truncate"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-gray-500 mt-2">
                      Aperçu des 5 premières lignes
                    </p>
                  </div>
                )}

                {/* Error */}
                {fileData.error && (
                  <Alert variant="error">
                    <AlertCircle className="w-4 h-4" />
                    <span>{fileData.error}</span>
                  </Alert>
                )}

                {/* Success */}
                {fileData.status === 'success' && (
                  <Alert variant="success">
                    <CheckCircle className="w-4 h-4" />
                    <span>Fichier importé avec succès (Job ID: {fileData.jobId})</span>
                  </Alert>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Instructions */}
      {files.length === 0 && (
        <Alert variant="info">
          <AlertCircle className="w-4 h-4" />
          <div className="flex-1">
            <p className="font-medium mb-1">Format CSV attendu :</p>
            <ul className="text-sm space-y-1 ml-4 list-disc">
              <li>Colonnes séparées par virgule ou point-virgule</li>
              <li>Première ligne = en-têtes (EAN, Nom, Prix, etc.)</li>
              <li>Encodage UTF-8 recommandé</li>
            </ul>
          </div>
        </Alert>
      )}
    </div>
  )
}
