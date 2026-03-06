#!/bin/bash

# Database Cluster Deployment Script
# This script deploys production-grade database clusters for the Plaster Warehouse ERP system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="production"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Functions
print_header() {
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}========================================${NC}\n"
}

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed"
        exit 1
    fi
    print_info "kubectl: OK"
    
    # Check namespace
    if ! kubectl get namespace $NAMESPACE &> /dev/null; then
        print_warning "Namespace $NAMESPACE does not exist. Creating..."
        kubectl create namespace $NAMESPACE
    fi
    print_info "Namespace: OK"
    
    # Check secrets
    if ! kubectl get secret database-secrets -n $NAMESPACE &> /dev/null; then
        print_error "Secret 'database-secrets' not found in namespace $NAMESPACE"
        print_info "Please create secrets first. See DATABASE-CLUSTER-GUIDE.md for instructions"
        exit 1
    fi
    print_info "Secrets: OK"
    
    # Check configmaps
    if ! kubectl get configmap app-config -n $NAMESPACE &> /dev/null; then
        print_error "ConfigMap 'app-config' not found in namespace $NAMESPACE"
        print_info "Please create configmap first. See DATABASE-CLUSTER-GUIDE.md for instructions"
        exit 1
    fi
    print_info "ConfigMaps: OK"
    
    # Check storage classes
    if ! kubectl get storageclass fast-ssd &> /dev/null; then
        print_warning "StorageClass 'fast-ssd' not found. Using 'standard' instead"
    fi
    print_info "Storage Classes: OK"
}

deploy_postgresql() {
    print_header "Deploying PostgreSQL Cluster"
    
    print_info "Applying PostgreSQL cluster configuration..."
    kubectl apply -f "$SCRIPT_DIR/postgresql-cluster.yaml"
    
    print_info "Waiting for PostgreSQL pods to be ready..."
    kubectl wait --for=condition=ready pod -l app=postgres-cluster -n $NAMESPACE --timeout=300s || true
    
    print_info "PostgreSQL cluster status:"
    kubectl get pods -l app=postgres-cluster -n $NAMESPACE
    
    print_info "\nPostgreSQL Services:"
    kubectl get svc -l app=postgres-cluster -n $NAMESPACE
}

deploy_mongodb() {
    print_header "Deploying MongoDB Replica Set"
    
    print_info "Applying MongoDB replica set configuration..."
    kubectl apply -f "$SCRIPT_DIR/mongodb-replicaset.yaml"
    
    print_info "Waiting for MongoDB pods to be ready..."
    kubectl wait --for=condition=ready pod -l app=mongodb-replicaset -n $NAMESPACE --timeout=300s || true
    
    print_info "MongoDB replica set status:"
    kubectl get pods -l app=mongodb-replicaset -n $NAMESPACE
    
    print_info "\nMongoDB Services:"
    kubectl get svc -l app=mongodb-replicaset -n $NAMESPACE
    
    print_warning "Note: Replica set initialization may take a few minutes"
    print_info "Check logs: kubectl logs mongodb-replicaset-0 -n $NAMESPACE -c replicaset-init"
}

deploy_redis() {
    print_header "Deploying Redis Cluster with Sentinel"
    
    print_info "Applying Redis cluster configuration..."
    kubectl apply -f "$SCRIPT_DIR/redis-cluster.yaml"
    
    print_info "Waiting for Redis pods to be ready..."
    kubectl wait --for=condition=ready pod -l app=redis-cluster -n $NAMESPACE --timeout=300s || true
    
    print_info "Redis cluster status:"
    kubectl get pods -l app=redis-cluster -n $NAMESPACE
    
    print_info "\nRedis Services:"
    kubectl get svc -l app=redis-cluster -n $NAMESPACE
}

deploy_elasticsearch() {
    print_header "Deploying Elasticsearch Cluster"
    
    print_info "Applying Elasticsearch cluster configuration..."
    kubectl apply -f "$SCRIPT_DIR/elasticsearch-cluster.yaml"
    
    print_info "Waiting for Elasticsearch pods to be ready (this may take several minutes)..."
    kubectl wait --for=condition=ready pod -l app=elasticsearch-cluster -n $NAMESPACE --timeout=600s || true
    
    print_info "Elasticsearch cluster status:"
    kubectl get pods -l app=elasticsearch-cluster -n $NAMESPACE
    
    print_info "\nElasticsearch Services:"
    kubectl get svc -l app=elasticsearch-cluster -n $NAMESPACE
    
    print_warning "Note: Elasticsearch cluster formation may take a few minutes"
}

verify_deployments() {
    print_header "Verifying Deployments"
    
    print_info "All StatefulSets:"
    kubectl get statefulsets -n $NAMESPACE
    
    print_info "\nAll Pods:"
    kubectl get pods -n $NAMESPACE
    
    print_info "\nAll Services:"
    kubectl get svc -n $NAMESPACE
    
    print_info "\nPersistent Volume Claims:"
    kubectl get pvc -n $NAMESPACE
}

verify_postgresql() {
    print_header "Verifying PostgreSQL Cluster"
    
    print_info "Checking PostgreSQL replication status..."
    kubectl exec -it postgres-cluster-0 -n $NAMESPACE -- \
        psql -U postgres -c "SELECT * FROM pg_stat_replication;" || true
}

verify_mongodb() {
    print_header "Verifying MongoDB Replica Set"
    
    print_info "Checking MongoDB replica set status..."
    MONGODB_PASSWORD=$(kubectl get secret database-secrets -n $NAMESPACE -o jsonpath='{.data.MONGODB_PASSWORD}' | base64 -d)
    kubectl exec -it mongodb-replicaset-0 -n $NAMESPACE -- \
        mongosh -u admin -p "$MONGODB_PASSWORD" --eval "rs.status()" || true
}

verify_redis() {
    print_header "Verifying Redis Cluster"
    
    print_info "Checking Redis Sentinel status..."
    kubectl exec -it redis-cluster-0 -n $NAMESPACE -- \
        redis-cli -p 26379 SENTINEL masters || true
}

verify_elasticsearch() {
    print_header "Verifying Elasticsearch Cluster"
    
    print_info "Checking Elasticsearch cluster health..."
    ELASTICSEARCH_PASSWORD=$(kubectl get secret database-secrets -n $NAMESPACE -o jsonpath='{.data.ELASTICSEARCH_PASSWORD}' | base64 -d)
    kubectl exec -it elasticsearch-cluster-0 -n $NAMESPACE -- \
        curl -u elastic:"$ELASTICSEARCH_PASSWORD" http://localhost:9200/_cluster/health?pretty || true
}

show_connection_info() {
    print_header "Database Connection Information"
    
    echo -e "${GREEN}PostgreSQL:${NC}"
    echo "  Master (Write): postgres-master.$NAMESPACE.svc.cluster.local:5432"
    echo "  Replica (Read): postgres-replica.$NAMESPACE.svc.cluster.local:5432"
    echo ""
    
    echo -e "${GREEN}MongoDB:${NC}"
    echo "  Connection String: mongodb://mongodb-replicaset-0.mongodb-replicaset.$NAMESPACE.svc.cluster.local:27017,mongodb-replicaset-1.mongodb-replicaset.$NAMESPACE.svc.cluster.local:27017,mongodb-replicaset-2.mongodb-replicaset.$NAMESPACE.svc.cluster.local:27017/plaster_erp?replicaSet=rs0"
    echo "  Service: mongodb.$NAMESPACE.svc.cluster.local:27017"
    echo ""
    
    echo -e "${GREEN}Redis:${NC}"
    echo "  Sentinel: redis-sentinel.$NAMESPACE.svc.cluster.local:26379"
    echo "  Master: redis-master.$NAMESPACE.svc.cluster.local:6379"
    echo ""
    
    echo -e "${GREEN}Elasticsearch:${NC}"
    echo "  HTTP API: http://elasticsearch.$NAMESPACE.svc.cluster.local:9200"
    echo "  Kibana: http://kibana.$NAMESPACE.svc.cluster.local:5601"
    echo ""
}

# Main menu
show_menu() {
    echo ""
    echo "Database Cluster Deployment Menu"
    echo "================================="
    echo "1. Deploy All Databases"
    echo "2. Deploy PostgreSQL Only"
    echo "3. Deploy MongoDB Only"
    echo "4. Deploy Redis Only"
    echo "5. Deploy Elasticsearch Only"
    echo "6. Verify All Deployments"
    echo "7. Show Connection Information"
    echo "8. Exit"
    echo ""
}

# Main script
main() {
    print_header "Database Cluster Deployment Script"
    
    # Check prerequisites first
    check_prerequisites
    
    if [ $# -eq 0 ]; then
        # Interactive mode
        while true; do
            show_menu
            read -p "Select an option (1-8): " choice
            
            case $choice in
                1)
                    deploy_postgresql
                    deploy_mongodb
                    deploy_redis
                    deploy_elasticsearch
                    verify_deployments
                    show_connection_info
                    ;;
                2)
                    deploy_postgresql
                    verify_postgresql
                    ;;
                3)
                    deploy_mongodb
                    verify_mongodb
                    ;;
                4)
                    deploy_redis
                    verify_redis
                    ;;
                5)
                    deploy_elasticsearch
                    verify_elasticsearch
                    ;;
                6)
                    verify_deployments
                    verify_postgresql
                    verify_mongodb
                    verify_redis
                    verify_elasticsearch
                    ;;
                7)
                    show_connection_info
                    ;;
                8)
                    print_info "Exiting..."
                    exit 0
                    ;;
                *)
                    print_error "Invalid option. Please select 1-8."
                    ;;
            esac
        done
    else
        # Command line mode
        case $1 in
            all)
                deploy_postgresql
                deploy_mongodb
                deploy_redis
                deploy_elasticsearch
                verify_deployments
                show_connection_info
                ;;
            postgresql|postgres)
                deploy_postgresql
                verify_postgresql
                ;;
            mongodb|mongo)
                deploy_mongodb
                verify_mongodb
                ;;
            redis)
                deploy_redis
                verify_redis
                ;;
            elasticsearch|es)
                deploy_elasticsearch
                verify_elasticsearch
                ;;
            verify)
                verify_deployments
                verify_postgresql
                verify_mongodb
                verify_redis
                verify_elasticsearch
                ;;
            info)
                show_connection_info
                ;;
            *)
                echo "Usage: $0 [all|postgresql|mongodb|redis|elasticsearch|verify|info]"
                echo ""
                echo "Options:"
                echo "  all            Deploy all databases"
                echo "  postgresql     Deploy PostgreSQL cluster only"
                echo "  mongodb        Deploy MongoDB replica set only"
                echo "  redis          Deploy Redis cluster only"
                echo "  elasticsearch  Deploy Elasticsearch cluster only"
                echo "  verify         Verify all deployments"
                echo "  info           Show connection information"
                echo ""
                echo "Run without arguments for interactive mode"
                exit 1
                ;;
        esac
    fi
}

# Run main function
main "$@"
