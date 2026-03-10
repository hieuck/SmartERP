import api from './api';

// Interfaces
export interface IntegrationConfig {
  name: string;
  type: string;
  enabled: boolean;
  config: Record<string, any>;
}

export interface ProcessPaymentDto {
  gateway: string;
  amount: number;
  orderId: string;
}

export interface CreateShipmentDto {
  provider: string;
  shipmentData: Record<string, unknown>;
}

// Integration Service
const integrationService = {
  async getAll(): Promise<IntegrationConfig[]> {
    const response = await api.get('/integrations');
    return response.data;
  },

  async getByName(name: string): Promise<IntegrationConfig> {
    const response = await api.get(`/integrations/${name}`);
    return response.data;
  },

  async configure(integration: IntegrationConfig): Promise<void> {
    await api.post('/integrations', integration);
  },

  async remove(name: string): Promise<void> {
    await api.delete(`/integrations/${name}`);
  },

  async processPayment(data: ProcessPaymentDto): Promise<any> {
    const response = await api.post('/integrations/payment/process', data);
    return response.data;
  },

  async createShipment(data: CreateShipmentDto): Promise<any> {
    const response = await api.post('/integrations/shipments', data);
    return response.data;
  },
};

export default integrationService;
