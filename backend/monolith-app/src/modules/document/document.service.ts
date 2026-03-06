import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentType } from './entities/document.entity';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(tenantId: string, parentId?: string): Promise<Document[]> {
    const queryBuilder = this.documentRepository
      .createQueryBuilder('document')
      .select([
        'document.id',
        'document.name',
        'document.type',
        'document.filePath',
        'document.mimeType',
        'document.size',
        'document.version',
        'document.parentId',
        'document.uploadedBy',
        'document.createdAt',
      ])
      .where('document.tenantId = :tenantId', { tenantId });

    if (parentId) {
      queryBuilder.andWhere('document.parentId = :parentId', { parentId });
    } else {
      queryBuilder.andWhere('document.parentId IS NULL');
    }

    return queryBuilder.orderBy('document.createdAt', 'DESC').getMany();
  }

  async findById(tenantId: string, id: string): Promise<Document> {
    const cacheKey = generateCacheKey('document', tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const document = await this.documentRepository.findOne({
          where: { tenantId, id },
        });
        if (!document) {
          throw new NotFoundException(`Document with ID ${id} not found`);
        }
        return document;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createFolder(
    tenantId: string,
    name: string,
    parentId: string | null,
    uploadedBy: string,
  ): Promise<Document> {
    const folder = this.documentRepository.create({
      tenantId,
      name,
      type: DocumentType.FOLDER,
      parentId,
      uploadedBy,
    });
    return this.documentRepository.save(folder);
  }

  async createFile(tenantId: string, data: Partial<Document>): Promise<Document> {
    const file = this.documentRepository.create({
      ...data,
      tenantId,
      type: DocumentType.FILE,
    });
    return this.documentRepository.save(file);
  }

  async update(tenantId: string, id: string, data: Partial<Document>): Promise<Document> {
    await this.findById(tenantId, id);
    await this.documentRepository.update({ tenantId, id }, data);

    // Invalidate cache
    const cacheKey = generateCacheKey('document', tenantId, id);
    await this.cacheService.del(cacheKey);

    return this.findById(tenantId, id);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.findById(tenantId, id);
    await this.documentRepository.softDelete({ tenantId, id });

    // Invalidate cache
    const cacheKey = generateCacheKey('document', tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async createVersion(
    tenantId: string,
    id: string,
    filePath: string,
    uploadedBy: string,
  ): Promise<Document> {
    const original = await this.findById(tenantId, id);
    const newVersion = this.documentRepository.create({
      ...original,
      id: undefined,
      version: original.version + 1,
      filePath,
      uploadedBy,
    });
    const saved = await this.documentRepository.save(newVersion);

    // Invalidate cache for original document
    const cacheKey = generateCacheKey('document', tenantId, id);
    await this.cacheService.del(cacheKey);

    return saved;
  }

  async findVersions(tenantId: string, name: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { tenantId, name },
      order: { version: 'DESC' },
    });
  }

  async search(tenantId: string, query: string): Promise<Document[]> {
    return this.documentRepository
      .createQueryBuilder('document')
      .where('document.tenantId = :tenantId', { tenantId })
      .andWhere('(document.name ILIKE :query OR document.description ILIKE :query)', {
        query: `%${query}%`,
      })
      .orderBy('document.createdAt', 'DESC')
      .getMany();
  }
}
