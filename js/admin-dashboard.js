/* global API, Auth */

(function () {
  const msg = document.getElementById("adminMsg");
  const ordersList = document.getElementById("ordersAdminList");
  const propertiesList = document.getElementById("propertiesAdminList");
  const usersList = document.getElementById("usersAdminList");
  const leadsList = document.getElementById("leadsAdminList");
  const contactList = document.getElementById("contactAdminList");

  function showMessage(text, color = "green") {
    if (!msg) return;
    msg.style.color = color;
    msg.textContent = text;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Safe for HTML attribute values (e.g. data-id). */
  function escapeAttr(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/'/g, "&#39;");
  }

  function asArray(x) {
    return Array.isArray(x) ? x : [];
  }

  function formatCurrency(value) {
    return `AED ${Number(value || 0).toLocaleString()}`;
  }

  function formatDate(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString();
  }

  function formatDateTime(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  }

  function normalizePropertyStatus(status) {
    const s = String(status || "").toLowerCase();
    if (s === "approved" || s === "rejected" || s === "pending") return s;
    return "pending";
  }

  function switchTab(tab) {
    document
      .querySelectorAll(".ad-tab")
      .forEach((el) => el.classList.add("ad-hidden"));
    const target = document.getElementById(`tab-${tab}`);
    if (target) target.classList.remove("ad-hidden");
    document.querySelectorAll(".ad-nav-btn[data-tab]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });
  }

  async function loadAdminData() {
    const [ordersRaw, propertiesRaw, usersRaw, leadsRaw, contactsRaw] =
      await Promise.all([
        API.request("/api/admin/orders", { auth: true }),
        API.request("/api/admin/properties", { auth: true }),
        API.request("/api/admin/users", { auth: true }),
        API.request("/api/admin/sell-leads", { auth: true }),
        API.request("/api/admin/contact-messages", { auth: true }),
      ]);

    const orders = asArray(ordersRaw);
    const properties = asArray(propertiesRaw);
    const users = asArray(usersRaw);
    const leads = asArray(leadsRaw);
    const contacts = asArray(contactsRaw);

    const metricUsers = document.getElementById("metricUsers");
    const metricLeads = document.getElementById("metricLeads");
    const metricOrders = document.getElementById("metricOrders");
    const metricProperties = document.getElementById("metricProperties");
    if (metricUsers) metricUsers.textContent = users.length;
    if (metricLeads) metricLeads.textContent = leads.length;
    if (metricOrders) metricOrders.textContent = orders.length;
    if (metricProperties) metricProperties.textContent = properties.length;
    const metricContact = document.getElementById("metricContact");
    if (metricContact) metricContact.textContent = contacts.length;

    if (!ordersList || !propertiesList || !usersList || !leadsList) {
      showMessage("Dashboard layout is incomplete. Refresh the page.", "red");
      return;
    }

    ordersList.innerHTML =
      orders.length === 0
        ? '<div class="ad-empty-state">No orders found yet.</div>'
        : `
      <div class="ad-orders-table-wrap">
        <table class="ad-orders-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Property</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${orders
              .map((o) => {
                const oid = escapeAttr(o._id || "");
                const propTitle =
                  o.propertyId &&
                  typeof o.propertyId === "object" &&
                  o.propertyId.title != null
                    ? o.propertyId.title
                    : "N/A";
                return `
                  <tr>
                    <td>
                      <div class="ad-order-client">${escapeHtml(o.clientName || "-")}</div>
                      <div class="ad-order-sub">${escapeHtml(o.clientEmail || "-")}</div>
                      <div class="ad-order-sub">${escapeHtml(o.clientPhone || "-")}</div>
                    </td>
                    <td>${escapeHtml(String(propTitle))}</td>
                    <td>${escapeHtml(formatCurrency(o.totalAmount))}</td>
                    <td>${escapeHtml(formatDate(o.orderDate || o.createdAt))}</td>
                    <td>
                      <select class="form-control form-control-sm js-order-status ad-order-select" data-id="${oid}">
                        ${["pending", "confirmed", "completed", "cancelled"]
                          .map(
                            (s) =>
                              `<option ${o.status === s ? "selected" : ""} value="${s}">${s}</option>`,
                          )
                          .join("")}
                      </select>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-dark js-order-update ad-order-update" data-id="${oid}">Update</button>
                    </td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    propertiesList.innerHTML =
      properties
        .map((p) => {
          const pid = escapeAttr(p._id || "");
          const price = Number(p.price || 0).toLocaleString();
          const purpose = String(p.purpose || "property").toUpperCase();
          const purposeClass =
            String(p.purpose || "").toLowerCase() === "rent" ? "rent" : "sale";
          const bedrooms = Number.isFinite(Number(p.bedrooms))
            ? Number(p.bedrooms)
            : 0;
          const bathrooms = Number.isFinite(Number(p.bathrooms))
            ? Number(p.bathrooms)
            : 0;
          const area = Number.isFinite(Number(p.area)) ? Number(p.area) : 0;
          const description = String(p.description || "").trim();
          const featuresCount = asArray(p.features).length;
          const imagesCount = asArray(p.images).length;
          const status = normalizePropertyStatus(p.status);
          const submitterName =
            p.submittedBy && typeof p.submittedBy === "object"
              ? p.submittedBy.name || p.submittedBy.email || "Unknown"
              : "Unknown";
          const badges = `${p.isFeatured ? '<span class="ad-pill ad-pill-featured">Featured</span>' : ""}<span class="ad-pill ad-pill-${purposeClass}">${escapeHtml(purpose)}</span><span class="ad-pill ad-pill-${status}">${escapeHtml(status)}</span>`;
          const moderationButtons = `${status !== "approved" ? `<button class="btn btn-sm btn-outline-success js-prop-approve" data-id="${pid}">Approve</button>` : ""}${status !== "rejected" ? `<button class="btn btn-sm btn-outline-warning js-prop-reject" data-id="${pid}">Reject</button>` : ""}`;
          return `
      <div class="ad-property-card">
        <div class="ad-property-card__head">
          <div>
            <div class="ad-property-card__eyebrow">${escapeHtml(p.type || "Property")}</div>
            <h6>${escapeHtml(p.title || "Untitled property")}</h6>
          </div>
          <div class="ad-property-card__badges">${badges}</div>
        </div>
        <div class="ad-property-card__location">${escapeHtml(p.location || "Location not set")}</div>
        <div class="ad-property-card__stats">
          <div><span>AED ${price}</span><small>Price</small></div>
          <div><span>${bedrooms}</span><small>Beds</small></div>
          <div><span>${bathrooms}</span><small>Baths</small></div>
          <div><span>${area}</span><small>Area</small></div>
        </div>
        ${description ? `<p class="ad-property-card__desc">${escapeHtml(description)}</p>` : ""}
        <div class="ad-property-card__meta-row">
          <span>Submitted by: ${escapeHtml(submitterName)}</span>
          <span>${featuresCount} features</span>
          <span>${imagesCount} images</span>
        </div>
        <div class="ad-property-card__actions">
          ${moderationButtons}
          <button class="btn btn-sm btn-outline-primary js-prop-edit" data-id="${pid}">Edit</button>
          <button class="btn btn-sm btn-outline-danger js-prop-del" data-id="${pid}">Delete</button>
        </div>
      </div>
    `;
        })
        .join("") ||
      '<div class="ad-empty-state">No properties found yet. Add the first listing above.</div>';

    usersList.innerHTML =
      users
        .map((u) => {
          const uid = escapeAttr(u._id || "");
          const isAdminUser = String(u.role || "").toLowerCase() === "admin";
          const roleLabel = escapeHtml(u.role || "user");
          const roleClass = isAdminUser ? "admin" : "user";
          return `
      <div class="ad-user-card">
        <div class="ad-user-card__head">
          <div>
            <h6>${escapeHtml(u.name || "Unnamed user")}</h6>
            <div class="ad-user-card__meta">${escapeHtml(u.email || "No email provided")}</div>
          </div>
          <span class="ad-pill ad-pill-${roleClass}">${roleLabel}</span>
        </div>
        <div class="ad-user-card__foot">
          <span>Joined ${escapeHtml(new Date(u.createdAt).toLocaleDateString())}</span>
          ${
            !isAdminUser
              ? `<button class="btn btn-sm btn-outline-dark js-user-promote" data-id="${uid}">Promote to Admin</button>`
              : `<span class="ad-user-card__status">Admin access active</span>`
          }
        </div>
      </div>
    `;
        })
        .join("") || '<div class="ad-empty-state">No users found yet.</div>';

    leadsList.innerHTML =
      leads.length === 0
        ? '<div class="ad-empty-state">No sell leads found yet.</div>'
        : `
      <div class="ad-orders-table-wrap">
        <table class="ad-orders-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>City</th>
              <th>Property Details</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${leads
              .map((l) => {
                const lid = escapeAttr(l._id || "");
                return `
                  <tr>
                    <td><div class="ad-order-client">${escapeHtml(l.name || "-")}</div></td>
                    <td>
                      <div class="ad-order-sub">${escapeHtml(l.email || "-")}</div>
                      <div class="ad-order-sub">${escapeHtml(l.phone || "-")}</div>
                    </td>
                    <td>${escapeHtml(l.city || "-")}</td>
                    <td>${escapeHtml(l.propertyDetails || "-")}</td>
                    <td>${escapeHtml(formatDate(l.createdAt))}</td>
                    <td>
                      <select class="form-control form-control-sm js-lead-status ad-order-select" data-id="${lid}">
                        ${["new", "contacted", "qualified", "closed"]
                          .map(
                            (s) =>
                              `<option ${l.status === s ? "selected" : ""} value="${s}">${s}</option>`,
                          )
                          .join("")}
                      </select>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-dark js-lead-update ad-order-update" data-id="${lid}">Update</button>
                    </td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    if (contactList) {
      contactList.innerHTML =
        contacts.length === 0
          ? '<div class="ad-empty-state">No contact messages found yet.</div>'
          : `
        <div class="ad-orders-table-wrap">
          <table class="ad-orders-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Message</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${contacts
                .map((c) => {
                  const cid = escapeAttr(c._id || "");
                  const fullName =
                    `${c.firstName || ""} ${c.lastName || ""}`.trim();
                  return `
                    <tr>
                      <td><div class="ad-order-client">${escapeHtml(fullName || "-")}</div></td>
                      <td>
                        <div class="ad-order-sub">${escapeHtml(c.email || "-")}</div>
                        <div class="ad-order-sub">${escapeHtml(c.phone || "-")}</div>
                      </td>
                      <td>${escapeHtml(c.message || "-")}</td>
                      <td>${escapeHtml(formatDateTime(c.createdAt))}</td>
                      <td>
                        <select class="form-control form-control-sm js-contact-status ad-order-select" data-id="${cid}">
                          ${["new", "read", "archived"]
                            .map(
                              (s) =>
                                `<option ${c.status === s ? "selected" : ""} value="${s}">${s}</option>`,
                            )
                            .join("")}
                        </select>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-dark js-contact-update ad-order-update" data-id="${cid}">Update</button>
                      </td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    }

    bindActions();
  }

  function bindActions() {
    document.querySelectorAll(".js-order-update").forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const status = document.querySelector(
          `.js-order-status[data-id="${id}"]`,
        ).value;
        await API.request(`/api/admin/orders/${id}/status`, {
          method: "PUT",
          auth: true,
          body: { status },
        });
        showMessage("Order status updated.");
      };
    });

    document.querySelectorAll(".js-lead-update").forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const status = document.querySelector(
          `.js-lead-status[data-id="${id}"]`,
        ).value;
        await API.request(`/api/admin/sell-leads/${id}/status`, {
          method: "PUT",
          auth: true,
          body: { status },
        });
        showMessage("Lead status updated.");
      };
    });

    document.querySelectorAll(".js-user-promote").forEach((btn) => {
      btn.onclick = async () => {
        await API.request(`/api/admin/users/${btn.dataset.id}/promote`, {
          method: "PUT",
          auth: true,
        });
        showMessage("User promoted to admin.");
        await loadAdminData();
      };
    });

    document.querySelectorAll(".js-prop-del").forEach((btn) => {
      btn.onclick = async () => {
        if (!confirm("Delete this property?")) return;
        await API.request(`/api/admin/properties/${btn.dataset.id}`, {
          method: "DELETE",
          auth: true,
        });
        await loadAdminData();
      };
    });

    document.querySelectorAll(".js-prop-edit").forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const title = prompt("New title:", "");
        const price = prompt("New price:", "");
        const payload = {};
        if (title) payload.title = title;
        if (price) payload.price = Number(price);
        if (Object.keys(payload).length === 0) return;
        await API.request(`/api/admin/properties/${id}`, {
          method: "PUT",
          auth: true,
          body: payload,
        });
        await loadAdminData();
      };
    });

    document.querySelectorAll(".js-prop-approve").forEach((btn) => {
      btn.onclick = async () => {
        await API.request(`/api/admin/properties/${btn.dataset.id}/status`, {
          method: "PUT",
          auth: true,
          body: { status: "approved" },
        });
        showMessage("Property approved.");
        await loadAdminData();
      };
    });

    document.querySelectorAll(".js-prop-reject").forEach((btn) => {
      btn.onclick = async () => {
        await API.request(`/api/admin/properties/${btn.dataset.id}/status`, {
          method: "PUT",
          auth: true,
          body: { status: "rejected" },
        });
        showMessage("Property rejected.");
        await loadAdminData();
      };
    });

    document.querySelectorAll(".js-contact-update").forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const status = document.querySelector(
          `.js-contact-status[data-id="${id}"]`,
        ).value;
        await API.request(`/api/admin/contact-messages/${id}/status`, {
          method: "PUT",
          auth: true,
          body: { status },
        });
        showMessage("Contact status updated.");
        await loadAdminData();
      };
    });
  }

  function bindSidebar() {
    document.querySelectorAll(".ad-nav-btn[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });
  }

  function bindPropertyForm() {
    const form = document.getElementById("propertyForm");
    const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const fileInput = document.getElementById("pImageFile");
        const file = fileInput && fileInput.files ? fileInput.files[0] : null;
        if (file) {
          const validType =
            file.type === "image/png" ||
            file.type === "image/jpg" ||
            file.type === "image/jpeg";
          if (!validType) {
            showMessage("Only PNG/JPG images are allowed.", "red");
            return;
          }
          if (file.size > 2 * 1024 * 1024) {
            showMessage("Image must be 2MB or smaller.", "red");
            return;
          }
        }

        const payload = new FormData();
        payload.append("title", document.getElementById("pTitle").value.trim());
        payload.append(
          "location",
          document.getElementById("pLocation").value.trim(),
        );
        payload.append("type", document.getElementById("pType").value.trim());
        payload.append("purpose", document.getElementById("pPurpose").value);
        payload.append(
          "price",
          String(Number(document.getElementById("pPrice").value)),
        );
        payload.append(
          "bedrooms",
          String(Number(document.getElementById("pBedrooms").value || 0)),
        );
        payload.append(
          "bathrooms",
          String(Number(document.getElementById("pBathrooms").value || 0)),
        );
        payload.append(
          "area",
          String(Number(document.getElementById("pArea").value || 0)),
        );
        payload.append(
          "description",
          document.getElementById("pDescription").value.trim(),
        );
        payload.append("features", document.getElementById("pFeatures").value);
        payload.append(
          "isFeatured",
          String(document.getElementById("pFeatured").checked),
        );
        if (file) payload.append("image", file);

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Saving...";
        }
        await API.request("/api/admin/properties", {
          method: "POST",
          auth: true,
          body: payload,
        });
        form.reset();
        showMessage("Property saved.");
        await loadAdminData();
      } catch (err) {
        showMessage(err.message || "Failed to save property.", "red");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Save Property";
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      if (typeof Auth === "undefined" || typeof API === "undefined") {
        showMessage(
          "Failed to load scripts (api.js / auth.js). Check the browser console.",
          "red",
        );
        return;
      }
      if (!Auth.requireAdmin()) return;
      Auth.wireNavAuth();
      const user = Auth.getUser() || {};
      const av = document.getElementById("adminAvatar");
      if (av) av.textContent = (user.name || "A").charAt(0).toUpperCase();
      bindSidebar();
      bindPropertyForm();
      try {
        await loadAdminData();
      } catch (err) {
        showMessage(err.message || "Failed to load dashboard data.", "red");
      }
    } catch (err) {
      showMessage(err.message || "Admin dashboard failed to start.", "red");
      console.error(err);
    }
  });
})();
