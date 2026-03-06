# Backup Information

**Date:** 2026-03-01 07:45:36  
**Reason:** Phase 2 - Clean Slate Setup  
**Action:** Creating new project structure based on enterprise patterns research

## Original Project Structure

This backup preserves the original microservices-based architecture before refactoring to modular monolith.

### Key Components Backed Up:
- Backend microservices (40+ services)
- Frontend (React + Vite)
- Mobile (React Native)
- Infrastructure configs
- Documentation

### Original Architecture:
- Microservices architecture
- Multiple databases (PostgreSQL, MongoDB, Redis)
- Message queues (RabbitMQ, Kafka, NATS)
- API Gateway
- Docker Compose setup

## New Architecture (Phase 2+)

Based on research from:
- Odoo (modular monolith, ORM patterns)
- ERPNext (metadata-driven, DocType system)
- Enterprise patterns (DDD, CQRS, Event Sourcing)
- Vietnam ERP (localization-first, compliance-driven)

### New Approach:
- Modular Monolith (start simple, microservices-ready)
- NestJS + TypeScript
- PostgreSQL (single database, multi-tenant)
- Domain-Driven Design
- Test-Driven Development (TDD)
- Vietnam-first localization

## Restoration

To restore original code:
```bash
# All original code is preserved in this directory
# No files were deleted, only new structure created alongside
```

## References

- Research: `.kiro/research/`
- Guidelines: `.kiro/guidelines/`
- Roadmap: `.kiro/memory/core/roadmap.md`
