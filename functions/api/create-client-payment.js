// =========================================
// LUCENT LABS
// CLIENT DEPOSIT PAYMENT
// =========================================

export async function onRequestPost(context) {
    try {
        const database =
            context.env.DB;

        const stripeSecretKey =
            context.env.STRIPE_SECRET_KEY;


        if (
            !database ||
            !stripeSecretKey
        ) {
            return jsonResponse(
                {
                    success: false,
                    error:
                        "Payment processing is not configured."
                },
                500
            );
        }


        const body =
            await context.request.json();


        const token =
            String(body.token || "")
                .trim()
                .slice(0, 200);


        if (!token) {
            return jsonResponse(
                {
                    success: false,
                    error:
                        "Quote token is required."
                },
                400
            );
        }


        // =========================================
        // LOAD ACCEPTED QUOTE
        // =========================================

        const quote =
            await database
                .prepare(`
                    SELECT

                        quote_reference,
                        client_email,
                        deposit_pence,
                        status

                    FROM quotes

                    WHERE client_token = ?

                    LIMIT 1
                `)
                .bind(token)
                .first();


        if (!quote) {
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
            quote.status !== "accepted"
        ) {
            return jsonResponse(
                {
                    success: false,
                    error:
                        "This quote must be accepted before payment."
                },
                409
            );
        }


        // =========================================
        // FIND PROJECT
        // =========================================

        const project =
            await database
                .prepare(`
                    SELECT

                        project_reference,
                        project_name,
                        client_email,

                        price_pence,
                        deposit_pence,

                        payment_status,
                        stripe_checkout_session_id

                    FROM projects

                    WHERE quote_reference = ?

                    LIMIT 1
                `)
                .bind(
                    quote.quote_reference
                )
                .first();


        if (!project) {
            return jsonResponse(
                {
                    success: false,
                    error:
                        "Your project has not been created yet."
                },
                409
            );
        }


        if (
            project.payment_status ===
                "deposit_paid" ||
            project.payment_status ===
                "paid_in_full"
        ) {
            return jsonResponse(
                {
                    success: false,
                    error:
                        "The deposit has already been paid."
                },
                409
            );
        }


        const deposit =
            Number(
                project.deposit_pence || 0
            );


        if (
            !Number.isInteger(deposit) ||
            deposit <= 0
        ) {
            return jsonResponse(
                {
                    success: false,
                    error:
                        "This project does not have a valid deposit."
                },
                400
            );
        }


        // =========================================
        // CREATE STRIPE CHECKOUT
        // =========================================

        const origin =
            new URL(
                context.request.url
            ).origin;


        const form =
            new URLSearchParams();


        form.set(
            "mode",
            "payment"
        );


        form.set(
            "success_url",
            `${origin}/payment-success.html?token=${encodeURIComponent(
                token
            )}`
        );


        form.set(
            "cancel_url",
            `${origin}/quote?token=${encodeURIComponent(
                token
            )}`
        );


        form.set(
            "client_reference_id",
            project.project_reference
        );


        form.set(
            "metadata[project_reference]",
            project.project_reference
        );


        form.set(
            "metadata[payment_type]",
            "deposit"
        );


        form.set(
            "line_items[0][price_data][currency]",
            "gbp"
        );


        form.set(
            "line_items[0][price_data][unit_amount]",
            String(deposit)
        );


        form.set(
            "line_items[0][price_data][product_data][name]",
            `${project.project_name} — Project Deposit`
        );


        form.set(
            "line_items[0][quantity]",
            "1"
        );


        if (project.client_email) {
            form.set(
                "customer_email",
                project.client_email
            );
        }


        const stripeResponse =
            await fetch(
                "https://api.stripe.com/v1/checkout/sessions",
                {
                    method:
                        "POST",

                    headers: {
                        Authorization:
                            `Bearer ${stripeSecretKey}`,

                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },

                    body:
                        form.toString()
                }
            );


        const stripeData =
            await stripeResponse.json();


        if (!stripeResponse.ok) {
            console.error(
                "Stripe client payment error:",
                stripeData
            );


            return jsonResponse(
                {
                    success: false,
                    error:
                        "Unable to create payment session."
                },
                500
            );
        }


        // =========================================
        // SAVE SESSION
        // =========================================

        await database
            .prepare(`
                UPDATE projects

                SET
                    stripe_checkout_session_id = ?,
                    payment_status =
                        'payment_pending',
                    payment_method =
                        'stripe',
                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE project_reference = ?
            `)
            .bind(
                stripeData.id,
                project.project_reference
            )
            .run();


        return jsonResponse({
            success: true,
            checkoutUrl:
                stripeData.url
        });


    } catch (error) {
        console.error(
            "Client payment error:",
            error
        );


        return jsonResponse(
            {
                success: false,
                error:
                    "Unable to create payment."
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