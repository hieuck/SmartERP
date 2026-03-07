#!/bin/bash

# Deploy Monitoring and Logging Stack for Plaster ERP
# This script deploys Prometheus, Grafana, ELK Stack, and Sentry

set -e

echo "=========================================="
echo "Plaster ERP - Monitoring Stack Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_info "Checking prerequisites..."

if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed"
    exit 1
fi

if ! command -v helm &> /dev/null; then
    print_error "helm is not installed"
    exit 1
fi

print_info "Prerequisites check passed"
echo ""

# Create monitoring namespace
print_info "Creating monitoring namespace..."
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
echo ""

# Add Helm repositories
print_info "Adding Helm repositories..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add sentry https://sentry-kubernetes.github.io/charts
helm repo update
echo ""

# Deploy Prometheus Stack (includes Prometheus, Grafana, AlertManager)
print_info "Deploying Prometheus Stack..."
print_warning "Please ensure you have updated passwords in prometheus-values.yaml before proceeding"
read -p "Have you updated the passwords? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    print_error "Please update passwords in prometheus-values.yaml and run again"
    exit 1
fi

helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
    -f prometheus-values.yaml \
    -n monitoring \
    --wait \
    --timeout 10m

print_info "Prometheus Stack deployed successfully"
echo ""

# Deploy Alert Rules
print_info "Deploying alert rules..."
kubectl apply -f alert-rules.yaml
print_info "Alert rules deployed"
echo ""

# Deploy Grafana Dashboards
print_info "Deploying Grafana dashboards..."
kubectl apply -f grafana-dashboards.yaml
print_info "Grafana dashboards deployed"
echo ""

# Deploy ELK Stack
print_info "Deploying ELK Stack..."

# Deploy Elasticsearch
print_info "Deploying Elasticsearch..."
kubectl apply -f elasticsearch.yaml
print_info "Waiting for Elasticsearch to be ready..."
kubectl wait --for=condition=ready pod -l app=elasticsearch -n monitoring --timeout=600s
print_info "Elasticsearch deployed successfully"
echo ""

# Deploy Logstash
print_info "Deploying Logstash..."
kubectl apply -f logstash.yaml
print_info "Waiting for Logstash to be ready..."
kubectl wait --for=condition=ready pod -l app=logstash -n monitoring --timeout=300s
print_info "Logstash deployed successfully"
echo ""

# Deploy Kibana
print_info "Deploying Kibana..."
kubectl apply -f kibana.yaml
print_info "Waiting for Kibana to be ready..."
kubectl wait --for=condition=ready pod -l app=kibana -n monitoring --timeout=300s
print_info "Kibana deployed successfully"
echo ""

# Deploy Filebeat
print_info "Deploying Filebeat..."
kubectl apply -f filebeat.yaml
print_info "Filebeat deployed successfully"
echo ""

# Deploy Sentry (optional)
read -p "Do you want to deploy Sentry for error tracking? (yes/no): " deploy_sentry

if [ "$deploy_sentry" == "yes" ]; then
    print_info "Deploying Sentry..."
    print_warning "Please ensure you have updated passwords in sentry-values.yaml"
    read -p "Have you updated the Sentry passwords? (yes/no): " confirm_sentry
    
    if [ "$confirm_sentry" == "yes" ]; then
        helm upgrade --install sentry sentry/sentry \
            -f sentry-values.yaml \
            -n monitoring \
            --wait \
            --timeout 15m
        print_info "Sentry deployed successfully"
    else
        print_warning "Skipping Sentry deployment"
    fi
fi
echo ""

# Verify deployments
print_info "Verifying deployments..."
echo ""

print_info "Checking Prometheus Stack..."
kubectl get pods -n monitoring -l "release=prometheus"
echo ""

print_info "Checking ELK Stack..."
kubectl get pods -n monitoring -l "app in (elasticsearch,logstash,kibana,filebeat)"
echo ""

if [ "$deploy_sentry" == "yes" ] && [ "$confirm_sentry" == "yes" ]; then
    print_info "Checking Sentry..."
    kubectl get pods -n monitoring -l "app.kubernetes.io/name=sentry"
    echo ""
fi

# Display access information
echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""

print_info "Access Information:"
echo ""

echo "Grafana:"
echo "  URL: https://grafana.plaster-erp.com"
echo "  Or port-forward: kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring"
echo "  Username: admin"
echo "  Password: (check prometheus-values.yaml)"
echo ""

echo "Prometheus:"
echo "  Port-forward: kubectl port-forward svc/prometheus-kube-prometheus-prometheus 9090:9090 -n monitoring"
echo "  URL: http://localhost:9090"
echo ""

echo "AlertManager:"
echo "  Port-forward: kubectl port-forward svc/prometheus-kube-prometheus-alertmanager 9093:9093 -n monitoring"
echo "  URL: http://localhost:9093"
echo ""

echo "Kibana:"
echo "  URL: https://kibana.plaster-erp.com"
echo "  Or port-forward: kubectl port-forward svc/kibana 5601:5601 -n monitoring"
echo "  URL: http://localhost:5601"
echo ""

echo "Elasticsearch:"
echo "  Port-forward: kubectl port-forward svc/elasticsearch 9200:9200 -n monitoring"
echo "  URL: http://localhost:9200"
echo ""

if [ "$deploy_sentry" == "yes" ] && [ "$confirm_sentry" == "yes" ]; then
    echo "Sentry:"
    echo "  URL: https://sentry.plaster-erp.com"
    echo "  Username: (check sentry-values.yaml)"
    echo "  Password: (check sentry-values.yaml)"
    echo ""
fi

print_info "Next Steps:"
echo "1. Configure DNS records for grafana.plaster-erp.com, kibana.plaster-erp.com, and sentry.plaster-erp.com"
echo "2. Update application services to expose /metrics endpoint"
echo "3. Add 'monitoring: true' label to services you want to monitor"
echo "4. Configure alert notification channels in AlertManager"
echo "5. Import pre-built Grafana dashboards (IDs: 315, 1860, 6417, 7249, 3662)"
echo "6. Configure Sentry DSN in application services"
echo ""

print_info "For detailed documentation, see MONITORING-LOGGING-GUIDE.md"
echo ""

print_info "Monitoring stack deployment completed successfully!"
