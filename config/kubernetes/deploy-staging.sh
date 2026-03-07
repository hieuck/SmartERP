#!/bin/bash

# Staging Environment Deployment Script
# This script deploys the application to the staging environment

set -e

NAMESPACE="staging"
ENVIRONMENT="staging"
DOMAIN="staging.plaster-erp.com"

echo "=========================================="
echo "Deploying to Staging Environment"
echo "=========================================="
echo "Namespace: $NAMESPACE"
echo "Domain: $DOMAIN"
echo ""

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed"
    exit 1
fi

# Check if connected to cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "Error: Not connected to Kubernetes cluster"
    exit 1
fi

# Create namespace if it doesn't exist
echo "Creating namespace..."
kubectl apply -f namespaces/environments.yaml

# Create or update secrets
echo "Setting up secrets..."
if [ -f "config/secrets-staging.yaml" ]; then
    kubectl apply -f config/secrets-staging.yaml -n $NAMESPACE
else
    echo "Warning: config/secrets-staging.yaml not found. Using default secrets."
    kubectl apply -f config/secrets.yaml -n $NAMESPACE
fi

# Create or update configmaps
echo "Setting up configmaps..."
kubectl apply -f config/configmap-staging.yaml -n $NAMESPACE

# Deploy storage
echo "Setting up storage..."
kubectl apply -f storage/storage-class.yaml

# Deploy databases
echo "Deploying databases..."
kubectl apply -f databases/postgresql.yaml -n $NAMESPACE
kubectl apply -f databases/mongodb.yaml -n $NAMESPACE
kubectl apply -f databases/redis.yaml -n $NAMESPACE
kubectl apply -f databases/rabbitmq.yaml -n $NAMESPACE

# Wait for databases to be ready
echo "Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=5m
kubectl wait --for=condition=ready pod -l app=mongodb -n $NAMESPACE --timeout=5m
kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=5m
kubectl wait --for=condition=ready pod -l app=rabbitmq -n $NAMESPACE --timeout=5m

echo "Databases are ready!"

# Deploy microservices
echo "Deploying microservices..."
kubectl apply -f services/api-gateway.yaml -n $NAMESPACE
kubectl apply -f services/auth-service.yaml -n $NAMESPACE
kubectl apply -f services/product-service.yaml -n $NAMESPACE
kubectl apply -f services/inventory-service.yaml -n $NAMESPACE
kubectl apply -f services/order-service.yaml -n $NAMESPACE
kubectl apply -f services/customer-service.yaml -n $NAMESPACE
kubectl apply -f services/supplier-service.yaml -n $NAMESPACE

# Wait for services to be ready
echo "Waiting for services to be ready..."
kubectl wait --for=condition=available deployment -l tier=backend -n $NAMESPACE --timeout=10m

echo "Services are ready!"

# Deploy frontend
echo "Deploying frontend..."
kubectl apply -f services/frontend.yaml -n $NAMESPACE

# Wait for frontend to be ready
kubectl wait --for=condition=available deployment/frontend -n $NAMESPACE --timeout=5m

echo "Frontend is ready!"

# Setup ingress
echo "Setting up ingress..."
kubectl apply -f ingress/ingress-staging.yaml -n $NAMESPACE

# Get ingress IP
echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Checking ingress status..."
kubectl get ingress -n $NAMESPACE

echo ""
echo "Application URLs:"
echo "  Frontend: https://app.$DOMAIN"
echo "  API: https://api.$DOMAIN"
echo ""

echo "To check deployment status:"
echo "  kubectl get pods -n $NAMESPACE"
echo "  kubectl get services -n $NAMESPACE"
echo ""

echo "To view logs:"
echo "  kubectl logs -f deployment/api-gateway -n $NAMESPACE"
echo ""

echo "To access services locally:"
echo "  kubectl port-forward svc/api-gateway 3000:3000 -n $NAMESPACE"
echo ""

# Run smoke tests
echo "Running smoke tests..."
sleep 10

# Port-forward for testing
kubectl port-forward -n $NAMESPACE svc/api-gateway 8080:3000 &
PF_PID=$!
sleep 5

# Test health endpoint
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    kill $PF_PID
    exit 1
fi

# Test API endpoint
if curl -f http://localhost:8080/api/v1/health > /dev/null 2>&1; then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed"
    kill $PF_PID
    exit 1
fi

kill $PF_PID

echo ""
echo "✅ All smoke tests passed!"
echo ""
echo "Staging deployment completed successfully!"
