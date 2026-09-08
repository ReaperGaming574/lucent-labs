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


elementsToReveal.forEach(
    (element) => {

        element.classList.add(
            "reveal"
        );

    }
);


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
// OPEN MOBILE MENU
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


    mobileMenuOverlay.classList.add(
        "active"
    );


    mobileMenuButton.classList.add(
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


    document.body.classList.add(
        "menu-open"
    );

}


// =============================================
// CLOSE MOBILE MENU
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


    mobileMenuOverlay.classList.remove(
        "active"
    );


    mobileMenuButton.classList.remove(
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


    document.body.classList.remove(
        "menu-open"
    );

}


// =============================================
// TOGGLE MOBILE MENU
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
// MOBILE MENU EVENTS
// =============================================

if (mobileMenuButton) {

    mobileMenuButton.addEventListener(
        "click",
        toggleMobileMenu
    );

}


if (mobileMenuClose) {

    mobileMenuClose.addEventListener(
        "click",
        closeMobileMenu
    );

}


if (mobileMenuOverlay) {

    mobileMenuOverlay.addEventListener(
        "click",
        closeMobileMenu
    );

}


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
// RESET MENU ON DESKTOP
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


// =============================================
// PROJECT ENQUIRY SYSTEM
// =============================================

const projectForm =
    document.getElementById(
        "projectForm"
    );


if (projectForm) {


    // =========================================
    // ELEMENTS
    // =========================================

    const formSteps =
        document.querySelectorAll(
            ".form-step"
        );


    const progressItems =
        document.querySelectorAll(
            ".progress-item"
        );


    const nextButtons =
        document.querySelectorAll(
            ".next-step"
        );


    const previousButtons =
        document.querySelectorAll(
            ".previous-step"
        );


    const projectReview =
        document.getElementById(
            "projectReview"
        );


    const projectSuccess =
        document.getElementById(
            "projectSuccess"
        );


    const projectReference =
        document.getElementById(
            "projectReference"
        );


    const projectProgress =
        document.getElementById(
            "projectProgress"
        );


    const formError =
        document.getElementById(
            "formError"
        );


    const submitProject =
        document.getElementById(
            "submitProject"
        );


    let currentStep = 1;


    // =========================================
    // SHOW STEP
    // =========================================

    function showStep(step) {

        currentStep = step;


        formSteps.forEach(
            (formStep) => {

                const stepNumber =
                    Number(
                        formStep.dataset.step
                    );


                formStep.classList.toggle(
                    "active",
                    stepNumber === step
                );

            }
        );


        progressItems.forEach(
            (item) => {

                const progressNumber =
                    Number(
                        item.dataset.progress
                    );


                item.classList.toggle(
                    "active",
                    progressNumber === step
                );


                item.classList.toggle(
                    "complete",
                    progressNumber < step
                );

            }
        );


        if (
            step === 5
        ) {

            buildReview();

        }


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    // =========================================
    // VALIDATE STEP
    // =========================================

    function validateStep(step) {

        const currentSection =
            document.querySelector(
                `.form-step[data-step="${step}"]`
            );


        if (!currentSection) {

            return true;

        }


        const requiredFields =
            currentSection.querySelectorAll(
                "[required]"
            );


        for (
            const field
            of requiredFields
        ) {

            if (
                !field.checkValidity()
            ) {

                field.reportValidity();

                return false;

            }

        }


        return true;

    }


    // =========================================
    // NEXT STEP
    // =========================================

    nextButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        !validateStep(
                            currentStep
                        )
                    ) {

                        return;

                    }


                    if (
                        currentStep < 5
                    ) {

                        showStep(
                            currentStep + 1
                        );

                    }

                }
            );

        }
    );


    // =========================================
    // PREVIOUS STEP
    // =========================================

    previousButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        currentStep > 1
                    ) {

                        showStep(
                            currentStep - 1
                        );

                    }

                }
            );

        }
    );


    // =========================================
    // GET FORM VALUE
    // =========================================

    function getValue(name) {

        const field =
            projectForm.elements[
                name
            ];


        if (!field) {

            return "";

        }


        if (
            field instanceof
            RadioNodeList
        ) {

            return field.value;

        }


        return field.value.trim();

    }


    // =========================================
    // ESCAPE HTML
    // =========================================

    function escapeHTML(value) {

        return String(value)

            .replaceAll(
                "&",
                "&amp;"
            )

            .replaceAll(
                "<",
                "&lt;"
            )

            .replaceAll(
                ">",
                "&gt;"
            )

            .replaceAll(
                '"',
                "&quot;"
            )

            .replaceAll(
                "'",
                "&#039;"
            );

    }


    // =========================================
    // REVIEW ITEM
    // =========================================

    function reviewItem(
        label,
        value,
        wide = false
    ) {

        const safeValue =
            escapeHTML(
                value ||
                "Not provided"
            );


        return `
            <div class="review-item ${wide ? "wide" : ""}">

                <span>
                    ${label}
                </span>

                <p>
                    ${safeValue}
                </p>

            </div>
        `;

    }


    // =========================================
    // BUILD REVIEW
    // =========================================

    function buildReview() {

        if (!projectReview) {

            return;

        }


        projectReview.innerHTML = [

            reviewItem(
                "PROJECT TYPE",
                getValue(
                    "projectType"
                )
            ),

            reviewItem(
                "PROJECT NAME",
                getValue(
                    "projectName"
                )
            ),

            reviewItem(
                "BUDGET",
                getValue(
                    "budget"
                )
            ),

            reviewItem(
                "TIMESCALE",
                getValue(
                    "deadline"
                )
            ),

            reviewItem(
                "DESCRIPTION",
                getValue(
                    "projectDescription"
                ),
                true
            ),

            reviewItem(
                "FEATURES",
                getValue(
                    "projectFeatures"
                ),
                true
            ),

            reviewItem(
                "REFERENCES",
                getValue(
                    "references"
                ),
                true
            ),

            reviewItem(
                "NAME",
                getValue(
                    "clientName"
                )
            ),

            reviewItem(
                "EMAIL",
                getValue(
                    "email"
                )
            ),

            reviewItem(
                "DISCORD",
                getValue(
                    "discord"
                )
            )

        ].join("");

    }


    // =========================================
    // GENERATE PROJECT REFERENCE
    // =========================================

    function generateReference() {

        const now =
            new Date();


        const year =
            String(
                now.getFullYear()
            ).slice(-2);


        const random =
            Math.floor(
                100000 +
                Math.random() *
                900000
            );


        return (
            `LL-${year}-${random}`
        );

    }


    // =========================================
    // SHOW ERROR
    // =========================================

    function showFormError(message) {

        if (!formError) {

            return;

        }


        formError.textContent =
            message;


        formError.classList.add(
            "active"
        );

    }


    // =========================================
    // CLEAR ERROR
    // =========================================

    function clearFormError() {

        if (!formError) {

            return;

        }


        formError.textContent = "";


        formError.classList.remove(
            "active"
        );

    }


    // =========================================
    // SUBMIT PROJECT
    // =========================================

    projectForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            clearFormError();


            if (
                !projectForm.checkValidity()
            ) {

                projectForm.reportValidity();

                return;

            }


            const reference =
                generateReference();


            const turnstileToken =
    document.querySelector(
        '[name="cf-turnstile-response"]'
    )?.value;


if (!turnstileToken) {

    showFormError(
        "Please complete the security check before submitting."
    );

    return;

}


const enquiry = {

    reference:
        reference,

    projectType:
        getValue(
            "projectType"
        ),

    projectName:
        getValue(
            "projectName"
        ),

    projectDescription:
        getValue(
            "projectDescription"
        ),

    projectFeatures:
        getValue(
            "projectFeatures"
        ),

    references:
        getValue(
            "references"
        ),

    budget:
        getValue(
            "budget"
        ),

    deadline:
        getValue(
            "deadline"
        ),

    clientName:
        getValue(
            "clientName"
        ),

    email:
        getValue(
            "email"
        ),

    discord:
        getValue(
            "discord"
        ),

    turnstileToken:
        turnstileToken

};

            try {


                if (submitProject) {

                    submitProject.disabled =
                        true;


                    submitProject.textContent =
                        "Submitting...";

                }


                const response =
                    await fetch(

                        "/api/enquiry",

                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    enquiry
                                )

                        }

                    );


                if (
                    !response.ok
                ) {

                    throw new Error(
                        "Submission failed"
                    );

                }


                const responseData =
                    await response.json();


                const finalReference =
                    responseData.reference ||
                    reference;


                if (projectReference) {

                    projectReference.textContent =
                        finalReference;

                }


                projectForm.style.display =
                    "none";


                if (projectProgress) {

                    projectProgress.style.display =
                        "none";

                }


                if (projectSuccess) {

                    projectSuccess.classList.add(
                        "active"
                    );

                }


                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });


            } catch (error) {


                console.error(
                    "Lucent enquiry error:",
                    error
                );


                showFormError(
                    "We couldn't submit your enquiry. Please try again in a moment."
                );


            } finally {


                if (submitProject) {

                    submitProject.disabled =
                        false;


                    submitProject.textContent =
                        "Submit Project";

                }

            }

        }
    );


    // =========================================
    // INITIAL FORM STATE
    // =========================================

    showStep(1);

}