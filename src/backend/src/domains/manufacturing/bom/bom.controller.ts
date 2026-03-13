import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BOMService } from './bom.service';
import { CreateBOMDto } from './dto/create-bom.dto';
import { UpdateBOMDto } from './dto/update-bom.dto';
import { AddBOMLineDto } from './dto/add-bom-line.dto';
import { Roles } from '@common/decorators/roles.decorator';
@ApiTags('manufacturing-bom')
@ApiBearerAuth()
@Controller('manufacturing/bom')
export class BOMController {
  constructor(private readonly bomService: BOMService) {}

  @Post()
  @Roles('manager', 'admin', 'production_manager')
  @ApiOperation({ summary: 'Create a new BOM' })
  @ApiResponse({ status: 201, description: 'BOM created successfully' })
  async create(@Body() dto: CreateBOMDto, @Request() req) {
    return this.bomService.create(req.user.tenantId, dto);
  }

  @Get(':id')
  @Roles('manager', 'admin', 'production_manager', 'production_user')
  @ApiOperation({ summary: 'Get BOM by ID' })
  @ApiResponse({ status: 200, description: 'BOM found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.bomService.findOne(req.user.tenantId, id);
  }

  @Get('product/:productId')
  @Roles('manager', 'admin', 'production_manager', 'production_user')
  @ApiOperation({ summary: 'Get BOMs by product ID' })
  @ApiResponse({ status: 200, description: 'BOMs found' })
  async findByProduct(@Param('productId') productId: string, @Request() req) {
    return this.bomService.findByProduct(req.user.tenantId, productId);
  }

  @Get('product/:productId/active')
  @Roles('manager', 'admin', 'production_manager', 'production_user')
  @ApiOperation({ summary: 'Get active BOM for product' })
  @ApiResponse({ status: 200, description: 'Active BOM found' })
  async findActiveByProduct(@Param('productId') productId: string, @Request() req) {
    return this.bomService.findByProduct(req.user.tenantId, productId);
  }

  @Patch(':id')
  @Roles('manager', 'admin', 'production_manager')
  @ApiOperation({ summary: 'Update BOM' })
  @ApiResponse({ status: 200, description: 'BOM updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBOMDto,
    @Request() req,
  ) {
    return this.bomService.update(req.user.tenantId, id, dto);
  }

  @Post(':id/lines')
  @Roles('manager', 'admin', 'production_manager')
  @ApiOperation({ summary: 'Add line to BOM' })
  @ApiResponse({ status: 201, description: 'BOM line added successfully' })
  async addLine(
    @Param('id') id: string,
    @Body() dto: AddBOMLineDto,
    @Request() req,
  ) {
    return this.bomService.addLine(req.user.tenantId, id, dto);
  }

  @Delete(':bomId/lines/:lineId')
  @Roles('manager', 'admin', 'production_manager')
  @ApiOperation({ summary: 'Remove line from BOM' })
  @ApiResponse({ status: 200, description: 'BOM line removed successfully' })
  async removeLine(
    @Param('bomId') bomId: string,
    @Param('lineId') lineId: string,
    @Request() req,
  ) {
    return this.bomService.removeLine(req.user.tenantId, bomId, lineId);
  }

  @Get(':id/cost')
  @Roles('manager', 'admin', 'production_manager', 'accountant')
  @ApiOperation({ summary: 'Calculate BOM total cost' })
  @ApiResponse({ status: 200, description: 'BOM cost calculated' })
  async calculateCost(@Param('id') id: string, @Request() req) {
    const cost = await this.bomService.calculateCosts(req.user.tenantId, id);
    return { bomId: id, totalCost: cost };
  }

  @Delete(':id')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Delete BOM' })
  @ApiResponse({ status: 200, description: 'BOM deleted successfully' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.bomService.remove(req.user.tenantId, id);
    return { message: 'BOM deleted successfully' };
  }
}
