#!/bin/bash

# Kubernetes Deployment Script for Plaster Warehouse ERP
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e

ENVIRONMENT=${1:-production}
NAMESPACE=$ENVIRONMENT

echo "========================================="
echo "Deploying Plaster Warehouse ERP"
echo "Environment: $ENVIRONMENT"
echo "Namespace: $NAMESPACE"
echo "========================================="

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed"
    exit 1
fi

# Check if connected to cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "Error: Not connected to a Kubernetes cluster"
    exit 1
fi

echo ""
echo "Step 1: Creating namespaces..."
kubectl apply -f namespaces/namespaces.yaml

echo ""
echo "Step 2: Creating storage classes..."
kubectl apply -f storage/storage-class.yaml

echo ""
echo "Step 3: Creating ConfigMaps and Secrets..."
echo "WARNING: Please ensure secrets are properly configured before deploying!"
read -p "Have you configured the secrets in config/secrets.yaml? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Please configure secrets first, then run this script again."
    exit 1
fi

kubectl apply -f config/configmap.yaml
kubectl apply -f config/secrets.yaml

echo ""
echo "Step 4: Deploying databases..."
echo "This may take several minutes..."

kubectl apply -f databases/postgresql.yaml
kubectl apply -f databases/mongodb.yaml
kubectl apply -f databases/redis.yaml
kubectl apply -f databases/elasticsearch.yaml
kubectl apply -f databases/rabbitmq.yaml

echo ""
echo "Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s || true
kubectl wait --for=condition=ready pod -l app=mongodb -n $NAMESPACE --timeout=300s || true
kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=300s || true
kubectl wait --for=condition=ready pod -l app=elasticsearch -n $NAMESPACE --timeout=300s || true
kubectl wait --for=condition=ready pod -l app=rabbitmq -n $NAMESPACE --timeout=300s || true

echo ""
echo "Step 5: Deploying microservices..."
kubectl apply -f services/api-gateway.yaml
kubectl apply -f services/auth-service.yaml
# Add other services here as they are created
# kubectl apply -f services/product-service.yaml
# kubectl apply -f services/inventory-service.yaml
# etc.

echo ""
echo "Step 6: Deploying frontend..."
kubectl apply -f services/frontend.yaml

echo ""
echo "Step 7: Setting up ingress..."
echo "Installing NGINX Ingress Controller..."
kubectl apply -f ingress/nginx-ingress-controller.yaml

echo "Waiting for ingress controller to be ready..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=300s || true

echo "Applying ingress rules..."
kubectl apply -f ingress/ingress-rules.yaml

echo ""
echo "========================================="
echo "Deployment completed!"
echo "========================================="
echo ""
echo "Check deployment status:"
echo "  kubectl get all -n $NAMESPACE"
echo ""
echo "Check pod logs:"
echo "  kubectl logs -f <pod-name> -n $NAMESPACE"
echo ""
echo "Get ingress information:"
echo "  kubectl get ingress -n $NAMESPACE"
echo ""
echo "Note: It may take a few minutes for all services to be fully ready."
echo "      DNS records need to be configured to point to the ingress IP."
