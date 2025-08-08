-- Supabase Database Schema for Fuel & Flex E-commerce
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    shipping_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    billing_address JSONB NOT NULL,
    shipping_address JSONB NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('card', 'upi', 'netbanking', 'cod')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    product_snapshot JSONB,
    product_name VARCHAR(255),
    product_image VARCHAR(500),
    product_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Products Table (for future use)
-- First, try to create the table with correct schema
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image VARCHAR(500),
    category VARCHAR(50),
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If table already exists without image column, add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'image'
    ) THEN
        ALTER TABLE products ADD COLUMN image VARCHAR(500);
    END IF;
END $$;

-- 4. Create Customers Table (for guest checkout)
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Profiles Table (for user profile data)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 6. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create triggers for updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies

-- Orders policies
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own orders" ON orders
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Order items policies
CREATE POLICY "Users can view order items for their orders" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
        )
    );

CREATE POLICY "Users can insert order items for their orders" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
        )
    );

-- Products policies (public read access)
CREATE POLICY "Anyone can view active products" ON products
    FOR SELECT USING (is_active = true);

-- Customers policies
CREATE POLICY "Users can view their own customer data" ON customers
    FOR SELECT USING (true); -- Allow all for guest checkout

CREATE POLICY "Users can insert customer data" ON customers
    FOR INSERT WITH CHECK (true); -- Allow all for guest checkout

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 10. Insert sample products (optional)
INSERT INTO products (name, description, price, image, category, stock_quantity) VALUES
('Whey Protein Pro', 'High-quality whey protein isolate for muscle recovery and growth. 24g protein, 5.5g BCAAs per serving.', 2499.00, 'prot.jpg', 'protein', 100),
('Mass Gainer Pro', 'High-calorie mass gainer with premium protein blend for serious muscle building.', 3299.00, 'mass.jpg', 'mass-gainer', 50),
('BCAA Amino Acids', 'Essential amino acids for muscle recovery and endurance during intense workouts.', 1100.00, 'BCAA.webp', 'amino-acids', 75),
('Pre-Workout Boost', 'Advanced pre-workout formula for explosive energy and enhanced performance.', 1899.00, 'preworkout.jpg', 'pre-workout', 60),
('Creatine Monohydrate', 'Pure creatine monohydrate for increased strength, power, and muscle mass.', 999.00, 'creatine.jpg', 'creatine', 80),
('Multivitamin Complex', 'Complete daily multivitamin with essential nutrients for optimal health and performance.', 799.00, 'multivitamin.jpg', 'vitamins', 120),
('Performance Tank Top', 'Moisture-wicking tank top for maximum comfort during intense workouts.', 699.00, 'tanktop.jpg', 'tops', 200),
('Compression Shorts', 'High-performance compression shorts for support and comfort during training.', 899.00, 'compression.webp', 'bottoms', 150),
('Training Hoodie', 'Premium cotton blend hoodie perfect for gym sessions and casual wear.', 1299.00, 'hoodie.jpg', 'tops', 100),
('Athletic Joggers', 'Comfortable and stylish joggers designed for active lifestyles.', 1199.00, 'joggers.jpg', 'bottoms', 120),
('Gym Gloves Pro', 'Professional-grade gym gloves for enhanced grip and hand protection.', 599.00, 'gloves.jpg', 'accessories', 80),
('Protein Shaker', 'Premium protein shaker bottle with mixing ball for smooth protein shakes.', 299.00, 'shaker.jpg', 'accessories', 300)
ON CONFLICT (name) DO NOTHING;
