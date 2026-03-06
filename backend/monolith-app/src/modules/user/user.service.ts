import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL } from '@/common/cache/cache.config';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: User[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const [data, total] = await this.userRepository.findAndCount({
      where: { tenantId },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'status',
        'tenantId',
        'createdAt',
        'updatedAt',
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string): Promise<User> {
    const cacheKey = `user:${tenantId}:${id}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const user = await this.userRepository.findOne({
          where: { id, tenantId },
          select: [
            'id',
            'email',
            'firstName',
            'lastName',
            'role',
            'status',
            'tenantId',
            'createdAt',
            'updatedAt',
          ],
        });

        if (!user) {
          throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
      },
      CacheTTL.MEDIUM, // 5 minutes
    );
  }

  async findByEmail(email: string, tenantId: string): Promise<User> {
    return this.userRepository.findOne({
      where: { email, tenantId },
    });
  }

  async create(createUserDto: CreateUserDto, tenantId: string): Promise<User> {
    // Check if email already exists
    const existingUser = await this.findByEmail(createUserDto.email, tenantId);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      tenantId,
      role: createUserDto.role || 'user',
      status: 'active',
    });

    const savedUser = await this.userRepository.save(user);

    // Remove password from response
    delete savedUser.password;
    return savedUser;
  }

  async update(id: string, updateUserDto: UpdateUserDto, tenantId: string): Promise<User> {
    const user = await this.findOne(id, tenantId);

    // Update user
    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    // Invalidate cache
    await this.cacheService.del(`user:${tenantId}:${id}`);

    // Remove password from response
    delete updatedUser.password;
    return updatedUser;
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
    tenantId: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id, tenantId },
      select: ['id', 'password', 'tenantId'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(changePasswordDto.oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Old password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Update password
    await this.userRepository.update({ id, tenantId }, { password: hashedPassword });
  }

  async updateProfile(
    id: string,
    updateData: Partial<UpdateUserDto>,
    tenantId: string,
  ): Promise<User> {
    const user = await this.findOne(id, tenantId);

    // Only allow updating firstName, lastName
    const allowedFields = ['firstName', 'lastName'];
    const filteredData = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    Object.assign(user, filteredData);
    const updatedUser = await this.userRepository.save(user);

    delete updatedUser.password;
    return updatedUser;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.findOne(id, tenantId);
    await this.userRepository.softDelete({ id, tenantId });

    // Invalidate cache
    await this.cacheService.del(`user:${tenantId}:${id}`);
  }

  async activate(id: string, tenantId: string): Promise<User> {
    return this.update(id, { status: 'active' }, tenantId);
  }

  async deactivate(id: string, tenantId: string): Promise<User> {
    return this.update(id, { status: 'inactive' }, tenantId);
  }

  async suspend(id: string, tenantId: string): Promise<User> {
    return this.update(id, { status: 'suspended' }, tenantId);
  }

  async count(tenantId: string): Promise<number> {
    return this.userRepository.count({
      where: { tenantId },
    });
  }

  async findByRole(role: string, tenantId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { role, tenantId },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'status',
        'tenantId',
        'createdAt',
        'updatedAt',
      ],
    });
  }
}
