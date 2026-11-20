document.addEventListener("DOMContentLoaded", function () {
  /* =====================================================
       HERO VIDEO PREVIEW — scroll to video & autoplay
    ====================================================== */

  const heroPreview = document.getElementById("hero-video-preview");

  if (heroPreview) {
    function activateHeroVideo() {
      // Target: the first custom-video-player section in the page
      const targetSection = document.getElementById("featured-product");
      const targetVideo = targetSection
        ? targetSection.querySelector(".custom-video")
        : null;

      if (targetSection) {
        // Scroll to the section smoothly
        targetSection.scrollIntoView({ behavior: "smooth", block: "start" });

        // After scroll settles, play the video and trigger the play-pause button UI
        setTimeout(function () {
          if (targetVideo && targetVideo.paused) {
            targetVideo.muted = false; // unmute for intentional play

            const playPauseBtn = targetSection.querySelector(".play-pause");

            targetVideo.play().then(function () {
              if (playPauseBtn) {
                // Sync the button icon state
                playPauseBtn.classList.remove("paused");
                playPauseBtn.setAttribute("aria-label", "Pause video");

                const icon = playPauseBtn.querySelector(".play-icon");
                const pauseIcon = playPauseBtn.querySelector(".pause-icon");

                if (icon) icon.style.display = "none";
                if (pauseIcon) pauseIcon.style.display = "";
              }
            }).catch(function () {
              // Autoplay blocked — keep muted and try again
              targetVideo.muted = true;
              targetVideo.play().catch(function () {});
            });
          }
        }, 700);
      }
    }

    heroPreview.addEventListener("click", activateHeroVideo);

    // Keyboard: Enter or Space
    heroPreview.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activateHeroVideo();
      }
    });
  }

  /* =====================================================
       WHAT WE DO — IMAGE SHOWCASE
       Click (or use arrow keys on) an image to make it the large
       one, in place; its description fades in on the right.
    ====================================================== */

  const showcase = document.getElementById("service-showcase");

  if (showcase) {
    const thumbs = Array.from(showcase.querySelectorAll(".service-thumb"));
    const panels = Array.from(showcase.querySelectorAll(".service-detail"));

    const stage = showcase.querySelector(".service-stage");

    function setActive(index, moveFocus) {
      /* Images keep their order; the active one is marked "main" and CSS
         grows it in place (the stage's data-active picks the layout). */
      stage.dataset.active = index;

      thumbs.forEach(function (thumb, i) {
        const isActive = i === index;

        thumb.dataset.slot = isActive ? "main" : "small";
        thumb.setAttribute("aria-selected", String(isActive));
        thumb.tabIndex = isActive ? 0 : -1;
      });

      panels.forEach(function (panel, i) {
        panel.classList.toggle("is-active", i === index);
      });

      if (moveFocus) thumbs[index].focus();
    }

    thumbs.forEach(function (thumb, i) {
      thumb.addEventListener("click", function () {
        setActive(i, false);
      });

      thumb.addEventListener("keydown", function (e) {
        let next = null;

        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          next = (i + 1) % thumbs.length;
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          next = (i - 1 + thumbs.length) % thumbs.length;
        } else if (e.key === "Home") {
          next = 0;
        } else if (e.key === "End") {
          next = thumbs.length - 1;
        }

        if (next !== null) {
          e.preventDefault();
          setActive(next, true);
        }
      });
    });

    setActive(0, false);
  }

  /* Mobile menu, topbar and footer are handled by /js/layout.js */

  /* =====================================================
       FEATURED PRODUCT VIDEO CONTROLS
    ====================================================== */

  const featuredVideo = document.getElementById("featuredProductVideo");

  const videoPlayPause = document.getElementById("videoPlayPause");

  const videoBackward = document.getElementById("videoBackward");

  const videoForward = document.getElementById("videoForward");

  const videoFullscreen = document.getElementById("videoFullscreen");

  const videoProgressBar = document.getElementById("videoProgressBar");

  const videoProgressContainer = document.querySelector(
    ".video-progress-container",
  );

  if (featuredVideo) {
    /* =================================================
           PLAY / PAUSE
        ================================================== */

    if (videoPlayPause) {
      videoPlayPause.addEventListener("click", function () {
        if (featuredVideo.paused) {
          featuredVideo.play();

          videoPlayPause.textContent = "❚❚";

          videoPlayPause.setAttribute("aria-label", "Pause video");
        } else {
          featuredVideo.pause();

          videoPlayPause.textContent = "▶";

          videoPlayPause.setAttribute("aria-label", "Play video");
        }
      });
    }

    /* =================================================
           BACKWARD 10 SECONDS
        ================================================== */

    if (videoBackward) {
      videoBackward.addEventListener("click", function () {
        featuredVideo.currentTime = Math.max(0, featuredVideo.currentTime - 10);
      });
    }

    /* =================================================
           FORWARD 10 SECONDS
        ================================================== */

    if (videoForward) {
      videoForward.addEventListener("click", function () {
        featuredVideo.currentTime = Math.min(
          featuredVideo.duration,
          featuredVideo.currentTime + 10,
        );
      });
    }

    /* =================================================
           UPDATE PLAY / PAUSE ICON
        ================================================== */

    featuredVideo.addEventListener("play", function () {
      if (videoPlayPause) {
        videoPlayPause.textContent = "❚❚";

        videoPlayPause.setAttribute("aria-label", "Pause video");
      }
    });

    featuredVideo.addEventListener("pause", function () {
      if (videoPlayPause) {
        videoPlayPause.textContent = "▶";

        videoPlayPause.setAttribute("aria-label", "Play video");
      }
    });

    /* =================================================
           UPDATE PROGRESS BAR
        ================================================== */

    featuredVideo.addEventListener("timeupdate", function () {
      if (featuredVideo.duration && videoProgressBar) {
        const percentage =
          (featuredVideo.currentTime / featuredVideo.duration) * 100;

        videoProgressBar.style.width = percentage + "%";
      }
    });

    /* =================================================
           CLICK PROGRESS BAR TO SEEK
        ================================================== */

    if (videoProgressContainer) {
      videoProgressContainer.addEventListener("click", function (event) {
        const rect = videoProgressContainer.getBoundingClientRect();

        const clickPosition = event.clientX - rect.left;

        const percentage = clickPosition / rect.width;

        if (featuredVideo.duration) {
          featuredVideo.currentTime = percentage * featuredVideo.duration;
        }
      });
    }

    /* =================================================
           FULLSCREEN
        ================================================== */

    if (videoFullscreen) {
      videoFullscreen.addEventListener("click", function () {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          if (featuredVideo.requestFullscreen) {
            featuredVideo.requestFullscreen();
          } else if (featuredVideo.webkitEnterFullscreen) {
            /*
             * iPhone / Safari fallback
             */
            featuredVideo.webkitEnterFullscreen();
          }
        }
      });
    }

    /* =================================================
           UPDATE FULLSCREEN ICON
        ================================================== */

    document.addEventListener("fullscreenchange", function () {
      if (!videoFullscreen) return;

      if (document.fullscreenElement) {
        videoFullscreen.textContent = "×";

        videoFullscreen.setAttribute("aria-label", "Exit fullscreen");
      } else {
        videoFullscreen.textContent = "⛶";

        videoFullscreen.setAttribute("aria-label", "Enter fullscreen");
      }
    });
  }

  /* =====================================================
   CUSTOM VIDEO PLAYERS
====================================================== */

  const videoPlayers = document.querySelectorAll(".custom-video-player");

  videoPlayers.forEach(function (player) {
    const video = player.querySelector(".custom-video");

    const playButton = player.querySelector(".play-pause");

    const backwardButton = player.querySelector(".skip-backward");

    const forwardButton = player.querySelector(".skip-forward");

    const progress = player.querySelector(".video-progress");

    const muteButton = player.querySelector(".mute-toggle");

    const fullscreenButton = player.querySelector(".fullscreen-toggle");

    if (!video) {
      return;
    }

    /* =================================================
       PLAY / PAUSE
    ================================================== */

    if (playButton) {
      playButton.addEventListener("click", function () {
        if (video.paused) {
          video.play();
        } else {
          video.pause();
        }
      });
    }

    /* =================================================
       UPDATE PLAY BUTTON
    ================================================== */

    video.addEventListener("play", function () {
      if (playButton) {
        playButton.textContent = "❚❚";

        playButton.setAttribute("aria-label", "Pause video");
      }
    });

    video.addEventListener("pause", function () {
      if (playButton) {
        playButton.textContent = "▶";

        playButton.setAttribute("aria-label", "Play video");
      }
    });

    /* =================================================
       BACKWARD 10 SECONDS
    ================================================== */

    if (backwardButton) {
      backwardButton.addEventListener("click", function () {
        video.currentTime = Math.max(0, video.currentTime - 10);
      });
    }

    /* =================================================
       FORWARD 10 SECONDS
    ================================================== */

    if (forwardButton) {
      forwardButton.addEventListener("click", function () {
        video.currentTime = Math.min(video.duration, video.currentTime + 10);
      });
    }

    /* =================================================
       UPDATE PROGRESS
    ================================================== */

    video.addEventListener("timeupdate", function () {
      if (progress && video.duration) {
        progress.value = (video.currentTime / video.duration) * 100;
      }
    });

    /* =================================================
       SEEK
    ================================================== */

    if (progress) {
      progress.addEventListener("input", function () {
        if (video.duration) {
          video.currentTime = (progress.value / 100) * video.duration;
        }
      });
    }

    /* =================================================
       MUTE / UNMUTE
    ================================================== */

    if (muteButton) {
      muteButton.addEventListener("click", function () {
        video.muted = !video.muted;

        if (video.muted) {
          muteButton.textContent = "🔇";

          muteButton.setAttribute("aria-label", "Unmute video");
        } else {
          muteButton.textContent = "🔊";

          muteButton.setAttribute("aria-label", "Mute video");
        }
      });
    }

    /* =================================================
       FULLSCREEN
    ================================================== */

    if (fullscreenButton) {
      fullscreenButton.addEventListener("click", function () {
        if (!document.fullscreenElement) {
          if (player.requestFullscreen) {
            player.requestFullscreen();
          } else if (video.webkitEnterFullscreen) {
            video.webkitEnterFullscreen();
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
      });
    }

    /* =================================================
       UPDATE FULLSCREEN ICON
    ================================================== */

    document.addEventListener("fullscreenchange", function () {
      if (document.fullscreenElement === player) {
        fullscreenButton.textContent = "⛶";
      } else {
        fullscreenButton.textContent = "⛶";
      }
    });

    /* =================================================
       AUTO-HIDE CONTROLS
       Always visible while paused. While playing they fade out after a
       few seconds without mouse movement, touch or key presses, and come
       back on hover / tap / keyboard focus.
    ================================================== */

    const controls = player.querySelector(".custom-video-controls");

    if (controls) {
      const HIDE_AFTER = 2500; // ms of inactivity before hiding
      let hideTimer = null;

      function scheduleHide(delay) {
        clearTimeout(hideTimer);

        if (video.paused) return;

        hideTimer = setTimeout(function () {
          const keyboardInside =
            controls.contains(document.activeElement) &&
            document.activeElement.matches(":focus-visible");

          if (video.paused) return;

          // Pointer resting on the bar or keyboard focus inside: keep showing
          if (controls.matches(":hover") || keyboardInside) {
            scheduleHide(HIDE_AFTER);
            return;
          }

          player.classList.add("controls-hidden");
        }, delay);
      }

      function showControls() {
        player.classList.remove("controls-hidden");
        scheduleHide(HIDE_AFTER);
      }

      [
        "pointermove",
        "pointerdown",
        "touchstart",
        "keydown",
        "focusin",
      ].forEach(function (type) {
        player.addEventListener(type, showControls, { passive: true });
      });

      player.addEventListener("pointerleave", function () {
        scheduleHide(800);
      });

      video.addEventListener("play", showControls);
      video.addEventListener("pause", showControls);
      video.addEventListener("ended", showControls);

      showControls();
    }
  });
});