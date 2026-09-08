export async function onRequestPost(context) {

    try {

        // =========================================
        // CLOUDFLARE ENVIRONMENT
        // =========================================

        const webhookURL =
            context.env.DISCORD_ENQUIRY_WEBHOOK;

        const turnstileSecret =
            context.env.TURNSTILE_SECRET_KEY;

        const database =
            context.env.DB;


        if (!webhookURL) {

            return jsonResponse(
                {
                    success: false,
                    error: "Discord webhook is not configured."
                },
                500
            );

        }


        if (!turnstileSecret) {

            return jsonResponse(
                {
                    success: false,
                    error: "Turnstile is not configured."
                },
                500
            );

        }


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
        // READ REQUEST
        // =========================================

        const data =
            await context.request.json();


        const {
            reference,
            projectType,
            projectName,
            projectDescription,
            projectFeatures,
            references,
            budget,
            deadline,
            clientName,
            email,
            discord,
            turnstileToken
        } = data;


        // =========================================
        // TURNSTILE TOKEN CHECK
        // =========================================

        if (!turnstileToken) {

            return jsonResponse(
                {
                    success: false,
                    error: "Security verification is required."
                },
                400
            );

        }


        // =========================================
        // VERIFY TURNSTILE
        // =========================================

        const verifyForm =
            new FormData();


        verifyForm.append(
            "secret",
            turnstileSecret
        );


        verifyForm.append(
            "response",
            String(turnstileToken)
        );


        const clientIP =
            context.request.headers.get(
                "CF-Connecting-IP"
            );


        if (clientIP) {

            verifyForm.append(
                "remoteip",
                clientIP
            );

        }


        const turnstileResponse =
            await fetch(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                {
                    method: "POST",
                    body: verifyForm
                }
            );


        if (!turnstileResponse.ok) {

            console.error(
                "Turnstile request failed:",
                turnstileResponse.status
            );


            return jsonResponse(
                {
                    success: false,
                    error: "Security service unavailable."
                },
                502
            );

        }


        const turnstileResult =
            await turnstileResponse.json();


        if (!turnstileResult.success) {

            console.warn(
                "Turnstile rejected submission:",
                turnstileResult["error-codes"]
            );


            return jsonResponse(
                {
                    success: false,
                    error: "Security verification failed."
                },
                403
            );

        }


        // =========================================
        // REQUIRED FIELD VALIDATION
        // =========================================

        if (
            !reference ||
            !projectType ||
            !projectName ||
            !projectDescription ||
            !budget ||
            !deadline ||
            !clientName ||
            !email
        ) {

            return jsonResponse(
                {
                    success: false,
                    error: "Missing required fields."
                },
                400
            );

        }


        // =========================================
        // CLEAN / LIMIT DATA
        // =========================================

        const safeReference =
            String(reference)
                .trim()
                .slice(0, 100);


        const safeProjectType =
            String(projectType)
                .trim()
                .slice(0, 100);


        const safeProjectName =
            String(projectName)
                .trim()
                .slice(0, 200);


        const safeDescription =
            String(projectDescription)
                .trim()
                .slice(0, 1000);


        const safeFeatures =
            String(
                projectFeatures ||
                ""
            )
                .trim()
                .slice(0, 1000);


        const safeReferences =
            String(
                references ||
                ""
            )
                .trim()
                .slice(0, 700);


        const safeBudget =
            String(budget)
                .trim()
                .slice(0, 100);


        const safeDeadline =
            String(deadline)
                .trim()
                .slice(0, 100);


        const safeClientName =
            String(clientName)
                .trim()
                .slice(0, 100);


        const safeEmail =
            String(email)
                .trim()
                .slice(0, 200);


        const safeDiscord =
            String(
                discord ||
                ""
            )
                .trim()
                .slice(0, 100);


        // =========================================
        // SAVE ENQUIRY TO D1
        // =========================================

        try {

            await database
                .prepare(
                    `
                    INSERT INTO enquiries (
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
                        status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `
                )
                .bind(
                    safeReference,
                    safeProjectType,
                    safeProjectName,
                    safeDescription,
                    safeFeatures || null,
                    safeReferences || null,
                    safeBudget,
                    safeDeadline,
                    safeClientName,
                    safeEmail,
                    safeDiscord || null,
                    "new"
                )
                .run();

        } catch (databaseError) {

            console.error(
                "Database insert error:",
                databaseError
            );


            const message =
                String(
                    databaseError?.message ||
                    databaseError
                );


            if (
                message.includes(
                    "UNIQUE constraint failed"
                )
            ) {

                return jsonResponse(
                    {
                        success: false,
                        error:
                            "That enquiry reference already exists. Please refresh the page and try again."
                    },
                    409
                );

            }


            return jsonResponse(
                {
                    success: false,
                    error: "Unable to save enquiry."
                },
                500
            );

        }


        // =========================================
        // BUILD DISCORD NOTIFICATION
        // =========================================

        const discordPayload = {

            username:
                "Lucent Labs Enquiries",

            allowed_mentions: {
                parse: []
            },

            embeds: [

                {

                    title:
                        "✦ New Project Enquiry",

                    description:
                        `A new project enquiry has been submitted through the Lucent Labs website.\n\n**Reference:** ${safeReference}`,

                    fields: [

                        {
                            name: "Project Type",
                            value: safeProjectType,
                            inline: true
                        },

                        {
                            name: "Project Name",
                            value: safeProjectName,
                            inline: true
                        },

                        {
                            name: "Budget",
                            value: safeBudget,
                            inline: true
                        },

                        {
                            name: "Timescale",
                            value: safeDeadline,
                            inline: true
                        },

                        {
                            name: "Client",
                            value: safeClientName,
                            inline: true
                        },

                        {
                            name: "Email",
                            value: safeEmail,
                            inline: true
                        },

                        {
                            name: "Discord",
                            value:
                                safeDiscord ||
                                "Not provided",
                            inline: true
                        },

                        {
                            name: "Project Description",
                            value: safeDescription,
                            inline: false
                        },

                        {
                            name:
                                "Features / Requirements",
                            value:
                                safeFeatures ||
                                "Not provided",
                            inline: false
                        },

                        {
                            name: "References",
                            value:
                                safeReferences ||
                                "Not provided",
                            inline: false
                        }

                    ],

                    footer: {
                        text:
                            "Lucent Labs • Project Enquiry System"
                    },

                    timestamp:
                        new Date()
                            .toISOString()

                }

            ]

        };


        // =========================================
        // SEND DISCORD NOTIFICATION
        // =========================================

        const discordResponse =
            await fetch(
                webhookURL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            discordPayload
                        )
                }
            );


        if (!discordResponse.ok) {

            const discordError =
                await discordResponse.text();


            console.error(
                "Discord webhook error:",
                discordResponse.status,
                discordError
            );


            /*
                IMPORTANT:

                The enquiry has ALREADY been safely stored
                in D1 at this point.

                Discord is only the notification system.
                We do not delete the enquiry just because
                Discord failed.
            */

            return jsonResponse(
                {
                    success: true,
                    reference: safeReference,
                    warning:
                        "Enquiry saved, but notification delivery failed."
                },
                200
            );

        }


        // =========================================
        // SUCCESS
        // =========================================

        return jsonResponse(
            {
                success: true,
                reference: safeReference
            },
            200
        );


    } catch (error) {

        console.error(
            "Enquiry function error:",
            error
        );


        return jsonResponse(
            {
                success: false,
                error: "Server error."
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
                    "application/json"
            }
        }
    );

}