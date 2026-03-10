import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectService } from './project.service';
import { TaskService } from './task.service';
import { TimeTrackingService } from './time-tracking.service';
import { ProjectController } from './project.controller';
import { TaskController } from './task.controller';
import { TimeTrackingController } from './time-tracking.controller';
import { Project } from './entities/project.entity';
import { Task } from './entities/task.entity';
import { TaskDependency } from './entities/task-dependency.entity';
import { TimeEntry } from './entities/time-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      Task,
      TaskDependency,
      TimeEntry,
    ]),
  ],
  controllers: [
    ProjectController,
    TaskController,
    TimeTrackingController,
  ],
  providers: [
    ProjectService,
    TaskService,
    TimeTrackingService,
  ],
  exports: [
    ProjectService,
    TaskService,
    TimeTrackingService,
  ],
})
export class ProjectModule {}
