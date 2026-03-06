export class CreateShipmentDto {
  orderId: string;
  provider: 'ghn' | 'ghtk' | 'viettelpost' | 'vnpost';

  senderInfo: {
    name: string;
    phone: string;
    address: string;
    ward: string;
    district: string;
    province: string;
  };

  receiverInfo: {
    name: string;
    phone: string;
    address: string;
    ward: string;
    district: string;
    province: string;
  };

  packageInfo: {
    weight: number; // grams
    length?: number; // cm
    width?: number; // cm
    height?: number; // cm
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
  };

  codAmount?: number; // Cash on delivery
  note?: string;
  requiredNote?: string; // 'CHOTHUHANG', 'CHOXEMHANGKHONGTHU', 'KHONGCHOXEMHANG'
  serviceType?: string; // Service type code from provider
}

export class CalculateShippingFeeDto {
  provider: 'ghn' | 'ghtk' | 'viettelpost' | 'vnpost';
  fromDistrict: string;
  fromProvince: string;
  toDistrict: string;
  toProvince: string;
  weight: number; // grams
  length?: number;
  width?: number;
  height?: number;
  codAmount?: number;
  serviceType?: string;
}

export class TrackShipmentDto {
  trackingNumber: string;
  provider: string;
}

export class CancelShipmentDto {
  shipmentId: string;
  reason?: string;
}
