import { Injectable, Logger } from '@nestjs/common';

export interface GHTKConfig {
  apiUrl: string;
  token: string;
}

export interface GHTKCreateOrderParams {
  pickName: string;
  pickAddress: string;
  pickProvince: string;
  pickDistrict: string;
  pickWard: string;
  pickTel: string;
  name: string;
  address: string;
  province: string;
  district: string;
  ward: string;
  tel: string;
  email?: string;
  value: number;
  weight: number;
  pickMoney?: number; // COD amount
  note?: string;
  products: Array<{
    name: string;
    weight: number;
    quantity: number;
    product_code?: string;
  }>;
}

@Injectable()
export class GHTKService {
  private readonly logger = new Logger(GHTKService.name);
  private config: GHTKConfig;

  constructor() {
    this.config = {
      apiUrl: process.env.GHTK_API_URL || 'https://services.giaohangtietkiem.vn/services',
      token: process.env.GHTK_TOKEN || '',
    };
  }

  /**
   * Create shipping order
   */
  async createOrder(params: GHTKCreateOrderParams): Promise<{
    labelId?: string;
    trackingNumber?: string;
    estimatedDeliveryTime?: Date;
    shippingFee?: number;
    error?: string;
  }> {
    try {
      this.logger.log(`Creating GHTK order for ${params.name}`);

      // TODO: Make HTTP POST request to GHTK API
      // const response = await axios.post(
      //   `${this.config.apiUrl}/shipment/order`,
      //   {
      //     products: params.products,
      //     order: {
      //       id: `ORDER-${Date.now()}`,
      //       pick_name: params.pickName,
      //       pick_address: params.pickAddress,
      //       pick_province: params.pickProvince,
      //       pick_district: params.pickDistrict,
      //       pick_ward: params.pickWard,
      //       pick_tel: params.pickTel,
      //       name: params.name,
      //       address: params.address,
      //       province: params.province,
      //       district: params.district,
      //       ward: params.ward,
      //       tel: params.tel,
      //       email: params.email,
      //       value: params.value,
      //       weight: params.weight,
      //       pick_money: params.pickMoney || 0,
      //       note: params.note,
      //       transport: 'road', // road or fly
      //     },
      //   },
      //   {
      //     headers: {
      //       'Token': this.config.token,
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // );
      //
      // const data = response.data.order;
      // return {
      //   labelId: data.label_id,
      //   trackingNumber: data.label_id,
      //   estimatedDeliveryTime: new Date(data.estimated_deliver_time),
      //   shippingFee: data.fee,
      // };

      // Mock response for now
      return {
        labelId: `GHTK${Date.now()}`,
        trackingNumber: `GHTK${Date.now()}`,
        estimatedDeliveryTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        shippingFee: 22000,
      };
    } catch (error) {
      this.logger.error(`GHTK create order failed: ${error.message}`);
      return {
        error: error.message,
      };
    }
  }

  /**
   * Calculate shipping fee
   */
  async calculateFee(_params: {
    pickProvince: string;
    pickDistrict: string;
    province: string;
    district: string;
    weight: number;
    value: number;
    transport?: string;
  }): Promise<{
    fee?: number;
    insuranceFee?: number;
    error?: string;
  }> {
    try {
      this.logger.log('Calculating GHTK shipping fee');

      // TODO: Make HTTP GET request to GHTK API
      // const response = await axios.get(
      //   `${this.config.apiUrl}/shipment/fee`,
      //   {
      //     params: {
      //       pick_province: params.pickProvince,
      //       pick_district: params.pickDistrict,
      //       province: params.province,
      //       district: params.district,
      //       weight: params.weight,
      //       value: params.value,
      //       transport: params.transport || 'road',
      //     },
      //     headers: {
      //       'Token': this.config.token,
      //     },
      //   }
      // );
      //
      // const data = response.data.fee;
      // return {
      //   fee: data.fee,
      //   insuranceFee: data.insurance_fee,
      // };

      // Mock response for now
      return {
        fee: 22000,
        insuranceFee: 3000,
      };
    } catch (error) {
      this.logger.error(`GHTK calculate fee failed: ${error.message}`);
      return {
        error: error.message,
      };
    }
  }

  /**
   * Track shipment
   */
  async trackShipment(labelId: string): Promise<{
    status?: string;
    statusText?: string;
    currentLocation?: string;
    estimatedDeliveryTime?: Date;
    history?: Array<{
      time: Date;
      status: string;
      location: string;
    }>;
    error?: string;
  }> {
    try {
      this.logger.log(`Tracking GHTK shipment: ${labelId}`);

      // TODO: Make HTTP GET request to GHTK API
      // const response = await axios.get(
      //   `${this.config.apiUrl}/shipment/v2/${labelId}`,
      //   {
      //     headers: {
      //       'Token': this.config.token,
      //     },
      //   }
      // );
      //
      // const data = response.data.order;
      // return {
      //   status: data.status,
      //   statusText: this.getStatusText(data.status),
      //   currentLocation: data.current_warehouse,
      //   estimatedDeliveryTime: new Date(data.estimated_deliver_time),
      //   history: data.status_text ? [{
      //     time: new Date(data.updated_date),
      //     status: data.status,
      //     location: data.status_text,
      //   }] : [],
      // };

      // Mock response for now
      return {
        status: '5',
        statusText: 'Đang giao hàng',
        currentLocation: 'Bưu cục Quận 1, TP.HCM',
        estimatedDeliveryTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        history: [
          {
            time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            status: '2',
            location: 'Đã lấy hàng',
          },
          {
            time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            status: '3',
            location: 'Đã nhập kho',
          },
          {
            time: new Date(),
            status: '5',
            location: 'Đang giao hàng',
          },
        ],
      };
    } catch (error) {
      this.logger.error(`GHTK track shipment failed: ${error.message}`);
      return {
        error: error.message,
      };
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(labelId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      this.logger.log(`Cancelling GHTK order: ${labelId}`);

      // TODO: Make HTTP POST request to GHTK API
      // const response = await axios.post(
      //   `${this.config.apiUrl}/shipment/cancel/${labelId}`,
      //   {},
      //   {
      //     headers: {
      //       'Token': this.config.token,
      //     },
      //   }
      // );
      //
      // return {
      //   success: response.data.success,
      //   message: response.data.message,
      // };

      // Mock response for now
      return {
        success: true,
        message: 'Order cancelled successfully',
      };
    } catch (error) {
      this.logger.error(`GHTK cancel order failed: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get status text in Vietnamese
   */
  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      '-1': 'Hủy đơn hàng',
      '1': 'Chưa tiếp nhận',
      '2': 'Đã tiếp nhận',
      '3': 'Đã lấy hàng/Đã nhập kho',
      '4': 'Đã điều phối giao hàng/Đang giao hàng',
      '5': 'Đã giao hàng/Chưa đối soát',
      '6': 'Đã đối soát',
      '7': 'Không lấy được hàng',
      '8': 'Hoãn lấy hàng',
      '9': 'Không giao được hàng',
      '10': 'Delay giao hàng',
      '11': 'Đã đối soát công nợ trả hàng',
      '12': 'Đã điều phối lấy hàng/Đang lấy hàng',
      '13': 'Đơn hàng bồi hoàn',
      '20': 'Đang trả hàng (COD cầm hàng đi trả)',
      '21': 'Đã trả hàng (COD đã trả xong hàng)',
      '123': 'Shipper báo đã lấy hàng',
      '127': 'Shipper (nhân viên lấy/giao hàng) báo không lấy được hàng',
      '128': 'Shipper báo delay lấy hàng',
      '45': 'Shipper báo đã giao hàng',
      '49': 'Shipper báo không giao được giao hàng',
      '410': 'Shipper báo delay giao hàng',
    };
    return statusMap[status] || status;
  }
}
