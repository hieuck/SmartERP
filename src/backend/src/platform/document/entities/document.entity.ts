import { DocumentType } from '../enums/document-type.enum';
import { AccessLevel } from '../enums/access-level.enum';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.FILE,
  })
  type: DocumentType;

  @Column({ nullable: true })
  filePath: string;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ type: 'bigint', nullable: true })
  size: number;

  @Column({ type: 'uuid', nullable: true })
  parentId: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({
    type: 'enum',
    enum: AccessLevel,
    default: AccessLevel.PRIVATE,
  })
  accessLevel: AccessLevel;

  @Column({ type: 'uuid' })
  uploadedBy: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
