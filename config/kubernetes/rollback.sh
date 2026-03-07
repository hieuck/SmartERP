#!/bin/bash

# Rollback Script for Blue-Green Deployment
# This script performs rollback operations for staging or production environments

set -e

# Parse arguments
ENVIRONMENT=${1:-"staging"}
ROLLBACK_TYPE=${2:-"switch"}  # switch, revision, or specific

if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo "Error: Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

NAMESPACE=$ENVIRONMENT

echo "=========================================="
echo "Rollback Procedure"
echo "=========================================="
echo "Environment: $ENVIRONMENT"
echo "Namespace: $NAMESPACE"
echo "Rollback Type: $ROLLBACK_TYPE"
echo ""

# Safety check for production
if [ "$ENVIRONMENT" == "production" ]; then
    read -p "Are you sure you want to rollback PRODUCTION? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Rollback cancelled"
        exit 0
    fi
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

# Backup current state
echo "Backing up current state..."
BACKUP_DIR="rollback-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

kubectl get deployments -n $NAMESPACE -o yaml > $BACKUP_DIR/deployments.yaml
kubectl get services -n $NAMESPACE -o yaml > $BACKUP_DIR/services.yaml
kubectl get pods -n $NAMESPACE -o yaml > $BACKUP_DIR/pods.yaml

echo "Backup saved to $BACKUP_DIR"
echo ""

if [ "$ROLLBACK_TYPE" == "switch" ]; then
    # Blue-Green switch rollback
    echo "Performing blue-green switch rollback..."
    
    # Determine current active version
    CURRENT_ACTIVE=$(kubectl get service api-gateway -n $NAMESPACE -o jsonpath='{.spec.selector.version}' 2>/dev/null || echo "blue")
    
    if [ "$CURRENT_ACTIVE" == "blue" ]; then
        ROLLBACK_TO="green"
    else
        ROLLBACK_TO="blue"
    fi
    
    echo "Current active: $CURRENT_ACTIVE"
    echo "Rolling back to: $ROLLBACK_TO"
    echo ""
    
    # Check if rollback target exists
    POD_COUNT=$(kubectl get pods -n $NAMESPACE -l version=$ROLLBACK_TO --no-headers 2>/dev/null | wc -l)
    
    if [ $POD_COUNT -eq 0 ]; then
        echo "No pods found for version $ROLLBACK_TO. Scaling up..."
        
        # Scale up rollback target
        kubectl scale deployment api-gateway-$ROLLBACK_TO --replicas=3 -n $NAMESPACE
        kubectl scale deployment auth-service-$ROLLBACK_TO --replicas=3 -n $NAMESPACE
        kubectl scale deployment product-service-$ROLLBACK_TO --replicas=3 -n $NAMESPACE
        kubectl scale deployment inventory-service-$ROLLBACK_TO --replicas=3 -n $NAMESPACE
        kubectl scale deployment order-service-$ROLLBACK_TO --replicas=3 -n $NAMESPACE
        kubectl scale deployment customer-service-$ROLLBACK_TO --replicas=3 -n $NAMESPACE
        kubectl scale deployment supplier-service-$ROLLBACK_TO --replicas=3 -n $NAMESPACE
        
        # Wait for pods to be ready
        echo "Waiting for $ROLLBACK_TO deployment to be ready..."
        kubectl wait --for=condition=ready pod -l version=$ROLLBACK_TO -n $NAMESPACE --timeout=10m
    fi
    
    # Run health checks on rollback target
    echo "Running health checks on $ROLLBACK_TO deployment..."
    
    kubectl port-forward -n $NAMESPACE svc/api-gateway-$ROLLBACK_TO 8080:3000 &
    PF_PID=$!
    sleep 5
    
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        echo "✅ Health check passed"
    else
        echo "❌ Health check failed"
        kill $PF_PID
        echo "Rollback aborted - target deployment is not healthy"
        exit 1
    fi
    
    kill $PF_PID
    
    # Switch traffic
    echo ""
    echo "Switching traffic to $ROLLBACK_TO..."
    
    kubectl patch service api-gateway -n $NAMESPACE -p "{\"spec\":{\"selector\":{\"version\":\"$ROLLBACK_TO\"}}}"
    kubectl patch service auth-service -n $NAMESPACE -p "{\"spec\":{\"selector\":{\"version\":\"$ROLLBACK_TO\"}}}"
    kubectl patch service product-service -n $NAMESPACE -p "{\"spec\":{\"selector\":{\"version\":\"$ROLLBACK_TO\"}}}"
    kubectl patch service inventory-service -n $NAMESPACE -p "{\"spec\":{\"selector\":{\"version\":\"$ROLLBACK_TO\"}}}"
    kubectl patch service order-service -n $NAMESPACE -p "{\"spec\":{\"selector\":{\"version\":\"$ROLLBACK_TO\"}}}"
    kubectl patch service customer-service -n $NAMESPACE -p "{\"spec\":{\"selector\":{\"version\":\"$ROLLBACK_TO\"}}}"
    kubectl patch service supplier-service -n $NAMESPACE -p "{\"spec\":{\"selector\":{\"version\":\"$ROLLBACK_TO\"}}}"
    
    echo "Traffic switched to $ROLLBACK_TO!"
    
    # Scale down old version
    echo ""
    read -p "Scale down $CURRENT_ACTIVE deployment? (yes/no): " scale_confirm
    if [ "$scale_confirm" == "yes" ]; then
        echo "Scaling down $CURRENT_ACTIVE deployment..."
        kubectl scale deployment api-gateway-$CURRENT_ACTIVE --replicas=0 -n $NAMESPACE
        kubectl scale deployment auth-service-$CURRENT_ACTIVE --replicas=0 -n $NAMESPACE
        kubectl scale deployment product-service-$CURRENT_ACTIVE --replicas=0 -n $NAMESPACE
        kubectl scale deployment inventory-service-$CURRENT_ACTIVE --replicas=0 -n $NAMESPACE
        kubectl scale deployment order-service-$CURRENT_ACTIVE --replicas=0 -n $NAMESPACE
        kubectl scale deployment customer-service-$CURRENT_ACTIVE --replicas=0 -n $NAMESPACE
        kubectl scale deployment supplier-service-$CURRENT_ACTIVE --replicas=0 -n $NAMESPACE
    fi

elif [ "$ROLLBACK_TYPE" == "revision" ]; then
    # Rollback to previous revision
    echo "Rolling back to previous revision..."
    
    SERVICES="api-gateway auth-service product-service inventory-service order-service customer-service supplier-service"
    
    for service in $SERVICES; do
        echo "Rolling back $service..."
        kubectl rollout undo deployment/$service -n $NAMESPACE
        kubectl rollout status deployment/$service -n $NAMESPACE --timeout=5m
    done
    
    echo "Rollback to previous revision complete!"

elif [ "$ROLLBACK_TYPE" == "specific" ]; then
    # Rollback to specific revision
    if [ -z "$3" ]; then
        echo "Error: Revision number required for specific rollback"
        echo "Usage: $0 $ENVIRONMENT specific <revision-number>"
        exit 1
    fi
    
    REVISION=$3
    echo "Rolling back to revision $REVISION..."
    
    SERVICES="api-gateway auth-service product-service inventory-service order-service customer-service supplier-service"
    
    for service in $SERVICES; do
        echo "Rolling back $service to revision $REVISION..."
        kubectl rollout undo deployment/$service --to-revision=$REVISION -n $NAMESPACE
        kubectl rollout status deployment/$service -n $NAMESPACE --timeout=5m
    done
    
    echo "Rollback to revision $REVISION complete!"

else
    echo "Error: Invalid rollback type. Use 'switch', 'revision', or 'specific'"
    exit 1
fi

# Verify rollback
echo ""
echo "Verifying rollback..."
echo ""

# Check pod status
echo "Pod status:"
kubectl get pods -n $NAMESPACE

echo ""
echo "Deployment status:"
kubectl get deployments -n $NAMESPACE

# Wait for stabilization
echo ""
echo "Waiting for system to stabilize (30 seconds)..."
sleep 30

# Check for errors in logs
echo ""
echo "Checking for errors in logs..."
ERROR_COUNT=$(kubectl logs -n $NAMESPACE -l app=api-gateway --tail=50 | grep -i error | wc -l)

if [ $ERROR_COUNT -gt 5 ]; then
    echo "⚠️  Warning: Found $ERROR_COUNT errors in logs"
else
    echo "✅ No critical errors found in logs"
fi

# Run health checks
echo ""
echo "Running health checks..."

kubectl port-forward -n $NAMESPACE svc/api-gateway 8080:3000 &
PF_PID=$!
sleep 5

if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    kill $PF_PID
    exit 1
fi

if curl -f http://localhost:8080/api/v1/health > /dev/null 2>&1; then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed"
    kill $PF_PID
    exit 1
fi

kill $PF_PID

# Create rollback report
echo ""
echo "Creating rollback report..."

REPORT_FILE="$BACKUP_DIR/rollback-report.txt"

cat > $REPORT_FILE << EOF
Rollback Report
===============

Environment: $ENVIRONMENT
Namespace: $NAMESPACE
Rollback Type: $ROLLBACK_TYPE
Timestamp: $(date)
Status: Success

Deployment Status:
$(kubectl get deployments -n $NAMESPACE)

Pod Status:
$(kubectl get pods -n $NAMESPACE)

Service Status:
$(kubectl get services -n $NAMESPACE)

Recent Events:
$(kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp' | tail -20)

Error Count in Logs: $ERROR_COUNT
EOF

echo "Rollback report saved to $REPORT_FILE"

echo ""
echo "=========================================="
echo "Rollback Complete!"
echo "=========================================="
echo ""
echo "✅ Rollback completed successfully!"
echo ""
echo "Backup and report saved to: $BACKUP_DIR"
echo ""
echo "To view logs:"
echo "  kubectl logs -f deployment/api-gateway -n $NAMESPACE"
echo ""
echo "To check status:"
echo "  kubectl get pods -n $NAMESPACE"
echo "  kubectl get services -n $NAMESPACE"
echo ""
