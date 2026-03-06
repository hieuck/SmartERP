#!/bin/bash

# Kubernetes Cleanup Script for Plaster Warehouse ERP
# WARNING: This will delete all resources in the specified namespace
# Usage: ./cleanup.sh [environment]
# Example: ./cleanup.sh staging

set -e

ENVIRONMENT=${1:-staging}
NAMESPACE=$ENVIRONMENT

echo "========================================="
echo "WARNING: This will delete all resources"
echo "Environment: $ENVIRONMENT"
echo "Namespace: $NAMESPACE"
echo "========================================="
echo ""

read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "Starting cleanup..."

# Delete ingress first
echo "Deleting ingress..."
kubectl delete ingress --all -n $NAMESPACE --ignore-not-found=true

# Delete services
echo "Deleting services..."
kubectl delete -f services/ -n $NAMESPACE --ignore-not-found=true

# Wait a bit for services to terminate
sleep 5

# Delete databases
echo "Deleting databases..."
kubectl delete -f databases/ -n $NAMESPACE --ignore-not-found=true

# Delete configs
echo "Deleting ConfigMaps and Secrets..."
kubectl delete configmap --all -n $NAMESPACE --ignore-not-found=true
kubectl delete secret --all -n $NAMESPACE --ignore-not-found=true

# Delete PVCs
echo "Deleting PersistentVolumeClaims..."
kubectl delete pvc --all -n $NAMESPACE --ignore-not-found=true

# Optionally delete namespace
read -p "Do you want to delete the namespace '$NAMESPACE'? (yes/no): " delete_ns
if [ "$delete_ns" == "yes" ]; then
    echo "Deleting namespace..."
    kubectl delete namespace $NAMESPACE --ignore-not-found=true
fi

echo ""
echo "========================================="
echo "Cleanup completed!"
echo "========================================="
