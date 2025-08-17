-- Row Level Security Policies for E-commerce

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Categories policies (public read, admin write)
CREATE POLICY "Categories are viewable by everyone"
    ON categories FOR SELECT
    USING (true);

CREATE POLICY "Only admins can insert categories"
    ON categories FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update categories"
    ON categories FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete categories"
    ON categories FOR DELETE
    USING (auth.jwt() ->> 'role' = 'admin');

-- Products policies (public read, admin write)
CREATE POLICY "Products are viewable by everyone"
    ON products FOR SELECT
    USING (true);

CREATE POLICY "Only admins can insert products"
    ON products FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update products"
    ON products FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete products"
    ON products FOR DELETE
    USING (auth.jwt() ->> 'role' = 'admin');

-- Profiles policies (users can read/update their own profile, admins can read all)
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles can be inserted by the user themselves"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Cart items policies (users can only access their own cart)
CREATE POLICY "Users can view their own cart items"
    ON cart_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items"
    ON cart_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items"
    ON cart_items FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items"
    ON cart_items FOR DELETE
    USING (auth.uid() = user_id);

-- Orders policies (users can access their own orders, admins can access all)
CREATE POLICY "Users can view their own orders"
    ON orders FOR SELECT
    USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can create their own orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders, admins can update any"
    ON orders FOR UPDATE
    USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

-- Order items policies (follow order access rules)
CREATE POLICY "Users can view their own order items"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND (orders.user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin')
        )
    );

CREATE POLICY "Users can insert order items for their own orders"
    ON order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(auth.jwt() ->> 'role', '') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current user profile
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS profiles AS $$
DECLARE
    profile profiles%ROWTYPE;
BEGIN
    SELECT * INTO profile 
    FROM profiles 
    WHERE id = auth.uid();
    
    RETURN profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;