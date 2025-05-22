-- Archivo combinado de todas las migraciones SQL para ejecutar en supabase

------------------------------------------------------------------------------
-- Migración: add_service_dates.sql
------------------------------------------------------------------------------

-- Add missing columns to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS last_service_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_service_date TIMESTAMP WITH TIME ZONE;

-- Update existing clients with sample data (optional)
UPDATE clients 
SET 
    notes = 'Cliente actualizado con campos de servicio',
    last_service_date = NOW() - INTERVAL '3 months',
    next_service_date = NOW() + INTERVAL '3 months'
WHERE last_service_date IS NULL;

-- Create index for service dates to improve query performance
CREATE INDEX IF NOT EXISTS idx_clients_next_service_date ON clients(next_service_date);
CREATE INDEX IF NOT EXISTS idx_clients_last_service_date ON clients(last_service_date);

------------------------------------------------------------------------------
-- Migración: inventory_tables.sql
------------------------------------------------------------------------------

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,  -- Podría ser una referencia a la tabla de categorías
    stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    min_stock DECIMAL(10,2) NOT NULL DEFAULT 5,
    purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    sale_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit TEXT DEFAULT 'unidad',
    location TEXT,
    supplier_id UUID REFERENCES suppliers(id),
    warranty_months INTEGER DEFAULT 0,
    notes TEXT,
    purchase_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de compras (entrada de inventario)
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT,
    supplier_id UUID REFERENCES suppliers(id),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'completado' CHECK (status IN ('pendiente', 'completado', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de detalles de compras
CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de ventas (salida de inventario)
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT,
    client_id UUID REFERENCES clients(id),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completado' CHECK (status IN ('pendiente', 'completado', 'cancelado')),
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de detalles de ventas
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date);
CREATE INDEX IF NOT EXISTS idx_sales_client ON sales(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);

-- Funciones
-- Función para buscar productos
CREATE OR REPLACE FUNCTION search_products(search_term TEXT)
RETURNS SETOF products AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM products
    WHERE 
        name ILIKE '%' || search_term || '%' OR
        code ILIKE '%' || search_term || '%' OR
        category ILIKE '%' || search_term || '%' OR
        description ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar el stock tras una compra
CREATE OR REPLACE FUNCTION update_stock_after_purchase()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET stock = stock + NEW.quantity
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar stock tras una compra
DROP TRIGGER IF EXISTS after_purchase_insert ON purchase_items;
CREATE TRIGGER after_purchase_insert
AFTER INSERT ON purchase_items
FOR EACH ROW
EXECUTE FUNCTION update_stock_after_purchase();

-- Función para actualizar el stock tras una venta
CREATE OR REPLACE FUNCTION update_stock_after_sale()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar stock tras una venta
DROP TRIGGER IF EXISTS after_sale_insert ON sale_items;
CREATE TRIGGER after_sale_insert
AFTER INSERT ON sale_items
FOR EACH ROW
EXECUTE FUNCTION update_stock_after_sale();

-- Insertar algunas categorías de ejemplo (solo si la tabla está vacía)
INSERT INTO categories (name, description)
SELECT 'Hardware', 'Componentes físicos de computadoras'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Hardware');

INSERT INTO categories (name, description)
SELECT 'Software', 'Programas y licencias'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Software');

INSERT INTO categories (name, description)
SELECT 'Periféricos', 'Dispositivos externos como teclados, ratones, etc.'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Periféricos');

INSERT INTO categories (name, description)
SELECT 'Redes', 'Equipos y accesorios de redes'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Redes');

INSERT INTO categories (name, description)
SELECT 'Accesorios', 'Accesorios varios para equipos'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Accesorios');

INSERT INTO categories (name, description)
SELECT 'Repuestos', 'Piezas de repuesto para reparaciones'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Repuestos'); 