// Authentication System
class AuthSystem {
    constructor() {
        this.supabase = window.config?.supabase;
        this.currentUser = null;
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing auth system...');
            console.log('Supabase client:', this.supabase);

            // Email verification removed - direct authentication only

            // Check for existing session
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.currentUser = session.user;
                this.redirectIfAuthenticated();
            }

            this.setupEventListeners();
            this.setupPasswordStrength();
            console.log('Auth system initialized successfully');
        } catch (error) {
            console.error('Error initializing auth system:', error);
            this.showNotification('Failed to initialize authentication system', 'error');
        }
    }

    setupEventListeners() {
        // Form toggle
        const toggleBtns = document.querySelectorAll('.toggle-btn');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => this.toggleForm(btn.dataset.form));
        });

        // Password visibility toggles
        const passwordToggles = document.querySelectorAll('.password-toggle');
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => this.togglePasswordVisibility(e));
        });

        // Form submissions
        document.getElementById('signin-form').addEventListener('submit', (e) => this.handleSignIn(e));
        document.getElementById('signup-form').addEventListener('submit', (e) => this.handleSignUp(e));
        document.getElementById('forgot-form').addEventListener('submit', (e) => this.handleForgotPassword(e));

        // Forgot password link
        document.querySelector('.forgot-password').addEventListener('click', (e) => {
            e.preventDefault();
            this.showForgotPasswordForm();
        });

        // Back to sign in link
        document.querySelector('.back-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignInForm();
        });

        // Social login
        document.querySelectorAll('.google-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleGoogleLogin());
        });

        // Real-time password strength
        const signupPassword = document.getElementById('signup-password');
        if (signupPassword) {
            signupPassword.addEventListener('input', (e) => this.updatePasswordStrength(e.target.value));
        }

        // Password confirmation validation
        const confirmPassword = document.getElementById('signup-confirm-password');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', () => this.validatePasswordMatch());
        }
    }

    setupPasswordStrength() {
        this.passwordStrengthFill = document.querySelector('.strength-fill');
        this.passwordStrengthText = document.querySelector('.strength-text');
    }

    toggleForm(formType) {
        // Update toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-form="${formType}"]`).classList.add('active');

        // Show/hide forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${formType}-form`).classList.add('active');

        // Update header
        const header = document.querySelector('.auth-header');
        if (formType === 'signin') {
            header.innerHTML = `
                <h1>Welcome Back</h1>
                <p>Sign in to your account</p>
            `;
        } else {
            header.innerHTML = `
                <h1>Create Account</h1>
                <p>Join Fuel & Flex today</p>
            `;
        }
    }

    showForgotPasswordForm() {
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById('forgot-form').classList.add('active');

        document.querySelector('.auth-header').innerHTML = `
            <h1>Reset Password</h1>
            <p>Enter your email to receive a reset link</p>
        `;
    }

    showSignInForm() {
        this.toggleForm('signin');
    }

    togglePasswordVisibility(e) {
        const button = e.currentTarget;
        const input = button.parentElement.querySelector('input');
        const icon = button.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    updatePasswordStrength(password) {
        if (!this.passwordStrengthFill || !this.passwordStrengthText) return;

        const strength = this.calculatePasswordStrength(password);
        
        this.passwordStrengthFill.className = 'strength-fill';
        this.passwordStrengthFill.classList.add(strength.level);
        this.passwordStrengthText.textContent = strength.text;
    }

    calculatePasswordStrength(password) {
        let score = 0;
        let feedback = [];

        if (password.length >= 8) score += 1;
        if (password.match(/[a-z]/)) score += 1;
        if (password.match(/[A-Z]/)) score += 1;
        if (password.match(/[0-9]/)) score += 1;
        if (password.match(/[^a-zA-Z0-9]/)) score += 1;

        if (score <= 1) return { level: 'weak', text: 'Weak password' };
        if (score <= 2) return { level: 'fair', text: 'Fair password' };
        if (score <= 3) return { level: 'good', text: 'Good password' };
        return { level: 'strong', text: 'Strong password' };
    }

    validatePasswordMatch() {
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        const confirmInput = document.getElementById('signup-confirm-password');

        if (confirmPassword && password !== confirmPassword) {
            confirmInput.style.borderColor = '#ef4444';
            return false;
        } else {
            confirmInput.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            return true;
        }
    }

    async handleSignIn(e) {
        e.preventDefault();
        if (this.isLoading) return;

        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;

        if (!this.validateEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        if (!password) {
            this.showNotification('Please enter your password', 'error');
            return;
        }

        this.setLoadingState('signin', true);

        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            this.currentUser = data.user;
            this.showNotification('Successfully signed in!', 'success');
            
            // Redirect to intended page or home
            setTimeout(() => {
                const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
                window.location.href = redirectUrl;
            }, 1000);

        } catch (error) {
            console.error('Sign in error:', error);
            console.log('Full error object:', error);

            const errorMessage = this.getErrorMessage(error);
            this.showNotification(errorMessage, 'error');

            // Removed email verification check - direct sign in only
        } finally {
            this.setLoadingState('signin', false);
        }
    }

    async handleSignUp(e) {
        e.preventDefault();
        if (this.isLoading) return;

        console.log('Sign up form submitted');

        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        const agreeTerms = document.getElementById('agree-terms').checked;

        console.log('Form data:', { name, email, password: '***', confirmPassword: '***', agreeTerms });

        // Validation
        if (!name.trim()) {
            this.showNotification('Please enter your full name', 'error');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        if (password.length < 8) {
            this.showNotification('Password must be at least 8 characters long', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }

        if (!agreeTerms) {
            this.showNotification('Please agree to the terms and conditions', 'error');
            return;
        }

        this.setLoadingState('signup', true);

        try {
            console.log('Attempting to sign up with Supabase...');
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name
                    }
                    // Removed emailRedirectTo to disable email verification
                }
            });

            console.log('Supabase response:', { data, error });

            if (error) throw error;

            // Handle successful sign up
            if (data.user) {
                console.log('User created successfully:', data.user);

                if (data.session) {
                    // User is automatically signed in (email confirmation disabled)
                    this.currentUser = data.user;
                    this.showNotification('Account created and signed in successfully!', 'success');

                    setTimeout(() => {
                        const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
                        window.location.href = redirectUrl;
                    }, 1500);
                } else {
                    // User created but not automatically signed in
                    this.showNotification('Account created successfully! You can now sign in.', 'success');

                    // Pre-fill email in sign-in form
                    setTimeout(() => {
                        this.toggleForm('signin');
                        document.getElementById('signin-email').value = email;
                    }, 1500);
                }
            } else {
                this.showNotification('Account created successfully! Please sign in.', 'success');
                this.toggleForm('signin');
            }

        } catch (error) {
            console.error('Sign up error:', error);
            this.showNotification(this.getErrorMessage(error), 'error');
        } finally {
            this.setLoadingState('signup', false);
        }
    }

    async handleForgotPassword(e) {
        e.preventDefault();
        if (this.isLoading) return;

        const email = document.getElementById('forgot-email').value;

        if (!this.validateEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        this.setLoadingState('forgot', true);

        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth.html?reset=true`
            });

            if (error) throw error;

            this.showNotification('Password reset link sent to your email!', 'success');

        } catch (error) {
            console.error('Forgot password error:', error);
            this.showNotification(this.getErrorMessage(error), 'error');
        } finally {
            this.setLoadingState('forgot', false);
        }
    }

    async handleGoogleLogin() {
        try {
            console.log('Attempting Google login...');
            console.log('Supabase client:', this.supabase);

            // Check if Supabase client is available
            if (!this.supabase) {
                throw new Error('Supabase client not initialized');
            }

            const { data, error } = await this.supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/index.html`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            });

            console.log('Google login response:', { data, error });

            if (error) {
                // Check for specific Google OAuth errors
                if (error.message.includes('OAuth')) {
                    throw new Error('Google OAuth is not configured. Please contact support.');
                }
                throw error;
            }

            // If we reach here, the redirect should happen automatically
            console.log('Google login initiated successfully');

        } catch (error) {
            console.error('Google login error:', error);

            // Provide more specific error messages
            let errorMessage = 'Google sign-in failed. ';
            if (error.message.includes('OAuth')) {
                errorMessage += 'Google authentication is not properly configured.';
            } else if (error.message.includes('network')) {
                errorMessage += 'Please check your internet connection.';
            } else {
                errorMessage += error.message || 'Please try again later.';
            }

            this.showNotification(errorMessage, 'error');
        }
    }

    setLoadingState(formType, loading) {
        this.isLoading = loading;
        const btn = document.querySelector(`#${formType}-form .auth-btn`);
        const btnText = btn.querySelector('.btn-text');
        const btnLoader = btn.querySelector('.btn-loader');

        if (loading) {
            btn.disabled = true;
            btn.classList.add('loading');
            if (btnText) btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'flex';
        } else {
            btn.disabled = false;
            btn.classList.remove('loading');
            if (btnText) btnText.style.display = 'inline';
            if (btnLoader) btnLoader.style.display = 'none';
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    getErrorMessage(error) {
        const message = error.message || '';

        // Handle various Supabase error messages
        if (message.includes('Invalid login credentials') || message.includes('invalid_credentials')) {
            return 'Invalid email or password. Please check your credentials and try again.';
        }

        if (message.includes('Email not confirmed') || message.includes('email_not_confirmed')) {
            return 'Please verify your email address before signing in. Check your inbox for the verification link.';
        }

        if (message.includes('User already registered') || message.includes('user_already_exists')) {
            return 'An account with this email already exists. Try signing in instead.';
        }

        if (message.includes('Password should be at least 6 characters') || message.includes('password_too_short')) {
            return 'Password must be at least 6 characters long.';
        }

        if (message.includes('Signup requires a valid password') || message.includes('weak_password')) {
            return 'Please enter a stronger password (at least 6 characters).';
        }

        if (message.includes('Unable to validate email address') || message.includes('invalid_email')) {
            return 'Please enter a valid email address.';
        }

        if (message.includes('Too many requests') || message.includes('rate_limit')) {
            return 'Too many attempts. Please wait a moment before trying again.';
        }

        // Default fallback
        return message || 'An error occurred. Please try again.';
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

    // Email verification removed - direct authentication only

    // Email verification methods removed - direct authentication only

    // Resend verification button removed - direct authentication only



    redirectIfAuthenticated() {
        // If user is already authenticated, redirect to home
        if (this.currentUser && window.location.pathname.includes('auth.html')) {
            window.location.href = 'index.html';
        }
    }

    // Static methods for use in other files
    static async getCurrentUser() {
        const { data: { user } } = await window.config.supabase.auth.getUser();
        return user;
    }

    static async signOut() {
        const { error } = await window.config.supabase.auth.signOut();
        if (!error) {
            window.location.href = 'index.html';
        }
        return { error };
    }

    static async updateProfile(updates) {
        const { data, error } = await window.config.supabase.auth.updateUser({
            data: updates
        });
        return { data, error };
    }
}

// Initialize auth system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const startAuth = () => {
        try {
            window.authSystem = new AuthSystem();
            // Handle password reset from URL
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('reset') === 'true') {
                window.authSystem.showNotification('Please check your email for password reset instructions.', 'success');
            }
        } catch (e) {
            console.error('Auth initialization error:', e);
        }
    };

    // Ensure Supabase library is present
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase not loaded. Please check your configuration.');
        return;
    }

    // If config not ready, wait for it (event + short polling)
    if (typeof window.config === 'undefined' || !window.config.supabase) {
        console.log('Config not ready yet. Waiting for configReady...');
        let attempts = 0;
        const maxAttempts = 50; // ~5 seconds
        const intervalId = setInterval(() => {
            attempts++;
            if (window.config && window.config.supabase) {
                clearInterval(intervalId);
                startAuth();
            } else if (attempts >= maxAttempts) {
                clearInterval(intervalId);
                console.error('Config not loaded after waiting. Auth cannot initialize.');
            }
        }, 100);

        window.addEventListener('configReady', () => {
            clearInterval(intervalId);
            startAuth();
        }, { once: true });
        return;
    }

    // Config is ready
    startAuth();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthSystem;
} 