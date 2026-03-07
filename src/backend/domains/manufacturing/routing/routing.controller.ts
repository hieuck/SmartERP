import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoutingService } from './routing.service';
import { CreateRoutingDto } from './dto/create-routing.dto';
import { AddOperationDto } from './dto/add-operation.dto';
import { Roles } from '../../../common/decorators/roles.decorator';

import { User } from '@/common/security/permission.service';
@ApiTags('manufacturing-routing')
@ApiBearerAuth()
@Controller('manufacturing/routing')
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  @Post()
  @Roles('manager', 'admin', 'production_manager')
  @ApiOperation({ summary: 'Create a new routing' })
  @ApiResponse({ status: 201, description: 'Routing created successfully' })
  async create(@Body() dto: CreateRoutingDto, @Request() req) {
    return this.routingService.create(dto, req.user.tenantId, req.user);
  }

  @Get(':id')
  @Roles('manager', 'admin', 'production_manager', 'production_user')
  @ApiOperation({ summary: 'Get routing by ID' })
  @ApiResponse({ status: 200, description: 'Routing found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.routingService.findOne(id, req.user.tenantId);
  }

  @Get('product/:productId')
  @Roles('manager', 'admin', 'production_manager', 'production_user')
  @ApiOperation({ summary: 'Get routings by product ID' })
  @ApiResponse({ status: 200, description: 'Routings found' })
  async findByProduct(@Param('productId') productId: string, @Request() req) {
    return this.routingService.findByProduct(productId, req.user.tenantId);
  }

  @Post(':id/operations')
  @Roles('manager', 'admin', 'production_manager')
  @ApiOperation({ summary: 'Add operation to routing' })
  @ApiResponse({ status: 201, description: 'Operation added successfully' })
  async addOperation(
    @Param('id') id: string,
    @Body() dto: AddOperationDto,
    @Request() req,
  ) {
    return this.routingService.addOperation(id, dto, req.user.tenantId, req.user);
  }

  @Delete(':routingId/operations/:operationId')
  @Roles('manager', 'admin', 'production_manager')
  @ApiOperation({ summary: 'Remove operation from routing' })
  @ApiResponse({ status: 200, description: 'Operation removed successfully' })
  async removeOperation(
    @Param('routingId') routingId: string,
    @Param('operationId') operationId: string,
    @Request() req,
  ) {
    return this.routingService.removeOperation(
      routingId,
      operationId,
      req.user.tenantId,
      req.user,
    );
  }

  @Get(':id/cost')
  @Roles('manager', 'admin', 'production_manager', 'accountant')
  @ApiOperation({ summary: 'Calculate routing total cost' })
  @ApiResponse({ status: 200, description: 'Routing cost calculated' })
  async calculateCost(@Param('id') id: string, @Request() req) {
    const cost = await this.routingService.calculateTotalCost(id, req.user.tenantId);
    return { routingId: id, totalCost: cost };
  }

  @Delete(':id')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Delete routing' })
  @ApiResponse({ status: 200, description: 'Routing deleted successfully' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.routingService.remove(id, req.user.tenantId, req.user);
    return { message: 'Routing deleted successfully' };
  }
}
