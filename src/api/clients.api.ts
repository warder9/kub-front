import api from './index';
import type * as Models from '@/src/models/clients.model';

export async function createClient(payload: Models.CreateClientRequest): Promise<Models.Client> {
  const res = await api.post('/clients', payload);
  return res.data;
}

export async function listClients(params?: { page?: number; limit?: number; search?: string }): Promise<Models.Client[] | { data: Models.Client[]; total: number }> {
  const res = await api.get('/clients', { params });
  return res.data;
}

export async function listMyClients(params?: { page?: number; limit?: number; search?: string }): Promise<Models.Client[] | { data: Models.Client[]; total: number }> {
  const res = await api.get('/clients/my', { params });
  return res.data;
}

export async function getClientById(id: string): Promise<Models.Client> {
  const res = await api.get(`/clients/${id}`);
  return res.data;
}

export async function updateClient(id: string, payload: Models.UpdateClientRequest): Promise<Models.Client> {
  const res = await api.put(`/clients/${id}`, payload);
  return res.data;
}

export async function deleteClient(id: string): Promise<void> {
  const res = await api.delete(`/clients/${id}`);
  return res.data;
}