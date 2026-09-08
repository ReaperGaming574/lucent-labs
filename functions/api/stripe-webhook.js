// =========================================
// LUCENT LABS
// STRIPE PAYMENT WEBHOOK
// =========================================

export async function onRequestPost(context) {
    try {
        const database =
            context.env.DB;

        const webhookSecret =
            context.env.STRIPE_WEBHOOK_SECRET;


        if (
            !database ||
            !webhookSecret
        ) {
            return jsonResponse(
                {
                    success: false,
                    error:
                        "Webhook is not configured."
                },
                500
            );
        }


        // IMPORTANT:
        // Stripe signature verification requires
        // the untouched raw request body.

        const rawBody =
            await context.request.text();

        const stripeSignature =
            context.request.headers.get(
                "Stripe-Signature"
            );


        if (!stripeSignature) {
            return jsonResponse(
                {
                    success: false,
                    error:
                        "Missing Stripe signature."
                },
                400
            );
        }


        // =========================================
        // VERIFY STRIPE SIGNATURE
        // =========================================

        const verified =
            await verifyStripeSignature(
                rawBody,
                stripeSignature,
                webhookSecret
            );


        if (!verified) {
            return jsonResponse(
                {
                    success: false,
                    error:
                        "Invalid Stripe signature."
                },
                400
            );
        }


        // Signature is valid.
        // NOW we can parse the JSON.

        const event =
            JSON.parse(rawBody);


        // =========================================
        // ONLY HANDLE SUCCESSFUL CHECKOUT PAYMENTS
        // =========================================

        const supportedEvents = [
            "checkout.session.completed",
            "checkout.session.async_payment_succeeded"
        ];


        if (
            !supportedEvents.includes(
                event.type
            )
        ) {
            return jsonResponse({
                success: true,
                ignored: true
            });
        }


        const session =
            event.data?.object;


        if (!session) {
            return jsonResponse(
                {
                    success: false,
                    error:
                        "Missing Checkout Session."
                },
                400
            );
        }


        // checkout.session.completed can also
        // occur before a delayed payment finishes.
        // Only continue when Stripe says PAID.

        if (
            session.payment_status !==
            "paid"
        ) {
            return jsonResponse({
                success: true,
                ignored: true
            });
        }


        const reference =
            session.metadata
                ?.project_reference ||
            session.client_reference_id;


        const paymentType =
            session.metadata
                ?.payment_type;


        if (
            !reference ||
            paymentType !== "deposit"
        ) {
            return jsonResponse({
                success: true,
                ignored: true
            });
        }


        // =========================================
        // LOAD PROJECT FROM D1
        // =========================================

        const project =
            await database
                .prepare(`
                    SELECT

                        project_reference,
                        price_pence,
                        deposit_pence,

                        payment_status,
                        amount_paid_pence,

                        stripe_checkout_session_id

                    FROM projects

                    WHERE project_reference = ?

                    LIMIT 1
                `)
                .bind(reference)
                .first();


        if (!project) {
            console.error(
                "Stripe webhook project not found:",
                reference
            );

            return jsonResponse(
                {
                    success: false,
                    error:
                        "Project not found."
                },
                404
            );
        }


        // =========================================
        // VERIFY THIS IS THE SESSION WE CREATED
        // =========================================

        if (
            project
                .stripe_checkout_session_id &&
            project
                .stripe_checkout_session_id !==
                session.id
        ) {
            console.error(
                "Stripe session mismatch:",
                reference
            );

            return jsonResponse(
                {
                    success: false,
                    error:
                        "Checkout Session mismatch."
                },
                400
            );
        }


        const deposit =
            Number(
                project.deposit_pence || 0
            );

        const total =
            Number(
                project.price_pence || 0
            );

        const stripeAmount =
            Number(
                session.amount_total || 0
            );


        // =========================================
        // VERIFY PAYMENT AMOUNT
        // =========================================

        if (
            deposit <= 0 ||
            stripeAmount !== deposit
        ) {
            console.error(
                "Stripe payment amount mismatch.",
                {
                    reference,
                    expected:
                        deposit,
                    received:
                        stripeAmount
                }
            );

            return jsonResponse(
                {
                    success: false,
                    error:
                        "Payment amount mismatch."
                },
                400
            );
        }


        if (
            String(
                session.currency || ""
            ).toLowerCase() !== "gbp"
        ) {
            return jsonResponse(
                {
                    success: false,
                    error:
                        "Unexpected payment currency."
                },
                400
            );
        }


        // =========================================
        // DETERMINE PAYMENT STATE
        // =========================================

        const paidInFull =
            deposit >= total &&
            total > 0;


        const newPaymentStatus =
            paidInFull
                ? "paid_in_full"
                : "deposit_paid";


        // =========================================
        // UPDATE PROJECT
        //
        // COALESCE makes the timestamp idempotent:
        // repeated Stripe events won't keep
        // replacing the original payment time.
        // =========================================

        await database
            .prepare(`
                UPDATE projects

                SET

                    payment_status = ?,

                    payment_method =
                        'stripe',

                    amount_paid_pence =
                        CASE

                            WHEN
                                amount_paid_pence <
                                deposit_pence

                            THEN
                                deposit_pence

                            ELSE
                                amount_paid_pence

                        END,

                    deposit_paid_at =
                        COALESCE(
                            deposit_paid_at,
                            CURRENT_TIMESTAMP
                        ),

                    paid_in_full_at =
                        CASE

                            WHEN ? = 1

                            THEN
                                COALESCE(
                                    paid_in_full_at,
                                    CURRENT_TIMESTAMP
                                )

                            ELSE
                                paid_in_full_at

                        END,

                    stripe_checkout_session_id =
                        ?,

                    stripe_payment_intent_id =
                        ?,

                    status =
                        CASE

                            WHEN
                                status =
                                'awaiting_deposit'

                            THEN
                                'ready'

                            ELSE
                                status

                        END,

                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE project_reference = ?
            `)
            .bind(
                newPaymentStatus,

                paidInFull
                    ? 1
                    : 0,

                session.id,

                session.payment_intent ||
                    null,

                reference
            )
            .run();


        console.log(
            "Stripe payment recorded:",
            reference
        );


        return jsonResponse({
            success: true
        });


    } catch (error) {
        console.error(
            "Stripe webhook error:",
            error
        );

        return jsonResponse(
            {
                success: false,
                error:
                    "Webhook processing failed."
            },
            500
        );
    }
}


// =========================================
// STRIPE SIGNATURE VERIFICATION
// =========================================

async function verifyStripeSignature(
    payload,
    signatureHeader,
    secret
) {
    try {
        const parts =
            signatureHeader.split(",");

        let timestamp = null;

        const signatures = [];


        for (const part of parts) {
            const [
                key,
                value
            ] =
                part.split("=");


            if (key === "t") {
                timestamp =
                    value;
            }


            if (key === "v1") {
                signatures.push(
                    value
                );
            }
        }


        if (
            !timestamp ||
            signatures.length === 0
        ) {
            return false;
        }


        // Reject very old webhook requests.
        // Stripe's libraries normally use
        // roughly a five-minute tolerance.

        const now =
            Math.floor(
                Date.now() / 1000
            );

        const age =
            Math.abs(
                now -
                Number(timestamp)
            );


        if (
            !Number.isFinite(age) ||
            age > 300
        ) {
            return false;
        }


        const signedPayload =
            `${timestamp}.${payload}`;


        const encoder =
            new TextEncoder();


        const key =
            await crypto.subtle.importKey(
                "raw",

                encoder.encode(secret),

                {
                    name:
                        "HMAC",

                    hash:
                        "SHA-256"
                },

                false,

                [
                    "sign"
                ]
            );


        const signatureBuffer =
            await crypto.subtle.sign(
                "HMAC",

                key,

                encoder.encode(
                    signedPayload
                )
            );


        const expectedSignature =
            bufferToHex(
                signatureBuffer
            );


        return signatures.some(
            signature =>
                constantTimeEqual(
                    signature,
                    expectedSignature
                )
        );


    } catch (error) {
        console.error(
            "Signature verification error:",
            error
        );

        return false;
    }
}


function bufferToHex(buffer) {
    return Array
        .from(
            new Uint8Array(buffer)
        )
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(2, "0")
        )
        .join("");
}


function constantTimeEqual(
    a,
    b
) {
    if (
        typeof a !== "string" ||
        typeof b !== "string" ||
        a.length !== b.length
    ) {
        return false;
    }


    let difference = 0;


    for (
        let index = 0;
        index < a.length;
        index++
    ) {
        difference |=
            a.charCodeAt(index) ^
            b.charCodeAt(index);
    }


    return difference === 0;
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