# Nishan Pubudu — Implementation Guide

## Cloud Storage (S3, RDS, Lifecycle, Backups) + Medical Imaging

---

Your S3 buckets already exist. Your tasks are:
1. Configure the medical images bucket properly
2. Add lifecycle policies to backups bucket
3. Add S3 SDK to imaging-service
4. Update ImageService to upload to S3
5. Create backup script
6. Document everything

---

### Task 1: Configure Medical Images Bucket

Bucket: `hospital-medical-images-nishan-dev`

**Step 1: Enable versioning**

- AWS Console → S3 → `hospital-medical-images-nishan-dev`
- **Properties → Bucket Versioning → Edit → Enable → Save**

**Step 2: Enable default encryption**

- **Properties → Default encryption → Edit**
- **Encryption**: Server-side encryption (SSE-S3)
- Click **Save**

**Step 3: Block public access**

- **Permissions → Block public access → Edit**
- Ensure all 4 boxes are **checked** (this is private medical data)
- Click **Save**

**Step 4: Add CORS policy**

- **Permissions → Cross-origin resource sharing → Edit → Paste**:

```json
[
  {
    "AllowedOrigins": ["http://localhost:5173", "http://*.s3-website.*.amazonaws.com", "http://*.compute.amazonaws.com"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

Click **Save**.

---

### Task 2: Add Lifecycle Policies to Backups Bucket

Bucket: `hospital-backups-nishan-dev`

- AWS Console → S3 → `hospital-backups-nishan-dev`
- **Management → Create lifecycle rule**
- **Rule name**: `backup-lifecycle`
- **Rule scope**: Apply to all objects in the bucket
- **Lifecycle rule actions:**

| Action | Days | Storage Class |
|--------|------|---------------|
| Transition to Standard-IA | 30 | Standard-IA |
| Transition to Glacier | 90 | Glacier |
| Expire (permanently delete) | 365 | — |

- Click **Create rule**

---

### Task 3: Add S3 SDK to Imaging Service

Edit `imaging-service/pom.xml` — add this inside `<dependencies>`:

```xml
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>s3</artifactId>
    <version>2.30.0</version>
</dependency>
```

---

### Task 4: Create S3Config.java

Create file: `imaging-service/src/main/java/com/pm/imaging_service/config/S3Config.java`

```java
package com.pm.imaging_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

@Configuration
public class S3Config {

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.AP_SOUTHEAST_1)
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        return S3Presigner.builder()
                .region(Region.AP_SOUTHEAST_1)
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }
}
```

---

### Task 5: Create S3ImageService.java

Create file: `imaging-service/src/main/java/com/pm/imaging_service/service/S3ImageService.java`

```java
package com.pm.imaging_service.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import java.time.Duration;
import java.util.UUID;

@Service
public class S3ImageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final String bucketName;

    public S3ImageService(S3Client s3Client, S3Presigner s3Presigner,
                          @Value("${app.s3.bucket}") String bucketName) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
        this.bucketName = bucketName;
    }

    public String uploadImage(Long patientId, MultipartFile file) {
        String key = "patients/" + patientId + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(file.getContentType())
                .build();

        try {
            s3Client.putObject(putRequest, RequestBody.fromBytes(file.getBytes()));
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload to S3", e);
        }

        return key;
    }

    public String getImageUrl(String key) {
        GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofHours(1))
                .getObjectRequest(getRequest)
                .build();

        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }
}
```

---

### Task 6: Update ImageController to Use S3

Edit `imaging-service/src/main/java/com/pm/imaging_service/controller/ImageController.java`:

Inject `S3ImageService` alongside existing `ImageService`. Add a new S3 upload endpoint:

```java
@RestController
@RequestMapping("/api/images")
public class ImageController {

    private final S3ImageService s3ImageService;

    public ImageController(S3ImageService s3ImageService) {
        this.s3ImageService = s3ImageService;
    }

    @PostMapping("/patients/{patientId}/upload")
    public ResponseEntity<Map<String, String>> uploadToS3(
            @PathVariable Long patientId,
            @RequestParam("file") MultipartFile file) {
        String key = s3ImageService.uploadImage(patientId, file);
        String url = s3ImageService.getImageUrl(key);
        return ResponseEntity.ok(Map.of("key", key, "url", url));
    }

    @GetMapping("/url")
    public ResponseEntity<Map<String, String>> getUrl(@RequestParam String key) {
        String url = s3ImageService.getImageUrl(key);
        return ResponseEntity.ok(Map.of("url", url));
    }
}
```

---

### Task 7: Add Config to application.properties

Add to `imaging-service/src/main/resources/application.properties`:

```properties
app.s3.bucket=hospital-medical-images-nishan-dev
```

---

### Task 8: Create Backup Script

Create file: `scripts/backup-db.sh`

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

---

### Task 9: Schedule Automatic Backups

On **EC2**, set up a cron job:

```bash
# Edit crontab
sudo crontab -e

# Add this line to run daily at 2 AM
0 2 * * * /home/ubuntu/patient-managment/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
```

---

### Task 10: Build, Push & Deploy

After code changes:

```bash
# 1. Build imaging-service
cd imaging-service
mvn clean package -DskipTests

# 2. Build Docker image locally
cd ..
docker build -t chamudithaadithya/patient_management_system:imaging ./imaging-service

# 3. Push to Docker Hub
docker push chamudithaadithya/patient_management_system:imaging

# 4. SSH into EC2 and restart
ssh -i pm-system-key.pem ubuntu@47.130.152.226
cd ~/patient-managment
docker compose pull imaging-service
docker compose up -d --force-recreate imaging-service
```

---

### Task 11: Test the Full Flow

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://47.130.152.226:4005/login \
  -H "Content-Type: application/json" \
  -d '{"email":"chamuditha@hospital.com","password":"Admin@123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# 2. Upload an image
curl -X POST "http://47.130.152.226:4004/api/images/patients/1/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-image.jpg"

# 3. Verify in S3 Console
# Go to S3 → hospital-medical-images-nishan-dev → check files appear
```

---

### Summary

| # | Task | Status |
|---|------|--------|
| 1 | Configure med images bucket | ⬅️ **Your task** |
| 2 | Lifecycle on backups bucket | ⬅️ **Your task** |
| 3 | Add S3 SDK to pom.xml | ⬅️ **Your task** |
| 4 | Create S3Config.java | ⬅️ **Your task** |
| 5 | Create S3ImageService.java | ⬅️ **Your task** |
| 6 | Update ImageController | ⬅️ **Your task** |
| 7 | Add app.s3.bucket config | ⬅️ **Your task** |
| 8 | Create backup script | ⬅️ **Your task** |
| 9 | Schedule cron job on EC2 | ⬅️ **Your task** |
| 10 | Build, push, deploy | ⬅️ **Your task** |
| 11 | Test & verify | ⬅️ **Your task** |
| 12 | Document in report | ⬅️ **Your task** |

### Need Help?

- If you get S3 permission errors → The EC2 needs an IAM role with S3 access
- Ask Chamuditha to create IAM role: `ec2-s3-access` with `AmazonS3FullAccess` policy, attached to your EC2
- If Maven build fails → Check Java 21 is installed: `java -version`
- If Docker build fails → Use `sudo` if needed
