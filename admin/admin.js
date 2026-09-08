// =========================================
// LUCENT LABS ADMIN
// =========================================

const enquiryCount =
    document.getElementById(
        "enquiryCount"
    );

const quoteCount =
    document.getElementById(
        "quoteCount"
    );

const projectCount =
    document.getElementById(
        "projectCount"
    );

const enquiryList =
    document.getElementById(
        "enquiryList"
    );


// =========================================
// LOAD DASHBOARD
// =========================================

async function loadDashboard() {

    try {

        const response =
            await fetch(
                "/api/admin/enquiries",
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    },

                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Request failed: ${response.status}`
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.error ||
                "Unable to load dashboard."
            );

        }


        // =========================================
        // UPDATE COUNTS
        // =========================================

        enquiryCount.textContent =
            data.counts?.enquiries ?? 0;

        quoteCount.textContent =
            data.counts?.quotes ?? 0;

        projectCount.textContent =
            data.counts?.projects ?? 0;


        // =========================================
        // RENDER ENQUIRIES
        // =========================================

        renderEnquiries(
            data.enquiries || []
        );


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );


        enquiryCount.textContent = "—";
        quoteCount.textContent = "—";
        projectCount.textContent = "—";


        enquiryList.innerHTML = `
            <div class="admin-empty">
                Unable to load enquiries.
            </div>
        `;

    }

}


// =========================================
// RENDER ENQUIRIES
// =========================================

function renderEnquiries(enquiries) {

    if (!enquiries.length) {

        enquiryList.innerHTML = `
            <div class="admin-empty">
                No enquiries yet.
            </div>
        `;

        return;

    }


    enquiryList.innerHTML =
        enquiries
            .map(
                enquiry => {

                    const reference =
                        escapeHTML(
                            enquiry.reference
                        );

                    const projectName =
                        escapeHTML(
                            enquiry.project_name
                        );

                    const projectType =
                        escapeHTML(
                            enquiry.project_type
                        );

                    const deadline =
                        escapeHTML(
                            enquiry.deadline
                        );

                    const status =
                        escapeHTML(
                            enquiry.status
                        );


                    return `
                        <article class="enquiry-item">

                            <div class="enquiry-reference">
                                ${reference}
                            </div>

                            <div class="enquiry-project">

                                <h3>
                                    ${projectName}
                                </h3>

                                <p>
                                    ${projectType}
                                    •
                                    ${deadline}
                                </p>

                            </div>

                            <div class="enquiry-status">
                                ${status}
                            </div>

                            <a
                                class="enquiry-view"
                                href="enquiry.html?ref=${encodeURIComponent(
                                    enquiry.reference
                                )}"
                            >
                                View →
                            </a>

                        </article>
                    `;

                }
            )
            .join("");

}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHTML(value) {

    const element =
        document.createElement(
            "div"
        );


    element.textContent =
        String(
            value ?? ""
        );


    return element.innerHTML;

}

// =========================================
// ACTIVE PROJECTS
// =========================================

async function loadActiveProjects() {

    try {

        const response =
            await fetch(
                "/api/admin/projects"
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Unable to load projects."
            );

        }


        const projects =
            data.projects || [];


        const active =
            projects.filter(
                project =>
                    project.status !==
                    "completed"
            );


        projectCount.textContent =
            active.length;


    } catch (error) {

        console.error(
            "Active projects error:",
            error
        );

    }

}


// =========================================
// START
// =========================================

loadDashboard();