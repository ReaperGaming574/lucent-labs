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

const quoteForm =
    document.getElementById(
        "quoteForm"
    );

const quoteMessage =
    document.getElementById(
        "quoteMessage"
    );

const saveQuoteButton =
    document.getElementById(
        "saveQuoteButton"
    );


// =========================================
// REFERENCE
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


    enquiryLoading.hidden =
        true;

    enquiryError.hidden =
        true;

    enquiryContent.hidden =
        false;

}


// =========================================
// SAVE QUOTE
// =========================================

quoteForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const price =
            document.getElementById(
                "quotePrice"
            ).value;

        const deposit =
            document.getElementById(
                "quoteDeposit"
            ).value;

        const timescale =
            document.getElementById(
                "quoteTimescale"
            ).value.trim();

        const scope =
            document.getElementById(
                "quoteScope"
            ).value.trim();


        quoteMessage.textContent =
            "";


        if (
            !price ||
            !timescale ||
            !scope
        ) {

            quoteMessage.textContent =
                "Please complete all required quote fields.";

            return;

        }


        const priceNumber =
            Number(price);

        const depositNumber =
            deposit
                ? Number(deposit)
                : 0;


        if (
            !Number.isFinite(priceNumber) ||
            priceNumber <= 0
        ) {

            quoteMessage.textContent =
                "Enter a valid project price.";

            return;

        }


        if (
            !Number.isFinite(depositNumber) ||
            depositNumber < 0
        ) {

            quoteMessage.textContent =
                "Enter a valid deposit.";

            return;

        }


        if (
            depositNumber >
            priceNumber
        ) {

            quoteMessage.textContent =
                "The deposit cannot be greater than the project price.";

            return;

        }


        saveQuoteButton.disabled =
            true;

        saveQuoteButton.textContent =
            "Saving...";


        try {

            const response =
                await fetch(
                    "/api/admin/create-quote",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                enquiryReference:
                                    reference,

                                price:
                                    priceNumber,

                                deposit:
                                    depositNumber,

                                timescale:
                                    timescale,

                                scope:
                                    scope
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
                    "Unable to save quote."
                );

            }


            quoteMessage.textContent =
                `Draft saved — ${data.quoteReference}`;

            saveQuoteButton.textContent =
                "Draft Saved";


            setText(
                "enquiryStatus",
                "quoted"
            );


        } catch (error) {

            console.error(
                "Quote error:",
                error
            );


            quoteMessage.textContent =
                error.message ||
                "Unable to save quote.";


            saveQuoteButton.disabled =
                false;

            saveQuoteButton.textContent =
                "Save Draft";

        }

    }
);


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