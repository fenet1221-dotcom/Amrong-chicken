// Order Management System for Amrong Chicken
document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let cartCount = 0;
    let totalAmount = 0;

    // Cart elements
    const cartIcon = document.getElementById('cart-icon');
    const cartCountElement = document.getElementById('cart-count');
    const cartModal = document.getElementById('cart-modal');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const closeCartBtn = document.getElementById('close-cart');

    // Menu items data
    const menuItems = {
        'original-chicken': { name: 'Original Chicken', price: 10.99 },
        'spicy-chicken': { name: 'Spicy Chicken', price: 11.99 },
        'garlic-chicken': { name: 'Garlic Chicken', price: 12.99 },
        'bbq-chicken': { name: 'BBQ Chicken', price: 13.99 },
        'spicy-wings': { name: 'Spicy Wings', price: 9.99 },
        'honey-wings': { name: 'Honey Wings', price: 10.99 },
        'french-fries': { name: 'French Fries', price: 4.99 },
        'cola-drink': { name: 'Cola Drink', price: 2.99 },
        'orange-juice': { name: 'Orange Juice', price: 3.99 }
    };

    // Initialize cart display
    updateCartCount();

    // Add to cart functionality for all "Order Now" buttons
    const orderButtons = document.querySelectorAll('.order-btn');
    orderButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-product');
            const product = menuItems[productId];
            
            if (product) {
                addToCart(productId, product.name, product.price);
                showNotification(`${product.name} added to cart!`);
            }
        });
    });

    // Custom order form handling
    const customOrderForm = document.getElementById('custom-order-form');
    if (customOrderForm) {
        customOrderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const chickenType = document.getElementById('chicken-type').value;
            const quantity = document.getElementById('quantity').value;
            const spicyLevel = document.getElementById('spicy-level').value;
            const specialInstructions = document.getElementById('special-instructions').value;
            
            const basePrice = 10.99;
            let totalPrice = basePrice * quantity;
            
            if (chickenType === 'spicy') totalPrice += 1.00;
            if (chickenType === 'garlic') totalPrice += 2.00;
            if (spicyLevel === 'medium') totalPrice += 0.50;
            if (spicyLevel === 'extra-hot') totalPrice += 1.00;
            
            const customProduct = {
                id: `custom-${Date.now()}`,
                name: `Custom ${chickenType} Chicken (${spicyLevel} spicy)`,
                price: totalPrice,
                details: {
                    quantity: quantity,
                    spicyLevel: spicyLevel,
                    instructions: specialInstructions
                }
            };
            
            addToCart(customProduct.id, customProduct.name, customProduct.price, customProduct.details);
            showNotification('Custom order added to cart!');
            this.reset();
        });
    }

    // Reservation form handling
    const reservationForm = document.getElementById('reservation-form');
    if (reservationForm) {
        reservationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const date = document.getElementById('date').value;
            const time = document.getElementById('time').value;
            const guests = document.getElementById('guests').value;
            const phone = document.getElementById('phone').value;
            
            // Simple validation
            if (!name || !email || !date || !time || !guests || !phone) {
                showNotification('Please fill all fields!', 'error');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showNotification('Please enter a valid email address!', 'error');
                return;
            }
            
            // Phone validation
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
                showNotification('Please enter a valid phone number!', 'error');
                return;
            }
            
            // In a real application, you would send this data to a server
            const reservationData = {
                name,
                email,
                date,
                time,
                guests,
                phone,
                timestamp: new Date().toISOString()
            };
            
            // Save to localStorage for demo purposes
            saveReservation(reservationData);
            
            showNotification(`Reservation confirmed for ${name}! We'll contact you at ${phone} to confirm.`);
            this.reset();
        });
    }

    // Contact form handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const contactName = document.getElementById('contact-name').value;
            const contactEmail = document.getElementById('contact-email').value;
            const message = document.getElementById('message').value;
            
            if (!contactName || !contactEmail || !message) {
                showNotification('Please fill all fields!', 'error');
                return;
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(contactEmail)) {
                showNotification('Please enter a valid email address!', 'error');
                return;
            }
            
            // In a real application, you would send this data to a server
            const contactData = {
                name: contactName,
                email: contactEmail,
                message: message,
                timestamp: new Date().toISOString()
            };
            
            saveContactMessage(contactData);
            showNotification('Thank you for your message! We will get back to you soon.');
            this.reset();
        });
    }

    // Cart functionality
    if (cartIcon) {
        cartIcon.addEventListener('click', toggleCartModal);
    }
    
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', toggleCartModal);
    }
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', processCheckout);
    }

    // Close cart when clicking outside
    cartModal?.addEventListener('click', function(e) {
        if (e.target === this) {
            toggleCartModal();
        }
    });

    // Functions
    function addToCart(id, name, price, details = {}) {
        const existingItem = cart.find(item => item.id === id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: id,
                name: name,
                price: price,
                quantity: 1,
                details: details
            });
        }
        
        saveCart();
        updateCartCount();
        updateCartDisplay();
    }

    function removeFromCart(id) {
        cart = cart.filter(item => item.id !== id);
        saveCart();
        updateCartCount();
        updateCartDisplay();
    }

    function updateQuantity(id, newQuantity) {
        const item = cart.find(item => item.id === id);
        if (item && newQuantity > 0) {
            item.quantity = newQuantity;
            saveCart();
            updateCartCount();
            updateCartDisplay();
        }
    }

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function updateCartCount() {
        cartCount = cart.reduce((total, item) => total + item.quantity, 0);
        if (cartCountElement) {
            cartCountElement.textContent = cartCount;
            cartCountElement.style.display = cartCount > 0 ? 'block' : 'none';
        }
    }

    function updateCartDisplay() {
        if (!cartItemsContainer) return;
        
        cartItemsContainer.innerHTML = '';
        totalAmount = 0;
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
            cartTotalElement.textContent = '$0.00';
            return;
        }
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            totalAmount += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    ${item.details.quantity ? `<p>Quantity: ${item.details.quantity}</p>` : ''}
                    ${item.details.spicyLevel ? `<p>Spice Level: ${item.details.spicyLevel}</p>` : ''}
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button class="quantity-btn minus" data-id="${item.id}">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn plus" data-id="${item.id}">+</button>
                    </div>
                    <div class="cart-item-price">
                        <span>$${itemTotal.toFixed(2)}</span>
                        <button class="remove-item" data-id="${item.id}">×</button>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(cartItem);
        });
        
        cartTotalElement.textContent = `$${totalAmount.toFixed(2)}`;
        
        // Add event listeners to quantity buttons
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const item = cart.find(item => item.id === id);
                if (item) {
                    if (this.classList.contains('plus')) {
                        updateQuantity(id, item.quantity + 1);
                    } else if (this.classList.contains('minus')) {
                        updateQuantity(id, item.quantity - 1);
                    }
                }
            });
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                removeFromCart(id);
            });
        });
    }

    function toggleCartModal() {
        if (cartModal) {
            updateCartDisplay();
            cartModal.classList.toggle('active');
            document.body.style.overflow = cartModal.classList.contains('active') ? 'hidden' : '';
        }
    }

    function processCheckout() {
        if (cart.length === 0) {
            showNotification('Your cart is empty!', 'error');
            return;
        }
        
        // In a real application, you would process payment here
        const orderSummary = cart.map(item => 
            `${item.name} x${item.quantity}: $${(item.price * item.quantity).toFixed(2)}`
        ).join('\n');
        
        alert(`Order Summary:\n\n${orderSummary}\n\nTotal: $${totalAmount.toFixed(2)}\n\nThank you for your order! This is a demo - in a real application, payment would be processed here.`);
        
        // Clear cart
        cart = [];
        saveCart();
        updateCartCount();
        updateCartDisplay();
        toggleCartModal();
    }

    function saveReservation(data) {
        let reservations = JSON.parse(localStorage.getItem('reservations')) || [];
        reservations.push(data);
        localStorage.setItem('reservations', JSON.stringify(reservations));
    }

    function saveContactMessage(data) {
        let messages = JSON.parse(localStorage.getItem('contactMessages')) || [];
        messages.push(data);
        localStorage.setItem('contactMessages', JSON.stringify(messages));
    }

    function showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'error' ? '#f44336' : '#4CAF50'};
            color: white;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Add CSS for cart modal and notifications
    const style = document.createElement('style');
    style.textContent = `
        .cart-modal {
            display: none;
            position: fixed;
            top: 0;
            right: 0;
            width: 100%;
            max-width: 400px;
            height: 100%;
            background: white;
            box-shadow: -2px 0 10px rgba(0,0,0,0.1);
            z-index: 1000;
            overflow-y: auto;
        }
        
        .cart-modal.active {
            display: block;
        }
        
        .cart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #eee;
        }
        
        .cart-items {
            padding: 20px;
        }
        
        .cart-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #f5f5f5;
        }
        
        .cart-footer {
            padding: 20px;
            border-top: 1px solid #eee;
            position: sticky;
            bottom: 0;
            background: white;
        }
        
        .quantity-controls {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .quantity-btn {
            width: 30px;
            height: 30px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 50%;
            cursor: pointer;
        }
        
        .quantity-btn:hover {
            background: #f5f5f5;
        }
        
        .remove-item {
            background: #ff4444;
            color: white;
            border: none;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            cursor: pointer;
            margin-left: 10px;
        }
        
        #checkout-btn {
            width: 100%;
            padding: 15px;
            background: #ff6b6b;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 20px;
        }
        
        #checkout-btn:hover {
            background: #ff5252;
        }
        
        .empty-cart {
            text-align: center;
            color: #888;
            padding: 40px 0;
        }
        
        .cart-count {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #ff4444;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        @media (max-width: 768px) {
            .cart-modal {
                max-width: 100%;
            }
        }
    `;
    document.head.appendChild(style);

    // Make sure cart count is visible if there are items
    if (cartCount > 0) {
        updateCartDisplay();
    }
});