import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({ length: 50 })
  provider: string; // 'ghn', 'ghtk', 'viettelpost', 'vnpost', 'dhl', 'fedex'

  @Column({ length: 100, name: 'tracking_number' })
  trackingNumber: string;

  @Column({ length: 50, name: 'provider_order_code', nullable: true })
  providerOrderCode: string; // Provider's internal order code

  @Column({ length: 20 })
  status: string; // 'pending', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled'

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'shipping_fee' })
  shippingFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'insurance_fee' })
  insuranceFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'cod_amount' })
  codAmount: number; // Cash on delivery amount

  @Column({ type: 'jsonb', name: 'sender_info' })
  senderInfo: {
    name: string;
    phone: string;
    address: string;
    ward: string;
    district: string;
    province: string;
  };

  @Column({ type: 'jsonb', name: 'receiver_info' })
  receiverInfo: {
    name: string;
    phone: string;
    address: string;
    ward: string;
    district: string;
    province: string;
  };

  @Column({ type: 'jsonb', name: 'package_info' })
  packageInfo: {
    weight: number; // grams
    length: number; // cm
    width: number; // cm
    height: number; // cm
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
  };

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'jsonb', nullable: true, name: 'provider_response' })
  providerResponse: Record<string, unknown>;

  @Column({ type: 'timestamp', nullable: true, name: 'picked_up_at' })
  pickedUpAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'delivered_at' })
  deliveredAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'expected_delivery_at' })
  expectedDeliveryAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
