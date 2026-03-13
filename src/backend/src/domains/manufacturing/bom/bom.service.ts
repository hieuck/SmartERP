import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BOM } from './entities/bom.entity';
import { BOMLine } from './entities/bom-line.entity';
import { CreateBOMDto, BOMLineItemDto } from './dto/create-bom.dto';
import { UpdateBOMDto } from './dto/update-bom.dto';
import { AddBOMLineDto } from './dto/add-bom-line.dto';

const REFERENCE_SEQUENCE_LENGTH = 4;

@Injectable()
export class BOMService {
  constructor(
    @InjectRepository(BOM)
    private readonly bomRepository: Repository<BOM>,
    @InjectRepository(BOMLine)
    private readonly bomLineRepository: Repository<BOMLine>,
  ) {}

  async create(tenantId: string, dto: CreateBOMDto): Promise<BOM> {
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
      const lines = dto.lines.map((lineDto: BOMLineItemDto) =>
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

  async update(tenantId: string, id: string, dto: UpdateBOMDto): Promise<BOM> {
    const bom = await this.findOne(tenantId, id);

    Object.assign(bom, dto);

    return this.bomRepository.save(bom);
  }

  async addLine(tenantId: string, bomId: string, dto: AddBOMLineDto): Promise<BOMLine> {
    const bom = await this.findOne(tenantId, bomId);

    const line = this.bomLineRepository.create({
      tenantId,
      bomId: bom.id,
      productId: dto.productId,
      quantity: dto.quantity,
      unitCost: 0, // Will be calculated
    });

    const savedLine = await this.bomLineRepository.save(line);

    // Recalculate BOM costs
    await this.calculateCosts(tenantId, bomId);

    return savedLine;
  }

  async removeLine(tenantId: string, bomId: string, lineId: string): Promise<void> {
    const bom = await this.findOne(tenantId, bomId);
    
    const line = await this.bomLineRepository.findOne({
      where: { id: lineId, bomId: bom.id, tenantId },
    });

    if (!line) {
      throw new NotFoundException(`BOM line with ID ${lineId} not found`);
    }

    await this.bomLineRepository.remove(line);

    // Recalculate BOM costs
    await this.calculateCosts(tenantId, bomId);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const bom = await this.findOne(tenantId, id);

    // Remove all lines first
    if (bom.lines && bom.lines.length > 0) {
      await this.bomLineRepository.remove(bom.lines);
    }

    // Remove BOM
    await this.bomRepository.remove(bom);
  }

  private async generateReference(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.bomRepository.count({
      where: { tenantId },
    });
    const sequence = (count + 1).toString().padStart(REFERENCE_SEQUENCE_LENGTH, '0');
    return `BOM-${year}-${sequence}`;
  }
}