export async function onRequestPost(context) {

    try {

        const database =
            context.env.DB;


        const data =
            await context.request.json();


        const reference =
            String(
                data.reference || ""
            ).trim();


        const status =
            String(
                data.status || ""
            )
                .trim()
                .toLowerCase();


        const allowedStatuses = [
            "awaiting_deposit",
            "ready",
            "in_progress",
            "review",
            "completed"
        ];


        if (
            !reference ||
            !allowedStatuses.includes(
                status
            )
        ) {

            return jsonResponse(
                {
                    success: false,
                    error:
                        "Invalid project update."
                },
                400
            );

        }


        let startedAt = null;
        let completedAt = null;


        if (
            status === "in_progress"
        ) {

            startedAt =
                new Date()
                    .toISOString();

        }


        if (
            status === "completed"
        ) {

            completedAt =
                new Date()
                    .toISOString();

        }


        await database
            .prepare(
                `
                UPDATE projects

                SET
                    status = ?,

                    started_at =
                        CASE
                            WHEN ? IS NOT NULL
                            THEN COALESCE(
                                started_at,
                                ?
                            )
                            ELSE started_at
                        END,

                    completed_at =
                        CASE
                            WHEN ? IS NOT NULL
                            THEN ?
                            ELSE completed_at
                        END,

                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE project_reference = ?
                `
            )
            .bind(
                status,

                startedAt,
                startedAt,

                completedAt,
                completedAt,

                reference
            )
            .run();


        return jsonResponse({
            success: true,
            status:
                status
        });


    } catch (error) {

        console.error(
            "Update project error:",
            error
        );


        return jsonResponse(
            {
                success: false,
                error:
                    "Unable to update project."
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