import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CalculateShippingFeeDto,
  CancelShipmentDto,
  CreateShipmentDto,
  TrackShipmentDto,
} from './dto/create-shipment.dto';
import { Shipment } from './entities/shipment.entity';
import { GHNService } from './providers/ghn/ghn.service';
import { GHTKService } from './providers/ghtk/ghtk.service';
import { ViettelPostService } from './providers/viettelpost/viettelpost.service';
import { VNPostService } from './providers/vnpost/vnpost.service';

type ShipmentProviderResult = {
  error?: string;
  trackingNumber?: string;
  orderCode?: string;
  labelId?: string;
  shippingFee?: number;
  expectedDeliveryTime?: Date;
  estimatedDeliveryTime?: Date;
  moneyTotal?: number;
  status?: string | number;
  success?: boolean;
  message?: string;
  total?: number;
  serviceFee?: number;
  insuranceFee?: number;
  fee?: number;
  moneyFee?: number;
  moneyVas?: number;
};

type ShipmentFilters = {
  orderId?: string;
  provider?: string;
  status?: string;
  limit?: number;
  offset?: number;
};

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);
  private secureShipmentRepo: SecureRepository<Shipment>;

  constructor(
    @InjectRepository(Shipment)
    private shipmentRepo: Repository<Shipment>,
    private ghnService: GHNService,
    private ghtkService: GHTKService,
    private viettelPostService: ViettelPostService,
    private vnPostService: VNPostService,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    // Initialize SecureRepository for multi-tenant security
    this.secureShipmentRepo = new SecureRepository(shipmentRepo, permissionService, 'Shipment');
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  /**
   * Create shipment
   */
  async createShipment(user: User, dto: CreateShipmentDto): Promise<Shipment> {
    // Create shipment record with SecureRepository (auto tenant isolation)
    const shipment: Partial<Shipment> = {
      orderId: dto.orderId,
      provider: dto.provider,
      status: 'pending',
      senderInfo: dto.senderInfo,
      receiverInfo: dto.receiverInfo,
      packageInfo: {
        ...dto.packageInfo,
        length: dto.packageInfo.length || 10,
        width: dto.packageInfo.width || 10,
        height: dto.packageInfo.height || 10,
      },
      codAmount: dto.codAmount || 0,
      note: dto.note,
    };

    try {
      // Create shipment with provider
      let result: ShipmentProviderResult;

      switch (dto.provider) {
        case 'ghn':
          result = await this.ghnService.createOrder({
            toName: dto.receiverInfo.name,
            toPhone: dto.receiverInfo.phone,
            toAddress: dto.receiverInfo.address,
            toWardCode: dto.receiverInfo.ward,
            toDistrictId: parseInt(dto.receiverInfo.district),
            codAmount: dto.codAmount || 0,
            weight: dto.packageInfo.weight,
            length: dto.packageInfo.length || 10,
            width: dto.packageInfo.width || 10,
            height: dto.packageInfo.height || 10,
            serviceTypeId: parseInt(dto.serviceType || '2'),
            paymentTypeId: 1, // Shop pays
            requiredNote: dto.requiredNote || 'KHONGCHOXEMHANG',
            items: dto.packageInfo.items,
            note: dto.note,
          });

          if (result.error) {
            throw new Error(result.error);
          }

          shipment.trackingNumber = result.trackingNumber;
          shipment.providerOrderCode = result.orderCode;
          shipment.shippingFee = result.shippingFee;
          shipment.expectedDeliveryAt = result.expectedDeliveryTime;
          shipment.status = 'picked_up';
          break;

        case 'ghtk': {
          result = await this.ghtkService.createOrder({
            pickAddress: dto.senderInfo.address,
            pickProvince: dto.senderInfo.province,
            pickDistrict: dto.senderInfo.district,
            pickWard: dto.senderInfo.ward,
            pickName: dto.senderInfo.name,
            pickTel: dto.senderInfo.phone,
            name: dto.receiverInfo.name,
            tel: dto.receiverInfo.phone,
            address: dto.receiverInfo.address,
            province: dto.receiverInfo.province,
            district: dto.receiverInfo.district,
            ward: dto.receiverInfo.ward,
            value: dto.codAmount || 0,
            weight: dto.packageInfo.weight,
            products: dto.packageInfo.items.map(
              (item: {
                name: string;
                weight?: number;
                quantity: number;
                product_code?: string;
              }) => ({
                name: item.name,
                weight: item.weight || 100,
                quantity: item.quantity,
                product_code: item.product_code || '',
              }),
            ),
            note: dto.note,
          });

          if (result.error) {
            throw new Error(result.error);
          }

          shipment.trackingNumber = result.trackingNumber;
          shipment.providerOrderCode = result.orderCode ?? result.labelId;
          shipment.shippingFee = result.shippingFee;
          shipment.expectedDeliveryAt = result.expectedDeliveryTime ?? result.estimatedDeliveryTime;
          shipment.status = 'picked_up';
          break;
        }

        case 'viettelpost':
          result = await this.viettelPostService.createOrder({
            orderNumber: `ORDER-${Date.now()}`,
            senderFullname: dto.senderInfo.name,
            senderPhone: dto.senderInfo.phone,
            senderAddress: dto.senderInfo.address,
            senderProvince: parseInt(dto.senderInfo.province) || 0,
            senderDistrict: parseInt(dto.senderInfo.district) || 0,
            senderWard: parseInt(dto.senderInfo.ward) || 0,
            receiverFullname: dto.receiverInfo.name,
            receiverPhone: dto.receiverInfo.phone,
            receiverAddress: dto.receiverInfo.address,
            receiverProvince: parseInt(dto.receiverInfo.province) || 0,
            receiverDistrict: parseInt(dto.receiverInfo.district) || 0,
            receiverWard: parseInt(dto.receiverInfo.ward) || 0,
            productName: 'Package',
            productPrice: dto.codAmount || 0,
            productWeight: dto.packageInfo.weight,
            productQuantity: 1,
            moneyCollection: dto.codAmount || 0,
            serviceType: 1,
            nationalType: 3,
            note: dto.note,
          });

          if (result.error) {
            throw new Error(result.error);
          }

          shipment.trackingNumber = result.trackingNumber;
          shipment.providerOrderCode = result.orderCode ?? result.trackingNumber;
          shipment.shippingFee = result.shippingFee ?? result.moneyTotal;
          shipment.expectedDeliveryAt = result.expectedDeliveryTime;
          shipment.status = 'picked_up';
          break;

        case 'vnpost':
          result = await this.vnPostService.createOrder({
            toName: dto.receiverInfo.name,
            toPhone: dto.receiverInfo.phone,
            toAddress: dto.receiverInfo.address,
            toProvince: dto.receiverInfo.province,
            toDistrict: dto.receiverInfo.district,
            toWard: dto.receiverInfo.ward,
            codAmount: dto.codAmount || 0,
            weight: dto.packageInfo.weight,
            length: dto.packageInfo.length || 10,
            width: dto.packageInfo.width || 10,
            height: dto.packageInfo.height || 10,
            serviceCode: dto.serviceType || 'EMS',
            items: dto.packageInfo.items,
            note: dto.note,
          });

          if (result.error) {
            throw new Error(result.error);
          }

          shipment.trackingNumber = result.trackingNumber;
          shipment.providerOrderCode = result.orderCode;
          shipment.shippingFee = result.shippingFee;
          shipment.expectedDeliveryAt = result.expectedDeliveryTime;
          shipment.status = 'picked_up';
          break;

        default:
          throw new BadRequestException(`Unsupported provider: ${dto.provider}`);
      }

      shipment.providerResponse = result;
      const savedShipment = await this.secureShipmentRepo.save(user, shipment);

      this.logger.log(`Shipment created: ${savedShipment.id} via ${dto.provider}`);

      return savedShipment;
    } catch (error) {
      shipment.status = 'failed';
      await this.secureShipmentRepo.save(user, shipment);

      this.logger.error(`Shipment creation failed: ${this.getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * Calculate shipping fee
   */
  async calculateFee(
    user: User,
    dto: CalculateShippingFeeDto,
  ): Promise<{
    provider: string;
    total: number;
    serviceFee: number;
    insuranceFee: number;
  }> {
    try {
      let result: ShipmentProviderResult;

      switch (dto.provider) {
        case 'ghn':
          result = await this.ghnService.calculateFee({
            fromDistrictId: parseInt(dto.fromDistrict),
            toDistrictId: parseInt(dto.toDistrict),
            toWardCode: dto.toProvince, // Simplified for now
            weight: dto.weight,
            length: dto.length || 10,
            width: dto.width || 10,
            height: dto.height || 10,
            serviceTypeId: parseInt(dto.serviceType || '2'),
            codAmount: dto.codAmount,
          });

          if (result.error) {
            throw new Error(result.error);
          }

          return {
            provider: dto.provider,
            total: result.total,
            serviceFee: result.serviceFee,
            insuranceFee: result.insuranceFee || 0,
          };

        case 'ghtk': {
          const ghtkResult = await this.ghtkService.calculateFee({
            pickProvince: dto.fromProvince,
            pickDistrict: dto.fromDistrict,
            province: dto.toProvince,
            district: dto.toDistrict,
            weight: dto.weight,
            value: dto.codAmount || 0,
          });

          if (ghtkResult.error) {
            throw new Error(ghtkResult.error);
          }

          return {
            provider: dto.provider,
            total: ghtkResult.fee || 0,
            serviceFee: ghtkResult.fee || 0,
            insuranceFee: ghtkResult.insuranceFee || 0,
          };
        }

        case 'viettelpost': {
          const viettelResult = await this.viettelPostService.calculateFee({
            senderProvince: parseInt(dto.fromProvince) || 0,
            senderDistrict: parseInt(dto.fromDistrict) || 0,
            receiverProvince: parseInt(dto.toProvince) || 0,
            receiverDistrict: parseInt(dto.toDistrict) || 0,
            productWeight: dto.weight,
            productPrice: dto.codAmount || 0,
            moneyCollection: dto.codAmount || 0,
            serviceType: 1,
            nationalType: 3,
          });

          if (viettelResult.error) {
            throw new Error(viettelResult.error);
          }

          return {
            provider: dto.provider,
            total: viettelResult.moneyTotal || 0,
            serviceFee: viettelResult.moneyFee || 0,
            insuranceFee: viettelResult.moneyVas || 0,
          };
        }

        case 'vnpost':
          result = await this.vnPostService.calculateFee({
            fromProvince: dto.fromProvince,
            toProvince: dto.toProvince,
            weight: dto.weight,
            length: dto.length || 10,
            width: dto.width || 10,
            height: dto.height || 10,
            serviceCode: dto.serviceType || 'EMS',
            codAmount: dto.codAmount,
          });

          if (result.error) {
            throw new Error(result.error);
          }

          return {
            provider: dto.provider,
            total: result.total,
            serviceFee: result.serviceFee,
            insuranceFee: result.insuranceFee || 0,
          };

        default:
          throw new BadRequestException(`Unsupported provider: ${dto.provider}`);
      }
    } catch (error) {
      this.logger.error(`Calculate fee failed: ${this.getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * Track shipment
   */
  async trackShipment(
    user: User,
    dto: TrackShipmentDto,
  ): Promise<{
    shipment: Shipment;
    tracking: Record<string, unknown>;
  }> {
    const shipment = await this.secureShipmentRepo.findOne(user, {
      where: { trackingNumber: dto.trackingNumber },
    });

    if (!shipment) {
      throw new BadRequestException('Shipment not found');
    }

    try {
      let result: ShipmentProviderResult;

      switch (dto.provider) {
        case 'ghn':
          result = await this.ghnService.trackShipment(shipment.providerOrderCode);

          if (result.error) {
            throw new Error(result.error as string);
          }

          // Update shipment status
          shipment.status = this.mapProviderStatus(result.status as string);
          if (result.status === 'delivered') {
            shipment.deliveredAt = new Date();
          }
          await this.secureShipmentRepo.save(user, shipment);

          // Invalidate cache after update
          await this.cacheService.del(generateCacheKey('shipment', user.tenantId, shipment.id));

          return {
            shipment,
            tracking: result,
          };

        case 'ghtk':
          result = await this.ghtkService.trackShipment(shipment.trackingNumber);

          if (result.error) {
            throw new Error(result.error as string);
          }

          // Update shipment status
          shipment.status = this.mapProviderStatus(result.status as string);
          if (result.status === 'delivered') {
            shipment.deliveredAt = new Date();
          }
          await this.secureShipmentRepo.save(user, shipment);

          // Invalidate cache after update
          await this.cacheService.del(generateCacheKey('shipment', user.tenantId, shipment.id));

          return {
            shipment,
            tracking: result,
          };

        case 'viettelpost':
          result = await this.viettelPostService.trackShipment(shipment.providerOrderCode);

          if (result.error) {
            throw new Error(result.error as string);
          }

          // Update shipment status
          shipment.status = this.mapProviderStatus(result.status as string);
          if (result.status === 'delivered') {
            shipment.deliveredAt = new Date();
          }
          await this.secureShipmentRepo.save(user, shipment);

          // Invalidate cache after update
          await this.cacheService.del(generateCacheKey('shipment', user.tenantId, shipment.id));

          return {
            shipment,
            tracking: result,
          };

        case 'vnpost':
          result = await this.vnPostService.trackShipment(shipment.trackingNumber);

          if (result.error) {
            throw new Error(result.error as string);
          }

          // Update shipment status
          shipment.status = this.mapProviderStatus(result.status as string);
          if (result.status === 'delivered') {
            shipment.deliveredAt = new Date();
          }
          await this.secureShipmentRepo.save(user, shipment);

          // Invalidate cache after update
          await this.cacheService.del(generateCacheKey('shipment', user.tenantId, shipment.id));

          return {
            shipment,
            tracking: result,
          };

        default:
          throw new BadRequestException(`Unsupported provider: ${dto.provider}`);
      }
    } catch (error) {
      this.logger.error(`Track shipment failed: ${this.getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(user: User, dto: CancelShipmentDto): Promise<Shipment> {
    const shipment = await this.secureShipmentRepo.findOne(user, {
      where: { id: dto.shipmentId },
    });

    if (!shipment) {
      throw new BadRequestException('Shipment not found');
    }

    if (shipment.status === 'delivered' || shipment.status === 'cancelled') {
      throw new BadRequestException('Cannot cancel this shipment');
    }

    try {
      let result: ShipmentProviderResult;

      switch (shipment.provider) {
        case 'ghn':
          result = await this.ghnService.cancelOrder([shipment.providerOrderCode]);

          if (!result.success) {
            throw new Error(result.message);
          }
          break;

        case 'ghtk':
          result = await this.ghtkService.cancelOrder(shipment.trackingNumber);

          if (!result.success) {
            throw new Error(result.message);
          }
          break;

        case 'viettelpost':
          result = await this.viettelPostService.cancelOrder(
            shipment.providerOrderCode,
            'Cancelled by user',
          );

          if (!result.success) {
            throw new Error(result.message);
          }
          break;

        case 'vnpost':
          result = await this.vnPostService.cancelOrder(shipment.providerOrderCode);

          if (!result.success) {
            throw new Error(result.message);
          }
          break;

        default:
          throw new BadRequestException(`Unsupported provider: ${shipment.provider}`);
      }

      shipment.status = 'cancelled';
      await this.secureShipmentRepo.save(user, shipment);

      // Invalidate cache after update
      await this.cacheService.del(generateCacheKey('shipment', user.tenantId, shipment.id));

      this.logger.log(`Shipment cancelled: ${shipment.id}`);

      return shipment;
    } catch (error) {
      this.logger.error(`Cancel shipment failed: ${this.getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * Get shipment by ID
   */
  async getShipment(user: User, shipmentId: string): Promise<Shipment> {
    const cacheKey = generateCacheKey('shipment', user.tenantId, shipmentId);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const shipment = await this.secureShipmentRepo.findOne(user, {
          where: { id: shipmentId },
        });

        if (!shipment) {
          throw new BadRequestException('Shipment not found');
        }

        return shipment;
      },
      CacheTTL.MEDIUM,
    );
  }

  /**
   * List shipments
   */
  async listShipments(
    user: User,
    filters?: ShipmentFilters,
  ): Promise<{ shipments: Shipment[]; total: number }> {
    // Build where conditions
    const where: Partial<Shipment> = { tenantId: user.tenantId };

    if (filters?.orderId) {
      where.orderId = filters.orderId;
    }

    if (filters?.provider) {
      where.provider = filters.provider;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    // Use SecureRepository find with pagination
    const shipments = await this.secureShipmentRepo.find(user, {
      where,
      order: { createdAt: 'DESC' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });

    // Get total count using raw repository (SecureRepository doesn't have count method)
    const total = await this.shipmentRepo.count({ where });

    return { shipments, total };
  }

  /**
   * Map provider status to internal status
   */
  private mapProviderStatus(providerStatus: string): string {
    const statusMap: Record<string, string> = {
      ready_to_pick: 'pending',
      picking: 'picked_up',
      picked: 'picked_up',
      storing: 'in_transit',
      transporting: 'in_transit',
      sorting: 'in_transit',
      delivering: 'in_transit',
      delivered: 'delivered',
      delivery_fail: 'failed',
      cancel: 'cancelled',
      returned: 'failed',
    };
    return statusMap[providerStatus] || 'in_transit';
  }
}
