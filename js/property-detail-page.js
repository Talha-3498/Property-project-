/* global API, $ */

(function () {
  const FALLBACK_IMG = "images/p1.png";

  function getIdFromQuery() {
    const id = new URLSearchParams(window.location.search).get("id");
    return id && String(id).trim() ? String(id).trim() : null;
  }

  function escapeAttr(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatMoney(n) {
    return `AED ${Number(n || 0).toLocaleString()}`;
  }

  function imageList(prop) {
    const raw = Array.isArray(prop.images) ? prop.images.filter(Boolean) : [];
    return raw.length ? raw : [FALLBACK_IMG];
  }

  function renderCarousel(imgs) {
    const inner = document.getElementById("propertyCarouselInner");
    if (!inner) return;
    inner.innerHTML = imgs
      .map(
        (src, i) => `
      <div class="carousel-item${i === 0 ? " active" : ""}">
        <img class="d-block w-100" src="${escapeAttr(src)}" alt="">
      </div>`
      )
      .join("");

    if (window.jQuery && $("#carouselExampleControls").length) {
      try {
        $("#carouselExampleControls").carousel("dispose");
      } catch (_) {}
      $("#carouselExampleControls").carousel({ interval: 5000 });
    }
  }

  function renderSideThumbs(imgs) {
    const col = document.getElementById("propertySideThumbsCol");
    if (col) col.style.display = imgs.length > 1 ? "" : "none";
    const a = document.getElementById("propertySideImg1");
    const b = document.getElementById("propertySideImg2");
    if (a) a.src = imgs[1] || imgs[0] || FALLBACK_IMG;
    if (b) b.src = imgs[2] || imgs[1] || imgs[0] || FALLBACK_IMG;
  }

  function renderGallery(imgs) {
    const section = document.querySelector(".photogallery-section");
    if (section) section.style.display = imgs.length > 1 ? "" : "none";
    const host = document.getElementById("propertyGalleryHost");
    if (!host) return;
    if (imgs.length <= 1) {
      host.innerHTML = "";
      return;
    }
    const rest = imgs.slice(1);
    const big = rest[0];
    const small = rest.slice(1, 3);
    const row2 = rest.slice(3);
    let html = '<div class="row">';
    html += `<div class="col-md-8"><div class="photo-gall"><img class="w-100" src="${escapeAttr(big)}" alt=""></div></div>`;
    html += '<div class="col-md-4"><div class="photo-gall">';
    small.forEach((src) => {
      html += `<div class="g2secc mb-2"><img class="w-100" src="${escapeAttr(src)}" alt=""></div>`;
    });
    html += "</div></div></div>";
    if (row2.length) {
      html += '<div class="row mt-2">';
      row2.slice(0, 3).forEach((src) => {
        html += `<div class="col-md-4"><div class="photo-galll"><img class="w-100" src="${escapeAttr(src)}" alt=""></div></div>`;
      });
      html += "</div>";
    }
    host.innerHTML = html;
  }

  function renderFeatures(features) {
    const ul = document.getElementById("propertyFeaturesList");
    if (!ul) return;
    const list = Array.isArray(features) ? features.filter(Boolean) : [];
    if (!list.length) {
      ul.innerHTML = "<li class=\"text-muted\">No features listed.</li>";
      return;
    }
    ul.innerHTML = list.map((f) => `<li><i class="fa fa-check text-danger mr-2"></i>${escapeHtml(f)}</li>`).join("");
  }

  async function loadProperty() {
    const id = getIdFromQuery();
    const titleEl = document.getElementById("propertyTitle");
    const descEl = document.getElementById("propertyDescription");

    if (!id) {
      if (titleEl) titleEl.textContent = "Property not found";
      if (descEl) descEl.textContent = "Open this page from Buy / Rent listings (View Detail).";
      return;
    }

    try {
      const prop = await API.request(`/api/properties/${encodeURIComponent(id)}`);
      const imgs = imageList(prop);

      renderCarousel(imgs);
      renderSideThumbs(imgs);
      renderGallery(imgs);
      renderFeatures(prop.features);

      if (titleEl) titleEl.textContent = prop.title || "Property";
      const bed = document.getElementById("propertyBedCount");
      const bath = document.getElementById("propertyBathCount");
      const area = document.getElementById("propertyAreaCount");
      if (bed) bed.textContent = String(prop.bedrooms ?? 0);
      if (bath) bath.textContent = String(prop.bathrooms ?? 0);
      if (area) area.textContent = String(prop.area ?? 0);

      if (descEl) descEl.textContent = prop.description || "No description provided.";

      const meta = document.getElementById("propertyMeta");
      if (meta) {
        const purpose = prop.purpose === "rent" ? "For rent" : "For sale";
        meta.innerHTML = `${escapeHtml(prop.location || "—")} · ${escapeHtml(prop.type || "—")} · ${escapeHtml(purpose)} · <strong>${escapeHtml(formatMoney(prop.price))}</strong>`;
      }

      document.title = `${prop.title || "Property"} | Property Detail`;
    } catch (err) {
      if (titleEl) titleEl.textContent = "Could not load property";
      if (descEl) descEl.textContent = err.message || "Request failed. Is the API running?";
    }
  }

  document.addEventListener("DOMContentLoaded", loadProperty);
})();
