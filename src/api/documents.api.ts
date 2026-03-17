import api from './index'
import type * as Models from '@/src/models/documents.model'

// ─── List / Get ──────────────────────────────────────────────────

export async function getDocuments(params?: { page?: number; size?: number; search?: string }): Promise<Models.Document[] | { data: Models.Document[]; total: number }> {
  const res = await api.get(`/documents`, { params })
  return res.data
}

export async function getDocumentsByDeal(dealId: number, params?: { page?: number; size?: number; search?: string }): Promise<Models.Document[] | { data: Models.Document[]; total: number }> {
  const res = await api.get(`/documents/deal/${dealId}`, { params })
  return res.data
}

export async function getDocumentById(id: number): Promise<Models.Document> {
  const res = await api.get(`/documents/${id}`)
  return res.data
}

// ─── Create (only stable endpoint) ──────────────────────────────

export async function createDocumentFromClient(payload: Models.Documents_Create_from_client_Request): Promise<Models.Document> {
  const res = await api.post(`/documents/create-from-client`, payload)
  return res.data
}

// ─── Upload (legacy, keep for compat) ───────────────────────────

export async function uploadDocument(payload: Models.Documents_Upload_document_Request): Promise<any> {
  const formData = new FormData();
  formData.append('deal_id', payload.deal_id.toString());
  formData.append('doc_type', payload.doc_type);
  formData.append('file', payload.file);

  const res = await api.post(`/documents/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  return res.data
}

// ─── File operations ─────────────────────────────────────────────

export async function viewDocumentFile(id: number): Promise<Blob> {
  const res = await api.get(`/documents/${id}/file`, { responseType: 'blob' })
  return res.data
}

export async function downloadDocument(id: number, format: string = 'pdf'): Promise<Blob> {
  const res = await api.get(`/documents/${id}/download`, { params: { format }, responseType: 'blob' })
  return res.data
}

// ─── Delete ──────────────────────────────────────────────────────

export async function deleteDocument(id: number): Promise<any> {
  const res = await api.delete(`/documents/${id}`)
  return res.data
}

// ─── Lifecycle / Review ──────────────────────────────────────────

export async function submitDocument(id: number): Promise<any> {
  const res = await api.post(`/documents/${id}/submit`)
  return res.data
}

export async function reviewDocument(id: number, action: 'approve' | 'return'): Promise<any> {
  const res = await api.post(`/documents/${id}/review`, { action })
  return res.data
}

// ─── Signing Workflow ────────────────────────────────────────────

export async function startSign(id: number, email?: string): Promise<any> {
  const body = email ? { email } : undefined
  const res = await api.post(`/documents/${id}/sign/start`, body)
  return res.data
}

export async function confirmSignEmail(id: number, token: string, code: string): Promise<any> {
  const res = await api.post(`/documents/${id}/sign/confirm/email`, { token, code })
  return res.data
}

export async function getSignStatus(id: number): Promise<any> {
  const res = await api.get(`/documents/${id}/sign/status`)
  return res.data
}

export async function finalSign(signSessionId: string, token: string): Promise<any> {
  const res = await api.post(`/api/v1/sign/sessions/id/${signSessionId}/sign`, { token, agree: true })
  return res.data
}

// ─── Client Signing (link-based) ─────────────────────────────────

export async function generateSignLink(id: number): Promise<{ url: string; token: string }> {
  const res = await api.post(`/documents/${id}/generate-sign-link`)
  return res.data
}

// ─── Public endpoints (no auth) ──────────────────────────────────

import axios from 'axios'

/** Force https:// protocol on any URL */
function enforceHttps(url: string): string {
  return url.replace(/^http:\/\//i, 'https://')
}

const publicApiBaseURL = typeof window !== 'undefined'
  ? '/api-proxy'
  : enforceHttps(process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.kubcrm.kz')

const publicApi = axios.create({
  baseURL: publicApiBaseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

export async function getPublicDocument(token: string): Promise<any> {
  const res = await publicApi.get(`/public/documents/${token}`)
  return res.data
}

export async function submitPublicSign(token: string, signatureData: string, email?: string): Promise<any> {
  const res = await publicApi.post(`/public/documents/${token}/sign`, { signature: signatureData, email })
  return res.data
}
