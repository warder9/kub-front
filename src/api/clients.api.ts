import api from './index';
import type * as Models from '@/src/models/clients.model';

export async function createClient(payload: Models.CreateClientRequest): Promise<Models.Client> {
  try {
    console.log('Creating client with payload:', payload);
    const res = await api.post('/clients', payload);
    console.log('Client creation response:', res);
    return res.data;
  } catch (error: any) {
    console.error('Client creation failed with detailed error:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      config: {
        url: error?.config?.url,
        method: error?.config?.method,
        data: error?.config?.data,
        headers: error?.config?.headers
      }
    });
    
    // Extract detailed error message from backend if available
    const backendError = error?.response?.data;
    let errorMessage = 'Failed to create client';
    
    if (backendError) {
      if (typeof backendError === 'string') {
        errorMessage = backendError;
      } else if (backendError.message) {
        errorMessage = backendError.message;
      } else if (backendError.error) {
        errorMessage = backendError.error;
      } else if (backendError.detail) {
        errorMessage = backendError.detail;
      } else if (Array.isArray(backendError)) {
        // Handle validation errors array
        errorMessage = backendError.map(err => err.message || err).join(', ');
      }
    }
    
    throw new Error(errorMessage);
  }
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