variable "project_id" {
    description = "Google Cloud project ID"
    type        = string
}

variable "region" {
    description = "Default Google Cloud region"
    type        = string
}

variable "runtime_service_account" {
    description = "Service account used by the Cloud Run runtime"
    type        = string
}

