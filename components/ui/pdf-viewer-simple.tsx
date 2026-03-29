"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { downloadDocument } from "@/src/api/documents.api"

interface PdfViewerProps {
  isOpen: boolean
  onClose: () => void
  documentId: number
  documentName?: string
}

export function PdfViewer({ isOpen, onClose, documentId, documentName }: PdfViewerProps) {
  const [loading, setLoading] = useState(true)
  const [pdfUrl, setPdfUrl] = useState<string>("")
  const [error, setError] = useState<string>("")
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Reset state when document changes
  useEffect(() => {
    if (isOpen && documentId) {
      setLoading(true)
      setError("")
      setPdfUrl("")
      loadPdfDocument()
    }
  }, [isOpen, documentId])

  const loadPdfDocument = async () => {
    try {
      console.log('Loading PDF document:', documentId)
      
      // Get auth token from localStorage or cookie
      let token = ''
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('auth_token') || 
                document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1] || ''
      }
      
      // Use our new view endpoint that handles DOCX to PDF conversion
      const response = await fetch(`/api/documents/${documentId}/view?t=${Date.now()}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Cache-Control': 'no-cache',
        }
      })
      
      console.log('API response status:', response.status)
      console.log('API response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', errorText)
        throw new Error(`Failed to load PDF document: ${response.status} ${errorText}`)
      }
      
      const blob = await response.blob()
      const contentType = response.headers.get('content-type') || blob.type
      const conversionError = response.headers.get('x-conversion-error')
      
      console.log('Got blob:', contentType, blob.size)
      console.log('Conversion error header:', conversionError)
      
      // Check if conversion failed
      if (conversionError) {
        console.log('DOCX to PDF conversion failed')
        setError(`Не удалось преобразовать DOCX в PDF: ${conversionError}. Попробуйте скачать файл.`)
        setLoading(false)
        return
      }
      
      // Check if it's actually a PDF
      if (contentType && !contentType.includes('pdf')) {
        console.log('File is not a PDF, it\'s:', contentType)
        
        // If we get JSON, it means there was an error
        if (contentType.includes('json')) {
          const text = await blob.text()
          console.log('JSON response:', text)
          setError(`Ошибка сервера: ${text}`)
        } else {
          setError(`Файл не является PDF: ${contentType}. Попробуйте скачать файл.`)
        }
        setLoading(false)
        return
      }
      
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
      setLoading(false)
      
    } catch (error) {
      console.error('Error loading PDF:', error)
      setError(error instanceof Error ? error.message : 'Failed to load PDF')
      toast.error('Ошибка при загрузке PDF документа')
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      const blob = await downloadDocument(documentId, "pdf")
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = documentName || `document-${documentId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      
      toast.success('Документ скачан')
    } catch (error) {
      console.error('Error downloading document:', error)
      toast.error('Ошибка при скачивании документа')
    }
  }

  const handleOpenInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank')
    }
  }

  // Cleanup URL when component unmounts or closes
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold truncate">
              {documentName || `Документ #${documentId}`}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                disabled={!pdfUrl}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col h-[calc(90vh-8rem)]">
          {/* PDF Content */}
          <div className="flex-1 overflow-auto bg-gray-50 p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Загрузка PDF документа...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <p className="text-red-700 font-medium mb-2">Ошибка загрузки PDF</p>
                    <p className="text-red-600 text-sm mb-4">{error}</p>
                    <Button onClick={loadPdfDocument} variant="outline" size="sm">
                      Попробовать снова
                    </Button>
                  </div>
                </div>
              </div>
            ) : pdfUrl ? (
              <iframe
                ref={iframeRef}
                src={pdfUrl}
                className="w-full h-full border border-gray-300 rounded-lg bg-white"
                title="PDF Document Viewer"
              />
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
