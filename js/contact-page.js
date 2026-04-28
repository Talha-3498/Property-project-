/* global API */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const msg = document.getElementById("contactFormMessage");
  const captcha = document.getElementById("contactCaptcha");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!msg) return;

    if (captcha && !captcha.checked) {
      msg.style.color = "red";
      msg.textContent = "Please confirm you are not a robot.";
      return;
    }

    msg.style.color = "";
    msg.textContent = "Sending...";

    try {
      await API.request("/api/contact", {
        method: "POST",
        body: {
          firstName: document.getElementById("contactFirstName").value.trim(),
          lastName: document.getElementById("contactLastName").value.trim(),
          email: document.getElementById("contactEmail").value.trim(),
          phone: document.getElementById("contactPhone").value.trim(),
          message: document.getElementById("contactMessage").value.trim()
        }
      });
      msg.style.color = "green";
      msg.textContent = "Thank you! Your message has been sent. We will get back to you soon.";
      form.reset();
      if (captcha) {
        captcha.checked = false;
        captcha.removeAttribute("disabled");
      }
    } catch (err) {
      msg.style.color = "red";
      msg.textContent = err.message || "Could not send message. Please try again.";
    }
  });
});
