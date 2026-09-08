// =========================================
// LUCENT LABS
// ADMIN ENQUIRY VIEWER
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


// =========================================
// GET REFERENCE FROM URL
// =========================================

const params =
    new URLSearchParams(
        window.location.search
    );

const reference =
    params.get("ref");


// =========================================
// LOAD ENQUIRY
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


        if (
            !data.success ||
            !data.enquiry
        ) {

            throw new Error(
                data.error ||
                "Enquiry not found."
            );

        }


        renderEnquiry(
            data.enquiry
        );


    } catch (error) {

        console.error(
            "Enquiry error:",
            error
        );


        showError();

    }

}


// =========================================
// RENDER ENQUIRY
// =========================================

function renderEnquiry(enquiry) {

    setText(
        "enquiryReference",
        enquiry.reference
    );

    setText(
        "enquiryProjectName",
        enquiry.project_name
    );

    setText(
        "enquiryProjectType",
        enquiry.project_type
    );

    setText(
        "enquiryStatus",
        enquiry.status
    );


    // =====================================
    // CLIENT
    // =====================================

    setText(
        "clientName",
        enquiry.client_name
    );

    setText(
        "clientEmail",
        enquiry.email
    );

    setText(
        "clientDiscord",
        enquiry.discord ||
        "Not provided"
    );


    // =====================================
    // PROJECT
    // =====================================

    setText(
        "projectBudget",
        enquiry.budget
    );

    setText(
        "projectDeadline",
        enquiry.deadline
    );

    setText(
        "projectDescription",
        enquiry.project_description
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


    // =====================================
    // SHOW CONTENT
    // =====================================

    enquiryLoading.hidden =
        true;

    enquiryError.hidden =
        true;

    enquiryContent.hidden =
        false;

}


// =========================================
// SET TEXT SAFELY
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
            value ?? "—"
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