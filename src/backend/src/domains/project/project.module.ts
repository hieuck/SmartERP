import { SecurityModule } from '@common/security/security.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { TaskDependency } from './entities/task-dependency.entity';
import { Task } from './entities/task.entity';
import { TimeEntry } from './entities/time-entry.entity';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TimeTrackingController } from './time-tracking.controller';
import { TimeTrackingService } from './time-tracking.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Task, TaskDependency, TimeEntry]), SecurityModule],
  controllers: [ProjectController, TaskController, TimeTrackingController],
  providers: [ProjectService, TaskService, TimeTrackingService],
  exports: [ProjectService, TaskService, TimeTrackingService],
})
export class ProjectModule {}
