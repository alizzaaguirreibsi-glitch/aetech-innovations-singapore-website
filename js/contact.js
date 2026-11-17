document.addEventListener("DOMContentLoaded", function () {
  // Mobile menu, topbar and footer are handled by /js/layout.js

  // =========================================================
  // EMAILJS INITIALIZATION
  // =========================================================

  if (typeof emailjs !== "undefined") {
    emailjs.init({
      publicKey: "0Cw-PT-C-N40STAPW",
    });
  } else {
    console.error("EmailJS library was not loaded.");

    return;
  }

  // =========================================================
  // CONTACT FORM
  // =========================================================

  const contactForm = document.getElementById("contact-form");

  if (!contactForm) {
    console.error("Contact form not found.");

    return;
  }

  // =========================================================
  // FORM ELEMENTS
  // =========================================================

  const submitButton = contactForm.querySelector(".contact-submit");

  const submitText = submitButton?.querySelector("span:first-child");

  const submitArrow = submitButton?.querySelector(".submit-arrow");

  const formStatus = document.getElementById("form-status");

  // =========================================================
  // FORM SUBMISSION
  // =========================================================

  contactForm.addEventListener("submit", function (event) {
    // Prevent page refresh
    event.preventDefault();

    // Prevent multiple submissions
    if (submitButton.disabled) {
      return;
    }

    // Clear previous status
    if (formStatus) {
      formStatus.textContent = "";
      formStatus.className = "form-status";
    }

    // Disable submit button
    submitButton.disabled = true;

    // Change button text
    submitText.textContent = "SENDING...";
    submitArrow.textContent = "⋯";

    // =====================================================
    // SEND FORM THROUGH EMAILJS
    // =====================================================

    emailjs
      .sendForm("service_vldsewx", "template_gcuirms", "#contact-form")

      // =====================================================
      // SUCCESS
      // =====================================================

      .then(function (response) {
        console.log("Email sent successfully!", response.status, response.text);

        // Update button
        submitText.textContent = "SENT SUCCESSFULLY";
        submitArrow.textContent = "✓";

        // Show success message
        if (formStatus) {
          formStatus.textContent =
            "Thank you! Your inquiry has been sent successfully.";

          formStatus.classList.add("success");
        }

        // Reset form
        contactForm.reset();

        // Return button to normal
        setTimeout(function () {
          submitText.textContent = "SEND INQUIRY";
          submitArrow.textContent = "→";

          submitButton.disabled = false;

          if (formStatus) {
            formStatus.textContent = "";
            formStatus.className = "form-status";
          }
        }, 3000);
      })

      // =====================================================
      // ERROR
      // =====================================================

      .catch(function (error) {
        console.error("EmailJS failed:", error);

        // Update button
        submitText.textContent = "TRY AGAIN";
        submitArrow.textContent = "×";

        // Show error message
        if (formStatus) {
          formStatus.textContent = "Something went wrong. Please try again.";

          formStatus.classList.add("error");
        }

        // Enable button again
        submitButton.disabled = false;
      });
  });
});
