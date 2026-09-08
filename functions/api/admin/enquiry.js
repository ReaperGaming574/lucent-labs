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
                    error:
                        "Database is not configured."
                },
                500
            );

        }


        // =========================================
        // GET REFERENCE
        // =========================================

        const url =
            new URL(
                context.request.url
            );


        const reference =
            url.searchParams.get(
                "ref"
            );


        if (!reference) {

            return jsonResponse(
                {
                    success: false,
                    error:
                        "Enquiry reference is required."
                },
                400
            );

        }


        // =========================================
        // GET ENQUIRY
        // =========================================

        const enquiry =
            await database
                .prepare(
                    `
                    SELECT
                        id,
                        reference,
                        project_type,
                        project_name,
                        project_description,
                        project_features,
                        project_references,
                        budget,
                        deadline,
                        client_name,
                        email,
                        discord,
                        status,
                        created_at,
                        updated_at

                    FROM enquiries

                    WHERE reference = ?

                    LIMIT 1
                    `
                )
                .bind(
                    reference
                )
                .first();


        // =========================================
        // NOT FOUND
        // =========================================

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
        // SUCCESS
        // =========================================

        return jsonResponse(
            {
                success: true,
                enquiry: enquiry
            },
            200
        );


    } catch (error) {

        console.error(
            "Admin enquiry error:",
            error
        );


        return jsonResponse(
            {
                success: false,
                error:
                    "Unable to load enquiry."
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