import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Document } from './entities/document.entity';

import { User } from '@/common/security/permission.service';
@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query('parentId') parentId?: string,
  ): Promise<Document[]> {
    return this.documentService.findAll(user, parentId);
  }

  @Get('search')
  async search(@CurrentUser() user: User, @Query('q') query: string): Promise<Document[]> {
    return this.documentService.search(user, query);
  }

  @Get(':id')
  async findById(@CurrentUser() user: User, @Param('id') id: string): Promise<Document> {
    return this.documentService.findById(user, id);
  }

  @Get(':id/versions')
  async findVersions(@CurrentUser() user: User, @Param('id') id: string): Promise<Document[]> {
    const doc = await this.documentService.findById(user, id);
    return this.documentService.findVersions(user, doc.name);
  }

  @Post('folders')
  async createFolder(
    @CurrentUser() user: User,
    @Body('name') name: string,
    @Body('parentId') parentId: string | null,
    @Body('uploadedBy') uploadedBy: string,
  ): Promise<Document> {
    return this.documentService.createFolder(user, name, parentId);
  }

  @Post('files')
  async createFile(
    @CurrentUser() user: User,
    @Body() data: Partial<Document>,
  ): Promise<Document> {
    return this.documentService.createFile(user, data);
  }

  @Post(':id/versions')
  async createVersion(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('filePath') filePath: string,
    @Body('uploadedBy') uploadedBy: string,
  ): Promise<Document> {
    return this.documentService.createVersion(user, id, filePath);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() data: Partial<Document>,
  ): Promise<Document> {
    return this.documentService.update(user, id, data);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: User, @Param('id') id: string): Promise<void> {
    return this.documentService.delete(user, id);
  }
}
