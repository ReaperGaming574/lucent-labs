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
        // GET PROJECT REQUESTS
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

                    LIMIT 100
                    `
                )
                .all();


        const enquiries =
            enquiriesResult.results ||
            [];


        // =========================================
        // COUNTS
        // =========================================

        const counts = {

            new: 0,

            contacted: 0,

            in_progress: 0,

            closed: 0

        };


        for (
            const enquiry
            of enquiries
        ) {

            const status =
                normaliseStatus(
                    enquiry.status
                );


            if (
                Object.prototype.hasOwnProperty.call(
                    counts,
                    status
                )
            ) {

                counts[
                    status
                ]++;

            }

        }


        // =========================================
        // NORMALISE ENQUIRIES
        // =========================================

        const normalisedEnquiries =
            enquiries.map(
                enquiry => {

                    return {

                        ...enquiry,

                        status:
                            normaliseStatus(
                                enquiry.status
                            )

                    };

                }
            );


        // =========================================
        // RESPONSE
        // =========================================

        return jsonResponse(
            {
                success: true,

                counts:
                    counts,

                enquiries:
                    normalisedEnquiries
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
                    "Unable to load project requests."
            },
            500
        );

    }

}


// =========================================
// NORMALISE STATUS
// =========================================

function normaliseStatus(
    value
) {

    const status =
        String(
            value ||
            ""
        )
            .trim()
            .toLowerCase()
            .replace(
                /[\s-]+/g,
                "_"
            );


    switch (status) {

        case "contacted":
            return "contacted";


        case "in_progress":

        case "active":

        case "accepted":
            return "in_progress";


        case "closed":

        case "completed":

        case "declined":

        case "cancelled":
            return "closed";


        case "new":

        case "pending":

        case "received":

        default:
            return "new";

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
        JSON.stringify(
            body
        ),
        {
            status:

                status,

            headers: {

                "Content-Type":
                    "application/json",

                "Cache-Control":
                    "no-store"

            }
        }
    );

}