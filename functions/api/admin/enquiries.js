export async function onRequestGet(context) {

    try {

        // =========================================
        // DATABASE
        // =========================================

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


        // =========================================
        // GET ENQUIRIES
        // =========================================

        const enquiriesResult =
            await database
                .prepare(
                    `
                    SELECT
                        id,
                        reference,
                        project_type,
                        project_name,
                        budget,
                        deadline,
                        client_name,
                        status,
                        created_at

                    FROM enquiries

                    ORDER BY
                        created_at DESC

                    LIMIT 50
                    `
                )
                .all();


        // =========================================
        // GET COUNTS
        // =========================================

        const enquiryCountResult =
            await database
                .prepare(
                    `
                    SELECT COUNT(*) AS count

                    FROM enquiries

                    WHERE status = 'new'
                    `
                )
                .first();


        const quoteCountResult =
            await database
                .prepare(
                    `
                    SELECT COUNT(*) AS count

                    FROM quotes

                    WHERE status IN (
                        'draft',
                        'sent'
                    )
                    `
                )
                .first();


        // =========================================
        // RESPONSE
        // =========================================

        return jsonResponse(
            {
                success: true,

                counts: {

                    enquiries:
                        Number(
                            enquiryCountResult?.count ||
                            0
                        ),

                    quotes:
                        Number(
                            quoteCountResult?.count ||
                            0
                        ),

                    /*
                        We haven't created the
                        projects table yet.

                        This will become a real
                        database count later.
                    */

                    projects: 0

                },

                enquiries:
                    enquiriesResult.results || []
            },
            200
        );


    } catch (error) {

        console.error(
            "Admin enquiries error:",
            error
        );


        return jsonResponse(
            {
                success: false,
                error:
                    "Unable to load enquiries."
            },
            500
        );

    }

}


// =========================================
// JSON RESPONSE HELPER
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