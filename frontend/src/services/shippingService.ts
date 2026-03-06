import api from './api';

export interface Shipment {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  status: 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  shippingFee: number;
  estimatedDelivery?: string;
  actualDelivery?: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  notes?: string;
  history: ShipmentHistory[];
  createdAt: string;
}

export interface ShipmentHistory {
  status: string;
  location: string;
  timestamp: string;
  description: string;
}

const shippingService = {
  getShipments: async (params?: any): Promise<{ data: Shipment[]; total: number }> => {
    const response = await api.get('/shipments', { params });
    return { data: response.data.data, total: response.data.meta.total };
  },

  getShipment: async (id: string): Promise<Shipment> => {
    const response = await api.get(`/shipments/${id}`);
    return response.data.data;
  },

  trackShipment: async (trackingNumber: string): Promise<Shipment> => {
    const response = await api.get(`/shipments/track/${trackingNumber}`);
    return response.data.data;
  },

  createShipment: async (data: Partial<Shipment>): Promise<Shipment> => {
    const response = await api.post('/shipments', data);
    return response.data.data;
  },

  updateShipmentStatus: async (id: string, status: string): Promise<Shipment> => {
    const response = await api.patch(`/shipments/${id}/status`, { status });
    return response.data.data;
  },
};

export default shippingService;
