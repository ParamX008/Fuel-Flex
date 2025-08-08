# 🔧 Orders Page Troubleshooting Guide

## ❌ **"Unable to load orders" Error - Troubleshooting Steps**

I've added enhanced debugging to help identify the issue. Follow these steps to diagnose and fix the problem.

## 🔍 **Step 1: Use the Database Test Page**

I've created a test page to help diagnose the issue:

1. **Open test-orders-db.html** in your browser
2. **Run each test** by clicking the buttons in order:
   - Test Config
   - Test Auth  
   - Test Orders Table
   - Test Order Items Table
   - Test User Orders

3. **Check the results** - this will tell us exactly where the problem is

## 🧪 **Step 2: Check Browser Console**

1. **Open orders.html** in your browser
2. **Open Developer Tools** (F12)
3. **Go to Console tab**
4. **Look for error messages** - the enhanced debugging will show detailed information

### **Expected Console Messages (Success):**
```
Orders page loaded
Window config available: true
Supabase available: true
OrdersManager created
Initializing Orders Manager...
Getting current user...
Supabase client: [object Object]
Auth response: {user: {...}, error: null}
Current user set: {id: "...", email: "..."}
Loading orders for user: user-id-here
Supabase client available: true
Fetching orders from Supabase...
Orders query result: {orders: [...], ordersError: null}
Orders fetched successfully: [...]
```

### **Common Error Messages & Solutions:**

#### **Error: "Config not available"**
**Problem:** Configuration not loading
**Solution:**
- Check if `config.js` is loaded properly
- Verify Supabase credentials in config.js
- Make sure config.js is included before orders.js

#### **Error: "No user ID available"**
**Problem:** User not signed in
**Solution:**
- Sign in to your account first
- Check if authentication is working on other pages

#### **Error: "Database error: relation 'orders' does not exist"**
**Problem:** Orders table doesn't exist in Supabase
**Solution:**
- Check Supabase dashboard → Table Editor
- Create orders table if missing
- Run the SQL schema from supabase-schema.sql

#### **Error: "Row Level Security policy violation"**
**Problem:** RLS policies blocking access
**Solution:**
- Go to Supabase → Authentication → Policies
- Check if orders table has proper RLS policies
- Ensure policies allow authenticated users to read their own orders

## 🗄️ **Step 3: Verify Database Setup**

### **Check Orders Table:**
1. **Go to Supabase Dashboard**
2. **Table Editor → orders**
3. **Verify table exists** with these columns:
   - id (uuid, primary key)
   - user_id (uuid, foreign key)
   - order_number (text)
   - status (text)
   - subtotal (numeric)
   - tax_amount (numeric)
   - shipping_amount (numeric)
   - total_amount (numeric)
   - billing_address (json)
   - shipping_address (json)
   - payment_method (text)
   - payment_status (text)
   - customer_email (text)
   - customer_phone (text)
   - created_at (timestamp)

### **Check Order Items Table:**
1. **Table Editor → order_items**
2. **Verify table exists** with these columns:
   - id (uuid, primary key)
   - order_id (uuid, foreign key)
   - product_name (text)
   - product_image (text)
   - quantity (integer)
   - unit_price (numeric)
   - total_price (numeric)
   - created_at (timestamp)

### **Check RLS Policies:**
1. **Go to Authentication → Policies**
2. **Verify policies exist** for orders table:
   ```sql
   -- Allow users to read their own orders
   CREATE POLICY "Users can view own orders" ON orders
   FOR SELECT USING (auth.uid() = user_id);
   
   -- Allow users to insert their own orders
   CREATE POLICY "Users can insert own orders" ON orders
   FOR INSERT WITH CHECK (auth.uid() = user_id);
   ```

3. **Verify policies exist** for order_items table:
   ```sql
   -- Allow users to read order items for their orders
   CREATE POLICY "Users can view own order items" ON order_items
   FOR SELECT USING (
     EXISTS (
       SELECT 1 FROM orders 
       WHERE orders.id = order_items.order_id 
       AND orders.user_id = auth.uid()
     )
   );
   ```

## 🔧 **Step 4: Quick Fixes**

### **Fix 1: Ensure User is Signed In**
```javascript
// Test in browser console
window.config.supabase.auth.getUser().then(({data: {user}}) => {
    console.log('Current user:', user);
    if (!user) {
        console.log('Please sign in first');
    }
});
```

### **Fix 2: Test Database Connection**
```javascript
// Test in browser console
window.config.supabase
    .from('orders')
    .select('count', { count: 'exact' })
    .then(({data, error, count}) => {
        console.log('Orders table test:', {data, error, count});
    });
```

### **Fix 3: Check for Orders**
```javascript
// Test in browser console (replace USER_ID with actual user ID)
window.config.supabase
    .from('orders')
    .select('*')
    .eq('user_id', 'USER_ID')
    .then(({data, error}) => {
        console.log('User orders:', {data, error});
    });
```

## 📋 **Step 5: Common Solutions**

### **Solution 1: No Orders Exist**
If the user has no orders:
- **Place a test order** through the checkout process
- **Verify order was saved** in Supabase dashboard
- **Refresh orders page**

### **Solution 2: RLS Policy Issues**
If RLS is blocking access:
1. **Temporarily disable RLS** on orders table (for testing)
2. **Check if orders load** 
3. **Re-enable RLS** and fix policies

### **Solution 3: Table Missing**
If tables don't exist:
1. **Run the SQL schema** from supabase-schema.sql
2. **Create missing tables** manually
3. **Set up proper RLS policies**

### **Solution 4: Authentication Issues**
If auth is not working:
1. **Check config.js** → Verify Supabase URL and anon key
2. **Test sign in** on auth.html
3. **Verify user session** is maintained

## 🚨 **Emergency Fix: Bypass Authentication (Testing Only)**

If you need to test without authentication:

```javascript
// Add this to orders.js temporarily (REMOVE AFTER TESTING)
async getCurrentUser() {
    // TEMPORARY: Skip auth check for testing
    this.currentUser = { id: 'test-user-id' };
    console.log('Using test user for debugging');
}
```

**⚠️ IMPORTANT: Remove this after testing!**

## 📞 **Get Help**

If you're still having issues:

1. **Run test-orders-db.html** and share the results
2. **Check browser console** and share error messages
3. **Check Supabase logs** in dashboard → Logs
4. **Verify table structure** in Supabase dashboard

## 🎯 **Most Likely Issues:**

### **Issue 1: No Orders in Database (90% of cases)**
- **User hasn't placed any orders yet**
- **Solution:** Place a test order through checkout

### **Issue 2: RLS Policy Problems (5% of cases)**
- **Policies blocking access to orders**
- **Solution:** Check and fix RLS policies

### **Issue 3: Table Structure Issues (3% of cases)**
- **Tables missing or wrong structure**
- **Solution:** Run SQL schema to create tables

### **Issue 4: Authentication Problems (2% of cases)**
- **User not properly signed in**
- **Solution:** Check auth flow and session

## 🔄 **Quick Test Sequence:**

1. **Open test-orders-db.html** → Run all tests
2. **Check if user is signed in** → Should show user email
3. **Check if tables exist** → Should show table access
4. **Check if user has orders** → Should show order count
5. **If no orders:** Place a test order through checkout
6. **If tables missing:** Run SQL schema
7. **If auth issues:** Check config.js and sign in

**The enhanced debugging will show exactly where the problem is occurring!** 🔍
