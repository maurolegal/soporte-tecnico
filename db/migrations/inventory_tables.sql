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
CREATE OR REPLACE TRIGGER after_purchase_insert
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
CREATE OR REPLACE TRIGGER after_sale_insert
AFTER INSERT ON sale_items
FOR EACH ROW
EXECUTE FUNCTION update_stock_after_sale();

-- Insertar algunas categorías de ejemplo
INSERT INTO categories (name, description) VALUES
('Hardware', 'Componentes físicos de computadoras'),
('Software', 'Programas y licencias'),
('Periféricos', 'Dispositivos externos como teclados, ratones, etc.'),
('Redes', 'Equipos y accesorios de redes'),
('Accesorios', 'Accesorios varios para equipos'),
('Repuestos', 'Piezas de repuesto para reparaciones');

-- Insertar algunos proveedores de ejemplo
INSERT INTO suppliers (name, contact_name, phone, email, address) VALUES
('TechWholesale', 'Juan Pérez', '555-123-4567', 'juan@techwholesale.com', 'Calle Principal 123'),
('Distribuidora IT', 'María López', '555-987-6543', 'maria@distribuidorait.com', 'Avenida Central 456'),
('Components Pro', 'Carlos Gómez', '555-456-7890', 'carlos@componentspro.com', 'Boulevard Norte 789'),
('Hardware Express', 'Ana Torres', '555-789-0123', 'ana@hardwareexpress.com', 'Plaza Sur 321');

-- Insertar algunos productos de ejemplo
INSERT INTO products (code, name, description, category, stock, min_stock, purchase_price, sale_price, unit, supplier_id)
SELECT 
    'PROD-' || LPAD(n::text, 3, '0'),
    CASE 
        WHEN n % 6 = 0 THEN 'SSD Samsung 500GB'
        WHEN n % 6 = 1 THEN 'Memoria RAM Kingston 8GB DDR4'
        WHEN n % 6 = 2 THEN 'Monitor LG 24" FullHD'
        WHEN n % 6 = 3 THEN 'Teclado Logitech K380'
        WHEN n % 6 = 4 THEN 'Mouse Logitech MX Master'
        WHEN n % 6 = 5 THEN 'Disco Duro Externo WD 1TB'
    END,
    CASE 
        WHEN n % 6 = 0 THEN 'Unidad de estado sólido Samsung EVO 500GB SATA'
        WHEN n % 6 = 1 THEN 'Memoria RAM Kingston 8GB DDR4 2666MHz'
        WHEN n % 6 = 2 THEN 'Monitor LG 24" IPS FullHD 75Hz con FreeSync'
        WHEN n % 6 = 3 THEN 'Teclado inalámbrico Logitech K380 Bluetooth'
        WHEN n % 6 = 4 THEN 'Mouse inalámbrico Logitech MX Master 3 con Bluetooth'
        WHEN n % 6 = 5 THEN 'Disco Duro Externo Western Digital Elements 1TB USB 3.0'
    END,
    CASE 
        WHEN n % 6 = 0 THEN 'Hardware'
        WHEN n % 6 = 1 THEN 'Hardware'
        WHEN n % 6 = 2 THEN 'Periféricos'
        WHEN n % 6 = 3 THEN 'Periféricos'
        WHEN n % 6 = 4 THEN 'Periféricos'
        WHEN n % 6 = 5 THEN 'Hardware'
    END,
    FLOOR(RANDOM() * 20)::DECIMAL,
    5,
    CASE 
        WHEN n % 6 = 0 THEN 80.00
        WHEN n % 6 = 1 THEN 45.00
        WHEN n % 6 = 2 THEN 130.00
        WHEN n % 6 = 3 THEN 35.00
        WHEN n % 6 = 4 THEN 70.00
        WHEN n % 6 = 5 THEN 55.00
    END,
    CASE 
        WHEN n % 6 = 0 THEN 100.00
        WHEN n % 6 = 1 THEN 60.00
        WHEN n % 6 = 2 THEN 160.00
        WHEN n % 6 = 3 THEN 45.00
        WHEN n % 6 = 4 THEN 90.00
        WHEN n % 6 = 5 THEN 70.00
    END,
    'unidad',
    (SELECT id FROM suppliers ORDER BY RANDOM() LIMIT 1)
FROM generate_series(1, 15) AS n; 