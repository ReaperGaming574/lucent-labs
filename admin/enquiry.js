// =========================================
// LUCENT LABS
// STAFF PROJECT REQUEST VIEWER
// =========================================


// =========================================
// ELEMENTS
// =========================================

const enquiryLoading =
    document.getElementById(
        "enquiryLoading"
    );

const enquiryError =
    document.getElementById(
        "enquiryError"
    );

const enquiryContent =
    document.getElementById(
        "enquiryContent"
    );

const requestStatus =
    document.getElementById(
        "requestStatus"
    );

const staffNotes =
    document.getElementById(
        "staffNotes"
    );

const requestMessage =
    document.getElementById(
        "requestMessage"
    );

const saveRequestButton =
    document.getElementById(
        "saveRequestButton"
    );


// =========================================
// REFERENCE
// =========================================

const params =
    new URLSearchParams(
        window.location.search
    );

const reference =
    params.get(
        "ref"
    );


// =========================================
// STATE
// =========================================

let currentEnquiry =
    null;


// =========================================
// LOAD PROJECT REQUEST
// =========================================

async function loadEnquiry() {

    if (!reference) {

        showError();
        return;

    }


    try {

        const response =
            await fetch(
                `/api/admin/enquiry?ref=${encodeURIComponent(
                    reference
                )}`,
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


        if (
            !data.success ||
            !data.enquiry
        ) {

            throw new Error(
                data.error ||
                "Project request not found."
            );

        }


        currentEnquiry =
            data.enquiry;


        renderEnquiry(
            currentEnquiry
        );


    } catch (error) {

        console.error(
            "Project request error:",
            error
        );


        showError();

    }

}


// =========================================
// RENDER PROJECT REQUEST
// =========================================

function renderEnquiry(
    enquiry
) {

    const status =
        normaliseStatus(
            enquiry.status
        );


    setText(
        "enquiryReference",
        enquiry.reference
    );


    setText(
        "requestReference",
        enquiry.reference
    );


    setText(
        "enquiryProjectName",
        enquiry.project_name ||
        "Untitled Project"
    );


    setText(
        "enquiryProjectType",
        formatProjectType(
            enquiry.project_type
        )
    );


    setText(
        "enquiryStatus",
        getStatusLabel(
            status
        )
    );


    setText(
        "clientName",
        enquiry.client_name ||
        "Not provided"
    );


    setText(
        "clientEmail",
        enquiry.email ||
        "Not provided"
    );


    setText(
        "clientDiscord",
        enquiry.discord ||
        "Not provided"
    );


    setText(
        "projectBudget",
        enquiry.budget ||
        "Not provided"
    );


    setText(
        "projectDeadline",
        enquiry.deadline ||
        "Not provided"
    );


    setText(
        "projectDescription",
        enquiry.project_description ||
        "Not provided"
    );


    setText(
        "projectFeatures",
        enquiry.project_features ||
        "Not provided"
    );


    setText(
        "projectReferences",
        enquiry.project_references ||
        "Not provided"
    );


    setText(
        "requestCreatedAt",
        formatDate(
            enquiry.created_at
        )
    );


    if (requestStatus) {

        requestStatus.value =
            status;

    }


    if (staffNotes) {

        staffNotes.value =
            enquiry.staff_notes ||
            "";

    }


    enquiryLoading.hidden =
        true;

    enquiryError.hidden =
        true;

    enquiryContent.hidden =
        false;

}


// =========================================
// SAVE REQUEST
// =========================================

if (saveRequestButton) {

    saveRequestButton.addEventListener(
        "click",
        saveRequestChanges
    );

}


async function saveRequestChanges() {

    if (
        !reference ||
        !requestStatus
    ) {

        return;

    }


    const status =
        requestStatus.value;


    const notes =
        staffNotes
            ? staffNotes.value.trim()
            : "";


    clearMessage();


    saveRequestButton.disabled =
        true;

    saveRequestButton.textContent =
        "Saving...";


    try {

        const response =
            await fetch(
                "/api/admin/enquiry",
                {
                    method:
                        "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            reference:
                                reference,

                            status:
                                status,

                            staffNotes:
                                notes
                        })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Unable to save request."
            );

        }


        if (data.enquiry) {

            currentEnquiry =
                data.enquiry;

        } else {

            currentEnquiry = {
                ...currentEnquiry,

                status:
                    status,

                staff_notes:
                    notes
            };

        }


        setText(
            "enquiryStatus",
            getStatusLabel(
                normaliseStatus(
                    status
                )
            )
        );


        showMessage(
            "Changes saved."
        );


        saveRequestButton.textContent =
            "Saved ✓";


        setTimeout(
            () => {

                saveRequestButton.disabled =
                    false;

                saveRequestButton.textContent =
                    "Save Changes";

            },
            1200
        );


    } catch (error) {

        console.error(
            "Save project request error:",
            error
        );


        showMessage(
            error.message ||
            "Unable to save changes."
        );


        saveRequestButton.disabled =
            false;

        saveRequestButton.textContent =
            "Save Changes";

    }

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

        return "Unknown";

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


    return date.toLocaleString(
        "en-GB",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );

}


// =========================================
// MESSAGE
// =========================================

function showMessage(
    message
) {

    if (!requestMessage) {

        return;

    }


    requestMessage.textContent =
        message;

}


function clearMessage() {

    if (!requestMessage) {

        return;

    }


    requestMessage.textContent =
        "";

}


// =========================================
// SET TEXT
// =========================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    element.textContent =
        String(
            value ??
            "—"
        );

}


// =========================================
// ERROR
// =========================================

function showError() {

    enquiryLoading.hidden =
        true;

    enquiryContent.hidden =
        true;

    enquiryError.hidden =
        false;

}


// =========================================
// START
// =========================================

loadEnquiry();