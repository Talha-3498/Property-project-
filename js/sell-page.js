/* global API, Auth */

document.addEventListener("DOMContentLoaded", () => {
  Auth.wireNavAuth();

  const form = document.getElementById("sellLeadForm");
  const msg = document.getElementById("sellLeadMessage");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.style.color = "";
    msg.textContent = "Submitting...";

    try {
      await API.request("/api/sell-leads", {
        method: "POST",
        body: {
          name: document.getElementById("sellName").value.trim(),
          email: document.getElementById("sellEmail").value.trim(),
          phone: document.getElementById("sellPhone").value.trim(),
          city: document.getElementById("sellCity").value.trim(),
          propertyDetails: document.getElementById("sellPropertyDetails").value.trim()
        }
      });

      msg.style.color = "green";
      msg.textContent = "Thank you! We will contact you soon";
      form.reset();
    } catch (err) {
      msg.style.color = "red";
      msg.textContent = err.message || "Failed to submit details.";
    }
  });
});

