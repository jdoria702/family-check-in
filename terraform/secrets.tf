resource "google_secret_manager_secret" "database_url" {
    secret_id = "DATABASE_URL"

    replication {
        auto {}
    }
}

resource "google_secret_manager_secret" "direct_url" {
    secret_id = "DIRECT_URL"

    replication {
        auto {}
    }
}

resource "google_secret_manager_secret_iam_member" "database_url_accessor" {
    project   = var.project_id
    secret_id = google_secret_manager_secret.database_url.secret_id
    role      = "roles/secretmanager.secretAccessor"
    member    = "serviceAccount:${var.runtime_service_account}"
}

resource "google_secret_manager_secret_iam_member" "direct_url_accessor" {
    project   = var.project_id
    secret_id = google_secret_manager_secret.direct_url.secret_id
    role      = "roles/secretmanager.secretAccessor"
    member    = "serviceAccount:${var.runtime_service_account}"
}