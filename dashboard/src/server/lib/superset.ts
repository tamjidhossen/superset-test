import axios from "axios";

const SUPERSET_URL = process.env.SUPERSET_URL || "http://localhost:8088";
const ADMIN_USERNAME = process.env.SUPERSET_ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.SUPERSET_ADMIN_PASSWORD || "admin";

/**
 * Helper to get Admin Auth Headers & Cookies
 */
async function getAdminAuth() {
  const loginResponse = await axios.post(`${SUPERSET_URL}/api/v1/security/login`, {
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD,
    provider: "db",
  });
  const accessToken = loginResponse.data.access_token;
  let allCookies = loginResponse.headers["set-cookie"] || [];

  const csrfResponse = await axios.get(`${SUPERSET_URL}/api/v1/security/csrf_token/`, {
    headers: { 
        Authorization: `Bearer ${accessToken}`,
        Cookie: allCookies.join("; ")
    },
  });
  const csrfToken = csrfResponse.data.result;
  const csrfCookies = csrfResponse.headers["set-cookie"] || [];
  allCookies = [...allCookies, ...csrfCookies];

  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFToken": csrfToken,
      Cookie: allCookies.join("; ")
    },
    cookies: allCookies
  };
}

/**
 * Automated User Provisioning
 */
export async function provisionSupersetUser(username: string, password: string) {
  try {
    const { headers } = await getAdminAuth();

    // 1. Check if user exists
    // We can use the security/users endpoint with a filter if supported, 
    // but a simpler way is to try fetching and catch 404
    try {
        // This is a bit hacky as FAB doesn't have a direct "find by username" endpoint easily accessible via REST
        // We'll just try to create and catch "already exists" error, or list and find.
        // Let's use list and filter.
        const listResponse = await axios.get(`${SUPERSET_URL}/api/v1/security/users/?q=(filters:!((col:username,opr:eq,value:${username})))`, { headers });
        if (listResponse.data.count > 0) {
            console.log(`User ${username} already exists in Superset.`);
            // Optionally update password here if we want to ensure sync
            const userId = listResponse.data.ids[0];
            await axios.put(`${SUPERSET_URL}/api/v1/security/users/${userId}`, {
                password: password
            }, { headers });
            return;
        }
    } catch (e) {
        console.log("Error checking user existence, proceeding with creation attempt...");
    }

    // 2. Fetch Alpha Role ID (needed for SQL Lab / Chart Builder)
    const rolesResponse = await axios.get(`${SUPERSET_URL}/api/v1/security/roles/`, { headers });
    const alphaRole = rolesResponse.data.result.find((r: any) => r.name === "Alpha");
    if (!alphaRole) throw new Error("Alpha role not found in Superset");

    // 3. Create User
    await axios.post(`${SUPERSET_URL}/api/v1/security/users/`, {
      username: username,
      first_name: username,
      last_name: "DashboardUser",
      email: `${username}@internal.dashboard`, // Required by Superset
      active: true,
      roles: [alphaRole.id],
      password: password,
    }, { headers });

    console.log(`Successfully provisioned Superset user: ${username}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
        console.error("Provisioning Error:", error.response?.data);
    }
    throw error;
  }
}

/**
 * Get Session Cookies for a specific user (to inject into browser)
 */
export async function getSupersetUserSession(username: string, password: string) {
    try {
        const loginResponse = await axios.post(`${SUPERSET_URL}/api/v1/security/login`, {
            username: username,
            password: password,
            provider: "db",
        });
        
        // Return the cookies from the login response
        return loginResponse.headers["set-cookie"] || [];
    } catch (error) {
        console.error(`Failed to get session for user ${username}`);
        throw error;
    }
}

/**
 * Existing Guest Token Logic (for shared embedded dashboards)
 */
export async function getSupersetGuestToken(dashboardId: string) {
  try {
    const { headers } = await getAdminAuth();

    // Ensure embedding is enabled
    let embeddedId: string;
    const dashboardResponse = await axios.get(`${SUPERSET_URL}/api/v1/dashboard/${dashboardId}`, { headers });
    embeddedId = dashboardResponse.data.result.embedded?.uuid;

    if (!embeddedId) {
      const enableResponse = await axios.post(
        `${SUPERSET_URL}/api/v1/dashboard/${dashboardId}/embedded`,
        { allowed_domains: ["http://localhost:5173"] },
        { headers }
      );
      embeddedId = enableResponse.data.result.uuid;
    }

    const guestTokenResponse = await axios.post(
      `${SUPERSET_URL}/api/v1/security/guest_token/`,
      {
        user: { username: "guest_user", first_name: "Guest", last_name: "User" },
        resources: [{ type: "dashboard", id: embeddedId }],
        rls: [],
      },
      { headers }
    );

    return {
      guestToken: guestTokenResponse.data.token,
      embeddedId: embeddedId,
    };
  } catch (error) {
    throw error;
  }
}
