/* SCSE 2027 page: countdown, gallery (marquee + photo viewer), dark logo */
(function () {
  "use strict";

  /* ---------------------------------------------------------------
     Countdown to opening day (Taipei time).
     Adjust once the opening time is confirmed.
     --------------------------------------------------------------- */
  var OPENS = new Date("2027-03-16T00:00:00+08:00").getTime();
  var ENDS = new Date("2027-03-19T23:59:59+08:00").getTime();
  var box = document.getElementById("countdown");

  function tick() {
    if (!box) return;
    var now = Date.now();
    if (now >= OPENS) {
      box.innerHTML =
        '<span class="scse-ended">' +
        (now <= ENDS ? "SCSE 2027 is on now" : "SCSE 2027 has ended") +
        "</span>";
      return;
    }
    var s = Math.floor((OPENS - now) / 1000);
    var v = {
      d: Math.floor(s / 86400),
      h: Math.floor((s % 86400) / 3600),
      m: Math.floor((s % 3600) / 60),
    };
    Object.keys(v).forEach(function (k) {
      var el = box.querySelector('[data-u="' + k + '"]');
      if (el) el.textContent = v[k];
    });
  }
  tick();
  setInterval(tick, 30000);

  /* ---------------------------------------------------------------
     Gallery: endless marquee that glides left at a constant speed,
     pauses on hover, has arrows, and opens a photo viewer on click.
     --------------------------------------------------------------- */
  var SPEED = 60; /* pixels per second: higher is faster */
  var ARROW_MS = 650; /* how long an arrow press takes to glide one photo */

  /* Set to true to stop the strip moving by itself for people whose system
     asks for reduced motion (they can still use the arrows and the viewer). */
  var RESPECT_REDUCED_MOTION = false;

  var root = document.getElementById("gallery-widget");
  var lb = document.getElementById("gal-lightbox");
  if (root && lb) initGallery(root, lb);

  function initGallery(root, lb) {
    var viewport = root.querySelector(".gal-viewport");
    var track = root.querySelector(".gal-track");
    var group = track.querySelector(".gal-group");
    var cards = Array.prototype.slice.call(group.children);

    /* 1. Read the photos once, before any cloning */
    var photos = cards.map(function (li, i) {
      var img = li.querySelector("img");
      li.setAttribute("data-i", i);
      li.querySelector(".gal-open").setAttribute(
        "aria-label",
        "Enlarge photo: " + img.alt,
      );
      return { src: img.getAttribute("src"), alt: img.alt };
    });

    /* 2. Build the loop: enough cards to cover the screen, then an identical twin set.
       The strip moves exactly one set's width, then wraps invisibly. */
    function hideFromAssistiveTech(el) {
      el.setAttribute("aria-hidden", "true");
      Array.prototype.forEach.call(el.querySelectorAll("button"), function (b) {
        b.tabIndex = -1;
      });
    }
    var step = 0; /* distance from one card to the next */
    var loopWidth = 0; /* width of one set */

    function measure() {
      loopWidth = group.offsetWidth;
      step =
        cards.length > 1
          ? cards[1].offsetLeft - cards[0].offsetLeft
          : loopWidth;
    }
    measure();
    var minWidth = Math.max(window.screen.width, window.innerWidth) + step;
    while (group.offsetWidth < minWidth) {
      cards.forEach(function (c) {
        var copy = c.cloneNode(true);
        hideFromAssistiveTech(copy);
        group.appendChild(copy);
      });
    }
    var twin = group.cloneNode(true);
    hideFromAssistiveTech(twin);
    track.appendChild(twin);
    measure();

    /* 3. Motion */
    var x = 0; /* distance travelled; the strip shows x modulo loopWidth */
    var tween = null; /* an arrow glide in progress */
    var last = null;
    var hovering = false;
    var focused = false; /* keyboard focus inside the strip */
    var viewing = false; /* photo viewer open */
    var onScreen = true;
    var reduceMotion =
      RESPECT_REDUCED_MOTION &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function render() {
      var shift = ((x % loopWidth) + loopWidth) % loopWidth;
      track.style.transform = "translate3d(" + -shift + "px,0,0)";
    }

    function frame(now) {
      if (last !== null) {
        var dt = Math.min(
          (now - last) / 1000,
          0.05,
        ); /* ignore long pauses (background tab) */
        if (tween) {
          var p = Math.min((now - tween.t0) / ARROW_MS, 1);
          x = tween.from + (tween.to - tween.from) * (1 - Math.pow(1 - p, 3));
          if (p === 1) tween = null;
        } else if (
          !hovering &&
          !focused &&
          !viewing &&
          onScreen &&
          !reduceMotion
        ) {
          x += SPEED * dt;
        }
        render();
      }
      last = now;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    function nudge(dir) {
      var target = tween ? tween.to : x; /* repeated presses queue up */
      tween = { from: x, to: target + dir * step, t0: performance.now() };
    }
    root.querySelector(".gal-prev").addEventListener("click", function () {
      nudge(-1);
    });
    root.querySelector(".gal-next").addEventListener("click", function () {
      nudge(1);
    });

    /* pause while the mouse is over the strip or keyboard focus is inside it */
    viewport.addEventListener("pointerenter", function (e) {
      if (e.pointerType === "mouse") hovering = true;
    });
    viewport.addEventListener("pointerleave", function (e) {
      if (e.pointerType === "mouse") hovering = false;
    });
    root.addEventListener("focusin", function (e) {
      focused = !!(e.target.matches && e.target.matches(":focus-visible"));
    });
    root.addEventListener("focusout", function () {
      focused = false;
    });

    /* no point animating while scrolled out of view */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
      }).observe(root);
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 150);
    });

    /* 4. Photo viewer */
    var img = lb.querySelector(".lb-img");
    var frameEl = lb.querySelector(".lb-frame");
    var count = lb.querySelector(".lb-count");
    var text = lb.querySelector(".lb-text");
    var current = 0;
    var opener = null;
    var zoomed = false;
    var swipeStart = null;
    var swiped = false;

    function setZoom(on, e) {
      zoomed = on;
      lb.classList.toggle("is-zoomed", on);
      if (on && e) moveZoom(e);
    }
    function moveZoom(e) {
      var r = frameEl.getBoundingClientRect();
      img.style.setProperty(
        "--ox",
        ((e.clientX - r.left) / r.width) * 100 + "%",
      );
      img.style.setProperty(
        "--oy",
        ((e.clientY - r.top) / r.height) * 100 + "%",
      );
    }

    function show(i) {
      var n = photos.length;
      current = ((i % n) + n) % n;
      img.src = photos[current].src;
      img.alt = photos[current].alt;
      count.textContent = current + 1 + " / " + n;
      text.textContent = photos[current].alt;
      setZoom(false);
      /* warm the cache for the neighbours */
      [current - 1, current + 1].forEach(function (k) {
        new Image().src = photos[((k % n) + n) % n].src;
      });
    }

    function openViewer(i, from) {
      opener = from;
      show(i);
      lb.showModal();
      document.documentElement.classList.add("is-locked");
      viewing = true;
    }

    lb.addEventListener("close", function () {
      document.documentElement.classList.remove("is-locked");
      viewing = false;
      setZoom(false);
      if (opener) opener.focus({ preventScroll: true });
    });

    viewport.addEventListener("click", function (e) {
      var card = e.target.closest(".gal-card");
      if (card) {
        openViewer(
          +card.getAttribute("data-i"),
          card.querySelector(".gal-open"),
        );
      }
    });

    lb.querySelector(".lb-close").addEventListener("click", function () {
      lb.close();
    });
    lb.querySelector(".lb-prev").addEventListener("click", function () {
      show(current - 1);
    });
    lb.querySelector(".lb-next").addEventListener("click", function () {
      show(current + 1);
    });

    /* click the photo to zoom in; move the pointer to look around; click again to zoom out */
    img.addEventListener("click", function (e) {
      if (swiped) return;
      setZoom(!zoomed, e);
    });
    img.addEventListener("pointermove", function (e) {
      if (zoomed) moveZoom(e);
    });

    /* swipe to change photo (when not zoomed) */
    frameEl.addEventListener("pointerdown", function (e) {
      swipeStart = e.clientX;
      swiped = false;
    });
    frameEl.addEventListener("pointerup", function (e) {
      if (swipeStart === null || zoomed) {
        swipeStart = null;
        return;
      }
      var dx = e.clientX - swipeStart;
      swipeStart = null;
      if (Math.abs(dx) > 60) {
        swiped = true;
        show(current + (dx < 0 ? 1 : -1));
      }
    });
    frameEl.addEventListener("pointercancel", function () {
      swipeStart = null;
    });

    /* click the dark area around the photo to close */
    lb.addEventListener("click", function (e) {
      if (e.target === lb) lb.close();
    });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });
  }

  /* ---------------------------------------------------------------
   Programme tabs. Paste inside the IIFE in scse-2027.js, above the
   "Light page + transparent header" block.
   Click or use arrow keys / Home / End to switch.
   --------------------------------------------------------------- */
  (function initProgrammeTabs() {
    var root = document.querySelector("[data-tabs]");
    if (!root) return;
    var tabs = Array.prototype.slice.call(
      root.querySelectorAll('[role="tab"]'),
    );

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        document
          .getElementById(t.getAttribute("aria-controls"))
          .classList.toggle("is-active", on);
      });
      if (focus) tab.focus();
      /* keep the chosen pill in view on phones */
      if (tab.scrollIntoView)
        tab.scrollIntoView({ block: "nearest", inline: "nearest" });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        select(tab, false);
      });
      tab.addEventListener("keydown", function (e) {
        var n = tabs.length;
        var next = null;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (i + 1) % n;
        else if (e.key === "ArrowUp" || e.key === "ArrowLeft")
          next = (i - 1 + n) % n;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = n - 1;
        if (next !== null) {
          e.preventDefault();
          select(tabs[next], true);
        }
      });
    });
  })();

  /* ---------------------------------------------------------------
     Light page + transparent header: use the dark-text logo once the
     header has loaded
     --------------------------------------------------------------- */
  document.addEventListener("layout:ready", function () {
    var logo = document.querySelector(".site .logo img");
    if (logo) logo.src = "/assets/aetech-logo.png";
  });
})();
