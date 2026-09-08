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


        const url =
            new URL(
                context.request.url
            );


        const reference =
            url.searchParams.get("ref");


        if (!reference) {

            return jsonResponse(
                {
                    success: false,
                    error:
                        "Quote reference is required."
                },
                400
            );

        }


        const quote =
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
                        e.client_name,
                        e.email,
                        e.discord

                    FROM quotes q

                    LEFT JOIN enquiries e
                        ON e.reference =
                           q.enquiry_reference

                    WHERE q.quote_reference = ?

                    LIMIT 1
                    `
                )
                .bind(reference)
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


        return jsonResponse(
            {
                success: true,
                quote: quote
            }
        );


    } catch (error) {

        console.error(
            "Admin quote error:",
            error
        );


        return jsonResponse(
            {
                success: false,
                error:
                    "Unable to load quote."
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