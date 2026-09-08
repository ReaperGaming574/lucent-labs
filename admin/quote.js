// =========================================
// LUCENT LABS
// ADMIN QUOTE VIEWER
// =========================================

const quoteLoading =
    document.getElementById("quoteLoading");

const quoteError =
    document.getElementById("quoteError");

const quoteContent =
    document.getElementById("quoteContent");

const quoteEditForm =
    document.getElementById("quoteEditForm");

const quoteEditMessage =
    document.getElementById("quoteEditMessage");

const saveChangesButton =
    document.getElementById("saveChangesButton");

const sendQuoteButton =
    document.getElementById(
        "sendQuoteButton"
    );

const clientLinkBox =
    document.getElementById(
        "clientLinkBox"
    );

const clientQuoteLink =
    document.getElementById(
        "clientQuoteLink"
    );

const copyQuoteLinkButton =
    document.getElementById(
        "copyQuoteLinkButton"
    );    


// =========================================
// REFERENCE
// =========================================

const params =
    new URLSearchParams(
        window.location.search
    );

const quoteReference =
    params.get("ref");


// =========================================
// LOAD QUOTE
// =========================================

async function loadQuote() {

    if (!quoteReference) {

        showError();
        return;

    }


    try {

        const response =
            await fetch(
                `/api/admin/quote?ref=${encodeURIComponent(
                    quoteReference
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


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success ||
            !data.quote
        ) {

            throw new Error(
                data.error ||
                "Quote not found."
            );

        }


        renderQuote(
            data.quote
        );


    } catch (error) {

        console.error(
            "Quote error:",
            error
        );

        showError();

    }

}


// =========================================
// RENDER
// =========================================

function renderQuote(quote) {

    setText(
        "quoteReference",
        quote.quote_reference
    );

    setText(
        "quoteProjectName",
        quote.project_name ||
        "Untitled Project"
    );

    setText(
        "quoteClient",
        quote.client_name ||
        "Unknown Client"
    );

    setText(
        "quoteEnquiry",
        quote.enquiry_reference
    );

    setText(
        "quoteProjectType",
        quote.project_type ||
        "—"
    );

    setText(
        "quoteCreated",
        formatDate(
            quote.created_at
        )
    );


    // =====================================
    // STATUS
    // =====================================

    const statusElement =
        document.getElementById(
            "quoteStatus"
        );


    statusElement.textContent =
        String(
            quote.status ||
            "draft"
        ).toUpperCase();


    statusElement.className =
        `admin-quote-status status-${normaliseStatus(
            quote.status
        )}`;


    // =====================================
    // FORM
    // =====================================

    document.getElementById(
        "editPrice"
    ).value =
        (
            Number(
                quote.price_pence || 0
            ) / 100
        ).toFixed(2);


    document.getElementById(
        "editDeposit"
    ).value =
        (
            Number(
                quote.deposit_pence || 0
            ) / 100
        ).toFixed(2);


    document.getElementById(
        "editTimescale"
    ).value =
        quote.estimated_timescale || "";


    document.getElementById(
        "editScope"
    ).value =
        quote.scope || "";


    quoteLoading.hidden =
        true;

    quoteError.hidden =
        true;

    quoteContent.hidden =
        false;

}


// =========================================
// SAVE CHANGES
// =========================================

quoteEditForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        quoteEditMessage.textContent =
            "";


        const price =
            Number(
                document.getElementById(
                    "editPrice"
                ).value
            );


        const deposit =
            Number(
                document.getElementById(
                    "editDeposit"
                ).value || 0
            );


        const timescale =
            document.getElementById(
                "editTimescale"
            ).value.trim();


        const scope =
            document.getElementById(
                "editScope"
            ).value.trim();


        // =====================================
        // VALIDATION
        // =====================================

        if (
            !Number.isFinite(price) ||
            price <= 0
        ) {

            quoteEditMessage.textContent =
                "Enter a valid project price.";

            return;

        }


        if (
            !Number.isFinite(deposit) ||
            deposit < 0 ||
            deposit > price
        ) {

            quoteEditMessage.textContent =
                "Enter a valid deposit.";

            return;

        }


        if (
            !timescale ||
            !scope
        ) {

            quoteEditMessage.textContent =
                "Complete the timescale and scope.";

            return;

        }


        saveChangesButton.disabled =
            true;

        saveChangesButton.textContent =
            "Saving...";


        try {

            const response =
                await fetch(
                    "/api/admin/update-quote",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                quoteReference:
                                    quoteReference,

                                price:
                                    price,

                                deposit:
                                    deposit,

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
                    "Unable to update quote."
                );

            }


            quoteEditMessage.textContent =
                "Changes saved.";

            saveChangesButton.textContent =
                "Saved";


            window.setTimeout(
                () => {

                    saveChangesButton.disabled =
                        false;

                    saveChangesButton.textContent =
                        "Save Changes";

                },
                1200
            );


        } catch (error) {

            console.error(
                "Update quote error:",
                error
            );


            quoteEditMessage.textContent =
                error.message ||
                "Unable to save changes.";


            saveChangesButton.disabled =
                false;

            saveChangesButton.textContent =
                "Save Changes";

        }

    }
);


// =========================================
// DATE
// =========================================

function formatDate(value) {

    if (!value) {
        return "—";
    }


    const normalised =
        String(value).includes("T")
            ? String(value)
            : String(value)
                .replace(" ", "T") + "Z";


    const date =
        new Date(normalised);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }


    return new Intl.DateTimeFormat(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(date);

}


// =========================================
// STATUS
// =========================================

function normaliseStatus(status) {

    return String(
        status || "draft"
    )
        .toLowerCase()
        .replace(
            /[^a-z0-9_-]/g,
            ""
        );

}


// =========================================
// TEXT
// =========================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


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

    quoteLoading.hidden =
        true;

    quoteContent.hidden =
        true;

    quoteError.hidden =
        false;

}

// =========================================
// SEND QUOTE
// =========================================

sendQuoteButton.addEventListener(
    "click",
    async () => {

        sendQuoteButton.disabled =
            true;

        sendQuoteButton.textContent =
            "Generating Link...";

        quoteEditMessage.textContent =
            "";


        try {

            const response =
                await fetch(
                    "/api/admin/send-quote",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                quoteReference:
                                    quoteReference
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
                    "Unable to send quote."
                );

            }


            clientQuoteLink.value =
                data.clientURL;


            clientLinkBox.hidden =
                false;


            sendQuoteButton.textContent =
                "Quote Sent";


            sendQuoteButton.disabled =
                false;


            const statusElement =
                document.getElementById(
                    "quoteStatus"
                );


            statusElement.textContent =
                "SENT";


            statusElement.className =
                "admin-quote-status status-sent";


            quoteEditMessage.textContent =
                "Quote marked as sent. Client link generated.";


        } catch (error) {

            console.error(
                "Send quote error:",
                error
            );


            quoteEditMessage.textContent =
                error.message ||
                "Unable to send quote.";


            sendQuoteButton.disabled =
                false;

            sendQuoteButton.textContent =
                "Send Quote";

        }

    }
);


// =========================================
// COPY CLIENT LINK
// =========================================

copyQuoteLinkButton.addEventListener(
    "click",
    async () => {

        try {

            await navigator.clipboard.writeText(
                clientQuoteLink.value
            );


            copyQuoteLinkButton.textContent =
                "Copied";


            window.setTimeout(
                () => {

                    copyQuoteLinkButton.textContent =
                        "Copy Link";

                },
                1200
            );


        } catch {

            clientQuoteLink.select();

        }

    }
);

// =========================================
// START
// =========================================

loadQuote();