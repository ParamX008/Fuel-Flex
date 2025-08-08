// Checkout System
class CheckoutSystem {
    constructor() {
        this.supabase = null; // Will be set when config is ready
        this.currentStep = 1;
        this.cart = [];
        this.orderData = {};
        this.isLoading = false;
        this.appliedPromoCode = null;
        this.discountAmount = 0;

        this.init();
    }

    async init() {
        console.log('Initializing checkout system...');
        try {
            // Wait for config to be available
            await this.waitForConfig();

            // Set up Supabase client
            this.supabase = window.config.supabase;
            console.log('Supabase client set up:', !!this.supabase);

            this.loadCartFromStorage();
            this.setupEventListeners();
            this.updateOrderSummary();
            this.checkAuthentication();
            console.log('Checkout system initialized successfully');
        } catch (error) {
            console.error('Error initializing checkout system:', error);
        }
    }

    async waitForConfig() {
        console.log('Waiting for config to be available...');
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds

        while ((!window.config || !window.config.supabase) && attempts < maxAttempts) {
            console.log(`Waiting for config... attempt ${attempts + 1}/${maxAttempts}`);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.config || !window.config.supabase) {
            throw new Error('Config not available after waiting');
        }

        console.log('Config is now available');
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');

        // Customer info form
        const customerForm = document.getElementById('customer-info-form');
        if (customerForm) {
            customerForm.addEventListener('submit', (e) => this.handleCustomerInfo(e));
            console.log('Customer form event listener added');
        } else {
            console.error('Customer form not found');
        }

        // Payment form
        const paymentForm = document.getElementById('payment-form');
        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => this.handlePayment(e));
            console.log('Payment form event listener added');
        } else {
            console.error('Payment form not found');
        }

        // Place order button
        const placeOrderBtn = document.getElementById('place-order-btn');
        if (placeOrderBtn) {
            placeOrderBtn.addEventListener('click', () => this.placeOrder());
            console.log('Place order button event listener added');
        } else {
            console.error('Place order button not found');
        }

        // Shipping toggle
        document.getElementById('same-shipping').addEventListener('change', (e) => this.toggleShippingSection(e));

        // Payment method changes
        document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handlePaymentMethodChange(e));
        });

        // Card input formatting
        document.getElementById('card-number').addEventListener('input', (e) => this.formatCardNumber(e));
        document.getElementById('card-expiry').addEventListener('input', (e) => this.formatExpiry(e));
        document.getElementById('card-cvv').addEventListener('input', (e) => this.formatCVV(e));

        // Promo code - initialize the button
        this.initializePromoCodeButton();

        // Auto-fill from user profile if logged in
        this.autoFillUserData();
    }

    loadCartFromStorage() {
        console.log('Loading cart from storage...');
        const cartData = localStorage.getItem('cart'); // Fixed: use same key as main script
        console.log('Cart data from localStorage:', cartData);

        if (cartData) {
            try {
                this.cart = JSON.parse(cartData);
                console.log('Parsed cart:', this.cart);
            } catch (error) {
                console.error('Error parsing cart data:', error);
                this.cart = [];
            }
        }

        if (this.cart.length === 0) {
            console.log('Cart is empty, showing warning');
            this.showNotification('Your cart is empty. Add some items before checkout.', 'warning');

            // Add a button to go back to shopping instead of automatic redirect
            setTimeout(() => {
                const goShoppingBtn = document.createElement('button');
                goShoppingBtn.textContent = 'Continue Shopping';
                goShoppingBtn.className = 'btn btn-primary';
                goShoppingBtn.onclick = () => window.location.href = 'index.html';

                const container = document.querySelector('.checkout-content');
                if (container) {
                    container.innerHTML = `
                        <div style="text-align: center; padding: 2rem;">
                            <h2>Your cart is empty</h2>
                            <p>Add some items to your cart before proceeding to checkout.</p>
                        </div>
                    `;
                    container.appendChild(goShoppingBtn);
                }
            }, 1000);
        } else {
            console.log(`Cart loaded with ${this.cart.length} items`);
        }
    }

    checkAuthentication() {
        // Check if user is logged in and auto-fill data
        this.supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                this.autoFillUserData();
            }
        });
    }

    async autoFillUserData() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (user) {
                console.log('Auto-filling user data for:', user.email);

                // Auto-fill email
                document.getElementById('email').value = user.email || '';

                // Load user profile data
                await this.loadUserProfile(user);

                // Load saved addresses and show address selector buttons
                await this.loadSavedAddresses(user.id);
            }
        } catch (error) {
            console.error('Error auto-filling user data:', error);
        }
    }

    async loadUserProfile(user) {
        try {
            console.log('Loading user profile...');

            // Load profile data
            const { data: profile, error } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error loading profile:', error);
                return;
            }

            if (profile) {
                console.log('Profile loaded:', profile);

                // Auto-fill phone
                if (profile.phone) {
                    document.getElementById('phone').value = profile.phone;
                }

                // Auto-fill name from profile or user metadata
                const fullName = profile.full_name || user.user_metadata?.full_name;
                if (fullName) {
                    const nameParts = fullName.split(' ');
                    document.getElementById('billing-first-name').value = nameParts[0] || '';
                    document.getElementById('billing-last-name').value = nameParts.slice(1).join(' ') || '';
                }
            } else {
                // Fallback to user metadata
                if (user.user_metadata?.full_name) {
                    const nameParts = user.user_metadata.full_name.split(' ');
                    document.getElementById('billing-first-name').value = nameParts[0] || '';
                    document.getElementById('billing-last-name').value = nameParts.slice(1).join(' ') || '';
                }
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    async loadSavedAddresses(userId) {
        try {
            console.log('Loading saved addresses for user:', userId);

            const { data: addresses, error } = await this.supabase
                .from('addresses')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading addresses:', error);
                return;
            }

            console.log('Loaded addresses:', addresses);

            this.savedAddresses = addresses || [];

            // Show address selector buttons if addresses exist
            if (this.savedAddresses.length > 0) {
                document.getElementById('select-billing-address').style.display = 'inline-flex';
                document.getElementById('select-shipping-address').style.display = 'inline-flex';

                // Auto-fill with default or first address
                this.autoFillDefaultAddress();
            }
        } catch (error) {
            console.error('Error loading saved addresses:', error);
        }
    }

    autoFillDefaultAddress() {
        if (!this.savedAddresses || this.savedAddresses.length === 0) return;

        // Find default address or use first one
        const defaultAddress = this.savedAddresses.find(addr => addr.is_default) || this.savedAddresses[0];

        if (defaultAddress) {
            console.log('Auto-filling with default address:', defaultAddress);

            // Auto-fill billing address
            this.fillAddressForm('billing', defaultAddress);

            // If same shipping checkbox is checked, copy to shipping too
            const sameShipping = document.getElementById('same-shipping');
            if (sameShipping && sameShipping.checked) {
                this.fillAddressForm('shipping', defaultAddress);
            }
        }
    }

    fillAddressForm(type, address) {
        try {
            console.log(`Filling ${type} address form with:`, address);

            // Parse full name
            const nameParts = address.full_name ? address.full_name.split(' ') : ['', ''];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            // Fill form fields
            document.getElementById(`${type}-first-name`).value = firstName;
            document.getElementById(`${type}-last-name`).value = lastName;
            document.getElementById(`${type}-address`).value = address.address_line_1 || '';
            document.getElementById(`${type}-address-2`).value = address.address_line_2 || '';
            document.getElementById(`${type}-city`).value = address.city || '';
            document.getElementById(`${type}-state`).value = address.state || '';
            document.getElementById(`${type}-postal`).value = address.postal_code || '';

            console.log(`${type} address form filled successfully`);
        } catch (error) {
            console.error(`Error filling ${type} address form:`, error);
        }
    }

    showAddressSelector(type) {
        try {
            console.log(`Showing address selector for ${type}`);

            if (!this.savedAddresses || this.savedAddresses.length === 0) {
                this.showNotification('No saved addresses found', 'info');
                return;
            }

            // Filter addresses by type (billing/shipping)
            const filteredAddresses = this.savedAddresses.filter(addr => addr.type === type);

            // If no addresses of specific type, show all addresses
            const addressesToShow = filteredAddresses.length > 0 ? filteredAddresses : this.savedAddresses;

            // Set modal title
            const title = type === 'billing' ? 'Select Billing Address' : 'Select Shipping Address';
            document.getElementById('address-selector-title').textContent = title;

            // Populate address list
            this.populateAddressList(addressesToShow, type);

            // Show modal
            document.getElementById('address-selector-modal').style.display = 'flex';

            // Store current selection type
            this.currentAddressType = type;

        } catch (error) {
            console.error('Error showing address selector:', error);
            this.showNotification('Error loading addresses', 'error');
        }
    }

    populateAddressList(addresses, type) {
        const addressList = document.getElementById('address-list');

        if (addresses.length === 0) {
            addressList.innerHTML = `
                <div class="address-empty">
                    <i class="fas fa-address-book"></i>
                    <p>No saved addresses found</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Add addresses from your profile page</p>
                </div>
            `;
            return;
        }

        addressList.innerHTML = addresses.map(address => `
            <div class="address-option" onclick="selectAddress('${address.id}')">
                <div class="address-type">${address.type === 'shipping' ? 'Shipping' : 'Billing'}</div>
                <div class="address-details">
                    <div class="address-name">${address.full_name}</div>
                    <div class="address-lines">
                        ${address.address_line_1}<br>
                        ${address.address_line_2 ? address.address_line_2 + '<br>' : ''}
                        ${address.city}, ${address.state} ${address.postal_code}
                    </div>
                </div>
            </div>
        `).join('');
    }

    selectAddress(addressId) {
        try {
            console.log('Selecting address:', addressId);

            // Find the selected address
            const selectedAddress = this.savedAddresses.find(addr => addr.id === addressId);
            if (!selectedAddress) {
                console.error('Address not found:', addressId);
                return;
            }

            // Fill the form with selected address
            this.fillAddressForm(this.currentAddressType, selectedAddress);

            // Close modal
            this.closeAddressSelector();

            // Show success notification
            const addressType = this.currentAddressType === 'billing' ? 'Billing' : 'Shipping';
            this.showNotification(`${addressType} address filled successfully!`, 'success');

        } catch (error) {
            console.error('Error selecting address:', error);
            this.showNotification('Error selecting address', 'error');
        }
    }

    closeAddressSelector() {
        document.getElementById('address-selector-modal').style.display = 'none';
        this.currentAddressType = null;
    }

    handleCustomerInfo(e) {
        e.preventDefault();
        
        if (!this.validateCustomerInfo()) {
            return;
        }

        this.orderData.customerInfo = {
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            billing: {
                firstName: document.getElementById('billing-first-name').value,
                lastName: document.getElementById('billing-last-name').value,
                address: document.getElementById('billing-address').value,
                address2: document.getElementById('billing-address-2').value,
                city: document.getElementById('billing-city').value,
                state: document.getElementById('billing-state').value,
                postal: document.getElementById('billing-postal').value
            }
        };

        // Add shipping address if different
        if (!document.getElementById('same-shipping').checked) {
            this.orderData.customerInfo.shipping = {
                firstName: document.getElementById('shipping-first-name').value,
                lastName: document.getElementById('shipping-last-name').value,
                address: document.getElementById('shipping-address').value,
                address2: document.getElementById('shipping-address-2').value,
                city: document.getElementById('shipping-city').value,
                state: document.getElementById('shipping-state').value,
                postal: document.getElementById('shipping-postal').value
            };
        } else {
            this.orderData.customerInfo.shipping = this.orderData.customerInfo.billing;
        }

        // Proceed to payment step
        console.log('Customer info validated, proceeding to payment step...');
        this.nextStep();
    }

    async placeOrderDirectly() {
        try {
            console.log('Placing order directly without payment processing...');

            if (this.isLoading) {
                console.log('Already processing order, returning');
                return;
            }

            this.setLoadingState(true);

            // Calculate totals
            const totals = this.calculateTotals();
            console.log('Order totals:', totals);

            // Generate order number
            const orderNumber = this.generateOrderNumber();
            console.log('Generated order number:', orderNumber);

            // Create order object
            const order = {
                orderNumber: orderNumber,
                status: 'confirmed',
                customerInfo: this.orderData.customerInfo,
                items: this.cart,
                totals: totals,
                paymentStatus: 'paid', // Set to paid for successful order
                createdAt: new Date().toISOString()
            };

            console.log('Order object created:', order);

            // Get current user (if authenticated)
            const { data: { user } } = await this.supabase.auth.getUser();
            console.log('Current user:', user);

            // Save order to Supabase
            const orderData = {
                user_id: user?.id || null,
                order_number: order.orderNumber,
                status: order.status,
                subtotal: totals.subtotal,
                tax_amount: totals.tax,
                shipping_amount: totals.shipping,
                total_amount: totals.total,
                billing_address: JSON.stringify(order.customerInfo.billing),
                shipping_address: JSON.stringify(order.customerInfo.shipping || order.customerInfo.billing),
                payment_method: 'cod', // Cash on delivery as default
                payment_status: order.paymentStatus,
                customer_email: order.customerInfo.email,
                customer_phone: order.customerInfo.phone,
                created_at: order.createdAt
            };

            console.log('Saving order to database:', orderData);

            const { data: savedOrder, error: orderError } = await this.supabase
                .from('orders')
                .insert([orderData])
                .select()
                .single();

            if (orderError) {
                console.error('Error saving order:', orderError);
                throw orderError;
            }

            console.log('Order saved successfully:', savedOrder);

            // Save order items
            const orderItems = this.cart.map(item => ({
                order_id: savedOrder.id,
                product_name: item.name,
                product_image: item.image,
                quantity: item.quantity,
                unit_price: item.price,
                total_price: item.price * item.quantity,
                created_at: new Date().toISOString()
            }));

            console.log('Saving order items:', orderItems);

            const { error: itemsError } = await this.supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) {
                console.error('Error saving order items:', itemsError);
                // Don't throw error for items, order is already saved
            } else {
                console.log('Order items saved successfully');
            }

            // Save/Update customer profile and address if user is authenticated
            if (user) {
                await this.saveCustomerProfile(user, order.customerInfo);
                await this.saveCustomerAddress(user.id, order.customerInfo.shipping || order.customerInfo.billing);
            }

            // Store order data for confirmation page
            localStorage.setItem('orderConfirmation', JSON.stringify({
                orderNumber: order.orderNumber,
                orderData: savedOrder,
                items: this.cart,
                totals: totals,
                customerInfo: order.customerInfo
            }));

            // Clear cart
            localStorage.removeItem('cart');

            // Redirect to order confirmation page
            console.log('Redirecting to order confirmation page...');
            window.location.href = 'order-confirmation.html';

        } catch (error) {
            console.error('Error placing order:', error);
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
            this.setLoadingState(false);
            this.showNotification(`Error placing order: ${error.message}. Please try again.`, 'error');
        }
    }

    handlePayment(e) {
        e.preventDefault();

        console.log('Payment form submitted - handlePayment called');
        console.log('Current step:', this.currentStep);

        if (!this.validatePayment()) {
            console.log('Payment validation failed');
            return;
        }

        const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
        console.log('Selected payment method:', paymentMethod);

        this.orderData.payment = {
            method: paymentMethod,
            details: {}
        };

        if (paymentMethod === 'card') {
            this.orderData.payment.details = {
                cardNumber: document.getElementById('card-number').value.replace(/\s/g, ''),
                expiry: document.getElementById('card-expiry').value,
                cvv: document.getElementById('card-cvv').value,
                name: document.getElementById('card-name').value
            };
        } else if (paymentMethod === 'upi') {
            const upiId = document.getElementById('upi-id').value;
            console.log('UPI ID entered:', upiId);
            this.orderData.payment.details = {
                upiId: upiId
            };
        } else if (paymentMethod === 'netbanking') {
            this.orderData.payment.details = {
                bank: document.getElementById('bank-select').value
            };
        }

        console.log('Payment data saved:', this.orderData.payment);
        console.log('Moving to next step...');
        this.nextStep();
    }

    async placeOrder() {
        console.log('Place Order clicked - going directly to confirmation');

        try {
            // Calculate totals
            const totals = this.calculateTotals();
            console.log('Totals calculated:', totals);

            // Generate order number
            const orderNumber = this.generateOrderNumber();
            console.log('Generated order number:', orderNumber);

            // Create simple order object for confirmation page
            const orderConfirmation = {
                orderNumber: orderNumber,
                orderData: {
                    id: orderNumber,
                    order_number: orderNumber,
                    status: 'confirmed',
                    subtotal: totals.subtotal,
                    tax_amount: totals.tax,
                    shipping_amount: totals.shipping,
                    total_amount: totals.total,
                    payment_method: this.orderData.payment?.method || 'cod',
                    payment_status: 'paid',
                    customer_email: this.orderData.customerInfo?.email || '',
                    customer_phone: this.orderData.customerInfo?.phone || '',
                    created_at: new Date().toISOString()
                },
                items: this.cart,
                totals: totals,
                customerInfo: this.orderData.customerInfo || {}
            };

            console.log('Order confirmation data:', orderConfirmation);

            // Save order to Supabase database
            console.log('Saving order to Supabase database...');

            // Get current user (if authenticated)
            const { data: { user } } = await this.supabase.auth.getUser();
            console.log('Current user:', user);

            // Create a session identifier for non-authenticated users
            let sessionId = null;
            if (!user) {
                // Create or get session ID from localStorage for guest orders
                sessionId = localStorage.getItem('guestSessionId');
                if (!sessionId) {
                    sessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
                    localStorage.setItem('guestSessionId', sessionId);
                }
                console.log('Using guest session ID:', sessionId);
            }

            // Prepare order data for database
            const orderData = {
                user_id: user?.id || null,
                session_id: sessionId,
                order_number: orderNumber,
                status: 'confirmed',
                subtotal: totals.subtotal,
                tax_amount: totals.tax,
                shipping_amount: totals.shipping,
                total_amount: totals.total,
                billing_address: JSON.stringify(this.orderData.customerInfo?.billing || {}),
                shipping_address: JSON.stringify(this.orderData.customerInfo?.shipping || this.orderData.customerInfo?.billing || {}),
                payment_method: this.orderData.payment?.method || 'cod',
                payment_status: 'paid',
                customer_email: this.orderData.customerInfo?.email || '',
                customer_phone: this.orderData.customerInfo?.phone || '',
                created_at: new Date().toISOString()
            };

            console.log('Order data to save:', orderData);

            // Insert order into database
            const { data: savedOrder, error: orderError } = await this.supabase
                .from('orders')
                .insert([orderData])
                .select()
                .single();

            if (orderError) {
                console.error('Error saving order:', orderError);
                // Continue anyway - show confirmation even if database save fails
                console.log('Database save failed, but continuing to confirmation...');
            } else {
                console.log('Order saved successfully:', savedOrder);

                // Save order items to database
                if (this.cart && this.cart.length > 0) {
                    console.log('Saving order items...');
                    const orderItems = this.cart.map(item => ({
                        order_id: savedOrder.id,
                        product_name: item.name,
                        product_image: item.image,
                        quantity: item.quantity,
                        unit_price: item.price,
                        total_price: item.price * item.quantity,
                        created_at: new Date().toISOString()
                    }));

                    console.log('Order items to save:', orderItems);

                    const { error: itemsError } = await this.supabase
                        .from('order_items')
                        .insert(orderItems);

                    if (itemsError) {
                        console.error('Error saving order items:', itemsError);
                    } else {
                        console.log('Order items saved successfully');
                    }
                }

                // Update order confirmation with saved order data
                orderConfirmation.orderData = savedOrder;
            }

            // Save/Update customer profile and address if user is authenticated
            if (user && this.orderData.customerInfo) {
                try {
                    console.log('Saving customer profile and address...');
                    await this.saveCustomerProfile(user, this.orderData.customerInfo);

                    // Save address if billing address exists
                    if (this.orderData.customerInfo.billing) {
                        await this.saveCustomerAddress(user.id, this.orderData.customerInfo.billing);
                    }

                    // Save shipping address if different from billing
                    if (this.orderData.customerInfo.shipping &&
                        JSON.stringify(this.orderData.customerInfo.shipping) !== JSON.stringify(this.orderData.customerInfo.billing)) {
                        await this.saveCustomerAddress(user.id, this.orderData.customerInfo.shipping);
                    }
                } catch (profileError) {
                    console.error('Error saving customer profile/address:', profileError);
                    // Continue anyway - don't fail the order for profile save issues
                }
            }

            // Store order data for confirmation page
            console.log('Storing order data for confirmation page...');
            localStorage.setItem('orderConfirmation', JSON.stringify(orderConfirmation));

            // Store customer email for order lookup
            if (this.orderData.customerInfo?.email) {
                localStorage.setItem('lastOrderEmail', this.orderData.customerInfo.email);
                console.log('Stored customer email for order lookup:', this.orderData.customerInfo.email);
            }

            // Clear cart
            console.log('Clearing cart...');
            localStorage.removeItem('cart');
            this.cart = [];

            // Show success message and redirect
            console.log('Redirecting to order confirmation page...');
            this.showNotification('Order placed successfully!', 'success');

            setTimeout(() => {
                window.location.href = 'order-confirmation.html';
            }, 1000);

        } catch (error) {
            console.error('Error in placeOrder:', error);
            this.showNotification('Error placing order. Please try again.', 'error');
        }
    }

    validateCustomerInfo() {
        const requiredFields = [
            'email', 'phone', 'billing-first-name', 'billing-last-name',
            'billing-address', 'billing-city', 'billing-state', 'billing-postal'
        ];

        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                this.showNotification(`Please fill in ${field.placeholder || fieldId}`, 'error');
                field.focus();
                return false;
            }
        }

        // Validate email
        const email = document.getElementById('email').value;
        if (!this.validateEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return false;
        }

        // Validate phone
        const phone = document.getElementById('phone').value;
        if (!this.validatePhone(phone)) {
            this.showNotification('Please enter a valid phone number', 'error');
            return false;
        }

        // Validate shipping address if different
        if (!document.getElementById('same-shipping').checked) {
            const shippingFields = [
                'shipping-first-name', 'shipping-last-name', 'shipping-address',
                'shipping-city', 'shipping-state', 'shipping-postal'
            ];

            for (const fieldId of shippingFields) {
                const field = document.getElementById(fieldId);
                if (!field.value.trim()) {
                    this.showNotification(`Please fill in shipping ${field.placeholder || fieldId}`, 'error');
                    field.focus();
                    return false;
                }
            }
        }

        return true;
    }

    validatePayment() {
        console.log('validatePayment called');

        const paymentMethodElement = document.querySelector('input[name="payment-method"]:checked');
        if (!paymentMethodElement) {
            console.log('No payment method selected');
            this.showNotification('Please select a payment method', 'error');
            return false;
        }

        const paymentMethod = paymentMethodElement.value;
        console.log('Payment method selected:', paymentMethod);

        if (paymentMethod === 'card') {
            const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
            const expiry = document.getElementById('card-expiry').value;
            const cvv = document.getElementById('card-cvv').value;
            const name = document.getElementById('card-name').value;

            if (!this.validateCardNumber(cardNumber)) {
                this.showNotification('Please enter a valid card number', 'error');
                return false;
            }

            if (!this.validateExpiry(expiry)) {
                this.showNotification('Please enter a valid expiry date', 'error');
                return false;
            }

            if (!this.validateCVV(cvv)) {
                this.showNotification('Please enter a valid CVV', 'error');
                return false;
            }

            if (!name.trim()) {
                this.showNotification('Please enter the name on card', 'error');
                return false;
            }
        } else if (paymentMethod === 'upi') {
            const upiId = document.getElementById('upi-id').value;
            console.log('UPI ID to validate:', upiId);

            if (!upiId || !upiId.trim()) {
                console.log('UPI ID is empty');
                this.showNotification('Please enter a UPI ID', 'error');
                return false;
            }

            if (!this.validateUPI(upiId)) {
                console.log('UPI ID validation failed');
                this.showNotification('Please enter a valid UPI ID (e.g., user@paytm)', 'error');
                return false;
            }

            console.log('UPI ID validation passed');
        } else if (paymentMethod === 'netbanking') {
            const bank = document.getElementById('bank-select').value;
            if (!bank) {
                this.showNotification('Please select a bank', 'error');
                return false;
            }
        }

        return true;
    }

    toggleShippingSection(e) {
        const shippingSection = document.getElementById('shipping-section');
        if (e.target.checked) {
            shippingSection.style.display = 'none';
            // Clear shipping fields
            const shippingFields = [
                'shipping-first-name', 'shipping-last-name', 'shipping-address',
                'shipping-address-2', 'shipping-city', 'shipping-state', 'shipping-postal'
            ];
            shippingFields.forEach(fieldId => {
                document.getElementById(fieldId).value = '';
            });
        } else {
            shippingSection.style.display = 'block';
        }
    }

    handlePaymentMethodChange(e) {
        const method = e.target.value;
        
        // Hide all payment sections
        document.getElementById('card-payment-section').style.display = 'none';
        document.getElementById('upi-payment-section').style.display = 'none';
        document.getElementById('netbanking-payment-section').style.display = 'none';

        // Show selected section
        if (method === 'card') {
            document.getElementById('card-payment-section').style.display = 'block';
        } else if (method === 'upi') {
            document.getElementById('upi-payment-section').style.display = 'block';
        } else if (method === 'netbanking') {
            document.getElementById('netbanking-payment-section').style.display = 'block';
        }
    }

    formatCardNumber(e) {
        let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
        value = value.replace(/(\d{4})/g, '$1 ').trim();
        e.target.value = value.substring(0, 19);
    }

    formatExpiry(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    }

    formatCVV(e) {
        let value = e.target.value.replace(/\D/g, '');
        e.target.value = value.substring(0, 4);
    }

    initializePromoCodeButton() {
        const applyBtn = document.getElementById('apply-promo');
        if (applyBtn) {
            applyBtn.onclick = () => this.applyPromoCode();
        }
    }

    applyPromoCode() {
        const promoCode = document.getElementById('promo-code').value.trim();
        console.log('Attempting to apply promo code:', promoCode);
        console.log('Current applied promo code:', this.appliedPromoCode);

        if (!promoCode) {
            this.showNotification('Please enter a promo code', 'error');
            return;
        }

        // Check if the same promo code is already applied
        if (this.appliedPromoCode && this.appliedPromoCode === promoCode.toUpperCase()) {
            this.showNotification('This promo code is already applied', 'warning');
            return;
        }

        // Check if a different promo code is already applied
        if (this.appliedPromoCode && this.appliedPromoCode !== promoCode.toUpperCase()) {
            this.showNotification('A promo code is already applied. Remove it first to apply a new one.', 'warning');
            return;
        }

        // Available promo codes
        const promoCodes = {
            'WELCOME10': {
                discount: 0.1,
                description: 'Welcome discount - 10% off'
            },
            'PARAM10': {
                discount: 0.1,
                description: 'PARAM10 special - 10% off'
            }
        };

        const upperPromoCode = promoCode.toUpperCase();

        if (promoCodes[upperPromoCode]) {
            const promo = promoCodes[upperPromoCode];

            // Apply the promo code
            this.appliedPromoCode = upperPromoCode;
            this.discountAmount = promo.discount;

            // Update UI first
            this.updateOrderSummary();
            this.updatePromoCodeUI(true, upperPromoCode);

            // Show success notification
            this.showNotification(`🎉 Promo code ${upperPromoCode} applied! You saved ${(promo.discount * 100)}% on your order!`, 'success');

            console.log(`Applied promo code: ${upperPromoCode} with ${(promo.discount * 100)}% discount`);
        } else {
            this.showNotification('Invalid promo code. Try WELCOME10 or PARAM10', 'error');
        }
    }

    removePromoCode() {
        if (!this.appliedPromoCode) {
            this.showNotification('No promo code is currently applied', 'info');
            return;
        }

        const removedCode = this.appliedPromoCode;

        // Clear the state first
        this.appliedPromoCode = null;
        this.discountAmount = 0;

        // Update UI immediately
        this.updateOrderSummary();
        this.updatePromoCodeUI(false);

        // Show notification after a small delay to avoid conflicts
        setTimeout(() => {
            this.showNotification(`Promo code ${removedCode} removed successfully`, 'info');
        }, 100);

        console.log(`Removed promo code: ${removedCode}`);
    }

    updatePromoCodeUI(applied, promoCode = '') {
        const promoInput = document.getElementById('promo-code');
        const applyBtn = document.getElementById('apply-promo');

        if (applied) {
            // Show applied state - keep input field clean
            promoInput.value = promoCode;
            promoInput.disabled = true;
            promoInput.style.borderColor = 'var(--accent-color)';
            promoInput.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';

            applyBtn.textContent = 'Remove';
            applyBtn.onclick = () => this.removePromoCode();
            applyBtn.className = 'btn btn-secondary';
        } else {
            // Show default state
            promoInput.value = '';
            promoInput.disabled = false;
            promoInput.style.borderColor = '';
            promoInput.style.backgroundColor = '';

            applyBtn.textContent = 'Apply';
            applyBtn.onclick = () => this.applyPromoCode();
            applyBtn.className = 'btn btn-primary';
        }
    }

    nextStep() {
        console.log('nextStep called, current step:', this.currentStep);
        if (this.currentStep < 3) {
            this.currentStep++;
            console.log('Moving to step:', this.currentStep);
            this.updateStepDisplay();
            if (this.currentStep === 3) {
                console.log('Updating review data...');
                this.updateReviewData();
            }
        } else {
            console.log('Already at final step');
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }

    updateStepDisplay() {
        console.log('updateStepDisplay called for step:', this.currentStep);

        // Update step indicators
        const stepIndicators = document.querySelectorAll('.step');
        console.log('Found step indicators:', stepIndicators.length);

        stepIndicators.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index + 1 === this.currentStep) {
                step.classList.add('active');
                console.log(`Step ${index + 1} set to active`);
            } else if (index + 1 < this.currentStep) {
                step.classList.add('completed');
                console.log(`Step ${index + 1} set to completed`);
            }
        });

        // Show/hide forms
        const checkoutSteps = document.querySelectorAll('.checkout-step');
        console.log('Found checkout steps:', checkoutSteps.length);

        checkoutSteps.forEach((step, index) => {
            step.classList.remove('active');
            if (index + 1 === this.currentStep) {
                step.classList.add('active');
                console.log(`Checkout step ${index + 1} set to active`);
                console.log('Step element:', step);
            }
        });
    }

    updateReviewData() {
        console.log('updateReviewData called');
        console.log('Order data:', this.orderData);

        if (this.orderData.customerInfo) {
            console.log('Updating customer info in review');
            const reviewEmail = document.getElementById('review-email');
            const reviewPhone = document.getElementById('review-phone');
            const reviewBilling = document.getElementById('review-billing');

            if (reviewEmail) reviewEmail.textContent = this.orderData.customerInfo.email;
            if (reviewPhone) reviewPhone.textContent = this.orderData.customerInfo.phone;

            const billing = this.orderData.customerInfo.billing;
            if (reviewBilling) {
                reviewBilling.textContent =
                    `${billing.firstName} ${billing.lastName}, ${billing.address}, ${billing.city}, ${billing.state} ${billing.postal}`;
            }

            if (this.orderData.customerInfo.shipping &&
                JSON.stringify(this.orderData.customerInfo.shipping) !== JSON.stringify(this.orderData.customerInfo.billing)) {
                const shipping = this.orderData.customerInfo.shipping;
                const reviewShipping = document.getElementById('review-shipping');
                const reviewShippingItem = document.getElementById('review-shipping-item');

                if (reviewShipping) {
                    reviewShipping.textContent =
                        `${shipping.firstName} ${shipping.lastName}, ${shipping.address}, ${shipping.city}, ${shipping.state} ${shipping.postal}`;
                }
                if (reviewShippingItem) reviewShippingItem.style.display = 'block';
            } else {
                const reviewShippingItem = document.getElementById('review-shipping-item');
                if (reviewShippingItem) reviewShippingItem.style.display = 'none';
            }
        } else {
            console.log('No customer info found');
        }

        if (this.orderData.payment) {
            console.log('Updating payment info in review');
            const method = this.orderData.payment.method;
            let paymentText = method.charAt(0).toUpperCase() + method.slice(1);

            if (method === 'card') {
                const cardNumber = this.orderData.payment.details.cardNumber;
                paymentText += ` ending in ${cardNumber.slice(-4)}`;
            } else if (method === 'upi') {
                paymentText += ` - ${this.orderData.payment.details.upiId}`;
            } else if (method === 'netbanking') {
                paymentText += ` - ${this.orderData.payment.details.bank}`;
            }

            const reviewPayment = document.getElementById('review-payment');
            if (reviewPayment) {
                reviewPayment.textContent = paymentText;
                console.log('Payment text set to:', paymentText);
            } else {
                console.log('review-payment element not found');
            }
        } else {
            console.log('No payment info found');
        }
    }

    updateOrderSummary() {
        console.log('Updating order summary with cart:', this.cart);
        const cartContainer = document.getElementById('checkout-cart-items');

        if (!cartContainer) {
            console.error('Cart container not found');
            return;
        }

        cartContainer.innerHTML = '';

        this.cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')} × ${item.quantity}</div>
                    <div class="cart-item-total">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
                </div>
            `;
            cartContainer.appendChild(cartItem);
        });

        const totals = this.calculateTotals();
        console.log('Calculated totals:', totals);

        // Update totals with proper formatting
        const subtotalEl = document.getElementById('subtotal');
        const shippingEl = document.getElementById('shipping-cost');
        const taxEl = document.getElementById('tax-amount');
        const discountEl = document.getElementById('discount-amount');
        const totalEl = document.getElementById('total-amount');

        if (subtotalEl) subtotalEl.textContent = `₹${totals.subtotal.toLocaleString('en-IN')}`;
        if (shippingEl) shippingEl.textContent = `₹${totals.shipping.toLocaleString('en-IN')}`;
        if (taxEl) taxEl.textContent = `₹${totals.tax.toLocaleString('en-IN')}`;
        if (totalEl) totalEl.textContent = `₹${totals.total.toLocaleString('en-IN')}`;

        // Handle discount display
        this.updateDiscountDisplay(totals.discount);
    }

    calculateTotals() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 899 ? 0 : 99; // Free shipping over ₹899
        const tax = Math.round(subtotal * 0.06); // 6% Tax
        const discountAmount = Math.round(subtotal * this.discountAmount);
        const total = subtotal + shipping + tax - discountAmount;

        return {
            subtotal: Math.round(subtotal),
            shipping: Math.round(shipping),
            tax: tax,
            discount: discountAmount,
            total: Math.round(total)
        };
    }

    updateDiscountDisplay(discountAmount) {
        // Find or create discount row in the summary
        let discountRow = document.getElementById('discount-row');
        const summaryTotals = document.querySelector('.summary-totals');

        if (discountAmount > 0) {
            if (!discountRow) {
                // Create discount row
                discountRow = document.createElement('div');
                discountRow.id = 'discount-row';
                discountRow.className = 'summary-row discount';
                discountRow.innerHTML = `
                    <span>Discount (${this.appliedPromoCode})</span>
                    <span id="discount-amount">-₹${discountAmount.toLocaleString('en-IN')}</span>
                `;

                // Insert before the total row
                const totalRow = document.querySelector('.summary-row.total');
                if (totalRow && summaryTotals) {
                    summaryTotals.insertBefore(discountRow, totalRow);
                }
            } else {
                // Update existing discount row
                discountRow.innerHTML = `
                    <span>Discount (${this.appliedPromoCode})</span>
                    <span id="discount-amount">-₹${discountAmount.toLocaleString('en-IN')}</span>
                `;
            }
        } else {
            // Remove discount row if no discount
            if (discountRow) {
                discountRow.remove();
            }
        }
    }

    generateOrderNumber() {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `FF${timestamp}${random}`;
    }

    setLoadingState(loading) {
        this.isLoading = loading;
        const btn = document.getElementById('place-order-btn');
        const btnText = btn.querySelector('.btn-text');
        const btnLoader = btn.querySelector('.btn-loader');

        if (loading) {
            btn.disabled = true;
            btn.classList.add('loading');
        } else {
            btn.disabled = false;
            btn.classList.remove('loading');
        }
    }

    // Validation methods
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePhone(phone) {
        const phoneRegex = /^[6-9]\d{9}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
    }

    validateCardNumber(cardNumber) {
        return cardNumber.length >= 13 && cardNumber.length <= 19;
    }

    validateExpiry(expiry) {
        const [month, year] = expiry.split('/');
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;

        return month >= 1 && month <= 12 && 
               year >= currentYear && 
               (year > currentYear || month >= currentMonth);
    }

    validateCVV(cvv) {
        return cvv.length >= 3 && cvv.length <= 4;
    }

    validateUPI(upiId) {
        const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
        return upiRegex.test(upiId);
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        const icon = this.getNotificationIcon(type);
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="notification-icon ${icon}"></i>
                <span class="notification-message">${message}</span>
            </div>
        `;

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success':
                return 'fas fa-check-circle';
            case 'error':
                return 'fas fa-exclamation-circle';
            case 'warning':
                return 'fas fa-exclamation-triangle';
            default:
                return 'fas fa-info-circle';
        }
    }

    // Save or update customer profile
    async saveCustomerProfile(user, customerInfo) {
        try {
            console.log('Saving customer profile...');

            const profileData = {
                id: user.id,
                full_name: `${customerInfo.billing.firstName} ${customerInfo.billing.lastName}`,
                email: customerInfo.email || user.email,
                phone: customerInfo.phone,
                updated_at: new Date().toISOString()
            };

            console.log('Profile data to save:', profileData);

            // Use upsert to insert or update
            const { data, error } = await this.supabase
                .from('profiles')
                .upsert(profileData, { onConflict: 'id' })
                .select();

            if (error) {
                console.error('Error saving profile:', error);
                throw error;
            }

            console.log('Profile saved successfully:', data);
            return data;
        } catch (error) {
            console.error('Error in saveCustomerProfile:', error);
            // Don't throw error to prevent order failure
        }
    }

    // Save customer address
    async saveCustomerAddress(userId, addressInfo) {
        try {
            console.log('Saving customer address...');

            const addressData = {
                user_id: userId,
                type: 'shipping', // Default type
                full_name: `${addressInfo.firstName} ${addressInfo.lastName}`,
                address_line_1: addressInfo.address,
                address_line_2: addressInfo.address2 || null,
                city: addressInfo.city,
                state: addressInfo.state,
                postal_code: addressInfo.postal,
                country: 'India', // Default country
                is_default: false, // Will be set to true if it's the first address
                created_at: new Date().toISOString()
            };

            console.log('Address data to save:', addressData);

            // Check if this is the user's first address
            const { data: existingAddresses } = await this.supabase
                .from('addresses')
                .select('id')
                .eq('user_id', userId);

            if (!existingAddresses || existingAddresses.length === 0) {
                addressData.is_default = true;
            }

            // Check if similar address already exists
            const { data: similarAddress } = await this.supabase
                .from('addresses')
                .select('id')
                .eq('user_id', userId)
                .eq('address_line_1', addressData.address_line_1)
                .eq('city', addressData.city)
                .eq('postal_code', addressData.postal_code);

            if (similarAddress && similarAddress.length > 0) {
                console.log('Similar address already exists, skipping save');
                return similarAddress[0];
            }

            const { data, error } = await this.supabase
                .from('addresses')
                .insert([addressData])
                .select();

            if (error) {
                console.error('Error saving address:', error);
                throw error;
            }

            console.log('Address saved successfully:', data);
            return data[0];
        } catch (error) {
            console.error('Error in saveCustomerAddress:', error);
            // Don't throw error to prevent order failure
        }
    }
}

// Global functions for HTML onclick handlers
function previousStep() {
    if (window.checkoutSystem) {
        window.checkoutSystem.previousStep();
    }
}

function handlePaymentSubmit() {
    if (window.checkoutSystem) {
        // Create a fake event object to pass to handlePayment
        const fakeEvent = {
            preventDefault: () => {}
        };
        window.checkoutSystem.handlePayment(fakeEvent);
    }
}

// Global functions for HTML onclick handlers
function showAddressSelector(type) {
    if (window.checkoutSystem) {
        window.checkoutSystem.showAddressSelector(type);
    }
}

function selectAddress(addressId) {
    if (window.checkoutSystem) {
        window.checkoutSystem.selectAddress(addressId);
    }
}

function closeAddressSelector() {
    if (window.checkoutSystem) {
        window.checkoutSystem.closeAddressSelector();
    }
}

// Initialize checkout system when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Checkout page DOM loaded');

    // Wait for config to be available
    let attempts = 0;
    while ((!window.config || !window.config.supabase) && attempts < 10) {
        console.log('Waiting for config... attempt', attempts + 1);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    // Check if Supabase is loaded
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase not loaded. Please check your configuration.');
        return;
    }

    // Check if config is loaded
    if (!window.config || !window.config.supabase) {
        console.error('Config not loaded. Please check your configuration.');
        return;
    }

    console.log('Initializing checkout system...');
    // Initialize checkout system
    window.checkoutSystem = new CheckoutSystem();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CheckoutSystem;
} 