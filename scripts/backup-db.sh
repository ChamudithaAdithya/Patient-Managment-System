```bash
#!/bin/bash
set -e

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/tmp/db-backups"
BUCKET="hospital-backups-nishan-dev"

mkdir -p $BACKUP_DIR

echo "Backing up PostgreSQL..."
PGPASSWORD=PMSystem2026! pg_dump \
  -h pm-postgres.cfyk0wk8c4m1.ap-southeast-1.rds.amazonaws.com \
  -U pm_admin \
  -d patient_management \
  -F c \
  -f $BACKUP_DIR/patient_management_$TIMESTAMP.dump

echo "Uploading to S3..."
aws s3 cp $BACKUP_DIR/patient_management_$TIMESTAMP.dump s3://$BUCKET/

echo "Cleaning up local backup..."
rm -f $BACKUP_DIR/patient_management_$TIMESTAMP.dump

echo "Backup complete: patient_management_$TIMESTAMP.dump"
```

Make the script executable:

```bash
chmod +x scripts/backup-db.sh
```