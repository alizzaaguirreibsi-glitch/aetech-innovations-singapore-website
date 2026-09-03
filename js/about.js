/* =========================================================
   MOBILE HAMBURGER MENU
========================================================= */

const hamburger = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".mobile-menu");

if (hamburger && mobileMenu) {

    hamburger.addEventListener("click", function () {

        const isOpen = mobileMenu.classList.toggle("open");

        hamburger.classList.toggle("active", isOpen);

        hamburger.setAttribute(
            "aria-expanded",
            isOpen ? "true" : "false"
        );

    });


    /* ================================================
       CLOSE MENU WHEN A LINK IS CLICKED
    ================================================ */

    const mobileLinks = mobileMenu.querySelectorAll("a");

    mobileLinks.forEach(function (link) {

        link.addEventListener("click", function () {

            mobileMenu.classList.remove("open");
            hamburger.classList.remove("active");

            hamburger.setAttribute(
                "aria-expanded",
                "false"
            );

        });

    });


    /* ================================================
       CLOSE MENU WHEN CLICKING OUTSIDE
    ================================================ */

    document.addEventListener("click", function (event) {

        if (
            !hamburger.contains(event.target) &&
            !mobileMenu.contains(event.target)
        ) {

            mobileMenu.classList.remove("open");
            hamburger.classList.remove("active");

            hamburger.setAttribute(
                "aria-expanded",
                "false"
            );

        }

    });

}


/* =========================================================
   COMPANY INTRODUCTION VIDEO
========================================================= */

const aboutVideo = document.getElementById("aboutCompanyVideo");
const aboutVideoPlay = document.getElementById("aboutVideoPlay");
const aboutVideoFrame = document.querySelector(".about-video-frame");


if (
    aboutVideo &&
    aboutVideoPlay &&
    aboutVideoFrame
) {

    /* ================================================
       PLAY / PAUSE VIDEO
    ================================================ */

    aboutVideoPlay.addEventListener("click", function () {

        if (aboutVideo.paused) {

            aboutVideo.play();

            aboutVideoFrame.classList.add("is-playing");

        } else {

            aboutVideo.pause();

            aboutVideoFrame.classList.remove("is-playing");

        }

    });


    /* ================================================
       VIDEO ENDED
    ================================================ */

    aboutVideo.addEventListener("ended", function () {

        aboutVideoFrame.classList.remove("is-playing");

    });

}