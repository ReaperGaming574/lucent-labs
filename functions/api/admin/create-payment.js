export async function onRequestPost(context) {
    try {
        const database = context.env.DB;
        const stripeSecretKey = context.env.STRIPE_SECRET_KEY;

        if (!database || !stripeSecretKey) {
            return jsonResponse(
                {
                    success: false,
                    error: "Payment processing is not configured."
                },
                500
            );
        }

        const data = await context.request.json();

        const reference = String(data.reference || "")
            .trim()
            .slice(0, 100);

        if (!reference) {
            return jsonResponse(
                {
                    success: false,
                    error: "Project reference is required."
                },
                400
            );
        }

        // =========================================
        // LOAD PROJECT
        // =========================================

        const project = await database
            .prepare(`
                SELECT
                    project_reference,
                    project_name,
                    client_email,
                    price_pence,
                    deposit_pence,
                    payment_status,
                    amount_paid_pence

                FROM projects

                WHERE project_reference = ?

                LIMIT 1
            `)
            .bind(reference)
            .first();

        if (!project) {
            return jsonResponse(
                {
                    success: false,
                    error: "Project not found."
                },
                404
            );
        }

        if (
            project.payment_status === "deposit_paid" ||
            project.payment_status === "paid_in_full"
        ) {
            return jsonResponse(
                {
                    success: false,
                    error: "This project has already received payment."
                },
                409
            );
        }

        const depositAmount = Number(project.deposit_pence || 0);

        if (
            !Number.isInteger(depositAmount) ||
            depositAmount <= 0
        ) {
            return jsonResponse(
                {
                    success: false,
                    error: "This project does not have a valid deposit amount."
                },
                400
            );
        }

        // =========================================
        // CREATE STRIPE CHECKOUT SESSION
        // =========================================

        const origin = new URL(context.request.url).origin;

        const form = new URLSearchParams();

        form.set("mode", "payment");

        form.set(
            "success_url",
            `${origin}/payment-success.html?project=${encodeURIComponent(reference)}`
        );

        form.set(
            "cancel_url",
            `${origin}/payment-cancelled.html?project=${encodeURIComponent(reference)}`
        );

        form.set(
            "client_reference_id",
            reference
        );

        form.set(
            "metadata[project_reference]",
            reference
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
            String(depositAmount)
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

        const stripeResponse = await fetch(
            "https://api.stripe.com/v1/checkout/sessions",
            {
                method: "POST",

                headers: {
                    Authorization: `Bearer ${stripeSecretKey}`,
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body: form.toString()
            }
        );

        const stripeData = await stripeResponse.json();

        if (!stripeResponse.ok) {
            console.error(
                "Stripe error:",
                stripeData
            );

            return jsonResponse(
                {
                    success: false,
                    error: "Unable to create payment session."
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
                    payment_status = 'payment_pending',
                    payment_method = 'stripe',
                    updated_at = CURRENT_TIMESTAMP

                WHERE project_reference = ?
            `)
            .bind(
                stripeData.id,
                reference
            )
            .run();

        return jsonResponse({
            success: true,
            checkoutUrl: stripeData.url
        });
    } catch (error) {
        console.error(
            "Create payment error:",
            error
        );

        return jsonResponse(
            {
                success: false,
                error: "Unable to create payment session."
            },
            500
        );
    }
}

function jsonResponse(body, status = 200) {
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