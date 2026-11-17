/* Mobile menu, topbar and footer are handled by /js/layout.js */

/* =========================================================
   COMPANY INTRODUCTION VIDEO
========================================================= */

const aboutVideo = document.getElementById("aboutCompanyVideo");
const aboutVideoPlay = document.getElementById("aboutVideoPlay");
const aboutVideoFrame = document.querySelector(".about-video-frame");

if (aboutVideo && aboutVideoPlay && aboutVideoFrame) {
  /* ================================================
       PLAY / PAUSE VIDEO
    ================================================ */

  // First press while it auto-plays muted turns the sound on;
  // later presses pause / resume.
  aboutVideoPlay.addEventListener("click", function () {
    if (aboutVideo.paused) {
      aboutVideo.muted = false;
      aboutVideo.play();
    } else if (aboutVideo.muted) {
      aboutVideo.muted = false;
    } else {
      aboutVideo.pause();
    }
  });

  // Keep the overlay in sync however the video starts or stops
  // (button, scroll autoplay, scroll pause).
  aboutVideo.addEventListener("play", function () {
    aboutVideoFrame.classList.add("is-playing");
  });

  aboutVideo.addEventListener("pause", function () {
    aboutVideoFrame.classList.remove("is-playing");
  });

  /* ================================================
       VIDEO ENDED
    ================================================ */

  aboutVideo.addEventListener("ended", function () {
    aboutVideoFrame.classList.remove("is-playing");
  });
}
