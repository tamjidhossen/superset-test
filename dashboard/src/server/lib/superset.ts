import axios from "axios";

const SUPERSET_URL = process.env.SUPERSET_URL || "http://localhost:8088";
const USERNAME = process.env.SUPERSET_ADMIN_USERNAME || "admin";
const PASSWORD = process.env.SUPERSET_ADMIN_PASSWORD || "admin";

export async function getSupersetGuestToken(dashboardId: string) {
  try {
    // 1. Login
    const loginResponse = await axios.post(`${SUPERSET_URL}/api/v1/security/login`, {
      username: USERNAME,
      password: PASSWORD,
      provider: "db",
    });
    const accessToken = loginResponse.data.access_token;
    let allCookies = loginResponse.headers["set-cookie"] || [];

    // 2. Get CSRF token
    const csrfResponse = await axios.get(`${SUPERSET_URL}/api/v1/security/csrf_token/`, {
      headers: { 
          Authorization: `Bearer ${accessToken}`,
          Cookie: allCookies.join("; ")
      },
    });
    const csrfToken = csrfResponse.data.result;
    const csrfCookies = csrfResponse.headers["set-cookie"] || [];
    allCookies = [...allCookies, ...csrfCookies];

    const authHeaders = {
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFToken": csrfToken,
      Cookie: allCookies.join("; ")
    };

    // 3. Ensure embedding is enabled AND contains the correct domain
    let embeddedId: string;
    const dashboardResponse = await axios.get(`${SUPERSET_URL}/api/v1/dashboard/${dashboardId}`, {
        headers: authHeaders,
    });
    
    embeddedId = dashboardResponse.data.result.embedded?.uuid;

    if (!embeddedId) {
      console.log(`Embedding not enabled. Enabling for dashboard ${dashboardId}...`);
      const enableResponse = await axios.post(
        `${SUPERSET_URL}/api/v1/dashboard/${dashboardId}/embedded`,
        { allowed_domains: ["http://localhost:5173"] },
        { headers: authHeaders }
      );
      embeddedId = enableResponse.data.result.uuid;
    } else {
      // Always update to ensure the allowed_domains are correct
      // This solves the issue where the UI doesn't seem to save correctly
      await axios.put(
        `${SUPERSET_URL}/api/v1/dashboard/${dashboardId}/embedded`,
        { allowed_domains: ["http://localhost:5173"] },
        { headers: authHeaders }
      );
    }

    // 4. Request Guest Token
    const guestTokenResponse = await axios.post(
      `${SUPERSET_URL}/api/v1/security/guest_token/`,
      {
        user: { username: "guest_user", first_name: "Guest", last_name: "User" },
        resources: [{ type: "dashboard", id: embeddedId }],
        rls: [],
      },
      { headers: authHeaders }
    );

    return {
      guestToken: guestTokenResponse.data.token,
      embeddedId: embeddedId,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
        console.error("Superset API error details:", JSON.stringify(error.response?.data, null, 2));
    }
    throw error;
  }
}
