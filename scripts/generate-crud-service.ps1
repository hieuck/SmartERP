# CRUD Service Generator
# Generates complete CRUD service with SecureRepository pattern

param(
    [Parameter(Mandatory=$true)]
    [string]$EntityName,
    
    [Parameter(Mandatory=$true)]
    [string]$Domain
)

$serviceName = "${EntityName}Service"
$fileName = "$($EntityName.ToLower()).service.ts"
$testFileName = "$($EntityName.ToLower()).service.spec.ts"
$path = "src/domains/$Domain"

# Service Template
$serviceContent = @"
import { Injectable } from '@nestjs/common';
import { SecureRepository } from '@/shared/database/secure-repository';
import { PermissionService } from '@/domains/security/services/permission.service';
import { CacheService, CacheTTL } from '@/shared/cache/cache.service';
import { ${EntityName} } from './entities/${EntityName.ToLower()}.entity';
import { Create${EntityName}Dto } from './dto/create-${EntityName.ToLower()}.dto';
import { Update${EntityName}Dto } from './dto/update-${EntityName.ToLower()}.dto';

@Injectable()
export class ${serviceName} {
  private readonly cacheKey = '${EntityName.ToLower()}';

  constructor(
    private readonly secureRepo: SecureRepository<${EntityName}>,
    private readonly permissionService: PermissionService,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(tenantId: string, userId: string) {
    await this.permissionService.canRead(userId, '${EntityName}');
    
    const cacheKey = \`\${this.cacheKey}:\${tenantId}:all\`;
    const cached = await this.cacheService.get<${EntityName}[]>(cacheKey);
    if (cached) return cached;

    const items = await this.secureRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });

    await this.cacheService.set(cacheKey, items, CacheTTL.SHORT);
    return items;
  }

  async findById(id: string, tenantId: string, userId: string) {
    await this.permissionService.canRead(userId, '${EntityName}');
    
    const item = await this.secureRepo.findOne({
      where: { id, tenantId },
    });

    if (!item) {
      throw new NotFoundException('${EntityName} not found');
    }

    return item;
  }

  async create(dto: Create${EntityName}Dto, tenantId: string, userId: string) {
    await this.permissionService.canWrite(userId, '${EntityName}');

    const item = await this.secureRepo.save({
      ...dto,
      tenantId,
      createdBy: userId,
    });

    await this.cacheService.invalidate(\`\${this.cacheKey}:\${tenantId}\`);
    return item;
  }

  async update(id: string, dto: Update${EntityName}Dto, tenantId: string, userId: string) {
    await this.permissionService.canWrite(userId, '${EntityName}');

    const item = await this.findById(id, tenantId, userId);
    const updated = await this.secureRepo.save({
      ...item,
      ...dto,
      updatedBy: userId,
    });

    await this.cacheService.invalidate(\`\${this.cacheKey}:\${tenantId}\`);
    return updated;
  }

  async delete(id: string, tenantId: string, userId: string) {
    await this.permissionService.canDelete(userId, '${EntityName}');

    const item = await this.findById(id, tenantId, userId);
    await this.secureRepo.remove(item);

    await this.cacheService.invalidate(\`\${this.cacheKey}:\${tenantId}\`);
  }
}
"@

# Test Template
$testContent = @"
import { Test, TestingModule } from '@nestjs/testing';
import { ${serviceName} } from './${EntityName.ToLower()}.service';
import { SecureRepository } from '@/shared/database/secure-repository';
import { PermissionService } from '@/domains/security/services/permission.service';
import { CacheService } from '@/shared/cache/cache.service';
import { SecurityModule } from '@/domains/security/security.module';

describe('${serviceName}', () => {
  let service: ${serviceName};
  let secureRepo: jest.Mocked<SecureRepository<any>>;
  let permissionService: jest.Mocked<PermissionService>;
  let cacheService: jest.Mocked<CacheService>;

  const mockTenantId = 'tenant-1';
  const mockUserId = 'user-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SecurityModule],
      providers: [
        ${serviceName},
        {
          provide: SecureRepository,
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            invalidate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<${serviceName}>(${serviceName});
    secureRepo = module.get(SecureRepository);
    permissionService = module.get(PermissionService);
    cacheService = module.get(CacheService);
  });

  describe('findAll', () => {
    it('should return all items with tenant isolation', async () => {
      const mockItems = [{ id: '1', tenantId: mockTenantId }];
      cacheService.get.mockResolvedValue(null);
      secureRepo.find.mockResolvedValue(mockItems);

      const result = await service.findAll(mockTenantId, mockUserId);

      expect(permissionService.canRead).toHaveBeenCalledWith(mockUserId, '${EntityName}');
      expect(secureRepo.find).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockItems);
    });
  });

  describe('create', () => {
    it('should create item with audit trail', async () => {
      const dto = { name: 'Test' };
      const mockItem = { id: '1', ...dto, tenantId: mockTenantId, createdBy: mockUserId };
      secureRepo.save.mockResolvedValue(mockItem);

      const result = await service.create(dto, mockTenantId, mockUserId);

      expect(permissionService.canWrite).toHaveBeenCalledWith(mockUserId, '${EntityName}');
      expect(secureRepo.save).toHaveBeenCalledWith({
        ...dto,
        tenantId: mockTenantId,
        createdBy: mockUserId,
      });
      expect(cacheService.invalidate).toHaveBeenCalled();
      expect(result).toEqual(mockItem);
    });
  });
});
"@

# Create files
New-Item -Path $path -ItemType Directory -Force | Out-Null
Set-Content "$path/$fileName" $serviceContent
Set-Content "$path/$testFileName" $testContent

Write-Host "✅ Generated:" -ForegroundColor Green
Write-Host "   - $path/$fileName" -ForegroundColor Cyan
Write-Host "   - $path/$testFileName" -ForegroundColor Cyan
