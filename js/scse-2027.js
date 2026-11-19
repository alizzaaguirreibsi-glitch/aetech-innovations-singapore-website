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
   Entrance animations. Paste inside the IIFE in scse-2027.js, above
   the "Light page + transparent header" block.
   Adds .is-in to each section when it scrolls into view, and counts
   up the numbers in the Scale sentence.
   --------------------------------------------------------------- */
  (function initEntrance() {
    if (
      window.matchMedia &&
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    document.documentElement.classList.add("anim");

    function countUp(section) {
      var nums = section.querySelectorAll(".scse-scale b");
      Array.prototype.forEach.call(nums, function (b) {
        var m = b.textContent.match(/^([\d,]+)(.*)$/);
        if (!m) return;
        var finalText = b.textContent;
        var target = parseInt(m[1].replace(/,/g, ""), 10);
        var suffix = m[2];

        /* lock the final width so the sentence never reflows while counting */
        b.style.display = "inline-block";
        b.style.minWidth = b.getBoundingClientRect().width + "px";
        b.textContent = "0" + suffix;

        var DURATION = 1400;
        var DELAY = 250;
        var start = null;
        function step(now) {
          if (start === null) start = now;
          var p = Math.min((now - start) / DURATION, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          b.textContent =
            Math.round(target * eased).toLocaleString("en-US") + suffix;
          if (p < 1) requestAnimationFrame(step);
          else b.textContent = finalText;
        }
        setTimeout(function () {
          requestAnimationFrame(step);
        }, DELAY);
      });
    }

    var sections = document.querySelectorAll(
      ".scse-scale-sec, #theme, #gallery, #programme, #visit",
    );

    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(sections, function (s) {
        s.classList.add("is-in");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          if (e.target.classList.contains("scse-scale-sec")) countUp(e.target);
          io.unobserve(e.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
    );

    Array.prototype.forEach.call(sections, function (s) {
      io.observe(s);
    });
  })();

  /* ---------------------------------------------------------------
   Hero 3D globe: drag to rotate, arrow keys when focused.
   Paste inside the IIFE in scse-2027.js, above the "Light page +
   transparent header" block (this replaces initCity).
   The globe itself is pure CSS; this only changes two numbers:
   --rx (tilt) and --ry (turn).
   --------------------------------------------------------------- */
  (function initGlobe() {
    var box = document.getElementById("asean-map");
    if (!box) return;

    /* Rough land shapes [lon, lat]. Stylised on purpose. */
    var LAND = [
      [
        [92.2, 21],
        [94, 24.5],
        [97.5, 28],
        [98.7, 24],
        [101, 21.5],
        [102, 22.4],
        [105.5, 23],
        [108, 21.5],
        [106.5, 19.5],
        [105.5, 17.5],
        [108.5, 15.5],
        [109.3, 12],
        [107, 10.3],
        [105, 8.6],
        [104.8, 10.5],
        [103, 10.6],
        [101, 12.6],
        [100, 13.5],
        [99.2, 10.5],
        [100.3, 8],
        [101.5, 6.5],
        [103.5, 5],
        [103.5, 2.5],
        [104.2, 1.4],
        [103.3, 1.3],
        [101.3, 3],
        [100.3, 5.5],
        [98.3, 8],
        [98.5, 11],
        [97.8, 16],
        [95.3, 15.8],
        [94.2, 18.3],
      ],
      [
        [95.3, 5.6],
        [97.5, 5.2],
        [100.5, 2],
        [103.8, -1],
        [106, -3],
        [105.8, -5.8],
        [104.5, -5.8],
        [102, -4],
        [99.5, -1.5],
        [97, 2],
      ],
      [
        [105.2, -6.8],
        [108, -6.3],
        [111, -6.6],
        [114.4, -7.8],
        [114.4, -8.7],
        [110, -8.2],
        [106, -7.5],
      ],
      [
        [109, 1.5],
        [110, 1.8],
        [111.5, 2.5],
        [113.5, 3.2],
        [115.5, 5],
        [117, 7],
        [119, 5.2],
        [118, 2.5],
        [117.8, 0.8],
        [116.5, -1.5],
        [116.2, -3.8],
        [114.5, -4],
        [112, -3.3],
        [110.2, -2.8],
        [109, -0.5],
      ],
      [
        [119.5, 0.8],
        [121, 1.3],
        [124.8, 1.2],
        [123, 0.3],
        [121.5, 0.5],
        [121, -1],
        [123.2, -1.5],
        [121.8, -3],
        [122.2, -4.8],
        [121, -3.8],
        [120.3, -5.5],
        [119.3, -5.4],
        [119.5, -3],
        [118.8, -2.5],
      ],
      [
        [120.3, 18.5],
        [122.2, 18.5],
        [122.3, 16.5],
        [121.6, 15.2],
        [122, 14],
        [124, 13.2],
        [123.5, 12.7],
        [121, 13.7],
        [120.6, 14.4],
        [120.2, 16.3],
      ],
      [
        [122, 11.5],
        [123.2, 11.5],
        [125, 11.2],
        [125.6, 10],
        [124.5, 10],
        [123, 9.5],
        [122, 10.2],
      ],
      [
        [122, 7.5],
        [123.5, 8.6],
        [125.5, 9.8],
        [126.5, 8],
        [126, 6.5],
        [125.2, 5.8],
        [124, 6.8],
        [123, 7],
      ],
      [
        [117.2, 8.4],
        [119.5, 11.2],
        [119.8, 10.5],
        [118, 8.2],
      ],
      [
        [124.1, -9.2],
        [125.2, -9.45],
        [127.3, -8.4],
        [125.9, -8.1],
      ],
      [
        [120.1, 23],
        [120.7, 24.8],
        [121.6, 25.3],
        [122, 24.8],
        [121.5, 22.8],
        [120.8, 21.9],
      ],
    ];

    /* hub = permanent label, c = pin colour */
    var PINS = [
      {
        id: "tpe",
        name: "Taipei · SCSE 2027",
        lon: 121.6,
        lat: 25,
        c: "var(--purple)",
        hub: 1,
      },
      {
        id: "sg",
        name: "Singapore · AETECH",
        lon: 103.8,
        lat: 1.4,
        c: "var(--cyan)",
        hub: 1,
      },
      {
        id: "ph",
        name: "Philippines",
        short: "Philippines",
        lon: 120.6,
        lat: 15.2,
        c: "var(--green)",
        hub: 1,
      },
      { id: "bn", name: "Brunei", lon: 114.94, lat: 4.89 },
      { id: "kh", name: "Cambodia", lon: 104.92, lat: 11.56 },
      { id: "id", name: "Indonesia", lon: 106.85, lat: -6.2 },
      { id: "la", name: "Laos", lon: 102.6, lat: 17.97 },
      { id: "my", name: "Malaysia", lon: 101.69, lat: 3.14 },
      { id: "mm", name: "Myanmar", lon: 96.08, lat: 19.76 },
      { id: "th", name: "Thailand", lon: 100.5, lat: 13.75 },
      { id: "vn", name: "Vietnam", lon: 105.85, lat: 21.03 },
      { id: "tl", name: "Timor-Leste", lon: 125.57, lat: -8.56 },
    ];
    var DEFAULT = "ASEAN · 11 member states, one summit";

    function inside(x, y, poly) {
      var c = false;
      for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        var xi = poly[i][0],
          yi = poly[i][1],
          xj = poly[j][0],
          yj = poly[j][1];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
          c = !c;
      }
      return c;
    }

    var html =
      '<i class="globe-body"></i><div class="globe-tilt"><div class="globe-spin">';

    /* meridians and parallels */
    for (var a = 0; a < 180; a += 30)
      html += '<i class="globe-mer" style="--a:' + a + 'deg"></i>';
    [
      [0, 1, " eq"],
      [0.5, 0.866, ""],
      [-0.5, 0.866, ""],
      [0.866, 0.5, ""],
      [-0.866, 0.5, ""],
    ].forEach(function (p) {
      html +=
        '<i class="globe-par' +
        p[2] +
        '" style="--s:' +
        p[0] +
        ";--c:" +
        p[1] +
        '"></i>';
    });

    /* land dots, placed on the sphere by longitude and latitude */
    var STEP = 1.3,
      row = 0;
    for (var lat = 28; lat > -11; lat -= STEP, row++) {
      for (var lon = 92 + (row % 2 ? STEP / 2 : 0); lon < 128; lon += STEP) {
        for (var k = 0; k < LAND.length; k++) {
          if (inside(lon, lat, LAND[k])) {
            html +=
              '<i class="ld" style="--lon:' +
              lon.toFixed(1) +
              "deg;--lat:" +
              lat.toFixed(1) +
              'deg"></i>';
            break;
          }
        }
      }
    }

    /* pins */
    PINS.forEach(function (p, i) {
      html +=
        '<div class="pin' +
        (p.hub ? " hub" : " sm") +
        '" data-id="' +
        p.id +
        '" style="--lon:' +
        p.lon +
        "deg;--lat:" +
        p.lat +
        "deg;--pc:" +
        (p.c || "var(--ink)") +
        ";--dl:" +
        i * 0.4 +
        's"><i class="ring"></i><i class="dot"></i><span class="lab">' +
        (p.short || p.name) +
        "</span></div>";
    });

    html +=
      '</div><i class="globe-orbit"></i><i class="globe-orbit o2"></i></div>' +
      '<p class="globe-hint">' +
      DEFAULT +
      "</p>";

    box.innerHTML = html;
    box.setAttribute("tabindex", "0");
    box.setAttribute("role", "img");
    box.setAttribute(
      "aria-label",
      "Interactive 3D globe centred on ASEAN, with pins on the 11 member states plus Taipei, Singapore and Pampanga. Drag to rotate.",
    );

    var tilt = box.querySelector(".globe-tilt");
    var hint = box.querySelector(".globe-hint");
    var pinEls = Array.prototype.slice.call(box.querySelectorAll(".pin"));

    /* ---- spotlight: cycles through the member states ---- */
    function setOn(id) {
      pinEls.forEach(function (el) {
        el.classList.toggle("is-on", el.getAttribute("data-id") === id);
      });
      var p = PINS.filter(function (x) {
        return x.id === id;
      })[0];
      hint.textContent = p ? p.name : DEFAULT;
    }
    var idx = 3,
      paused = false;
    var reduce =
      window.matchMedia &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      setInterval(function () {
        if (paused) return;
        setOn(PINS[idx].id);
        idx = idx + 1 >= PINS.length ? 3 : idx + 1;
      }, 2200);
    }
    box.addEventListener("pointerenter", function (e) {
      if (e.pointerType === "mouse") paused = true;
    });
    box.addEventListener("pointerleave", function () {
      paused = false;
    });

    /* ---- drag to rotate, arrow keys when focused ---- */
    var rx = -8,
      ry = -112,
      down = false,
      lx = 0,
      ly = 0;
    function apply() {
      tilt.style.setProperty("--rx", rx + "deg");
      tilt.style.setProperty("--ry", ry + "deg");
    }
    function clampTilt() {
      rx = Math.max(-60, Math.min(25, rx));
    }

    box.addEventListener("pointerdown", function (e) {
      down = true;
      lx = e.clientX;
      ly = e.clientY;
      box.classList.add("is-drag");
      box.setPointerCapture(e.pointerId);
    });
    box.addEventListener("pointermove", function (e) {
      if (!down) return;
      ry += (e.clientX - lx) * 0.4;
      rx -= (e.clientY - ly) * 0.25;
      clampTilt();
      lx = e.clientX;
      ly = e.clientY;
      apply();
    });
    function end() {
      down = false;
      box.classList.remove("is-drag");
    }
    box.addEventListener("pointerup", end);
    box.addEventListener("pointercancel", end);

    box.addEventListener("keydown", function (e) {
      var used = true;
      if (e.key === "ArrowLeft") ry -= 15;
      else if (e.key === "ArrowRight") ry += 15;
      else if (e.key === "ArrowUp") rx += 6;
      else if (e.key === "ArrowDown") rx -= 6;
      else used = false;
      if (used) {
        e.preventDefault();
        clampTilt();
        apply();
      }
    });

    apply();
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
