#!/usr/bin/env python3
"""
Phase 8: Fix remaining 225 TypeScript errors
- Fix manufacturing entity BaseEntity import paths (5 errors)
- Fix User import in services (30+ errors)
- Fix tenantId shorthand syntax (20+ errors)
- Fix generateCacheKey syntax (10+ errors)
- Fix missing methods in services (30+ errors)
- Fix controller parameter issues (40+ errors)
- Fix entity type constraints (50+ errors)
"""

import os
import re

def fix_file(filepath, replacements):
    """Apply replacements to a file"""
    if not os.path.exists(filepath):
        print(f"⚠️  File not found: {filepath}")
        return False
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    for old, new in replacements:
        content = content.replace(old, new)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Fixed: {filepath}")
        return True
    return False

# ==================== FIX 1: Manufacturing Entity BaseEntity Import Paths ====================
print("\n=== Phase 8.1: Fix Manufacturing Entity BaseEntity Import Paths ===")

entity_files = [
    'domains/manufacturing/mrp/entities/material.entity.ts',
    'domains/manufacturing/mrp/entities/mold.entity.ts',
    'domains/manufacturing/mrp/entities/bom.entity.ts',
    'domains/manufacturing/mrp/entities/work-order.entity.ts',
    'domains/manufacturing/mrp/entities/quality-check.entity.ts',
]

for file in entity_files:
    fix_file(file, [
        ("from '../../../common/entities/base.entity'", "from '@/common/entities/base.entity'"),
    ])

# ==================== FIX 2: Add User Import to Services ====================
print("\n=== Phase 8.2: Add User Import to Services ===")

# Payment Gateway Service
fix_file('integrations/payment-gateway/payment-gateway.service.ts', [
    ("import { CreatePaymentDto, VerifyPaymentDto, RefundPaymentDto } from './dto/create-payment.dto';",
     "import { CreatePaymentDto, VerifyPaymentDto, RefundPaymentDto } from './dto/create-payment.dto';\nimport { User } from '@/common/security/permission.service';"),
])

# Shipping Service
fix_file('integrations/shipping/shipping.service.ts', [
    ("import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';",
     "import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';\nimport { User } from '@/common/security/permission.service';"),
])

# ==================== FIX 3: Fix tenantId Shorthand Syntax ====================
print("\n=== Phase 8.3: Fix tenantId Shorthand Syntax ===")

# Payment Gateway Service - Fix all tenantId shorthand
fix_file('integrations/payment-gateway/payment-gateway.service.ts', [
    ("where: { id: dto.transactionId, tenantId },", "where: { id: dto.transactionId, tenantId: user.tenantId },"),
    ("where: { id: transactionId, tenantId },", "where: { id: transactionId, tenantId: user.tenantId },"),
    ("tenantId: user.tenantId,", "tenantId: user.tenantId,"),
])

# Shipping Service - Fix all tenantId shorthand
fix_file('integrations/shipping/shipping.service.ts', [
    ("where: { id: dto.shipmentId, tenantId },", "where: { id: dto.shipmentId, tenantId: user.tenantId },"),
    ("where: { id: shipmentId, tenantId },", "where: { id: shipmentId, tenantId: user.tenantId },"),
])

# ==================== FIX 4: Fix generateCacheKey Syntax ====================
print("\n=== Phase 8.4: Fix generateCacheKey Syntax ===")

# Shipping Service - Fix all generateCacheKey calls
fix_file('integrations/shipping/shipping.service.ts', [
    ("generateCacheKey('shipment', tenantId: user.tenantId, shipment.id)", "generateCacheKey('shipment', user.tenantId, shipment.id)"),
    ("const cacheKey = generateCacheKey('shipment', tenantId: user.tenantId, shipmentId);", "const cacheKey = generateCacheKey('shipment', user.tenantId, shipmentId);"),
])

# Email Service - Fix findTemplateById calls
fix_file('platform/email/email.service.ts', [
    ("const template = await this.findTemplateById(tenantId: user.tenantId, templateId);", "const template = await this.findTemplateById(user.tenantId, templateId);"),
    ("await this.findTemplateById(user, id);", "await this.findTemplateById(user.tenantId, id);"),
    ("return this.findTemplateById(user, id);", "return this.findTemplateById(user.tenantId, id);"),
    ("const template = await this.findTemplateById(user, id);", "const template = await this.findTemplateById(user.tenantId, id);"),
])

# Search Service - Fix searchByType
fix_file('platform/search/search.service.ts', [
    ("const cacheKey = generateCacheKey('search', user.tenantId, `type:${type}:${query}`);", "const cacheKey = generateCacheKey('search', tenantId, `type:${type}:${query}`);"),
    ("const allResults = await this.search(user, query);", "const allResults = await this.search({ tenantId } as User, query);"),
])

# ==================== FIX 5: Fix Controller Parameter Issues ====================
print("\n=== Phase 8.5: Fix Controller Parameter Issues ===")

# Manufacturing Production Controller
fix_file('domains/manufacturing/mrp/production.controller.ts', [
    ("return this.productionService.findLowStockMaterials(user, user);", "return this.productionService.findLowStockMaterials(user);"),
    ("return this.productionService.findMaterialById(id);", "return this.productionService.findMaterialById(id, user);"),
    ("return this.productionService.findMoldsNeedingMaintenance(user, user);", "return this.productionService.findMoldsNeedingMaintenance(user);"),
    ("return this.productionService.findMoldById(id);", "return this.productionService.findMoldById(id, user);"),
    ("tenantId,", "// tenantId removed - using user.tenantId"),
])

# Payment Gateway Controller
fix_file('integrations/payment-gateway/payment-gateway.controller.ts', [
    ("return this.paymentGatewayService.verifyPayment(user, dto);", "return this.paymentGatewayService.verifyPayment(user.tenantId, dto);"),
    ("await this.paymentGatewayService.handleWebhook(user, 'vnpay', body);", "await this.paymentGatewayService.handleWebhook(user.tenantId, 'vnpay', body);"),
    ("await this.paymentGatewayService.handleWebhook(user, 'momo', body);", "await this.paymentGatewayService.handleWebhook(user.tenantId, 'momo', body);"),
    ("await this.paymentGatewayService.handleWebhook(user, 'stripe', body, signature);", "await this.paymentGatewayService.handleWebhook(user.tenantId, 'stripe', body, signature);"),
    ("return this.paymentGatewayService.listTransactions(user, {", "return this.paymentGatewayService.listTransactions(user.tenantId, {"),
])

# Shipping Controller
fix_file('integrations/shipping/shipping.controller.ts', [
    ("return this.shippingService.calculateFee(user, dto);", "return this.shippingService.calculateFee(user.tenantId, dto);"),
    ("return this.shippingService.trackShipment(user, dto);", "return this.shippingService.trackShipment(user.tenantId, dto);"),
    ("return this.shippingService.listShipments(user, {", "return this.shippingService.listShipments(user.tenantId, {"),
])

# Email Controller
fix_file('platform/email/email.controller.ts', [
    ("return this.emailService.findTemplateById(user, id);", "return this.emailService.findTemplateById(user.tenantId, id);"),
    ("return this.emailService.updateTemplate(user, id, data);", "return this.emailService.updateTemplate(user.tenantId, id, data);"),
    ("return this.emailService.sendEmail(user, to, subject, body, cc, bcc);", "return this.emailService.sendEmail(user.tenantId, to, subject, body, cc, bcc);"),
    ("return this.emailService.sendTemplateEmail(user, to, templateId, variables);", "return this.emailService.sendTemplateEmail(user.tenantId, to, templateId, variables);"),
    ("return this.emailService.findLogById(user, id);", "return this.emailService.findLogById(user.tenantId, id);"),
])

# Search Controller
fix_file('platform/search/search.controller.ts', [
    ("return this.searchService.searchByType(user, type, query);", "return this.searchService.searchByType(user.tenantId, type, query);"),
])

# Integration Controller
fix_file('integrations/integration/integration.controller.ts', [
    ("return this.integrationService.processPayment(user, gateway, amount, orderId);", "return this.integrationService.processPayment(user.tenantId, gateway, amount, orderId);"),
    ("return this.integrationService.createShipment(user, provider, shipmentData);", "return this.integrationService.createShipment(user.tenantId, provider, shipmentData);"),
])

# Approval Controller
fix_file('platform/workflow/approval.controller.ts', [
    ("return this.approvalService.approve(user, id);", "return this.approvalService.approve(user.tenantId, id);"),
    ("return this.approvalService.cancel(user, id);", "return this.approvalService.cancel(user.tenantId, id);"),
])

# Import Export Controller
fix_file('utilities/import-export/import-export.controller.ts', [
    ("const csv = await this.importExportService.exportToCSV(entityType, user, data);", "const csv = await this.importExportService.exportToCSV(entityType, user.tenantId, data);"),
    ("return this.importExportService.importFromCSV(entityType, user, csvContent);", "return this.importExportService.importFromCSV(entityType, user.tenantId, csvContent);"),
])

# ==================== FIX 6: Fix Integration Service ====================
print("\n=== Phase 8.6: Fix Integration Service ===")

fix_file('integrations/integration/integration.service.ts', [
    ("this.logger.log(`Creating shipment with ${provider} for tenant ${user.tenantId}`);", "this.logger.log(`Creating shipment with ${provider} for tenant ${tenantId}`);"),
])

# ==================== FIX 7: Fix Email Service ====================
print("\n=== Phase 8.7: Fix Email Service ===")

fix_file('platform/email/email.service.ts', [
    ("const log = await this.sendEmail(user, to, subject, body);", "const log = await this.sendEmail(tenantId, to, subject, body);"),
])

print("\n✅ Phase 8 Complete!")
print("Run 'npm run build' to check remaining errors")
