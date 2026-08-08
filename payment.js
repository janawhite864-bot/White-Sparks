// Stripe Payment Integration

const STRIPE_PUBLIC_KEY = 'pk_test_YOUR_STRIPE_PUBLIC_KEY'; // Replace with your actual Stripe public key
const API_ENDPOINT = 'https://your-backend.com/api'; // Replace with your backend endpoint

let stripe = null;
let elements = null;
let cardElement = null;

// Initialize Stripe
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Stripe
    stripe = Stripe(STRIPE_PUBLIC_KEY);
    elements = stripe.elements();
    cardElement = elements.create('card', {
        style: {
            base: {
                fontSize: '16px',
                color: '#fff',
                '::placeholder': {
                    color: '#aaa',
                }
            },
            invalid: {
                color: '#fa755a',
            }
        }
    });
    
    const cardElementDiv = document.getElementById('card-element');
    if (cardElementDiv) {
        cardElement.mount(cardElementDiv);
        cardElement.addEventListener('change', handleCardChange);
    }

    // Payment button
    const payBtn = document.getElementById('payBtn');
    if (payBtn) {
        payBtn.addEventListener('click', handlePayment);
    }

    // Back button
    const backBtn = document.getElementById('backToWelcomeBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            showScreen('welcomeScreen');
            clearPaymentStatus();
        });
    }
});

function handleCardChange(event) {
    const displayError = document.getElementById('paymentStatus');
    if (event.error) {
        displayError.textContent = event.error.message;
        displayError.classList.remove('success');
        displayError.classList.add('error');
    } else {
        displayError.textContent = '';
        displayError.classList.remove('error');
    }
}

async function handlePayment(e) {
    e.preventDefault();
    
    const payBtn = document.getElementById('payBtn');
    const statusDiv = document.getElementById('paymentStatus');
    
    payBtn.disabled = true;
    payBtn.textContent = 'Processing...';
    statusDiv.classList.remove('success', 'error');
    statusDiv.textContent = 'Processing payment...';

    try {
        // Create payment method
        const { token, error } = await stripe.createToken(cardElement);

        if (error) {
            showPaymentError(error.message);
            payBtn.disabled = false;
            payBtn.textContent = 'Pay $1.00';
            return;
        }

        // Send token to backend
        const response = await createPaymentIntent(token.id);

        if (response.success) {
            showPaymentSuccess();
            // Wait a moment then start game
            setTimeout(() => {
                clearPaymentStatus();
                initializeGame();
            }, 1500);
        } else {
            showPaymentError(response.error || 'Payment failed. Please try again.');
            payBtn.disabled = false;
            payBtn.textContent = 'Pay $1.00';
        }
    } catch (error) {
        showPaymentError('An error occurred: ' + error.message);
        payBtn.disabled = false;
        payBtn.textContent = 'Pay $1.00';
    }
}

async function createPaymentIntent(tokenId) {
    try {
        // This would call your backend endpoint
        // For testing, you can use this mock response
        const response = await fetch(`${API_ENDPOINT}/create-payment-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: 100, // $1.00 in cents
                currency: 'usd',
                token: tokenId,
                description: 'White Sparks Pong Game'
            })
        }).catch(() => {
            // Mock response for testing
            return {
                ok: true,
                json: async () => ({ success: true, clientSecret: 'mock_secret' })
            };
        });

        if (!response.ok) {
            throw new Error('Payment server error');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Payment error:', error);
        return { success: false, error: error.message };
    }
}

function showPaymentSuccess() {
    const statusDiv = document.getElementById('paymentStatus');
    statusDiv.textContent = '✓ Payment successful! Starting game...';
    statusDiv.classList.remove('error');
    statusDiv.classList.add('success');
}

function showPaymentError(message) {
    const statusDiv = document.getElementById('paymentStatus');
    statusDiv.textContent = '✗ ' + message;
    statusDiv.classList.remove('success');
    statusDiv.classList.add('error');
}

function clearPaymentStatus() {
    const statusDiv = document.getElementById('paymentStatus');
    statusDiv.textContent = '';
    statusDiv.classList.remove('success', 'error');
}

// Mock payment for demo (remove in production)
// This allows testing the game without Stripe credentials
function enableDemoMode() {
    const originalHandlePayment = handlePayment;
    window.handlePayment = async function(e) {
        e.preventDefault();
        const payBtn = document.getElementById('payBtn');
        payBtn.disabled = true;
        payBtn.textContent = 'Processing...';
        
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        showPaymentSuccess();
        setTimeout(() => {
            clearPaymentStatus();
            initializeGame();
        }, 1500);
    };
}

// Check if running in demo mode (no Stripe key configured)
if (STRIPE_PUBLIC_KEY === 'pk_test_YOUR_STRIPE_PUBLIC_KEY') {
    console.log('Running in demo mode - payment is simulated');
    enableDemoMode();
}