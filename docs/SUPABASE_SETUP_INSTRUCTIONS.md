# Supabase Database Setup Instructions

## Overview
I've connected your checkout system to Supabase database. Follow these steps to set up the required database tables and enable order processing.

## 🚀 Quick Setup Steps

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project: `eepeczgqficpjjxhilam`

### Step 2: Create Database Tables
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire content from `supabase-schema.sql` file
4. Paste it into the SQL editor
5. Click **"Run"** to execute the script

### Step 3: Verify Tables Created
Go to **Table Editor** and verify these tables exist:
- ✅ `orders` - Stores order information
- ✅ `order_items` - Stores individual order items
- ✅ `products` - Product catalog (with sample data)
- ✅ `customers` - Customer information for guest checkout

## 📊 Database Schema Overview

### Orders Table
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- order_number (VARCHAR, Unique)
- status (VARCHAR: pending, confirmed, processing, shipped, delivered, cancelled)
- subtotal, tax_amount, shipping_amount, total_amount (DECIMAL)
- billing_address, shipping_address (JSONB)
- payment_method (VARCHAR: card, upi, netbanking, cod)
- payment_status (VARCHAR: pending, paid, failed, refunded)
- customer_email, customer_phone (VARCHAR)
- created_at, updated_at (TIMESTAMP)
```

### Order Items Table
```sql
- id (UUID, Primary Key)
- order_id (UUID, Foreign Key to orders)
- product_id (INTEGER)
- quantity (INTEGER)
- unit_price, total_price (DECIMAL)
- product_name, product_image, product_description (VARCHAR/TEXT)
- created_at (TIMESTAMP)
```

## 🔐 Security Features

### Row Level Security (RLS)
- ✅ **Enabled** on all tables
- ✅ **Policies** allow users to access only their own orders
- ✅ **Guest checkout** supported (orders without user_id)
- ✅ **Public product access** for browsing

### Authentication Support
- ✅ **Authenticated users** - Orders linked to user accounts
- ✅ **Guest checkout** - Orders without authentication
- ✅ **Email verification** - Integrated with your auth system

## 🛒 How Orders Work Now

### Order Flow
1. **Customer fills checkout form** → Customer info collected
2. **Selects payment method** → UPI/Card/NetBanking
3. **Reviews order** → All details confirmed
4. **Places order** → Data saved to Supabase:
   - Order record created in `orders` table
   - Order items saved in `order_items` table
   - Cart cleared from localStorage
   - Redirect to confirmation page

### Order Data Structure
```javascript
// Example order saved to database
{
  "order_number": "FF1234567890ABCD",
  "status": "pending",
  "subtotal": 6797,
  "tax_amount": 408,  // 6% tax
  "shipping_amount": 0,
  "total_amount": 7205,
  "billing_address": {
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal": "400001"
  },
  "payment_method": "upi",
  "customer_email": "john@example.com",
  "customer_phone": "+91 9876543210"
}
```

## 🔍 Testing the Database Connection

### Test Order Placement
1. **Add items to cart** on your website
2. **Go to checkout** and fill all required fields
3. **Select UPI payment** and enter: `test@paytm`
4. **Complete checkout** process
5. **Check Supabase dashboard** → Table Editor → `orders` table
6. **Verify order appears** with all correct data

### Check Console Logs
Open browser Developer Tools (F12) and check console for:
```
✅ "Order object created"
✅ "Saving order to database..."
✅ "Order saved successfully"
✅ "Order items saved successfully"
```

## 📈 Database Management

### View Orders
```sql
-- View all orders
SELECT * FROM orders ORDER BY created_at DESC;

-- View orders with items
SELECT 
  o.order_number,
  o.total_amount,
  o.status,
  o.customer_email,
  oi.product_name,
  oi.quantity,
  oi.unit_price
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
ORDER BY o.created_at DESC;
```

### Update Order Status
```sql
-- Update order status
UPDATE orders 
SET status = 'confirmed', payment_status = 'paid'
WHERE order_number = 'FF1234567890ABCD';
```

## 🚨 Troubleshooting

### Common Issues

**1. "Permission denied" errors**
- Check RLS policies are created correctly
- Verify table permissions in Supabase dashboard

**2. "Table doesn't exist" errors**
- Run the SQL schema script again
- Check Table Editor to verify tables exist

**3. "Insert failed" errors**
- Check browser console for detailed error messages
- Verify all required fields are provided
- Check data types match schema

**4. Orders not appearing**
- Check if RLS policies allow viewing
- Verify user authentication status
- Check for JavaScript errors in console

### Debug Mode
The checkout system includes comprehensive logging. Check browser console for:
- Order data validation
- Database insert operations
- Error details and stack traces

## ✅ Success Indicators

When everything is working correctly, you should see:
1. ✅ Orders appearing in Supabase `orders` table
2. ✅ Order items in `order_items` table
3. ✅ Proper order numbers generated (FF + timestamp + random)
4. ✅ Customer information stored correctly
5. ✅ Payment method and totals calculated properly
6. ✅ Successful redirect to order confirmation page

## 🔄 Next Steps

After setup is complete:
1. **Test thoroughly** with different payment methods
2. **Monitor orders** in Supabase dashboard
3. **Set up email notifications** (optional)
4. **Configure payment processing** (for production)
5. **Add order management** features for admin

Your e-commerce checkout is now fully connected to Supabase database! 🎉
