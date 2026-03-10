import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductionService } from './production.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
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

import { User } from '@/common/security/permission.service';
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
  findAllMaterials(@CurrentUser() user: User, @Query('type') type?: MaterialType) {
    return this.productionService.findAllMaterials(user, type);
  }

  @Get('materials/low-stock')
  @ApiOperation({ summary: 'Get materials with low stock' })
  findLowStockMaterials(@CurrentUser() user: User) {
    return this.productionService.findLowStockMaterials(user);
  }

  @Get('materials/:id')
  @ApiOperation({ summary: 'Get material by ID' })
  findMaterialById(@CurrentUser() user: User, @Param('id') id: string) {
    return this.productionService.findMaterialById(id, user);
  }

  @Post('materials')
  @ApiOperation({ summary: 'Create material' })
  createMaterial(@CurrentUser() user: User, @Body() createMaterialDto: CreateMaterialDto) {
    return this.productionService.createMaterial(createMaterialDto, user);
  }

  @Put('materials/:id')
  @ApiOperation({ summary: 'Update material' })
  updateMaterial(
    @Param('id') id: string,
    @CurrentUser() user: User, @Body() updateMaterialDto: UpdateMaterialDto,
  ) {
    return this.productionService.updateMaterial(id, updateMaterialDto, user);
  }

  @Delete('materials/:id')
  @ApiOperation({ summary: 'Delete material' })
  deleteMaterial(@CurrentUser() user: User, @Param('id') id: string) {
    return this.productionService.deleteMaterial(id, user);
  }

  // ==================== MOLDS ENDPOINTS ====================

  @Get('molds')
  @ApiOperation({ summary: 'Get all molds' })
  findAllMolds(@CurrentUser() user: User, @Query('status') status?: MoldStatus) {
    return this.productionService.findAllMolds(user, status);
  }

  @Get('molds/maintenance-needed')
  @ApiOperation({ summary: 'Get molds needing maintenance' })
  findMoldsNeedingMaintenance(@CurrentUser() user: User) {
    return this.productionService.findMoldsNeedingMaintenance(user);
  }

  @Get('molds/:id')
  @ApiOperation({ summary: 'Get mold by ID' })
  findMoldById(@CurrentUser() user: User, @Param('id') id: string) {
    return this.productionService.findMoldById(id, user);
  }

  @Post('molds')
  @ApiOperation({ summary: 'Create mold' })
  createMold(@CurrentUser() user: User, @Body() createMoldDto: CreateMoldDto) {
    return this.productionService.createMold(createMoldDto, user);
  }

  @Put('molds/:id')
  @ApiOperation({ summary: 'Update mold' })
  updateMold(
    @Param('id') id: string,
    @CurrentUser() user: User, @Body() updateMoldDto: UpdateMoldDto,
  ) {
    return this.productionService.updateMold(id, updateMoldDto, user);
  }

  @Delete('molds/:id')
  @ApiOperation({ summary: 'Delete mold' })
  deleteMold(@CurrentUser() user: User, @Param('id') id: string) {
    return this.productionService.deleteMold(id, user);
  }

  @Post('molds/:id/record-usage')
  @ApiOperation({ summary: 'Record mold usage' })
  recordMoldUsage(@CurrentUser() user: User, @Param('id') id: string) {
    return this.productionService.recordMoldUsage(id, user);
  }

  // ==================== BOM ENDPOINTS ====================

  @Get('boms')
  @ApiOperation({ summary: 'Get all BOMs' })
  findAllBoms(
    @CurrentUser() user: User,
    @Query('productId') productId?: string,
    @Query('status') status?: BomStatus,
  ) {
    return this.productionService.findAllBoms(user, productId, status);
  }

  @Get('boms/:id')
  @ApiOperation({ summary: 'Get BOM by ID' })
  findBomById(@CurrentUser() user: User, @Param('id') id: string) {
    return this.productionService.findBomById(id, user);
  }

  @Post('boms')
  @ApiOperation({ summary: 'Create BOM' })
  createBom(@CurrentUser() user: User, @Body() createBomDto: CreateBomDto) {
    return this.productionService.createBom(createBomDto, user);
  }

  @Put('boms/:id')
  @ApiOperation({ summary: 'Update BOM' })
  updateBom(
    @Param('id') id: string,
    @CurrentUser() user: User, @Body() updateBomDto: UpdateBomDto,
  ) {
    return this.productionService.updateBom(id, updateBomDto, user);
  }

  @Delete('boms/:id')
  @ApiOperation({ summary: 'Delete BOM' })
  deleteBom(@CurrentUser() user: User, @Param('id') id: string) {
    return this.productionService.deleteBom(id, user);
  }

  @Post('boms/:id/set-default')
  @ApiOperation({ summary: 'Set BOM as default for product' })
  setDefaultBom(
    @Param('id') id: string,
    @CurrentUser() user: User, @Body('productId') productId: string,
  ) {
    return this.productionService.setDefaultBom(id, productId, user);
  }

  // ==================== WORK ORDERS ENDPOINTS ====================

  @Get('work-orders')
  @ApiOperation({ summary: 'Get all work orders' })
  findAllWorkOrders(@CurrentUser() user: User, @Query('status') status?: WorkOrderStatus) {
    return this.productionService.findAllWorkOrders(user, status);
  }

  @Get('work-orders/:id')
  @ApiOperation({ summary: 'Get work order by ID' })
  findWorkOrderById(@CurrentUser() user: User, @Param('id') id: string) {
    return this.productionService.findWorkOrderById(id, user);
  }

  @Post('work-orders')
  @ApiOperation({ summary: 'Create work order' })
  createWorkOrder(@CurrentUser() user: User, @Body() createWorkOrderDto: CreateWorkOrderDto) {
    return this.productionService.createWorkOrder(createWorkOrderDto, user);
  }

  @Put('work-orders/:id')
  @ApiOperation({ summary: 'Update work order' })
  updateWorkOrder(
    @Param('id') id: string,
    @CurrentUser() user: User, @Body() updateWorkOrderDto: UpdateWorkOrderDto,
  ) {
    return this.productionService.updateWorkOrder(id, updateWorkOrderDto, user);
  }

  @Delete('work-orders/:id')
  @ApiOperation({ summary: 'Delete work order' })
  deleteWorkOrder(@CurrentUser() user: User, @Param('id') id: string) {
    return this.productionService.deleteWorkOrder(id, user);
  }

  @Post('work-orders/:id/start')
  @ApiOperation({ summary: 'Start work order' })
  startWorkOrder(@CurrentUser() user: User, @Param('id') id: string) {
    return this.productionService.startWorkOrder(id, user);
  }

  @Post('work-orders/:id/complete')
  @ApiOperation({ summary: 'Complete work order' })
  completeWorkOrder(@CurrentUser() user: User, @Param('id') id: string) {
    return this.productionService.completeWorkOrder(id, user);
  }

  @Post('work-orders/:id/pause')
  @ApiOperation({ summary: 'Pause work order' })
  pauseWorkOrder(
    @Param('id') id: string,
    @CurrentUser() user: User, @Body('reason') reason: string,
  ) {
    return this.productionService.pauseWorkOrder(id, user, reason);
  }

  @Post('work-orders/:id/resume')
  @ApiOperation({ summary: 'Resume work order' })
  resumeWorkOrder(@CurrentUser() user: User, @Param('id') id: string) {
    return this.productionService.resumeWorkOrder(id, user);
  }

  @Post('work-orders/:id/update-progress')
  @ApiOperation({ summary: 'Update work order progress' })
  updateWorkOrderProgress(
    @Param('id') id: string,
    @Body('quantityProduced') quantityProduced: number,
    @CurrentUser() user: User,
    @Body('quantityRejected') quantityRejected: number,
  ) {
    return this.productionService.updateWorkOrderProgress(
      id,
      quantityProduced,
      quantityRejected,
      user,
    );
  }

  // ==================== QUALITY CHECKS ENDPOINTS ====================

  @Get('quality-checks')
  @ApiOperation({ summary: 'Get all quality checks' })
  findAllQualityChecks(@CurrentUser() user: User, @Query('workOrderId') workOrderId?: string) {
    return this.productionService.findAllQualityChecks(user, workOrderId);
  }

  @Get('quality-checks/statistics')
  @ApiOperation({ summary: 'Get quality statistics' })
  getQualityStatistics(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.productionService.getQualityStatistics(user, start, end);
  }

  @Get('quality-checks/:id')
  @ApiOperation({ summary: 'Get quality check by ID' })
  findQualityCheckById(@CurrentUser() user: User, @Param('id') id: string) {
    return this.productionService.findQualityCheckById(id, user);
  }

  @Post('quality-checks')
  @ApiOperation({ summary: 'Create quality check' })
  createQualityCheck(
    @CurrentUser() user: User, @Body() createQualityCheckDto: CreateQualityCheckDto,
  ) {
    return this.productionService.createQualityCheck(createQualityCheckDto, user);
  }

  @Put('quality-checks/:id')
  @ApiOperation({ summary: 'Update quality check' })
  updateQualityCheck(
    @Param('id') id: string,
    @CurrentUser() user: User, @Body() updateQualityCheckDto: UpdateQualityCheckDto,
  ) {
    return this.productionService.updateQualityCheck(id, updateQualityCheckDto, user);
  }

  @Delete('quality-checks/:id')
  @ApiOperation({ summary: 'Delete quality check' })
  deleteQualityCheck(@CurrentUser() user: User, @Param('id') id: string) {
    return this.productionService.deleteQualityCheck(id, user);
  }

  @Post('quality-checks/:id/approve')
  @ApiOperation({ summary: 'Approve quality check' })
  async approveQualityCheck(
    @Param('id') id: string,
    @CurrentUser() user: User, @Body('approvedBy') approvedBy: string,
  ): Promise<unknown> {
    return this.productionService.approveQualityCheck(id, approvedBy, user);
  }
}
