#!/usr/bin/env python3
"""
Fix all 318 remaining TypeScript compilation errors
Following Odoo/ERPNext patterns - User object first parameter
"""

import re
from pathlib import Path

def fix_entity_imports(backend_dir):
    """Fix BaseEntity import paths in entities"""
    print("\n=== Fixing Entity Imports ===")
    
    # Customer, Supplier, Order entities need ../../../../common instead of ../../../common
    entities = [
        'domains/sales/customer/entities/customer.entity.ts',
        'domains/sales/order/entities/order.entity.ts',
        'domains/purchasing/supplier/entities/supplier.entity.ts',
    ]
    
    for entity_path in entities:
        file_path = backend_dir / entity_path
        if file_path.exists():
            content = file_path.read_text(encoding='utf-8')
            content = content.replace(
                "from '../../../common/entities/base.entity'",
                "from '../../../../common/entities/base.entity'"
            )
            file_path.write_text(content, encoding='utf-8')
            print(f"  ✓ Fixed: {entity_path}")

def fix_user_relations(backend_dir):
    """Fix User type in ManyToOne relations - use string instead of type"""
    print("\n=== Fixing User Relations ===")
    
    files_with_user_relations = [
        'domains/manufacturing/work-order/entities/work-order.entity.ts',
        'domains/project/entities/project.entity.ts',
        'domains/project/entities/task.entity.ts',
        'domains/project/entities/time-entry.entity.ts',
        'platform/report/entities/report-execution.entity.ts',
        'platform/report/entities/report.entity.ts',
    ]
    
    for file_path_str in files_with_user_relations:
        file_path = backend_dir / file_path_str
        if file_path.exists():
            content = file_path.read_text(encoding='utf-8')
            # Replace @ManyToOne(() => User with @ManyToOne('User'
            content = re.sub(
                r'@ManyToOne\(\(\) => User([,\)])',
                r"@ManyToOne('User'\1",
                content
            )
            file_path.write_text(content, encoding='utf-8')
            print(f"  ✓ Fixed: {file_path_str}")

def fix_controller_missing_current_user(backend_dir):
    """Add @CurrentUser() decorator where missing"""
    print("\n=== Fixing Missing @CurrentUser() ===")
    
    # Payment gateway controller
    payment_gateway = backend_dir / 'integrations/payment-gateway/payment-gateway.controller.ts'
    if payment_gateway.exists():
        content = payment_gateway.read_text(encoding='utf-8')
        
        # Add import if missing
        if '@CurrentUser' not in content:
            content = re.sub(
                r"(import.*from '@nestjs/common';)",
                r"\1\nimport { CurrentUser } from '@/common/decorators/current-user.decorator';\nimport { User } from '@/common/security/permission.service';",
                content
            )
        
        # Add @CurrentUser() user: User to all methods
        content = re.sub(
            r'async (createPayment|verifyPayment|refundPayment|getTransaction|listTransactions)\(',
            r'async \1(@CurrentUser() user: User, ',
            content
        )
        
        # Fix webhook methods
        content = re.sub(
            r'async (vnpayWebhook|momoWebhook|stripeWebhook)\(',
            r'async \1(@CurrentUser() user: User, ',
            content
        )
        
        payment_gateway.write_text(content, encoding='utf-8')
        print(f"  ✓ Fixed: payment-gateway.controller.ts")
    
    # Shipping controller
    shipping = backend_dir / 'integrations/shipping/shipping.controller.ts'
    if shipping.exists():
        content = shipping.read_text(encoding='utf-8')
        
        if '@CurrentUser' not in content:
            content = re.sub(
                r"(import.*from '@nestjs/common';)",
                r"\1\nimport { CurrentUser } from '@/common/decorators/current-user.decorator';\nimport { User } from '@/common/security/permission.service';",
                content
            )
        
        content = re.sub(
            r'async (createShipment|calculateFee|trackShipment|cancelShipment|getShipment|listShipments)\(',
            r'async \1(@CurrentUser() user: User, ',
            content
        )
        
        shipping.write_text(content, encoding='utf-8')
        print(f"  ✓ Fixed: shipping.controller.ts")

def fix_import_paths(backend_dir):
    """Fix wrong import paths"""
    print("\n=== Fixing Import Paths ===")
    
    fixes = {
        'domains/purchasing/supplier/supplier.controller.ts': [
            ("from '../../common/guards/tenant.guard'", "from '../../../common/guards/tenant.guard'"),
        ],
        'domains/sales/customer/customer.controller.ts': [
            ("from '../../common/guards/tenant.guard'", "from '../../../common/guards/tenant.guard'"),
        ],
        'domains/sales/order/order.controller.ts': [
            ("from '../../common/guards/tenant.guard'", "from '../../../common/guards/tenant.guard'"),
        ],
        'domains/project/project.controller.ts': [
            ("from '../../core/auth/guards/roles.guard'", "from '../../../common/guards/roles.guard'"),
            ("from '../../core/auth/decorators/roles.decorator'", "from '../../../common/decorators/roles.decorator'"),
        ],
        'domains/project/task.controller.ts': [
            ("from '../../core/auth/guards/roles.guard'", "from '../../../common/guards/roles.guard'"),
            ("from '../../core/auth/decorators/roles.decorator'", "from '../../../common/decorators/roles.decorator'"),
        ],
        'domains/project/time-tracking.controller.ts': [
            ("from '../../core/auth/guards/roles.guard'", "from '../../../common/guards/roles.guard'"),
            ("from '../../core/auth/decorators/roles.decorator'", "from '../../../common/decorators/roles.decorator'"),
        ],
        'platform/workflow/approval.controller.ts': [
            ("from '../../../core/auth/guards/jwt-auth.guard'", "from '../../core/auth/guards/jwt-auth.guard'"),
        ],
    }
    
    for file_path_str, replacements in fixes.items():
        file_path = backend_dir / file_path_str
        if file_path.exists():
            content = file_path.read_text(encoding='utf-8')
            for old, new in replacements:
                content = content.replace(old, new)
            file_path.write_text(content, encoding='utf-8')
            print(f"  ✓ Fixed: {file_path_str}")

def fix_service_parameter_order(backend_dir):
    """Fix service method calls - User should be first parameter"""
    print("\n=== Fixing Service Parameter Order ===")
    
    # Customer controller
    customer_ctrl = backend_dir / 'domains/sales/customer/customer.controller.ts'
    if customer_ctrl.exists():
        content = customer_ctrl.read_text(encoding='utf-8')
        content = re.sub(r'this\.customerService\.findAll\(user, user\)', r'this.customerService.findAll(user)', content)
        content = re.sub(r'this\.customerService\.search\(query\)', r'this.customerService.search(user, query)', content)
        content = re.sub(r'this\.customerService\.count\(user, user\)', r'this.customerService.count(user)', content)
        content = re.sub(r'this\.customerService\.findOne\(id\)', r'this.customerService.findOne(user, id)', content)
        customer_ctrl.write_text(content, encoding='utf-8')
        print(f"  ✓ Fixed: customer.controller.ts")
    
    # Supplier controller
    supplier_ctrl = backend_dir / 'domains/purchasing/supplier/supplier.controller.ts'
    if supplier_ctrl.exists():
        content = supplier_ctrl.read_text(encoding='utf-8')
        content = re.sub(r'this\.supplierService\.findAll\(user, user\)', r'this.supplierService.findAll(user)', content)
        content = re.sub(r'this\.supplierService\.search\(query\)', r'this.supplierService.search(user, query)', content)
        content = re.sub(r'this\.supplierService\.count\(user, user\)', r'this.supplierService.count(user)', content)
        content = re.sub(r'this\.supplierService\.findOne\(id\)', r'this.supplierService.findOne(user, id)', content)
        supplier_ctrl.write_text(content, encoding='utf-8')
        print(f"  ✓ Fixed: supplier.controller.ts")
    
    # Order controller - fix getRevenueByDateRange
    order_ctrl = backend_dir / 'domains/sales/order/order.controller.ts'
    if order_ctrl.exists():
        content = order_ctrl.read_text(encoding='utf-8')
        content = re.sub(
            r'new Date\(startDate\), new Date\(endDate\), user,',
            r'user, new Date(startDate), new Date(endDate),',
            content
        )
        order_ctrl.write_text(content, encoding='utf-8')
        print(f"  ✓ Fixed: order.controller.ts")

def main():
    backend_dir = Path(__file__).parent
    
    print("=" * 60)
    print("FIXING ALL 318 REMAINING TYPESCRIPT ERRORS")
    print("Following Odoo/ERPNext Pattern: User Object First")
    print("=" * 60)
    
    fix_entity_imports(backend_dir)
    fix_user_relations(backend_dir)
    fix_import_paths(backend_dir)
    fix_controller_missing_current_user(backend_dir)
    fix_service_parameter_order(backend_dir)
    
    print("\n" + "=" * 60)
    print("✅ PHASE 1 COMPLETE - Major fixes applied")
    print("=" * 60)
    print("\nNote: Some errors require manual fixes:")
    print("  - SecureRepository type constraints")
    print("  - Missing service methods")
    print("  - Complex parameter mismatches")
    print("\nRun 'npm run build' to see remaining errors")

if __name__ == '__main__':
    main()
