import api from './index'
import type * as Models from '@/src/models/reports.model'

export async function funnel(payload?: void, params?: Record<string, any>): Promise<any> {
  const res = await api.get(`/reports/funnel`, { params })
  return res.data
}

export async function leads_summary(payload?: void, params?: Record<string, any>): Promise<any> {
  const res = await api.get(`/reports/leads`, { params })
  return res.data
}

export async function revenue(payload?: void, params?: Record<string, any>): Promise<any> {
  const res = await api.get(`/reports/revenue`, { params })
  return res.data
}

export async function revenue_export(payload?: void, params?: Record<string, any>): Promise<any> {
  const res = await api.get(`/reports/revenue/export`, { params })
  return res.data
}

export async function revenue_export_file(payload?: void, params?: Record<string, any>): Promise<Blob> {
  const res = await api.get(`/reports/revenue/export`, { params, responseType: 'blob' as const })
  return res.data
}
