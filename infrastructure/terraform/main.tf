# SmartERP Infrastructure as Code
# Terraform configuration for production environment

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }

  backend "s3" {
    bucket = "smarterp-terraform-state"
    key    = "production/terraform.tfstate"
    region = "ap-southeast-1"
  }
}

provider "kubernetes" {
  config_path = "~/.kube/config"
}

provider "helm" {
  kubernetes {
    config_path = "~/.kube/config"
  }
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "namespace" {
  description = "Kubernetes namespace"
  type        = string
  default     = "production"
}

# Kubernetes Namespace
resource "kubernetes_namespace" "smarterp" {
  metadata {
    name = var.namespace
    labels = {
      environment = var.environment
      managed-by  = "terraform"
    }
  }
}

# External Secrets Operator
resource "helm_release" "external_secrets" {
  name       = "external-secrets"
  repository = "https://charts.external-secrets.io"
  chart      = "external-secrets"
  namespace  = "external-secrets-system"
  create_namespace = true

  set {
    name  = "installCRDs"
    value = "true"
  }
}

# Secret Store (AWS Secrets Manager)
resource "kubernetes_manifest" "secret_store" {
  manifest = {
    apiVersion = "external-secrets.io/v1beta1"
    kind       = "SecretStore"
    metadata = {
      name      = "aws-secrets-manager"
      namespace = var.namespace
    }
    spec = {
      provider = {
        aws = {
          service = "SecretsManager"
          region  = "ap-southeast-1"
          auth = {
            jwt = {
              serviceAccountRef = {
                name = "external-secrets-sa"
              }
            }
          }
        }
      }
    }
  }

  depends_on = [helm_release.external_secrets]
}

# External Secret for Database
resource "kubernetes_manifest" "database_secret" {
  manifest = {
    apiVersion = "external-secrets.io/v1beta1"
    kind       = "ExternalSecret"
    metadata = {
      name      = "database-credentials"
      namespace = var.namespace
    }
    spec = {
      refreshInterval = "1h"
      secretStoreRef = {
        name = "aws-secrets-manager"
        kind = "SecretStore"
      }
      target = {
        name = "database-credentials"
        creationPolicy = "Owner"
      }
      data = [
        {
          secretKey = "DATABASE_URL"
          remoteRef = {
            key = "smarterp/${var.environment}/database/url"
          }
        },
        {
          secretKey = "DATABASE_PASSWORD"
          remoteRef = {
            key = "smarterp/${var.environment}/database/password"
          }
        }
      ]
    }
  }

  depends_on = [kubernetes_manifest.secret_store]
}

# External Secret for JWT
resource "kubernetes_manifest" "jwt_secret" {
  manifest = {
    apiVersion = "external-secrets.io/v1beta1"
    kind       = "ExternalSecret"
    metadata = {
      name      = "jwt-credentials"
      namespace = var.namespace
    }
    spec = {
      refreshInterval = "1h"
      secretStoreRef = {
        name = "aws-secrets-manager"
        kind = "SecretStore"
      }
      target = {
        name = "jwt-credentials"
        creationPolicy = "Owner"
      }
      data = [
        {
          secretKey = "JWT_SECRET"
          remoteRef = {
            key = "smarterp/${var.environment}/jwt/secret"
          }
        },
        {
          secretKey = "JWT_REFRESH_SECRET"
          remoteRef = {
            key = "smarterp/${var.environment}/jwt/refresh-secret"
          }
        }
      ]
    }
  }

  depends_on = [kubernetes_manifest.secret_store]
}

# ConfigMap for Production
resource "kubernetes_config_map" "production_config" {
  metadata {
    name      = "smarterp-config"
    namespace = var.namespace
  }

  data = {
    NODE_ENV           = "production"
    LOG_LEVEL          = "info"
    API_PORT           = "3000"
    REDIS_HOST         = "redis-master"
    REDIS_PORT         = "6379"
    POSTGRES_HOST      = "postgres-primary"
    POSTGRES_PORT      = "5432"
    POSTGRES_DB        = "smarterp_production"
    CACHE_TTL_SHORT    = "300"
    CACHE_TTL_MEDIUM   = "1800"
    CACHE_TTL_LONG     = "3600"
    RATE_LIMIT_WINDOW  = "60000"
    RATE_LIMIT_MAX     = "100"
  }
}

# Outputs
output "namespace" {
  value = kubernetes_namespace.smarterp.metadata[0].name
}

output "secret_store_name" {
  value = "aws-secrets-manager"
}
