# Kubernetes Migration Guide

## From Docker Compose → EKS (Amazon Elastic Kubernetes Service)

---

### Step 1: Create Kubernetes Deployment Files

Each service gets a YAML file. Example for the gateway:

**k8s/api-getway-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-getway
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api-getway
  template:
    metadata:
      labels:
        app: api-getway
    spec:
      containers:
        - name: api-getway
          image: chamudithaadithya/patient_management_system:api_getway
          ports:
            - containerPort: 4004
---
apiVersion: v1
kind: Service
metadata:
  name: api-getway
spec:
  selector:
    app: api-getway
  ports:
    - port: 4004
      targetPort: 4004
  type: ClusterIP
```

---

### Step 2: Create All 9 Deployments

| Service | Image | Ports | Replicas |
|---------|-------|-------|----------|
| `api-getway` | `chamudithaadithya/patient_management_system:api_getway` | 4004 | 2 |
| `auth-service` | `chamudithaadithya/patient_management_system:auth_service` | 4005 | 2 |
| `patient-service` | `chamudithaadithya/patient_management_system:patient` | 4000 | 2 |
| `billing-service` | `chamudithaadithya/patient_management_system:billing` | 4001, 9001 | 1 |
| `appointment-service` | `chamudithaadithya/patient_management_system:appointment` | 4006 | 2 |
| `imaging-service` | `chamudithaadithya/patient_management_system:imaging` | 4007 | 1 |
| `analytics-service` | `chamudithaadithya/patient_management_system:analytics` | 4002 | 1 |
| `zookeeper` | `confluentinc/cp-zookeeper:7.4.0` | 2181 | 1 |
| `kafka` | `confluentinc/cp-kafka:7.4.0` | 9092 | 1 |

---

### Step 3: Environment Variables

Replace `docker-compose` env vars with a ConfigMap:

**k8s/configmap.yaml:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  SPRING_KAFKA_BOOTSTRAP_SERVERS: "kafka:9092"
  BILLING_SERVICE_ADDRESS_LOCALHOST: "billing-service"
  BILLING_SERVICE_GRPC_PORT: "9001"
  SPRING_DATASOURCE_URL: "jdbc:postgresql://pm-postgres.cfyk0wk8c4m1.ap-southeast-1.rds.amazonaws.com:5432/patient_management"
  SPRING_DATASOURCE_USERNAME: "pm_admin"
```

Secrets go in a Secret:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  SPRING_DATASOURCE_PASSWORD: <base64-encoded>
```

---

### Step 4: Auto-scaling (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-getway-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-getway
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

---

### Step 5: Ingress (Replaces ALB)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
spec:
  rules:
    - host: api.yourdomain.com
      http:
        paths:
          - path: /login
            pathType: Prefix
            backend:
              service:
                name: api-getway
                port:
                  number: 4004
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-getway
                port:
                  number: 4004
```

---

### Step 6: Deploy to EKS

```bash
# Create cluster
eksctl create cluster \
  --name hospital-cluster \
  --region ap-southeast-1 \
  --nodegroup-name standard \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 2 \
  --nodes-max 6

# Deploy
kubectl apply -f k8s/
```

---

### What Changes vs Docker Compose

| Aspect | Docker Compose | Kubernetes |
|--------|---------------|------------|
| Networking | `internal-net` bridge | Service discovery via DNS |
| Scaling | Manual (bigger EC2) | HPA auto-scaling |
| Load balancer | ALB → Gateway | ALB Ingress Controller |
| Secrets | `.env` file | Kubernetes Secrets |
| Health checks | `restart: unless-stopped` | Liveness + Readiness probes |
| Storage | Named volume | PVC + EBS |
| Rolling updates | `docker compose up -d` | `kubectl rollout` |

---

### For the Report

> *"Designed for Kubernetes migration: Docker images on Docker Hub, stateless services with environment variables, gRPC via service DNS. Production deployment on EKS would enable per-service auto-scaling via HPA, rolling updates with zero downtime, and ALB Ingress for HTTPS termination."*
