/* global API, Auth, $ */

(function () {
  const grid = document.getElementById("propertiesGrid");
  const message = document.getElementById("propertiesMessage");
  const applyBtn = document.querySelector(".buy-apply");
  const resetBtn = document.querySelector(".reset-buy");
  const locationInput = document.querySelector(".searrchse");
  const locationForm = document.querySelector("form.example.exxcam");

  const minInput = document.querySelector(".input-min");
  const maxInput = document.querySelector(".input-max");
  const rangeMin = document.querySelector(".range-input .range-min");
  const rangeMax = document.querySelector(".range-input .range-max");
  const rangeProgress = document.querySelector(".sliderre .progress");

  const sizeInputs = Array.from(document.querySelectorAll(".cotentles"));
  const [sizeMinInput, sizeMaxInput] = sizeInputs;

  const typeSections = Array.from(
    document.querySelectorAll(".buy-left-sec .type"),
  );
  const purposeButtons = Array.from(
    (typeSections[0] &&
      typeSections[0].querySelectorAll(".commerical-button button")) ||
    [],
  );
  const propertyTypeButtons = Array.from(
    (typeSections[1] &&
      typeSections[1].querySelectorAll(".commerical-button button")) ||
    [],
  );

  const defaultPurposeButton = purposeButtons.find((btn) =>
    btn.classList.contains("commeric"),
  );
  const defaultPropertyTypeButton = propertyTypeButtons.find((btn) =>
    btn.classList.contains("commeric"),
  );

  const featuresSection = typeSections.find((section) => {
    const heading = section.querySelector("h4");
    return heading && heading.textContent.trim().toLowerCase() === "features";
  });
  const styleSection = typeSections.find((section) => {
    const heading = section.querySelector("h4");
    return heading && heading.textContent.trim().toLowerCase() === "style";
  });

  const featureRadios = Array.from(
    (featuresSection &&
      featuresSection.querySelectorAll(".radio-bu input[type='radio']")) ||
    [],
  );
  const styleRadios = Array.from(
    (styleSection &&
      styleSection.querySelectorAll(".radio-bu input[type='radio']")) ||
    [],
  );

  const filterState = {
    purpose: "",
    type: "",
    feature: "",
  };

  let bookingPropertyId = null;
  let bookingPropertyTitle = "";
  let bookingPropertyPrice = 0;

  function formatMoney(value) {
    return `AED ${Number(value || 0).toLocaleString()}`;
  }

  // function normalizeImageUrl(src) {
  //   const raw = String(src || "").trim();
  //   if (!raw) return "images/66.png";

  //   const normalized = raw.replace(/\\/g, "/");
  //   if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith("data:")) {
  //     return normalized;
  //   }

  //   if (/^(images|steco|video)\//i.test(normalized)) return normalized;
  //   if (normalized.startsWith("/")) return `${API.baseUrl}${normalized}`;
  //   if (/^(uploads|public|assets)\//i.test(normalized)) {
  //     return `${API.baseUrl}/${normalized}`;
  //   }

  //   return normalized;
  // }


  function normalizeImageUrl(src) {
    const raw = String(src || "").trim();
    if (!raw) return "images/66.png";

    if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) {
      return raw;
    }

    if (raw.startsWith("/")) {
      return `${API.baseUrl}${raw}`;
    }

    if (raw.startsWith("uploads/") || raw.startsWith("images/") || raw.startsWith("public/")) {
      return `${API.baseUrl}/${raw}`;
    }

    return `${API.baseUrl}/${raw}`;
  }

  function buildCard(property, index) {
    const col = document.createElement("div");
    col.className = "col-md-6 col-sm-12 col-lg-4";

    const detailUrl = `property-detail.html?id=${property._id}`;

    let imageUrl = "images/66.png";

    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      const firstImage = property.images[0];
      if (firstImage && typeof firstImage === 'string') {
        imageUrl = firstImage;
      }
    } else if (property.image && typeof property.image === 'string') {
      imageUrl = property.image;
    }

    function isValidImageUrl(url) {
      if (!url) return false;
      const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i;
      const isImageHost = url.includes('cloudinary') ||
        url.includes('imgur') ||
        url.includes('images.') ||
        url.includes('/uploads/') ||
        url.includes('/images/');

      return imageExtensions.test(url) || isImageHost;
    }

    if (!isValidImageUrl(imageUrl)) {
      imageUrl = "images/66.png";
    }

    console.log(`Property: ${property.title}, Image URL: ${imageUrl}, Valid: ${isValidImageUrl(imageUrl)}`);

    col.innerHTML = `
    <div class="features-property">
      <div class="buy-card-media fea-img-3d">
        <img class="buy-card-bg-img" 
             src="${escapeAttr(imageUrl)}" 
             alt="${escapeAttr(property.title || "Property image")}" 
             loading="lazy" 
             onerror="this.onerror=null; this.src='images/66.png';">
        <a href="${detailUrl}" class="buy-card-media-link" aria-label="View property details"></a>
        <div class="forsale">
          <div class="forsale-inner">
            <button class="button-sale">${badgePurpose(property.purpose)}</button>
            ${property.isFeatured ? '<button class="button-featured">FEATURED</button>' : ""}
          </div>
        </div>
        <div class="bed2">
          <div class="bed4">
            <p>Bed:${property.bedrooms || 0}</p>
            <p>Bath:${property.bathrooms || 0}</p>
            <p>Area:${property.area || 0}</p>
            <p>${escapeHtml(property.type || "-")}</p>
          </div>
          <div class="fea-icon">
            <i class="fa fa-share-alt" aria-hidden="true"></i>
            <i class="fa fa-heart-o" aria-hidden="true"></i>
          </div>
        </div>
      </div>
      <div class="apartment">
        <h3>${escapeHtml(property.type || "Property")}</h3>
        <h2>${escapeHtml(property.title || "Untitled property")}</h2>
        <p><i class="fa fa-map-marker" aria-hidden="true"></i>${escapeHtml(property.location || "-")}</p>
        <div class="view-detail buy-card-actions">
          <div class="aed">${formatMoney(property.price)}</div>
          <div class="buy-card-buttons">
            <a href="${detailUrl}">
              <div class="view-det buttons-hovereff">View Details</div>
            </a>
            <button
              class="view-det buttons-hovereff js-book-btn buy-card-book-now"
              data-id="${property._id}"
              data-title="${escapeAttr(property.title || "")}" 
              data-price="${property.price || 0}"
              type="button"
            >Book Now</button>
          </div>
        </div>
      </div>
    </div>
  `;
    return col;
  }
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");
  }

  function escapeAttr(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/\"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function badgePurpose(p) {
    return p === "rent" ? "FOR RENT" : "FOR SALE";
  }

  function mapTypeLabelToApiValue(label) {
    const normalized = String(label || "")
      .trim()
      .toLowerCase();
    if (!normalized || normalized === "all") return "";
    if (normalized === "villas") return "villa";
    if (normalized === "offices") return "office";
    if (normalized === "plots") return "plot";
    return normalized;
  }

  function mapFeatureLabelToApiValue(label) {
    const normalized = String(label || "")
      .trim()
      .toLowerCase();
    const dictionary = {
      "ac & heater": "AC",
      pool: "Pool",
      "dish washer": "Dishwasher",
      parking: "Parking",
      "club house": "Clubhouse",
      balcony: "Balcony",
      spa: "Spa",
      "fitness center": "Gym",
    };
    return dictionary[normalized] || "";
  }

  function getNumericInputValue(inputElement) {
    if (!inputElement) return null;
    const raw = String(inputElement.value || "").trim();
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function normalizePriceRange(minPrice, maxPrice) {
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      return { minPrice: maxPrice, maxPrice: minPrice };
    }
    return { minPrice, maxPrice };
  }

  function renderPriceProgress() {
    if (!rangeProgress || !rangeMin || !rangeMax) return;
    const min = Number(rangeMin.value || 0);
    const max = Number(rangeMax.value || 0);
    const cap = Number(rangeMin.max || 1);

    rangeProgress.style.left = `${(min / cap) * 100}%`;
    rangeProgress.style.right = `${100 - (max / cap) * 100}%`;
  }

  function setSelectedButton(buttons, selectedButton) {
    buttons.forEach((btn) => {
      btn.classList.remove("commeric", "commericre", "is-active");
      btn.classList.add("commericre");
    });

    if (selectedButton) {
      selectedButton.classList.remove("commericre");
      selectedButton.classList.add("commeric", "is-active");
    }
  }

  function buildCard(property, index) {
    const col = document.createElement("div");
    col.className = "col-md-6 col-sm-12 col-lg-4";

    const detailUrl = `property-detail.html?id=${property._id}`;
    const imgs = Array.isArray(property.images)
      ? property.images.filter(Boolean)
      : [];
    const coverSrc = normalizeImageUrl(imgs[0]);

    col.innerHTML = `
      <div class="features-property">
        <div class="buy-card-media fea-img-3d">
          <img class="buy-card-bg-img" src="${escapeAttr(coverSrc)}" alt="${escapeAttr(property.title || "Property image")}" loading="lazy" onerror="this.onerror=null;this.src='images/66.png';">
          <a href="${detailUrl}" class="buy-card-media-link" aria-label="View property details"></a>
          <div class="forsale">
            <div class="forsale-inner">
              <button class="button-sale">${badgePurpose(property.purpose)}</button>
              ${property.isFeatured ? '<button class="button-featured">FEATURED</button>' : ""}
            </div>
          </div>
          <div class="bed2">
            <div class="bed4">
              <p>Bed:${property.bedrooms || 0}</p>
              <p>Bath:${property.bathrooms || 0}</p>
              <p>Area:${property.area || 0}</p>
              <p>${escapeHtml(property.type || "-")}</p>
            </div>
            <div class="fea-icon">
              <i class="fa fa-share-alt" aria-hidden="true" id="heart"></i>
              <i class="fa fa-heart-o" aria-hidden="true" id="heart"></i>
            </div>
          </div>
        </div>
        <div class="apartment">
          <h3>${escapeHtml(property.type || "Property")}</h3>
          <h2>${escapeHtml(property.title || "Untitled property")}</h2>
          <p><i class="fa fa-map-marker" aria-hidden="true" id="loc-ic"></i>${escapeHtml(property.location || "-")}</p>
          <div class="view-detail buy-card-actions">
            <div class="aed">${formatMoney(property.price)}</div>
            <div class="buy-card-buttons">
              <a href="${detailUrl}">
                <div class="view-det buttons-hovereff">View Details</div>
              </a>
              <button
                class="view-det buttons-hovereff js-book-btn buy-card-book-now"
                data-id="${property._id}"
                data-title="${escapeAttr(property.title || "")}" 
                data-price="${property.price || 0}"
                type="button"
              >Book Now</button>
            </div>
          </div>
        </div>
      </div>
    `;
    return col;
  }

  function clearGrid() {
    grid.innerHTML = "";
  }

  function setupBookingModal() {
    if (document.getElementById("bookingModal")) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="modal fade" id="bookingModal" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Book Property</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span>&times;</span></button>
            </div>
            <div class="modal-body">
              <form id="bookingForm">
                <div class="form-group">
                  <label>Name</label>
                  <input type="text" class="form-control" id="bookingName" required>
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" class="form-control" id="bookingEmail" required>
                </div>
                <div class="form-group">
                  <label>Phone</label>
                  <input type="text" class="form-control" id="bookingPhone" required>
                </div>
                <div class="form-group">
                  <label>Message</label>
                  <textarea class="form-control" id="bookingMessage" rows="3"></textarea>
                </div>
                <div class="form-group">
                  <label>Property</label>
                  <input type="text" class="form-control" id="bookingPropertyTitle" readonly>
                </div>
                <div class="form-group">
                  <label>Price</label>
                  <input type="text" class="form-control" id="bookingPropertyPrice" readonly>
                </div>
                <p id="bookingMsg" style="margin:0;"></p>
                <button class="btn btn-danger mt-3" type="submit">Submit Booking</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrap.firstElementChild);

    const form = document.getElementById("bookingForm");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msgEl = document.getElementById("bookingMsg");
      try {
        if (!Auth.isLoggedIn()) {
          window.location.href = "login.html";
          return;
        }
        msgEl.textContent = "Submitting...";
        await API.request("/api/orders", {
          method: "POST",
          auth: true,
          body: {
            propertyId: bookingPropertyId,
            clientName: document.getElementById("bookingName").value.trim(),
            clientEmail: document.getElementById("bookingEmail").value.trim(),
            clientPhone: document.getElementById("bookingPhone").value.trim(),
            message: document.getElementById("bookingMessage").value.trim(),
          },
        });
        msgEl.style.color = "green";
        msgEl.textContent = "Booking created successfully.";
        setTimeout(() => {
          $("#bookingModal").modal("hide");
          window.location.href = "dashboard.html";
        }, 700);
      } catch (err) {
        msgEl.style.color = "red";
        msgEl.textContent = err.message || "Could not create booking.";
      }
    });
  }

  function buildQueryParams() {
    const params = new URLSearchParams();

    const location = locationInput ? locationInput.value.trim() : "";
    if (location) params.set("location", location);

    if (filterState.type) params.set("type", filterState.type);
    if (filterState.purpose) params.set("purpose", filterState.purpose);
    if (filterState.feature) params.set("feature", filterState.feature);

    const rawMinPrice = getNumericInputValue(minInput);
    const rawMaxPrice = getNumericInputValue(maxInput);
    const { minPrice, maxPrice } = normalizePriceRange(
      rawMinPrice,
      rawMaxPrice,
    );
    if (minPrice !== null) params.set("minPrice", String(minPrice));
    if (maxPrice !== null) params.set("maxPrice", String(maxPrice));

    const rawMinArea = getNumericInputValue(sizeMinInput);
    const rawMaxArea = getNumericInputValue(sizeMaxInput);
    const area = normalizePriceRange(rawMinArea, rawMaxArea);
    if (area.minPrice !== null) params.set("minArea", String(area.minPrice));
    if (area.maxPrice !== null) params.set("maxArea", String(area.maxPrice));

    return params;
  }

  async function loadProperties({ applyFilters = false } = {}) {
    try {
      const query = applyFilters ? buildQueryParams().toString() : "";
      const endpoint = query ? `/api/properties?${query}` : "/api/properties";

      const list = await API.request(endpoint);
      clearGrid();
      if (!Array.isArray(list) || list.length === 0) {
        grid.innerHTML = `<div class="col-md-12"><p>No properties found.</p></div>`;
        return;
      }

      list.forEach((p, i) => grid.appendChild(buildCard(p, i)));
      bindBookButtons();
      bindFeaImg3dTilt();
    } catch (err) {
      clearGrid();
      grid.innerHTML = `<div class="col-md-12"><p>${err.message || "Failed to load properties."}</p></div>`;
      if (message)
        message.textContent = err.message || "Failed to load properties.";
    }
  }

  function bindFeaImg3dTilt() {
    document.querySelectorAll(".fea-img-3d").forEach((wrap) => {
      const target = wrap.querySelector("img") || wrap;
      if (!target || wrap.dataset.tiltBound === "1") return;

      wrap.dataset.tiltBound = "1";
      wrap.addEventListener("mousemove", (e) => {
        const r = wrap.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        const max = 10;
        target.style.transform = `perspective(600px) rotateY(${x * max}deg) rotateX(${-y * max}deg) scale(1.04)`;
      });
      wrap.addEventListener("mouseleave", () => {
        target.style.transform = "";
      });
    });
  }

  function bindBookButtons() {
    document.querySelectorAll(".js-book-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        bookingPropertyId = btn.getAttribute("data-id");
        bookingPropertyTitle = btn.getAttribute("data-title") || "";
        bookingPropertyPrice = Number(btn.getAttribute("data-price") || 0);

        if (!Auth.isLoggedIn()) {
          window.location.href = "login.html";
          return;
        }

        const user = Auth.getUser();
        if (user) {
          const email = document.getElementById("bookingEmail");
          const name = document.getElementById("bookingName");
          if (email) email.value = user.email || "";
          if (name) name.value = user.name || "";
        }

        document.getElementById("bookingPropertyTitle").value =
          bookingPropertyTitle;
        document.getElementById("bookingPropertyPrice").value =
          formatMoney(bookingPropertyPrice);
        $("#bookingModal").modal("show");
      });
    });
  }

  function setRangeDefaults() {
    if (rangeMin && minInput) {
      rangeMin.value = rangeMin.min || "0";
      minInput.value = rangeMin.value;
    }
    if (rangeMax && maxInput) {
      rangeMax.value = rangeMax.max || "10000";
      maxInput.value = rangeMax.value;
    }
    renderPriceProgress();
  }

  function syncPriceInputsWithRange() {
    if (!rangeMin || !rangeMax || !minInput || !maxInput) return;

    minInput.value = rangeMin.value;
    maxInput.value = rangeMax.value;
    renderPriceProgress();

    rangeMin.addEventListener("input", () => {
      const minVal = Number(rangeMin.value);
      const maxVal = Number(rangeMax.value);
      if (minVal > maxVal) {
        rangeMin.value = String(maxVal);
      }
      minInput.value = rangeMin.value;
      renderPriceProgress();
    });

    rangeMax.addEventListener("input", () => {
      const minVal = Number(rangeMin.value);
      const maxVal = Number(rangeMax.value);
      if (maxVal < minVal) {
        rangeMax.value = String(minVal);
      }
      maxInput.value = rangeMax.value;
      renderPriceProgress();
    });

    minInput.addEventListener("input", () => {
      const val = getNumericInputValue(minInput);
      if (val === null) return;
      const clamped = Math.max(
        Number(rangeMin.min || 0),
        Math.min(val, Number(rangeMax.value)),
      );
      rangeMin.value = String(clamped);
      minInput.value = String(clamped);
      renderPriceProgress();
    });

    maxInput.addEventListener("input", () => {
      const val = getNumericInputValue(maxInput);
      if (val === null) return;
      const clamped = Math.min(
        Number(rangeMax.max || 10000),
        Math.max(val, Number(rangeMin.value)),
      );
      rangeMax.value = String(clamped);
      maxInput.value = String(clamped);
      renderPriceProgress();
    });
  }

  function bindFilters() {
    if (locationForm) {
      locationForm.addEventListener("submit", (e) => {
        e.preventDefault();
        loadProperties({ applyFilters: true });
      });
    }

    purposeButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const label = btn.textContent.trim().toLowerCase();
        filterState.purpose = label.includes("rent") ? "rent" : "sale";
        setSelectedButton(purposeButtons, btn);
      });
    });

    propertyTypeButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const apiType = mapTypeLabelToApiValue(btn.textContent);
        filterState.type = apiType;
        setSelectedButton(propertyTypeButtons, btn);
      });
    });

    if (defaultPurposeButton) {
      const purposeLabel = defaultPurposeButton.textContent
        .trim()
        .toLowerCase();
      filterState.purpose = purposeLabel.includes("rent") ? "rent" : "sale";
      setSelectedButton(purposeButtons, defaultPurposeButton);
    }

    if (defaultPropertyTypeButton) {
      filterState.type = mapTypeLabelToApiValue(
        defaultPropertyTypeButton.textContent,
      );
      setSelectedButton(propertyTypeButtons, defaultPropertyTypeButton);
    }

    // Keep feature and style radio groups independent.
    featureRadios.forEach((radio) => {
      radio.name = "feature_filter";
      radio.addEventListener("change", () => {
        const label = radio.parentElement
          ? radio.parentElement.textContent
          : "";
        filterState.feature = radio.checked
          ? mapFeatureLabelToApiValue(label)
          : "";
      });
    });

    styleRadios.forEach((radio) => {
      radio.name = "style_filter";
    });

    if (applyBtn) {
      applyBtn.addEventListener("click", (e) => {
        e.preventDefault();
        loadProperties({ applyFilters: true });
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", (e) => {
        e.preventDefault();

        filterState.purpose = "";
        filterState.type = "";
        filterState.feature = "";

        if (locationInput) locationInput.value = "";
        if (sizeMinInput) sizeMinInput.value = "";
        if (sizeMaxInput) sizeMaxInput.value = "";

        if (defaultPurposeButton) {
          const resetPurposeLabel = defaultPurposeButton.textContent
            .trim()
            .toLowerCase();
          filterState.purpose = resetPurposeLabel.includes("rent")
            ? "rent"
            : "sale";
          setSelectedButton(purposeButtons, defaultPurposeButton);
        } else {
          filterState.purpose = "";
          setSelectedButton(purposeButtons, null);
        }

        if (defaultPropertyTypeButton) {
          filterState.type = mapTypeLabelToApiValue(
            defaultPropertyTypeButton.textContent,
          );
          setSelectedButton(propertyTypeButtons, defaultPropertyTypeButton);
        } else {
          filterState.type = "";
          setSelectedButton(propertyTypeButtons, null);
        }

        featureRadios.forEach((r) => {
          r.checked = false;
        });
        styleRadios.forEach((r) => {
          r.checked = false;
        });

        setRangeDefaults();
        loadProperties({ applyFilters: false });
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    Auth.wireNavAuth();
    setupBookingModal();
    syncPriceInputsWithRange();
    bindFilters();
    setRangeDefaults();
    loadProperties({ applyFilters: false });
  });
})();
