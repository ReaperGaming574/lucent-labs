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


        const token =
            String(
                data.token || ""
            )
                .trim()
                .slice(0, 200);


        const decision =
            String(
                data.decision || ""
            )
                .trim()
                .toLowerCase();


        if (!token) {

            return jsonResponse(
                {
                    success: false,
                    error: "Quote token is required."
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
                    error: "Invalid quote decision."
                },
                400
            );

        }


        // =========================================
        // FIND QUOTE
        // =========================================

        const quote =
            await database
                .prepare(
                    `
                    SELECT
                        quote_reference,
                        status

                    FROM quotes

                    WHERE client_token = ?

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
                    error: "Quote not found."
                },
                404
            );

        }


        if (
            quote.status === "accepted" ||
            quote.status === "declined"
        ) {

            return jsonResponse(
                {
                    success: false,
                    error:
                        `This quote has already been ${quote.status}.`
                },
                409
            );

        }


        if (quote.status !== "sent") {

            return jsonResponse(
                {
                    success: false,
                    error:
                        "This quote is not currently awaiting a response."
                },
                409
            );

        }


        // =========================================
        // ACCEPT
        // =========================================

        if (decision === "accepted") {

            await database
                .prepare(
                    `
                    UPDATE quotes

                    SET
                        status = 'accepted',
                        accepted_at = CURRENT_TIMESTAMP,
                        declined_at = NULL,
                        updated_at = CURRENT_TIMESTAMP

                    WHERE client_token = ?
                    `
                )
                .bind(
                    token
                )
                .run();

        }


        // =========================================
        // DECLINE
        // =========================================

        if (decision === "declined") {

            await database
                .prepare(
                    `
                    UPDATE quotes

                    SET
                        status = 'declined',
                        declined_at = CURRENT_TIMESTAMP,
                        accepted_at = NULL,
                        updated_at = CURRENT_TIMESTAMP

                    WHERE client_token = ?
                    `
                )
                .bind(
                    token
                )
                .run();

        }


        return jsonResponse(
            {
                success: true,
                status: decision,
                quoteReference:
                    quote.quote_reference
            }
        );


    } catch (error) {

        console.error(
            "Quote response error:",
            error
        );


        return jsonResponse(
            {
                success: false,
                error: "Unable to update quote."
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