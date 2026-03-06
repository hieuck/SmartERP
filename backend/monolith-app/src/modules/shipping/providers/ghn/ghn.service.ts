import { Injectable, Logger } from '@nestjs/common';

export interface GHNConfig {
  apiUrl: string;
  token: string;
  shopId: string;
}

export interface GHNCreateOrderParams {
  toName: string;
  toPhone: string;
  toAddress: string;
  toWardCode: string;
  toDistrictId: number;
  codAmount: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  serviceTypeId: number;
  paymentTypeId: number; // 1: Shop/Seller pay, 2: Buyer/Consignee pay
  requiredNote: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  note?: string;
}

@Injectable()
export class GHNService {
  private readonly logger = new Logger(GHNService.name);
  private config: GHNConfig;

  constructor() {
    this.config = {
      apiUrl: process.env.GHN_API_URL || 'https://dev-online-gateway.ghn.vn/shiip/public-api',
      token: process.env.GHN_TOKEN || '',
      shopId: process.env.GHN_SHOP_ID || '',
    };
  }

  /**
   * Create shipping order
   */
  async createOrder(params: GHNCreateOrderParams): Promise<{
    orderCode?: string;
    trackingNumber?: string;
    expectedDeliveryTime?: Date;
    shippingFee?: number;
    error?: string;
  }> {
    try {
      this.logger.log(`Creating GHN order for ${params.toName}`);

      // TODO: Make HTTP POST request to GHN API
      // const response = await axios.post(
      //   `${this.config.apiUrl}/v2/shipping-order/create`,
      //   {
      //     shop_id: parseInt(this.config.shopId),
      //     to_name: params.toName,
      //     to_phone: params.toPhone,
      //     to_address: params.toAddress,
      //     to_ward_code: params.toWardCode,
      //     to_district_id: params.toDistrictId,
      //     cod_amount: params.codAmount,
      //     weight: params.weight,
      //     length: params.length,
      //     width: params.width,
      //     height: params.height,
      //     service_type_id: params.serviceTypeId,
      //     payment_type_id: params.paymentTypeId,
      //     required_note: params.requiredNote,
      //     items: params.items,
      //     note: params.note,
      //   },
      //   {
      //     headers: {
      //       'Token': this.config.token,
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // );
      //
      // const data = response.data.data;
      // return {
      //   orderCode: data.order_code,
      //   trackingNumber: data.order_code,
      //   expectedDeliveryTime: new Date(data.expected_delivery_time),
      //   shippingFee: data.total_fee,
      // };

      // Mock response for now
      return {
        orderCode: `GHN${Date.now()}`,
        trackingNumber: `GHN${Date.now()}`,
        expectedDeliveryTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        shippingFee: 25000,
      };
    } catch (error) {
      this.logger.error(`GHN create order failed: ${error.message}`);
      return {
        error: error.message,
      };
    }
  }

  /**
   * Calculate shipping fee
   */
  async calculateFee(_params: {
    fromDistrictId: number;
    toDistrictId: number;
    toWardCode: string;
    weight: number;
    length: number;
    width: number;
    height: number;
    serviceTypeId: number;
    codAmount?: number;
  }): Promise<{
    total?: number;
    serviceFee?: number;
    insuranceFee?: number;
    error?: string;
  }> {
    try {
      this.logger.log('Calculating GHN shipping fee');

      // TODO: Make HTTP POST request to GHN API
      // const response = await axios.post(
      //   `${this.config.apiUrl}/v2/shipping-order/fee`,
      //   {
      //     shop_id: parseInt(this.config.shopId),
      //     from_district_id: params.fromDistrictId,
      //     to_district_id: params.toDistrictId,
      //     to_ward_code: params.toWardCode,
      //     weight: params.weight,
      //     length: params.length,
      //     width: params.width,
      //     height: params.height,
      //     service_type_id: params.serviceTypeId,
      //     insurance_value: params.codAmount || 0,
      //   },
      //   {
      //     headers: {
      //       'Token': this.config.token,
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // );
      //
      // const data = response.data.data;
      // return {
      //   total: data.total,
      //   serviceFee: data.service_fee,
      //   insuranceFee: data.insurance_fee,
      // };

      // Mock response for now
      return {
        total: 25000,
        serviceFee: 20000,
        insuranceFee: 5000,
      };
    } catch (error) {
      this.logger.error(`GHN calculate fee failed: ${error.message}`);
      return {
        error: error.message,
      };
    }
  }

  /**
   * Track shipment
   */
  async trackShipment(orderCode: string): Promise<{
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
      this.logger.log(`Tracking GHN shipment: ${orderCode}`);

      // TODO: Make HTTP POST request to GHN API
      // const response = await axios.post(
      //   `${this.config.apiUrl}/v2/shipping-order/detail`,
      //   {
      //     order_code: orderCode,
      //   },
      //   {
      //     headers: {
      //       'Token': this.config.token,
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // );
      //
      // const data = response.data.data;
      // return {
      //   status: data.status,
      //   statusText: this.getStatusText(data.status),
      //   currentLocation: data.current_warehouse,
      //   expectedDeliveryTime: new Date(data.expected_delivery_time),
      //   history: data.log.map(log => ({
      //     time: new Date(log.updated_date),
      //     status: log.status,
      //     location: log.location,
      //   })),
      // };

      // Mock response for now
      return {
        status: 'delivering',
        statusText: 'Đang giao hàng',
        currentLocation: 'Bưu cục Quận 1, TP.HCM',
        expectedDeliveryTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        history: [
          {
            time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            status: 'picked',
            location: 'Đã lấy hàng',
          },
          {
            time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            status: 'storing',
            location: 'Hàng đang ở kho',
          },
          {
            time: new Date(),
            status: 'delivering',
            location: 'Đang giao hàng',
          },
        ],
      };
    } catch (error) {
      this.logger.error(`GHN track shipment failed: ${error.message}`);
      return {
        error: error.message,
      };
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderCodes: string[]): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      this.logger.log(`Cancelling GHN orders: ${orderCodes.join(', ')}`);

      // TODO: Make HTTP POST request to GHN API
      // const response = await axios.post(
      //   `${this.config.apiUrl}/v2/switch-status/cancel`,
      //   {
      //     order_codes: orderCodes,
      //   },
      //   {
      //     headers: {
      //       'Token': this.config.token,
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // );
      //
      // return {
      //   success: response.data.code === 200,
      //   message: response.data.message,
      // };

      // Mock response for now
      return {
        success: true,
        message: 'Order cancelled successfully',
      };
    } catch (error) {
      this.logger.error(`GHN cancel order failed: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get available services
   */
  async getAvailableServices(_params: { fromDistrictId: number; toDistrictId: number }): Promise<
    Array<{
      serviceId: number;
      serviceName: string;
    }>
  > {
    try {
      // TODO: Make HTTP GET request to GHN API
      // const response = await axios.get(
      //   `${this.config.apiUrl}/v2/shipping-order/available-services`,
      //   {
      //     params: {
      //       shop_id: this.config.shopId,
      //       from_district: params.fromDistrictId,
      //       to_district: params.toDistrictId,
      //     },
      //     headers: {
      //       'Token': this.config.token,
      //     },
      //   }
      // );
      //
      // return response.data.data.map(service => ({
      //   serviceId: service.service_id,
      //   serviceName: service.short_name,
      // }));

      // Mock response for now
      return [
        { serviceId: 2, serviceName: 'Hàng nặng' },
        { serviceId: 5, serviceName: 'Nhanh' },
      ];
    } catch (error) {
      this.logger.error(`GHN get services failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Get status text in Vietnamese
   */
  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      ready_to_pick: 'Chờ lấy hàng',
      picking: 'Đang lấy hàng',
      cancel: 'Đã hủy',
      money_collect_picking: 'Đang thu tiền người gửi',
      picked: 'Đã lấy hàng',
      storing: 'Hàng đang nằm ở kho',
      transporting: 'Đang luân chuyển hàng',
      sorting: 'Đang phân loại',
      delivering: 'Nhân viên đang giao cho người nhận',
      money_collect_delivering: 'Nhân viên đang thu tiền người nhận',
      delivered: 'Giao hàng thành công',
      delivery_fail: 'Giao hàng thất bại',
      waiting_to_return: 'Đang đợi trả hàng về cho người gửi',
      return: 'Trả hàng',
      return_transporting: 'Đang luân chuyển hàng trả',
      return_sorting: 'Đang phân loại hàng trả',
      returning: 'Nhân viên đang đi trả hàng',
      return_fail: 'Nhân viên trả hàng thất bại',
      returned: 'Nhân viên trả hàng thành công',
      exception: 'Đơn hàng ngoại lệ',
      damage: 'Hàng bị hư hỏng',
      lost: 'Hàng bị mất',
    };
    return statusMap[status] || status;
  }
}
