/* =========================================================
   AETECH — SHARED LAYOUT (topbar + footer)

   Pages contain only placeholders:
     <div data-include="topbar"></div>
     <div data-include="footer"></div>

   Optional: data-variant="overlay" makes the topbar float
   transparently over the hero (used on the home page).

   Needs http(s): fetch() does not work from file://.
========================================================= */
(function () {
  "use strict";

  var BREAKPOINT = 1100; // keep in sync with the mobile header media query

  function normalise(path) {
    path = path.replace(/index\.html$/, "");
    return path.length > 1 ? path.replace(/\/$/, "") : "/";
  }

  function markCurrentPage(root) {
    var here = normalise(window.location.pathname);
    root
      .querySelectorAll(".nav-links a, .mobile-menu a")
      .forEach(function (link) {
        if (link.hash) return; // section shortcuts are not pages
        var url = new URL(link.getAttribute("href"), window.location.origin);
        if (url.origin !== window.location.origin) return;
        if (normalise(url.pathname) === here) {
          link.setAttribute("aria-current", "page");
        }
      });
  }

  function initMobileMenu(root) {
    var hamburger = root.querySelector(".hamburger");
    var menu = root.querySelector(".mobile-menu");
    if (!hamburger || !menu) return;

    function setOpen(open) {
      menu.classList.toggle("open", open);
      hamburger.classList.toggle("active", open);
      hamburger.setAttribute("aria-expanded", String(open));
      hamburger.setAttribute(
        "aria-label",
        open ? "Close navigation menu" : "Open navigation menu",
      );
    }

    hamburger.addEventListener("click", function () {
      setOpen(!menu.classList.contains("open"));
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    document.addEventListener("click", function (event) {
      if (!menu.contains(event.target) && !hamburger.contains(event.target)) {
        setOpen(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > BREAKPOINT) setOpen(false);
    });
  }

  /* ---------- Footer newsletter form ----------
     Sends the address to the company inbox through EmailJS.
     SETUP: create an EmailJS template that uses {{email}}, {{reply_to}}
     and {{subscribed_on}}, then paste its ID below. Until then the form
     falls back to opening the visitor's mail app. */
  var EMAILJS_PUBLIC_KEY = "0Cw-PT-C-N40STAPW";
  var EMAILJS_SERVICE_ID = "service_vldsewx";
  var NEWSLETTER_TEMPLATE_ID = ""; // <-- paste the newsletter template ID
  var NEWSLETTER_INBOX = "innovations.aetech@gmail.com";
  var EMAILJS_SRC =
    "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";

  function loadEmailJs() {
    if (window.emailjs) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = EMAILJS_SRC;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function initNewsletter(root) {
    var form = root.querySelector(".newsletter-form");
    if (!form) return;

    var input = form.querySelector('input[type="email"]');
    var button = form.querySelector("button");
    var status = document.createElement("p");
    status.className = "newsletter-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    form.insertAdjacentElement("afterend", status);

    function say(text, kind) {
      status.textContent = text;
      status.className = "newsletter-status" + (kind ? " " + kind : "");
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var email = input.value.trim();
      if (!input.checkValidity() || !email) {
        say("Please enter a valid email address.", "error");
        input.focus();
        return;
      }

      if (!NEWSLETTER_TEMPLATE_ID) {
        window.location.href =
          "mailto:" +
          NEWSLETTER_INBOX +
          "?subject=" +
          encodeURIComponent("Newsletter subscription") +
          "&body=" +
          encodeURIComponent("Please add me to the newsletter: " + email);
        return;
      }

      button.disabled = true;
      say("Subscribing…", "");
      loadEmailJs()
        .then(function () {
          window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
          return window.emailjs.send(
            EMAILJS_SERVICE_ID,
            NEWSLETTER_TEMPLATE_ID,
            {
              email: email,
              reply_to: email,
              subscribed_on: new Date().toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
            },
          );
        })
        .then(function () {
          form.reset();
          say("Thank you! You are now on our list.", "success");
        })
        .catch(function (err) {
          console.error("Newsletter signup failed:", err);
          say("Sorry, something went wrong. Please try again later.", "error");
        })
        .then(function () {
          button.disabled = false;
        });
    });
  }

  /* ---------- Play videos while on screen, pause when scrolled away ----------
     Videos start muted (browsers only allow muted autoplay). A video the
     visitor paused by hand stays paused until they press play again. */
  function initScrollVideos() {
    var videos = document.querySelectorAll("video");
    if (!videos.length || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var pausedByUser = new WeakSet();
    var pausedByScroll = new WeakSet();

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var video = entry.target;
          if (entry.isIntersecting) {
            if (video.paused && !video.ended && !pausedByUser.has(video)) {
              var attempt = video.play();
              if (attempt && attempt.catch) attempt.catch(function () {});
            }
          } else if (!video.paused) {
            pausedByScroll.add(video);
            video.pause();
          }
        });
      },
      { threshold: 0.5 },
    );

    videos.forEach(function (video) {
      video.addEventListener("pause", function () {
        if (pausedByScroll.has(video)) pausedByScroll.delete(video);
        else if (!video.ended) pausedByUser.add(video);
      });
      video.addEventListener("play", function () {
        pausedByUser.delete(video);
      });
      observer.observe(video);
    });
  }

  function mount(slot, html) {
    var tpl = document.createElement("template");
    tpl.innerHTML = html.trim();
    var node = tpl.content.firstElementChild;
    if (!node) return null;
    if (slot.dataset.variant === "overlay") node.classList.add("site--overlay");
    slot.replaceWith(node);
    return node;
  }

  function load(slot) {
    var name = slot.dataset.include;
    return fetch("/partials/" + name + ".html")
      .then(function (res) {
        if (!res.ok) throw new Error(res.status + " " + res.statusText);
        return res.text();
      })
      .then(function (html) {
        var node = mount(slot, html);
        if (!node) return;

        if (name === "topbar") {
          markCurrentPage(node);
          initMobileMenu(node);
        }
        if (name === "footer") {
          node.querySelectorAll("[data-year]").forEach(function (el) {
            el.textContent = new Date().getFullYear();
          });
          initNewsletter(node);
        }
      })
      .catch(function (err) {
        console.error('Could not load the "' + name + '" partial:', err);
      });
  }

  function init() {
    var slots = Array.prototype.slice.call(
      document.querySelectorAll("[data-include]"),
    );
    Promise.all(slots.map(load)).then(function () {
      initScrollVideos();
      document.dispatchEvent(new CustomEvent("layout:ready"));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
