const eventCards = document.querySelectorAll(".event-card");
const dots = document.querySelectorAll(".event-dot");

const prevButton = document.getElementById("eventPrev");
const nextButton = document.getElementById("eventNext");

let currentEvent = 1;

function updateCarousel() {
  eventCards.forEach((card, index) => {
    card.classList.remove("event-left", "event-center", "event-right");

    let position =
      (index - currentEvent + eventCards.length) % eventCards.length;

    if (position === 0) {
      card.classList.add("event-center");
    } else if (position === 1) {
      card.classList.add("event-right");
    } else {
      card.classList.add("event-left");
    }
  });

  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index === currentEvent);
  });
}

if (nextButton) {
  nextButton.addEventListener("click", () => {
    currentEvent++;

    if (currentEvent >= eventCards.length) {
      currentEvent = 0;
    }

    updateCarousel();
  });
}

if (prevButton) {
  prevButton.addEventListener("click", () => {
    currentEvent--;

    if (currentEvent < 0) {
      currentEvent = eventCards.length - 1;
    }

    updateCarousel();
  });
}

dots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    currentEvent = index;
    updateCarousel();
  });
});

updateCarousel();

/* =========================================
   EVENT IMAGE LIGHTBOX
========================================= */

const lightbox = document.getElementById("imageLightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxClose = document.getElementById("lightboxClose");

const eventImages = document.querySelectorAll(".event-image img");

/* OPEN IMAGE */
eventImages.forEach((image) => {
  image.addEventListener("click", (event) => {
    event.stopPropagation();

    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;

    lightbox.classList.add("active");

    document.body.style.overflow = "hidden";
  });
});

/* CLOSE LIGHTBOX */
function closeLightbox() {
  lightbox.classList.remove("active");

  document.body.style.overflow = "";
}

/* CLOSE BUTTON */
lightboxClose.addEventListener("click", (event) => {
  event.stopPropagation();

  closeLightbox();
});

/* CLICK OUTSIDE IMAGE */
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

/* ESC KEY */
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox.classList.contains("active")) {
    closeLightbox();
  }
});

/* Mobile menu, topbar and footer are handled by /js/layout.js */

/* ========================================
   SCROLL REVEAL ANIMATION
======================================== */

document.addEventListener("DOMContentLoaded", () => {
  const revealElements = document.querySelectorAll("[data-reveal]");

  // Show everything immediately if reduced motion is preferred
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px",
    },
  );

  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });
});

/* =========================================
   HERO VIDEO: force autoplay on mobile
========================================= */
(function () {
  const heroVideo = document.querySelector(".hero-video");
  if (!heroVideo) return;

  // Set as properties too: some mobile browsers ignore the HTML attributes
  heroVideo.muted = true;
  heroVideo.defaultMuted = true;
  heroVideo.loop = true;
  heroVideo.playsInline = true;
  heroVideo.setAttribute("webkit-playsinline", "");

  const tryPlay = () => {
    const p = heroVideo.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        // Autoplay blocked: retry on the first user interaction
        const resume = () => {
          heroVideo.play().catch(() => {});
          ["touchstart", "click", "scroll"].forEach((evt) =>
            window.removeEventListener(evt, resume),
          );
        };
        ["touchstart", "click", "scroll"].forEach((evt) =>
          window.addEventListener(evt, resume, { once: true, passive: true }),
        );
      });
    }
  };

  if (heroVideo.readyState >= 2) tryPlay();
  else heroVideo.addEventListener("loadeddata", tryPlay, { once: true });

  // Resume when the tab/app comes back or the video scrolls into view
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && heroVideo.paused) tryPlay();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && heroVideo.paused) tryPlay();
      });
    }).observe(heroVideo);
  }
})();
