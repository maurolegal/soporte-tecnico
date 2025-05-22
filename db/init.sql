-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla de perfiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    correo TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'tecnico', 'recepcion')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Crear tabla de órdenes de soporte
CREATE TABLE IF NOT EXISTS support_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id),
    technician_id UUID REFERENCES profiles(id),
    serial_number TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    problem_description TEXT NOT NULL,
    initial_state TEXT NOT NULL,
    physical_conditions TEXT NOT NULL,
    estimated_cost DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'completado', 'cancelado')),
    entry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    estimated_delivery_date TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_delivery_date TIMESTAMP WITH TIME ZONE,
    user_password TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Crear tabla de línea de tiempo de soporte
CREATE TABLE IF NOT EXISTS support_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    support_order_id UUID NOT NULL REFERENCES support_orders(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('recepcion', 'diagnostico', 'en_proceso', 'completado', 'problema')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Crear tabla de imágenes de soporte
CREATE TABLE IF NOT EXISTS support_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    support_order_id UUID NOT NULL REFERENCES support_orders(id),
    image_url TEXT NOT NULL,
    description TEXT,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Limpiar datos existentes (si es necesario)
DELETE FROM support_timeline;
DELETE FROM support_images;
DELETE FROM support_orders;
DELETE FROM clients;
DELETE FROM profiles;

-- Insertar perfiles de prueba
INSERT INTO profiles (email, correo, full_name, role) VALUES
('admin@techsupport.com', 'admin@techsupport.com', 'Administrador Principal', 'admin'),
('tecnico1@techsupport.com', 'tecnico1@techsupport.com', 'Luis Técnico', 'tecnico'),
('tecnico2@techsupport.com', 'tecnico2@techsupport.com', 'María Técnico', 'tecnico'),
('recepcion@techsupport.com', 'recepcion@techsupport.com', 'Juan Recepción', 'recepcion');

-- Insertar clientes de prueba
INSERT INTO clients (name, phone, email, address) VALUES
('Ana Martínez', '+1234567890', 'ana@email.com', 'Av. Principal #123, Ciudad'),
('Carlos Pérez', '+1234567891', 'carlos@email.com', 'Calle 45 #789, Ciudad'),
('María López', '+1234567892', 'maria@email.com', 'Plaza Central #456, Ciudad');

-- Insertar órdenes de soporte de prueba
INSERT INTO support_orders (
    client_id,
    technician_id,
    serial_number,
    brand,
    model,
    problem_description,
    initial_state,
    physical_conditions,
    estimated_cost,
    status,
    entry_date,
    estimated_delivery_date
) VALUES
(
    (SELECT id FROM clients WHERE name = 'Ana Martínez'),
    (SELECT id FROM profiles WHERE full_name = 'Luis Técnico'),
    '5CD9876543',
    'HP',
    'Pavilion 15-dk1056wm',
    'El equipo presenta problemas de sobrecalentamiento y apagados repentinos durante el uso. El ventilador hace ruidos extraños cuando está en funcionamiento.',
    'Equipo enciende normalmente\nVentilador con ruido anormal\nTemperatura elevada en uso\nSin daños físicos visibles',
    'Carcasa en buen estado\nPantalla sin rayones\nTeclado completo y funcional\nBatería original',
    180.00,
    'en_proceso',
    NOW(),
    NOW() + INTERVAL '2 days'
);

-- Insertar entradas de línea de tiempo para la orden de prueba
INSERT INTO support_timeline (
    support_order_id,
    title,
    description,
    status,
    created_by
) VALUES
(
    (SELECT id FROM support_orders WHERE serial_number = '5CD9876543'),
    'Recepción del equipo',
    'Se recibe el equipo y se realiza inspección inicial',
    'recepcion',
    (SELECT id FROM profiles WHERE role = 'recepcion')
),
(
    (SELECT id FROM support_orders WHERE serial_number = '5CD9876543'),
    'Diagnóstico Técnico',
    'Se confirma problema en el sistema de ventilación. Se requiere limpieza profunda y posible reemplazo del ventilador.',
    'diagnostico',
    (SELECT id FROM profiles WHERE full_name = 'Luis Técnico')
),
(
    (SELECT id FROM support_orders WHERE serial_number = '5CD9876543'),
    'Inicio de Reparación',
    'Se comienza el desmontaje para limpieza y revisión del sistema de ventilación',
    'en_proceso',
    (SELECT id FROM profiles WHERE full_name = 'Luis Técnico')
);

-- Crear políticas de seguridad RLS (Row Level Security)

-- Habilitar RLS para todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_images ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Profiles viewable by authenticated users" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Profiles editable by admins" ON profiles
    FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Políticas para clients
CREATE POLICY "Clients viewable by authenticated users" ON clients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Clients editable by staff" ON clients
    FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para support_orders
CREATE POLICY "Orders viewable by authenticated users" ON support_orders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Orders editable by staff" ON support_orders
    FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para support_timeline
CREATE POLICY "Timeline viewable by authenticated users" ON support_timeline
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Timeline editable by staff" ON support_timeline
    FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para support_images
CREATE POLICY "Images viewable by authenticated users" ON support_images
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Images editable by staff" ON support_images
    FOR ALL USING (auth.role() = 'authenticated');

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_correo ON profiles(correo);
CREATE INDEX IF NOT EXISTS idx_support_orders_client_id ON support_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_support_orders_technician_id ON support_orders(technician_id);
CREATE INDEX IF NOT EXISTS idx_support_orders_status ON support_orders(status);
CREATE INDEX IF NOT EXISTS idx_support_timeline_order_id ON support_timeline(support_order_id);
CREATE INDEX IF NOT EXISTS idx_support_images_order_id ON support_images(support_order_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- Crear funciones para búsqueda
CREATE OR REPLACE FUNCTION search_support_orders(search_query TEXT)
RETURNS TABLE (
    id UUID,
    client_name TEXT,
    client_phone TEXT,
    serial_number TEXT,
    brand TEXT,
    model TEXT,
    status TEXT
) LANGUAGE sql AS $$
    SELECT 
        so.id,
        c.name as client_name,
        c.phone as client_phone,
        so.serial_number,
        so.brand,
        so.model,
        so.status
    FROM support_orders so
    JOIN clients c ON c.id = so.client_id
    WHERE 
        c.name ILIKE '%' || search_query || '%' OR
        c.phone ILIKE '%' || search_query || '%' OR
        so.serial_number ILIKE '%' || search_query || '%' OR
        so.brand ILIKE '%' || search_query || '%' OR
        so.model ILIKE '%' || search_query || '%'
    ORDER BY so.created_at DESC;
$$; 