#!/usr/bin/env python3
"""
Fix last remaining TypeScript compilation errors
"""

import re
from pathlib import Path

def main():
    backend_dir = Path(__file__).parent
    
    # Fix 1: reports.service.ts - entryDate -> date
    reports_service = backend_dir / 'domains/accounting/reports/reports.service.ts'
    if reports_service.exists():
        content = reports_service.read_text(encoding='utf-8')
        content = content.replace('line.entry.entryDate', 'line.entry.date')
        reports_service.write_text(content, encoding='utf-8')
        print("✓ Fixed: reports.service.ts (entryDate -> date)")
    
    # Fix 2: reports.controller.ts - add user parameter
    reports_controller = backend_dir / 'domains/accounting/reports/reports.controller.ts'
    if reports_controller.exists():
        content = reports_controller.read_text(encoding='utf-8')
        # Fix first occurrence
        content = re.sub(
            r'return this\.reportsService\.getBalanceSheet\(\s*user\.tenantId,',
            r'return this.reportsService.getBalanceSheet(\n      user,\n      user.tenantId,',
            content,
            count=1
        )
        # Fix second occurrence
        content = re.sub(
            r'return this\.reportsService\.getProfitAndLoss\(\s*user\.tenantId,',
            r'return this.reportsService.getProfitAndLoss(\n      user,\n      user.tenantId,',
            content,
            count=1
        )
        reports_controller.write_text(content, encoding='utf-8')
        print("✓ Fixed: reports.controller.ts (added user parameter)")
    
    # Fix 3: order.entity.ts - fix User relation
    order_entity = backend_dir / 'domains/ecommerce/order/entities/order.entity.ts'
    if order_entity.exists():
        content = order_entity.read_text(encoding='utf-8')
        content = content.replace("@ManyToOne(() => 'User', { nullable: true })", "@ManyToOne('User', { nullable: true })")
        order_entity.write_text(content, encoding='utf-8')
        print("✓ Fixed: order.entity.ts (User relation)")
    
    # Fix 4: ecommerce order.controller.ts - add missing imports and fix methods
    ecom_order_controller = backend_dir / 'domains/ecommerce/order/order.controller.ts'
    if ecom_order_controller.exists():
        content = ecom_order_controller.read_text(encoding='utf-8')
        
        # Add CurrentUser import if missing
        if 'CurrentUser' not in content or '@CurrentUser' not in content:
            # Find import section
            if "from '@nestjs/common'" in content:
                content = re.sub(
                    r"(import \{[^}]+\} from '@nestjs/common';)",
                    r"\1\nimport { CurrentUser } from '@/common/decorators/current-user.decorator';\nimport { User } from '@/common/security/permission.service';",
                    content
                )
        
        # Fix findAll method - add @CurrentUser
        content = re.sub(
            r'(@Get\(\)\s+@ApiOperation[^}]+\}\s+@ApiResponse[^}]+\}\s+async findAll\()',
            r'\1@CurrentUser() user: User, ',
            content
        )
        
        # Fix findByCustomer - ensure correct decorator
        content = re.sub(
            r'async findByCustomer\(@CurrentUser\(\) user: User, @Param\(\'customerId\'\) customerId: string\)',
            r'async findByCustomer(@Param(\'customerId\') customerId: string, @CurrentUser() user: User)',
            content
        )
        
        # Fix service call parameter order
        content = re.sub(
            r'return this\.orderService\.findByCustomer\(user, customerId\)',
            r'return this.orderService.findByCustomer(customerId, user)',
            content
        )
        
        ecom_order_controller.write_text(content, encoding='utf-8')
        print("✓ Fixed: ecommerce order.controller.ts (imports and methods)")
    
    print("\n✅ All fixes applied!")

if __name__ == '__main__':
    main()
