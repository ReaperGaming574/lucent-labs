const params =
    new URLSearchParams(
        window.location.search
    );


const reference =
    params.get(
        "reference"
    );


const loading =
    document.getElementById(
        "projectLoading"
    );

const errorBox =
    document.getElementById(
        "projectError"
    );

const content =
    document.getElementById(
        "projectContent"
    );

const message =
    document.getElementById(
        "projectMessage"
    );


function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value ?? "—";

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
        Number(
            pence || 0
        ) / 100
    );

}


function formatStatus(status) {

    const statuses = {

        awaiting_deposit:
            "Awaiting Deposit",

        ready:
            "Ready",

        in_progress:
            "In Progress",

        review:
            "In Review",

        completed:
            "Completed"

    };


    return (
        statuses[status] ||
        status ||
        "Unknown"
    );

}


function formatDate(value) {

    if (!value) {

        return "—";

    }


    const date =
        new Date(
            value.endsWith("Z")
                ? value
                : value + "Z"
        );


    return new Intl.DateTimeFormat(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(date);

}


function formatPaymentStatus(status) {

    const statuses = {

        unpaid:
            "UNPAID",

        payment_pending:
            "PAYMENT PENDING",

        deposit_paid:
            "DEPOSIT PAID",

        paid_in_full:
            "PAID IN FULL",

        refunded:
            "REFUNDED"

    };


    return (
        statuses[status] ||
        "UNPAID"
    );

}


function formatPaymentMethod(method) {

    const methods = {

        stripe:
            "Card / Stripe",

        bank_transfer:
            "Bank Transfer",

        cash:
            "Cash",

        other:
            "Other"

    };


    return (
        methods[method] ||
        "Not selected"
    );

}

function renderProject(project) {

    setText(
        "projectName",
        project.project_name
    );

    setText(
        "projectReference",
        project.project_reference
    );

    setText(
        "projectClient",
        project.client_name
    );

    setText(
        "projectEmail",
        project.client_email
    );

    setText(
        "projectType",
        project.project_type
    );

    setText(
        "projectPrice",
        formatMoney(
            project.price_pence
        )
    );

    setText(
        "projectDeposit",
        formatMoney(
            project.deposit_pence
        )
    );

    setText(
        "projectTimescale",
        project.estimated_timescale ||
        "Flexible"
    );

    setText(
        "projectCreated",
        formatDate(
            project.created_at
        )
    );

    setText(
        "projectScope",
        project.scope
    );

    setText(
        "projectStatus",
        formatStatus(
            project.status
        )
    );

    // =========================================
// PAYMENT
// =========================================

const total =
    Number(
        project.price_pence || 0
    );

const deposit =
    Number(
        project.deposit_pence || 0
    );

const paid =
    Number(
        project.amount_paid_pence || 0
    );

const remaining =
    Math.max(
        total - paid,
        0
    );


setText(
    "paymentTotal",
    formatMoney(total)
);

setText(
    "paymentDeposit",
    formatMoney(deposit)
);

setText(
    "paymentPaid",
    formatMoney(paid)
);

setText(
    "paymentRemaining",
    formatMoney(remaining)
);


setText(
    "paymentStatus",
    formatPaymentStatus(
        project.payment_status
    )
);


setText(
    "paymentMethod",
    formatPaymentMethod(
        project.payment_method
    )
);

}


async function loadProject() {

    try {

        const response =
            await fetch(
                `/api/admin/project?reference=${encodeURIComponent(
                    reference
                )}`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Unable to load project."
            );

        }


        renderProject(
            data.project
        );


        loading.hidden =
            true;

        content.hidden =
            false;


    } catch (error) {

        console.error(
            error
        );


        loading.hidden =
            true;

        errorBox.hidden =
            false;

    }

}


async function updateStatus(status) {

    message.hidden =
        false;

    message.textContent =
        "Updating project...";


    try {

        const response =
            await fetch(
                "/api/admin/update-project",
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            reference:
                                reference,

                            status:
                                status
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
                "Unable to update project."
            );

        }


        setText(
            "projectStatus",
            formatStatus(
                data.status
            )
        );


        message.textContent =
            `Project updated to ${formatStatus(
                data.status
            )}.`;


    } catch (error) {

        console.error(
            error
        );


        message.textContent =
            error.message;

    }

}


document
    .querySelectorAll(
        "[data-status]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    updateStatus(
                        button.dataset.status
                    );

                }
            );

        }
    );


loadProject();