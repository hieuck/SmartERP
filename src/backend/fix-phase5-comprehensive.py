#!/usr/bin/env python3
"""
Phase 5: Comprehensive fixes for remaining 236 errors
Following Odoo/ERPNext pattern: User object first
"""

import os
import re

def fix_payment_gateway_controller_user_import(file_path):
    """Add User import to payment-gateway controller"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add User import if missing
    if "import { User }" not in content:
        current_user_import = re.search(r"(import \{ CurrentUser \}[^\n]+)", content)
        if current_user_import:
            new_import = "\nimport { User } from '@/common/security/permission.service';"
            content = content.replace(current_user_import.group(1), current_user_import.group(1) + new_import)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✓ Added User import")
            return True
    return False

def fix_shipping_controller_user_import(file_path):
    """Add User import to shipping controller"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add User import if missing
    if "import { User }" not in content:
        current_user_import = re.search(r"(import \{ CurrentUser \}[^\n]+)", content)
        if current_user_import:
            new_import = "\nimport { User } from '@/common/security/permission.service';"
            content = content.replace(current_user_import.group(1), current_user_import.group(1) + new_import)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✓ Added User import")
            return True
    return False

def fix_integration_service(file_path):
    """Fix integration service - change tenantId to user parameter"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix all method signatures to use User instead of tenantId
    content = re.sub(
        r'async listIntegrations\(tenantId: string\)',
        'async listIntegrations(user: User)',
        content
    )
    
    content = re.sub(
        r'async getIntegration\(tenantId: string, name: string\)',
        'async getIntegration(user: User, name: string)',
        content
    )
    
    content = re.sub(
        r'async configure\(tenantId: string, integration: IntegrationConfig\)',
        'async configure(user: User, integration: IntegrationConfig)',
        content
    )
    
    content = re.sub(
        r'async removeIntegration\(tenantId: string, name: string\)',
        'async removeIntegration(user: User, name: string)',
        content
    )
    
    content = re.sub(
        r'async processPayment\(tenantId: string,',
        'async processPayment(user: User,',
        content
    )
    
    content = re.sub(
        r'async createShipment\(tenantId: string,',
        'async createShipment(user: User,',
        content
    )
    
    # Fix implementations to use user.tenantId
    content = re.sub(
        r'const key = `integration:config:\${tenantId}:\${',
        'const key = `integration:config:${user.tenantId}:${',
        content
    )
    
    content = re.sub(
        r'const key = `integration:config:\${tenantId}`;',
        'const key = `integration:config:${user.tenantId}`;',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed integration service")

def fix_project_controllers_imports(file_path):
    """Fix project controllers import paths"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix RolesGuard import
    content = re.sub(
        r"import \{ RolesGuard \} from '../../../common/guards/roles\.guard';",
        "import { RolesGuard } from '@/core/auth/guards/roles.guard';",
        content
    )
    
    # Fix Roles decorator import
    content = re.sub(
        r"import \{ Roles \} from '../../../common/decorators/roles\.decorator';",
        "import { Roles } from '@/common/decorators/roles.decorator';",
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed import paths")

def fix_sales_order_entity_imports(file_path):
    """Fix sales order entity import paths"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix Invoice import
    content = re.sub(
        r"import \{ Invoice \} from '../../accounting/entities/invoice\.entity';",
        "import { Invoice } from '../../../accounting/account/entities/invoice.entity';",
        content
    )
    
    # Fix Payment import
    content = re.sub(
        r"import \{ Payment \} from '../../payment/entities/payment\.entity';",
        "import { Payment } from '../../../accounting/payment/entities/payment.entity';",
        content
    )
    
    # Fix OneToMany relations - remove incorrect inverse side
    content = re.sub(
        r'@OneToMany\(\(\) => Invoice, \(invoice\) => invoice\.id, \{ nullable: true \}\)',
        '@OneToMany(() => Invoice, (invoice) => invoice.orderId, { nullable: true })',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed sales order entity imports")

def fix_sales_crm_controller(file_path):
    """Fix sales CRM controller import"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix TenantId decorator import
    content = re.sub(
        r"import \{ TenantId \} from '../../common/decorators/tenant-id\.decorator';",
        "import { TenantId } from '@/common/decorators/tenant-id.decorator';",
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed CRM controller import")

def fix_platform_services_user_param(file_path, service_name):
    """Fix platform services to use User instead of tenantId"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Common patterns to fix
    patterns = [
        (r'async findAll\w*\(tenantId: string', 'async findAll(user: User'),
        (r'async findById\(tenantId: string,', 'async findById(user: User,'),
        (r'async create\w*\(tenantId: string,', 'async create(user: User,'),
        (r'async update\w*\(tenantId: string,', 'async update(user: User,'),
        (r'async delete\w*\(tenantId: string,', 'async delete(user: User,'),
        (r'async search\(tenantId: string,', 'async search(user: User,'),
        (r'async sendEmail\(tenantId: string,', 'async sendEmail(user: User,'),
        (r'async sendTemplateEmail\(tenantId: string,', 'async sendTemplateEmail(user: User,'),
    ]
    
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)
    
    # Fix implementations
    content = re.sub(r'where: \{ tenantId \}', 'where: { tenantId: user.tenantId }', content)
    content = re.sub(r'tenantId,', 'tenantId: user.tenantId,', content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed {service_name}")

def fix_workflow_controller_issues(file_path):
    """Fix workflow controller parameter issues"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix initiateWorkflow method - remove extra parameters
    content = re.sub(
        r'return this\.workflowService\.initiateWorkflow\(\s*user,\s*workflowId,\s*entityType,\s*entityId,\s*tenantId,\s*initiatedBy,\s*\);',
        'return this.workflowService.initiateWorkflow(user, workflowId, entityType, entityId);',
        content
    )
    
    # Add tenantId variable if needed
    if 'tenantId,' in content and 'const tenantId' not in content:
        # Find the method that uses tenantId
        method_match = re.search(r'(async initiateWorkflow[^{]+\{)', content)
        if method_match:
            new_line = '\n    const tenantId = user.tenantId;'
            content = content.replace(method_match.group(1), method_match.group(1) + new_line)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed workflow controller")

def fix_import_export_controller(file_path):
    """Fix import-export controller parameter order"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix exportToCSV call - swap data and user parameters
    content = re.sub(
        r'const csv = await this\.importExportService\.exportToCSV\(entityType, data, user\);',
        'const csv = await this.importExportService.exportToCSV(entityType, user, data);',
        content
    )
    
    # Fix importFromCSV call - swap csvContent and user parameters
    content = re.sub(
        r'return this\.importExportService\.importFromCSV\(entityType, csvContent, user\);',
        'return this.importExportService.importFromCSV(entityType, user, csvContent);',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed import-export controller")

def main():
    print("=" * 80)
    print("PHASE 5: COMPREHENSIVE FIXES FOR REMAINING ERRORS")
    print("Following Odoo/ERPNext pattern: User object first")
    print("=" * 80)
    
    base_path = os.path.dirname(os.path.abspath(__file__))
    
    # Fix integration controllers
    print("\n[Integration Controllers]")
    
    payment_gateway_controller = os.path.join(base_path, 'integrations/payment-gateway/payment-gateway.controller.ts')
    if os.path.exists(payment_gateway_controller):
        print(f"\n📝 payment-gateway.controller.ts")
        fix_payment_gateway_controller_user_import(payment_gateway_controller)
    
    shipping_controller = os.path.join(base_path, 'integrations/shipping/shipping.controller.ts')
    if os.path.exists(shipping_controller):
        print(f"\n📝 shipping.controller.ts")
        fix_shipping_controller_user_import(shipping_controller)
    
    integration_service = os.path.join(base_path, 'integrations/integration/integration.service.ts')
    if os.path.exists(integration_service):
        print(f"\n📝 integration.service.ts")
        fix_integration_service(integration_service)
    
    # Fix project controllers
    print("\n[Project Controllers]")
    
    project_files = [
        'domains/project/project.controller.ts',
        'domains/project/task.controller.ts',
        'domains/project/time-tracking.controller.ts',
    ]
    
    for file_rel in project_files:
        file_path = os.path.join(base_path, file_rel)
        if os.path.exists(file_path):
            print(f"\n📝 {file_rel}")
            fix_project_controllers_imports(file_path)
    
    # Fix sales entities
    print("\n[Sales Entities]")
    
    sales_order_entity = os.path.join(base_path, 'domains/sales/order/entities/order.entity.ts')
    if os.path.exists(sales_order_entity):
        print(f"\n📝 sales order.entity.ts")
        fix_sales_order_entity_imports(sales_order_entity)
    
    sales_crm_controller = os.path.join(base_path, 'domains/sales/crm/crm.controller.ts')
    if os.path.exists(sales_crm_controller):
        print(f"\n📝 sales crm.controller.ts")
        fix_sales_crm_controller(sales_crm_controller)
    
    # Fix platform services
    print("\n[Platform Services]")
    
    email_service = os.path.join(base_path, 'platform/email/email.service.ts')
    if os.path.exists(email_service):
        print(f"\n📝 email.service.ts")
        fix_platform_services_user_param(email_service, 'email service')
    
    search_service = os.path.join(base_path, 'platform/search/search.service.ts')
    if os.path.exists(search_service):
        print(f"\n📝 search.service.ts")
        fix_platform_services_user_param(search_service, 'search service')
    
    # Fix workflow controller
    print("\n[Workflow Controller]")
    
    workflow_controller = os.path.join(base_path, 'platform/workflow/workflow.controller.ts')
    if os.path.exists(workflow_controller):
        print(f"\n📝 workflow.controller.ts")
        fix_workflow_controller_issues(workflow_controller)
    
    # Fix import-export controller
    print("\n[Import-Export Controller]")
    
    import_export_controller = os.path.join(base_path, 'utilities/import-export/import-export.controller.ts')
    if os.path.exists(import_export_controller):
        print(f"\n📝 import-export.controller.ts")
        fix_import_export_controller(import_export_controller)
    
    print("\n" + "=" * 80)
    print("✅ PHASE 5 COMPLETED")
    print("=" * 80)
    print("\nNext: Run 'npm run build' to check remaining errors")

if __name__ == '__main__':
    main()
