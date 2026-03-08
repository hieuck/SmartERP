#!/usr/bin/env python3
"""
Fix workflow and utilities controller errors
"""

import re
from pathlib import Path

def main():
    backend_dir = Path(__file__).parent
    
    # Fix 1: workflow.controller.ts - remove extra parameters
    workflow_controller = backend_dir / 'platform/workflow/workflow.controller.ts'
    if workflow_controller.exists():
        content = workflow_controller.read_text(encoding='utf-8')
        # Fix approveStep - remove approvedBy parameter
        content = re.sub(
            r'return this\.workflowService\.approveStep\(user, id, approvedBy, notes\)',
            r'return this.workflowService.approveStep(user, id, notes)',
            content
        )
        # Fix rejectStep - remove rejectedBy parameter
        content = re.sub(
            r'return this\.workflowService\.rejectStep\(user, id, rejectedBy, notes\)',
            r'return this.workflowService.rejectStep(user, id, notes)',
            content
        )
        workflow_controller.write_text(content, encoding='utf-8')
        print("✓ Fixed: workflow.controller.ts")
    
    # Fix 2: import-export.controller.ts - fix parameter order
    import_export_controller = backend_dir / 'utilities/import-export/import-export.controller.ts'
    if import_export_controller.exists():
        content = import_export_controller.read_text(encoding='utf-8')
        # Fix exportToCSV
        content = re.sub(
            r'await this\.importExportService\.exportToCSV\(user, entityType, data\)',
            r'await this.importExportService.exportToCSV(entityType, data, user)',
            content
        )
        # Fix importFromCSV
        content = re.sub(
            r'return this\.importExportService\.importFromCSV\(user, entityType, csvContent\)',
            r'return this.importExportService.importFromCSV(entityType, csvContent, user)',
            content
        )
        import_export_controller.write_text(content, encoding='utf-8')
        print("✓ Fixed: import-export.controller.ts")
    
    # Fix 3: scheduled-jobs.controller.ts - fix parameter order
    scheduled_jobs_controller = backend_dir / 'utilities/scheduled-jobs/scheduled-jobs.controller.ts'
    if scheduled_jobs_controller.exists():
        content = scheduled_jobs_controller.read_text(encoding='utf-8')
        # Fix listJobs
        content = re.sub(
            r'return this\.scheduledJobsService\.listJobs\(user\)',
            r'return this.scheduledJobsService.listJobs(user.tenantId)',
            content
        )
        scheduled_jobs_controller.write_text(content, encoding='utf-8')
        print("✓ Fixed: scheduled-jobs.controller.ts")
    
    print("\n✅ All workflow and utilities fixes applied!")

if __name__ == '__main__':
    main()
