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
        // LOAD QUOTES + ENQUIRY INFORMATION
        // =========================================

        const result =
            await database
                .prepare(
                    `
                    SELECT

                        q.id,
                        q.quote_reference,
                        q.enquiry_reference,
                        q.price_pence,
                        q.deposit_pence,
                        q.scope,
                        q.estimated_timescale,
                        q.status,
                        q.created_at,
                        q.updated_at,
                        q.accepted_at,
                        q.declined_at,

                        e.project_name,
                        e.project_type,
                        e.client_name

                    FROM quotes q

                    LEFT JOIN enquiries e
                        ON e.reference =
                           q.enquiry_reference

                    ORDER BY
                        q.created_at DESC,
                        q.id DESC
                    `
                )
                .all();


        return jsonResponse(
            {
                success: true,

                quotes:
                    result.results || []
            }
        );


    } catch (error) {

        console.error(
            "Admin quotes error:",
            error
        );


        return jsonResponse(
            {
                success: false,
                error:
                    "Unable to load quotes."
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