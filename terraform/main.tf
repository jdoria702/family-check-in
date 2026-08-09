terraform {
    required_providers {
        google = {
            source  = "hashicorp/google"
            version = "~> 7.0"
        }
    }

    backend "gcs" {
        bucket = "family-wellness-504304-tfstate"
        prefix = "terraform/state"
    }
}

provider "google" {
    project = var.project_id
    region  = var.region
}

resource "google_storage_bucket" "terraform_demo" {
    name     = "family-wellness-504304-terraform-demo"
    location = "US"

    uniform_bucket_level_access = true
}