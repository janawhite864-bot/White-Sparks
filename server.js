// Node.js/Express Backend for Payment Processing
// Install dependencies: npm install express cors dotenv stripe

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const stripe = require('stripe');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Stripe
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// In-memory store for tracking payments (use database in production)
const payments = new Map();

/**
 * POST /api/create-payment-intent
 * Create a payment intent for a $1.00 charge
 */
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { token, description = 'White Sparks Pong Game' } = req.body;

        if (!token) {
            return res.status(400).json({ 
                success: false, 
                error: 'Payment token is required' 
            });
        }

        // Create charge (or use Payment Intent for more flexibility)
        const charge = await stripeClient.charges.create({
            amount: 100, // $1.00 in cents
            currency: 'usd',
            source: token,
            description: description,
            metadata: {
                game: 'white-sparks-pong',
                timestamp: new Date().toISOString()
            }
        });

        // Store payment record
        payments.set(charge.id, {
            amount: charge.amount,
            currency: charge.currency,
            status: charge.status,
            created: charge.created,
            customer_email: charge.receipt_email
        });

        res.json({
            success: true,
            chargeId: charge.id,
            message: 'Payment successful'
        });

    } catch (error) {
        console.error('Payment error:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Payment processing failed'
        });
    }
});

/**
 * POST /api/verify-payment
 * Verify a payment was completed
 */
app.post('/api/verify-payment', async (req, res) => {
    try {
        const { chargeId } = req.body;

        if (!chargeId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Charge ID is required' 
            });
        }

        const charge = await stripeClient.charges.retrieve(chargeId);

        res.json({
            success: charge.status === 'succeeded',
            chargeId: charge.id,
            amount: charge.amount,
            status: charge.status
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Verification failed'
        });
    }
});

/**
 * GET /api/payment-status/:chargeId
 * Get the status of a specific payment
 */
app.get('/api/payment-status/:chargeId', async (req, res) => {
    try {
        const { chargeId } = req.params;

        const paymentRecord = payments.get(chargeId);
        
        if (!paymentRecord) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }

        res.json({
            success: true,
            payment: paymentRecord
        });

    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Status check failed'
        });
    }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'White Sparks Payment API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🎮 White Sparks Payment API running on port ${PORT}`);
    console.log(`📝 Make sure STRIPE_SECRET_KEY is set in .env file`);
});