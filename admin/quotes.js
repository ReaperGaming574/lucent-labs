// =========================================
// LUCENT LABS
// ADMIN QUOTES
// =========================================

const quotesLoading =
    document.getElementById(
        "quotesLoading"
    );

const quotesError =
    document.getElementById(
        "quotesError"
    );

const quotesEmpty =
    document.getElementById(
        "quotesEmpty"
    );

const quotesList =
    document.getElementById(
        "quotesList"
    );

const quoteSearch =
    document.getElementById(
        "quoteSearch"
    );


let allQuotes = [];


// =========================================
// LOAD QUOTES
// =========================================

async function loadQuotes() {

    try {

        const response =
            await fetch(
                "/api/admin/quotes",
                {
                    method: "GET",

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
            !Array.isArray(data.quotes)
        ) {

            throw new Error(
                data.error ||
                "Unable to load quotes."
            );

        }


        allQuotes =
            data.quotes;


        updateStatistics(
            allQuotes
        );


        renderQuotes(
            allQuotes
        );


    } catch (error) {

        console.error(
            "Quotes error:",
            error
        );


        quotesLoading.hidden =
            true;

        quotesList.hidden =
            true;

        quotesEmpty.hidden =
            true;

        quotesError.hidden =
            false;

    }

}


// =========================================
// STATISTICS
// =========================================

function updateStatistics(quotes) {

    const total =
        quotes.length;


    const drafts =
        quotes.filter(
            quote =>
                quote.status ===
                "draft"
        ).length;


    const sent =
        quotes.filter(
            quote =>
                quote.status ===
                "sent"
        ).length;


    const accepted =
        quotes.filter(
            quote =>
                quote.status ===
                "accepted"
        ).length;


    setText(
        "totalQuotes",
        total
    );

    setText(
        "draftQuotes",
        drafts
    );

    setText(
        "sentQuotes",
        sent
    );

    setText(
        "acceptedQuotes",
        accepted
    );

}


// =========================================
// RENDER
// =========================================

function renderQuotes(quotes) {

    quotesLoading.hidden =
        true;

    quotesError.hidden =
        true;


    quotesList.replaceChildren();


    if (quotes.length === 0) {

        quotesList.hidden =
            true;

        quotesEmpty.hidden =
            false;

        return;

    }


    quotesEmpty.hidden =
        true;

    quotesList.hidden =
        false;


    for (const quote of quotes) {

        const card =
            createQuoteCard(
                quote
            );


        quotesList.appendChild(
            card
        );

    }

}


// =========================================
// CREATE CARD
// =========================================

function createQuoteCard(quote) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "admin-quote-card";


    // =====================================
    // TOP
    // =====================================

    const top =
        document.createElement(
            "div"
        );


    top.className =
        "admin-quote-top";


    const identity =
        document.createElement(
            "div"
        );


    const reference =
        document.createElement(
            "p"
        );


    reference.className =
        "admin-quote-reference";


    reference.textContent =
        quote.quote_reference;


    const project =
        document.createElement(
            "h3"
        );


    project.textContent =
        quote.project_name ||
        "Untitled Project";


    const client =
        document.createElement(
            "p"
        );


    client.className =
        "admin-quote-client";


    client.textContent =
        quote.client_name ||
        "Unknown Client";


    identity.append(
        reference,
        project,
        client
    );


    const status =
        document.createElement(
            "span"
        );


    status.className =
        `admin-quote-status status-${normaliseStatus(
            quote.status
        )}`;


    status.textContent =
        String(
            quote.status ||
            "draft"
        ).toUpperCase();


    top.append(
        identity,
        status
    );


    // =====================================
    // DETAILS
    // =====================================

    const details =
        document.createElement(
            "div"
        );


    details.className =
        "admin-quote-details";


    details.append(
        createDetail(
            "PROJECT PRICE",
            formatMoney(
                quote.price_pence
            )
        ),

        createDetail(
            "DEPOSIT",
            formatMoney(
                quote.deposit_pence
            )
        ),

        createDetail(
            "TIMESCALE",
            quote.estimated_timescale ||
            "Not specified"
        ),

        createDetail(
            "ENQUIRY",
            quote.enquiry_reference
        )
    );


    // =====================================
    // FOOTER
    // =====================================

    const footer =
        document.createElement(
            "div"
        );


    footer.className =
        "admin-quote-footer";


    const date =
        document.createElement(
            "span"
        );


    date.textContent =
        `Created ${formatDate(
            quote.created_at
        )}`;


    const view =
        document.createElement(
            "a"
        );


    view.href =
        `/admin/quote.html?ref=${encodeURIComponent(
            quote.quote_reference
        )}`;


    view.textContent =
        "View →";


    footer.append(
        date,
        view
    );


    card.append(
        top,
        details,
        footer
    );


    return card;

}


// =========================================
// DETAIL
// =========================================

function createDetail(
    label,
    value
) {

    const item =
        document.createElement(
            "div"
        );


    const labelElement =
        document.createElement(
            "span"
        );


    labelElement.textContent =
        label;


    const valueElement =
        document.createElement(
            "strong"
        );


    valueElement.textContent =
        value ?? "—";


    item.append(
        labelElement,
        valueElement
    );


    return item;

}


// =========================================
// SEARCH
// =========================================

quoteSearch.addEventListener(
    "input",
    () => {

        const search =
            quoteSearch.value
                .trim()
                .toLowerCase();


        if (!search) {

            renderQuotes(
                allQuotes
            );

            return;

        }


        const filtered =
            allQuotes.filter(
                quote => {

                    const values = [

                        quote.quote_reference,
                        quote.enquiry_reference,
                        quote.project_name,
                        quote.project_type,
                        quote.client_name,
                        quote.status

                    ];


                    return values.some(
                        value =>
                            String(
                                value || ""
                            )
                                .toLowerCase()
                                .includes(
                                    search
                                )
                    );

                }
            );


        renderQuotes(
            filtered
        );

    }
);


// =========================================
// MONEY
// =========================================

function formatMoney(pence) {

    const amount =
        Number(pence || 0) /
        100;


    return new Intl.NumberFormat(
        "en-GB",
        {
            style:
                "currency",

            currency:
                "GBP"
        }
    ).format(
        amount
    );

}


// =========================================
// DATE
// =========================================

function formatDate(value) {

    if (!value) {
        return "—";
    }


    const normalised =
        String(value)
            .includes("T")
            ? String(value)
            : String(value)
                .replace(
                    " ",
                    "T"
                ) + "Z";


    const date =
        new Date(
            normalised
        );


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
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"
        }
    ).format(
        date
    );

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
// START
// =========================================

loadQuotes();