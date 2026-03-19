import integrationService, {
  type CreateShipmentDto,
  type IntegrationConfig,
  type ProcessPaymentDto,
} from './integrationService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiDelete = vi.mocked(api.delete);

describe('integrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets all integrations and a single integration by name', async () => {
    const integrations = [
      { name: 'momo', type: 'payment', enabled: true, config: { mode: 'sandbox' } },
      { name: 'ghn', type: 'shipping', enabled: false, config: {} },
    ];
    const integration = {
      name: 'momo',
      type: 'payment',
      enabled: true,
      config: { mode: 'sandbox' },
    };
    mockApiGet.mockResolvedValueOnce({ data: integrations });
    mockApiGet.mockResolvedValueOnce({ data: integration });

    const listResult = await integrationService.getAll();
    const singleResult = await integrationService.getByName('momo');

    expect(api.get).toHaveBeenNthCalledWith(1, '/integrations');
    expect(api.get).toHaveBeenNthCalledWith(2, '/integrations/momo');
    expect(listResult).toEqual(integrations);
    expect(singleResult).toEqual(integration);
  });

  it('configures and removes an integration', async () => {
    const payload: IntegrationConfig = {
      name: 'momo',
      type: 'payment',
      enabled: true,
      config: { apiKey: 'secret', mode: 'sandbox' },
    };
    mockApiPost.mockResolvedValueOnce({ data: undefined });
    mockApiDelete.mockResolvedValueOnce({ data: undefined });

    await integrationService.configure(payload);
    await integrationService.remove('momo');

    expect(api.post).toHaveBeenCalledWith('/integrations', payload);
    expect(api.delete).toHaveBeenCalledWith('/integrations/momo');
  });

  it('processes payments through the integration endpoint', async () => {
    const payload: ProcessPaymentDto = {
      gateway: 'momo',
      amount: 150000,
      orderId: 'order-1',
    };
    const paymentResult = { transactionId: 'txn-1', status: 'pending', checkoutUrl: 'https://pay' };
    mockApiPost.mockResolvedValueOnce({ data: paymentResult });

    const result = await integrationService.processPayment(payload);

    expect(api.post).toHaveBeenCalledWith('/integrations/payment/process', payload);
    expect(result).toEqual(paymentResult);
  });

  it('creates shipments through the integration endpoint', async () => {
    const payload: CreateShipmentDto = {
      provider: 'ghn',
      shipmentData: {
        orderId: 'order-1',
        recipient: { name: 'Alice', phone: '0900000000' },
      },
    };
    const shipmentResult = { shipmentId: 'ship-1', trackingNumber: 'TRACK123' };
    mockApiPost.mockResolvedValueOnce({ data: shipmentResult });

    const result = await integrationService.createShipment(payload);

    expect(api.post).toHaveBeenCalledWith('/integrations/shipments', payload);
    expect(result).toEqual(shipmentResult);
  });
});
