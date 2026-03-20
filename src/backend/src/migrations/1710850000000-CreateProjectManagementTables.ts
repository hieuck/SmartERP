import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjectManagementTables1710850000000 implements MigrationInterface {
  name = 'CreateProjectManagementTables1710850000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."projects_status_enum" AS ENUM(
        'draft',
        'active',
        'on_hold',
        'completed',
        'cancelled'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."projects_priority_enum" AS ENUM(
        'low',
        'medium',
        'high',
        'urgent'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."tasks_status_enum" AS ENUM(
        'todo',
        'in_progress',
        'in_review',
        'blocked',
        'completed',
        'cancelled'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."tasks_priority_enum" AS ENUM(
        'low',
        'medium',
        'high',
        'urgent'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."task_dependencies_type_enum" AS ENUM(
        'finish_to_start',
        'start_to_start',
        'finish_to_finish',
        'start_to_finish'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "code" character varying(50) NOT NULL,
        "name" character varying(200) NOT NULL,
        "description" text,
        "status" "public"."projects_status_enum" NOT NULL DEFAULT 'draft',
        "priority" "public"."projects_priority_enum" NOT NULL DEFAULT 'medium',
        "start_date" date,
        "end_date" date,
        "actual_start_date" date,
        "actual_end_date" date,
        "estimated_hours" numeric(15,2),
        "actual_hours" numeric(15,2) NOT NULL DEFAULT 0,
        "budget" numeric(15,2),
        "actual_cost" numeric(15,2) NOT NULL DEFAULT 0,
        "progress" integer NOT NULL DEFAULT 0,
        "project_manager_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        CONSTRAINT "PK_projects_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_projects_code" UNIQUE ("code"),
        CONSTRAINT "CHK_projects_progress_range" CHECK ("progress" >= 0 AND "progress" <= 100)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "code" character varying(50) NOT NULL,
        "title" character varying(200) NOT NULL,
        "description" text,
        "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'todo',
        "priority" "public"."tasks_priority_enum" NOT NULL DEFAULT 'medium',
        "project_id" uuid NOT NULL,
        "parent_task_id" uuid,
        "assignee_id" uuid,
        "start_date" date,
        "due_date" date,
        "completed_date" date,
        "estimated_hours" numeric(10,2),
        "actual_hours" numeric(10,2) NOT NULL DEFAULT 0,
        "progress" integer NOT NULL DEFAULT 0,
        "blocked_reason" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        CONSTRAINT "PK_tasks_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tasks_code" UNIQUE ("code"),
        CONSTRAINT "CHK_tasks_progress_range" CHECK ("progress" >= 0 AND "progress" <= 100)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "task_dependencies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "task_id" uuid NOT NULL,
        "depends_on_task_id" uuid NOT NULL,
        "type" "public"."task_dependencies_type_enum" NOT NULL DEFAULT 'finish_to_start',
        "lag_days" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        CONSTRAINT "PK_task_dependencies_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_task_dependencies_distinct_tasks" CHECK ("task_id" <> "depends_on_task_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "time_entries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "task_id" uuid NOT NULL,
        "project_id" uuid NOT NULL,
        "date" date NOT NULL,
        "hours" numeric(10,2) NOT NULL,
        "description" text,
        "is_billable" boolean NOT NULL DEFAULT false,
        "hourly_rate" numeric(15,2),
        "cost" numeric(15,2),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        CONSTRAINT "PK_time_entries_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_time_entries_hours_range" CHECK ("hours" > 0 AND "hours" <= 24)
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_projects_tenant_id" ON "projects" ("tenant_id")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_projects_tenant_status" ON "projects" ("tenant_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_projects_tenant_manager" ON "projects" ("tenant_id", "project_manager_id")`,
    );

    await queryRunner.query(`CREATE INDEX "IDX_tasks_tenant_id" ON "tasks" ("tenant_id")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_tasks_tenant_project" ON "tasks" ("tenant_id", "project_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tasks_tenant_assignee" ON "tasks" ("tenant_id", "assignee_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tasks_tenant_status" ON "tasks" ("tenant_id", "status")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_task_dependencies_tenant_task" ON "task_dependencies" ("tenant_id", "task_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_task_dependencies_tenant_depends" ON "task_dependencies" ("tenant_id", "depends_on_task_id")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_time_entries_tenant_user" ON "time_entries" ("tenant_id", "user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_time_entries_tenant_task" ON "time_entries" ("tenant_id", "task_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_time_entries_tenant_project" ON "time_entries" ("tenant_id", "project_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_time_entries_tenant_date" ON "time_entries" ("tenant_id", "date")`,
    );

    await queryRunner.query(`
      ALTER TABLE "projects"
      ADD CONSTRAINT "FK_projects_project_manager"
      FOREIGN KEY ("project_manager_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks"
      ADD CONSTRAINT "FK_tasks_project"
      FOREIGN KEY ("project_id") REFERENCES "projects"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "tasks"
      ADD CONSTRAINT "FK_tasks_parent_task"
      FOREIGN KEY ("parent_task_id") REFERENCES "tasks"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "tasks"
      ADD CONSTRAINT "FK_tasks_assignee"
      FOREIGN KEY ("assignee_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "task_dependencies"
      ADD CONSTRAINT "FK_task_dependencies_task"
      FOREIGN KEY ("task_id") REFERENCES "tasks"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "task_dependencies"
      ADD CONSTRAINT "FK_task_dependencies_depends_on"
      FOREIGN KEY ("depends_on_task_id") REFERENCES "tasks"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "time_entries"
      ADD CONSTRAINT "FK_time_entries_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "time_entries"
      ADD CONSTRAINT "FK_time_entries_task"
      FOREIGN KEY ("task_id") REFERENCES "tasks"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "time_entries"
      ADD CONSTRAINT "FK_time_entries_project"
      FOREIGN KEY ("project_id") REFERENCES "projects"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "time_entries" DROP CONSTRAINT "FK_time_entries_project"`);
    await queryRunner.query(`ALTER TABLE "time_entries" DROP CONSTRAINT "FK_time_entries_task"`);
    await queryRunner.query(`ALTER TABLE "time_entries" DROP CONSTRAINT "FK_time_entries_user"`);
    await queryRunner.query(
      `ALTER TABLE "task_dependencies" DROP CONSTRAINT "FK_task_dependencies_depends_on"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_dependencies" DROP CONSTRAINT "FK_task_dependencies_task"`,
    );
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_assignee"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_parent_task"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_project"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_projects_project_manager"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_time_entries_tenant_date"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_time_entries_tenant_project"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_time_entries_tenant_task"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_time_entries_tenant_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_task_dependencies_tenant_depends"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_task_dependencies_tenant_task"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tasks_tenant_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tasks_tenant_assignee"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tasks_tenant_project"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tasks_tenant_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_projects_tenant_manager"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_projects_tenant_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_projects_tenant_id"`);

    await queryRunner.query(`DROP TABLE "time_entries"`);
    await queryRunner.query(`DROP TABLE "task_dependencies"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TABLE "projects"`);

    await queryRunner.query(`DROP TYPE "public"."task_dependencies_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tasks_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tasks_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."projects_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."projects_status_enum"`);
  }
}
