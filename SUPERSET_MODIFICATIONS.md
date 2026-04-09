# Apache Superset Modification Log

This document details the precise changes made to the cloned Apache Superset directory to enable secure, full-width embedding into a React application on `localhost`.

---

## 1. Core Configuration File
**Location**: `superset/docker/pythonpath_dev/superset_config.py`

This is the primary file used by the Superset Docker containers to override default settings.

### 🔓 Security & Iframe Support
To allow Superset to be rendered inside an iframe on your React domain (`localhost:5173`), the following headers and security flags were modified:

```python
# Disable Talisman (standard security header manager)
TALISMAN_ENABLED = False

# Force X-Frame-Options to allow all (otherwise browser blocks the frame)
OVERRIDE_HTTP_HEADERS = {"X-Frame-Options": "ALLOWALL"}

# Enable and configure CORS
ENABLE_CORS = True
CORS_OPTIONS = {
    "supports_credentials": True,
    "headers": ["*"],
    "expose_headers": ["*"],
    "methods": ["*"],
    "origins": ["http://localhost:5173"],
}
```

### 🎟️ Embedded SDK & Guest Tokens
Enabled the "Embedded" feature flag and configured the JWT (JSON Web Token) infrastructure needed for your backend to generate guest tokens.

```python
FEATURE_FLAGS = {
    "ALERT_REPORTS": True, 
    "EMBEDDED_SUPERSET": True # CRITICAL: Enables the Embedded SDK
}

# Guest Token Security
GUEST_ROLE_NAME = "Gamma" # Standard restricted role for viewers
GUEST_TOKEN_JWT_SECRET = "super-secret-power-performance-metrics-key"
GUEST_TOKEN_JWT_ALGO = "HS256"
GUEST_TOKEN_JWT_AUDIENCE = "superset"
GUEST_TOKEN_JWT_EXP_SECONDS = 300
```

### 🍪 Session Cookie Persistence (Login/Logout Fix)
Configured cookies to be "framed-ready" while ensuring the "Log Out" functionality remains stable on `localhost`.

```python
# We use 'Lax' on localhost so the browser can accurately clear the cookie on logout
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = False # Required as localhost uses HTTP
SESSION_COOKIE_HTTPONLY = True
```

### 🐳 Docker Bootstrap Link
Ensured that the file ends with a Star Import of `superset_config_docker`. This allows the Docker cluster to load internal database credentials without crashing the `superset-init` service.

```python
try:
    import superset_config_docker
    from superset_config_docker import * 
except ImportError:
    pass
```

---

## 2. Environment Configuration
**Location**: `superset/docker/.env`

Ensured that the container knows where the custom config file is located:

```bash
# Points Superset to our modified config file in the shared volume
SUPERSET_CONFIG_PATH=/app/docker/pythonpath_dev/superset_config.py
```

---

## 3. Git Structure Changes
**Location**: Project Root

We converted the `superset` directory from a **Submodule** (external link) to a **Standard Tracked Directory** to ensure your configuration changes are saved to your main repository.

1. **Absorbed Submodule**: Removed the `.git` association to allow files to be tracked locally.
2. **Push Protection**: Updated the root `.gitignore` to exclude Superset's non-essential demo files (storybooks, test payloads) that contain dummy secrets.

---

## 📋 Summary of Component Status
| Feature | Status | Requirement |
| :--- | :--- | :--- |
| **Iframe Rendering** | Active | `X-Frame-Options: ALLOWALL` |
| **Guest Auth** | Active | `EMBEDDED_SUPERSET: True` |
| **SQL Lab Embedding** | Active | Admin session in browser |
| **Logout Fix** | Active | `SameSite: Lax` |
