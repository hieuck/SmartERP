import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Document } from './entities/document.entity';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  async findAll(
    @TenantId() tenantId: string,
    @Query('parentId') parentId?: string,
  ): Promise<Document[]> {
    return this.documentService.findAll(tenantId, parentId);
  }

  @Get('search')
  async search(@TenantId() tenantId: string, @Query('q') query: string): Promise<Document[]> {
    return this.documentService.search(tenantId, query);
  }

  @Get(':id')
  async findById(@TenantId() tenantId: string, @Param('id') id: string): Promise<Document> {
    return this.documentService.findById(tenantId, id);
  }

  @Get(':id/versions')
  async findVersions(@TenantId() tenantId: string, @Param('id') id: string): Promise<Document[]> {
    const doc = await this.documentService.findById(tenantId, id);
    return this.documentService.findVersions(tenantId, doc.name);
  }

  @Post('folders')
  async createFolder(
    @TenantId() tenantId: string,
    @Body('name') name: string,
    @Body('parentId') parentId: string | null,
    @Body('uploadedBy') uploadedBy: string,
  ): Promise<Document> {
    return this.documentService.createFolder(tenantId, name, parentId, uploadedBy);
  }

  @Post('files')
  async createFile(
    @TenantId() tenantId: string,
    @Body() data: Partial<Document>,
  ): Promise<Document> {
    return this.documentService.createFile(tenantId, data);
  }

  @Post(':id/versions')
  async createVersion(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('filePath') filePath: string,
    @Body('uploadedBy') uploadedBy: string,
  ): Promise<Document> {
    return this.documentService.createVersion(tenantId, id, filePath, uploadedBy);
  }

  @Put(':id')
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() data: Partial<Document>,
  ): Promise<Document> {
    return this.documentService.update(tenantId, id, data);
  }

  @Delete(':id')
  async delete(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.documentService.delete(tenantId, id);
  }
}
