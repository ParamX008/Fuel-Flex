-- Add session_id column to orders table for guest order tracking
-- Run this in Supabase SQL Editor

-- Add session_id column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Create index for faster queries on session_id
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders(session_id);

-- Update RLS policies to allow access by session_id for guest users
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;

-- Create new policies that work for both authenticated and guest users
CREATE POLICY "Users can view own orders" ON orders
FOR SELECT USING (
    auth.uid() = user_id OR 
    (user_id IS NULL AND session_id IS NOT NULL)
);

CREATE POLICY "Users can insert own orders" ON orders
FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    (user_id IS NULL AND session_id IS NOT NULL)
);

-- Update order_items policies to work with session-based orders
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;

CREATE POLICY "Users can view own order items" ON order_items
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id 
        AND (
            orders.user_id = auth.uid() OR 
            (orders.user_id IS NULL AND orders.session_id IS NOT NULL)
        )
    )
);

CREATE POLICY "Users can insert own order items" ON order_items
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id 
        AND (
            orders.user_id = auth.uid() OR 
            (orders.user_id IS NULL AND orders.session_id IS NOT NULL)
        )
    )
);

-- Enable RLS on both tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
