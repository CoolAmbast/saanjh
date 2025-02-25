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
    // Your Google Apps Script Web App URL
    const webAppUrl = 'https://script.google.com/macros/s/AKfycbw1HFj2nGz47MS-nuHrqFHXQM2dt7IOKCWwqrEzKSRGEmv2Gq2KOh-B56z65YEtqmPR/exec';
    
    // Log data being submitted
    console.log('Order being submitted:', orderData);
    
    // Create a hidden form
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = webAppUrl;
    form.target = 'hidden_iframe';
    form.style.display = 'none';
    
    // Create a hidden input field with order data as JSON
    const dataInput = document.createElement('input');
    dataInput.type = 'hidden';
    dataInput.name = 'data';
    dataInput.value = JSON.stringify(orderData);
    form.appendChild(dataInput);
    
    // Create a hidden iframe to receive the response
    let iframe = document.getElementById('hidden_iframe');
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.name = 'hidden_iframe';
        iframe.id = 'hidden_iframe';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
    }
    
    // Add the form to the document
    document.body.appendChild(form);
    
    // Show loading state
    const checkoutButton = document.querySelector('#checkout-form button[type="submit"]');
    const originalButtonText = checkoutButton.textContent || 'Submit Order';
    checkoutButton.textContent = 'Processing...';
    checkoutButton.disabled = true;
    
    // Handle iframe load event
    iframe.onload = function() {
        console.log('Order submitted successfully');
        
        // Clear the cart
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        updateCartIcon();
        
        // Hide checkout form and show thank you message
        hideCheckoutForm();
        showThankYouMessage();
        
        // Reset button state
        checkoutButton.textContent = originalButtonText;
        checkoutButton.disabled = false;
        
        // Clean up the form
        document.body.removeChild(form);
    };
    
    // Submit the form
    form.submit();
    
    // Add a timeout in case the iframe doesn't load properly
    setTimeout(function() {
        if (checkoutButton.disabled) {
            console.log('Timeout reached, assuming success');
            // Assume success if still processing after 5 seconds
            // Clear the cart
            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartDisplay();
            updateCartIcon();
            
            // Hide checkout form and show thank you message
            hideCheckoutForm();
            showThankYouMessage();
            
            // Reset button state
            checkoutButton.textContent = originalButtonText;
            checkoutButton.disabled = false;
            
            // Clean up the form
            if (document.body.contains(form)) {
                document.body.removeChild(form);
            }
        }
    }, 5000);
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