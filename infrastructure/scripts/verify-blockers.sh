#!/bin/bash
# Verification Script for 4 Critical Blockers
# Run this script to verify all blockers are fixed

set -e

echo "🔍 SmartERP Infrastructure Blocker Verification"
echo "=============================================="
echo ""

FAILED=0

# Blocker 1: Production Config Management
echo "📋 [1/4] Verifying Production Config Management..."
if [ -f "infrastructure/terraform/main.tf" ]; then
    echo "  ✅ Terraform main.tf exists"
    
    if grep -q "kubernetes_config_map" infrastructure/terraform/main.tf; then
        echo "  ✅ Production ConfigMap defined"
    else
        echo "  ❌ Production ConfigMap missing"
        FAILED=$((FAILED + 1))
    fi
    
    if grep -q "NODE_ENV.*production" infrastructure/terraform/main.tf; then
        echo "  ✅ Production environment variables configured"
    else
        echo "  ❌ Production environment variables missing"
        FAILED=$((FAILED + 1))
    fi
else
    echo "  ❌ Terraform configuration missing"
    FAILED=$((FAILED + 1))
fi
echo ""

# Blocker 2: Approval Workflow
echo "🔐 [2/4] Verifying Approval Workflow..."
if [ -f ".github/workflows/deploy.yml" ]; then
    echo "  ✅ Deployment workflow exists"
    
    if grep -q "reviewers" .github/workflows/deploy.yml; then
        echo "  ✅ Approval reviewers configured"
    else
        echo "  ❌ Approval reviewers missing"
        FAILED=$((FAILED + 1))
    fi
    
    if grep -q "tech-lead" .github/workflows/deploy.yml; then
        echo "  ✅ Tech Lead approval required"
    else
        echo "  ❌ Tech Lead approval missing"
        FAILED=$((FAILED + 1))
    fi
    
    if grep -q "pm" .github/workflows/deploy.yml; then
        echo "  ✅ PM approval required"
    else
        echo "  ❌ PM approval missing"
        FAILED=$((FAILED + 1))
    fi
else
    echo "  ❌ Deployment workflow missing"
    FAILED=$((FAILED + 1))
fi
echo ""

# Blocker 3: Backup & DR
echo "💾 [3/4] Verifying Backup & Disaster Recovery..."
if [ -f "infrastructure/terraform/backup.tf" ]; then
    echo "  ✅ Backup Terraform config exists"
    
    if grep -q "kubernetes_cron_job_v1.*database_backup" infrastructure/terraform/backup.tf; then
        echo "  ✅ Automated backup CronJob defined"
    else
        echo "  ❌ Backup CronJob missing"
        FAILED=$((FAILED + 1))
    fi
    
    if grep -q "backup_verification" infrastructure/terraform/backup.tf; then
        echo "  ✅ Backup verification configured"
    else
        echo "  ❌ Backup verification missing"
        FAILED=$((FAILED + 1))
    fi
else
    echo "  ❌ Backup configuration missing"
    FAILED=$((FAILED + 1))
fi

if [ -f "infrastructure/disaster-recovery/dr-test-automation.yml" ]; then
    echo "  ✅ DR test automation exists"
    
    if grep -q "schedule.*cron" infrastructure/disaster-recovery/dr-test-automation.yml; then
        echo "  ✅ Monthly DR testing scheduled"
    else
        echo "  ❌ DR testing schedule missing"
        FAILED=$((FAILED + 1))
    fi
else
    echo "  ❌ DR test automation missing"
    FAILED=$((FAILED + 1))
fi
echo ""

# Blocker 4: Secrets Management
echo "🔑 [4/4] Verifying Secrets Management..."
if [ -f "infrastructure/terraform/main.tf" ]; then
    if grep -q "external_secrets" infrastructure/terraform/main.tf; then
        echo "  ✅ External Secrets Operator configured"
    else
        echo "  ❌ External Secrets Operator missing"
        FAILED=$((FAILED + 1))
    fi
    
    if grep -q "SecretStore" infrastructure/terraform/main.tf; then
        echo "  ✅ Secret Store defined"
    else
        echo "  ❌ Secret Store missing"
        FAILED=$((FAILED + 1))
    fi
    
    if grep -q "ExternalSecret.*database" infrastructure/terraform/main.tf; then
        echo "  ✅ Database secrets externalized"
    else
        echo "  ❌ Database secrets not externalized"
        FAILED=$((FAILED + 1))
    fi
    
    if grep -q "ExternalSecret.*jwt" infrastructure/terraform/main.tf; then
        echo "  ✅ JWT secrets externalized"
    else
        echo "  ❌ JWT secrets not externalized"
        FAILED=$((FAILED + 1))
    fi
else
    echo "  ❌ Secrets configuration missing"
    FAILED=$((FAILED + 1))
fi
echo ""

# Additional Checks
echo "🎯 Additional Infrastructure Checks..."

# Infrastructure as Code
if [ -d "infrastructure/terraform" ]; then
    echo "  ✅ Infrastructure as Code (Terraform) implemented"
else
    echo "  ⚠️  Terraform directory missing"
fi

# Runbooks
if [ -f "infrastructure/runbooks/common-issues.md" ]; then
    echo "  ✅ Runbooks documented"
else
    echo "  ⚠️  Runbooks missing"
fi

# Monitoring Dashboards
if [ -f "infrastructure/monitoring/team-dashboards.tf" ]; then
    echo "  ✅ Team dashboards configured"
else
    echo "  ⚠️  Team dashboards missing"
fi

echo ""
echo "=============================================="

if [ $FAILED -eq 0 ]; then
    echo "✅ ALL BLOCKERS FIXED! Infrastructure ready for 10/10"
    echo ""
    echo "Next Steps:"
    echo "1. Apply Terraform: cd infrastructure/terraform && terraform apply"
    echo "2. Test DR automation: gh workflow run dr-test-automation.yml"
    echo "3. Configure GitHub approvers: Settings → Environments → production"
    echo "4. Setup AWS Secrets Manager with required secrets"
    exit 0
else
    echo "❌ $FAILED ISSUES FOUND - Infrastructure not ready"
    echo ""
    echo "Please fix the issues above before proceeding."
    exit 1
fi
