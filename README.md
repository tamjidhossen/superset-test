# App Store Metrics Dashboard & Superset Integration

This project demonstrates how to securely embed an Apache Superset dashboard into a React application using a custom Express.js backend for authentication.

## 🚀 The Problem: "Refused to Connect" & 403 Forbidden

When embedding Superset in a modern web app, you typically encounter two major blockers:
1.  **Frame Blocking (CSP & X-Frame-Options)**: Browser security policies prevent Superset from being loaded in an `<iframe>` by default.
2.  **Auth Mismatch**: The standard login cookie does not work across different origins (e.g., your app on port 5173 and Superset on 8088).

## 🛠️ The Solution

### 1. Superset Configuration
We modified `superset_config.py` with the following critical changes:
-   **`EMBEDDED_SUPERSET = True`**: Activates the embedded dashboard feature.
-   **`TALISMAN_ENABLED = False`**: Disables the default Flask-Talisman middleware which enforces strict `SAMEORIGIN` policies.
-   **`OVERRIDE_HTTP_HEADERS = {"X-Frame-Options": "ALLOWALL"}`**: Explicitly tells the browser that this page can be framed.
-   **`GUEST_ROLE_NAME = "Gamma"`**: Assigns a base template role to anonymous embedded users.
-   **`GUEST_TOKEN_JWT_SECRET`**: Sets the key used to sign guest tokens.

### 2. Backend Authentication Proxy
Since a browser cannot login to Superset directly (CORS issues), our Express server handles the 4-step authentication flow:
1.  **Admin Login**: Exchange credentials for an `access_token`.
2.  **CSRF Sync**: Fetch a CSRF token from Superset to authorize subsequent POST requests.
3.  **Embedded Sync**: Automatically register the dashboard's "Allowed Domains" (e.g., `http://localhost:5173`) via the API to bypass UI glitches.
4.  **Guest Token Generation**: Request a one-time token for the specific dashboard and pass it to the React frontend.

## 📋 Prerequisites & Setup

### Environment Variables
Ensure your root `.env` contains:
```env
SUPERSET_URL=http://localhost:8088
SUPERSET_ADMIN_USERNAME=admin
SUPERSET_ADMIN_PASSWORD=admin
SUPERSET_DASHBOARD_ID=1
```

### Forcing the Config Path
We added `SUPERSET_CONFIG_PATH` to `superset/docker/.env` to ensure the Docker container loads our custom configuration instead of the defaults:
```env
SUPERSET_CONFIG_PATH=/app/docker/pythonpath_dev/superset_config.py
```

### Running the Application
1.  **Superset**: `docker compose -f docker-compose-image-tag.yml up -d`
2.  **Init Permissions**: (One-time) `docker exec superset_app superset init`
3.  **Dashboard Backend**: `npm run dev` (in the `dashboard` folder)

## 💡 Key Learnings & Gotchas
- **Referrer Headers**: Superset is extremely strict about the "Referrer" header. Ensure your "Allowed Domains" includes the protocol (e.g., `http://localhost:5173`).
- **Draft Status**: If a dashboard is in "Draft" mode, the guest token API will return a 403. Always toggle to **"Published"**.
- **Container Restarts**: Changes to `superset_config.py` require a container restart: `docker compose ... restart superset`.
