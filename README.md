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
cd backend/monolith-app
npm run migration:run

# Start development server
npm run start:dev
```

## 📁 Project Structure

```
smart-erp/
├── backend/              # Backend monolith application
│   └── monolith-app/    # Main NestJS application (34 modules)
├── frontend/            # React frontend application
├── mobile/              # React Native mobile app
├── docs/                # Documentation
├── infrastructure/      # Infrastructure configs
├── scripts/             # Utility scripts
└── shared/              # Shared code
```

## 📚 Documentation

All documentation is organized in the [docs/](docs/) directory:

- **[Architecture](docs/architecture/)** - Technical architecture and design
- **[Deployment](docs/deployment/)** - Deployment and operations guides
- **[Guides](docs/guides/)** - User and developer guides
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

**Current Status**: ✅ 27/27 test suites passing, 434/434 tests passing

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

The system includes 34 business modules:

**Core Modules:**
- Authentication & Authorization
- User Management
- Role & Permission Management
- Multi-tenancy

**Business Operations:**
- Product & Category Management
- Inventory & Warehouse Management
- Order Processing
- Customer & Supplier Management
- Payment & Invoice Processing

**Advanced Features:**
- Accounting & Financial Reports
- HR & Payroll
- CRM & Marketing
- Production Management
- Shipping & Logistics
- Document Management
- Workflow Automation
- Reporting & Analytics

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

- ✅ **Architecture**: Modular Monolith (34 modules)
- ✅ **Tests**: 434/434 passing
- ✅ **Code Quality**: ESLint + Prettier configured
- ✅ **Documentation**: Comprehensive and organized
- ✅ **Production Ready**: Yes

## 🎯 Roadmap

See [docs/BUOC-TIEP-THEO.md](docs/BUOC-TIEP-THEO.md) for development roadmap and future plans.

---

**Built with ❤️ for efficient warehouse management**
