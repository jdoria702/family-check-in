resource "google_storage_bucket" "terraform_state" {
    name     = "${var.project_id}-tfstate"
    location = "US"

    uniform_bucket_level_access = true

    versioning {
        enabled = true
    }
}