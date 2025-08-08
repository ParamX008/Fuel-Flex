// Authentication and User Management
let currentUser = null;

// Initialize authentication
async function initAuth() {
    try {
        console.log('Initializing auth in main script...');

        // Check if config is available
        if (!window.config || !window.config.supabase) {
            console.error('Config or Supabase client not available');
            return;
        }

        console.log('Config available, getting session...');
        const { data: { session } } = await window.config.supabase.auth.getSession();
        console.log('Session:', session);

        if (session) {
            currentUser = session.user;
            updateAuthUI();
        }

        // Listen for auth changes
        window.config.supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session);
            if (event === 'SIGNED_IN') {
                currentUser = session.user;
                updateAuthUI();

                // Create or update user profile on first sign in
                await createUserProfile(session.user);
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                updateAuthUI();
            }
        });

        console.log('Auth initialization completed');
    } catch (error) {
        console.error('Auth initialization error:', error);
    }
}

function updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');
    const userBtn = document.getElementById('user-btn');
    const debugInfo = document.getElementById('debug-info');
    const authStatus = document.getElementById('auth-status');

    // Show debug info
    if (debugInfo) debugInfo.style.display = 'block';

    if (currentUser) {
        console.log('Updating UI for signed-in user:', currentUser);
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';

        // Update debug status
        if (authStatus) authStatus.textContent = `Signed in as ${currentUser.email}`;

        // Set user name with priority: full_name > name > email username
        const name = currentUser.user_metadata?.full_name ||
                    currentUser.user_metadata?.name ||
                    currentUser.email?.split('@')[0] ||
                    'User';
        userName.textContent = name;

        // Add user avatar if available
        const userIcon = userBtn.querySelector('i.fas.fa-user-circle');
        if (currentUser.user_metadata?.avatar_url && userIcon) {
            // Replace icon with avatar image
            const avatar = document.createElement('img');
            avatar.src = currentUser.user_metadata.avatar_url;
            avatar.alt = 'User Avatar';
            avatar.className = 'user-avatar';
            avatar.style.cssText = 'width: 24px; height: 24px; border-radius: 50%; object-fit: cover; margin-right: 0.5rem;';
            userIcon.replaceWith(avatar);
        }

        // Update user info in dropdown
        const userEmail = document.getElementById('user-email');
        if (userEmail) {
            userEmail.textContent = currentUser.email || 'No email';
        }

        // Show welcome notification for new sign-ins
        if (!sessionStorage.getItem('welcomeShown')) {
            showNotification(`Welcome back, ${name}!`, 'success');
            sessionStorage.setItem('welcomeShown', 'true');
        }

    } else {
        console.log('Updating UI for signed-out user');
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';

        // Update debug status
        if (authStatus) authStatus.textContent = 'Not signed in';

        // Reset avatar to icon if it was changed
        const avatar = userBtn?.querySelector('.user-avatar');
        if (avatar) {
            const icon = document.createElement('i');
            icon.className = 'fas fa-user-circle';
            avatar.replaceWith(icon);
        }

        // Clear welcome notification flag
        sessionStorage.removeItem('welcomeShown');
    }
}

// Create or update user profile on sign in
async function createUserProfile(user) {
    try {
        console.log('Creating/updating user profile for:', user.id);

        const profileData = {
            id: user.id,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            email: user.email,
            phone: user.user_metadata?.phone || null,
            updated_at: new Date().toISOString()
        };

        console.log('Profile data:', profileData);

        // Use upsert to create or update profile
        const { data, error } = await window.config.supabase
            .from('profiles')
            .upsert(profileData, { onConflict: 'id' })
            .select();

        if (error) {
            console.error('Error creating/updating profile:', error);
        } else {
            console.log('Profile created/updated successfully:', data);
        }
    } catch (error) {
        console.error('Error in createUserProfile:', error);
    }
}

// Global function to toggle user dropdown
function toggleUserDropdown() {
    console.log('toggleUserDropdown called');
    const userDropdown = document.getElementById('user-dropdown');
    if (userDropdown) {
        userDropdown.classList.toggle('active');
        console.log('Dropdown toggled, active:', userDropdown.classList.contains('active'));
    } else {
        console.error('User dropdown not found');
    }
}

// Global function to test profile navigation
function testProfileNavigation() {
    console.log('Testing profile navigation...');
    console.log('Current user:', currentUser);
    if (currentUser) {
        console.log('User is signed in, navigating to profile...');
        window.location.href = 'profile.html';
    } else {
        console.log('User not signed in');
        alert('Please sign in first to access your profile');
    }
}

function setupAuthEventListeners() {
    // User dropdown toggle
    const userBtn = document.getElementById('user-btn');
    const userDropdown = document.getElementById('user-dropdown');

    console.log('Setting up auth event listeners...', { userBtn, userDropdown });

    if (userBtn && userDropdown) {
        userBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('User button clicked, toggling dropdown');
            userDropdown.classList.toggle('active');
            console.log('Dropdown active state:', userDropdown.classList.contains('active'));
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('active');
            }
        });

        // Add click listeners to dropdown items for debugging
        const profileLink = document.querySelector('a[href="profile.html"]');
        if (profileLink) {
            profileLink.addEventListener('click', (e) => {
                console.log('Profile link clicked');
                // Let the default behavior happen (navigation)
            });
        }

        console.log('Auth event listeners set up successfully');
    } else {
        console.error('User button or dropdown not found:', { userBtn, userDropdown });
    }

    // Sign out button
    const signoutBtn = document.getElementById('signout-btn');
    if (signoutBtn) {
        signoutBtn.addEventListener('click', async () => {
            try {
                await window.config.supabase.auth.signOut();
                showNotification('Signed out successfully', 'success');
            } catch (error) {
                console.error('Sign out error:', error);
                showNotification('Error signing out', 'error');
            }
        });
    }
}

// Product Data
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
        description: "Branched-chain amino acids to support muscle recovery and reduce fatigue in a new apple flavour.",
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
        description: "Advanced pre-workout blend for maximum energy and focus.",
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

// DOM Elements are now accessed dynamically in functions to avoid null references

// This function is now handled by the main DOMContentLoaded listener below

// Load products into the grid
function loadProducts() {
    const supplementsGrid = document.getElementById('supplements-grid');
    const clothesGrid = document.getElementById('clothes-grid');

    // Load supplements
    if (supplementsGrid) {
        supplements.forEach(product => {
            const productCard = createProductCard(product);
            supplementsGrid.appendChild(productCard);
        });
    }

    // Load clothes
    if (clothesGrid) {
        clothes.forEach(product => {
            const productCard = createProductCard(product);
            clothesGrid.appendChild(productCard);
        });
    }
}

// Create product card element
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card loading';
    
    card.innerHTML = `
        <div class="product-image" onclick="openProductDetail(${product.id})">
            <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="product-info">
            <h3 class="product-title" onclick="openProductDetail(${product.id})">${product.name}</h3>
            <div class="product-price">₹${product.price.toLocaleString('en-IN')}</div>
            <p class="product-description">${product.description}</p>
            <button class="add-to-cart" onclick="addToCart(${product.id})">
                Add to Cart
            </button>
        </div>
    `;

    // Add animation delay
    setTimeout(() => {
        card.classList.add('loaded');
    }, 100);

    return card;
}

// Shopping Cart Functions
function addToCart(productId) {
    const product = [...supplements, ...clothes].find(p => p.id === productId);
    
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

function updateQuantity(productId, change) {
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
    // Get DOM elements
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

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
                            <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
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
    // Get DOM elements
    const cartBtn = document.getElementById('cart-btn');
    const cartModal = document.getElementById('cart-modal');
    const closeCart = document.getElementById('close-cart');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Cart modal
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            cartModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeCart) {
        closeCart.addEventListener('click', () => {
            cartModal.classList.remove('active');
            document.body.style.overflow = 'auto';
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
            navMenu.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            const hamburger = document.getElementById('hamburger');
            const navMenu = document.getElementById('nav-menu');
            if (hamburger) hamburger.classList.remove('active');
            if (navMenu) navMenu.classList.remove('active');
        });
    });

    // Checkout button
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length > 0) {
                window.location.href = 'checkout.html';
            } else {
                showNotification('Your cart is empty!', 'warning');
            }
        });
    }
    
    // Form submissions - only on main page
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showNotification('Message sent! We\'ll get back to you soon.');
            e.target.reset();
        });
    }
    
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showNotification('Thank you for subscribing!');
            e.target.reset();
        });
    }

    // Setup authentication event listeners
    setupAuthEventListeners();

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Setup authentication event listeners
    setupAuthEventListeners();
}

// Utility Functions
function openProductDetail(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');

    // Define colors for different types
    const colors = {
        success: 'rgb(61, 236, 178)',
        error: 'rgb(239, 68, 68)',
        warning: 'rgb(245, 158, 11)',
        info: 'rgb(59, 130, 246)'
    };

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.success};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 3000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        font-weight: 500;
        max-width: 300px;
        word-wrap: break-word;
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

// Scroll animations
function animateOnScroll() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('loaded');
            }
        });
    }, observerOptions);
    
    // Observe all elements with loading class
    document.querySelectorAll('.loading').forEach(el => {
        observer.observe(el);
    });
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.9)';
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.8)';
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    }
});

// Add loading animation to all product cards
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, waiting for config...');

    // Wait for config to be available
    let attempts = 0;
    while ((!window.config || !window.config.supabase) && attempts < 10) {
        console.log('Waiting for config... attempt', attempts + 1);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    if (!window.config || !window.config.supabase) {
        console.error('Config not available after waiting');
    } else {
        console.log('Config available, initializing...');
        // Initialize authentication first
        await initAuth();
    }

    // Only load products if we're on the main page
    if (document.getElementById('supplements-grid') && document.getElementById('clothes-grid')) {
        loadProducts();
    }

    setupEventListeners();
    updateCartDisplay();
    animateOnScroll();

    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('loaded');
        }, index * 100);
    });
});

// Keyboard navigation for cart modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartModal && cartModal.classList.contains('active')) {
        cartModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// Touch gestures for mobile
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0 && cartModal && cartModal.classList.contains('active')) {
            // Swipe left to close cart
            cartModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
} 