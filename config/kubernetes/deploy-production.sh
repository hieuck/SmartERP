#!/bin/bash

# Production Environment Deployment Script
# This script deploys the application to the production environment with blue-green deployment

set -e

NAMESPACE="production"
ENVIRONMENT="production"
DOMAIN="plaster-erp.com"

echo "=========================================="
echo "Deploying to Production Environment"
echo "=========================================="
echo "Namespace: $NAMESPACE"
echo "Domain: $DOMAIN"
echo "Strategy: Blue-Green Deployment"
echo ""

# Safety check
read -p "Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled"
    exit 0
fi

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
if [ -f "config/secrets-production.yaml" ]; then
    kubectl apply -f config/secrets-production.yaml -n $NAMESPACE
else
    echo "Error: config/secrets-production.yaml not found"
    exit 1
fi

# Create or update configmaps
echo "Setting up configmaps..."
kubectl apply -f config/configmap-production.yaml -n $NAMESPACE

# Deploy storage
echo "Setting up storage..."
kubectl apply -f storage/storage-class.yaml

# Check if databases are already running
DB_EXISTS=$(kubectl get statefulset -n $NAMESPACE 2>/dev/null | grep -c postgres || true)

if [ "$DB_EXISTS" -eq 0 ]; then
    echo "Deploying databases (first-time setup)..."
    kubectl apply -f databases/postgresql.yaml -n $NAMESPACE
    kubectl apply -f databases/mongodb.yaml -n $NAMESPACE
    kubectl apply -f databases/redis.yaml -n $NAMESPACE
    kubectl apply -f databases/rabbitmq.yaml -n $NAMESPACE
    
    # Wait for databases to be ready
    echo "Waiting for databases to be ready..."
    kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=10m
    kubectl wait --for=condition=ready pod -l app=mongodb -n $NAMESPACE --timeout=10m
    kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=10m
    kubectl wait --for=condition=ready pod -l app=rabbitmq -n $NAMESPACE --timeout=10m
    
    echo "Databases are ready!"
else
    echo "Databases already exist, skipping database deployment"
fi

# Determine current active deployment (blue or green)
CURRENT_ACTIVE=$(kubectl get service api-gateway -n $NAMESPACE -o jsonpath='{.spec.selector.version}' 2>/dev/null || echo "blue")

if [ "$CURRENT_ACTIVE" == "blue" ]; then
    NEW_VERSION="green"
    OLD_VERSION="blue"
else
    NEW_VERSION="blue"
    OLD_VERSION="green"
fi

echo ""
echo "Current active deployment: $OLD_VERSION"
echo "Deploying to: $NEW_VERSION"
echo ""

# Deploy blue-green services
echo "Deploying microservices with blue-green strategy..."
kubectl apply -f services/api-gateway-blue-green.yaml -n $NAMESPACE
kubectl apply -f services/auth-service-blue-green.yaml -n $NAMESPACE
kubectl apply -f services/product-service-blue-green.yaml -n $NAMESPACE
kubectl apply -f services/inventory-service-blue-green.yaml -n $NAMESPACE
kubectl apply -f services/order-service-blue-green.yaml -n $NAMESPACE
kubectl apply -f services/customer-service-blue-green.yaml -n $NAMESPACE
kubectl apply -f services/supplier-service-blue-green.yaml -n $NAMESPACE

# Scale up new version
echo "Scaling up $NEW_VERSION deployment..."
kubectl scale deployment api-gateway-$NEW_VERSION --replicas=3 -n $NAMESPACE
kubectl scale deployment auth-service-$NEW_VERSION --replicas=3 -n $NAMESPACE
kubectl scale deployment product-service-$NEW_VERSION --replicas=3 -n $NAMESPACE
kubectl scale deployment inventory-service-$NEW_VERSION --replicas=3 -n $NAMESPACE
kubectl scale deployment order-service-$NEW_VERSION --replicas=3 -n $NAMESPACE
kubectl scale deployment customer-service-$NEW_VERSION --replicas=3 -n $NAMESPACE
kubectl scale deployment supplier-service-$NEW_VERSION --replicas=3 -n $NAMESPACE

# Wait for new version to be ready
echo "Waiting for $NEW_VERSION deployment to be ready..."
kubectl wait --for=condition=available deployment/api-gateway-$NEW_VERSION -n $NAMESPACE --timeout=10m
kubectl wait --for=condition=available deployment/auth-service-$NEW_VERSION -n $NAMESPACE --timeout=10m
kubectl wait --for=condition=available deployment/product-service-$NEW_VERSION -n $NAMESPACE --timeout=10m
kubectl wait --for=condition=available deployment/inventory-service-$NEW_VERSION -n $NAMESPACE --timeout=10m
kubectl wait --for=condition=available deployment/order-service-$NEW_VERSION -n $NAMESPACE --timeout=10m
kubectl wait --for=condition=available deployment/customer-service-$NEW_VERSION -n $NAMESPACE --timeout=10m
kubectl wait --for=condition=available deployment/supplier-service-$NEW_VERSION -n $NAMESPACE --timeout=10m

echo "$NEW_VERSION deployment is ready!"

# Deploy frontend
echo "Deploying frontend..."
kubectl apply -f services/frontend.yaml -n $NAMESPACE
kubectl wait --for=condition=available deployment/frontend -n $NAMESPACE --timeout=5m

echo "Frontend is ready!"

# Run smoke tests on new version
echo ""
echo "Running smoke tests on $NEW_VERSION deployment..."

# Port-forward to new version for testing
kubectl port-forward -n $NAMESPACE svc/api-gateway-$NEW_VERSION 8080:3000 &
PF_PID=$!
sleep 5

# Test health endpoint
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    kill $PF_PID
    echo "Deployment failed. Rolling back..."
    kubectl scale deployment api-gateway-$NEW_VERSION --replicas=0 -n $NAMESPACE
    exit 1
fi

# Test API endpoint
if curl -f http://localhost:8080/api/v1/health > /dev/null 2>&1; then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed"
    kill $PF_PID
    echo "Deployment failed. Rolling back..."
    kubectl scale deployment api-gateway-$NEW_VERSION --replicas=0 -n $NAMESPACE
    exit 1
fi

kill $PF_PID

echo "✅ All smoke tests passed!"
echo ""

# Ask for confirmation to switch traffic
read -p "Switch traffic to $NEW_VERSION deployment? (yes/no): " switch_confirm
if [ "$switch_confirm" != "yes" ]; then
    echo "Traffic switch cancelled. $NEW_VERSION deployment is running but not receiving traffic."
    echo "To switch traffic manually, run:"
    echo "  kubectl patch service api-gateway -n $NAMESPACE -p '{\"spec\":{\"selector\":{\"version\":\"$NEW_VERSION\"}}}'"
    exit 0
fi

# Switch traffic to new version
echo "Switching traffic to $NEW_VERSION deployment..."
kubectl patch service api-gateway -n $NAMESPACE -p "{\"spec\":{\"selector\":{\"version\":\"$NEW_VERSION\"}}}"
kubectl patch service auth-service -n $NAMESPACE -p "{\"spec\":{\"selector\":{\"version\":\"$NEW_VERSION\"}}}"
kubectl patch service product-service -n $NAMESPACE -p "{\"spec\":{\"selector\":{\"version\":\"$NEW_VERSION\"}}}"
kubectl patch service inventory-service -n $NAMESPACE -p "{\"spec\":{\"selector\":{\"version\":\"$NEW_VERSION\"}}}"
kubectl patch service order-service -n $NAMESPACE -p "{\"spec\":{\"selector\":{\"version\":\"$NEW_VERSION\"}}}"
kubectl patch service customer-service -n $NAMESPACE -p "{\"spec\":{\"selector\":{\"version\":\"$NEW_VERSION\"}}}"
kubectl patch service supplier-service -n $NAMESPACE -p "{\"spec\":{\"selector\":{\"version\":\"$NEW_VERSION\"}}}"

echo "Traffic switched to $NEW_VERSION!"

# Monitor new deployment
echo ""
echo "Monitoring $NEW_VERSION deployment for 2 minutes..."
sleep 120

# Check for errors
ERROR_COUNT=$(kubectl logs -n $NAMESPACE -l version=$NEW_VERSION --tail=100 | grep -i error | wc -l)

if [ $ERROR_COUNT -gt 10 ]; then
    echo "⚠️  Warning: Found $ERROR_COUNT errors in logs"
    read -p "Continue with deployment? (yes/no): " error_confirm
    if [ "$error_confirm" != "yes" ]; then
        echo "Rolling back to $OLD_VERSION..."
        kubectl patch service api-gateway -n $NAMESPACE -p "{\"spec\":{\"selector\":{\"version\":\"$OLD_VERSION\"}}}"
        exit 1
    fi
fi

# Scale down old version
echo ""
read -p "Scale down $OLD_VERSION deployment? (yes/no): " scale_confirm
if [ "$scale_confirm" == "yes" ]; then
    echo "Scaling down $OLD_VERSION deployment..."
    kubectl scale deployment api-gateway-$OLD_VERSION --replicas=0 -n $NAMESPACE
    kubectl scale deployment auth-service-$OLD_VERSION --replicas=0 -n $NAMESPACE
    kubectl scale deployment product-service-$OLD_VERSION --replicas=0 -n $NAMESPACE
    kubectl scale deployment inventory-service-$OLD_VERSION --replicas=0 -n $NAMESPACE
    kubectl scale deployment order-service-$OLD_VERSION --replicas=0 -n $NAMESPACE
    kubectl scale deployment customer-service-$OLD_VERSION --replicas=0 -n $NAMESPACE
    kubectl scale deployment supplier-service-$OLD_VERSION --replicas=0 -n $NAMESPACE
    echo "$OLD_VERSION deployment scaled down (kept for rollback)"
else
    echo "$OLD_VERSION deployment kept running for manual rollback"
fi

# Setup ingress
echo ""
echo "Setting up ingress..."
kubectl apply -f ingress/ingress-production.yaml -n $NAMESPACE

# Get ingress IP
echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Active deployment: $NEW_VERSION"
echo "Previous deployment: $OLD_VERSION (scaled to 0)"
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

echo "To rollback to $OLD_VERSION:"
echo "  kubectl patch service api-gateway -n $NAMESPACE -p '{\"spec\":{\"selector\":{\"version\":\"$OLD_VERSION\"}}}'"
echo "  kubectl scale deployment api-gateway-$OLD_VERSION --replicas=3 -n $NAMESPACE"
echo ""

echo "✅ Production deployment completed successfully!"
