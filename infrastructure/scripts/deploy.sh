#!/bin/bash
# Deploy NEXORA to Kubernetes using Kustomize
# Usage: ./deploy.sh [dev|staging|prod] [version]

set -euo pipefail

ENVIRONMENT="${1:-staging}"
VERSION="${2:-latest}"
KUSTOMIZE_DIR="infrastructure/kubernetes/overlays/${ENVIRONMENT}"

echo "🚀 Deploying NEXORA to ${ENVIRONMENT} (version: ${VERSION})"

# Validate environment
if [[ ! -d "${KUSTOMIZE_DIR}" ]]; then
    echo "❌ Environment '${ENVIRONMENT}' not found. Available: dev, staging, prod"
    exit 1
fi

# Update image tags
cd "${KUSTOMIZE_DIR}"
kustomize edit set image ghcr.io/ORG/nexora-api="${VERSION}"
kustomize edit set image ghcr.io/ORG/nexora-web="${VERSION}"

# Build and apply
echo "📦 Building manifests..."
kustomize build . > /tmp/nexora-${ENVIRONMENT}.yaml

echo "🔍 Validating..."
kubectl apply --dry-run=client -f /tmp/nexora-${ENVIRONMENT}.yaml

echo "✅ Applying..."
kubectl apply -f /tmp/nexora-${ENVIRONMENT}.yaml

echo "⏳ Waiting for rollout..."
kubectl rollout status deployment/nexora-api -n nexora --timeout=300s
kubectl rollout status deployment/nexora-web -n nexora --timeout=300s

echo "✅ Deployment complete!"
kubectl get pods -n nexora -l 'app in (nexora-api,nexora-web)'