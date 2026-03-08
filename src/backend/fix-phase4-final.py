#!/usr/bin/env python3
"""
Phase 4: Final comprehensive fixes
- Add missing @CurrentUser imports
- Fix all service parameter orders
- Fix HR module import paths
"""

import os
import re

def add_current_user_import(file_path):
    """Add @CurrentUser import if missing"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if @CurrentUser is used but not imported
    if '@CurrentUser()' in content and "import { CurrentUser }" not in content:
        # Find the last import from @nestjs/common
        nestjs_import_match = re.search(r"(import \{[^}]+\} from '@nestjs/common';)", content)
        if nestjs_import_match:
            new_import = "\nimport { CurrentUser } from '@/common/decorators/current-user.decorator';"
            content = content.replace(nestjs_import_match.group(1), nestjs_import_match.group(1) + new_import)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
    return False

def fix_ecommerce_order_controller_comprehensive(file_path):
    """Comprehensive fix for ecommerce order controller"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add @CurrentUser import
    if "import { CurrentUser }" not in content:
        nestjs_import = re.search(r"(import \{[^}]+\} from '@nestjs/common';)", content)
        if nestjs_import:
            new_import = "\nimport { CurrentUser } from '@/common/decorators/current-user.decorator';"
            content = content.replace(nestjs_import.group(1), nestjs_import.group(1) + new_import)
            print(f"  ✓ Added @CurrentUser import")
    
    # Add User import if missing
    if "import { User }" not in content:
        current_user_import = re.search(r"(import \{ CurrentUser \}[^\n]+)", content)
        if current_user_import:
            new_import = "\nimport { User } from '@/common/security/permission.service';"
            content = content.replace(current_user_import.group(1), current_user_import.group(1) + new_import)
            print(f"  ✓ Added User import")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed ecommerce order controller imports")

def fix_ecommerce_order_service(file_path):
    """Fix ecommerce order service parameter order"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix findAll signature - should be (tenantId, filters)
    content = re.sub(
        r'async findAll\(user: User, filters\?: any\): Promise<Order\[\]>',
        'async findAll(tenantId: string, filters?: any): Promise<Order[]>',
        content
    )
    
    # Fix findAll implementation
    content = re.sub(
        r'where: \{ tenantId: user\.tenantId',
        'where: { tenantId',
        content
    )
    
    # Fix findByCustomer signature
    content = re.sub(
        r'async findByCustomer\(customerId: string, user: User\): Promise<Order\[\]>',
        'async findByCustomer(customerId: string, tenantId: string): Promise<Order[]>',
        content
    )
    
    # Fix findByCustomer implementation
    content = re.sub(
        r'where: \{ customerId, tenantId: user\.tenantId \}',
        'where: { customerId, tenantId }',
        content
    )
    
    # Fix findByOrderNumber signature
    content = re.sub(
        r'async findByOrderNumber\(user: User, orderNumber: string\): Promise<Order>',
        'async findByOrderNumber(tenantId: string, orderNumber: string): Promise<Order>',
        content
    )
    
    # Fix findByOrderNumber implementation
    content = re.sub(
        r'where: \{ orderNumber, tenantId: user\.tenantId \}',
        'where: { orderNumber, tenantId }',
        content
    )
    
    # Fix findOne signature
    content = re.sub(
        r'async findOne\(user: User, id: string\): Promise<Order>',
        'async findOne(tenantId: string, id: string): Promise<Order>',
        content
    )
    
    # Fix findOne implementation
    content = re.sub(
        r'where: \{ id, tenantId: user\.tenantId \}',
        'where: { id, tenantId }',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed ecommerce order service")

def fix_ecommerce_order_controller_calls(file_path):
    """Fix ecommerce order controller service calls"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix findAll call
    content = re.sub(
        r'return this\.orderService\.findAll\(user, filters\);',
        'return this.orderService.findAll(user.tenantId, filters);',
        content
    )
    
    # Fix findByCustomer call
    content = re.sub(
        r'return this\.orderService\.findByCustomer\(customerId, user\);',
        'return this.orderService.findByCustomer(customerId, user.tenantId);',
        content
    )
    
    # Fix findByOrderNumber call
    content = re.sub(
        r'return this\.orderService\.findByOrderNumber\(user, orderNumber\);',
        'return this.orderService.findByOrderNumber(user.tenantId, orderNumber);',
        content
    )
    
    # Fix findOne call
    content = re.sub(
        r'return this\.orderService\.findOne\(user, id\);',
        'return this.orderService.findOne(user.tenantId, id);',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed ecommerce order controller service calls")

def fix_product_catalog_service(file_path):
    """Fix product-catalog service search method signature"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix search method signature - should be (tenantId, dto)
    content = re.sub(
        r'async search\(dto: SearchProductDto, tenantId: string\): Promise<ProductCatalog\[\]>',
        'async search(tenantId: string, dto: SearchProductDto): Promise<ProductCatalog[]>',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed product-catalog service")

def fix_shopping_cart_service(file_path):
    """Fix shopping-cart service addToCart method signature"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix addToCart method signature - should be (tenantId, dto)
    content = re.sub(
        r'async addToCart\(dto: AddToCartDto, tenantId: string\): Promise<ShoppingCart>',
        'async addToCart(tenantId: string, dto: AddToCartDto): Promise<ShoppingCart>',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed shopping-cart service")

def fix_hr_attendance_controller(file_path):
    """Fix HR attendance controller import paths"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix RolesGuard import
    content = re.sub(
        r"import \{ RolesGuard \} from '../../../core/auth/guards/roles\.guard';",
        "import { RolesGuard } from '@/core/auth/guards/roles.guard';",
        content
    )
    
    # Fix Roles decorator import
    content = re.sub(
        r"import \{ Roles \} from '../../auth/decorators/roles\.decorator';",
        "import { Roles } from '@/common/decorators/roles.decorator';",
        content
    )
    
    # Fix CurrentUser decorator import
    content = re.sub(
        r"import \{ CurrentUser \} from '../../auth/decorators/current-user\.decorator';",
        "import { CurrentUser } from '@/common/decorators/current-user.decorator';",
        content
    )
    
    # Fix User entity import
    content = re.sub(
        r"import \{ User as UserEntity \} from '../user/entities/user\.entity';",
        "import { User as UserEntity } from '@/core/user/entities/user.entity';",
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed HR attendance controller imports")

def fix_hr_attendance_module(file_path):
    """Fix HR attendance module import paths"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix Employee entity import
    content = re.sub(
        r"import \{ Employee \} from '../employee/entities/employee\.entity';",
        "import { Employee } from '@/domains/hr/employee/entities/employee.entity';",
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed HR attendance module imports")

def main():
    print("=" * 80)
    print("PHASE 4: FINAL COMPREHENSIVE FIXES")
    print("=" * 80)
    
    base_path = os.path.dirname(os.path.abspath(__file__))
    
    # Fix ecommerce order module
    print("\n[Ecommerce Order Module]")
    
    ecommerce_order_controller = os.path.join(base_path, 'domains/ecommerce/order/order.controller.ts')
    if os.path.exists(ecommerce_order_controller):
        print(f"\n📝 ecommerce order.controller.ts")
        fix_ecommerce_order_controller_comprehensive(ecommerce_order_controller)
        fix_ecommerce_order_controller_calls(ecommerce_order_controller)
    
    ecommerce_order_service = os.path.join(base_path, 'domains/ecommerce/order/order.service.ts')
    if os.path.exists(ecommerce_order_service):
        print(f"\n📝 ecommerce order.service.ts")
        fix_ecommerce_order_service(ecommerce_order_service)
    
    # Fix product catalog
    print("\n[Product Catalog Module]")
    
    product_catalog_service = os.path.join(base_path, 'domains/ecommerce/product-catalog/product-catalog.service.ts')
    if os.path.exists(product_catalog_service):
        print(f"\n📝 product-catalog.service.ts")
        fix_product_catalog_service(product_catalog_service)
    
    # Fix shopping cart
    print("\n[Shopping Cart Module]")
    
    shopping_cart_service = os.path.join(base_path, 'domains/ecommerce/shopping-cart/shopping-cart.service.ts')
    if os.path.exists(shopping_cart_service):
        print(f"\n📝 shopping-cart.service.ts")
        fix_shopping_cart_service(shopping_cart_service)
    
    # Fix HR attendance
    print("\n[HR Attendance Module]")
    
    hr_attendance_controller = os.path.join(base_path, 'domains/hr/attendance/attendance.controller.ts')
    if os.path.exists(hr_attendance_controller):
        print(f"\n📝 HR attendance.controller.ts")
        fix_hr_attendance_controller(hr_attendance_controller)
    
    hr_attendance_module = os.path.join(base_path, 'domains/hr/attendance/attendance.module.ts')
    if os.path.exists(hr_attendance_module):
        print(f"\n📝 HR attendance.module.ts")
        fix_hr_attendance_module(hr_attendance_module)
    
    print("\n" + "=" * 80)
    print("✅ PHASE 4 COMPLETED")
    print("=" * 80)
    print("\nNext: Run 'npm run build' to check remaining errors")

if __name__ == '__main__':
    main()
