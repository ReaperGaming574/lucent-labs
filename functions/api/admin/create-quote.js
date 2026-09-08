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
            enquiryReference,
            price,
            deposit,
            timescale,
            scope
        } = data;


        // =========================================
        // VALIDATE
        // =========================================

        if (
            !enquiryReference ||
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


        // Store money as integer pennies.

        const pricePence =
            Math.round(
                priceNumber * 100
            );

        const depositPence =
            Math.round(
                depositNumber * 100
            );


        const safeReference =
            String(enquiryReference)
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


        // =========================================
        // CHECK ENQUIRY EXISTS
        // =========================================

        const enquiry =
            await database
                .prepare(
                    `
                    SELECT reference

                    FROM enquiries

                    WHERE reference = ?

                    LIMIT 1
                    `
                )
                .bind(
                    safeReference
                )
                .first();


        if (!enquiry) {

            return jsonResponse(
                {
                    success: false,
                    error:
                        "Enquiry not found."
                },
                404
            );

        }


        // =========================================
        // GENERATE QUOTE REFERENCE
        // =========================================

        const quoteReference =
            generateQuoteReference();


        // =========================================
        // SAVE QUOTE
        // =========================================

        await database
            .prepare(
                `
                INSERT INTO quotes (
                    quote_reference,
                    enquiry_reference,
                    price_pence,
                    deposit_pence,
                    scope,
                    estimated_timescale,
                    status
                )

                VALUES (?, ?, ?, ?, ?, ?, ?)
                `
            )
            .bind(
                quoteReference,
                safeReference,
                pricePence,
                depositPence,
                safeScope,
                safeTimescale,
                "draft"
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
                    status = 'quoted',
                    updated_at = CURRENT_TIMESTAMP

                WHERE reference = ?
                `
            )
            .bind(
                safeReference
            )
            .run();


        // =========================================
        // SUCCESS
        // =========================================

        return jsonResponse(
            {
                success: true,
                quoteReference:
                    quoteReference
            },
            201
        );


    } catch (error) {

        console.error(
            "Create quote error:",
            error
        );


        return jsonResponse(
            {
                success: false,
                error:
                    "Unable to create quote."
            },
            500
        );

    }

}


// =========================================
// QUOTE REFERENCE
// =========================================

function generateQuoteReference() {

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
        `LQ-${year}-` +
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