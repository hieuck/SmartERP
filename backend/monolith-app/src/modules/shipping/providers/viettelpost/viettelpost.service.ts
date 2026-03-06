import { Injectable, Logger } from '@nestjs/common';

export interface ViettelPostConfig {
  apiUrl: string;
  username: string;
  password: string;
}

export interface ViettelPostCreateOrderParams {
  orderNumber: string;
  senderFullname: string;
  senderAddress: string;
  senderPhone: string;
  senderEmail?: string;
  senderWard: number;
  senderDistrict: number;
  senderProvince: number;
  receiverFullname: string;
  receiverAddress: string;
  receiverPhone: string;
  receiverEmail?: string;
  receiverWard: number;
  receiverDistrict: number;
  receiverProvince: number;
  productName: string;
  productPrice: number;
  productWeight: number;
  productQuantity: number;
  moneyCollection: number; // COD amount
  serviceType: number; // 1: VCN, 2: VTK
  nationalType: number; // 1: Nội tỉnh, 2: Nội vùng, 3: Liên vùng
  note?: string;
}

@Injectable()
export class ViettelPostService {
  private readonly logger = new Logger(ViettelPostService.name);
  private config: ViettelPostConfig;
  private token: string = '';

  constructor() {
    this.config = {
      apiUrl: process.env.VIETTELPOST_API_URL || 'https://partner.viettelpost.vn/v2',
      username: process.env.VIETTELPOST_USERNAME || '',
      password: process.env.VIETTELPOST_PASSWORD || '',
    };
  }

  /**
   * Login to get access token
   */
  private async login(): Promise<string> {
    try {
      // TODO: Make HTTP POST request to ViettelPost API
      // const response = await axios.post(
      //   `${this.config.apiUrl}/user/Login`,
      //   {
      //     USERNAME: this.config.username,
      //     PASSWORD: this.config.password,
      //   }
      // );
      //
      // this.token = response.data.data.token;
      // return this.token;

      // Mock token for now
      this.token = 'mock-viettelpost-token';
      return this.token;
    } catch (error) {
      this.logger.error(`ViettelPost login failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create shipping order
   */
  async createOrder(params: ViettelPostCreateOrderParams): Promise<{
    orderNumber?: string;
    moneyTotal?: number;
    exchangeWeight?: number;
    error?: string;
  }> {
    try {
      this.logger.log(`Creating ViettelPost order for ${params.receiverFullname}`);

      // Ensure we have token
      if (!this.token) {
        await this.login();
      }

      // TODO: Make HTTP POST request to ViettelPost API
      // const response = await axios.post(
      //   `${this.config.apiUrl}/order/createOrder`,
      //   {
      //     ORDER_NUMBER: params.orderNumber,
      //     SENDER_FULLNAME: params.senderFullname,
      //     SENDER_ADDRESS: params.senderAddress,
      //     SENDER_PHONE: params.senderPhone,
      //     SENDER_EMAIL: params.senderEmail,
      //     SENDER_WARD: params.senderWard,
      //     SENDER_DISTRICT: params.senderDistrict,
      //     SENDER_PROVINCE: params.senderProvince,
      //     RECEIVER_FULLNAME: params.receiverFullname,
      //     RECEIVER_ADDRESS: params.receiverAddress,
      //     RECEIVER_PHONE: params.receiverPhone,
      //     RECEIVER_EMAIL: params.receiverEmail,
      //     RECEIVER_WARD: params.receiverWard,
      //     RECEIVER_DISTRICT: params.receiverDistrict,
      //     RECEIVER_PROVINCE: params.receiverProvince,
      //     PRODUCT_NAME: params.productName,
      //     PRODUCT_PRICE: params.productPrice,
      //     PRODUCT_WEIGHT: params.productWeight,
      //     PRODUCT_QUANTITY: params.productQuantity,
      //     MONEY_COLLECTION: params.moneyCollection,
      //     SERVICE_TYPE: params.serviceType,
      //     NATIONAL_TYPE: params.nationalType,
      //     NOTE: params.note,
      //   },
      //   {
      //     headers: {
      //       'Token': this.token,
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // );
      //
      // const data = response.data.data;
      // return {
      //   orderNumber: data.ORDER_NUMBER,
      //   moneyTotal: data.MONEY_TOTAL,
      //   exchangeWeight: data.EXCHANGE_WEIGHT,
      // };

      // Mock response for now
      return {
        orderNumber: `VTP${Date.now()}`,
        moneyTotal: 28000,
        exchangeWeight: params.productWeight,
      };
    } catch (error) {
      this.logger.error(`ViettelPost create order failed: ${error.message}`);
      return {
        error: error.message,
      };
    }
  }

  /**
   * Calculate shipping fee
   */
  async calculateFee(_params: {
    senderProvince: number;
    senderDistrict: number;
    receiverProvince: number;
    receiverDistrict: number;
    productWeight: number;
    productPrice: number;
    moneyCollection: number;
    serviceType: number;
    nationalType: number;
  }): Promise<{
    moneyTotal?: number;
    moneyTotalFee?: number;
    moneyFee?: number;
    moneyCollection?: number;
    moneyVas?: number;
    error?: string;
  }> {
    try {
      this.logger.log('Calculating ViettelPost shipping fee');

      // Ensure we have token
      if (!this.token) {
        await this.login();
      }

      // TODO: Make HTTP POST request to ViettelPost API
      // const response = await axios.post(
      //   `${this.config.apiUrl}/order/getPriceAll`,
      //   {
      //     SENDER_PROVINCE: params.senderProvince,
      //     SENDER_DISTRICT: params.senderDistrict,
      //     RECEIVER_PROVINCE: params.receiverProvince,
      //     RECEIVER_DISTRICT: params.receiverDistrict,
      //     PRODUCT_WEIGHT: params.productWeight,
      //     PRODUCT_PRICE: params.productPrice,
      //     MONEY_COLLECTION: params.moneyCollection,
      //     TYPE: params.serviceType,
      //     NATIONAL_TYPE: params.nationalType,
      //   },
      //   {
      //     headers: {
      //       'Token': this.token,
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // );
      //
      // const data = response.data.data;
      // return {
      //   moneyTotal: data.MONEY_TOTAL,
      //   moneyTotalFee: data.MONEY_TOTAL_FEE,
      //   moneyFee: data.MONEY_FEE,
      //   moneyCollection: data.MONEY_COLLECTION_FEE,
      //   moneyVas: data.MONEY_VAS,
      // };

      // Mock response for now
      return {
        moneyTotal: 28000,
        moneyTotalFee: 28000,
        moneyFee: 25000,
        moneyCollection: 3000,
        moneyVas: 0,
      };
    } catch (error) {
      this.logger.error(`ViettelPost calculate fee failed: ${error.message}`);
      return {
        error: error.message,
      };
    }
  }

  /**
   * Track shipment
   */
  async trackShipment(orderNumber: string): Promise<{
    status?: number;
    statusText?: string;
    currentLocation?: string;
    history?: Array<{
      time: Date;
      status: number;
      location: string;
    }>;
    error?: string;
  }> {
    try {
      this.logger.log(`Tracking ViettelPost shipment: ${orderNumber}`);

      // Ensure we have token
      if (!this.token) {
        await this.login();
      }

      // TODO: Make HTTP GET request to ViettelPost API
      // const response = await axios.get(
      //   `${this.config.apiUrl}/order/getOrderInfoByCode`,
      //   {
      //     params: {
      //       ORDER_NUMBER: orderNumber,
      //     },
      //     headers: {
      //       'Token': this.token,
      //     },
      //   }
      // );
      //
      // const data = response.data.data;
      // return {
      //   status: data.ORDER_STATUS,
      //   statusText: this.getStatusText(data.ORDER_STATUS),
      //   currentLocation: data.LOCATION_CURRENT,
      //   history: data.LIST_ITEM?.map(item => ({
      //     time: new Date(item.ACTION_TIME),
      //     status: item.STATUS_ID,
      //     location: item.STATUS_NAME,
      //   })) || [],
      // };

      // Mock response for now
      return {
        status: 505,
        statusText: 'Đang giao hàng',
        currentLocation: 'Bưu cục Quận 1, TP.HCM',
        history: [
          {
            time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            status: 100,
            location: 'Đã tiếp nhận',
          },
          {
            time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            status: 300,
            location: 'Đã lấy hàng',
          },
          {
            time: new Date(),
            status: 505,
            location: 'Đang giao hàng',
          },
        ],
      };
    } catch (error) {
      this.logger.error(`ViettelPost track shipment failed: ${error.message}`);
      return {
        error: error.message,
      };
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(
    orderNumber: string,
    _note: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      this.logger.log(`Cancelling ViettelPost order: ${orderNumber}`);

      // Ensure we have token
      if (!this.token) {
        await this.login();
      }

      // TODO: Make HTTP POST request to ViettelPost API
      // const response = await axios.post(
      //   `${this.config.apiUrl}/order/updateOrder`,
      //   {
      //     ORDER_NUMBER: orderNumber,
      //     TYPE: 4, // Cancel order
      //     NOTE: note,
      //   },
      //   {
      //     headers: {
      //       'Token': this.token,
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // );
      //
      // return {
      //   success: response.data.status === 200,
      //   message: response.data.message,
      // };

      // Mock response for now
      return {
        success: true,
        message: 'Order cancelled successfully',
      };
    } catch (error) {
      this.logger.error(`ViettelPost cancel order failed: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get status text in Vietnamese
   */
  private getStatusText(status: number): string {
    const statusMap: Record<number, string> = {
      100: 'Đã tiếp nhận',
      102: 'Đã lấy hàng',
      103: 'Đã nhập kho',
      104: 'Đã xuất kho',
      105: 'Đang luân chuyển',
      200: 'Đã phát hàng',
      201: 'Đã giao hàng',
      202: 'Giao hàng không thành công',
      300: 'Đã lấy hàng',
      301: 'Lấy hàng không thành công',
      400: 'Đã hủy',
      500: 'Đang chuyển hoàn',
      501: 'Đã chuyển hoàn',
      502: 'Đang chuyển hoàn (COD)',
      503: 'Đã chuyển hoàn (COD)',
      504: 'Đang chuyển hoàn (Shipper)',
      505: 'Đang giao hàng',
      506: 'Đã giao hàng (COD)',
      507: 'Đã giao hàng (Shipper)',
      508: 'Đã giao hàng (Đối soát)',
      509: 'Đã giao hàng (Đã đối soát)',
    };
    return statusMap[status] || `Status ${status}`;
  }
}
