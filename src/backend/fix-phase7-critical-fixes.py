#!/usr/bin/env python3
"""
Phase 7: Critical fixes for remaining major issues
- Fix integration services (User import and parameter usage)
- Fix email service (syntax errors and User parameter)
- Fix search service (User parameter)
- Fix platform services
- Fix manufacturing services missing methods
"""

import os
import re

def fix_integration_service_comprehensive(file_path):
    """Fix integration service - add User import and fix all usages"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add User import at the top
    if "import { User }" not in content:
        # Find Injectable import
        injectable_match = re.search(r"(import \{ Injectable[^}]*\} from '@nestjs/common';)", content)
        if injectable_match:
            new_import = "\nimport { User } from '@/common/security/permission.service';"
            content = content.replace(injectable_match.group(1), injectable_match.group(1) + new_import)
            print(f"  ✓ Added User import")
    
    # Fix all tenantId references to user.tenantId
    content = re.sub(r'`\$\{tenantId\}:', r'`${user.tenantId}:', content)
    content = re.sub(r'tenant \$\{tenantId\}', r'tenant ${user.tenantId}', content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed integration service")

def fix_payment_gateway_service(file_path):
    """Fix payment gateway service - change tenantId to user"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix method signatures
    patterns = [
        (r'async createPayment\(tenantId: string,', 'async createPayment(user: User,'),
        (r'async verifyPayment\(tenantId: string,', 'async verifyPayment(user: User,'),
        (r'async handleWebhook\(tenantId: string,', 'async handleWebhook(user: User,'),
        (r'async refundPayment\(tenantId: string,', 'async refundPayment(user: User,'),
        (r'async getTransaction\(tenantId: string,', 'async getTransaction(user: User,'),
        (r'async listTransactions\(tenantId: string,', 'async listTransactions(user: User,'),
    ]
    
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)
    
    # Fix tenantId usages
    content = re.sub(r'where: \{ tenantId \}', 'where: { tenantId: user.tenantId }', content)
    content = re.sub(r'tenantId,', 'tenantId: user.tenantId,', content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed payment gateway service")

def fix_shipping_service(file_path):
    """Fix shipping service - change tenantId to user"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix method signatures
    patterns = [
        (r'async createShipment\(tenantId: string,', 'async createShipment(user: User,'),
        (r'async calculateFee\(tenantId: string,', 'async calculateFee(user: User,'),
        (r'async trackShipment\(tenantId: string,', 'async trackShipment(user: User,'),
        (r'async cancelShipment\(tenantId: string,', 'async cancelShipment(user: User,'),
        (r'async getShipment\(tenantId: string,', 'async getShipment(user: User,'),
        (r'async listShipments\(tenantId: string,', 'async listShipments(user: User,'),
    ]
    
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)
    
    # Fix tenantId usages
    content = re.sub(r'where: \{ tenantId \}', 'where: { tenantId: user.tenantId }', content)
    content = re.sub(r'tenantId,', 'tenantId: user.tenantId,', content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed shipping service")

def fix_email_service_comprehensive(file_path):
    """Fix email service - fix all syntax errors and User parameter"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add User import if missing
    if "import { User }" not in content:
        injectable_match = re.search(r"(import \{ Injectable[^}]*\} from '@nestjs/common';)", content)
        if injectable_match:
            new_import = "\nimport { User } from '@/common/security/permission.service';"
            content = content.replace(injectable_match.group(1), injectable_match.group(1) + new_import)
    
    # Remove duplicate findAll methods - keep only the first one and rename to findAllTemplates
    content = re.sub(
        r'async findAll\(user: User\): Promise<EmailTemplate\[\]> \{',
        'async findAllTemplates(user: User): Promise<EmailTemplate[]> {',
        content,
        count=1
    )
    
    # Remove second findAll (for EmailLog)
    content = re.sub(
        r'async findAll\(user: User\): Promise<EmailLog\[\]> \{',
        'async findAllLogs(user: User): Promise<EmailLog[]> {',
        content
    )
    
    # Fix tenantId references
    content = re.sub(r'`email-template:all:\$\{tenantId\}`', r'`email-template:all:${user.tenantId}`', content)
    
    # Fix findTemplateById calls with wrong syntax
    content = re.sub(
        r'await this\.findTemplateById\(tenantId: user\.tenantId, id\)',
        'await this.findTemplateById(user, id)',
        content
    )
    
    content = re.sub(
        r'return this\.findTemplateById\(tenantId: user\.tenantId, id\)',
        'return this.findTemplateById(user, id)',
        content
    )
    
    # Fix update method
    content = re.sub(
        r'async update\(user: User, id: string, data',
        'async updateTemplate(user: User, id: string, data',
        content
    )
    
    # Fix delete method
    content = re.sub(
        r'async delete\(user: User, id: string\)',
        'async deleteTemplate(user: User, id: string)',
        content
    )
    
    # Fix create method
    content = re.sub(
        r'async create\(user: User, data: Partial<EmailTemplate>\)',
        'async createTemplate(user: User, data: Partial<EmailTemplate>)',
        content
    )
    
    # Fix tenantId references in where clauses
    content = re.sub(r'tenantId: user\.tenantId', r'tenantId: user.tenantId', content)
    
    # Fix sendEmail calls
    content = re.sub(
        r'const log = await this\.sendEmail\(tenantId: user\.tenantId,',
        'const log = await this.sendEmail(user,',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed email service")

def fix_search_service_comprehensive(file_path):
    """Fix search service - fix User parameter and tenantId usage"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add User import if missing
    if "import { User }" not in content:
        injectable_match = re.search(r"(import \{ Injectable[^}]*\} from '@nestjs/common';)", content)
        if injectable_match:
            new_import = "\nimport { User } from '@/common/security/permission.service';"
            content = content.replace(injectable_match.group(1), injectable_match.group(1) + new_import)
    
    # Fix generateCacheKey calls
    content = re.sub(
        r"generateCacheKey\('search', tenantId: user\.tenantId,",
        "generateCacheKey('search', user.tenantId,",
        content
    )
    
    # Fix tenantId shorthand in where clauses
    content = re.sub(
        r"\.where\('(\w+)\.tenantId = :tenantId', \{ tenantId \}\)",
        r".where('\1.tenantId = :tenantId', { tenantId: user.tenantId })",
        content
    )
    
    # Fix search calls
    content = re.sub(
        r'await this\.search\(tenantId: user\.tenantId, query\)',
        'await this.search(user, query)',
        content
    )
    
    # Fix searchByType signature
    content = re.sub(
        r'async searchByType\(user: User, type: string, query: string\)',
        'async searchByType(user: User, type: string, query: string)',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed search service")

def fix_audit_service_repository_name(file_path):
    """Fix audit service - use correct repository name"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace auditLogRepository with auditRepository
    content = content.replace('this.auditLogRepository', 'this.auditRepository')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed audit service repository name")

def fix_routing_service_add_missing_methods(file_path):
    """Add missing methods to routing service"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if methods already exist
    if 'async findByProduct(' in content and 'async removeOperation(' in content:
        print(f"  ✓ Methods already exist")
        return
    
    # Find the last method (update) and add new methods after it
    last_method_match = re.search(r'(  async update\([^}]+\}\n  \})', content, re.DOTALL)
    if last_method_match:
        new_methods = '''

  async findByProduct(productId: string, tenantId: string): Promise<Routing[]> {
    const routings = await this.routingRepository.find({
      where: { tenantId },
      relations: ['bom', 'operations', 'operations.workCenter'],
    });
    return routings.filter(r => r.bom?.productId === productId);
  }

  async removeOperation(routingId: string, operationId: string, tenantId: string, user: any): Promise<void> {
    const routing = await this.findOne(routingId, tenantId);
    const operation = await this.operationRepository.findOne({
      where: { id: operationId, routingId: routing.id, tenantId },
    });
    
    if (!operation) {
      throw new NotFoundException(`Operation with ID ${operationId} not found`);
    }
    
    await this.operationRepository.remove(operation);
  }

  async calculateTotalCost(id: string, tenantId: string): Promise<number> {
    const routing = await this.findOne(id, tenantId);
    
    if (!routing.operations || routing.operations.length === 0) {
      return 0;
    }
    
    return routing.operations.reduce((total, op) => {
      const opCost = (op.durationExpected / 60) * (op.costPerHour || 0);
      return total + opCost;
    }, 0);
  }

  async remove(id: string, tenantId: string, user: any): Promise<void> {
    const routing = await this.findOne(id, tenantId);
    await this.routingRepository.remove(routing);
  }'''
        
        content = content.replace(last_method_match.group(1), last_method_match.group(1) + new_methods)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✓ Added missing methods to routing service")

def fix_work_order_service_add_missing_method(file_path):
    """Add missing findByBOM method to work-order service"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if method already exists
    if 'async findByBOM(' in content:
        print(f"  ✓ Method already exists")
        return
    
    # Find findByStatus method and add findByBOM after it
    find_by_status_match = re.search(r'(  async findByStatus\([^}]+\}\n  \})', content, re.DOTALL)
    if find_by_status_match:
        new_method = '''

  async findByBOM(bomId: string, tenantId: string): Promise<WorkOrder[]> {
    return this.workOrderRepository.find({
      where: { tenantId, bomId },
      relations: ['product', 'bom', 'responsible'],
      order: { createdAt: 'DESC' },
    });
  }'''
        
        content = content.replace(find_by_status_match.group(1), find_by_status_match.group(1) + new_method)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✓ Added findByBOM method to work-order service")

def fix_work_center_service_add_missing_method(file_path):
    """Add missing remove method to work-center service"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if method already exists
    if 'async remove(' in content:
        print(f"  ✓ Method already exists")
        return
    
    # Find the last method and add remove method
    last_method_match = re.search(r'(  async update\([^}]+\}\n  \})', content, re.DOTALL)
    if last_method_match:
        new_method = '''

  async remove(id: string, tenantId: string, user: any): Promise<void> {
    const workCenter = await this.findOne(id, tenantId);
    await this.workCenterRepository.remove(workCenter);
  }'''
        
        content = content.replace(last_method_match.group(1), last_method_match.group(1) + new_method)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✓ Added remove method to work-center service")

def fix_import_export_service(file_path):
    """Fix import-export service parameter order"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix exportToCSV signature
    content = re.sub(
        r'async exportToCSV\(entityType: string, data: Record<string, unknown>\[\], tenantId: string\)',
        'async exportToCSV(entityType: string, user: User, data: Record<string, unknown>[])',
        content
    )
    
    # Fix importFromCSV signature
    content = re.sub(
        r'async importFromCSV\(entityType: string, csvContent: string, tenantId: string\)',
        'async importFromCSV(entityType: string, user: User, csvContent: string)',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed import-export service")

def main():
    print("=" * 80)
    print("PHASE 7: CRITICAL FIXES FOR REMAINING MAJOR ISSUES")
    print("Following Odoo/ERPNext pattern: User object first")
    print("=" * 80)
    
    base_path = os.path.dirname(os.path.abspath(__file__))
    
    # Fix integration services
    print("\n[Integration Services]")
    
    integration_service = os.path.join(base_path, 'integrations/integration/integration.service.ts')
    if os.path.exists(integration_service):
        print(f"\n📝 integration.service.ts")
        fix_integration_service_comprehensive(integration_service)
    
    payment_gateway_service = os.path.join(base_path, 'integrations/payment-gateway/payment-gateway.service.ts')
    if os.path.exists(payment_gateway_service):
        print(f"\n📝 payment-gateway.service.ts")
        fix_payment_gateway_service(payment_gateway_service)
    
    shipping_service = os.path.join(base_path, 'integrations/shipping/shipping.service.ts')
    if os.path.exists(shipping_service):
        print(f"\n📝 shipping.service.ts")
        fix_shipping_service(shipping_service)
    
    # Fix platform services
    print("\n[Platform Services]")
    
    email_service = os.path.join(base_path, 'platform/email/email.service.ts')
    if os.path.exists(email_service):
        print(f"\n📝 email.service.ts")
        fix_email_service_comprehensive(email_service)
    
    search_service = os.path.join(base_path, 'platform/search/search.service.ts')
    if os.path.exists(search_service):
        print(f"\n📝 search.service.ts")
        fix_search_service_comprehensive(search_service)
    
    audit_service = os.path.join(base_path, 'platform/audit/audit.service.ts')
    if os.path.exists(audit_service):
        print(f"\n📝 audit.service.ts")
        fix_audit_service_repository_name(audit_service)
    
    # Fix manufacturing services
    print("\n[Manufacturing Services]")
    
    routing_service = os.path.join(base_path, 'domains/manufacturing/routing/routing.service.ts')
    if os.path.exists(routing_service):
        print(f"\n📝 routing.service.ts")
        fix_routing_service_add_missing_methods(routing_service)
    
    work_order_service = os.path.join(base_path, 'domains/manufacturing/work-order/work-order.service.ts')
    if os.path.exists(work_order_service):
        print(f"\n📝 work-order.service.ts")
        fix_work_order_service_add_missing_method(work_order_service)
    
    work_center_service = os.path.join(base_path, 'domains/manufacturing/work-center/work-center.service.ts')
    if os.path.exists(work_center_service):
        print(f"\n📝 work-center.service.ts")
        fix_work_center_service_add_missing_method(work_center_service)
    
    # Fix utilities
    print("\n[Utilities]")
    
    import_export_service = os.path.join(base_path, 'utilities/import-export/import-export.service.ts')
    if os.path.exists(import_export_service):
        print(f"\n📝 import-export.service.ts")
        fix_import_export_service(import_export_service)
    
    print("\n" + "=" * 80)
    print("✅ PHASE 7 COMPLETED")
    print("=" * 80)
    print("\nNext: Run 'npm run build' to check remaining errors")
    print("\nNote: Some errors may still remain:")
    print("  - SecureRepository type constraints (need manual fix)")
    print("  - Some entity field issues")
    print("  - Import paths for dashboard/search services")

if __name__ == '__main__':
    main()
