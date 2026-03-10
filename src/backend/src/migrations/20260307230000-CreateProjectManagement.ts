import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjectManagement20260307230000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(`
      CREATE TYPE project_status_enum AS ENUM ('draft', 'active', 'on_hold', 'completed', 'cancelled');
    `);

    await queryRunner.query(`
      CREATE TYPE project_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
    `);

    await queryRunner.query(`
      CREATE TYPE task_status_enum AS ENUM ('todo', 'in_progress', 'in_review', 'blocked', 'completed', 'cancelled');
    `);

    await queryRunner.query(`
      CREATE TYPE task_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
    `);

    await queryRunner.query(`
      CREATE TYPE dependency_type_enum AS ENUM ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish');
    `);

    // Create projects table
    await queryRunner.query(`
      CREATE TABLE projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id VARCHAR NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        status project_status_enum NOT NULL DEFAULT 'draft',
        priority project_priority_enum NOT NULL DEFAULT 'medium',
        start_date DATE,
        end_date DATE,
        actual_start_date DATE,
        actual_end_date DATE,
        estimated_hours DECIMAL(15,2),
        actual_hours DECIMAL(15,2) NOT NULL DEFAULT 0,
        budget DECIMAL(15,2),
        actual_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
        progress INTEGER NOT NULL DEFAULT 0,
        project_manager_id UUID,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by VARCHAR,
        updated_by VARCHAR,
        CONSTRAINT fk_project_manager FOREIGN KEY (project_manager_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Create indexes for projects
    await queryRunner.query(`CREATE INDEX idx_projects_tenant_id ON projects(tenant_id);`);
    await queryRunner.query(`CREATE INDEX idx_projects_tenant_status ON projects(tenant_id, status);`);
    await queryRunner.query(`CREATE INDEX idx_projects_tenant_manager ON projects(tenant_id, project_manager_id);`);

    // Create tasks table
    await queryRunner.query(`
      CREATE TABLE tasks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id VARCHAR NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        status task_status_enum NOT NULL DEFAULT 'todo',
        priority task_priority_enum NOT NULL DEFAULT 'medium',
        project_id UUID NOT NULL,
        parent_task_id UUID,
        assignee_id UUID,
        start_date DATE,
        due_date DATE,
        completed_date DATE,
        estimated_hours DECIMAL(10,2),
        actual_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
        progress INTEGER NOT NULL DEFAULT 0,
        blocked_reason TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by VARCHAR,
        updated_by VARCHAR,
        CONSTRAINT fk_task_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_task_parent FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL,
        CONSTRAINT fk_task_assignee FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Create indexes for tasks
    await queryRunner.query(`CREATE INDEX idx_tasks_tenant_id ON tasks(tenant_id);`);
    await queryRunner.query(`CREATE INDEX idx_tasks_tenant_project ON tasks(tenant_id, project_id);`);
    await queryRunner.query(`CREATE INDEX idx_tasks_tenant_assignee ON tasks(tenant_id, assignee_id);`);
    await queryRunner.query(`CREATE INDEX idx_tasks_tenant_status ON tasks(tenant_id, status);`);

    // Create task_dependencies table
    await queryRunner.query(`
      CREATE TABLE task_dependencies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id VARCHAR NOT NULL,
        task_id UUID NOT NULL,
        depends_on_task_id UUID NOT NULL,
        type dependency_type_enum NOT NULL DEFAULT 'finish_to_start',
        lag_days INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by VARCHAR,
        CONSTRAINT fk_dependency_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        CONSTRAINT fk_dependency_depends_on FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        CONSTRAINT chk_no_self_dependency CHECK (task_id != depends_on_task_id)
      );
    `);

    // Create indexes for task_dependencies
    await queryRunner.query(`CREATE INDEX idx_task_dependencies_tenant_id ON task_dependencies(tenant_id);`);
    await queryRunner.query(`CREATE INDEX idx_task_dependencies_tenant_task ON task_dependencies(tenant_id, task_id);`);
    await queryRunner.query(`CREATE INDEX idx_task_dependencies_tenant_depends ON task_dependencies(tenant_id, depends_on_task_id);`);

    // Create time_entries table
    await queryRunner.query(`
      CREATE TABLE time_entries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id VARCHAR NOT NULL,
        user_id UUID NOT NULL,
        task_id UUID NOT NULL,
        project_id UUID NOT NULL,
        date DATE NOT NULL,
        hours DECIMAL(10,2) NOT NULL,
        description TEXT,
        is_billable BOOLEAN NOT NULL DEFAULT false,
        hourly_rate DECIMAL(15,2),
        cost DECIMAL(15,2),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by VARCHAR,
        updated_by VARCHAR,
        CONSTRAINT fk_time_entry_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_time_entry_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        CONSTRAINT fk_time_entry_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);

    // Create indexes for time_entries
    await queryRunner.query(`CREATE INDEX idx_time_entries_tenant_id ON time_entries(tenant_id);`);
    await queryRunner.query(`CREATE INDEX idx_time_entries_tenant_user ON time_entries(tenant_id, user_id);`);
    await queryRunner.query(`CREATE INDEX idx_time_entries_tenant_task ON time_entries(tenant_id, task_id);`);
    await queryRunner.query(`CREATE INDEX idx_time_entries_tenant_project ON time_entries(tenant_id, project_id);`);
    await queryRunner.query(`CREATE INDEX idx_time_entries_tenant_date ON time_entries(tenant_id, date);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS time_entries;`);
    await queryRunner.query(`DROP TABLE IF EXISTS task_dependencies;`);
    await queryRunner.query(`DROP TABLE IF EXISTS tasks;`);
    await queryRunner.query(`DROP TABLE IF EXISTS projects;`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS dependency_type_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS task_priority_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS task_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS project_priority_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS project_status_enum;`);
  }
}
