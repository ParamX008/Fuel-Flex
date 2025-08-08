// Orders Management System
class OrdersManager {
    constructor() {
        this.orders = [];
        this.currentUser = null;
        this.isLoading = false;
    }

    async init() {
        console.log('Initializing Orders Manager...');

        // Wait for config to be available
        await this.waitForConfig();

        // Get current user
        await this.getCurrentUser();

        // Load orders
        await this.loadOrders();

        // Realtime subscription to reflect new orders instantly
        this.setupRealtimeSubscription();

        // Setup event listeners (including storage events)
        this.setupEventListeners();
        this.setupStorageListener();
    }

    async waitForConfig() {
        console.log('Waiting for config to be available...');

        // Check if config is already available
        if (window.config && window.config.supabase) {
            console.log('Config already available');
            return;
        }

        // Wait for config to be ready
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds total

            const checkConfig = () => {
                attempts++;
                console.log(`Waiting for config... attempt ${attempts}/${maxAttempts}`);

                if (window.config && window.config.supabase) {
                    console.log('Config is now available');
                    resolve();
                    return;
                }

                if (attempts >= maxAttempts) {
                    console.error('Config timeout - Supabase library may not be loaded');
                    reject(new Error('Config not available - Supabase library not loaded'));
                    return;
                }

                setTimeout(checkConfig, 100);
            };

            // Also listen for the configReady event
            window.addEventListener('configReady', () => {
                console.log('Config ready event received');
                resolve();
            }, { once: true });

            // Start checking
            checkConfig();
        });
    }

    async getCurrentUser() {
        try {
            console.log('Getting current user...');
            console.log('Supabase client:', window.config?.supabase);

            const { data: { user }, error } = await window.config.supabase.auth.getUser();
            console.log('Auth response:', { user, error });

            if (error) {
                console.error('Auth error:', error);
                // Don't throw error, continue with guest session
                console.log('Auth error, will try guest session');
            }

            this.currentUser = user;
            console.log('Current user set:', user);

            // Get guest session ID if no authenticated user
            if (!user) {
                this.guestSessionId = localStorage.getItem('guestSessionId');
                console.log('Guest session ID:', this.guestSessionId);

                if (!this.guestSessionId) {
                    console.log('No user and no guest session, showing empty state');
                    // No user and no guest session - show empty state
                    return;
                }
            }
        } catch (error) {
            console.error('Error getting current user:', error);
            // Don't show error, continue with guest session
            this.guestSessionId = localStorage.getItem('guestSessionId');
            console.log('Fallback to guest session ID:', this.guestSessionId);
        }
    }

    async loadOrders() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading();

        try {
            console.log('Loading orders...');
            console.log('Current user:', this.currentUser?.id);
            console.log('Guest session ID:', this.guestSessionId);
            console.log('Supabase client available:', !!window.config?.supabase);

            // Build query based on authentication status
            let ordersQuery = window.config.supabase.from('orders').select('*');

            if (this.currentUser?.id) {
                // Authenticated user - get their orders
                console.log('Fetching orders for authenticated user:', this.currentUser.id);
                ordersQuery = ordersQuery.eq('user_id', this.currentUser.id);
            } else if (this.guestSessionId) {
                // Guest user - try to get orders by session ID (if column exists)
                console.log('Fetching orders for guest session:', this.guestSessionId);
                try {
                    ordersQuery = ordersQuery.eq('session_id', this.guestSessionId);
                } catch (sessionError) {
                    console.log('session_id column not available, trying email-based lookup');
                    // Fallback: try to get orders by email from localStorage
                    const lastOrderEmail = localStorage.getItem('lastOrderEmail');
                    if (lastOrderEmail) {
                        ordersQuery = ordersQuery.eq('customer_email', lastOrderEmail);
                    } else {
                        console.log('No email available either - showing empty state');
                        this.orders = [];
                        this.displayOrders();
                        return;
                    }
                }
            } else {
                // Try to get orders by email from recent orders
                const lastOrderEmail = localStorage.getItem('lastOrderEmail');
                if (lastOrderEmail) {
                    console.log('Fetching orders by email:', lastOrderEmail);
                    ordersQuery = ordersQuery.eq('customer_email', lastOrderEmail);
                } else {
                    console.log('No user ID, session ID, or email available - showing empty state');
                    this.orders = [];
                    this.displayOrders();
                    return;
                }
            }

            // Execute query
            const { data: orders, error: ordersError } = await ordersQuery.order('created_at', { ascending: false });

            console.log('Orders query result:', { orders, ordersError });

            if (ordersError) {
                console.error('Error fetching orders:', ordersError);
                throw new Error(`Database error: ${ordersError.message}`);
            }

            console.log('Orders fetched successfully:', orders);

            // Fetch order items for each order
            if (orders && orders.length > 0) {
                for (const order of orders) {
                    const { data: items, error: itemsError } = await window.config.supabase
                        .from('order_items')
                        .select('*')
                        .eq('order_id', order.id);

                    if (itemsError) {
                        console.error('Error fetching order items:', itemsError);
                    } else {
                        order.items = items || [];
                    }
                }
            }

            this.orders = orders || [];
            console.log('Orders with items:', this.orders);

            if (!this.orders || this.orders.length === 0) {
                console.log('No remote orders found, trying local fallback...');
                const showedFallback = this.displayLocalOrderFallback();
                if (showedFallback) return;
            }

            this.displayOrders();

        } catch (error) {
            console.error('Error loading orders:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            this.showError(`Unable to load orders: ${error.message}. Please try again.`);
        } finally {
            this.isLoading = false;
        }
    }

    showLoading() {
        document.getElementById('loading-state').style.display = 'block';
        document.getElementById('orders-container').style.display = 'none';
        document.getElementById('empty-state').style.display = 'none';
        document.getElementById('error-state').style.display = 'none';
    }

    showError(message) {
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('orders-container').style.display = 'none';
        document.getElementById('empty-state').style.display = 'none';
        document.getElementById('error-state').style.display = 'block';

        const errorState = document.getElementById('error-state');
        const errorMessage = errorState.querySelector('p');
        if (errorMessage) {
            errorMessage.textContent = message;
        }
    }

    displayOrders() {
        const loadingState = document.getElementById('loading-state');
        const ordersContainer = document.getElementById('orders-container');
        const emptyState = document.getElementById('empty-state');
        const errorState = document.getElementById('error-state');

        // Hide all states
        loadingState.style.display = 'none';
        errorState.style.display = 'none';

        if (!this.orders || this.orders.length === 0) {
            // Show empty state
            ordersContainer.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        // Show orders
        emptyState.style.display = 'none';
        ordersContainer.style.display = 'block';
        ordersContainer.innerHTML = '';

        this.orders.forEach(order => {
            const orderCard = this.createOrderCard(order);
            ordersContainer.appendChild(orderCard);
        });
    }

    createOrderCard(order) {
        const card = document.createElement('div');
        card.className = 'order-card';

        // Parse addresses if they're JSON strings
        let billingAddress = {};
        let shippingAddress = {};

        try {
            billingAddress = typeof order.billing_address === 'string'
                ? JSON.parse(order.billing_address)
                : order.billing_address || {};
            shippingAddress = typeof order.shipping_address === 'string'
                ? JSON.parse(order.shipping_address)
                : order.shipping_address || {};
        } catch (e) {
            console.error('Error parsing addresses:', e);
        }

        // Format date
        const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Get status color
        const statusColor = this.getStatusColor(order.status);

        // Calculate total items
        const totalItems = order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;

        card.innerHTML = `
            <div class="order-header">
                <div class="order-info">
                    <h3 class="order-number">Order #${order.order_number}</h3>
                    <p class="order-date">${orderDate}</p>
                </div>
                <div class="order-status">
                    <span class="status-badge status-${order.status}" style="background-color: ${statusColor}">
                        ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                </div>
            </div>

            <div class="order-summary">
                <div class="order-details">
                    <div class="detail-item">
                        <i class="fas fa-shopping-bag"></i>
                        <span>${totalItems} item${totalItems !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-credit-card"></i>
                        <span>${order.payment_method || 'Pending'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-truck"></i>
                        <span>${billingAddress.city || 'N/A'}, ${billingAddress.state || 'N/A'}</span>
                    </div>
                </div>
                <div class="order-total">
                    <span class="total-label">Total:</span>
                    <span class="total-amount">₹${order.total_amount?.toLocaleString('en-IN') || '0'}</span>
                </div>
            </div>

            <div class="order-items-preview">
                ${this.createItemsPreview(order.items)}
            </div>

            <div class="order-actions">
                <button class="btn btn-outline" onclick="ordersManager.viewOrderDetails('${order.id}')">
                    <i class="fas fa-eye"></i>
                    View Details
                </button>
                <button class="btn btn-outline" onclick="ordersManager.downloadInvoice('${order.id}')">
                    <i class="fas fa-download"></i>
                    Download Invoice
                </button>
                ${order.status === 'confirmed' ? `
                    <button class="btn btn-outline" onclick="ordersManager.trackOrder('${order.id}')">
                        <i class="fas fa-map-marker-alt"></i>
                        Track Order
                    </button>
                ` : ''}
            </div>
        `;

        return card;
    }

    createItemsPreview(items) {
        if (!items || items.length === 0) {
            return '<p class="no-items">No items found</p>';
        }

        const maxItems = 3;
        const displayItems = items.slice(0, maxItems);
        const remainingCount = items.length - maxItems;

        let html = '<div class="items-preview">';

        displayItems.forEach(item => {
            html += `
                <div class="item-preview">
                    <img src="${item.product_image || 'placeholder.jpg'}" alt="${item.product_name}" class="item-image">
                    <div class="item-info">
                        <span class="item-name">${item.product_name}</span>
                        <span class="item-quantity">Qty: ${item.quantity}</span>
                    </div>
                </div>
            `;
        });

        if (remainingCount > 0) {
            html += `<div class="more-items">+${remainingCount} more item${remainingCount !== 1 ? 's' : ''}</div>`;
        }

        html += '</div>';
        return html;
    }

    getStatusColor(status) {
        const colors = {
            'pending': '#f59e0b',
            'confirmed': '#10b981',
            'processing': '#3b82f6',
            'shipped': '#8b5cf6',
            'delivered': '#059669',
            'cancelled': '#ef4444'
        };
        return colors[status] || '#6b7280';
    }

    async viewOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) {
            console.error('Order not found:', orderId);
            return;
        }

        console.log('Viewing order details:', order);

        // Show order details in modal
        this.showOrderModal(order);
    }

    showOrderModal(order) {
        const modal = document.getElementById('order-modal');
        const modalBody = document.getElementById('order-modal-body');

        // Parse addresses
        let billingAddress = {};
        let shippingAddress = {};

        try {
            billingAddress = typeof order.billing_address === 'string'
                ? JSON.parse(order.billing_address)
                : order.billing_address || {};
            shippingAddress = typeof order.shipping_address === 'string'
                ? JSON.parse(order.shipping_address)
                : order.shipping_address || {};
        } catch (e) {
            console.error('Error parsing addresses:', e);
        }

        const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        modalBody.innerHTML = `
            <div class="order-detail-content">
                <div class="order-detail-header">
                    <h2>Order #${order.order_number}</h2>
                    <span class="status-badge status-${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                </div>

                <div class="order-detail-info">
                    <div class="info-section">
                        <h4><i class="fas fa-calendar"></i> Order Information</h4>
                        <p><strong>Order Date:</strong> ${orderDate}</p>
                        <p><strong>Payment Method:</strong> ${order.payment_method || 'Pending'}</p>
                        <p><strong>Payment Status:</strong> ${order.payment_status || 'Pending'}</p>
                    </div>

                    <div class="info-section">
                        <h4><i class="fas fa-user"></i> Customer Information</h4>
                        <p><strong>Email:</strong> ${order.customer_email || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${order.customer_phone || 'N/A'}</p>
                    </div>

                    <div class="info-section">
                        <h4><i class="fas fa-map-marker-alt"></i> Billing Address</h4>
                        <p>${billingAddress.firstName || ''} ${billingAddress.lastName || ''}</p>
                        <p>${billingAddress.address || ''}</p>
                        <p>${billingAddress.city || ''}, ${billingAddress.state || ''} ${billingAddress.postalCode || ''}</p>
                    </div>

                    ${JSON.stringify(shippingAddress) !== JSON.stringify(billingAddress) ? `
                        <div class="info-section">
                            <h4><i class="fas fa-truck"></i> Shipping Address</h4>
                            <p>${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}</p>
                            <p>${shippingAddress.address || ''}</p>
                            <p>${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.postalCode || ''}</p>
                        </div>
                    ` : ''}
                </div>

                <div class="order-items-detail">
                    <h4><i class="fas fa-shopping-bag"></i> Order Items</h4>
                    ${this.createDetailedItemsList(order.items)}
                </div>

                <div class="order-totals-detail">
                    <div class="totals-row">
                        <span>Subtotal:</span>
                        <span>₹${order.subtotal?.toLocaleString('en-IN') || '0'}</span>
                    </div>
                    <div class="totals-row">
                        <span>Shipping:</span>
                        <span>₹${order.shipping_amount?.toLocaleString('en-IN') || '0'}</span>
                    </div>
                    <div class="totals-row">
                        <span>Tax:</span>
                        <span>₹${order.tax_amount?.toLocaleString('en-IN') || '0'}</span>
                    </div>
                    <div class="totals-row total">
                        <span><strong>Total:</strong></span>
                        <span><strong>₹${order.total_amount?.toLocaleString('en-IN') || '0'}</strong></span>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    createDetailedItemsList(items) {
        if (!items || items.length === 0) {
            return '<p class="no-items">No items found</p>';
        }

        let html = '<div class="detailed-items-list">';

        items.forEach(item => {
            html += `
                <div class="detailed-item">
                    <img src="${item.product_image || 'placeholder.jpg'}" alt="${item.product_name}" class="detailed-item-image">
                    <div class="detailed-item-info">
                        <h5>${item.product_name}</h5>
                        <p>Quantity: ${item.quantity}</p>
                        <p>Unit Price: ₹${item.unit_price?.toLocaleString('en-IN') || '0'}</p>
                    </div>
                    <div class="detailed-item-total">
                        ₹${item.total_price?.toLocaleString('en-IN') || '0'}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    setupRealtimeSubscription() {
        try {
            if (!window.config?.supabase) return;

            const channel = window.config.supabase
                .channel('orders-realtime')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
                    console.log('New order inserted:', payload);
                    // Reload orders to reflect the latest
                    this.loadOrders();
                })
                .subscribe((status) => {
                    console.log('Realtime subscription status:', status);
                });

            this.ordersChannel = channel;
        } catch (e) {
            console.warn('Realtime subscription setup failed:', e);
        }
    }

    setupStorageListener() {
        try {
            window.addEventListener('storage', (e) => {
                if (e.key === 'orderConfirmation') {
                    console.log('orderConfirmation changed in storage; reloading orders');
                    this.loadOrders();
                }
            });
        } catch (e) {
            console.warn('Storage listener setup failed:', e);
        }
    }
        html += '</div>';
        return html;
    }
    displayLocalOrderFallback() {
        try {
            const conf = localStorage.getItem('orderConfirmation');
            if (!conf) return false;
            const parsed = JSON.parse(conf);
            const od = parsed.orderData || {};
            const items = (parsed.items || []).map(it => ({
                product_name: it.name,
                product_image: it.image,
                quantity: it.quantity,
                unit_price: it.price,
                total_price: it.price * it.quantity
            }));
            const fallbackOrder = {
                id: od.id || 'local',
                order_number: od.order_number || parsed.orderNumber,
                status: od.status || 'confirmed',
                subtotal: od.subtotal || parsed.totals?.subtotal || 0,
                tax_amount: od.tax_amount || parsed.totals?.tax || 0,
                shipping_amount: od.shipping_amount || parsed.totals?.shipping || 0,
                total_amount: od.total_amount || parsed.totals?.total || 0,
                billing_address: parsed.customerInfo?.billing || {},
                shipping_address: parsed.customerInfo?.shipping || parsed.customerInfo?.billing || {},
                payment_method: od.payment_method || 'cod',
                payment_status: od.payment_status || 'paid',
                customer_email: od.customer_email || parsed.customerInfo?.email || '',
                customer_phone: od.customer_phone || parsed.customerInfo?.phone || '',
                created_at: od.created_at || new Date().toISOString(),
                items
            };
            this.orders = [fallbackOrder];
            this.displayOrders();
            console.log('Displayed local fallback order');
            return true;
        } catch (e) {
            console.warn('Local fallback failed:', e);
            return false;
        }
    }

    downloadInvoice(orderId) {
        // Placeholder for invoice download functionality
        showNotification('Invoice download feature coming soon!', 'info');
    }

    trackOrder(orderId) {
        // Placeholder for order tracking functionality
        showNotification('Order tracking feature coming soon!', 'info');
    }

    setupEventListeners() {
        // Close order modal
        const closeOrderModal = document.getElementById('close-order-modal');
        const orderModal = document.getElementById('order-modal');

        if (closeOrderModal) {
            closeOrderModal.addEventListener('click', () => {
                orderModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            });
        }

        // Close modal when clicking outside
        if (orderModal) {
            orderModal.addEventListener('click', (e) => {
                if (e.target === orderModal) {
                    orderModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            });
        }

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && orderModal.style.display === 'block') {
                orderModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
}

// Global instance
let ordersManager;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Orders page loaded');
    console.log('Window config available:', !!window.config);
    console.log('Supabase available:', !!window.config?.supabase);

    try {
        ordersManager = new OrdersManager();
        console.log('OrdersManager created');
        await ordersManager.init();
        console.log('OrdersManager initialized successfully');
    } catch (error) {
        console.error('Error initializing orders manager:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });

        // Show error state
        const loadingState = document.getElementById('loading-state');
        const errorState = document.getElementById('error-state');

        if (loadingState) loadingState.style.display = 'none';
        if (errorState) {
            errorState.style.display = 'block';
            // Update error message
            const errorMessage = errorState.querySelector('p');
            if (errorMessage) {
                errorMessage.textContent = `Initialization failed: ${error.message}`;
            }
        }
    }
});

// Global function for reloading orders
function loadOrders() {
    if (ordersManager) {
        ordersManager.loadOrders();
    }
}
