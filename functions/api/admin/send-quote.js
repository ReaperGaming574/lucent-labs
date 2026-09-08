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
        // FIND QUOTE
        // =========================================

        const quote =
            await database
                .prepare(
                    `
                    SELECT
                        quote_reference,
                        status,
                        client_token

                    FROM quotes

                    WHERE quote_reference = ?

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
            quote.status === "accepted" ||
            quote.status === "declined"
        ) {

            return jsonResponse(
                {
                    success: false,
                    error:
                        "This quote has already been completed."
                },
                409
            );

        }


        // =========================================
        // CREATE PRIVATE CLIENT TOKEN
        // =========================================

        let clientToken =
            quote.client_token;


        if (!clientToken) {

            clientToken =
                generateSecureToken();

        }


        // =========================================
        // MARK QUOTE AS SENT
        // =========================================

        await database
            .prepare(
                `
                UPDATE quotes

                SET
                    status = 'sent',
                    client_token = ?,
                    sent_at = COALESCE(
                        sent_at,
                        CURRENT_TIMESTAMP
                    ),
                    updated_at = CURRENT_TIMESTAMP

                WHERE quote_reference = ?
                `
            )
            .bind(
                clientToken,
                quoteReference
            )
            .run();


        // =========================================
        // CLIENT URL
        // =========================================

        const requestURL =
            new URL(
                context.request.url
            );


        const clientURL =
            `${requestURL.origin}/quote.html?token=${encodeURIComponent(
                clientToken
            )}`;


        return jsonResponse(
            {
                success: true,
                quoteReference:
                    quoteReference,
                clientURL:
                    clientURL
            }
        );


    } catch (error) {

        console.error(
            "Send quote error:",
            error
        );


        return jsonResponse(
            {
                success: false,
                error: "Unable to send quote."
            },
            500
        );

    }

}


// =========================================
// SECURE TOKEN
// =========================================

function generateSecureToken() {

    const bytes =
        new Uint8Array(32);


    crypto.getRandomValues(
        bytes
    );


    return Array
        .from(bytes)
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(2, "0")
        )
        .join("");

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