#!/usr/bin/env python3
"""
Fix all remaining 276 TypeScript compilation errors after security refactoring.
Following Odoo/ERPNext pattern: User object first parameter.
"""

import os
import re

def fix_duplicate_user_imports(file_path):
    """Remove duplicate User imports"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all User import lines
    user_imports = re.findall(r"^import.*User.*from.*$", content, re.MULTILINE)
    
    if len(user_imports) > 1:
        # Keep only the first import, remove duplicates
        first_import = user_imports[0]
        for duplicate in user_imports[1:]:
            content = content.replace(duplicate + '\n', '', 1)
        print(f"  ✓ Removed {len(user_imports) - 1} duplicate User import(s)")
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def fix_work_center_service(file_path):
    """Fix work-center.service.ts - add missing methods and fix parameter order"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix create method signature
    content = re.sub(
        r'async create\(tenantId: string, dto: any\): Promise<WorkCenter>',
        'async create(dto: any, tenantId: string, user: any): Promise<WorkCenter>',
        content
    )
    
    # Fix findOne method signature
    content = re.sub(
        r'async findOne\(tenantId: string, id: string\): Promise<WorkCenter>',
        'async findOne(id: string, tenantId: string): Promise<WorkCenter>',
        content
    )
    
    # Fix update method signature
    content = re.sub(
        r'async update\(tenantId: string, id: string, dto: any\): Promise<WorkCenter>',
        'async update(id: string, dto: any, tenantId: string, user: any): Promise<WorkCenter>',
        content
    )
    
    # Add missing findAll method before findActive
    if 'async findAll(' not in content:
        find_active_match = re.search(r'(  async findActive\(tenantId: string\))', content)
        if find_active_match:
            new_method = '''  async findAll(tenantId: string): Promise<WorkCenter[]> {
    return this.workCenterRepository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  '''
            content = content.replace(find_active_match.group(1), new_method + find_active_match.group(1))
            print(f"  ✓ Added findAll method")
    
    # Add missing remove method at the end of class
    if 'async remove(' not in content:
        # Find the last method before closing brace
        last_method_match = re.search(r'(  async update\([^}]+\}\n  \})', content, re.DOTALL)
        if last_method_match:
            new_method = '''

  async remove(id: string, tenantId: string, user: any): Promise<void> {
    const workCenter = await this.findOne(id, tenantId);
    await this.workCenterRepository.remove(workCenter);
  }'''
            content = content.replace(last_method_match.group(1), last_method_match.group(1) + new_method)
            print(f"  ✓ Added remove method")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed work-center.service.ts")

def fix_work_order_service(file_path):
    """Fix work-order.service.ts - add missing methods and fix parameter order"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix create method signature
    content = re.sub(
        r'async create\(tenantId: string, dto: any\): Promise<WorkOrder>',
        'async create(dto: any, tenantId: string, user: any): Promise<WorkOrder>',
        content
    )
    
    # Fix findOne method signature
    content = re.sub(
        r'async findOne\(tenantId: string, id: string\): Promise<WorkOrder>',
        'async findOne(id: string, tenantId: string): Promise<WorkOrder>',
        content
    )
    
    # Fix findByStatus method signature
    content = re.sub(
        r'async findByStatus\(tenantId: string, status: WorkOrderStatus\): Promise<WorkOrder\[\]>',
        'async findByStatus(status: WorkOrderStatus, tenantId: string): Promise<WorkOrder[]>',
        content
    )
    
    # Fix confirm method signature
    content = re.sub(
        r'async confirm\(tenantId: string, id: string\): Promise<WorkOrder>',
        'async confirm(id: string, tenantId: string, user: any): Promise<WorkOrder>',
        content
    )
    
    # Rename startProduction to start
    content = content.replace('async startProduction(tenantId: string, id: string): Promise<WorkOrder>', 
                             'async start(id: string, tenantId: string, user: any): Promise<WorkOrder>')
    content = content.replace('async startProduction(', 'async start(')
    
    # Rename finishProduction to finish
    content = content.replace('async finishProduction(tenantId: string, id: string, dto: any): Promise<WorkOrder>', 
                             'async finish(id: string, producedQuantity: number, tenantId: string, user: any): Promise<WorkOrder>')
    content = re.sub(
        r'async finishProduction\([^)]+\): Promise<WorkOrder> \{[^}]+workOrder\.qtyProduced = dto\.qtyProduced;',
        '''async finish(id: string, producedQuantity: number, tenantId: string, user: any): Promise<WorkOrder> {
    const workOrder = await this.findOne(id, tenantId);

    if (workOrder.status !== WorkOrderStatus.IN_PROGRESS) {
      throw new BadRequestException('Only in-progress work orders can be finished');
    }

    workOrder.status = WorkOrderStatus.DONE;
    workOrder.qtyProduced = producedQuantity;''',
        content,
        flags=re.DOTALL
    )
    
    # Fix cancel method signature
    content = re.sub(
        r'async cancel\(tenantId: string, id: string\): Promise<WorkOrder>',
        'async cancel(id: string, tenantId: string, user: any): Promise<WorkOrder>',
        content
    )
    
    # Add missing findByBOM method after findByStatus
    if 'async findByBOM(' not in content:
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
            print(f"  ✓ Added findByBOM method")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed work-order.service.ts")

def fix_routing_service(file_path):
    """Fix routing.service.ts - add missing methods and fix parameter order"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix create method signature
    content = re.sub(
        r'async create\(tenantId: string, dto: any\): Promise<Routing>',
        'async create(dto: any, tenantId: string, user: any): Promise<Routing>',
        content
    )
    
    # Fix findOne method signature
    content = re.sub(
        r'async findOne\(tenantId: string, id: string\): Promise<Routing>',
        'async findOne(id: string, tenantId: string): Promise<Routing>',
        content
    )
    
    # Fix addOperation method signature
    content = re.sub(
        r'async addOperation\(tenantId: string, routingId: string, dto: any\): Promise<Operation>',
        'async addOperation(routingId: string, dto: any, tenantId: string, user: any): Promise<Operation>',
        content
    )
    
    # Fix update method signature
    content = re.sub(
        r'async update\(tenantId: string, id: string, dto: any\): Promise<Routing>',
        'async update(id: string, dto: any, tenantId: string, user: any): Promise<Routing>',
        content
    )
    
    # Add missing findByProduct method after findOne
    if 'async findByProduct(' not in content:
        find_one_match = re.search(r'(  async findOne\([^}]+\}\n\n    return routing;\n  \})', content, re.DOTALL)
        if find_one_match:
            new_method = '''

  async findByProduct(productId: string, tenantId: string): Promise<Routing[]> {
    return this.routingRepository.find({
      where: { tenantId },
      relations: ['bom', 'operations', 'operations.workCenter'],
    }).then(routings => routings.filter(r => r.bom?.productId === productId));
  }'''
            content = content.replace(find_one_match.group(1), find_one_match.group(1) + new_method)
            print(f"  ✓ Added findByProduct method")
    
    # Add missing removeOperation method after addOperation
    if 'async removeOperation(' not in content:
        add_operation_match = re.search(r'(  async addOperation\([^}]+\}\n  \})', content, re.DOTALL)
        if add_operation_match:
            new_method = '''

  async removeOperation(routingId: string, operationId: string, tenantId: string, user: any): Promise<void> {
    const routing = await this.findOne(routingId, tenantId);
    const operation = await this.operationRepository.findOne({
      where: { id: operationId, routingId: routing.id, tenantId },
    });
    
    if (!operation) {
      throw new NotFoundException(`Operation with ID ${operationId} not found`);
    }
    
    await this.operationRepository.remove(operation);
  }'''
            content = content.replace(add_operation_match.group(1), add_operation_match.group(1) + new_method)
            print(f"  ✓ Added removeOperation method")
    
    # Add missing calculateTotalCost method after removeOperation
    if 'async calculateTotalCost(' not in content:
        # Find the last method before closing brace
        last_method_match = re.search(r'(  async update\([^}]+\}\n  \})', content, re.DOTALL)
        if last_method_match:
            new_method = '''

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
            content = content.replace(last_method_match.group(1), last_method_match.group(1) + new_method)
            print(f"  ✓ Added calculateTotalCost and remove methods")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed routing.service.ts")

def fix_dashboard_module(file_path):
    """Fix dashboard.module.ts - correct import paths"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix import paths
    content = content.replace(
        "import { Order } from '../order/entities/order.entity';",
        "import { Order } from '../../domains/sales/order/entities/order.entity';"
    )
    content = content.replace(
        "import { Product } from '../product/entities/product.entity';",
        "import { Product } from '../../domains/inventory/product/entities/product.entity';"
    )
    content = content.replace(
        "import { Customer } from '../customer/entities/customer.entity';",
        "import { Customer } from '../../domains/sales/customer/entities/customer.entity';"
    )
    content = content.replace(
        "import { Inventory } from '../inventory/entities/inventory.entity';",
        "import { Inventory } from '../../domains/inventory/inventory/entities/inventory.entity';"
    )
    content = content.replace(
        "import { Payment } from '../payment/entities/payment.entity';",
        "import { Payment } from '../../domains/accounting/payment/entities/payment.entity';"
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed dashboard.module.ts import paths")

def fix_search_module(file_path):
    """Fix search.module.ts - correct import paths"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix import paths
    content = content.replace(
        "import { Product } from '../product/entities/product.entity';",
        "import { Product } from '../../domains/inventory/product/entities/product.entity';"
    )
    content = content.replace(
        "import { Customer } from '../customer/entities/customer.entity';",
        "import { Customer } from '../../domains/sales/customer/entities/customer.entity';"
    )
    content = content.replace(
        "import { Order } from '../order/entities/order.entity';",
        "import { Order } from '../../domains/sales/order/entities/order.entity';"
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Fixed search.module.ts import paths")

def main():
    print("=" * 80)
    print("FIXING ALL 276 REMAINING TYPESCRIPT ERRORS")
    print("Following Odoo/ERPNext pattern: User object first")
    print("=" * 80)
    
    base_path = os.path.dirname(os.path.abspath(__file__))
    
    # Phase 1: Fix duplicate User imports
    print("\n[Phase 1] Fixing duplicate User imports...")
    duplicate_import_files = [
        'integrations/payment-gateway/payment-gateway.controller.ts',
        'integrations/shipping/shipping.controller.ts',
    ]
    
    for file_rel in duplicate_import_files:
        file_path = os.path.join(base_path, file_rel)
        if os.path.exists(file_path):
            print(f"\n📝 {file_rel}")
            fix_duplicate_user_imports(file_path)
    
    # Phase 2: Fix manufacturing services
    print("\n[Phase 2] Fixing manufacturing services...")
    
    # Fix work-center.service.ts
    work_center_service = os.path.join(base_path, 'domains/manufacturing/work-center/work-center.service.ts')
    if os.path.exists(work_center_service):
        print(f"\n📝 work-center.service.ts")
        fix_work_center_service(work_center_service)
    
    # Fix work-order.service.ts
    work_order_service = os.path.join(base_path, 'domains/manufacturing/work-order/work-order.service.ts')
    if os.path.exists(work_order_service):
        print(f"\n📝 work-order.service.ts")
        fix_work_order_service(work_order_service)
    
    # Fix routing.service.ts
    routing_service = os.path.join(base_path, 'domains/manufacturing/routing/routing.service.ts')
    if os.path.exists(routing_service):
        print(f"\n📝 routing.service.ts")
        fix_routing_service(routing_service)
    
    # Phase 3: Fix module import paths
    print("\n[Phase 3] Fixing module import paths...")
    
    # Fix dashboard.module.ts
    dashboard_module = os.path.join(base_path, 'platform/dashboard/dashboard.module.ts')
    if os.path.exists(dashboard_module):
        print(f"\n📝 dashboard.module.ts")
        fix_dashboard_module(dashboard_module)
    
    # Fix search.module.ts
    search_module = os.path.join(base_path, 'platform/search/search.module.ts')
    if os.path.exists(search_module):
        print(f"\n📝 search.module.ts")
        fix_search_module(search_module)
    
    print("\n" + "=" * 80)
    print("✅ PHASE 1-3 COMPLETED")
    print("=" * 80)
    print("\nNext: Run 'npm run build' to check remaining errors")

if __name__ == '__main__':
    main()
