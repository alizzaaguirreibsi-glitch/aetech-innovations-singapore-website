/* =========================================================
   ASIAN ALLIANCE FORM
   Validates the form, then sends it to the company inbox
   through EmailJS.

   SETUP: paste your alliance template ID below.
   (Service ID and public key are the same ones contact.js uses.)
========================================================= */

const EMAILJS_PUBLIC_KEY = "0Cw-PT-C-N40STAPW";
const EMAILJS_SERVICE_ID = "service_vldsewx";
const EMAILJS_TEMPLATE_ID = "template_wmu63jc"; // <-- replace this

const FALLBACK_EMAIL = "innovations.aetech@gmail.com";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("alliance-form");
  if (!form) return;

  const submitBtn = document.getElementById("submit-btn");
  const submitLabel = submitBtn.querySelector(".submit-label");
  const statusEl = document.getElementById("form-status");
  const successEl = document.getElementById("success");
  const card = document.getElementById("join-form");
  const successText = document.getElementById("success-text");
  const otherBox = document.getElementById("area-other");
  const otherField = document.getElementById("other-field");
  const otherInput = document.getElementById("area-other-text");

  /* ---------- EmailJS ---------- */

  const emailReady = typeof emailjs !== "undefined";
  if (emailReady) {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  } else {
    console.error("EmailJS library was not loaded.");
  }

  /* ---------- Today's date in the record note ---------- */

  const today = new Date();
  const todayText = today.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const todayEl = document.getElementById("today");
  if (todayEl) {
    todayEl.dateTime = today.toISOString().slice(0, 10);
    todayEl.textContent = todayText;
  }

  /* ---------- "Other" reveals its text box ---------- */

  otherBox.addEventListener("change", function () {
    otherField.hidden = !otherBox.checked;
    if (otherBox.checked) {
      otherInput.focus();
    } else {
      otherInput.value = "";
    }
  });

  /* ---------- Validation ---------- */

  const rules = [
    { id: "full-name", message: "Please enter your full name." },
    { id: "position", message: "Please enter your position or title." },
    { id: "organization", message: "Please enter your organization." },
    { id: "country", message: "Please enter your country or territory." },
    {
      id: "email",
      message: "Please enter a valid email address.",
      test: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      },
    },
    {
      id: "phone",
      message: "Please enter a valid phone or WhatsApp number.",
      test: function (v) {
        return /^[+()\d\s.-]{7,}$/.test(v) && v.replace(/\D/g, "").length >= 7;
      },
    },
  ];

  function isValid(rule, value) {
    return rule.test ? rule.test(value) : value.length > 0;
  }

  function setError(input, message) {
    const field = input.closest(".field");
    const errorEl = document.getElementById(input.id + "-error");
    if (field) field.classList.toggle("invalid", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (errorEl) errorEl.textContent = message || "";
  }

  function validate() {
    let firstInvalid = null;

    rules.forEach(function (rule) {
      const input = document.getElementById(rule.id);
      const ok = isValid(rule, input.value.trim());
      setError(input, ok ? "" : rule.message);
      if (!ok && !firstInvalid) firstInvalid = input;
    });

    const consent = document.getElementById("consent");
    const consentError = document.getElementById("consent-error");
    consentError.textContent = consent.checked
      ? ""
      : "Please tick the box so we can contact you.";
    if (!consent.checked && !firstInvalid) firstInvalid = consent;

    return firstInvalid;
  }

  // clear an error as soon as the person fixes it
  rules.forEach(function (rule) {
    const input = document.getElementById(rule.id);
    input.addEventListener("input", function () {
      if (
        input.closest(".field").classList.contains("invalid") &&
        isValid(rule, input.value.trim())
      ) {
        setError(input, "");
      }
    });
  });

  document.getElementById("consent").addEventListener("change", function (e) {
    if (e.target.checked) {
      document.getElementById("consent-error").textContent = "";
    }
  });

  /* ---------- Helpers ---------- */

  function checkedValues(name) {
    return Array.from(
      form.querySelectorAll('input[name="' + name + '"]:checked'),
    ).map(function (el) {
      return el.value;
    });
  }

  function asList(items, emptyText) {
    return items.length
      ? items
          .map(function (item) {
            return "\u2022 " + item;
          })
          .join("\n")
      : emptyText;
  }

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.classList.toggle("error-state", Boolean(isError));
  }

  function setSending(isSending) {
    submitBtn.disabled = isSending;
    submitBtn.classList.toggle("sending", isSending);
    submitLabel.textContent = isSending ? "Sending" : "Submit my interest";
  }

  function showSuccess(name) {
    const firstName = name.split(" ")[0];
    successText.textContent =
      "We have received your expression of interest, " +
      firstName +
      ". A member of the AETECH team will be in touch about the alliance soon.";
    // keep the card the same height so the left side stays balanced
    card.style.setProperty("--card-h", card.offsetHeight + "px");
    card.classList.add("is-done");
    form.hidden = true;
    successEl.hidden = false;
    successEl.focus();
  }

  /* ---------- Submit ---------- */

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (submitBtn.disabled) return;

    setStatus("", false);

    const firstInvalid = validate();
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    // honeypot: a real person never fills this, so pretend it worked
    if (document.getElementById("website").value.trim() !== "") {
      showSuccess("friend");
      return;
    }

    if (!emailReady) {
      setStatus(
        "Sorry, the form could not load. Please email us at " +
          FALLBACK_EMAIL +
          ".",
        true,
      );
      return;
    }

    const otherText = otherInput.value.trim();
    const areas = checkedValues("areas").map(function (a) {
      return a === "Other" && otherText ? "Other: " + otherText : a;
    });

    const fullName = document.getElementById("full-name").value.trim();
    const email = document.getElementById("email").value.trim();

    // names here must match the {{variables}} in the EmailJS template
    const params = {
      full_name: fullName,
      position: document.getElementById("position").value.trim(),
      organization: document.getElementById("organization").value.trim(),
      country: document.getElementById("country").value.trim(),
      email: email,
      reply_to: email,
      phone: document.getElementById("phone").value.trim(),
      areas: asList(areas, "None selected"),
      preferences: asList(checkedValues("preferences"), "None selected"),
      consent: "Yes",
      submitted_on: todayText,
    };

    setSending(true);

    emailjs
      .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params)
      .then(function () {
        showSuccess(fullName);
      })
      .catch(function (error) {
        console.error("EmailJS failed:", error);
        setSending(false);
        setStatus(
          "Something went wrong and your form was not sent. Please try again, or email us at " +
            FALLBACK_EMAIL +
            ".",
          true,
        );
      });
  });
});
