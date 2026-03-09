# Team-specific Grafana Dashboards
# Role-based monitoring dashboards for SmartERP team

resource "kubernetes_config_map" "grafana_dashboards" {
  metadata {
    name      = "grafana-dashboards"
    namespace = var.namespace
    labels = {
      grafana_dashboard = "1"
    }
  }

  data = {
    # Tech Lead Dashboard
    "tech-lead-dashboard.json" = jsonencode({
      dashboard = {
        title = "Tech Lead - System Overview"
        tags  = ["tech-lead", "overview"]
        panels = [
          {
            title = "Code Quality Metrics"
            type  = "graph"
            targets = [
              {
                expr = "test_coverage_percentage"
              },
              {
                expr = "code_complexity_average"
              }
            ]
          },
          {
            title = "Architecture Violations"
            type  = "stat"
            targets = [
              {
                expr = "architecture_violations_total"
              }
            ]
          },
          {
            title = "Team Velocity"
            type  = "graph"
            targets = [
              {
                expr = "rate(deployments_total[7d])"
              }
            ]
          },
          {
            title = "System Health Score"
            type  = "gauge"
            targets = [
              {
                expr = "(1 - rate(failed_deployments_total[7d]) / rate(deployments_total[7d])) * 100"
              }
            ]
          }
        ]
      }
    })

    # PM Dashboard
    "pm-dashboard.json" = jsonencode({
      dashboard = {
        title = "PM - Project Metrics"
        tags  = ["pm", "project"]
        panels = [
          {
            title = "Deployment Frequency"
            type  = "graph"
            targets = [
              {
                expr = "rate(deployments_total[7d])"
              }
            ]
          },
          {
            title = "Lead Time for Changes"
            type  = "graph"
            targets = [
              {
                expr = "avg(deployment_timestamp - commit_timestamp) / 3600"
              }
            ]
          },
          {
            title = "Sprint Progress"
            type  = "stat"
            targets = [
              {
                expr = "sprint_completed_tasks / sprint_total_tasks * 100"
              }
            ]
          },
          {
            title = "Feature Completion Rate"
            type  = "gauge"
            targets = [
              {
                expr = "completed_features_total / planned_features_total * 100"
              }
            ]
          }
        ]
      }
    })

    # SA Dashboard
    "sa-dashboard.json" = jsonencode({
      dashboard = {
        title = "SA - Architecture & Performance"
        tags  = ["sa", "architecture"]
        panels = [
          {
            title = "API Performance (p95)"
            type  = "graph"
            targets = [
              {
                expr = "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
              }
            ]
          },
          {
            title = "Database Query Performance"
            type  = "graph"
            targets = [
              {
                expr = "histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[5m]))"
              }
            ]
          },
          {
            title = "Cache Hit Rate"
            type  = "gauge"
            targets = [
              {
                expr = "cache_hits_total / (cache_hits_total + cache_misses_total) * 100"
              }
            ]
          },
          {
            title = "System Architecture Health"
            type  = "stat"
            targets = [
              {
                expr = "up{job='smarterp-backend'}"
              }
            ]
          }
        ]
      }
    })

    # Full Stack Engineer Dashboard
    "fullstack-dashboard.json" = jsonencode({
      dashboard = {
        title = "Full Stack - Development Metrics"
        tags  = ["fullstack", "development"]
        panels = [
          {
            title = "Build Success Rate"
            type  = "gauge"
            targets = [
              {
                expr = "successful_builds_total / total_builds_total * 100"
              }
            ]
          },
          {
            title = "Test Execution Time"
            type  = "graph"
            targets = [
              {
                expr = "test_duration_seconds"
              }
            ]
          },
          {
            title = "Code Review Turnaround"
            type  = "stat"
            targets = [
              {
                expr = "avg(review_completed_timestamp - review_requested_timestamp) / 3600"
              }
            ]
          },
          {
            title = "Feature Branch Status"
            type  = "table"
            targets = [
              {
                expr = "feature_branch_status"
              }
            ]
          }
        ]
      }
    })

    # QA Dashboard
    "qa-dashboard.json" = jsonencode({
      dashboard = {
        title = "QA - Quality Metrics"
        tags  = ["qa", "quality"]
        panels = [
          {
            title = "Test Coverage"
            type  = "gauge"
            targets = [
              {
                expr = "test_coverage_percentage"
              }
            ]
          },
          {
            title = "Bug Detection Rate"
            type  = "graph"
            targets = [
              {
                expr = "rate(bugs_detected_total[7d])"
              }
            ]
          },
          {
            title = "Security Vulnerabilities"
            type  = "stat"
            targets = [
              {
                expr = "security_vulnerabilities_total"
              }
            ]
          },
          {
            title = "Test Execution Trends"
            type  = "graph"
            targets = [
              {
                expr = "rate(tests_executed_total[7d])"
              },
              {
                expr = "rate(tests_passed_total[7d])"
              },
              {
                expr = "rate(tests_failed_total[7d])"
              }
            ]
          }
        ]
      }
    })

    # DevOps Dashboard
    "devops-dashboard.json" = jsonencode({
      dashboard = {
        title = "DevOps - Infrastructure Metrics"
        tags  = ["devops", "infrastructure"]
        panels = [
          {
            title = "System Uptime"
            type  = "stat"
            targets = [
              {
                expr = "avg(up{job='smarterp-backend'}) * 100"
              }
            ]
          },
          {
            title = "Resource Utilization"
            type  = "graph"
            targets = [
              {
                expr = "node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100"
              },
              {
                expr = "100 - (avg(rate(node_cpu_seconds_total{mode='idle'}[5m])) * 100)"
              }
            ]
          },
          {
            title = "Deployment Success Rate"
            type  = "gauge"
            targets = [
              {
                expr = "successful_deployments_total / total_deployments_total * 100"
              }
            ]
          },
          {
            title = "Incident Response Time (MTTR)"
            type  = "stat"
            targets = [
              {
                expr = "avg(recovery_timestamp - incident_timestamp) / 3600"
              }
            ]
          }
        ]
      }
    })
  }
}

# Grafana Deployment with Dashboards
resource "helm_release" "grafana" {
  name       = "grafana"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "grafana"
  namespace  = var.namespace

  values = [
    yamlencode({
      adminUser     = "admin"
      adminPassword = "admin123" # Change in production

      datasources = {
        "datasources.yaml" = {
          apiVersion = 1
          datasources = [
            {
              name      = "Prometheus"
              type      = "prometheus"
              url       = "http://prometheus:9090"
              isDefault = true
            }
          ]
        }
      }

      dashboardProviders = {
        "dashboardproviders.yaml" = {
          apiVersion = 1
          providers = [
            {
              name            = "default"
              orgId           = 1
              folder          = ""
              type            = "file"
              disableDeletion = false
              editable        = true
              options = {
                path = "/var/lib/grafana/dashboards/default"
              }
            }
          ]
        }
      }

      dashboardsConfigMaps = {
        default = "grafana-dashboards"
      }

      service = {
        type = "LoadBalancer"
        port = 3000
      }

      resources = {
        requests = {
          memory = "256Mi"
          cpu    = "250m"
        }
        limits = {
          memory = "512Mi"
          cpu    = "500m"
        }
      }
    })
  ]

  depends_on = [kubernetes_config_map.grafana_dashboards]
}

# Prometheus with Team Metrics
resource "helm_release" "prometheus" {
  name       = "prometheus"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "prometheus"
  namespace  = var.namespace

  values = [
    yamlencode({
      server = {
        global = {
          scrape_interval     = "15s"
          evaluation_interval = "15s"
        }

        persistentVolume = {
          enabled = true
          size    = "50Gi"
        }

        retention = "30d"

        resources = {
          requests = {
            memory = "1Gi"
            cpu    = "500m"
          }
          limits = {
            memory = "2Gi"
            cpu    = "1000m"
          }
        }
      }

      alertmanager = {
        enabled = true
        
        config = {
          global = {
            resolve_timeout = "5m"
          }

          route = {
            receiver       = "default"
            group_by       = ["alertname", "cluster", "service"]
            group_wait     = "10s"
            group_interval = "10s"
            repeat_interval = "12h"

            routes = [
              {
                match = {
                  severity = "critical"
                }
                receiver       = "tech-lead-devops"
                group_wait     = "0s"
                group_interval = "5m"
                repeat_interval = "4h"
              },
              {
                match = {
                  component = "security"
                }
                receiver = "qa-tech-lead"
              },
              {
                match = {
                  component = "performance"
                }
                receiver = "fullstack-devops"
              },
              {
                match = {
                  component = "deployment"
                }
                receiver = "pm-devops"
              }
            ]
          }

          receivers = [
            {
              name = "default"
              slack_configs = [
                {
                  api_url = var.slack_webhook_url
                  channel = "#smarterp-alerts"
                }
              ]
            },
            {
              name = "tech-lead-devops"
              slack_configs = [
                {
                  api_url = var.slack_webhook_url
                  channel = "#smarterp-critical"
                }
              ]
            },
            {
              name = "qa-tech-lead"
              slack_configs = [
                {
                  api_url = var.slack_webhook_url
                  channel = "#smarterp-security"
                }
              ]
            },
            {
              name = "fullstack-devops"
              slack_configs = [
                {
                  api_url = var.slack_webhook_url
                  channel = "#smarterp-performance"
                }
              ]
            },
            {
              name = "pm-devops"
              slack_configs = [
                {
                  api_url = var.slack_webhook_url
                  channel = "#smarterp-deployments"
                }
              ]
            }
          ]
        }
      }
    })
  ]
}

# Variables
variable "slack_webhook_url" {
  description = "Slack webhook URL for alerts"
  type        = string
  sensitive   = true
}

# Outputs
output "grafana_url" {
  value = "http://${helm_release.grafana.status[0].load_balancer[0].ingress[0].ip}:3000"
}

output "prometheus_url" {
  value = "http://prometheus:9090"
}
