// ---------------------------------
// SCROLL REVEAL ANIMATION
// ---------------------------------

const elementsToReveal = document.querySelectorAll(
    ".section, .contact, .project-card, .service"
);

elementsToReveal.forEach((element) => {
    element.classList.add("reveal");
});


const observer = new IntersectionObserver(
    (entries) => {

        entries.forEach((entry) => {

            if (entry.isIntersecting) {

                entry.target.classList.add("active");

            }

        });

    },
    {
        threshold: 0.12
    }
);


elementsToReveal.forEach((element) => {
    observer.observe(element);
});