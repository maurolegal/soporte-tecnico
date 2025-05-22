-- Habilitar la extensión uuid-ossp si no está habilitada
create extension if not exists "uuid-ossp";

-- Create users table (extends Supabase auth.users)
create table public.profiles (
    id uuid references auth.users on delete cascade,
    full_name text,
    role text check (role in ('admin', 'tecnico', 'recepcion')),
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    primary key (id)
);

-- Create clients table
create table public.clients (
    id uuid default uuid_generate_v4(),
    name text not null,
    phone text,
    email text,
    address text,
    status text check (status in ('activo', 'inactivo')) default 'activo',
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    primary key (id)
);

-- Create support_orders table
create table public.support_orders (
    id uuid default uuid_generate_v4(),
    client_id uuid references public.clients(id),
    technician_id uuid references public.profiles(id),
    serial_number text,
    brand text,
    model text,
    problem_description text,
    initial_state text,
    physical_conditions text,
    estimated_cost decimal(10,2),
    status text check (status in ('pendiente', 'en_proceso', 'completado', 'cancelado')),
    entry_date timestamptz default now(),
    estimated_delivery_date timestamptz,
    user_password text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    primary key (id)
);

-- Create support_timeline table
create table public.support_timeline (
    id uuid default uuid_generate_v4(),
    support_order_id uuid references public.support_orders(id),
    title text not null,
    description text,
    status text check (status in ('recepcion', 'diagnostico', 'en_proceso', 'completado', 'problema')),
    created_by uuid references public.profiles(id),
    created_at timestamptz default now(),
    primary key (id)
);

-- Create support_images table
create table public.support_images (
    id uuid default uuid_generate_v4(),
    support_order_id uuid references public.support_orders(id),
    image_url text not null,
    created_at timestamptz default now(),
    primary key (id)
);

-- Create quotes table
create table public.quotes (
    id uuid default uuid_generate_v4(),
    support_order_id uuid references public.support_orders(id),
    subtotal decimal(10,2) not null,
    tax decimal(10,2) not null,
    total decimal(10,2) not null,
    notes text,
    status text check (status in ('pendiente', 'aprobada', 'rechazada')),
    created_by uuid references public.profiles(id),
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    primary key (id)
);

-- Create quote_items table
create table public.quote_items (
    id uuid default uuid_generate_v4(),
    quote_id uuid references public.quotes(id),
    description text not null,
    quantity integer not null,
    unit_price decimal(10,2) not null,
    subtotal decimal(10,2) not null,
    created_at timestamptz default now(),
    primary key (id)
);

-- Create invoices table
create table public.invoices (
    id uuid default uuid_generate_v4(),
    support_order_id uuid references public.support_orders(id),
    quote_id uuid references public.quotes(id),
    invoice_number text unique not null,
    subtotal decimal(10,2) not null,
    tax decimal(10,2) not null,
    total decimal(10,2) not null,
    payment_method text check (payment_method in ('efectivo', 'tarjeta', 'transferencia')),
    notes text,
    created_by uuid references public.profiles(id),
    created_at timestamptz default now(),
    primary key (id)
);

-- Create invoice_items table
create table public.invoice_items (
    id uuid default uuid_generate_v4(),
    invoice_id uuid references public.invoices(id),
    description text not null,
    quantity integer not null,
    unit_price decimal(10,2) not null,
    subtotal decimal(10,2) not null,
    created_at timestamptz default now(),
    primary key (id)
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.support_orders enable row level security;
alter table public.support_timeline enable row level security;
alter table public.support_images enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone" on public.profiles
    for select using (true);

create policy "Users can update own profile" on public.profiles
    for update using (auth.uid() = id);

-- Clients policies
create policy "Authenticated users can view clients" on public.clients
    for select using (auth.role() in ('authenticated'));

create policy "Staff can insert clients" on public.clients
    for insert with check (auth.role() in ('authenticated'));

create policy "Staff can update clients" on public.clients
    for update using (auth.role() in ('authenticated'));

-- Support orders policies
create policy "Authenticated users can view support orders" on public.support_orders
    for select using (auth.role() in ('authenticated'));

create policy "Staff can insert support orders" on public.support_orders
    for insert with check (auth.role() in ('authenticated'));

create policy "Staff can update support orders" on public.support_orders
    for update using (auth.role() in ('authenticated')); 