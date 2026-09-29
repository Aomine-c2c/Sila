#!/bin/bash
# NEXORA Secret Rotation Script
# Usage: ./rotate-secrets.sh [api|web|all]

set -euo pipefail

TARGET="${1:-all}"
VAULT_ADDR="${VAULT_ADDR:-https://vault.nexora.example.com}"

echo "🔐 NEXORA Secret Rotation - Target: ${TARGET}"
echo "================================================="

# Function to generate new secret
generate_secret() {
    openssl rand -hex 32
}

# Function to update Vault and trigger sync
rotate_secret() {
    local path="$1"
    local key="$2"
    local new_value="$3"
    
    echo "  Updating ${path}/${key}..."
    vault kv put "${path}" "${key}=${new_value}"
    
    # Trigger External Secrets sync
    local secret_name=$(echo "${path}" | sed 's|nexora/||' | sed 's|/|-|g')
    kubectl annotate externalsecret "nexora-${secret_name}-secrets" -n nexora force-sync=$(date +%s) --overwrite 2>/dev/null || true
}

if [[ "${TARGET}" == "api" || "${TARGET}" == "all" ]]; then
    echo ""
    echo "🔄 Rotating API secrets..."
    
    # JWT Secret
    NEW_JWT=$(generate_secret)
    rotate_secret "nexora/api/auth" "secret_key" "${NEW_JWT}"
    
    # Database URL (if using dynamic credentials, this rotates automatically)
    # NEW_DB=$(generate_db_creds)
    # rotate_secret "nexora/api/database" "url" "${NEW_DB}"
    
    # LLM API Keys (manual - need to provide new keys)
    echo "  ⚠️  LLM API keys require manual update in Vault:"
    echo "     vault kv put nexora/api/llm openai_key=<new> anthropic_key=<new> google_key=<new>"
    
    # Restart API pods
    echo "  🔄 Restarting API pods..."
    kubectl rollout restart deployment/nexora-api -n nexora
    kubectl rollout status deployment/nexora-api -n nexora --timeout=300s
fi

if [[ "${TARGET}" == "web" || "${TARGET}" == "all" ]]; then
    echo ""
    echo "🔄 Rotating Web secrets..."
    
    # Analytics keys (if any)
    echo "  ⚠️  Web analytics keys require manual update in Vault:"
    echo "     vault kv put nexora/web/analytics key=<new>"
    
    # Restart Web pods
    echo "  🔄 Restarting Web pods..."
    kubectl rollout restart deployment/nexora-web -n nexora
    kubectl rollout status deployment/nexora-web -n nexora --timeout=300s
fi

echo ""
echo "✅ Secret rotation complete!"
echo "   Verify: kubectl logs -n nexora -l app=nexora-api | grep -i startup"