#!/bin/bash

REPO=chamudithaadithya/patient_management_system

docker push $REPO:billing
docker push $REPO:patient
docker push $REPO:analytics
docker push $REPO:api_getway
