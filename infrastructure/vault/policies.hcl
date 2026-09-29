# Vault configuration for NEXORA secrets management
# This should be deployed as part of the Vault setup

# Enable KV v2 secrets engine at nexora/
path "nexora/" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# API secrets
path "nexora/api/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Web secrets
path "nexora/web/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Database secrets (dynamic credentials)
path "database/creds/nexora-api" {
  capabilities = ["read"]
}

path "database/creds/nexora-web" {
  capabilities = ["read"]
}

# Policy for nexora-api service account
policy "nexora-api-policy" {
  path "nexora/api/*" {
    capabilities = ["read"]
  }
  path "database/creds/nexora-api" {
    capabilities = ["read"]
  }
}

# Policy for nexora-web service account
policy "nexora-web-policy" {
  path "nexora/web/*" {
    capabilities = ["read"]
  }
}

# Kubernetes auth role for nexora-api
# This should be configured in Vault:
# vault write auth/kubernetes/role/nexora-api \
#     bound_service_account_names=nexora-api \
#     bound_service_account_namespaces=nexora \
#     policies=nexora-api-policy \
#     ttl=24h

# Kubernetes auth role for nexora-web
# vault write auth/kubernetes/role/nexora-web \
#     bound_service_account_names=nexora-web \
#     bound_service_account_namespaces=nexora \
#     policies=nexora-web-policy \
#     ttl=24h