document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       CAROUSEL
    ====================================================== */

    const slider =
        document.querySelector(".what-we-do-slider");

    const track =
        document.querySelector(".what-we-do-track");

    const prevButton =
        document.querySelector(".carousel-prev");

    const nextButton =
        document.querySelector(".carousel-next");

    const cards =
        document.querySelectorAll(".what-do-card");


    if (slider && track && cards.length) {

        /*
         * Calculate how far the carousel should move.
         */
        function getScrollAmount() {

            const card = cards[0];

            const cardWidth =
                card.offsetWidth;

            const gap =
                parseFloat(
                    getComputedStyle(track).gap
                ) || 0;

            return cardWidth + gap;
        }


        /*
         * NEXT
         */
        if (nextButton) {

            nextButton.addEventListener(
                "click",
                function () {

                    slider.scrollBy({
                        left: getScrollAmount(),
                        behavior: "smooth"
                    });

                }
            );

        }


        /*
         * PREVIOUS
         */
        if (prevButton) {

            prevButton.addEventListener(
                "click",
                function () {

                    slider.scrollBy({
                        left: -getScrollAmount(),
                        behavior: "smooth"
                    });

                }
            );

        }

    }



    /* =====================================================
       MOBILE HAMBURGER MENU
    ====================================================== */

    const hamburger =
        document.querySelector(".hamburger");

    const mobileMenu =
        document.querySelector(".mobile-menu");


    if (hamburger && mobileMenu) {

        /*
         * OPEN / CLOSE MENU
         */
        hamburger.addEventListener(
            "click",
            function () {

                const isOpen =
                    mobileMenu.classList.contains("open");


                if (isOpen) {

                    mobileMenu.classList.remove("open");

                    hamburger.classList.remove("active");

                    hamburger.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                } else {

                    mobileMenu.classList.add("open");

                    hamburger.classList.add("active");

                    hamburger.setAttribute(
                        "aria-expanded",
                        "true"
                    );

                }

            }
        );


        /*
         * CLOSE MENU WHEN A LINK IS CLICKED
         */
        const mobileLinks =
            mobileMenu.querySelectorAll("a");


        mobileLinks.forEach(function (link) {

            link.addEventListener(
                "click",
                function () {

                    mobileMenu.classList.remove("open");

                    hamburger.classList.remove("active");

                    hamburger.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }
            );

        });


        /*
         * CLOSE MENU WHEN CLICKING OUTSIDE
         */
        document.addEventListener(
            "click",
            function (event) {

                const clickedInsideMenu =
                    mobileMenu.contains(event.target);

                const clickedHamburger =
                    hamburger.contains(event.target);


                if (
                    !clickedInsideMenu &&
                    !clickedHamburger
                ) {

                    mobileMenu.classList.remove("open");

                    hamburger.classList.remove("active");

                    hamburger.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }

            }
        );


        /*
         * CLOSE MENU WHEN SCREEN BECOMES DESKTOP SIZE
         */
        window.addEventListener(
            "resize",
            function () {

                if (window.innerWidth > 1000) {

                    mobileMenu.classList.remove("open");

                    hamburger.classList.remove("active");

                    hamburger.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }

            }
        );

    }

        /* =====================================================
       FEATURED PRODUCT VIDEO CONTROLS
    ====================================================== */

    const featuredVideo =
        document.getElementById("featuredProductVideo");

    const videoPlayPause =
        document.getElementById("videoPlayPause");

    const videoBackward =
        document.getElementById("videoBackward");

    const videoForward =
        document.getElementById("videoForward");

    const videoFullscreen =
        document.getElementById("videoFullscreen");

    const videoProgressBar =
        document.getElementById("videoProgressBar");

    const videoProgressContainer =
        document.querySelector(".video-progress-container");


    if (featuredVideo) {


        /* =================================================
           PLAY / PAUSE
        ================================================== */

        if (videoPlayPause) {

            videoPlayPause.addEventListener(
                "click",
                function () {

                    if (featuredVideo.paused) {

                        featuredVideo.play();

                        videoPlayPause.textContent = "❚❚";

                        videoPlayPause.setAttribute(
                            "aria-label",
                            "Pause video"
                        );

                    } else {

                        featuredVideo.pause();

                        videoPlayPause.textContent = "▶";

                        videoPlayPause.setAttribute(
                            "aria-label",
                            "Play video"
                        );

                    }

                }
            );

        }


        /* =================================================
           BACKWARD 10 SECONDS
        ================================================== */

        if (videoBackward) {

            videoBackward.addEventListener(
                "click",
                function () {

                    featuredVideo.currentTime =
                        Math.max(
                            0,
                            featuredVideo.currentTime - 10
                        );

                }
            );

        }


        /* =================================================
           FORWARD 10 SECONDS
        ================================================== */

        if (videoForward) {

            videoForward.addEventListener(
                "click",
                function () {

                    featuredVideo.currentTime =
                        Math.min(
                            featuredVideo.duration,
                            featuredVideo.currentTime + 10
                        );

                }
            );

        }


        /* =================================================
           UPDATE PLAY / PAUSE ICON
        ================================================== */

        featuredVideo.addEventListener(
            "play",
            function () {

                if (videoPlayPause) {

                    videoPlayPause.textContent = "❚❚";

                    videoPlayPause.setAttribute(
                        "aria-label",
                        "Pause video"
                    );

                }

            }
        );


        featuredVideo.addEventListener(
            "pause",
            function () {

                if (videoPlayPause) {

                    videoPlayPause.textContent = "▶";

                    videoPlayPause.setAttribute(
                        "aria-label",
                        "Play video"
                    );

                }

            }
        );


        /* =================================================
           UPDATE PROGRESS BAR
        ================================================== */

        featuredVideo.addEventListener(
            "timeupdate",
            function () {

                if (
                    featuredVideo.duration &&
                    videoProgressBar
                ) {

                    const percentage =
                        (
                            featuredVideo.currentTime /
                            featuredVideo.duration
                        ) * 100;

                    videoProgressBar.style.width =
                        percentage + "%";

                }

            }
        );


        /* =================================================
           CLICK PROGRESS BAR TO SEEK
        ================================================== */

        if (videoProgressContainer) {

            videoProgressContainer.addEventListener(
                "click",
                function (event) {

                    const rect =
                        videoProgressContainer.getBoundingClientRect();

                    const clickPosition =
                        event.clientX - rect.left;

                    const percentage =
                        clickPosition / rect.width;

                    if (featuredVideo.duration) {

                        featuredVideo.currentTime =
                            percentage *
                            featuredVideo.duration;

                    }

                }
            );

        }


        /* =================================================
           FULLSCREEN
        ================================================== */

        if (videoFullscreen) {

            videoFullscreen.addEventListener(
                "click",
                function () {

                    if (
                        document.fullscreenElement
                    ) {

                        document.exitFullscreen();

                    } else {

                        if (
                            featuredVideo.requestFullscreen
                        ) {

                            featuredVideo.requestFullscreen();

                        } else if (
                            featuredVideo.webkitEnterFullscreen
                        ) {

                            /*
                             * iPhone / Safari fallback
                             */
                            featuredVideo.webkitEnterFullscreen();

                        }

                    }

                }
            );

        }


        /* =================================================
           UPDATE FULLSCREEN ICON
        ================================================== */

        document.addEventListener(
            "fullscreenchange",
            function () {

                if (!videoFullscreen) return;


                if (document.fullscreenElement) {

                    videoFullscreen.textContent = "×";

                    videoFullscreen.setAttribute(
                        "aria-label",
                        "Exit fullscreen"
                    );

                } else {

                    videoFullscreen.textContent = "⛶";

                    videoFullscreen.setAttribute(
                        "aria-label",
                        "Enter fullscreen"
                    );

                }

            }
        );

    }

    /* =====================================================
   CUSTOM VIDEO PLAYERS
====================================================== */

const videoPlayers =
    document.querySelectorAll(".custom-video-player");


videoPlayers.forEach(function (player) {

    const video =
        player.querySelector(".custom-video");

    const playButton =
        player.querySelector(".play-pause");

    const backwardButton =
        player.querySelector(".skip-backward");

    const forwardButton =
        player.querySelector(".skip-forward");

    const progress =
        player.querySelector(".video-progress");

    const muteButton =
        player.querySelector(".mute-toggle");

    const fullscreenButton =
        player.querySelector(".fullscreen-toggle");


    if (!video) {
        return;
    }


    /* =================================================
       PLAY / PAUSE
    ================================================== */

    if (playButton) {

        playButton.addEventListener(
            "click",
            function () {

                if (video.paused) {

                    video.play();

                } else {

                    video.pause();

                }

            }
        );

    }


    /* =================================================
       UPDATE PLAY BUTTON
    ================================================== */

    video.addEventListener(
        "play",
        function () {

            if (playButton) {

                playButton.textContent = "❚❚";

                playButton.setAttribute(
                    "aria-label",
                    "Pause video"
                );

            }

        }
    );


    video.addEventListener(
        "pause",
        function () {

            if (playButton) {

                playButton.textContent = "▶";

                playButton.setAttribute(
                    "aria-label",
                    "Play video"
                );

            }

        }
    );


    /* =================================================
       BACKWARD 10 SECONDS
    ================================================== */

    if (backwardButton) {

        backwardButton.addEventListener(
            "click",
            function () {

                video.currentTime =
                    Math.max(
                        0,
                        video.currentTime - 10
                    );

            }
        );

    }


    /* =================================================
       FORWARD 10 SECONDS
    ================================================== */

    if (forwardButton) {

        forwardButton.addEventListener(
            "click",
            function () {

                video.currentTime =
                    Math.min(
                        video.duration,
                        video.currentTime + 10
                    );

            }
        );

    }


    /* =================================================
       UPDATE PROGRESS
    ================================================== */

    video.addEventListener(
        "timeupdate",
        function () {

            if (
                progress &&
                video.duration
            ) {

                progress.value =
                    (
                        video.currentTime /
                        video.duration
                    ) * 100;

            }

        }
    );


    /* =================================================
       SEEK
    ================================================== */

    if (progress) {

        progress.addEventListener(
            "input",
            function () {

                if (video.duration) {

                    video.currentTime =
                        (
                            progress.value / 100
                        ) *
                        video.duration;

                }

            }
        );

    }


    /* =================================================
       MUTE / UNMUTE
    ================================================== */

    if (muteButton) {

        muteButton.addEventListener(
            "click",
            function () {

                video.muted =
                    !video.muted;


                if (video.muted) {

                    muteButton.textContent = "🔇";

                    muteButton.setAttribute(
                        "aria-label",
                        "Unmute video"
                    );

                } else {

                    muteButton.textContent = "🔊";

                    muteButton.setAttribute(
                        "aria-label",
                        "Mute video"
                    );

                }

            }
        );

    }


    /* =================================================
       FULLSCREEN
    ================================================== */

    if (fullscreenButton) {

        fullscreenButton.addEventListener(
            "click",
            function () {

                if (!document.fullscreenElement) {

                    if (
                        player.requestFullscreen
                    ) {

                        player.requestFullscreen();

                    } else if (
                        video.webkitEnterFullscreen
                    ) {

                        video.webkitEnterFullscreen();

                    }

                } else {

                    if (
                        document.exitFullscreen
                    ) {

                        document.exitFullscreen();

                    }

                }

            }
        );

    }


    /* =================================================
       UPDATE FULLSCREEN ICON
    ================================================== */

    document.addEventListener(
        "fullscreenchange",
        function () {

            if (
                document.fullscreenElement === player
            ) {

                fullscreenButton.textContent = "⛶";

            } else {

                fullscreenButton.textContent = "⛶";

            }

        }
    );

});

});