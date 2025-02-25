let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(item) {
    const existingItem = cart.find(cartItem => cartItem.name === item.name);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push(item);
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    updateCartIcon();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    updateCartIcon();
}

function updateQuantity(index, newQuantity) {
    newQuantity = parseInt(newQuantity);
    if (newQuantity <= 0) {
        removeFromCart(index);
    } else {
        cart[index].quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        updateCartIcon();
    }
}

function updateCartDisplay() {
    const cartDisplay = document.getElementById('cart-items');
    const cartTotalDisplay = document.getElementById('cart-total');
    if (!cartDisplay) return;

    cartDisplay.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <span>${item.name} - ₹${item.price}</span>
            <div class="quantity-controls">
                <button onclick="updateQuantity(${index}, ${item.quantity - 1})">-</button>
                <input type="number" value="${item.quantity}" min="1" onchange="updateQuantity(${index}, this.value)">
                <button onclick="updateQuantity(${index}, ${item.quantity + 1})">+</button>
            </div>
            <button onclick="removeFromCart(${index})">Remove</button>
        `;
        cartDisplay.appendChild(cartItem);
        total += item.price * item.quantity;
    });
    
    cartTotalDisplay.textContent = `Total: ₹${total}`;
    
    // Also update checkout total if it exists
    const checkoutTotal = document.getElementById('checkout-total');
    if (checkoutTotal) {
        checkoutTotal.textContent = `Total: ₹${total}`;
    }
}

function updateCartIcon() {
    const cartItemCount = document.getElementById('cart-item-count');
    if (!cartItemCount) return;
    
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartItemCount.textContent = totalItems;
    
    if (totalItems > 0) {
        cartItemCount.style.display = 'flex';
    } else {
        cartItemCount.style.display = 'none';
    }
}

function toggleCart() {
    const cartContainer = document.getElementById('cart-container');
    cartContainer.classList.toggle('show-cart');
}

function showCheckoutForm() {
    // Hide cart first
    document.getElementById('cart-container').classList.remove('show-cart');
    
    // Show checkout form
    document.getElementById('checkout-form-container').style.display = 'flex';
}

function hideCheckoutForm() {
    document.getElementById('checkout-form-container').style.display = 'none';
}

function showThankYouMessage() {
    document.getElementById('thank-you-message').style.display = 'flex';
}

function hideThankYouMessage() {
    document.getElementById('thank-you-message').style.display = 'none';
}

function calculateCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

/**
 * Submits order data to Google Apps Script web app
 * @param {Object} orderData - The complete order data object
 */
function saveOrderToFile(orderData) {
    // Replace with your deployed Google Apps Script Web App URL
    // You'll get this URL after publishing your script as a web app
    const webAppUrl = 'https://script.google.com/macros/s/AKfycbzaQEEvEKgQGFzKbSmRQKOIhV8b0aGtA6vMFY_-lxvKGvTejxcW_uNcaMuHbb7U_5nz/exec';
    
    // Log data being submitted (for debugging)
    console.log('Order being submitted:', orderData);
    
    // Show loading indicator
    const checkoutButton = document.querySelector('#checkout-form button[type="submit"]');
    const originalButtonText = checkoutButton.textContent;
    checkoutButton.textContent = 'Processing...';
    checkoutButton.disabled = true;
    
    // Use fetch API to submit the data to your web app
    fetch(webAppUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Order submitted successfully:', data);
        
        // Clear the cart
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        updateCartIcon();
        
        // Hide checkout form and show thank you message
        hideCheckoutForm();
        showThankYouMessage();
    })
    .catch(error => {
        console.error('Error submitting order:', error);
        alert('There was an error submitting your order. Please try again or contact us directly.');
    })
    .finally(() => {
        // Reset button state
        checkoutButton.textContent = originalButtonText;
        checkoutButton.disabled = false;
    });
}

// Initialize the cart display on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartDisplay();
    updateCartIcon();
    
    // Cart toggle events
    document.getElementById('cart-icon').addEventListener('click', toggleCart);
    document.getElementById('close-cart').addEventListener('click', toggleCart);
    
    // Checkout button opens the checkout form
    document.getElementById('checkout-button').addEventListener('click', showCheckoutForm);
    
    // Close checkout form
    document.getElementById('close-checkout-form').addEventListener('click', hideCheckoutForm);
    
    // Close thank you message
    document.getElementById('close-thank-you').addEventListener('click', function() {
        hideThankYouMessage();
        // Optional: redirect to home or product page
        // window.location.href = 'index.html';
    });
    
    // Handle checkout form submission
    document.getElementById('checkout-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const customerName = document.getElementById('customer-name').value;
        const customerAddress = document.getElementById('customer-address').value;
        const customerPhone = document.getElementById('customer-phone').value;
        const customerAltPhone = document.getElementById('customer-alt-phone').value;
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
        
        // Create order data
        const orderData = {
            customer: {
                name: customerName,
                address: customerAddress,
                phone: customerPhone,
                altPhone: customerAltPhone
            },
            items: cart,
            total: calculateCartTotal(),
            paymentMethod: paymentMethod,
            orderDate: new Date().toISOString()
        };
        
        // Save order to Google Form
        saveOrderToFile(orderData);
    });
});