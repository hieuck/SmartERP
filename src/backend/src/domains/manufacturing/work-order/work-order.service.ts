import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkOrder } from './entities/work-order.entity';
import { WorkOrderStatus } from './enums/work-order-status.enum';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';

const REFERENCE_SEQUENCE_LENGTH = 4;

@Injectable()
export class WorkOrderService {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
  ) {}

  async create(tenantId: string, dto: CreateWorkOrderDto): Promise<WorkOrder> {
    const reference = await this.generateReference(tenantId);

    const workOrder = this.workOrderRepository.create({
      tenantId,
      reference,
      productId: dto.productId,
      bomId: dto.bomId,
      qtyToProduce: dto.qtyToProduce,
      datePlannedStart: dto.datePlannedStart,
      datePlannedFinished: dto.datePlannedFinished,
      responsibleId: dto.responsibleId,
      notes: dto.notes,
      status: WorkOrderStatus.DRAFT,
    });

    return this.workOrderRepository.save(workOrder);
  }

  async findOne(tenantId: string, id: string): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepository.findOne({
      where: { id, tenantId },
      relations: ['product', 'bom', 'responsible'],
    });

    if (!workOrder) {
      throw new NotFoundException(`Work Order with ID ${id} not found`);
    }

    return workOrder;
  }

  async findByStatus(tenantId: string, status: WorkOrderStatus): Promise<WorkOrder[]> {
    return this.workOrderRepository.find({
      where: { tenantId, status },
      relations: ['product', 'bom', 'responsible'],
    });
  }

  async confirm(tenantId: string, id: string): Promise<WorkOrder> {
    const workOrder = await this.findOne(tenantId, id);

    if (workOrder.status !== WorkOrderStatus.DRAFT) {
      throw new BadRequestException('Only draft work orders can be confirmed');
    }

    workOrder.status = WorkOrderStatus.READY;

    return this.workOrderRepository.save(workOrder);
  }

  async start(tenantId: string, id: string): Promise<WorkOrder> {
    const workOrder = await this.findOne(tenantId, id);

    if (workOrder.status !== WorkOrderStatus.READY) {
      throw new BadRequestException('Only ready work orders can be started');
    }

    workOrder.status = WorkOrderStatus.IN_PROGRESS;
    workOrder.dateStart = new Date();

    return this.workOrderRepository.save(workOrder);
  }

  async finish(tenantId: string, id: string, producedQuantity: number): Promise<WorkOrder> {
    const workOrder = await this.findOne(tenantId, id);

    if (workOrder.status !== WorkOrderStatus.IN_PROGRESS) {
      throw new BadRequestException('Only in-progress work orders can be finished');
    }

    workOrder.status = WorkOrderStatus.COMPLETED;
    workOrder.qtyProduced = producedQuantity;
    workOrder.dateFinished = new Date();

    return this.workOrderRepository.save(workOrder);
  }

  async cancel(tenantId: string, id: string): Promise<WorkOrder> {
    const workOrder = await this.findOne(tenantId, id);

    if (workOrder.status === WorkOrderStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed work orders');
    }

    workOrder.status = WorkOrderStatus.CANCELLED;

    return this.workOrderRepository.save(workOrder);
  }

  async findByBOM(tenantId: string, bomId: string): Promise<WorkOrder[]> {
    return this.workOrderRepository.find({
      where: { tenantId, bomId },
      relations: ['product', 'bom', 'responsible'],
      order: { createdAt: 'DESC' },
    });
  }

  private async generateReference(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.workOrderRepository.count({
      where: { tenantId },
    });
    const sequence = (count + 1).toString().padStart(REFERENCE_SEQUENCE_LENGTH, '0');
    return `WO-${year}-${sequence}`;
  }
}
