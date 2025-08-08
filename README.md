# Fuel & Flex - E-commerce Website with Authentication & Checkout
### LINK- https://fuel-flex-tau.vercel.app/

A complete e-commerce website for gym supplements and apparel with user authentication, shopping cart, and checkout functionality built with HTML, CSS, JavaScript, and Supabase.

## Features

### 🔐 Authentication System
- **Sign Up/Sign In**: Complete user registration and login
- **Password Strength**: Real-time password strength indicator
- **Email Verification**: Email confirmation for new accounts
- **Forgot Password**: Password reset functionality
- **Social Login**: Google OAuth integration
- **Session Management**: Persistent user sessions
- **Form Validation**: Real-time input validation

### 🛒 Shopping Cart
- **Add/Remove Items**: Add products to cart and manage quantities
- **Cart Persistence**: Cart data saved in localStorage
- **Real-time Updates**: Dynamic cart count and total calculation
- **Cart Modal**: Slide-out cart interface

### 💳 Checkout System
- **Multi-step Checkout**: Information → Payment → Review
- **Customer Information**: Billing and shipping address forms
- **Payment Methods**: Credit Card, UPI, Net Banking
- **Order Summary**: Real-time total calculation with tax and shipping
- **Form Validation**: Comprehensive input validation
- **Order Confirmation**: Success page with order details

### 🎨 Design Features
- **Glassmorphism UI**: Modern glass-like design aesthetic
- **Responsive Design**: Mobile-first approach
- **Smooth Animations**: CSS transitions and animations
- **Dark Theme**: Elegant dark background with glass effects
- **Loading States**: Skeleton loaders and spinners

## File Structure

```
FUEL&FLEX/
├── index.html              # Main homepage
├── auth.html               # Authentication page
├── checkout.html           # Checkout page
├── order-confirmation.html # Order confirmation page
├── product-detail.html     # Individual product pages
├── styles.css              # Main stylesheet
├── auth.css                # Authentication styles
├── checkout.css            # Checkout styles
├── product-detail.css      # Product detail styles
├── script.js               # Main JavaScript
├── auth.js                 # Authentication logic
├── checkout.js             # Checkout logic
├── product-detail.js       # Product detail logic
├── config.js               # Supabase configuration
├── README.md               # This file
└── Images/                 # Product images
    ├── prot.jpg
    ├── BCAA.webp
    ├── compression.webp
    └── ... (other images)
```

## Setup Instructions

### 1. Supabase Setup


 **Database Schema**:
   

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Addresses table
CREATE TABLE addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  type TEXT CHECK (type IN ('billing', 'shipping')),
  full_name TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT,
  features TEXT[],
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  shipping_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  billing_address JSONB NOT NULL,
  shipping_address JSONB NOT NULL,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  product_snapshot JSONB NOT NULL
);

-- Row Level Security Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Addresses policies
CREATE POLICY "Users can view own addresses" ON addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses" ON addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" ON addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses" ON addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Order items policies
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

CREATE POLICY "Users can insert own order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );
```

## Usage

### For Users

1. **Browse Products**: Visit the homepage to see supplements and apparel
2. **Add to Cart**: Click "Add to Cart" on any product
3. **View Cart**: Click the cart icon to see your items
4. **Checkout**: Click "Checkout" to start the purchase process
5. **Sign In/Up**: Create an account or sign in during checkout
6. **Complete Order**: Fill in shipping and payment information
7. **Order Confirmation**: Review your order and receive confirmation

### For Developers

1. **Customize Products**: Edit the product arrays in `script.js`
2. **Modify Styling**: Update CSS variables in `styles.css`
3. **Add Features**: Extend the JavaScript classes for new functionality
4. **Database Changes**: Modify the Supabase schema as needed

## Security Features

- **Input Validation**: Client and server-side validation
- **SQL Injection Prevention**: Parameterized queries via Supabase
- **XSS Protection**: Input sanitization
- **CSRF Protection**: Supabase built-in protection
- **Password Security**: Strong password requirements
- **Session Management**: Secure session handling

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Dependencies

- **Supabase**: Backend-as-a-Service
- **Font Awesome**: Icons
- **Google Fonts**: Typography
- **Vanilla JavaScript**: No framework dependencies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request


## Changelog

### v2.0.0 (Current)
- ✅ Complete authentication system
- ✅ Multi-step checkout process
- ✅ Order management
- ✅ Responsive design
- ✅ Supabase integration

### v1.0.0
- ✅ Basic e-commerce functionality
- ✅ Product catalog
- ✅ Shopping cart
- ✅ Glassmorphism design

---

**Note**: This is a demo project


