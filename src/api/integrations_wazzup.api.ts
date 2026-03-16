import { api } from './index';

export interface WazzupSetupRequest {
  webhooks_base_url: string;
  api_key: string;
  enabled: boolean;
}

export interface WazzupSetupResponse {
  webhook_url: string;
  webhook_token: string;
  crm_key: string;
}

export interface WazzupIframeRequest {
  phone?: string;
  lead_id?: number;
  client_id?: number;
}

export interface WazzupIframeResponse {
  iframe_url: string;
  url: string;
}

export interface CRMUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  active: boolean;
}

export interface CRMUsersResponse {
  users: CRMUser[];
}

// Setup Wazzup integration
export const setupWazzup = async (data: WazzupSetupRequest): Promise<WazzupSetupResponse> => {
  const response = await api.post('/integrations/wazzup/setup', data);
  return response.data;
};

// Get Wazzup iframe URL for chat
export const getWazzupIframe = async (data: WazzupIframeRequest): Promise<WazzupIframeResponse> => {
  const response = await api.post('/integrations/wazzup/iframe', data);
  return response.data;
};

// Get CRM users for Wazzup integration (public endpoint)
export const getWazzupCRMUsers = async (token: string): Promise<CRMUsersResponse> => {
  const response = await fetch(`/integrations/wazzup/crm/${token}/users`);
  return response.json();
};

// Get specific CRM user for Wazzup integration (public endpoint)
export const getWazzupCRMUser = async (token: string, userId: string): Promise<CRMUser> => {
  const response = await fetch(`/integrations/wazzup/crm/${token}/users/${userId}`);
  return response.json();
};
