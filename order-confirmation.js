// Order Confirmation System
class OrderConfirmation {
    constructor() {
        this.orderData = null;
        this.init();
    }

    async init() {
        console.log('Initializing order confirmation...');
        try {
            this.loadOrderData();
            this.displayOrderDetails();

            // Show success notification when payment is successful
            const isPaid = (this.orderData?.orderData?.payment_status || '').toLowerCase() === 'paid';
            if (isPaid) {
                this.showNotification('Order confirmed and payment successful.', 'success');
            }

            console.log('Order confirmation initialized successfully');
        } catch (error) {
            console.error('Error initializing order confirmation:', error);
            this.showError();
        }
    }

    loadOrderData() {
        console.log('Loading order data from localStorage...');
        const orderConfirmation = localStorage.getItem('orderConfirmation');
        
        if (!orderConfirmation) {
            console.error('No order confirmation data found');
            throw new Error('No order data found');
        }

        try {
            this.orderData = JSON.parse(orderConfirmation);
            console.log('Order data loaded:', this.orderData);
        } catch (error) {
            console.error('Error parsing order data:', error);
            throw new Error('Invalid order data');
        }
    }

    displayOrderDetails() {
        if (!this.orderData) {
            console.error('No order data to display');
            return;
        }

        console.log('Displaying order details...');

        // Display order summary
        this.displayOrderSummary();
        
        // Display customer information
        this.displayCustomerInfo();
        
        // Display order items
        this.displayOrderItems();
        
        // Display order totals
        this.displayOrderTotals();
    }

    displayOrderSummary() {
        const orderNumber = document.getElementById('order-number');
        const orderDate = document.getElementById('order-date');
        const orderStatus = document.getElementById('order-status');

        if (orderNumber) {
            orderNumber.textContent = this.orderData.orderNumber;
        }

        if (orderDate) {
            const date = new Date(this.orderData.orderData.created_at);
            orderDate.textContent = date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        if (orderStatus) {
            // Show payment status prominently on confirmation
            const paymentStatus = (this.orderData.orderData.payment_status || 'paid').toLowerCase();
            orderStatus.textContent = paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1);
            orderStatus.className = `value status-${paymentStatus}`;
        }
    }

    displayCustomerInfo() {
        const customerInfo = this.orderData.customerInfo;
        
        // Customer contact details
        const customerName = document.getElementById('customer-name');
        const customerEmail = document.getElementById('customer-email');
        const customerPhone = document.getElementById('customer-phone');

        if (customerName) {
            const billing = customerInfo.billing;
            customerName.textContent = `${billing.firstName} ${billing.lastName}`;
        }

        if (customerEmail) {
            customerEmail.textContent = customerInfo.email;
        }

        if (customerPhone) {
            customerPhone.textContent = customerInfo.phone;
        }

        // Billing address
        const billingAddress = document.getElementById('billing-address');
        if (billingAddress) {
            const billing = customerInfo.billing;
            billingAddress.innerHTML = `
                <p>${billing.firstName} ${billing.lastName}</p>
                <p>${billing.address}</p>
                ${billing.address2 ? `<p>${billing.address2}</p>` : ''}
                <p>${billing.city}, ${billing.state} ${billing.postal}</p>
            `;
        }

        // Shipping address (if different)
        if (customerInfo.shipping && 
            JSON.stringify(customerInfo.shipping) !== JSON.stringify(customerInfo.billing)) {
            
            const shippingInfo = document.getElementById('shipping-info');
            const shippingAddress = document.getElementById('shipping-address');
            
            if (shippingInfo) {
                shippingInfo.style.display = 'block';
            }
            
            if (shippingAddress) {
                const shipping = customerInfo.shipping;
                shippingAddress.innerHTML = `
                    <p>${shipping.firstName} ${shipping.lastName}</p>
                    <p>${shipping.address}</p>
                    ${shipping.address2 ? `<p>${shipping.address2}</p>` : ''}
                    <p>${shipping.city}, ${shipping.state} ${shipping.postal}</p>
                `;
            }
        }
    }

    displayOrderItems() {
        const orderItems = document.getElementById('order-items');
        if (!orderItems || !this.orderData.items) {
            console.error('Order items container or items data not found');
            return;
        }

        const itemsHTML = this.orderData.items.map(item => `
            <div class="order-item">
                <div class="item-image">
                    <img src="${item.image}" alt="${item.name}" onerror="this.src='Images/placeholder-image.jpg'">
                </div>
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <p class="item-quantity">Quantity: ${item.quantity}</p>
                    <p class="item-price">₹${item.price.toLocaleString('en-IN')} each</p>
                </div>
                <div class="item-total">
                    <span class="total-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
            </div>
        `).join('');

        orderItems.innerHTML = itemsHTML;
    }

    displayOrderTotals() {
        const totals = this.orderData.totals;
        
        const orderSubtotal = document.getElementById('order-subtotal');
        const orderShipping = document.getElementById('order-shipping');
        const orderTax = document.getElementById('order-tax');
        const orderTotal = document.getElementById('order-total');

        if (orderSubtotal) {
            orderSubtotal.textContent = `₹${totals.subtotal.toLocaleString('en-IN')}`;
        }

        if (orderShipping) {
            orderShipping.textContent = `₹${totals.shipping.toLocaleString('en-IN')}`;
        }

        if (orderTax) {
            orderTax.textContent = `₹${totals.tax.toLocaleString('en-IN')}`;
        }

        if (orderTotal) {
            orderTotal.textContent = `₹${totals.total.toLocaleString('en-IN')}`;
        }
    }

    showError() {
        const container = document.querySelector('.order-confirmation-content');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h2>Order Not Found</h2>
                    <p>We couldn't find your order details. This might happen if:</p>
                    <ul>
                        <li>You accessed this page directly without placing an order</li>
                        <li>Your session has expired</li>
                        <li>There was an error processing your order</li>
                    </ul>
                    <div class="error-actions">
                        <a href="index.html" class="btn btn-primary">
                            <i class="fas fa-home"></i>
                            Go to Home
                        </a>
                        <a href="checkout.html" class="btn btn-secondary">
                            <i class="fas fa-shopping-cart"></i>
                            Try Again
                        </a>
                    </div>
                </div>
            `;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const container = document.getElementById('notification-container');
        if (container) {
            container.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
    }
}

// Initialize order confirmation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Order confirmation page loaded');
    window.orderConfirmation = new OrderConfirmation();
});
