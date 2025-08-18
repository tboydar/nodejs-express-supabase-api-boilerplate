-- Multilingual Support Schema

-- Product translations table
CREATE TABLE product_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    meta_title VARCHAR(200),
    meta_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, language_code)
);

-- Category translations table  
CREATE TABLE category_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    meta_title VARCHAR(200),
    meta_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, language_code)
);

-- Supported languages table
CREATE TABLE supported_languages (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    native_name VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert supported languages
INSERT INTO supported_languages (code, name, native_name, is_active, is_default) VALUES
('en', 'English', 'English', true, true),
('zh-TW', 'Traditional Chinese', '正體中文', true, false),
('de', 'German', 'Deutsch', true, false);

-- Create indexes for better performance
CREATE INDEX idx_product_translations_product_id ON product_translations(product_id);
CREATE INDEX idx_product_translations_language_code ON product_translations(language_code);
CREATE INDEX idx_category_translations_category_id ON category_translations(category_id);
CREATE INDEX idx_category_translations_language_code ON category_translations(language_code);

-- Create updated_at triggers for translation tables
CREATE TRIGGER update_product_translations_updated_at 
    BEFORE UPDATE ON product_translations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_translations_updated_at 
    BEFORE UPDATE ON category_translations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get product with translation
CREATE OR REPLACE FUNCTION get_product_with_translation(
    p_product_id UUID,
    p_language_code VARCHAR(10) DEFAULT 'en'
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'id', p.id,
        'sku', p.sku,
        'price', p.price,
        'stock_quantity', p.stock_quantity,
        'category_id', p.category_id,
        'image_url', p.image_url,
        'images', p.images,
        'is_active', p.is_active,
        'weight', p.weight,
        'dimensions', p.dimensions,
        'created_at', p.created_at,
        'updated_at', p.updated_at,
        'name', COALESCE(pt.name, p.name),
        'description', COALESCE(pt.description, p.description),
        'meta_title', pt.meta_title,
        'meta_description', pt.meta_description,
        'language_code', COALESCE(pt.language_code, 'en')
    ) INTO result
    FROM products p
    LEFT JOIN product_translations pt ON p.id = pt.product_id 
        AND pt.language_code = p_language_code
    WHERE p.id = p_product_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get category with translation
CREATE OR REPLACE FUNCTION get_category_with_translation(
    p_category_id UUID,
    p_language_code VARCHAR(10) DEFAULT 'en'
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'id', c.id,
        'image_url', c.image_url,
        'is_active', c.is_active,
        'created_at', c.created_at,
        'updated_at', c.updated_at,
        'name', COALESCE(ct.name, c.name),
        'description', COALESCE(ct.description, c.description),
        'meta_title', ct.meta_title,
        'meta_description', ct.meta_description,
        'language_code', COALESCE(ct.language_code, 'en')
    ) INTO result
    FROM categories c
    LEFT JOIN category_translations ct ON c.id = ct.category_id 
        AND ct.language_code = p_language_code
    WHERE c.id = p_category_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;