---
name: workflow-state-machine-patterns
description: Workflow and state machine patterns for managing complex business processes with approval flows. Use when implementing order workflows, approval processes, or status transitions.
---

# Workflow & State Machine Patterns

## 1. State Machine Definition

```typescript
enum OrderStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

const orderStateMachine = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['COMPLETED', 'CANCELLED'],
  REJECTED: ['DRAFT'],
  COMPLETED: [],
  CANCELLED: [],
};
```

## 2. State Transition Validation

```typescript
async updateStatus(orderId: string, newStatus: OrderStatus, user: User) {
  const order = await this.findById(orderId, user);

  const allowedTransitions = orderStateMachine[order.status];
  if (!allowedTransitions.includes(newStatus)) {
    throw new BadRequestException(
      `Cannot transition from ${order.status} to ${newStatus}`
    );
  }

  order.status = newStatus;
  order.updatedBy = user.id;

  return this.secureRepo.save(user, order);
}
```

## 3. Workflow with Approvals

```typescript
@Entity()
export class WorkflowStep {
  @Column()
  orderId: string;

  @Column()
  step: number;

  @Column()
  approverId: string;

  @Column()
  status: 'PENDING' | 'APPROVED' | 'REJECTED';

  @Column()
  approvedAt: Date;
}

async submitForApproval(orderId: string, user: User) {
  const order = await this.findById(orderId, user);

  // Create workflow steps
  const approvers = await this.getApprovers(order);
  for (const [index, approver] of approvers.entries()) {
    await this.workflowRepo.save({
      orderId: order.id,
      step: index + 1,
      approverId: approver.id,
      status: 'PENDING',
    });
  }

  order.status = OrderStatus.SUBMITTED;
  return this.secureRepo.save(user, order);
}
```

## 4. Event-Driven Workflow

```typescript
@Injectable()
export class OrderWorkflowService {
  async onOrderApproved(order: Order) {
    // Send notification
    await this.notificationService.send({
      to: order.createdBy,
      message: 'Your order has been approved',
    });

    // Update inventory
    await this.inventoryService.reserve(order.items);

    // Create invoice
    await this.invoiceService.create(order);
  }
}
```
