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

function saveOrderToFile(orderData) {
    // Google Form URL - Replace with your actual form URL
    const formUrl = 'https://docs.google.com/forms/d/1KNVGWjNvCBhXcwNTgq3TimtxqE36uv2SqH82nv_zSmA/formResponse';
    
    // Format items as a detailed string with each item on a new line
    const itemsList = orderData.items.map(item => 
        `${item.name} - ₹${item.price} x ${item.quantity} = ₹${item.price * item.quantity}`
    ).join('\n');
    
    // Create form data object
    const formData = new FormData();
    
    // Add form fields to FormData object
    formData.append('entry.1372573522', orderData.customer.name);            // Customer name
    formData.append('entry.1154167033', orderData.customer.address);         // Customer address
    formData.append('entry.333861901', orderData.customer.phone);           // Customer phone
    formData.append('entry.36473302', orderData.customer.altPhone || 'N/A'); // Customer alt phone
    formData.append('entry.1585450313', orderData.paymentMethod);            // Payment method
    formData.append('entry.2147463217', itemsList);                          // Items list
    formData.append('entry.882243264', `₹${orderData.total}`);              // Total amount
    formData.append('entry.1703675855', new Date(orderData.orderDate).toLocaleString()); // Order date
    
    // Log data being submitted (for debugging)
    console.log('Order being submitted to Google Form:', orderData);
    
    // Use fetch API to submit the form
    fetch(formUrl, {
        method: 'POST',
        mode: 'no-cors', // This is important for cross-domain requests to Google
        body: formData
    })
    .then(response => {
        console.log('Form submitted successfully');
        
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
        console.error('Error submitting form:', error);
        // You might want to show an error message to the user here
        alert('There was an error submitting your order. Please try again or contact us directly.');
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