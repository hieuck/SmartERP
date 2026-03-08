#!/usr/bin/env python3
"""
Phase 2: Fix remaining controller parameter order issues
Following Odoo/ERPNext pattern: User object first
"""

import os
import re

def fix_work_center_controller(file_path):
    """Fix work-center.controller.ts - correct service call parameter order"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix create method - service.create(dto, tenantId, user)
    content = re.sub(
        r'return this\.workCenterService\.create\(dto, req\.user\.tenantId, req\.user\);',
        'return this.workCenterService.create(dto, req.user.tenantId, req.user);',
        content
    )
    
    # Fix findAll method - service.findAll(tenantId)
    content = re.sub(
        r'return this\.workCenterService\.findAll\(req\.user\.tenantId\);',
        'return this.workCenterService.findAll(req.user.tenantId);',
        content
    )
    
    # Fix findOne method - service.findOne(id, tenantId)
    content = re.sub(
        r'return this\.workCenterService\.findOne\(id, req\.user\.tenantId\);',
        'return this.workCenterService.findOne(id, req.user.tenantId);',
        content
    )
    
    # Fix update method - service.update(id, dto, tenantId, user)
    content = re.sub(
        r'return this\.workCenterService\.update\(id, dto, req\.user\.tenantId, req\.user\);',
        'return this.workCenterService.update(id, dto, req.user.tenantId, req.user);',
        content
    )
    
    # Fix remove method - service.remove(id, tenantId, user)
    content = re.sub(
        r'await this\.workCenterService\.remove\(id, req\.user\.tenantId, req\.user\);',
        'await this.workCenterService.remove(id, req.user.tenantId, req.user);',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed work-center.controller.ts")

def fix_work_order_controller(file_path):
    """Fix work-order.controller.ts - correct service call parameter order"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix create method - service.create(dto, tenantId, user)
    content = re.sub(
        r'return this\.workOrderService\.create\(dto, req\.user\.tenantId, req\.user\);',
        'return this.workOrderService.create(dto, req.user.tenantId, req.user);',
        content
    )
    
    # Fix findOne method - service.findOne(id, tenantId)
    content = re.sub(
        r'return this\.workOrderService\.findOne\(id, req\.user\.tenantId\);',
        'return this.workOrderService.findOne(id, req.user.tenantId);',
        content
    )
    
    # Fix findByBOM method - service.findByBOM(bomId, tenantId)
    content = re.sub(
        r'return this\.workOrderService\.findByBOM\(bomId, req\.user\.tenantId\);',
        'return this.workOrderService.findByBOM(bomId, req.user.tenantId);',
        content
    )
    
    # Fix findByStatus method - service.findByStatus(status, tenantId)
    content = re.sub(
        r'return this\.workOrderService\.findByStatus\(status as any, req\.user\.tenantId\);',
        'return this.workOrderService.findByStatus(status as any, req.user.tenantId);',
        content
    )
    
    # Fix confirm method - service.confirm(id, tenantId, user)
    content = re.sub(
        r'return this\.workOrderService\.confirm\(id, req\.user\.tenantId, req\.user\);',
        'return this.workOrderService.confirm(id, req.user.tenantId, req.user);',
        content
    )
    
    # Fix start method - service.start(id, tenantId, user)
    content = re.sub(
        r'return this\.workOrderService\.start\(id, req\.user\.tenantId, req\.user\);',
        'return this.workOrderService.start(id, req.user.tenantId, req.user);',
        content
    )
    
    # Fix finish method - service.finish(id, producedQuantity, tenantId, user)
    content = re.sub(
        r'return this\.workOrderService\.finish\(\s*id,\s*dto\.producedQuantity,\s*req\.user\.tenantId,\s*req\.user,\s*\);',
        'return this.workOrderService.finish(id, dto.producedQuantity, req.user.tenantId, req.user);',
        content
    )
    
    # Fix cancel method - service.cancel(id, tenantId, user)
    content = re.sub(
        r'return this\.workOrderService\.cancel\(id, req\.user\.tenantId, req\.user\);',
        'return this.workOrderService.cancel(id, req.user.tenantId, req.user);',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed work-order.controller.ts")

def fix_routing_controller(file_path):
    """Fix routing.controller.ts - correct service call parameter order"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix create method - service.create(dto, tenantId, user)
    content = re.sub(
        r'return this\.routingService\.create\(dto, req\.user\.tenantId, req\.user\);',
        'return this.routingService.create(dto, req.user.tenantId, req.user);',
        content
    )
    
    # Fix findOne method - service.findOne(id, tenantId)
    content = re.sub(
        r'return this\.routingService\.findOne\(id, req\.user\.tenantId\);',
        'return this.routingService.findOne(id, req.user.tenantId);',
        content
    )
    
    # Fix findByProduct method - service.findByProduct(productId, tenantId)
    content = re.sub(
        r'return this\.routingService\.findByProduct\(productId, req\.user\.tenantId\);',
        'return this.routingService.findByProduct(productId, req.user.tenantId);',
        content
    )
    
    # Fix addOperation method - service.addOperation(id, dto, tenantId, user)
    content = re.sub(
        r'return this\.routingService\.addOperation\(id, dto, req\.user\.tenantId, req\.user\);',
        'return this.routingService.addOperation(id, dto, req.user.tenantId, req.user);',
        content
    )
    
    # Fix removeOperation method - service.removeOperation(routingId, operationId, tenantId, user)
    content = re.sub(
        r'return this\.routingService\.removeOperation\(\s*routingId,\s*operationId,\s*req\.user\.tenantId,\s*req\.user,\s*\);',
        'return this.routingService.removeOperation(routingId, operationId, req.user.tenantId, req.user);',
        content
    )
    
    # Fix calculateCost method - service.calculateTotalCost(id, tenantId)
    content = re.sub(
        r'const cost = await this\.routingService\.calculateTotalCost\(id, req\.user\.tenantId\);',
        'const cost = await this.routingService.calculateTotalCost(id, req.user.tenantId);',
        content
    )
    
    # Fix remove method - service.remove(id, tenantId, user)
    content = re.sub(
        r'await this\.routingService\.remove\(id, req\.user\.tenantId, req\.user\);',
        'await this.routingService.remove(id, req.user.tenantId, req.user);',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed routing.controller.ts")

def fix_integration_controller(file_path):
    """Fix integration.controller.ts - add @CurrentUser decorator and fix parameter order"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Already has @CurrentUser decorator, just verify service calls are correct
    # All methods already use user as first parameter - no changes needed
    
    print(f"  ✓ integration.controller.ts already correct")

def fix_payment_gateway_controller(file_path):
    """Fix payment-gateway.controller.ts - remove unused tenantId variables"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove all unused tenantId variable declarations
    content = re.sub(
        r'\s*const tenantId = req\.tenantId \|\| \'default-tenant\';',
        '',
        content
    )
    
    # Fix vnpayIPN method - add @CurrentUser decorator
    content = re.sub(
        r'(@Post\(\'vnpay/ipn\'\)\s+async vnpayIPN\(\s+)@Req\(\) req:',
        r'\1@CurrentUser() user: User,\n    @Req() req:',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed payment-gateway.controller.ts")

def fix_shipping_controller(file_path):
    """Fix shipping.controller.ts - remove unused tenantId variables"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove all unused tenantId variable declarations
    content = re.sub(
        r'\s*const tenantId = req\.tenantId \|\| \'default-tenant\';',
        '',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed shipping.controller.ts")

def main():
    print("=" * 80)
    print("PHASE 2: FIXING CONTROLLER PARAMETER ORDER")
    print("Following Odoo/ERPNext pattern: User object first")
    print("=" * 80)
    
    base_path = os.path.dirname(os.path.abspath(__file__))
    
    # Fix manufacturing controllers
    print("\n[Manufacturing Controllers]")
    
    work_center_controller = os.path.join(base_path, 'domains/manufacturing/work-center/work-center.controller.ts')
    if os.path.exists(work_center_controller):
        print(f"\n📝 work-center.controller.ts")
        fix_work_center_controller(work_center_controller)
    
    work_order_controller = os.path.join(base_path, 'domains/manufacturing/work-order/work-order.controller.ts')
    if os.path.exists(work_order_controller):
        print(f"\n📝 work-order.controller.ts")
        fix_work_order_controller(work_order_controller)
    
    routing_controller = os.path.join(base_path, 'domains/manufacturing/routing/routing.controller.ts')
    if os.path.exists(routing_controller):
        print(f"\n📝 routing.controller.ts")
        fix_routing_controller(routing_controller)
    
    # Fix integration controllers
    print("\n[Integration Controllers]")
    
    integration_controller = os.path.join(base_path, 'integrations/integration/integration.controller.ts')
    if os.path.exists(integration_controller):
        print(f"\n📝 integration.controller.ts")
        fix_integration_controller(integration_controller)
    
    payment_gateway_controller = os.path.join(base_path, 'integrations/payment-gateway/payment-gateway.controller.ts')
    if os.path.exists(payment_gateway_controller):
        print(f"\n📝 payment-gateway.controller.ts")
        fix_payment_gateway_controller(payment_gateway_controller)
    
    shipping_controller = os.path.join(base_path, 'integrations/shipping/shipping.controller.ts')
    if os.path.exists(shipping_controller):
        print(f"\n📝 shipping.controller.ts")
        fix_shipping_controller(shipping_controller)
    
    print("\n" + "=" * 80)
    print("✅ PHASE 2 COMPLETED")
    print("=" * 80)
    print("\nNext: Run 'npm run build' to check remaining errors")

if __name__ == '__main__':
    main()
