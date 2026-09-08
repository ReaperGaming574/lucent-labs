// =============================================
// LUCENT LABS
// MAIN WEBSITE SCRIPT
// =============================================


// =============================================
// SCROLL REVEAL
// =============================================

const elementsToReveal =
    document.querySelectorAll(
        ".section, .contact, .project-card, .service, .work-category"
    );


elementsToReveal.forEach((element) => {

    element.classList.add(
        "reveal"
    );

});


const observer =
    new IntersectionObserver(

        (entries) => {

            entries.forEach(
                (entry) => {

                    if (
                        entry.isIntersecting
                    ) {

                        entry.target
                            .classList
                            .add(
                                "active"
                            );

                    }

                }
            );

        },

        {
            threshold: 0.12
        }

    );


elementsToReveal.forEach(
    (element) => {

        observer.observe(
            element
        );

    }
);


// =============================================
// MOBILE MENU
// =============================================

const mobileMenuButton =
    document.getElementById(
        "mobileMenuButton"
    );


const mobileMenu =
    document.getElementById(
        "mobileMenu"
    );


const mobileMenuOverlay =
    document.getElementById(
        "mobileMenuOverlay"
    );


const mobileMenuClose =
    document.getElementById(
        "mobileMenuClose"
    );


const mobileMenuLinks =
    document.querySelectorAll(
        ".mobile-menu-nav a"
    );


// =============================================
// OPEN MENU
// =============================================

function openMobileMenu() {

    if (
        !mobileMenu ||
        !mobileMenuOverlay ||
        !mobileMenuButton
    ) {

        return;

    }


    mobileMenu.classList.add(
        "active"
    );


    mobileMenuOverlay
        .classList
        .add(
            "active"
        );


    mobileMenuButton
        .classList
        .add(
            "active"
        );


    mobileMenuButton.setAttribute(
        "aria-expanded",
        "true"
    );


    mobileMenu.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body
        .classList
        .add(
            "menu-open"
        );

}


// =============================================
// CLOSE MENU
// =============================================

function closeMobileMenu() {

    if (
        !mobileMenu ||
        !mobileMenuOverlay ||
        !mobileMenuButton
    ) {

        return;

    }


    mobileMenu.classList.remove(
        "active"
    );


    mobileMenuOverlay
        .classList
        .remove(
            "active"
        );


    mobileMenuButton
        .classList
        .remove(
            "active"
        );


    mobileMenuButton.setAttribute(
        "aria-expanded",
        "false"
    );


    mobileMenu.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body
        .classList
        .remove(
            "menu-open"
        );

}


// =============================================
// TOGGLE MENU
// =============================================

function toggleMobileMenu() {

    const isOpen =
        mobileMenu
            ?.classList
            .contains(
                "active"
            );


    if (isOpen) {

        closeMobileMenu();

    } else {

        openMobileMenu();

    }

}


// =============================================
// MENU BUTTON
// =============================================

if (mobileMenuButton) {

    mobileMenuButton
        .addEventListener(
            "click",
            toggleMobileMenu
        );

}


// =============================================
// CLOSE BUTTON
// =============================================

if (mobileMenuClose) {

    mobileMenuClose
        .addEventListener(
            "click",
            closeMobileMenu
        );

}


// =============================================
// CLICK OUTSIDE
// =============================================

if (mobileMenuOverlay) {

    mobileMenuOverlay
        .addEventListener(
            "click",
            closeMobileMenu
        );

}


// =============================================
// MENU LINKS
// =============================================

mobileMenuLinks.forEach(
    (link) => {

        link.addEventListener(
            "click",
            () => {

                closeMobileMenu();

            }
        );

    }
);


// =============================================
// ESCAPE KEY
// =============================================

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key ===
            "Escape"
        ) {

            closeMobileMenu();

        }

    }
);


// =============================================
// RESET WHEN RETURNING TO DESKTOP
// =============================================

window.addEventListener(
    "resize",
    () => {

        if (
            window.innerWidth >
            800
        ) {

            closeMobileMenu();

        }

    }
);