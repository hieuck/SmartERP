# 🚀 Performance Optimization Plan

**Phase**: 4, Month 10, Week 39-41  
**Created**: 2026-03-07  
**Status**: 🏗️ In Progress

---

## 📊 Current Performance Baseline

### Metrics to Improve
- **API Response Time (p95)**: Target < 200ms
- **Database Query Time**: Target < 50ms
- **Test Coverage**: Current 70% → Target 80%+
- **Frontend Load Time**: Target < 3s

---

## 🎯 Optimization Strategy

### Week 39: Database Optimization
1. **Database Indexes Audit**
   - Review all entities for missing indexes
   - Add composite indexes for common queries
   - Add indexes for foreign keys
   - Add indexes for frequently filtered fields

2. **Query Optimization**
   - Identify N+1 queries
   - Use eager loading where appropriate
   - Use QueryBuilder for complex queries
   - Select specific columns instead of SELECT *

3. **Performance Testing**
   - Add query performance tests
   - Benchmark critical queries
   - Monitor slow queries

### Week 40: Redis Caching
1. **Setup Redis Module**
   - Install @nestjs/cache-manager
   - Configure Redis connection
   - Setup cache interceptors

2. **Implement Caching Layer**
   - Cache frequently accessed data
   - Cache expensive computations
   - Cache API responses

3. **Cache Invalidation**
   - Invalidate on updates
   - TTL strategy
   - Cache warming

### Week 41: API & Frontend Optimization
1. **API Rate Limiting**
   - Install @nestjs/throttler
   - Configure rate limits
   - Add rate limit guards

2. **Frontend Bundle Optimization**
   - Code splitting
   - Tree shaking
   - Minification

3. **Lazy Loading**
   - Route-based code splitting
   - Component lazy loading
   - Image lazy loading

---

## 📋 Database Indexes Audit

### Entities Needing Index Optimization

#### ✅ Already Well-Indexed
- `Order` - Has tenantId+orderNumber, tenantId+customerId
- `Customer` - Has tenantId+email, tenantId+status
- `Supplier` - Has tenantId+email
- `Product` - Has tenantId+sku, tenantId+status
- `Inventory` - Has tenantId+productId+warehouseId
- `AuditLog` - Has tenantId+createdAt, tenantId+userId
- `WorkOrder` - Has tenantId+status, tenantId+productId
- `Task` - Has tenantId+projectId, tenantId+assigneeId
- `Project` - Has tenantId+status, tenantId+projectManagerId
- `TimeEntry` - Has tenantId+userId, tenantId+taskId

#### ⚠️ Missing Indexes (Need to Add)

**High Priority** (Frequently queried):
1. **Lead** - Missing indexes for status, source, assignedTo
2. **Opportunity** - Missing indexes for status, stage, assignedTo
3. **Notification** - Missing indexes for userId, isRead, createdAt
4. **EmailLog** - Missing indexes for status, sentAt, recipientEmail
5. **EmailTemplate** - Missing indexes for type, isActive
6. **Document** - Missing indexes for entityType, entityId, uploadedBy
7. **Workflow** - Missing indexes for entityType, isActive
8. **WorkflowInstance** - Missing indexes for workflowId, status
9. **ApprovalRequest** - Missing indexes for status, requesterId, approverId
10. **Report** - Missing indexes for createdBy, isPublic
11. **ReportExecution** - Missing indexes for reportId, executedBy, status

**Medium Priority** (Occasionally queried):
12. **ReportColumn** - Missing index for reportId
13. **BOMLine** - Has tenantId+bomId (OK)
14. **Operation** - Has tenantId+routingId (OK)
15. **Routing** - Has tenantId+bomId (OK)

---

## 🔧 Implementation Plan

### Step 1: Add Missing Indexes (High Priority)

Create migration file to add indexes for:
- Lead (status, source, assignedTo)
- Opportunity (status, stage, assignedTo)
- Notification (userId, isRead, createdAt)
- EmailLog (status, sentAt, recipientEmail)
- EmailTemplate (type, isActive)
- Document (entityType, entityId, uploadedBy)
- Workflow (entityType, isActive)
- WorkflowInstance (workflowId, status)
- ApprovalRequest (status, requesterId, approverId)
- Report (createdBy, isPublic)
- ReportExecution (reportId, executedBy, status)

### Step 2: Optimize N+1 Queries

Identify services with N+1 queries:
- [ ] OrderService - Check if loading customer/items causes N+1
- [ ] ProjectService - Check if loading tasks causes N+1
- [ ] TaskService - Check if loading dependencies causes N+1
- [ ] ReportService - Check if loading columns/executions causes N+1

### Step 3: Add Query Performance Tests

Create performance test suite:
- [ ] Test query execution time < 50ms
- [ ] Test API response time < 200ms
- [ ] Test concurrent requests handling
- [ ] Test cache hit rate

### Step 4: Setup Redis Caching

- [ ] Install dependencies
- [ ] Configure Redis module
- [ ] Add cache interceptors
- [ ] Implement cache invalidation

### Step 5: Add Rate Limiting

- [ ] Install @nestjs/throttler
- [ ] Configure rate limits (100 req/min per IP)
- [ ] Add throttler guards to controllers
- [ ] Test rate limiting

---

## 📈 Success Metrics

### Before Optimization
- API Response Time (p95): TBD
- Database Query Time: TBD
- Cache Hit Rate: 0% (no cache)
- Test Coverage: 70%

### After Optimization (Target)
- API Response Time (p95): < 200ms
- Database Query Time: < 50ms
- Cache Hit Rate: > 80%
- Test Coverage: > 80%

---

## 🚀 Next Steps

1. ✅ Create this optimization plan
2. ⏳ Create migration for missing indexes
3. ⏳ Update entities with @Index decorators
4. ⏳ Audit services for N+1 queries
5. ⏳ Add query performance tests
6. ⏳ Setup Redis caching
7. ⏳ Add rate limiting
8. ⏳ Update ROADMAP and CHANGELOG

---

**Status**: 🏗️ In Progress  
**Next**: Create migration for missing indexes
