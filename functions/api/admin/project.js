export async function onRequestGet(context) {

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


        const url =
            new URL(
                context.request.url
            );


        const reference =
            String(
                url.searchParams.get(
                    "reference"
                ) || ""
            )
                .trim()
                .slice(0, 100);


        if (!reference) {

            return jsonResponse(
                {
                    success: false,
                    error:
                        "Project reference is required."
                },
                400
            );

        }


        const project =
            await database
                .prepare(
                    `
                    SELECT

                        project_reference,
                        quote_reference,
                        enquiry_reference,

                        project_name,
                        project_type,

                        client_name,
                        client_email,

                        price_pence,
                        deposit_pence,

                        scope,
                        estimated_timescale,

                        status,

                        created_at,
                        updated_at,
                        started_at,
                        completed_at

                    FROM projects

                    WHERE project_reference = ?

                    LIMIT 1
                    `
                )
                .bind(
                    reference
                )
                .first();


        if (!project) {

            return jsonResponse(
                {
                    success: false,
                    error:
                        "Project not found."
                },
                404
            );

        }


        return jsonResponse({
            success: true,
            project:
                project
        });


    } catch (error) {

        console.error(
            "Project API error:",
            error
        );


        return jsonResponse(
            {
                success: false,
                error:
                    "Unable to load project."
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