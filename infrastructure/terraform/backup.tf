# Automated Backup Configuration
# Daily database backups with retention policy

# Backup CronJob
resource "kubernetes_cron_job_v1" "database_backup" {
  metadata {
    name      = "database-backup"
    namespace = var.namespace
  }

  spec {
    schedule = "0 2 * * *" # Daily at 2 AM UTC

    job_template {
      metadata {
        labels = {
          app       = "database-backup"
          component = "backup"
        }
      }

      spec {
        template {
          metadata {
            labels = {
              app       = "database-backup"
              component = "backup"
            }
          }

          spec {
            service_account_name = "backup-sa"
            restart_policy       = "OnFailure"

            container {
              name  = "backup"
              image = "postgres:15-alpine"

              command = ["/bin/sh", "-c"]
              args = [
                <<-EOT
                set -e
                TIMESTAMP=$(date +%Y%m%d-%H%M%S)
                BACKUP_FILE="backup-$TIMESTAMP.sql.gz"
                
                echo "Starting database backup: $BACKUP_FILE"
                
                # Create backup
                pg_dump $DATABASE_URL | gzip > /tmp/$BACKUP_FILE
                
                # Upload to S3
                aws s3 cp /tmp/$BACKUP_FILE s3://smarterp-backups/${var.environment}/$BACKUP_FILE
                
                # Cleanup old backups (keep last 30 days)
                aws s3 ls s3://smarterp-backups/${var.environment}/ | \
                  awk '{print $4}' | \
                  head -n -30 | \
                  xargs -I {} aws s3 rm s3://smarterp-backups/${var.environment}/{}
                
                # Notify success
                curl -X POST $SLACK_WEBHOOK -H 'Content-Type: application/json' \
                  -d "{\"text\":\"✅ Database backup completed: $BACKUP_FILE\"}"
                
                echo "Backup completed successfully"
                EOT
              ]

              env {
                name = "DATABASE_URL"
                value_from {
                  secret_key_ref {
                    name = "database-credentials"
                    key  = "DATABASE_URL"
                  }
                }
              }

              env {
                name = "SLACK_WEBHOOK"
                value_from {
                  secret_key_ref {
                    name = "notification-credentials"
                    key  = "SLACK_WEBHOOK"
                  }
                }
              }

              env {
                name  = "AWS_DEFAULT_REGION"
                value = "ap-southeast-1"
              }

              resources {
                requests = {
                  memory = "256Mi"
                  cpu    = "250m"
                }
                limits = {
                  memory = "512Mi"
                  cpu    = "500m"
                }
              }
            }
          }
        }
      }
    }
  }
}

# Backup Service Account
resource "kubernetes_service_account" "backup_sa" {
  metadata {
    name      = "backup-sa"
    namespace = var.namespace
    annotations = {
      "eks.amazonaws.com/role-arn" = "arn:aws:iam::ACCOUNT_ID:role/smarterp-backup-role"
    }
  }
}

# Backup verification CronJob (weekly)
resource "kubernetes_cron_job_v1" "backup_verification" {
  metadata {
    name      = "backup-verification"
    namespace = var.namespace
  }

  spec {
    schedule = "0 3 * * 0" # Weekly on Sunday at 3 AM

    job_template {
      metadata {
        labels = {
          app       = "backup-verification"
          component = "backup"
        }
      }

      spec {
        template {
          metadata {
            labels = {
              app       = "backup-verification"
              component = "backup"
            }
          }

          spec {
            service_account_name = "backup-sa"
            restart_policy       = "OnFailure"

            container {
              name  = "verify"
              image = "postgres:15-alpine"

              command = ["/bin/sh", "-c"]
              args = [
                <<-EOT
                set -e
                
                echo "Starting backup verification"
                
                # Get latest backup
                LATEST_BACKUP=$(aws s3 ls s3://smarterp-backups/${var.environment}/ | sort | tail -n 1 | awk '{print $4}')
                
                if [ -z "$LATEST_BACKUP" ]; then
                  echo "❌ No backup found"
                  curl -X POST $SLACK_WEBHOOK -H 'Content-Type: application/json' \
                    -d '{"text":"❌ Backup verification failed: No backup found"}'
                  exit 1
                fi
                
                echo "Latest backup: $LATEST_BACKUP"
                
                # Download backup
                aws s3 cp s3://smarterp-backups/${var.environment}/$LATEST_BACKUP /tmp/backup.sql.gz
                
                # Verify backup integrity
                gunzip -t /tmp/backup.sql.gz
                
                if [ $? -eq 0 ]; then
                  echo "✅ Backup verification successful"
                  curl -X POST $SLACK_WEBHOOK -H 'Content-Type: application/json' \
                    -d "{\"text\":\"✅ Backup verification successful: $LATEST_BACKUP\"}"
                else
                  echo "❌ Backup verification failed"
                  curl -X POST $SLACK_WEBHOOK -H 'Content-Type: application/json' \
                    -d "{\"text\":\"❌ Backup verification failed: $LATEST_BACKUP\"}"
                  exit 1
                fi
                EOT
              ]

              env {
                name = "SLACK_WEBHOOK"
                value_from {
                  secret_key_ref {
                    name = "notification-credentials"
                    key  = "SLACK_WEBHOOK"
                  }
                }
              }

              env {
                name  = "AWS_DEFAULT_REGION"
                value = "ap-southeast-1"
              }

              resources {
                requests = {
                  memory = "128Mi"
                  cpu    = "100m"
                }
                limits = {
                  memory = "256Mi"
                  cpu    = "200m"
                }
              }
            }
          }
        }
      }
    }
  }
}
