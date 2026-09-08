export async function onRequestGet(context) {

    try {

        const database =
            context.env.DB;


        if (!database) {

            return jsonResponse(
                {
                    success: false,
                    error: "Database unavailable."
                },
                500
            );

        }


        const url =
            new URL(
                context.request.url
            );


        const token =
            String(
                url.searchParams.get(
                    "token"
                ) || ""
            )
                .trim()
                .slice(0, 200);


        if (!token) {

            return jsonResponse(
                {
                    success: false,
                    error: "Quote link is invalid."
                },
                400
            );

        }


        const quote =
            await database
                .prepare(
                    `
                    SELECT

                        q.quote_reference,
                        q.price_pence,
                        q.deposit_pence,
                        q.scope,
                        q.estimated_timescale,
                        q.status,
                        q.sent_at,

                        e.project_name,
                        e.project_type,
                        e.client_name

                    FROM quotes q

                    LEFT JOIN enquiries e
                        ON e.reference =
                           q.enquiry_reference

                    WHERE q.client_token = ?

                    AND q.status IN (
                        'sent',
                        'accepted',
                        'declined'
                    )

                    LIMIT 1
                    `
                )
                .bind(
                    token
                )
                .first();


        if (!quote) {

            return jsonResponse(
                {
                    success: false,
                    error:
                        "Quote not found or no longer available."
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
            "Public quote error:",
            error
        );


        return jsonResponse(
            {
                success: false,
                error: "Unable to load quote."
            },
            500
        );

    }

}


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