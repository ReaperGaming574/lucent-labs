const loading =
    document.getElementById(
        "clientQuoteLoading"
    );

const error =
    document.getElementById(
        "clientQuoteError"
    );

const content =
    document.getElementById(
        "clientQuoteContent"
    );

    const acceptQuoteButton =
    document.getElementById(
        "acceptQuoteButton"
    );

const declineQuoteButton =
    document.getElementById(
        "declineQuoteButton"
    );

const quoteResponse =
    document.getElementById(
        "quoteResponse"
    );

const quoteResponseMessage =
    document.getElementById(
        "quoteResponseMessage"
    );


const params =
    new URLSearchParams(
        window.location.search
    );


const token =
    params.get("token");


async function loadClientQuote() {

    if (!token) {

        showError();
        return;

    }


    try {

        const response =
            await fetch(
                `/api/quote?token=${encodeURIComponent(
                    token
                )}`,
                {
                    cache:
                        "no-store"
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
                "Quote unavailable."
            );

        }


        const quote =
            data.quote;


        setText(
            "clientQuoteReference",
            quote.quote_reference
        );

        setText(
            "clientProjectName",
            quote.project_name
        );

        setText(
            "clientProjectType",
            quote.project_type
        );

        setText(
            "clientPrice",
            formatMoney(
                quote.price_pence
            )
        );

        setText(
            "clientDeposit",
            formatMoney(
                quote.deposit_pence
            )
        );

        setText(
            "clientTimescale",
            quote.estimated_timescale
        );

        setText(
            "clientScope",
            quote.scope
        );

        setText(
            "clientStatus",
            String(
                quote.status
            ).toUpperCase()
        );
        if (
    quote.status === "accepted" ||
    quote.status === "declined"
) {

    acceptQuoteButton.disabled =
        true;

    declineQuoteButton.disabled =
        true;


    quoteResponseMessage.hidden =
        false;


    quoteResponseMessage.textContent =
        quote.status === "accepted"
            ? "This quote has already been accepted."
            : "This quote has already been declined.";

}


        loading.hidden =
            true;

        content.hidden =
            false;


    } catch {

        showError();

    }

}


function formatMoney(pence) {

    return new Intl.NumberFormat(
        "en-GB",
        {
            style: "currency",
            currency: "GBP"
        }
    ).format(
        Number(pence || 0) /
        100
    );

}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            String(
                value ?? "—"
            );

    }

}


function showError() {

    loading.hidden =
        true;

    content.hidden =
        true;

    error.hidden =
        false;

}


loadClientQuote();

// =========================================
// QUOTE RESPONSE
// =========================================

async function respondToQuote(
    decision
) {

    acceptQuoteButton.disabled =
        true;

    declineQuoteButton.disabled =
        true;


    quoteResponseMessage.hidden =
        false;


    quoteResponseMessage.textContent =
        decision === "accepted"
            ? "Accepting quote..."
            : "Declining quote...";


    try {

        const response =
            await fetch(
                "/api/respond-quote",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            token:
                                token,

                            decision:
                                decision
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


        setText(
            "clientStatus",
            String(
                data.status
            ).toUpperCase()
        );


        if (
            data.status ===
            "accepted"
        ) {

            quoteResponseMessage.textContent =
                "Quote accepted. Lucent Labs will be in touch with the next steps.";

        }


        if (
            data.status ===
            "declined"
        ) {

            quoteResponseMessage.textContent =
                "Quote declined.";

        }


        quoteResponse.classList.add(
            "quote-response-complete"
        );


    } catch (error) {

        console.error(
            "Quote response error:",
            error
        );


        quoteResponseMessage.textContent =
            error.message ||
            "Unable to update quote.";


        acceptQuoteButton.disabled =
            false;

        declineQuoteButton.disabled =
            false;

    }

}


// =========================================
// BUTTONS
// =========================================

acceptQuoteButton.addEventListener(
    "click",
    () => {

        respondToQuote(
            "accepted"
        );

    }
);


declineQuoteButton.addEventListener(
    "click",
    () => {

        respondToQuote(
            "declined"
        );

    }
);