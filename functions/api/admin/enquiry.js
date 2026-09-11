// =========================================
// LUCENT LABS
// ADMIN PROJECT REQUEST API
// =========================================


// =========================================
// GET PROJECT REQUEST
// =========================================

export async function onRequestGet(
    context
) {

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
                        "Project request reference is required."
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
                        staff_notes,
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
                        "Project request not found."
                },
                404
            );

        }


        // =========================================
        // NORMALISE STATUS
        // =========================================

        enquiry.status =
            normaliseStatus(
                enquiry.status
            );


        // =========================================
        // SUCCESS
        // =========================================

        return jsonResponse(
            {
                success: true,
                enquiry:
                    enquiry
            },
            200
        );


    } catch (error) {

        console.error(
            "Admin project request GET error:",
            error
        );


        return jsonResponse(
            {
                success: false,
                error:
                    "Unable to load project request."
            },
            500
        );

    }

}


// =========================================
// UPDATE PROJECT REQUEST
// =========================================

export async function onRequestPatch(
    context
) {

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
        // BODY
        // =========================================

        let body;


        try {

            body =
                await context.request.json();

        } catch {

            return jsonResponse(
                {
                    success: false,
                    error:
                        "Invalid request body."
                },
                400
            );

        }


        // =========================================
        // VALUES
        // =========================================

        const reference =
            String(
                body.reference ||
                ""
            ).trim();


        const status =
            normaliseStatus(
                body.status
            );


        const staffNotes =
            String(
                body.staffNotes ||
                ""
            ).trim();


        // =========================================
        // VALIDATION
        // =========================================

        if (!reference) {

            return jsonResponse(
                {
                    success: false,
                    error:
                        "Project request reference is required."
                },
                400
            );

        }


        const allowedStatuses = [

            "new",

            "contacted",

            "in_progress",

            "closed"

        ];


        if (
            !allowedStatuses.includes(
                status
            )
        ) {

            return jsonResponse(
                {
                    success: false,
                    error:
                        "Invalid project status."
                },
                400
            );

        }


        if (
            staffNotes.length >
            5000
        ) {

            return jsonResponse(
                {
                    success: false,
                    error:
                        "Staff notes are too long."
                },
                400
            );

        }


        // =========================================
        // CHECK REQUEST EXISTS
        // =========================================

        const existing =
            await database
                .prepare(
                    `
                    SELECT
                        id

                    FROM enquiries

                    WHERE reference = ?

                    LIMIT 1
                    `
                )
                .bind(
                    reference
                )
                .first();


        if (!existing) {

            return jsonResponse(
                {
                    success: false,
                    error:
                        "Project request not found."
                },
                404
            );

        }


        // =========================================
        // UPDATE REQUEST
        // =========================================

        await database
            .prepare(
                `
                UPDATE enquiries

                SET
                    status = ?,
                    staff_notes = ?,
                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE reference = ?
                `
            )
            .bind(
                status,
                staffNotes,
                reference
            )
            .run();


        // =========================================
        // GET UPDATED REQUEST
        // =========================================

        const updatedEnquiry =
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
                        staff_notes,
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
        // SUCCESS
        // =========================================

        return jsonResponse(
            {
                success: true,

                enquiry:
                    updatedEnquiry
            },
            200
        );


    } catch (error) {

        console.error(
            "Admin project request PATCH error:",
            error
        );


        return jsonResponse(
            {
                success: false,
                error:
                    "Unable to save project request."
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
            return "new";


        default:
            return status;

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