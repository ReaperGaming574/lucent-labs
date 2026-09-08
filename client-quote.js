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