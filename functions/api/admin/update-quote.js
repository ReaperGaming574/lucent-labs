export async function onRequestPost(context) {

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


        const data =
            await context.request.json();


        const {
            quoteReference,
            price,
            deposit,
            timescale,
            scope
        } = data;


        // =========================================
        // VALIDATION
        // =========================================

        if (
            !quoteReference ||
            price === undefined ||
            !timescale ||
            !scope
        ) {

            return jsonResponse(
                {
                    success: false,
                    error:
                        "Missing quote information."
                },
                400
            );

        }


        const priceNumber =
            Number(price);

        const depositNumber =
            Number(deposit || 0);


        if (
            !Number.isFinite(priceNumber) ||
            priceNumber <= 0 ||
            !Number.isFinite(depositNumber) ||
            depositNumber < 0 ||
            depositNumber > priceNumber
        ) {

            return jsonResponse(
                {
                    success: false,
                    error:
                        "Invalid quote amount."
                },
                400
            );

        }


        const safeReference =
            String(quoteReference)
                .trim()
                .slice(0, 100);


        const safeTimescale =
            String(timescale)
                .trim()
                .slice(0, 100);


        const safeScope =
            String(scope)
                .trim()
                .slice(0, 5000);


        const pricePence =
            Math.round(
                priceNumber * 100
            );


        const depositPence =
            Math.round(
                depositNumber * 100
            );


        // =========================================
        // ONLY EDIT DRAFTS
        // =========================================

        const existing =
            await database
                .prepare(
                    `
                    SELECT status

                    FROM quotes

                    WHERE quote_reference = ?

                    LIMIT 1
                    `
                )
                .bind(safeReference)
                .first();


        if (!existing) {

            return jsonResponse(
                {
                    success: false,
                    error:
                        "Quote not found."
                },
                404
            );

        }


        if (
            existing.status !== "draft"
        ) {

            return jsonResponse(
                {
                    success: false,
                    error:
                        "Only draft quotes can be edited."
                },
                409
            );

        }


        // =========================================
        // UPDATE
        // =========================================

        await database
            .prepare(
                `
                UPDATE quotes

                SET
                    price_pence = ?,
                    deposit_pence = ?,
                    estimated_timescale = ?,
                    scope = ?,
                    updated_at = CURRENT_TIMESTAMP

                WHERE quote_reference = ?
                `
            )
            .bind(
                pricePence,
                depositPence,
                safeTimescale,
                safeScope,
                safeReference
            )
            .run();


        return jsonResponse(
            {
                success: true
            }
        );


    } catch (error) {

        console.error(
            "Update quote error:",
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