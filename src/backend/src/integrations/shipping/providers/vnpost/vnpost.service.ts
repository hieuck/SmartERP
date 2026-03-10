import { Injectable, Logger } from '@nestjs/common';

export interface VNPostConfig {
  apiUrl: string;
  username: string;
  password: string;
  customerId: string;
}

export interface VNPostCreateOrderParams {
  toName: string;
  toPhone: string;
  toAddress: string;
  toProvince: string;
  toDistrict: string;
  toWard: string;
  codAmount: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  serviceCode: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  note?: string;
}

@Injectable()
export class VNPostService {
  private readonly logger = new Logger(VNPostService.name);
  private config: VNPostConfig;

  constructor() {
    this.config = {
      apiUrl: process.env.VNPOST_API_URL || 'https://donhang.vnpost.vn/api',
      username: process.env.VNPOST_USERNAME || '',
      password: process.env.VNPOST_PASSWORD || '',
      customerId: process.env.VNPOST_CUSTOMER_ID || '',
    };
  }

  /**
   * Create shipping order
   */
  async createOrder(params: VNPostCreateOrderParams): Promise<{
    orderCode?: string;
    trackingNumber?: string;
    expectedDeliveryTime?: Date;
    shippingFee?: number;
    error?: string;
  }> {
    try {
      this.logger.log(`Creating VNPost order for ${params.toName}`);

      // TODO: Make HTTP POST request to VNPost API
      // const response = await axios.post(
      //   `${this.config.apiUrl}/order/create`,
      //   {
      //     CustomerId: this.config.customerId,
      //     ReceiverName: params.toName,
      //     ReceiverPhone: params.toPhone,
      //     ReceiverAddress: params.toAddress,
      //     ReceiverProvince: params.toProvince,
      //     ReceiverDistrict: params.toDistrict,
      //     ReceiverWard: params.toWard,
      //     CODAmount: params.codAmount,
      //     Weight: params.weight,
      //     Length: params.length,
      //     Width: params.width,
      //     Height: params.height,
      //     ServiceCode: params.serviceCode,
      //     Items: params.items.map(item => ({
      //       Name: item.name,
      //       Quantity: item.quantity,
      //       Price: item.price,
      //     })),
      //     Note: params.note,
      //   },
      //   {
      //     auth: {
      //       username: this.config.username,
      //       password: this.config.password,
      //     },
      //   }
      // );
      //
      // const data = response.data;
      // return {
      //   orderCode: data.OrderCode,
      //   trackingNumber: data.TrackingNumber,
      //   expectedDeliveryTime: new Date(data.ExpectedDeliveryTime),
      //   shippingFee: data.ShippingFee,
      // };

      // Mock response for now
      return {
        orderCode: `VNP${Date.now()}`,
        trackingNumber: `VNP${Date.now()}`,
        expectedDeliveryTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
        shippingFee: 22000,
      };
    } catch (error) {
      this.logger.error(`VNPost create order failed: ${error.message}`);
      return {
        error: error.message,
      };
    }
  }

  /**
   * Calculate shipping fee
   */
  async calculateFee(_params: {
    fromProvince: string;
    toProvince: string;
    weight: number;
    length: number;
    width: number;
    height: number;
    serviceCode: string;
    codAmount?: number;
  }): Promise<{
    total?: number;
    serviceFee?: number;
    insuranceFee?: number;
    error?: string;
  }> {
    try {
      this.logger.log('Calculating VNPost shipping fee');

      // TODO: Make HTTP POST request to VNPost API
      // const response = await axios.post(
      //   `${this.config.apiUrl}/order/calculate-fee`,
      //   {
      //     FromProvince: params.fromProvince,
      //     ToProvince: params.toProvince,
      //     Weight: params.weight,
      //     Length: params.length,
      //     Width: params.width,
      //     Height: params.height,
      //     ServiceCode: params.serviceCode,
      //     CODAmount: params.codAmount || 0,
      //   },
      //   {
      //     auth: {
      //       username: this.config.username,
      //       password: this.config.password,
      //     },
      //   }
      // );
      //
      // const data = response.data;
      // return {
      //   total: data.TotalFee,
      //   serviceFee: data.ServiceFee,
      //   insuranceFee: data.InsuranceFee,
      // };

      // Mock response for now
      return {
        total: 22000,
        serviceFee: 18000,
        insuranceFee: 4000,
      };
    } catch (error) {
      this.logger.error(`VNPost calculate fee failed: ${error.message}`);
      return {
        error: error.message,
      };
    }
  }

  /**
   * Track shipment
   */
  async trackShipment(trackingNumber: string): Promise<{
    status?: string;
    statusText?: string;
    currentLocation?: string;
    expectedDeliveryTime?: Date;
    history?: Array<{
      time: Date;
      status: string;
      location: string;
    }>;
    error?: string;
  }> {
    try {
      this.logger.log(`Tracking VNPost shipment: ${trackingNumber}`);

      // TODO: Make HTTP GET request to VNPost API
      // const response = await axios.get(
      //   `${this.config.apiUrl}/order/track`,
      //   {
      //     params: {
      //       TrackingNumber: trackingNumber,
      //     },
      //     auth: {
      //       username: this.config.username,
      //       password: this.config.password,
      //     },
      //   }
      // );
      //
      // const data = response.data;
      // return {
      //   status: data.Status,
      //   statusText: this.getStatusText(data.Status),
      //   currentLocation: data.CurrentLocation,
      //   expectedDeliveryTime: new Date(data.ExpectedDeliveryTime),
      //   history: data.History.map(log => ({
      //     time: new Date(log.Time),
      //     status: log.Status,
      //     location: log.Location,
      //   })),
      // };

      // Mock response for now
      return {
        status: 'in_transit',
        statusText: 'Đang vận chuyển',
        currentLocation: 'Bưu cục Quận 3, TP.HCM',
        expectedDeliveryTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        history: [
          {
            time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            status: 'picked_up',
            location: 'Đã nhận hàng',
          },
          {
            time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            status: 'sorting',
            location: 'Đang phân loại',
          },
          {
            time: new Date(),
            status: 'in_transit',
            location: 'Đang vận chuyển',
          },
        ],
      };
    } catch (error) {
      this.logger.error(`VNPost track shipment failed: ${error.message}`);
      return {
        error: error.message,
      };
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderCode: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      this.logger.log(`Cancelling VNPost order: ${orderCode}`);

      // TODO: Make HTTP POST request to VNPost API
      // const response = await axios.post(
      //   `${this.config.apiUrl}/order/cancel`,
      //   {
      //     OrderCode: orderCode,
      //   },
      //   {
      //     auth: {
      //       username: this.config.username,
      //       password: this.config.password,
      //     },
      //   }
      // );
      //
      // return {
      //   success: response.data.Success,
      //   message: response.data.Message,
      // };

      // Mock response for now
      return {
        success: true,
        message: 'Đơn hàng đã được hủy thành công',
      };
    } catch (error) {
      this.logger.error(`VNPost cancel order failed: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get available services
   */
  async getAvailableServices(): Promise<
    Array<{
      serviceCode: string;
      serviceName: string;
      description: string;
    }>
  > {
    try {
      // TODO: Make HTTP GET request to VNPost API
      // const response = await axios.get(
      //   `${this.config.apiUrl}/service/list`,
      //   {
      //     auth: {
      //       username: this.config.username,
      //       password: this.config.password,
      //     },
      //   }
      // );
      //
      // return response.data.map(service => ({
      //   serviceCode: service.Code,
      //   serviceName: service.Name,
      //   description: service.Description,
      // }));

      // Mock response for now
      return [
        {
          serviceCode: 'EMS',
          serviceName: 'Chuyển phát nhanh EMS',
          description: 'Dịch vụ chuyển phát nhanh trong nước',
        },
        {
          serviceCode: 'BK',
          serviceName: 'Bưu kiện',
          description: 'Dịch vụ chuyển phát bưu kiện tiêu chuẩn',
        },
      ];
    } catch (error) {
      this.logger.error(`VNPost get services failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Get status text in Vietnamese
   */
  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'Chờ xử lý',
      picked_up: 'Đã nhận hàng',
      sorting: 'Đang phân loại',
      in_transit: 'Đang vận chuyển',
      out_for_delivery: 'Đang giao hàng',
      delivered: 'Đã giao hàng',
      failed: 'Giao hàng thất bại',
      returned: 'Đã trả hàng',
      cancelled: 'Đã hủy',
    };
    return statusMap[status] || status;
  }
}
