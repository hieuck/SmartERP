#!/bin/bash

# Setup automated backup cron job

echo "Setting up automated backup cron job..."

# Make backup script executable
chmod +x /opt/smart-erp/scripts/backup-automation.sh

# Add cron job (runs daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/smart-erp/scripts/backup-automation.sh") | crontab -

echo "✓ Backup cron job installed"
echo "Backups will run daily at 2:00 AM"
echo ""
echo "To verify:"
echo "  crontab -l"
echo ""
echo "To test manually:"
echo "  /opt/smart-erp/scripts/backup-automation.sh"
