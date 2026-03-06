.PHONY: help install dev test build clean docker-up docker-down migrate seed

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	npm install

dev: ## Start development server
	npm run start:dev

test: ## Run tests
	npm run test

test-cov: ## Run tests with coverage
	npm run test:cov

build: ## Build application
	npm run build

clean: ## Clean build artifacts
	rm -rf dist coverage node_modules

docker-up: ## Start Docker containers
	docker-compose up -d

docker-down: ## Stop Docker containers
	docker-compose down -v

docker-logs: ## Show Docker logs
	docker-compose logs -f

docker-test: ## Run tests in Docker
	docker-compose -f docker-compose.test.yml up --abort-on-container-exit

migrate: ## Run database migrations
	npm run migration:run

migrate-revert: ## Revert last migration
	npm run migration:revert

migrate-generate: ## Generate new migration
	@read -p "Enter migration name: " name; \
	npm run migration:generate src/database/migrations/$$name

seed: ## Seed database
	npm run seed

db-reset: ## Reset database (drop, migrate, seed)
	docker-compose down -v
	docker-compose up -d postgres redis
	sleep 5
	npm run migration:run
	npm run seed

lint: ## Run linter
	npm run lint

lint-fix: ## Fix linting issues
	npm run lint -- --fix

format: ## Format code
	npm run format

type-check: ## Run TypeScript type checking
	npm run type-check

quality: ## Run all quality checks
	make lint && make type-check && make test-cov

docker-build-prod: ## Build production Docker image
	docker build -t smart-erp-backend:latest -f Dockerfile .

docker-run-prod: ## Run production Docker container
	docker run -p 3000:3000 --env-file .env smart-erp-backend:latest
