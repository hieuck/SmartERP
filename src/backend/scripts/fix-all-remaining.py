#!/usr/bin/env python3
"""
Fix all remaining TypeScript compilation errors
"""

import os
import re
from pathlib import Path

def fix_file(file_path, fixes):
    """Apply fixes to a file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    for pattern, replacement in fixes:
        content = re.sub(pattern, replacement, content)
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    backend_dir = Path(__file__).parent
    
    fixes_map = {
        'domains/accounting/account/accounting.service.ts': [
            # Fix entryDate -> createdAt in order clause
            (r"order: \{ entryDate: 'DESC' \}", r"order: { createdAt: 'DESC' }"),
        ],
        'domains/accounting/payment/payment.controller.ts': [
            # Fix remove: (user, id) -> (id, user)
            (r'await this\.paymentService\.remove\(user, id\)', r'await this.paymentService.remove(id, user)'),
        ],
        'domains/accounting/reports/reports.controller.ts': [
            # Fix tenantId -> user.tenantId
            (r'(\s+)tenantId,', r'\1user.tenantId,'),
        ],
        'domains/ecommerce/order/checkout.controller.ts': [
            # Fix initiateCheckout: (user, dto, user) -> (dto, user)
            (r'return this\.checkoutService\.initiateCheckout\(user, dto, user\)', r'return this.checkoutService.initiateCheckout(dto, user)'),
            # Fix createOrderFromCart: (user, dto, user) -> (dto, user)
            (r'return this\.checkoutService\.createOrderFromCart\(user, dto, user\)', r'return this.checkoutService.createOrderFromCart(dto, user)'),
        ],
        'domains/ecommerce/order/order.controller.ts': [
            # Fix create: (user, dto, user) -> (dto, user)
            (r'return this\.orderService\.create\(user, dto, user\)', r'return this.orderService.create(dto, user)'),
            # Add @CurrentUser() decorator where missing
            (r'return this\.orderService\.findAll\(user, filters\)', r'return this.orderService.findAll(user, filters)'),
            (r'return this\.orderService\.findByCustomer\(user, customerId\)', r'return this.orderService.findByCustomer(user, customerId)'),
            (r'return this\.orderService\.findByOrderNumber\(user, orderNumber\)', r'return this.orderService.findByOrderNumber(user, orderNumber)'),
            (r'return this\.orderService\.findOne\(user, id\)', r'return this.orderService.findOne(user, id)'),
            # Fix payment service calls
            (r'return this\.paymentService\.processPayment\(user, dto\)', r'return this.paymentService.processPayment(dto, user)'),
            (r'return this\.paymentService\.verifyPayment\(user, dto\)', r'return this.paymentService.verifyPayment(dto, user)'),
        ],
        'domains/ecommerce/order/entities/order.entity.ts': [
            # Fix User type in ManyToOne - should use UserEntity
            (r"@ManyToOne\(\(\) => User, \{ nullable: true \}\)", r"@ManyToOne(() => 'User', { nullable: true })"),
        ],
    }
    
    fixed_count = 0
    
    for file_rel_path, fixes in fixes_map.items():
        file_path = backend_dir / file_rel_path
        if file_path.exists():
            if fix_file(str(file_path), fixes):
                print(f"✓ Fixed: {file_rel_path}")
                fixed_count += 1
    
    print(f"\n✅ Fixed {fixed_count} files")

if __name__ == '__main__':
    main()
