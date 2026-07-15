#!/bin/bash
set -e

REPO=chamudithaadithya/patient_management_system

echo "=== Building all Docker images ==="

# Build each service
docker build -t $REPO:billing        ./billing-service
docker build -t $REPO:patient        ./patient-service
docker build -t $REPO:analytics      ./analytics-service
docker build -t $REPO:api_getway     ./api-getway
docker build -t $REPO:auth_service   ./auth-service
docker build -t $REPO:appointment    ./appoinment-service-main
docker build -t $REPO:imaging        ./imaging-service

echo "=== Pushing all images to Docker Hub ==="

docker push $REPO:billing
docker push $REPO:patient
docker push $REPO:analytics
docker push $REPO:api_getway
docker push $REPO:auth_service
docker push $REPO:appointment
docker push $REPO:imaging

echo "=== All images pushed successfully ==="
