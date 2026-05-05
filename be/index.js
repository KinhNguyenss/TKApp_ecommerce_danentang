require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'TKApp Payment Server is running ✅' });
});

/**
 * POST /create-payment-intent
 * Body: { amount: number (VND), currency: 'vnd' }
 * Returns: { clientSecret: string }
 */
app.post('/create-payment-intent', async (req, res) => {
    console.log('--- Nhận yêu cầu thanh toán ---');
    console.log('Body:', req.body);
    try {
        const { amount, currency = 'vnd', orderId } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Số tiền không hợp lệ.' });
        }

        // Stripe dùng đơn vị nhỏ nhất (VNĐ không có đơn vị nhỏ hơn nên * 1)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount), // VNĐ không có xu
            currency: currency,
            metadata: { orderId: orderId || '' },
            automatic_payment_methods: { enabled: true },
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ TKApp Payment Server chạy tại http://localhost:${PORT}`);
    console.log(`📱 Từ điện thoại/emulator dùng địa chỉ IP của máy tính`);
});
