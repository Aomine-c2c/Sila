//! Asynchronous API Client for NEIMAN OS Backend (`/api/v1`)
//! Connects native Rust operator node to live FastAPI endpoints.
//! ZERO SYNTHETIC / MOCK FALLBACK DATA — Strict truth-in-presentation.

use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::time::Duration;

pub const DEFAULT_API_URL: &str = "http://127.0.0.1:8000/api/v1";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompanyInfo {
    pub id: String,
    pub name: String,
    pub mission: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentPayload {
    pub id: String,
    pub name: String,
    pub role_title: Option<String>,
    pub status: String,
    pub autonomy: Option<String>,
    pub current_task: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectPayload {
    pub id: String,
    pub name: String,
    pub objective: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskPayload {
    pub id: String,
    pub project_id: Option<String>,
    pub title: String,
    pub status: String,
    pub priority: Option<String>,
    pub assigned_agent_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalPayload {
    pub id: String,
    pub title: String,
    pub risk_level: Option<String>,
    pub agent_name: Option<String>,
    pub status: String,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityEventPayload {
    pub id: String,
    pub company_id: String,
    pub event_type: String,
    #[serde(default = "default_severity")]
    pub severity: String,
    pub title: String,
    pub summary: String,
    pub agent_name: Option<String>,
    pub timestamp: Option<String>,
}

fn default_severity() -> String {
    "INFO".to_string()
}

#[derive(Clone)]
pub struct NeimanClient {
    client: Client,
    pub base_url: String,
    pub token: Option<String>,
    pub active_company_id: Option<String>,
}

impl NeimanClient {
    pub fn new(base_url: Option<&str>) -> Self {
        let base_url = base_url
            .map(|s| s.to_string())
            .or_else(|| std::env::var("NEIMAN_API_URL").ok())
            .unwrap_or_else(|| DEFAULT_API_URL.to_string())
            .trim_end_matches('/')
            .to_string();

        let token = std::env::var("NEIMAN_TOKEN").ok();

        let client = Client::builder()
            .timeout(Duration::from_millis(2500))
            .build()
            .unwrap_or_else(|_| Client::new());

        Self {
            client,
            base_url,
            token,
            active_company_id: None,
        }
    }

    pub async fn login(&mut self, email: &str, password: &str) -> bool {
        let url = format!("{}/auth/login", self.base_url);
        let body = serde_json::json!({
            "email": email,
            "password": password
        });

        match self.client.post(&url).json(&body).send().await {
            Ok(resp) if resp.status().is_success() => {
                if let Ok(data) = resp.json::<Value>().await {
                    if let Some(tok) = data.get("access_token").and_then(|t| t.as_str()) {
                        self.token = Some(tok.to_string());
                        return true;
                    }
                }
            }
            _ => {}
        }
        false
    }

    fn auth_header(&self) -> Option<String> {
        self.token.as_ref().map(|t| format!("Bearer {}", t))
    }

    pub async fn fetch_companies(&mut self) -> Result<Vec<CompanyInfo>, String> {
        // First try /companies/me
        let url = format!("{}/companies/me", self.base_url);
        let mut req = self.client.get(&url);
        if let Some(auth) = self.auth_header() {
            req = req.header("Authorization", auth);
        }

        if let Ok(resp) = req.send().await {
            if resp.status().is_success() {
                if let Ok(companies) = resp.json::<Vec<CompanyInfo>>().await {
                    if !companies.is_empty() {
                        if let Some(first) = companies.first() {
                            self.active_company_id = Some(first.id.clone());
                        }
                        return Ok(companies);
                    }
                }
            }
        }

        // Fallback try /companies
        let url_all = format!("{}/companies", self.base_url);
        let mut req_all = self.client.get(&url_all);
        if let Some(auth) = self.auth_header() {
            req_all = req_all.header("Authorization", auth);
        }

        match req_all.send().await {
            Ok(resp) if resp.status().is_success() => {
                let companies = resp.json::<Vec<CompanyInfo>>().await.map_err(|e| e.to_string())?;
                if let Some(first) = companies.first() {
                    self.active_company_id = Some(first.id.clone());
                }
                Ok(companies)
            }
            Ok(resp) => Err(format!("Backend HTTP error: status {}", resp.status())),
            Err(e) => Err(format!("Unreachable API at {}: {}", self.base_url, e)),
        }
    }

    pub async fn fetch_agents(&self, company_id: &str) -> Result<Vec<AgentPayload>, String> {
        let url = format!("{}/companies/{}/agents", self.base_url, company_id);
        let mut req = self.client.get(&url);
        if let Some(auth) = self.auth_header() {
            req = req.header("Authorization", auth);
        }

        match req.send().await {
            Ok(resp) if resp.status().is_success() => {
                resp.json::<Vec<AgentPayload>>().await.map_err(|e| e.to_string())
            }
            Ok(resp) => Err(format!("HTTP {}", resp.status())),
            Err(e) => Err(e.to_string()),
        }
    }

    pub async fn fetch_approvals(&self, company_id: &str) -> Result<Vec<ApprovalPayload>, String> {
        let url = format!("{}/companies/{}/governance/approvals", self.base_url, company_id);
        let mut req = self.client.get(&url);
        if let Some(auth) = self.auth_header() {
            req = req.header("Authorization", auth);
        }

        match req.send().await {
            Ok(resp) if resp.status().is_success() => {
                resp.json::<Vec<ApprovalPayload>>().await.map_err(|e| e.to_string())
            }
            Ok(resp) => Err(format!("HTTP {}", resp.status())),
            Err(e) => Err(e.to_string()),
        }
    }

    pub async fn fetch_projects(&self, company_id: &str) -> Result<Vec<ProjectPayload>, String> {
        let url = format!("{}/companies/{}/projects", self.base_url, company_id);
        let mut req = self.client.get(&url);
        if let Some(auth) = self.auth_header() {
            req = req.header("Authorization", auth);
        }

        match req.send().await {
            Ok(resp) if resp.status().is_success() => {
                resp.json::<Vec<ProjectPayload>>().await.map_err(|e| e.to_string())
            }
            Ok(resp) => Err(format!("HTTP {}", resp.status())),
            Err(e) => Err(e.to_string()),
        }
    }

    pub async fn fetch_project_tasks(
        &self,
        company_id: &str,
        project_id: &str,
    ) -> Result<Vec<TaskPayload>, String> {
        let url = format!("{}/companies/{}/projects/{}/tasks", self.base_url, company_id, project_id);
        let mut req = self.client.get(&url);
        if let Some(auth) = self.auth_header() {
            req = req.header("Authorization", auth);
        }

        match req.send().await {
            Ok(resp) if resp.status().is_success() => {
                resp.json::<Vec<TaskPayload>>().await.map_err(|e| e.to_string())
            }
            Ok(resp) => Err(format!("HTTP {}", resp.status())),
            Err(e) => Err(e.to_string()),
        }
    }

    #[allow(dead_code)]
    pub async fn fetch_all_tasks(&self, company_id: &str) -> Result<Vec<TaskPayload>, String> {
        let projects = self.fetch_projects(company_id).await?;
        let mut all_tasks = Vec::new();

        for proj in projects {
            if let Ok(tasks) = self.fetch_project_tasks(company_id, &proj.id).await {
                all_tasks.extend(tasks);
            }
        }

        Ok(all_tasks)
    }

    pub async fn fetch_recent_activity(
        &self,
        company_id: &str,
        limit: usize,
    ) -> Result<Vec<ActivityEventPayload>, String> {
        let url = format!("{}/companies/{}/activity?limit={}", self.base_url, company_id, limit);
        let mut req = self.client.get(&url);
        if let Some(auth) = self.auth_header() {
            req = req.header("Authorization", auth);
        }

        match req.send().await {
            Ok(resp) if resp.status().is_success() => {
                resp.json::<Vec<ActivityEventPayload>>().await.map_err(|e| e.to_string())
            }
            Ok(resp) => Err(format!("HTTP {}", resp.status())),
            Err(e) => Err(e.to_string()),
        }
    }

    pub async fn decide_approval(
        &self,
        company_id: &str,
        request_id: &str,
        decision: &str,
        reason: &str,
    ) -> Result<bool, String> {
        let url = format!(
            "{}/companies/{}/governance/approvals/{}/decision",
            self.base_url, company_id, request_id
        );
        let body = serde_json::json!({
            "decision": decision,
            "reviewer_notes": reason
        });
        let mut req = self.client.post(&url).json(&body);
        if let Some(auth) = self.auth_header() {
            req = req.header("Authorization", auth);
        }

        match req.send().await {
            Ok(resp) if resp.status().is_success() => Ok(true),
            Ok(resp) => Err(format!("Failed with HTTP {}", resp.status())),
            Err(e) => Err(e.to_string()),
        }
    }

    pub async fn transition_agent(
        &self,
        company_id: &str,
        agent_id: &str,
        status: &str,
        reason: &str,
    ) -> Result<bool, String> {
        let url = format!(
            "{}/companies/{}/agents/{}/transition",
            self.base_url, company_id, agent_id
        );
        let body = serde_json::json!({
            "status": status,
            "reason": reason
        });
        let mut req = self.client.post(&url).json(&body);
        if let Some(auth) = self.auth_header() {
            req = req.header("Authorization", auth);
        }

        match req.send().await {
            Ok(resp) if resp.status().is_success() => Ok(true),
            Ok(resp) => Err(format!("Failed with HTTP {}", resp.status())),
            Err(e) => Err(e.to_string()),
        }
    }

    pub async fn reset_circuit_breakers(&self, company_id: &str) -> Result<bool, String> {
        let url = format!(
            "{}/companies/{}/intelligence/circuit-breakers/reset",
            self.base_url, company_id
        );
        let mut req = self.client.post(&url);
        if let Some(auth) = self.auth_header() {
            req = req.header("Authorization", auth);
        }

        match req.send().await {
            Ok(resp) if resp.status().is_success() => Ok(true),
            Ok(resp) => Err(format!("Failed with HTTP {}", resp.status())),
            Err(e) => Err(e.to_string()),
        }
    }
}
