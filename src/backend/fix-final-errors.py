#!/usr/bin/env python3
"""
Fix final TypeScript compilation errors - parameter order in controllers
"""

import os
import re
from pathlib import Path

def fix_bank_reconciliation_controller(file_path):
    """Fix bank-reconciliation controller parameter order"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Fix create method: (user, createDto) -> (createDto, user)
    content = re.sub(
        r'return this\.bankReconciliationService\.create\(user, createDto\)',
        r'return this.bankReconciliationService.create(createDto, user)',
        content
    )
    
    # Fix findOne: (user, id) -> (id, user)
    content = re.sub(
        r'return this\.bankReconciliationService\.findOne\(user, id\)',
        r'return this.bankReconciliationService.findOne(id, user)',
        content
    )
    
    # Fix autoMatch: (user, id) -> (id, user)
    content = re.sub(
        r'return this\.bankReconciliationService\.autoMatch\(user, id\)',
        r'return this.bankReconciliationService.autoMatch(id, user)',
        content
    )
    
    # Fix unmatch: (user, id) -> (id, user)
    content = re.sub(
        r'return this\.bankReconciliationService\.unmatch\(user, id\)',
        r'return this.bankReconciliationService.unmatch(id, user)',
        content
    )
    
    # Fix getReconciliationReport: (user, id) -> (id, user)
    content = re.sub(
        r'return this\.bankReconciliationService\.getReconciliationReport\(user, id\)',
        r'return this.bankReconciliationService.getReconciliationReport(id, user)',
        content
    )
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def fix_payment_controller(file_path):
    """Fix payment controller parameter order"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Fix findAll: (user, user) -> (user)
    content = re.sub(
        r'return this\.paymentService\.findAll\(user, user\)',
        r'return this.paymentService.findAll(user)',
        content
    )
    
    # Fix findByOrder: (orderId) -> (orderId, user)
    content = re.sub(
        r'return this\.paymentService\.findByOrder\(orderId\)',
        r'return this.paymentService.findByOrder(orderId, user)',
        content
    )
    
    # Fix findByStatus: (user, status) -> (status, user)
    content = re.sub(
        r'return this\.paymentService\.findByStatus\(user, status\)',
        r'return this.paymentService.findByStatus(status, user)',
        content
    )
    
    # Fix findOne: (user, id) -> (id, user)
    content = re.sub(
        r'return this\.paymentService\.findOne\(user, id\)',
        r'return this.paymentService.findOne(id, user)',
        content
    )
    
    # Fix create: (user, createPaymentDto) -> (createPaymentDto, user)
    content = re.sub(
        r'return this\.paymentService\.create\(user, createPaymentDto\)',
        r'return this.paymentService.create(createPaymentDto, user)',
        content
    )
    
    # Fix update: (user, id, updatePaymentDto) -> (id, updatePaymentDto, user)
    content = re.sub(
        r'return this\.paymentService\.update\(user, id, updatePaymentDto\)',
        r'return this.paymentService.update(id, updatePaymentDto, user)',
        content
    )
    
    # Fix complete: (user, id, transactionId) -> (id, transactionId, user)
    content = re.sub(
        r'return this\.paymentService\.complete\(user, id, transactionId\)',
        r'return this.paymentService.complete(id, transactionId, user)',
        content
    )
    
    # Fix fail: (user, id, reason) -> (id, reason, user)
    content = re.sub(
        r'return this\.paymentService\.fail\(user, id, reason\)',
        r'return this.paymentService.fail(id, reason, user)',
        content
    )
    
    # Fix refund: (user, id) -> (id, user)
    content = re.sub(
        r'return this\.paymentService\.refund\(user, id\)',
        r'return this.paymentService.refund(id, user)',
        content
    )
    
    # Fix TenantGuard import path
    content = re.sub(
        r"from '../../common/guards/tenant\.guard'",
        r"from '../../../common/guards/tenant.guard'",
        content
    )
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    backend_dir = Path(__file__).parent
    
    fixed_count = 0
    
    # Fix bank-reconciliation controller
    bank_recon_file = backend_dir / 'domains/accounting/bank-reconciliation/bank-reconciliation.controller.ts'
    if bank_recon_file.exists():
        if fix_bank_reconciliation_controller(str(bank_recon_file)):
            print(f"✓ Fixed: bank-reconciliation.controller.ts")
            fixed_count += 1
    
    # Fix payment controller
    payment_file = backend_dir / 'domains/accounting/payment/payment.controller.ts'
    if payment_file.exists():
        if fix_payment_controller(str(payment_file)):
            print(f"✓ Fixed: payment.controller.ts")
            fixed_count += 1
    
    print(f"\n✅ Fixed {fixed_count} files")

if __name__ == '__main__':
    main()
