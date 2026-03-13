import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, IsNull } from 'typeorm';
import { Document } from './entities/document.entity';
import { DocumentType } from './enums/document-type.enum';
import { CacheService } from '@common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@common/cache/cache.config';
import { SecureRepository } from '@common/security/secure-repository';
import { PermissionService, User } from '@common/security/permission.service';

@Injectable()
export class DocumentService {
  private secureDocumentRepo: SecureRepository<Document>;

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    this.secureDocumentRepo = new SecureRepository(
      documentRepository,
      permissionService,
      'Document',
    );
  }

  async findAll(user: User, parentId?: string): Promise<Document[]> {
    const where: FindOptionsWhere<Document> = {};
    if (parentId) {
      where.parentId = parentId;
    } else {
      where.parentId = IsNull();
    }

    return this.secureDocumentRepo.find(user, {
      where,
      select: [
        'id',
        'name',
        'type',
        'filePath',
        'mimeType',
        'size',
        'version',
        'parentId',
        'uploadedBy',
        'createdAt',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(user: User, id: string): Promise<Document> {
    const cacheKey = generateCacheKey('document', user.tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const document = await this.secureDocumentRepo.findOne(user, { where: { id } });
        if (!document) {
          throw new NotFoundException(`Document with ID ${id} not found`);
        }
        return document;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createFolder(
    user: User,
    name: string,
    parentId: string | null,
  ): Promise<Document> {
    const doc = this.documentRepository.create({
      name,
      type: DocumentType.FOLDER,
      parentId,
      uploadedBy: user.id,
    });
    return this.documentRepository.save(doc);
  }

  async createFile(user: User, data: Partial<Document>): Promise<Document> {
    const doc = this.documentRepository.create({
      ...data,
      type: DocumentType.FILE,
      uploadedBy: user.id,
    });
    return this.documentRepository.save(doc);
  }

  async update(user: User, id: string, data: Partial<Document>): Promise<Document> {
    await this.findById(user, id);
    await this.documentRepository.update({ id }, data);

    const cacheKey = generateCacheKey('document', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return this.findById(user, id);
  }

  async delete(user: User, id: string): Promise<void> {
    await this.findById(user, id);
    await this.documentRepository.softDelete({ id });

    const cacheKey = generateCacheKey('document', user.tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async createVersion(
    user: User,
    id: string,
    filePath: string,
  ): Promise<Document> {
    const original = await this.findById(user, id);
    const saved = await this.secureDocumentRepo.save(user, {
      name: original.name,
      type: original.type,
      parentId: original.parentId,
      version: original.version + 1,
      filePath,
      uploadedBy: user.id,
      mimeType: original.mimeType,
    });

    const cacheKey = generateCacheKey('document', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return saved;
  }

  async findVersions(user: User, name: string): Promise<Document[]> {
    return this.secureDocumentRepo.find(user, {
      where: { name },
      order: { version: 'DESC' },
    });
  }

  async search(user: User, query: string): Promise<Document[]> {
    return this.documentRepository
      .createQueryBuilder('document')
      .where('document.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('(document.name ILIKE :query OR document.description ILIKE :query)', {
        query: `%${query}%`,
      })
      .orderBy('document.createdAt', 'DESC')
      .getMany();
  }
}
