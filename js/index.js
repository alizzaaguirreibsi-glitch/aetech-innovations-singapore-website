const eventCards = document.querySelectorAll(".event-card");
const dots = document.querySelectorAll(".event-dot");

const prevButton = document.getElementById("eventPrev");
const nextButton = document.getElementById("eventNext");

let currentEvent = 1;

function updateCarousel() {
    eventCards.forEach((card, index) => {

        card.classList.remove(
            "event-left",
            "event-center",
            "event-right"
        );

        let position =
            (index - currentEvent + eventCards.length)
            % eventCards.length;

        if (position === 0) {
            card.classList.add("event-center");
        } 
        else if (position === 1) {
            card.classList.add("event-right");
        } 
        else {
            card.classList.add("event-left");
        }
    });

    dots.forEach((dot, index) => {
        dot.classList.toggle(
            "active",
            index === currentEvent
        );
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

    if (
        event.key === "Escape" &&
        lightbox.classList.contains("active")
    ) {

        closeLightbox();

    }

});

/* =========================================
   MOBILE HAMBURGER MENU
========================================= */

const hamburger =
    document.querySelector(".hamburger");

const mobileMenu =
    document.querySelector(".mobile-menu");


if (hamburger && mobileMenu) {

    /* =========================================
       OPEN / CLOSE MENU
    ========================================= */

    hamburger.addEventListener("click", () => {

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

    });


    /* =========================================
       CLOSE MENU WHEN LINK IS CLICKED
    ========================================= */

    const mobileLinks =
        mobileMenu.querySelectorAll("a");


    mobileLinks.forEach((link) => {

        link.addEventListener("click", () => {

            mobileMenu.classList.remove("open");

            hamburger.classList.remove("active");

            hamburger.setAttribute(
                "aria-expanded",
                "false"
            );

        });

    });


    /* =========================================
       CLOSE MENU WHEN CLICKING OUTSIDE
    ========================================= */

    document.addEventListener("click", (event) => {

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

    });


    /* =========================================
       CLOSE MENU WHEN RETURNING TO DESKTOP
    ========================================= */

    window.addEventListener("resize", () => {

        if (window.innerWidth > 1100) {

            mobileMenu.classList.remove("open");

            hamburger.classList.remove("active");

            hamburger.setAttribute(
                "aria-expanded",
                "false"
            );

        }

    });

}