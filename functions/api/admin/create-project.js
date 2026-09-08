export async function onRequestPost(context) {

    try {

        const database =
            context.env.DB;


        if (!database) {

            return jsonResponse(
                {
                    success: false,
                    error: "Database is not configured."
                },
                500
            );

        }


        const data =
            await context.request.json();


        const quoteReference =
            String(
                data.quoteReference || ""
            )
                .trim()
                .slice(0, 100);


        if (!quoteReference) {

            return jsonResponse(
                {
                    success: false,
                    error: "Quote reference is required."
                },
                400
            );

        }


        // =========================================
        // LOAD ACCEPTED QUOTE
        // =========================================

        const quote =
            await database
                .prepare(
                    `
                    SELECT

                        q.quote_reference,
                        q.enquiry_reference,
                        q.price_pence,
                        q.deposit_pence,
                        q.scope,
                        q.estimated_timescale,
                        q.status,

                        e.project_name,
                        e.project_type,
                        e.client_name,
                        e.email

                    FROM quotes q

                    LEFT JOIN enquiries e
                        ON e.reference =
                           q.enquiry_reference

                    WHERE q.quote_reference = ?

                    LIMIT 1
                    `
                )
                .bind(
                    quoteReference
                )
                .first();


        if (!quote) {

            return jsonResponse(
                {
                    success: false,
                    error: "Quote not found."
                },
                404
            );

        }


        if (
            quote.status !== "accepted"
        ) {

            return jsonResponse(
                {
                    success: false,
                    error:
                        "Only accepted quotes can become projects."
                },
                409
            );

        }


        // =========================================
        // PREVENT DUPLICATES
        // =========================================

        const existingProject =
            await database
                .prepare(
                    `
                    SELECT project_reference

                    FROM projects

                    WHERE quote_reference = ?

                    LIMIT 1
                    `
                )
                .bind(
                    quoteReference
                )
                .first();


        if (existingProject) {

            return jsonResponse(
                {
                    success: false,
                    error:
                        "A project already exists for this quote.",
                    projectReference:
                        existingProject.project_reference
                },
                409
            );

        }


        // =========================================
        // GENERATE PROJECT REFERENCE
        // =========================================

        const projectReference =
            generateProjectReference();


        // =========================================
        // CREATE PROJECT
        // =========================================

        await database
            .prepare(
                `
                INSERT INTO projects (
                    project_reference,
                    quote_reference,
                    enquiry_reference,
                    project_name,
                    project_type,
                    client_name,
                    client_email,
                    price_pence,
                    deposit_pence,
                    scope,
                    estimated_timescale,
                    status
                )

                VALUES (
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?
                )
                `
            )
            .bind(
                projectReference,
                quote.quote_reference,
                quote.enquiry_reference,
                quote.project_name ||
                    "Untitled Project",
                quote.project_type || null,
                quote.client_name ||
                    "Unknown Client",
                quote.email || null,
                Number(
                    quote.price_pence || 0
                ),
                Number(
                    quote.deposit_pence || 0
                ),
                quote.scope,
                quote.estimated_timescale ||
                    null,
                "awaiting_deposit"
            )
            .run();


        // =========================================
        // UPDATE ENQUIRY
        // =========================================

        await database
            .prepare(
                `
                UPDATE enquiries

                SET
                    status = 'project',
                    updated_at = CURRENT_TIMESTAMP

                WHERE reference = ?
                `
            )
            .bind(
                quote.enquiry_reference
            )
            .run();


        return jsonResponse(
            {
                success: true,
                projectReference:
                    projectReference
            },
            201
        );


    } catch (error) {

        console.error(
            "Create project error:",
            error
        );


        return jsonResponse(
            {
                success: false,
                error:
                    "Unable to create project."
            },
            500
        );

    }

}


// =========================================
// PROJECT REFERENCE
// =========================================

function generateProjectReference() {

    const year =
        String(
            new Date()
                .getUTCFullYear()
        ).slice(-2);


    const random =
        crypto.getRandomValues(
            new Uint32Array(1)
        )[0] % 1000000;


    return (
        `LP-${year}-` +
        String(random)
            .padStart(6, "0")
    );

}


// =========================================
// JSON RESPONSE
// =========================================

function jsonResponse(
    body,
    status = 200
) {

    return new Response(
        JSON.stringify(body),
        {
            status: status,

            headers: {
                "Content-Type":
                    "application/json",

                "Cache-Control":
                    "no-store"
            }
        }
    );

}