export async function onRequestPost(context) {

    try {

        // =========================================
        // GET DISCORD WEBHOOK FROM CLOUDFLARE
        // =========================================

        const webhookURL =
            context.env.DISCORD_ENQUIRY_WEBHOOK;


        if (!webhookURL) {

            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Webhook not configured."
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

        }


        // =========================================
        // READ FORM DATA
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
            discord
        } = data;


        // =========================================
        // BASIC VALIDATION
        // =========================================

        if (
            !projectType ||
            !projectName ||
            !projectDescription ||
            !budget ||
            !deadline ||
            !clientName ||
            !email
        ) {

            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Missing required fields."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

        }


        // =========================================
        // CLEAN / LIMIT VALUES
        // Discord embed fields max out at 1024 chars
        // =========================================

        const safeReference =
            String(reference || "No reference")
                .slice(0, 100);


        const safeProjectType =
            String(projectType)
                .slice(0, 100);


        const safeProjectName =
            String(projectName)
                .slice(0, 200);


        const safeDescription =
            String(projectDescription)
                .slice(0, 1000);


        const safeFeatures =
            String(projectFeatures || "Not provided")
                .slice(0, 1000);


        const safeReferences =
            String(references || "Not provided")
                .slice(0, 700);


        const safeBudget =
            String(budget)
                .slice(0, 100);


        const safeDeadline =
            String(deadline)
                .slice(0, 100);


        const safeClientName =
            String(clientName)
                .slice(0, 100);


        const safeEmail =
            String(email)
                .slice(0, 200);


        const safeDiscord =
            String(discord || "Not provided")
                .slice(0, 100);


        // =========================================
        // DISCORD MESSAGE
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
                            value: safeDiscord,
                            inline: true
                        },

                        {
                            name: "Project Description",
                            value: safeDescription,
                            inline: false
                        },

                        {
                            name: "Features / Requirements",
                            value: safeFeatures,
                            inline: false
                        },

                        {
                            name: "References",
                            value: safeReferences,
                            inline: false
                        }

                    ],

                    footer: {
                        text:
                            "Lucent Labs • Project Enquiry System"
                    },

                    timestamp:
                        new Date().toISOString()

                }

            ]

        };


        // =========================================
        // SEND TO DISCORD
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


            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Discord submission failed."
                }),
                {
                    status: 502,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

        }


        // =========================================
        // SUCCESS
        // =========================================

        return new Response(
            JSON.stringify({
                success: true,
                reference: safeReference
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );


    } catch (error) {

        console.error(
            "Enquiry function error:",
            error
        );


        return new Response(
            JSON.stringify({
                success: false,
                error: "Server error."
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    }

}