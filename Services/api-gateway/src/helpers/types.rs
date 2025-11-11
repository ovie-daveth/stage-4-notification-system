use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct ApiResponse<T>
where
    T: Serialize,
{
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
    pub message: String,
    pub meta: Option<PaginationMeta>,
}

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct PaginationMeta {
    pub total: u64,
    pub limit: u64,
    pub page: u64,
    pub total_pages: u64,
    pub has_next: bool,
    pub has_previous: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "snake_case")]
pub enum NotificationType {
    Email,
    Push,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UserData {
    pub name: String,
    pub link: String,
    #[serde(default)]
    pub meta: Option<serde_json::Value>,
}

