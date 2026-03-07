import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductionService } from './production.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
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

import { CurrentUser } from '@/common/decorators/current-user.decorator';
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
  findMaterialById(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productionService.findMaterialById(id, user);
  }

  @Post('materials')
  @ApiOperation({ summary: 'Create material' })
  createMaterial(@Body() createMaterialDto: CreateMaterialDto, @CurrentUser() user: User) {
    return this.productionService.createMaterial(createMaterialDto, user);
  }

  @Put('materials/:id')
  @ApiOperation({ summary: 'Update material' })
  updateMaterial(
    @Param('id') id: string,
    @Body() updateMaterialDto: UpdateMaterialDto,
    @CurrentUser() user: User,
  ) {
    return this.productionService.updateMaterial(id, updateMaterialDto, user);
  }

  @Delete('materials/:id')
  @ApiOperation({ summary: 'Delete material' })
  deleteMaterial(@Param('id') id: string, @CurrentUser() user: User) {
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
  findMoldById(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productionService.findMoldById(id, user);
  }

  @Post('molds')
  @ApiOperation({ summary: 'Create mold' })
  createMold(@Body() createMoldDto: CreateMoldDto, @CurrentUser() user: User) {
    return this.productionService.createMold(createMoldDto, user);
  }

  @Put('molds/:id')
  @ApiOperation({ summary: 'Update mold' })
  updateMold(
    @Param('id') id: string,
    @Body() updateMoldDto: UpdateMoldDto,
    @CurrentUser() user: User,
  ) {
    return this.productionService.updateMold(id, updateMoldDto, user);
  }

  @Delete('molds/:id')
  @ApiOperation({ summary: 'Delete mold' })
  deleteMold(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productionService.deleteMold(id, user);
  }

  @Post('molds/:id/record-usage')
  @ApiOperation({ summary: 'Record mold usage' })
  recordMoldUsage(@Param('id') id: string, @CurrentUser() user: User) {
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
  findBomById(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productionService.findBomById(id, user);
  }

  @Post('boms')
  @ApiOperation({ summary: 'Create BOM' })
  createBom(@Body() createBomDto: CreateBomDto, @CurrentUser() user: User) {
    return this.productionService.createBom(createBomDto, user);
  }

  @Put('boms/:id')
  @ApiOperation({ summary: 'Update BOM' })
  updateBom(
    @Param('id') id: string,
    @Body() updateBomDto: UpdateBomDto,
    @CurrentUser() user: User,
  ) {
    return this.productionService.updateBom(id, updateBomDto, user);
  }

  @Delete('boms/:id')
  @ApiOperation({ summary: 'Delete BOM' })
  deleteBom(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productionService.deleteBom(id, user);
  }

  @Post('boms/:id/set-default')
  @ApiOperation({ summary: 'Set BOM as default for product' })
  setDefaultBom(
    @Param('id') id: string,
    @Body('productId') productId: string,
    @CurrentUser() user: User,
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
  findWorkOrderById(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productionService.findWorkOrderById(id, user);
  }

  @Post('work-orders')
  @ApiOperation({ summary: 'Create work order' })
  createWorkOrder(@Body() createWorkOrderDto: CreateWorkOrderDto, @CurrentUser() user: User) {
    return this.productionService.createWorkOrder(createWorkOrderDto, user);
  }

  @Put('work-orders/:id')
  @ApiOperation({ summary: 'Update work order' })
  updateWorkOrder(
    @Param('id') id: string,
    @Body() updateWorkOrderDto: UpdateWorkOrderDto,
    @CurrentUser() user: User,
  ) {
    return this.productionService.updateWorkOrder(id, updateWorkOrderDto, user);
  }

  @Delete('work-orders/:id')
  @ApiOperation({ summary: 'Delete work order' })
  deleteWorkOrder(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productionService.deleteWorkOrder(id, user);
  }

  @Post('work-orders/:id/start')
  @ApiOperation({ summary: 'Start work order' })
  startWorkOrder(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productionService.startWorkOrder(id, user);
  }

  @Post('work-orders/:id/complete')
  @ApiOperation({ summary: 'Complete work order' })
  completeWorkOrder(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productionService.completeWorkOrder(id, user);
  }

  @Post('work-orders/:id/pause')
  @ApiOperation({ summary: 'Pause work order' })
  pauseWorkOrder(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: User,
  ) {
    return this.productionService.pauseWorkOrder(id, user, reason);
  }

  @Post('work-orders/:id/resume')
  @ApiOperation({ summary: 'Resume work order' })
  resumeWorkOrder(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productionService.resumeWorkOrder(id, user);
  }

  @Post('work-orders/:id/update-progress')
  @ApiOperation({ summary: 'Update work order progress' })
  updateWorkOrderProgress(
    @Param('id') id: string,
    @Body('quantityProduced') quantityProduced: number,
    @Body('quantityRejected') quantityRejected: number,
    @CurrentUser() user: User,
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
  findQualityCheckById(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productionService.findQualityCheckById(id, user);
  }

  @Post('quality-checks')
  @ApiOperation({ summary: 'Create quality check' })
  createQualityCheck(
    @Body() createQualityCheckDto: CreateQualityCheckDto,
    @CurrentUser() user: User,
  ) {
    return this.productionService.createQualityCheck(createQualityCheckDto, user);
  }

  @Put('quality-checks/:id')
  @ApiOperation({ summary: 'Update quality check' })
  updateQualityCheck(
    @Param('id') id: string,
    @Body() updateQualityCheckDto: UpdateQualityCheckDto,
    @CurrentUser() user: User,
  ) {
    return this.productionService.updateQualityCheck(id, updateQualityCheckDto, user);
  }

  @Delete('quality-checks/:id')
  @ApiOperation({ summary: 'Delete quality check' })
  deleteQualityCheck(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productionService.deleteQualityCheck(id, user);
  }

  @Post('quality-checks/:id/approve')
  @ApiOperation({ summary: 'Approve quality check' })
  async approveQualityCheck(
    @Param('id') id: string,
    @Body('approvedBy') approvedBy: string,
    @CurrentUser() user: User,
  ): Promise<unknown> {
    return this.productionService.approveQualityCheck(id, approvedBy, user);
  }
}
