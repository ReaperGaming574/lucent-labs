// =========================================
// LUCENT LABS
// CLIENT QUOTE RESPONSE
// =========================================

export async function onRequestPost(context) {
    try {
        const database =
            context.env.DB;


        if (!database) {
            return jsonResponse(
                {
                    success: false,
                    error:
                        "Database is unavailable."
                },
                500
            );
        }


        const body =
            await context.request.json();


        const token =
            String(
                body.token || ""
            )
                .trim()
                .slice(0, 200);


        const decision =
            String(
                body.decision || ""
            )
                .trim()
                .toLowerCase();


        if (!token) {
            return jsonResponse(
                {
                    success: false,
                    error:
                        "Quote token is required."
                },
                400
            );
        }


        if (
            decision !== "accepted" &&
            decision !== "declined"
        ) {
            return jsonResponse(
                {
                    success: false,
                    error:
                        "Invalid quote response."
                },
                400
            );
        }


        // =========================================
        // LOAD QUOTE
        // =========================================

        const quote =
            await database
                .prepare(`
                    SELECT

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

                    FROM quotes

                    WHERE client_token = ?

                    LIMIT 1
                `)
                .bind(token)
                .first();


        if (!quote) {
            return jsonResponse(
                {
                    success: false,
                    error:
                        "Quote not found."
                },
                404
            );
        }


        // =========================================
        // ALREADY RESPONDED
        // =========================================

        if (
            quote.status === "accepted" ||
            quote.status === "declined"
        ) {
            return jsonResponse({
                success: true,
                status:
                    quote.status,
                alreadyResponded:
                    true
            });
        }


        if (
            quote.status !== "sent"
        ) {
            return jsonResponse(
                {
                    success: false,
                    error:
                        "This quote cannot currently be updated."
                },
                409
            );
        }


        // =========================================
        // DECLINE
        // =========================================

        if (
            decision === "declined"
        ) {
            await database
                .prepare(`
                    UPDATE quotes

                    SET
                        status =
                            'declined',

                        declined_at =
                            CURRENT_TIMESTAMP,

                        updated_at =
                            CURRENT_TIMESTAMP

                    WHERE quote_reference = ?
                `)
                .bind(
                    quote.quote_reference
                )
                .run();


            return jsonResponse({
                success: true,
                status:
                    "declined"
            });
        }


        // =========================================
        // ACCEPT QUOTE
        // =========================================

        await database
            .prepare(`
                UPDATE quotes

                SET
                    status =
                        'accepted',

                    accepted_at =
                        COALESCE(
                            accepted_at,
                            CURRENT_TIMESTAMP
                        ),

                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE quote_reference = ?
            `)
            .bind(
                quote.quote_reference
            )
            .run();


        // =========================================
        // CHECK FOR EXISTING PROJECT
        // =========================================

        let project =
            await database
                .prepare(`
                    SELECT
                        project_reference

                    FROM projects

                    WHERE quote_reference = ?

                    LIMIT 1
                `)
                .bind(
                    quote.quote_reference
                )
                .first();


        // =========================================
        // CREATE PROJECT AUTOMATICALLY
        // =========================================

        if (!project) {
            const projectReference =
                createProjectReference();


            try {
                await database
                    .prepare(`
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

                            status,

                            payment_status,
                            amount_paid_pence

                        )

                        VALUES (
                            ?,
                            ?,
                            ?,

                            ?,
                            ?,

                            ?,
                            ?,

                            ?,
                            ?,

                            ?,
                            ?,

                            'awaiting_deposit',

                            'unpaid',
                            0
                        )
                    `)
                    .bind(
                        projectReference,
                        quote.quote_reference,
                        quote.enquiry_reference,

                        quote.project_name,
                        quote.project_type,

                        quote.client_name,
                        quote.client_email,

                        quote.price_pence,
                        quote.deposit_pence,

                        quote.scope,
                        quote.estimated_timescale
                    )
                    .run();


                project = {
                    project_reference:
                        projectReference
                };


            } catch (insertError) {

                // If two requests somehow tried
                // creating it simultaneously,
                // retrieve the one that won.

                project =
                    await database
                        .prepare(`
                            SELECT
                                project_reference

                            FROM projects

                            WHERE quote_reference = ?

                            LIMIT 1
                        `)
                        .bind(
                            quote.quote_reference
                        )
                        .first();


                if (!project) {
                    throw insertError;
                }

            }
        }


        // =========================================
        // SUCCESS
        // =========================================

        return jsonResponse({
            success: true,

            status:
                "accepted",

            projectCreated:
                true,

            projectReference:
                project.project_reference
        });


    } catch (error) {
        console.error(
            "Quote response error:",
            error
        );


        return jsonResponse(
            {
                success: false,
                error:
                    "Unable to update quote."
            },
            500
        );
    }
}


// =========================================
// PROJECT REFERENCE
// =========================================

function createProjectReference() {
    const year =
        String(
            new Date()
                .getUTCFullYear()
        ).slice(-2);


    const random =
        Math.floor(
            100000 +
            Math.random() *
            900000
        );


    return `LP-${year}-${random}`;
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
            status,

            headers: {
                "Content-Type":
                    "application/json",

                "Cache-Control":
                    "no-store"
            }
        }
    );
}