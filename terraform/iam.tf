resource "google_service_account" "deployer" {
    account_id   = "family-wellness-deployer"
    display_name = "Family Wellness Github Deployer"
}

resource "google_project_iam_member" "artifact_registry_writer" {
    project = var.project_id
    role    = "roles/artifactregistry.writer"
    member  = "serviceAccount:${google_service_account.deployer.email}"
}

resource "google_project_iam_member" "cloud_run_admin" {
    project = var.project_id
    role    = "roles/run.admin"
    member  = "serviceAccount:${google_service_account.deployer.email}"
}