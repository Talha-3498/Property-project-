/* global fetch */

const API = (() => {
  const BASE_URL =
    localStorage.getItem("apiBaseUrl") || "https://property-project-production.up.railway.app";

  function trimTrailingSlash(url) {
    return String(url || "").replace(/\/+$/, "");
  }

  function buildUrl(baseUrl, path) {
    const cleanBase = trimTrailingSlash(baseUrl);
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const baseEndsWithApi = /\/api$/i.test(cleanBase);
    const pathStartsWithApi = /^\/api(\/|$)/i.test(normalizedPath);

    if (baseEndsWithApi && pathStartsWithApi) {
      return `${cleanBase}${normalizedPath.replace(/^\/api/i, "")}`;
    }
    return `${cleanBase}${normalizedPath}`;
  }

  function getToken() {
    return localStorage.getItem("token");
  }

  async function request(path, { method = "GET", body, auth = false } = {}) {
    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;
    const headers = isFormData ? {} : { "Content-Type": "application/json" };
    if (auth) {
      const token = getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const requestBody =
      typeof body === "undefined"
        ? undefined
        : isFormData
          ? body
          : JSON.stringify(body);

    const primaryUrl = buildUrl(BASE_URL, path);
    let res = await fetch(primaryUrl, {
      method,
      headers,
      body: requestBody,
    });

    // Fallback for legacy/misconfigured apiBaseUrl values causing 404.
    if (res.status === 404) {
      const alternateBase = /\/api$/i.test(trimTrailingSlash(BASE_URL))
        ? trimTrailingSlash(BASE_URL).replace(/\/api$/i, "")
        : `${trimTrailingSlash(BASE_URL)}/api`;
      const fallbackUrl = buildUrl(alternateBase, path);
      if (fallbackUrl !== primaryUrl) {
        res = await fetch(fallbackUrl, {
          method,
          headers,
          body: requestBody,
        });
      }
    }

    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      data = { raw: text };
    }

    if (!res.ok) {
      const msg = (data && data.error) || `Request failed (${res.status})`;
      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  }

  return {
    baseUrl: trimTrailingSlash(BASE_URL),
    request,
  };
})();
