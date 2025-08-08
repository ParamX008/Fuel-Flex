// Supabase Configuration
const supabaseConfig = {
    url: 'https://eepeczgqficpjjxhilam.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcGVjemdxZmljcGpqeGhpbGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NDEyMjUsImV4cCI6MjA3MDExNzIyNX0.DNhly0nlshbFLIwB0nG0dfqthEbobd7FumKFMj8HEzQ',
    options: {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
};

console.log('Config.js loaded, Supabase config ready');

// Simple initialization function
function initializeConfig() {
    console.log('Initializing config...');
    console.log('Window supabase available:', typeof window.supabase !== 'undefined');

    if (typeof window.supabase === 'undefined') {
        console.error('Supabase library not loaded!');
        return false;
    }

    try {
        // Create Supabase client
        const supabaseClient = window.supabase.createClient(
            supabaseConfig.url,
            supabaseConfig.anonKey,
            supabaseConfig.options
        );

        // Create config object
        window.config = {
            supabase: supabaseClient,
            app: {
                name: 'Fuel & Flex',
                version: '2.0.0'
            },
            features: {
                socialLogin: true,
                emailVerification: true,
                guestCheckout: true
            }
        };

        // Notify listeners that config is ready
        try { window.dispatchEvent(new Event('configReady')); } catch (e) { /* noop */ }

        console.log('Config initialized successfully!');
        console.log('Supabase client:', window.config.supabase);
        return true;
    } catch (error) {
        console.error('Error initializing config:', error);
        return false;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing config...');
        setTimeout(initializeConfig, 100);
    });
} else {
    console.log('DOM already loaded, initializing config...');
    setTimeout(initializeConfig, 100);
}