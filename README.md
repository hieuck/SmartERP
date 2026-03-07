# SmartERP

A comprehensive Enterprise Resource Planning (ERP) system built with modern technologies for managing warehouse and business operations.

## 🏗️ Architecture

This project uses a **Modular Monolith** architecture with 34 business modules, providing the benefits of microservices organization while maintaining the simplicity of a monolithic deployment.

For detailed architecture information, see [docs/architecture/](docs/architecture/).

## 🚀 Quick Start

See [docs/guides/QUICK-START.md](docs/guides/QUICK-START.md) for detailed setup instructions.

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose (optional)

### Installation

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run database migrations
npm run migration:run

# Start development server
npm run start:dev
```

## 📁 Project Structure

```
smart-erp/
├── src/
│   ├── backend/         # Backend NestJS application
│   │   ├── domains/     # Business domains (DDD pattern)
│   │   │   ├── accounting/      # Financial management
│   │   │   ├── sales/           # Sales & CRM
│   │   │   ├── purchasing/      # Procurement
│   │   │   ├── inventory/       # Warehouse & stock
│   │   │   ├── hr/              # Human resources
│   │   │   ├── manufacturing/   # Production
│   │   │   └── platform/        # Cross-cutting concerns
│   │   ├── common/      # Shared utilities
│   │   ├── migrations/  # Database migrations
│   │   └── main.ts      # Application entry point
│   ├── frontend/        # React 18 application
│   ├── mobile/          # React Native mobile app
│   └── shared/          # Shared code across apps
├── docs/                # Documentation
├── config/              # Infrastructure configs
└── scripts/             # Utility scripts
```

## 📚 Documentation

All documentation is organized in the [docs/](docs/) directory:

- **[Architecture](docs/architecture/)** - Technical architecture and design
- **[Deployment](docs/deployment/)** - Deployment and operations guides
- **[Guides](docs/guides/)** - User and developer guides
  - [Admin Guide](docs/guides/ADMIN-GUIDE.md) - System administration and monitoring
  - [GDPR Compliance Guide](docs/guides/GDPR-COMPLIANCE-GUIDE.md) - Data privacy and user rights
  - [Quick Start Guide](docs/guides/QUICK-START.md) - Getting started
- **[Marketing](docs/marketing/)** - Marketing and sales materials
- **[Reports](docs/reports/)** - Project reports and status

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

**Current Status**: ✅ 27/27 test suites passing, 443/443 tests passing

## 🔧 Development

```bash
# Start development server
npm run start:dev

# Build for production
npm run build

# Run linter
npm run lint

# Format code
npm run format
```

## 📦 Deployment

See [docs/deployment/](docs/deployment/) for detailed deployment instructions.

### Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 🏢 Business Modules

The system includes 34+ business modules organized by domain:

**Core Modules:**
- Authentication & Authorization (JWT-based)
- User Management with RBAC
- Role & Permission Management
- Multi-tenancy (Schema-based isolation)
- GDPR Compliance (Data export, deletion, consent management)

**Business Operations:**
- Product & Category Management
- Inventory & Warehouse Management (Serial/Batch tracking, FIFO valuation)
- Order Processing (Sales & Purchase)
- Customer & Supplier Management
- Payment & Invoice Processing
- Bank Reconciliation

**Advanced Features:**
- Accounting & Financial Reports (Chart of Accounts, Journal Entries, Trial Balance, General Ledger)
- HR & Payroll (Attendance, Leave, Payroll with progressive tax)
- CRM & Marketing
- Manufacturing (BOM, Work Orders, Routing, Work Centers)
- Project Management (Tasks, Gantt charts, Time tracking)
- eCommerce (Product Catalog, Shopping Cart, Checkout, Orders)
- Shipping & Logistics
- Document Management
- Workflow Automation (Approval workflows)
- Reporting & Analytics (Report Builder with 20+ standard reports)

**Platform Features:**
- Performance Optimization (Redis caching, database indexes, rate limiting)
- Monitoring & Logging (Structured logging, metrics, alerts, health checks)
- Security (CSRF protection, security headers, rate limiting)

See [docs/PRODUCT-OVERVIEW.md](docs/PRODUCT-OVERVIEW.md) for complete feature list.

## 🛠️ Technology Stack

**Backend:**
- NestJS 10.x
- TypeScript 5.3
- PostgreSQL 15
- Redis 7
- TypeORM 0.3

**Frontend:**
- React 18
- TypeScript 5.2
- Vite 5
- Ant Design 5
- Redux Toolkit

**Infrastructure:**
- Docker & Docker Compose
- Nginx
- MinIO (Object Storage)

See [docs/architecture/](docs/architecture/) for detailed technology information.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Security

For security concerns, please see [SECURITY.md](SECURITY.md).

## 📞 Support

For questions and support:
- Check [docs/FAQ.md](docs/FAQ.md) for frequently asked questions
- Review [docs/guides/](docs/guides/) for user guides
- See [docs/deployment/](docs/deployment/) for deployment help

## 📊 Project Status

- ✅ **Architecture**: Modular Monolith with DDD (40+ modules across 7 domains)
- ✅ **Tests**: 443+ passing (80%+ coverage)
- ✅ **Code Quality**: ESLint + Prettier configured
- ✅ **Documentation**: Comprehensive guides (Admin, GDPR, Quick Start)
- ✅ **Performance**: < 200ms API response (p95), Redis caching, 47 database indexes
- ✅ **Security**: CSRF protection, rate limiting, security headers, GDPR compliant
- ✅ **Monitoring**: Structured logging, Prometheus metrics, health checks, alerts
- ✅ **Production Ready**: Yes

## 🎯 Roadmap

See [ROADMAP.md](ROADMAP.md) for detailed development roadmap (12-month plan to 80%+ feature parity with Odoo/ERPNext).

---

**Built with ❤️ for efficient warehouse management**
