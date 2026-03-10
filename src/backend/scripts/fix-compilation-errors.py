#!/usr/bin/env python3
"""
Fix compilation errors - parameter mismatches in controllers and services
"""
import re
from pathlib import Path

def fix_file(filepath, replacements):
    """Apply replacements to a file"""
    try:
        content = Path(filepath).read_text(encoding='utf-8')
        original = content
        
        for old, new in replacements:
            content = content.replace(old, new)
        
        if content != original:
            Path(filepath).write_text(content, encoding='utf-8')
            print(f"✅ Fixed: {filepath}")
            return True
        return False
    except Exception as e:
        print(f"❌ Error fixing {filepath}: {e}")
        return False

# Fix shopping-cart.service.ts - Remove 'as ShoppingCart' and 'as CartItem' casts
shopping_cart_fixes = [
    (
        "cart = await this.secureCartRepo.save(user, newCart as ShoppingCart);",
        "cart = await this.secureCartRepo.save(user, newCart);"
    ),
    (
        "await this.secureCartItemRepo.save(user, newCartItem as CartItem);",
        "await this.secureCartItemRepo.save(user, newCartItem);"
    ),
]

# Fix payment-gateway.controller.ts - Change user.tenantId to user
payment_gateway_fixes = [
    (
        "await this.paymentGatewayService.handleWebhook(user.tenantId, 'vnpay', body);",
        "await this.paymentGatewayService.handleWebhook(user, 'vnpay', body);"
    ),
    (
        "await this.paymentGatewayService.handleWebhook(user.tenantId, 'momo', body);",
        "await this.paymentGatewayService.handleWebhook(user, 'momo', body);"
    ),
    (
        "await this.paymentGatewayService.handleWebhook(user.tenantId, 'stripe', body, signature);",
        "await this.paymentGatewayService.handleWebhook(user, 'stripe', body, signature);"
    ),
    (
        "return this.paymentGatewayService.listTransactions(user.tenantId, {",
        "return this.paymentGatewayService.listTransactions(user, {"
    ),
]

# Fix system-admin.service.ts - Change save(errorLog) to save([errorLog])
system_admin_fixes = [
    (
        "return this.errorLogRepository.save(errorLog);",
        "return this.errorLogRepository.save([errorLog]);"
    ),
]

# Apply fixes
files_to_fix = [
    ("domains/ecommerce/shopping-cart/shopping-cart.service.ts", shopping_cart_fixes),
    ("integrations/payment-gateway/payment-gateway.controller.ts", payment_gateway_fixes),
    ("platform/system-admin/system-admin.service.ts", system_admin_fixes),
]

fixed_count = 0
for filepath, fixes in files_to_fix:
    if fix_file(filepath, fixes):
        fixed_count += 1

print(f"\n✅ Fixed {fixed_count}/{len(files_to_fix)} files")
