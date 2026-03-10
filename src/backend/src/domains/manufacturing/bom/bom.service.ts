import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BOM } from './entities/bom.entity';
import { BOMLine } from './entities/bom-line.entity';

@Injectable()
export class BOMService {
  constructor(
    @InjectRepository(BOM)
    private readonly bomRepository: Repository<BOM>,
    @InjectRepository(BOMLine)
    private readonly bomLineRepository: Repository<BOMLine>,
  ) {}

  async create(tenantId: string, dto: any): Promise<BOM> {
    const reference = await this.generateReference(tenantId);
    
    const bom = this.bomRepository.create({
      tenantId,
      reference,
      productId: dto.productId,
      productQty: dto.productQty,
      type: dto.type,
    });

    const savedBom = await this.bomRepository.save(bom);

    // Create lines
    if (dto.lines && dto.lines.length > 0) {
      const lines = dto.lines.map((lineDto: any) =>
        this.bomLineRepository.create({
          tenantId,
          bomId: savedBom.id,
          productId: lineDto.productId,
          quantity: lineDto.quantity,
          unitCost: lineDto.unitCost,
        }),
      );
      savedBom.lines = await this.bomLineRepository.save(lines);
    }

    // Recalculate costs
    return this.calculateCosts(tenantId, savedBom.id);
  }

  async findOne(tenantId: string, id: string): Promise<BOM> {
    const bom = await this.bomRepository.findOne({
      where: { id, tenantId },
      relations: ['product', 'lines', 'lines.product'],
    });

    if (!bom) {
      throw new NotFoundException(`BOM with ID ${id} not found`);
    }

    return bom;
  }

  async findByProduct(tenantId: string, productId: string): Promise<BOM[]> {
    return this.bomRepository.find({
      where: { tenantId, productId, isActive: true },
      relations: ['product', 'lines', 'lines.product'],
    });
  }

  async calculateCosts(tenantId: string, id: string): Promise<BOM> {
    const bom = await this.findOne(tenantId, id);

    // Costs are auto-calculated by entity hooks
    // Just save to trigger the hooks
    return this.bomRepository.save(bom);
  }

  async update(tenantId: string, id: string, dto: any): Promise<BOM> {
    const bom = await this.findOne(tenantId, id);

    Object.assign(bom, dto);

    return this.bomRepository.save(bom);
  }

  async addLine(tenantId: string, bomId: string, dto: any): Promise<BOMLine> {
    const bom = await this.findOne(tenantId, bomId);

    const line = this.bomLineRepository.create({
      tenantId,
      bomId: bom.id,
      productId: dto.productId,
      quantity: dto.quantity,
      unitCost: dto.unitCost,
    });

    const savedLine = await this.bomLineRepository.save(line);

    // Recalculate BOM costs
    await this.calculateCosts(tenantId, bomId);

    return savedLine;
  }

  private async generateReference(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.bomRepository.count({
      where: { tenantId },
    });
    const sequence = (count + 1).toString().padStart(4, '0');
    return `BOM-${year}-${sequence}`;
  }
}
