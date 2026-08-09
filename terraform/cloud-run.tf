resource "google_cloud_run_v2_service" "family" {
  name     = "family-wellness"
  location = var.region

  template {
    containers {
      image = "us-west1-docker.pkg.dev/family-wellness-504304/family-wellness/family-wellness@sha256:d6b7f22f84aa24ab4bc8e97f4c0875bd0d00b8b4a6eebcaee7cd49d7f0e7684e"

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }

        cpu_idle          = true
        startup_cpu_boost = true
      }

      env {
        name = "DATABASE_URL"

        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.database_url.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "DIRECT_URL"

        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.direct_url.secret_id
            version = "latest"
          }
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image
    ]
  }
}