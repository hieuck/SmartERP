import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductionService } from './production.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { MaterialType } from './entities/material.entity';
import { MoldStatus } from './entities/mold.entity';
import { BomStatus } from './entities/bom.entity';
import { WorkOrderStatus } from './entities/work-order.entity';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { CreateMoldDto } from './dto/create-mold.dto';
import { UpdateMoldDto } from './dto/update-mold.dto';
import { CreateBomDto } from './dto/create-bom.dto';
import { UpdateBomDto } from './dto/update-bom.dto';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { CreateQualityCheckDto } from './dto/create-quality-check.dto';
import { UpdateQualityCheckDto } from './dto/update-quality-check.dto';

@ApiTags('production')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  // Materials endpoints
  @Get('materials')
  @ApiOperation({ summary: 'Get all materials' })
  @ApiQuery({ name: 'type', required: false, enum: MaterialType })
  findAllMaterials(@TenantId() tenantId: string, @Query('type') type?: MaterialType) {
    return this.productionService.findAllMaterials(tenantId, type);
  }

  @Get('materials/low-stock')
  @ApiOperation({ summary: 'Get materials with low stock' })
  findLowStockMaterials(@TenantId() tenantId: string) {
    return this.productionService.findLowStockMaterials(tenantId);
  }

  @Get('materials/:id')
  @ApiOperation({ summary: 'Get material by ID' })
  findMaterialById(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.productionService.findMaterialById(id, tenantId);
  }

  @Post('materials')
  @ApiOperation({ summary: 'Create material' })
  createMaterial(@Body() createMaterialDto: CreateMaterialDto, @TenantId() tenantId: string) {
    return this.productionService.createMaterial(createMaterialDto, tenantId);
  }

  @Put('materials/:id')
  @ApiOperation({ summary: 'Update material' })
  updateMaterial(
    @Param('id') id: string,
    @Body() updateMaterialDto: UpdateMaterialDto,
    @TenantId() tenantId: string,
  ) {
    return this.productionService.updateMaterial(id, updateMaterialDto, tenantId);
  }

  @Delete('materials/:id')
  @ApiOperation({ summary: 'Delete material' })
  deleteMaterial(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.productionService.deleteMaterial(id, tenantId);
  }

  // ==================== MOLDS ENDPOINTS ====================

  @Get('molds')
  @ApiOperation({ summary: 'Get all molds' })
  findAllMolds(@TenantId() tenantId: string, @Query('status') status?: MoldStatus) {
    return this.productionService.findAllMolds(tenantId, status);
  }

  @Get('molds/maintenance-needed')
  @ApiOperation({ summary: 'Get molds needing maintenance' })
  findMoldsNeedingMaintenance(@TenantId() tenantId: string) {
    return this.productionService.findMoldsNeedingMaintenance(tenantId);
  }

  @Get('molds/:id')
  @ApiOperation({ summary: 'Get mold by ID' })
  findMoldById(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.productionService.findMoldById(id, tenantId);
  }

  @Post('molds')
  @ApiOperation({ summary: 'Create mold' })
  createMold(@Body() createMoldDto: CreateMoldDto, @TenantId() tenantId: string) {
    return this.productionService.createMold(createMoldDto, tenantId);
  }

  @Put('molds/:id')
  @ApiOperation({ summary: 'Update mold' })
  updateMold(
    @Param('id') id: string,
    @Body() updateMoldDto: UpdateMoldDto,
    @TenantId() tenantId: string,
  ) {
    return this.productionService.updateMold(id, updateMoldDto, tenantId);
  }

  @Delete('molds/:id')
  @ApiOperation({ summary: 'Delete mold' })
  deleteMold(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.productionService.deleteMold(id, tenantId);
  }

  @Post('molds/:id/record-usage')
  @ApiOperation({ summary: 'Record mold usage' })
  recordMoldUsage(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.productionService.recordMoldUsage(id, tenantId);
  }

  // ==================== BOM ENDPOINTS ====================

  @Get('boms')
  @ApiOperation({ summary: 'Get all BOMs' })
  findAllBoms(
    @TenantId() tenantId: string,
    @Query('productId') productId?: string,
    @Query('status') status?: BomStatus,
  ) {
    return this.productionService.findAllBoms(tenantId, productId, status);
  }

  @Get('boms/:id')
  @ApiOperation({ summary: 'Get BOM by ID' })
  findBomById(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.productionService.findBomById(id, tenantId);
  }

  @Post('boms')
  @ApiOperation({ summary: 'Create BOM' })
  createBom(@Body() createBomDto: CreateBomDto, @TenantId() tenantId: string) {
    return this.productionService.createBom(createBomDto, tenantId);
  }

  @Put('boms/:id')
  @ApiOperation({ summary: 'Update BOM' })
  updateBom(
    @Param('id') id: string,
    @Body() updateBomDto: UpdateBomDto,
    @TenantId() tenantId: string,
  ) {
    return this.productionService.updateBom(id, updateBomDto, tenantId);
  }

  @Delete('boms/:id')
  @ApiOperation({ summary: 'Delete BOM' })
  deleteBom(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.productionService.deleteBom(id, tenantId);
  }

  @Post('boms/:id/set-default')
  @ApiOperation({ summary: 'Set BOM as default for product' })
  setDefaultBom(
    @Param('id') id: string,
    @Body('productId') productId: string,
    @TenantId() tenantId: string,
  ) {
    return this.productionService.setDefaultBom(id, productId, tenantId);
  }

  // ==================== WORK ORDERS ENDPOINTS ====================

  @Get('work-orders')
  @ApiOperation({ summary: 'Get all work orders' })
  findAllWorkOrders(@TenantId() tenantId: string, @Query('status') status?: WorkOrderStatus) {
    return this.productionService.findAllWorkOrders(tenantId, status);
  }

  @Get('work-orders/:id')
  @ApiOperation({ summary: 'Get work order by ID' })
  findWorkOrderById(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.productionService.findWorkOrderById(id, tenantId);
  }

  @Post('work-orders')
  @ApiOperation({ summary: 'Create work order' })
  createWorkOrder(@Body() createWorkOrderDto: CreateWorkOrderDto, @TenantId() tenantId: string) {
    return this.productionService.createWorkOrder(createWorkOrderDto, tenantId);
  }

  @Put('work-orders/:id')
  @ApiOperation({ summary: 'Update work order' })
  updateWorkOrder(
    @Param('id') id: string,
    @Body() updateWorkOrderDto: UpdateWorkOrderDto,
    @TenantId() tenantId: string,
  ) {
    return this.productionService.updateWorkOrder(id, updateWorkOrderDto, tenantId);
  }

  @Delete('work-orders/:id')
  @ApiOperation({ summary: 'Delete work order' })
  deleteWorkOrder(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.productionService.deleteWorkOrder(id, tenantId);
  }

  @Post('work-orders/:id/start')
  @ApiOperation({ summary: 'Start work order' })
  startWorkOrder(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.productionService.startWorkOrder(id, tenantId);
  }

  @Post('work-orders/:id/complete')
  @ApiOperation({ summary: 'Complete work order' })
  completeWorkOrder(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.productionService.completeWorkOrder(id, tenantId);
  }

  @Post('work-orders/:id/pause')
  @ApiOperation({ summary: 'Pause work order' })
  pauseWorkOrder(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @TenantId() tenantId: string,
  ) {
    return this.productionService.pauseWorkOrder(id, tenantId, reason);
  }

  @Post('work-orders/:id/resume')
  @ApiOperation({ summary: 'Resume work order' })
  resumeWorkOrder(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.productionService.resumeWorkOrder(id, tenantId);
  }

  @Post('work-orders/:id/update-progress')
  @ApiOperation({ summary: 'Update work order progress' })
  updateWorkOrderProgress(
    @Param('id') id: string,
    @Body('quantityProduced') quantityProduced: number,
    @Body('quantityRejected') quantityRejected: number,
    @TenantId() tenantId: string,
  ) {
    return this.productionService.updateWorkOrderProgress(
      id,
      quantityProduced,
      quantityRejected,
      tenantId,
    );
  }

  // ==================== QUALITY CHECKS ENDPOINTS ====================

  @Get('quality-checks')
  @ApiOperation({ summary: 'Get all quality checks' })
  findAllQualityChecks(@TenantId() tenantId: string, @Query('workOrderId') workOrderId?: string) {
    return this.productionService.findAllQualityChecks(tenantId, workOrderId);
  }

  @Get('quality-checks/statistics')
  @ApiOperation({ summary: 'Get quality statistics' })
  getQualityStatistics(
    @TenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.productionService.getQualityStatistics(tenantId, start, end);
  }

  @Get('quality-checks/:id')
  @ApiOperation({ summary: 'Get quality check by ID' })
  findQualityCheckById(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.productionService.findQualityCheckById(id, tenantId);
  }

  @Post('quality-checks')
  @ApiOperation({ summary: 'Create quality check' })
  createQualityCheck(
    @Body() createQualityCheckDto: CreateQualityCheckDto,
    @TenantId() tenantId: string,
  ) {
    return this.productionService.createQualityCheck(createQualityCheckDto, tenantId);
  }

  @Put('quality-checks/:id')
  @ApiOperation({ summary: 'Update quality check' })
  updateQualityCheck(
    @Param('id') id: string,
    @Body() updateQualityCheckDto: UpdateQualityCheckDto,
    @TenantId() tenantId: string,
  ) {
    return this.productionService.updateQualityCheck(id, updateQualityCheckDto, tenantId);
  }

  @Delete('quality-checks/:id')
  @ApiOperation({ summary: 'Delete quality check' })
  deleteQualityCheck(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.productionService.deleteQualityCheck(id, tenantId);
  }

  @Post('quality-checks/:id/approve')
  @ApiOperation({ summary: 'Approve quality check' })
  async approveQualityCheck(
    @Param('id') id: string,
    @Body('approvedBy') approvedBy: string,
    @TenantId() tenantId: string,
  ): Promise<unknown> {
    return this.productionService.approveQualityCheck(id, approvedBy, tenantId);
  }
}
