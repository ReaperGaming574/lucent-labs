// =========================================
// LUCENT LABS STAFF PROJECT INBOX
// =========================================


// =========================================
// ELEMENTS
// =========================================

const newRequestCount =
    document.getElementById(
        "newRequestCount"
    );

const contactedCount =
    document.getElementById(
        "contactedCount"
    );

const inProgressCount =
    document.getElementById(
        "inProgressCount"
    );

const closedCount =
    document.getElementById(
        "closedCount"
    );

const projectInbox =
    document.getElementById(
        "projectInbox"
    );

const statusFilter =
    document.getElementById(
        "statusFilter"
    );

const refreshInbox =
    document.getElementById(
        "refreshInbox"
    );


// =========================================
// STATE
// =========================================

let enquiries =
    [];


// =========================================
// LOAD PROJECT INBOX
// =========================================

async function loadProjectInbox() {

    try {

        showLoading();


        const response =
            await fetch(
                "/api/admin/enquiries",
                {
                    method:
                        "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    },

                    cache:
                        "no-store"
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
                "Unable to load project requests."
            );

        }


        enquiries =
            Array.isArray(
                data.enquiries
            )
                ? data.enquiries
                : [];


        updateCounts();


        renderProjectInbox();

    } catch (error) {

        console.error(
            "Project inbox error:",
            error
        );


        setCountsUnavailable();


        projectInbox.innerHTML = `
            <div class="admin-empty">
                Unable to load project requests.
            </div>
        `;

    }

}


// =========================================
// UPDATE COUNTS
// =========================================

function updateCounts() {

    const counts = {

        new:
            0,

        contacted:
            0,

        in_progress:
            0,

        closed:
            0

    };


    for (
        const enquiry
        of enquiries
    ) {

        const status =
            normaliseStatus(
                enquiry.status
            );


        if (
            Object.prototype.hasOwnProperty.call(
                counts,
                status
            )
        ) {

            counts[
                status
            ]++;

        }

    }


    newRequestCount.textContent =
        counts.new;


    contactedCount.textContent =
        counts.contacted;


    inProgressCount.textContent =
        counts.in_progress;


    closedCount.textContent =
        counts.closed;

}


// =========================================
// RENDER PROJECT INBOX
// =========================================

function renderProjectInbox() {

    const selectedStatus =
        statusFilter?.value ||
        "all";


    const filtered =
        selectedStatus ===
            "all"

            ? enquiries

            : enquiries.filter(
                enquiry =>
                    normaliseStatus(
                        enquiry.status
                    ) ===
                    selectedStatus
            );


    if (!filtered.length) {

        projectInbox.innerHTML = `
            <div class="admin-empty">
                No project requests found.
            </div>
        `;

        return;

    }


    const sorted =
        [...filtered]
            .sort(
                (a, b) => {

                    const dateA =
                        new Date(
                            a.created_at ||
                            0
                        ).getTime();


                    const dateB =
                        new Date(
                            b.created_at ||
                            0
                        ).getTime();


                    return (
                        dateB -
                        dateA
                    );

                }
            );


    projectInbox.innerHTML =
        sorted
            .map(
                enquiry =>
                    createProjectRequestHTML(
                        enquiry
                    )
            )
            .join("");

}


// =========================================
// CREATE PROJECT REQUEST
// =========================================

function createProjectRequestHTML(
    enquiry
) {

    const reference =
        escapeHTML(
            enquiry.reference ||
            "No reference"
        );


    const projectName =
        escapeHTML(
            enquiry.project_name ||
            "Untitled Project"
        );


    const projectType =
        escapeHTML(
            formatProjectType(
                enquiry.project_type
            )
        );


    const budget =
        escapeHTML(
            enquiry.budget ||
            enquiry.budget_range ||
            "Budget not provided"
        );


    const name =
        escapeHTML(
            enquiry.name ||
            enquiry.client_name ||
            "Unknown Client"
        );


    const status =
        normaliseStatus(
            enquiry.status
        );


    const statusLabel =
        escapeHTML(
            getStatusLabel(
                status
            )
        );


    const received =
        escapeHTML(
            formatDate(
                enquiry.created_at
            )
        );


    const deadline =
        enquiry.deadline
            ? escapeHTML(
                enquiry.deadline
            )
            : null;


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
                    ${budget}
                </p>

                <p>
                    ${name}
                    •
                    Received ${received}
                    ${
                        deadline
                            ? `• Deadline ${deadline}`
                            : ""
                    }
                </p>

            </div>

            <div
                class="enquiry-status"
                data-status="${escapeHTML(
                    status
                )}"
            >
                ${statusLabel}
            </div>

            <a
                class="enquiry-view"
                href="enquiry.html?ref=${encodeURIComponent(
                    enquiry.reference ||
                    ""
                )}"
            >
                Open →
            </a>

        </article>
    `;

}


// =========================================
// STATUS
// =========================================

function normaliseStatus(
    value
) {

    const status =
        String(
            value ||
            ""
        )
            .trim()
            .toLowerCase()
            .replace(
                /[\s-]+/g,
                "_"
            );


    switch (status) {

        case "contacted":
            return "contacted";

        case "in_progress":
        case "active":
        case "accepted":
            return "in_progress";

        case "closed":
        case "completed":
        case "declined":
        case "cancelled":
            return "closed";

        case "new":
        case "pending":
        case "received":
        default:
            return "new";

    }

}


function getStatusLabel(
    status
) {

    switch (status) {

        case "contacted":
            return "Contacted";

        case "in_progress":
            return "In Progress";

        case "closed":
            return "Closed";

        default:
            return "New";

    }

}


// =========================================
// PROJECT TYPE
// =========================================

function formatProjectType(
    value
) {

    if (!value) {

        return "Project";

    }


    return String(
        value
    )
        .replace(
            /[_-]+/g,
            " "
        )
        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );

}


// =========================================
// DATE
// =========================================

function formatDate(
    value
) {

    if (!value) {

        return "Unknown date";

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            value
        );

    }


    return date.toLocaleDateString(
        "en-GB",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"
        }
    );

}


// =========================================
// LOADING
// =========================================

function showLoading() {

    projectInbox.innerHTML = `
        <div class="admin-loading">

            <span class="loading-dot"></span>

            Loading project requests...

        </div>
    `;

}


// =========================================
// ERROR COUNTS
// =========================================

function setCountsUnavailable() {

    newRequestCount.textContent =
        "—";


    contactedCount.textContent =
        "—";


    inProgressCount.textContent =
        "—";


    closedCount.textContent =
        "—";

}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHTML(
    value
) {

    const element =
        document.createElement(
            "div"
        );


    element.textContent =
        String(
            value ??
            ""
        );


    return element.innerHTML;

}


// =========================================
// FILTER
// =========================================

if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        renderProjectInbox
    );

}


// =========================================
// REFRESH
// =========================================

if (refreshInbox) {

    refreshInbox.addEventListener(
        "click",
        loadProjectInbox
    );

}


// =========================================
// START
// =========================================

loadProjectInbox();