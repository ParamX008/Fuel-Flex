// Product Detail Page - Self-contained JavaScript
// This file handles all functionality for the product detail page

// Product Data (copied from script.js to avoid dependencies)
const supplements = [
    {
        id: 1,
        name: "Whey Protein pro",
        price: 2499,
        description: "High-quality whey protein isolate for muscle recovery and growth. 24g protein, 5.5g BCAAs per serving.",
        image: "Images/prot.jpg",
        category: "protein",
        features: [
            "24g protein per serving",
            "5.5g BCAAs",
            "Low in carbs and fat",
            "Fast absorption",
            "Great taste and mixability"
        ]
    },
    {
        id: 2,
        name: "Creatine Monohydrate",
        price: 899,
        description: "Pure creatine monohydrate for increased strength and power output during workouts.",
        image: "Images/debica-poland-may-3-2022-600nw-2153086157.webp",
        category: "performance",
        features: [
            "Pure creatine monohydrate",
            "Increases strength and power",
            "Improves workout performance",
            "Supports muscle growth",
            "Scientifically proven"
        ]
    },
    {
        id: 3,
        name: "BCAA Amino Acids",
        price: 1100,
        description: "Branched-chain amino acids to support muscle recovery and reduce fatigue.",
        image: "Images/BCAA.webp",
        category: "recovery",
        features: [
            "2:1:1 BCAA ratio",
            "Reduces muscle fatigue",
            "Supports recovery",
            "Prevents muscle breakdown",
            "Instant energy boost"
        ]
    },
    {
        id: 4,
        name: "Pre-Workout Formula",
        price: 1799,
        description: "Advanced pre-workout blend for maximum energy and focus during training sessions.",
        image: "Images/preworkout.webp",
        category: "energy",
        features: [
            "Enhanced energy and focus",
            "Improved endurance",
            "Increased strength",
            "Better pump and vascularity",
            "No crash effect"
        ]
    },
    {
        id: 5,
        name: "Omega-3 Fish Oil",
        price: 799,
        description: "Premium fish oil supplement for heart health and joint support.",
        image: "Images/omega3.webp",
        category: "health",
        features: [
            "Heart health support",
            "Joint health benefits",
            "Brain function support",
            "Anti-inflammatory properties",
            "High EPA/DHA content"
        ]
    },
    {
        id: 6,
        name: "Vitamin D3 + K2",
        price: 999,
        description: "Essential vitamin D3 with K2 for bone health and immune support.",
        image: "Images/d3k21.webp",
        category: "vitamins",
        features: [
            "Bone health support",
            "Immune system boost",
            "Calcium absorption",
            "Mood enhancement",
            "Muscle function support"
        ]
    }
];

const clothes = [
    {
        id: 7,
        name: "Performance Tank Top",
        price: 699,
        description: "Moisture-wicking tank top for maximum comfort during intense workouts.",
        image: "Images/tanktop.jpg",
        category: "tops",
        features: [
            "Moisture-wicking fabric",
            "Breathable design",
            "Comfortable fit",
            "Quick-dry technology",
            "Anti-odor properties"
        ]
    },
    {
        id: 8,
        name: "Compression Shorts",
        price: 899,
        description: "High-performance compression shorts for support and comfort during training.",
        image: "Images/compression.webp",
        category: "bottoms",
        features: [
            "Compression support",
            "Moisture-wicking",
            "Comfortable waistband",
            "Anti-chafe design",
            "Quick-dry fabric"
        ]
    },
    {
        id: 9,
        name: "Gym Hoodie",
        price: 1499,
        description: "Premium cotton blend hoodie perfect for pre and post-workout comfort.",
        image: "Images/hoodie.jpg",
        category: "outerwear",
        features: [
            "Premium cotton blend",
            "Comfortable fit",
            "Warm and cozy",
            "Durable construction",
            "Stylish design"
        ]
    },
    {
        id: 10,
        name: "Training Leggings",
        price: 1050,
        description: "High-waisted leggings with pocket for your essentials during workouts.",
        image: "Images/leggings.webp",
        category: "bottoms",
        features: [
            "High-waisted design",
            "Built-in pocket",
            "Compression fit",
            "Moisture-wicking",
            "Four-way stretch"
        ]
    },
    {
        id: 11,
        name: "Performance T-Shirt",
        price: 999,
        description: "Breathable performance t-shirt with anti-odor technology.",
        image: "Images/tshirt.jpg",
        category: "tops",
        features: [
            "Anti-odor technology",
            "Breathable fabric",
            "Comfortable fit",
            "Quick-dry material",
            "UV protection"
        ]
    },
    {
        id: 12,
        name: "Gym Bag",
        price: 1899,
        description: "Spacious gym bag with multiple compartments for all your gear.",
        image: "Images/bag.webp",
        category: "accessories",
        features: [
            "Multiple compartments",
            "Durable construction",
            "Water-resistant material",
            "Comfortable straps",
            "Large capacity"
        ]
    }
];

// Shopping Cart
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentQuantity = 1;

// DOM Elements - will be initialized after DOM loads
let productDetailContainer;
let cartBtn;
let cartModal;
let closeCart;
let cartItems;
let cartCount;
let cartTotal;
let checkoutBtn;
let hamburger;
let navMenu;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Product detail page loaded');
    
    // Initialize DOM elements
    initializeDOMElements();
    
    // Load product detail
    loadProductDetail();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update cart display
    updateCartDisplay();
    
    console.log('Product detail page initialization complete');
});

// Initialize DOM elements
function initializeDOMElements() {
    productDetailContainer = document.getElementById('product-detail');
    cartBtn = document.getElementById('cart-btn');
    cartModal = document.getElementById('cart-modal');
    closeCart = document.getElementById('close-cart');
    cartItems = document.getElementById('cart-items');
    cartCount = document.getElementById('cart-count');
    cartTotal = document.getElementById('cart-total');
    checkoutBtn = document.getElementById('checkout-btn');
    hamburger = document.getElementById('hamburger');
    navMenu = document.getElementById('nav-menu');
    
    console.log('DOM elements initialized:', {
        productDetailContainer: !!productDetailContainer,
        cartBtn: !!cartBtn,
        cartModal: !!cartModal,
        closeCart: !!closeCart,
        cartItems: !!cartItems,
        cartCount: !!cartCount,
        cartTotal: !!cartTotal,
        checkoutBtn: !!checkoutBtn,
        hamburger: !!hamburger,
        navMenu: !!navMenu
    });
}

// Load product detail based on URL parameter
function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    
    console.log('Product ID from URL:', productId);
    
    if (!productId) {
        showError('Product not found - No ID provided');
        return;
    }
    
    const allProducts = [...supplements, ...clothes];
    console.log('All products:', allProducts);
    console.log('Looking for product with ID:', productId);
    
    const product = allProducts.find(p => p.id === productId);
    console.log('Found product:', product);
    
    if (!product) {
        showError('Product not found - Invalid ID');
        return;
    }
    
    displayProductDetail(product);
}

// Display product detail
function displayProductDetail(product) {
    if (!productDetailContainer) {
        console.error('Product detail container not found!');
        return;
    }
    
    const featuresList = product.features ? product.features.map(feature => `<li>${feature}</li>`).join('') : '';
    
    productDetailContainer.innerHTML = `
        <div class="product-images">
            <img src="${product.image}" alt="${product.name}" class="main-image">
        </div>
        <div class="product-info-detail">
            <h1 class="product-title-detail">${product.name}</h1>
            <div class="product-price-detail">₹${product.price.toLocaleString('en-IN')}</div>
            <p class="product-description-detail">${product.description}</p>
            
            ${product.features ? `
            <div class="product-features">
                <h3>Key Features</h3>
                <ul class="feature-list">
                    ${featuresList}
                </ul>
            </div>
            ` : ''}
            
            <div class="quantity-selector">
                <label>Quantity:</label>
                <button class="quantity-btn" onclick="updateQuantity(-1)">-</button>
                <span class="quantity-display">${currentQuantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(1)">+</button>
            </div>
            
            <div class="product-actions">
                <button class="btn-add-to-cart-detail" onclick="addToCartDetail(${product.id})">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
                <button class="btn-buy-now" onclick="buyNow(${product.id})">
                    <i class="fas fa-bolt"></i> Buy Now
                </button>
            </div>
            
            <div class="product-meta">
                <div class="meta-item">
                    <i class="fas fa-shipping-fast"></i>
                    <h4>Free Shipping</h4>
                    <p>On orders over ₹899</p>
                </div>
                <div class="meta-item">
                    <i class="fas fa-undo"></i>
                    <h4>Easy Returns</h4>
                    <p>30-day return policy</p>
                </div>
                <div class="meta-item">
                    <i class="fas fa-shield-alt"></i>
                    <h4>Secure Payment</h4>
                    <p>100% secure checkout</p>
                </div>
            </div>
        </div>
    `;
    
    console.log('Product detail displayed successfully');
}

// Update quantity
function updateQuantity(change) {
    currentQuantity = Math.max(1, currentQuantity + change);
    const quantityDisplay = document.querySelector('.quantity-display');
    if (quantityDisplay) {
        quantityDisplay.textContent = currentQuantity;
    }
}

// Add to cart from detail page
function addToCartDetail(productId) {
    const allProducts = [...supplements, ...clothes];
    const product = allProducts.find(p => p.id === productId);
    
    if (product) {
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += currentQuantity;
        } else {
            cart.push({
                ...product,
                quantity: currentQuantity
            });
        }
        
        // Save to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        updateCartDisplay();
        showNotification(`${currentQuantity} ${product.name} added to cart!`);
        
        // Reset quantity
        currentQuantity = 1;
        const quantityDisplay = document.querySelector('.quantity-display');
        if (quantityDisplay) {
            quantityDisplay.textContent = currentQuantity;
        }
    }
}

// Buy now function
function buyNow(productId) {
    const allProducts = [...supplements, ...clothes];
    const product = allProducts.find(p => p.id === productId);

    if (product) {
        // Add to cart first
        addToCartDetail(productId);

        // Show notification and redirect to checkout
        showNotification('Redirecting to checkout...');

        // Redirect to checkout page after a short delay
        setTimeout(() => {
            window.location.href = 'checkout.html';
        }, 1000);
    }
}

// Shopping Cart Functions
function addToCart(productId) {
    const allProducts = [...supplements, ...clothes];
    const product = allProducts.find(p => p.id === productId);
    
    if (product) {
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                ...product,
                quantity: 1
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        showNotification(`${product.name} added to cart!`);
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
}

function updateCartQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartDisplay();
        }
    }
}

function updateCartDisplay() {
    // Update cart count
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
    // Update cart items
    if (cartItems) {
        cartItems.innerHTML = '';
        
        if (cart.length === 0) {
            cartItems.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">Your cart is empty</p>';
        } else {
            cart.forEach(item => {
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                
                cartItem.innerHTML = `
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, 1)">+</button>
                        </div>
                    </div>
                    <button class="quantity-btn" onclick="removeFromCart(${item.id})" style="background: #ef4444; color: white;">×</button>
                `;
                
                cartItems.appendChild(cartItem);
            });
        }
    }
    
    // Update total
    if (cartTotal) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
    }
}

// Event Listeners
function setupEventListeners() {
    // Cart modal
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            if (cartModal) {
                cartModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    }
    
    if (closeCart) {
        closeCart.addEventListener('click', () => {
            if (cartModal) {
                cartModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    // Close cart when clicking outside
    if (cartModal) {
        cartModal.addEventListener('click', (e) => {
            if (e.target === cartModal) {
                cartModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    // Mobile navigation
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            if (navMenu) navMenu.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (hamburger) hamburger.classList.remove('active');
            if (navMenu) navMenu.classList.remove('active');
        });
    });
    
    // Checkout button
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length > 0) {
                showNotification('Thank you for your order! This is a demo site.');
                cart = [];
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartDisplay();
                if (cartModal) {
                    cartModal.classList.remove('active');
                    document.body.style.overflow = 'auto';
                }
            }
        });
    }
}

// Utility Functions
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgb(61, 236, 178);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 3000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function showError(message) {
    if (!productDetailContainer) {
        console.error('Product detail container not found for error display!');
        return;
    }
    
    productDetailContainer.innerHTML = `
        <div class="error-container">
            <i class="fas fa-exclamation-triangle"></i>
            <h2>${message}</h2>
            <p>The product you're looking for doesn't exist or has been removed.</p>
            <a href="index.html" class="btn btn-primary">Back to Products</a>
        </div>
    `;
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar && window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.9)';
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    } else if (navbar) {
        navbar.style.background = 'rgba(255, 255, 255, 0.8)';
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    }
});

// Keyboard navigation for cart modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartModal && cartModal.classList.contains('active')) {
        cartModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}); 