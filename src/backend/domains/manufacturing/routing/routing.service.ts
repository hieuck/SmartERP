import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Routing } from './entities/routing.entity';
import { Operation } from './entities/operation.entity';

@Injectable()
export class RoutingService {
  constructor(
    @InjectRepository(Routing)
    private readonly routingRepository: Repository<Routing>,
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
  ) {}

  async create(tenantId: string, dto: any): Promise<Routing> {
    const routing = this.routingRepository.create({
      tenantId,
      bomId: dto.bomId,
      name: dto.name,
      description: dto.description,
    });

    const savedRouting = await this.routingRepository.save(routing);

    // Create operations
    if (dto.operations && dto.operations.length > 0) {
      const operations = dto.operations.map((opDto: any) =>
        this.operationRepository.create({
          tenantId,
          routingId: savedRouting.id,
          workCenterId: opDto.workCenterId,
          name: opDto.name,
          sequence: opDto.sequence,
          durationExpected: opDto.durationExpected,
          costPerHour: opDto.costPerHour,
        }),
      );
      savedRouting.operations = await this.operationRepository.save(operations);
    }

    return savedRouting;
  }

  async findOne(tenantId: string, id: string): Promise<Routing> {
    const routing = await this.routingRepository.findOne({
      where: { id, tenantId },
      relations: ['bom', 'operations', 'operations.workCenter'],
    });

    if (!routing) {
      throw new NotFoundException(`Routing with ID ${id} not found`);
    }

    return routing;
  }

  async addOperation(tenantId: string, routingId: string, dto: any): Promise<Operation> {
    const routing = await this.findOne(tenantId, routingId);

    const operation = this.operationRepository.create({
      tenantId,
      routingId: routing.id,
      workCenterId: dto.workCenterId,
      name: dto.name,
      sequence: dto.sequence,
      durationExpected: dto.durationExpected,
      costPerHour: dto.costPerHour,
    });

    return this.operationRepository.save(operation);
  }

  async update(tenantId: string, id: string, dto: any): Promise<Routing> {
    const routing = await this.findOne(tenantId, id);

    Object.assign(routing, dto);

    return this.routingRepository.save(routing);
  }
}
