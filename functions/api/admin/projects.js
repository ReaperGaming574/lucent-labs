export async function onRequestGet(context) {

    try {

        const database =
            context.env.DB;


        if (!database) {

            return jsonResponse(
                {
                    success: false,
                    error:
                        "Database is not configured."
                },
                500
            );

        }


        // =========================================
        // LOAD PROJECTS
        // =========================================

        const result =
            await database
                .prepare(
                    `
                    SELECT

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

                        created_at,
                        updated_at,
                        started_at,
                        completed_at,

                        payment_status,
                        payment_method,
                        amount_paid_pence,
                        deposit_paid_at,
                        paid_in_full_at

                    FROM projects

                    ORDER BY created_at DESC
                    `
                )
                .all();


        return jsonResponse({
            success: true,
            projects:
                result.results || []
        });


    } catch (error) {

        console.error(
            "Projects API error:",
            error
        );


        return jsonResponse(
            {
                success: false,
                error:
                    "Unable to load projects."
            },
            500
        );

    }

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