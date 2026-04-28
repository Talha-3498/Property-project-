/* global API, Auth */

(function () {
  const propertyMsg = document.getElementById("userPropertyMsg");

  function statusBadge(status) {
    const s = (status || "").toLowerCase();
    return `<span class="badge-status status-${s}">${status || "-"}</span>`;
  }

  function showPropertyMessage(text, color = "green") {
    if (!propertyMsg) return;
    propertyMsg.style.color = color;
    propertyMsg.textContent = text;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function switchTab(tab) {
    document
      .querySelectorAll(".db-tab")
      .forEach((el) => el.classList.add("db-hidden"));
    const target = document.getElementById(`tab-${tab}`);
    if (target) target.classList.remove("db-hidden");
    document.querySelectorAll(".db-menu[data-tab]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });
  }

  async function loadData() {
    const [orders, submissions] = await Promise.all([
      API.request("/api/orders", { auth: true }),
      API.request("/api/properties/my/submissions", { auth: true }),
    ]);

    document.getElementById("statOrders").textContent = orders.length;
    const submissionsMetric = document.getElementById("statSubmissions");
    if (submissionsMetric) submissionsMetric.textContent = submissions.length;

    const ordersBody = document.getElementById("ordersTableBody");
    ordersBody.innerHTML =
      orders
        .map(
          (o) => `<tr>
      <td>${o.propertyId?.title || "N/A"}</td>
      <td>AED ${Number(o.totalAmount || 0).toLocaleString()}</td>
      <td>${statusBadge(o.status)}</td>
      <td>${new Date(o.orderDate).toLocaleString()}</td>
    </tr>`,
        )
        .join("") || `<tr><td colspan="4">No orders yet.</td></tr>`;

    const submissionsBody = document.getElementById("userPropertiesTableBody");
    if (submissionsBody) {
      submissionsBody.innerHTML =
        submissions
          .map(
            (p) => `<tr>
        <td>${escapeHtml(p.title || "-")}</td>
        <td>${escapeHtml(String(p.purpose || "-").toUpperCase())}</td>
        <td>AED ${Number(p.price || 0).toLocaleString()}</td>
        <td>${statusBadge(p.status || "pending")}</td>
        <td>${new Date(p.createdAt).toLocaleString()}</td>
      </tr>`,
          )
          .join("") ||
        `<tr><td colspan="5">No property submissions yet.</td></tr>`;
    }
  }

  function bindPropertyForm() {
    const form = document.getElementById("userPropertyForm");
    const submitBtn = document.getElementById("userPropertySubmitBtn");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
      }
      try {
        const fileInput = document.getElementById("upImageFile");
        const file = fileInput && fileInput.files ? fileInput.files[0] : null;
        if (file) {
          const validType =
            file.type === "image/png" ||
            file.type === "image/jpg" ||
            file.type === "image/jpeg";
          if (!validType) {
            showPropertyMessage("Only PNG/JPG images are allowed.", "red");
            return;
          }
          if (file.size > 2 * 1024 * 1024) {
            showPropertyMessage("Image must be 2MB or smaller.", "red");
            return;
          }
        }

        const payload = new FormData();
        payload.append(
          "title",
          document.getElementById("upTitle").value.trim(),
        );
        payload.append(
          "location",
          document.getElementById("upLocation").value.trim(),
        );
        payload.append("type", document.getElementById("upType").value.trim());
        payload.append("purpose", document.getElementById("upPurpose").value);
        payload.append(
          "price",
          String(Number(document.getElementById("upPrice").value)),
        );
        payload.append(
          "bedrooms",
          String(Number(document.getElementById("upBedrooms").value || 0)),
        );
        payload.append(
          "bathrooms",
          String(Number(document.getElementById("upBathrooms").value || 0)),
        );
        payload.append(
          "area",
          String(Number(document.getElementById("upArea").value || 0)),
        );
        payload.append(
          "description",
          document.getElementById("upDescription").value.trim(),
        );
        payload.append("features", document.getElementById("upFeatures").value);
        if (file) payload.append("image", file);

        await API.request("/api/properties/submit", {
          method: "POST",
          auth: true,
          body: payload,
        });

        form.reset();
        showPropertyMessage(
          "Property submitted successfully. Waiting for admin approval.",
        );
        await loadData();
      } catch (err) {
        showPropertyMessage(err.message || "Failed to submit property.", "red");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit For Review";
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (!Auth.requireLogin()) return;
    Auth.wireNavAuth();

    const user = Auth.getUser() || {};
    document.getElementById("welcomeName").textContent = user.name || "-";
    document.getElementById("welcomeEmail").textContent = user.email || "-";
    document.getElementById("welcomeRole").textContent = user.role || "-";
    document.getElementById("profileName").textContent = user.name || "-";
    document.getElementById("profileEmail").textContent = user.email || "-";
    document.getElementById("profileRole").textContent = user.role || "-";
    document.getElementById("userAvatar").textContent = (user.name || "U")
      .charAt(0)
      .toUpperCase();

    document.querySelectorAll(".db-menu[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });
    bindPropertyForm();

    try {
      await loadData();
    } catch (err) {
      // no-op lightweight fallback in UI
    }
  });
})();
