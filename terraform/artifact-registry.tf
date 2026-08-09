resource "google_artifact_registry_repository" "family_wellness" {
    location      = "us-west1"
    repository_id = "family-wellness"
    description   = "Docker images for Family Wellness"
    format        = "DOCKER"
}