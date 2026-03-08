#!/usr/bin/env python3
"""
Phase 3: Fix ecommerce and HR modules
- Add @CurrentUser decorator imports
- Fix parameter order
- Fix entity User imports
- Fix guard import paths
"""

import os
import re

def fix_ecommerce_order_controller(file_path):
    """Fix ecommerce order.controller.ts - add @CurrentUser import and fix refund method"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add @CurrentUser import if not exists
    if '@CurrentUser' not in content and 'CurrentUser' in content:
        # Find the import section
        import_match = re.search(r"(import.*from '@nestjs/common';)", content)
        if import_match:
            new_import = "\nimport { CurrentUser } from '@/common/decorators/current-user.decorator';"
            content = content.replace(import_match.group(1), import_match.group(1) + new_import)
            print(f"  ✓ Added @CurrentUser import")
    
    # Fix refund method - add @CurrentUser decorator
    content = re.sub(
        r'(@Post\(\':id/refund\'\)[^\n]+\n[^\n]+\n  async refund\()(@Param\(\'id\'\) id: string, @Body\(\) dto: RefundDto\))',
        r'\1@CurrentUser() user: User, \2',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed ecommerce order.controller.ts")

def fix_product_catalog_controller(file_path):
    """Fix product-catalog.controller.ts - add user parameter"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix search method - swap parameters
    content = re.sub(
        r'return this\.productCatalogService\.search\(dto, req\.user\.tenantId\);',
        'return this.productCatalogService.search(req.user.tenantId, dto);',
        content
    )
    
    # Fix update method - add user parameter
    content = re.sub(
        r'return this\.productCatalogService\.update\(id, dto, req\.user\.tenantId\);',
        'return this.productCatalogService.update(id, dto, req.user.tenantId, req.user);',
        content
    )
    
    # Fix remove method - add user parameter
    content = re.sub(
        r'return this\.productCatalogService\.remove\(id, req\.user\.tenantId\);',
        'return this.productCatalogService.remove(id, req.user.tenantId, req.user);',
        content
    )
    
    # Fix publish method - add user parameter
    content = re.sub(
        r'return this\.productCatalogService\.publish\(id, req\.user\.tenantId\);',
        'return this.productCatalogService.publish(id, req.user.tenantId, req.user);',
        content
    )
    
    # Fix unpublish method - add user parameter
    content = re.sub(
        r'return this\.productCatalogService\.unpublish\(id, req\.user\.tenantId\);',
        'return this.productCatalogService.unpublish(id, req.user.tenantId, req.user);',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed product-catalog.controller.ts")

def fix_shopping_cart_controller(file_path):
    """Fix shopping-cart.controller.ts - fix parameter order"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix addToCart method - swap parameters (tenantId first, then dto)
    content = re.sub(
        r'return this\.shoppingCartService\.addToCart\(\s*dto,\s*req\.user\.tenantId,',
        'return this.shoppingCartService.addToCart(\n      req.user.tenantId,\n      dto,',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed shopping-cart.controller.ts")

def fix_product_catalog_entity(file_path):
    """Fix product-catalog.entity.ts - fix User import in ManyToOne"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add UserEntity import if not exists
    if 'UserEntity' not in content:
        # Find User import
        user_import_match = re.search(r"import \{ User \} from '@/common/security/permission\.service';", content)
        if user_import_match:
            new_import = "\nimport { User as UserEntity } from '@/core/user/entities/user.entity';"
            content = content.replace(user_import_match.group(0), user_import_match.group(0) + new_import)
            print(f"  ✓ Added UserEntity import")
    
    # Fix ManyToOne to use UserEntity
    content = re.sub(
        r'@ManyToOne\(\(\) => User\)',
        '@ManyToOne(() => UserEntity)',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed product-catalog.entity.ts")

def fix_shopping_cart_entity(file_path):
    """Fix shopping-cart.entity.ts - fix User import in ManyToOne"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add UserEntity import if not exists
    if 'UserEntity' not in content:
        # Find User import or add new import
        user_import_match = re.search(r"import \{ User \} from '@/common/security/permission\.service';", content)
        if user_import_match:
            new_import = "\nimport { User as UserEntity } from '@/core/user/entities/user.entity';"
            content = content.replace(user_import_match.group(0), user_import_match.group(0) + new_import)
        else:
            # Add import after other imports
            import_section_match = re.search(r"(import.*from 'typeorm';)", content)
            if import_section_match:
                new_import = "\nimport { User as UserEntity } from '@/core/user/entities/user.entity';"
                content = content.replace(import_section_match.group(1), import_section_match.group(1) + new_import)
        print(f"  ✓ Added UserEntity import")
    
    # Fix ManyToOne to use UserEntity
    content = re.sub(
        r'@ManyToOne\(\(\) => User',
        '@ManyToOne(() => UserEntity',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed shopping-cart.entity.ts")

def fix_hr_attendance_controller(file_path):
    """Fix HR attendance.controller.ts - fix guard import paths"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix JwtAuthGuard import path
    content = re.sub(
        r"import \{ JwtAuthGuard \} from '../../auth/guards/jwt-auth\.guard';",
        "import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';",
        content
    )
    
    # Fix RolesGuard import path
    content = re.sub(
        r"import \{ RolesGuard \} from '../../auth/guards/roles\.guard';",
        "import { RolesGuard } from '../../../core/auth/guards/roles.guard';",
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed HR attendance.controller.ts guard imports")

def main():
    print("=" * 80)
    print("PHASE 3: FIXING ECOMMERCE AND HR MODULES")
    print("=" * 80)
    
    base_path = os.path.dirname(os.path.abspath(__file__))
    
    # Fix ecommerce controllers
    print("\n[Ecommerce Controllers]")
    
    ecommerce_order_controller = os.path.join(base_path, 'domains/ecommerce/order/order.controller.ts')
    if os.path.exists(ecommerce_order_controller):
        print(f"\n📝 ecommerce order.controller.ts")
        fix_ecommerce_order_controller(ecommerce_order_controller)
    
    product_catalog_controller = os.path.join(base_path, 'domains/ecommerce/product-catalog/product-catalog.controller.ts')
    if os.path.exists(product_catalog_controller):
        print(f"\n📝 product-catalog.controller.ts")
        fix_product_catalog_controller(product_catalog_controller)
    
    shopping_cart_controller = os.path.join(base_path, 'domains/ecommerce/shopping-cart/shopping-cart.controller.ts')
    if os.path.exists(shopping_cart_controller):
        print(f"\n📝 shopping-cart.controller.ts")
        fix_shopping_cart_controller(shopping_cart_controller)
    
    # Fix ecommerce entities
    print("\n[Ecommerce Entities]")
    
    product_catalog_entity = os.path.join(base_path, 'domains/ecommerce/product-catalog/entities/product-catalog.entity.ts')
    if os.path.exists(product_catalog_entity):
        print(f"\n📝 product-catalog.entity.ts")
        fix_product_catalog_entity(product_catalog_entity)
    
    shopping_cart_entity = os.path.join(base_path, 'domains/ecommerce/shopping-cart/entities/shopping-cart.entity.ts')
    if os.path.exists(shopping_cart_entity):
        print(f"\n📝 shopping-cart.entity.ts")
        fix_shopping_cart_entity(shopping_cart_entity)
    
    # Fix HR controllers
    print("\n[HR Controllers]")
    
    hr_attendance_controller = os.path.join(base_path, 'domains/hr/attendance/attendance.controller.ts')
    if os.path.exists(hr_attendance_controller):
        print(f"\n📝 HR attendance.controller.ts")
        fix_hr_attendance_controller(hr_attendance_controller)
    
    print("\n" + "=" * 80)
    print("✅ PHASE 3 COMPLETED")
    print("=" * 80)
    print("\nNext: Run 'npm run build' to check remaining errors")

if __name__ == '__main__':
    main()
