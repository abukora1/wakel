const twilio = require('twilio');

exports.handler = async (event) => {
    // السماح فقط بطلبات POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
        };
    }

    try {
        const { to, name, dueDate } = JSON.parse(event.body);

        if (!to || !name || !dueDate) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, error: 'جميع الحقول مطلوبة' })
            };
        }

        const client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        const message = await client.messages.create({
            from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
            to: `whatsapp:${to}`,
            body: `السلام عليكم ${name}،\nهذا تذكير من وكّل بدفع الإيجار المستحق بتاريخ ${dueDate}.\nنشكر تعاونك.`
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, sid: message.sid })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};