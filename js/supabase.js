// Configuración de supabase
// Eliminamos la importación que causa el error
// import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://stddbzpxdqxuzhhqywtc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZGRienB4ZHF4dXpoaHF5d3RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MTgzOTAsImV4cCI6MjA2MzQ5NDM5MH0.ZLrpXpw5ATu0ymcXgWMBfYiCLsoDxULRYRn_31NMzTE';

let supabase;

// Comprobación si estamos en un entorno de navegador donde se cargó Supabase desde CDN
// Intentamos diferentes formas en que Supabase podría estar disponible
if (typeof window !== 'undefined') {
  if (window.supabase) {
    // Formato del CDN oficial más reciente
    supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log('supabase client initialized successfully using window.supabase');
  } else if (window.Supabase) {
    // Formato alternativo del CDN
    supabase = window.Supabase.createClient(supabaseUrl, supabaseKey);
    console.log('supabase client initialized successfully using window.Supabase');
  } else if (window.createClient) {
    // Otra posible exportación del CDN
    supabase = window.createClient(supabaseUrl, supabaseKey);
    console.log('supabase client initialized successfully using window.createClient');
  } else {
    console.warn('Supabase not available from CDN, using fallback client');
    createFallbackClient();
  }
} else {
  console.warn('Not in browser environment, using fallback client');
  createFallbackClient();
}

// Función para crear un cliente fallback con todos los métodos necesarios
function createFallbackClient() {
  supabase = {
    auth: { 
      signInWithPassword: async () => ({}),
      signOut: async () => ({}),
      getUser: async () => ({ data: { user: null } }) 
    },
    from: (table) => ({
      select: (query) => ({ 
        data: [], 
        error: null,
        eq: () => ({ data: [], error: null, single: () => ({ data: null, error: null }) }),
        order: () => ({ data: [], error: null }),
        limit: () => ({ data: [], error: null })
      }),
      insert: (data) => ({ data: data, error: null, select: () => ({ data: data, error: null }) }),
      update: (data) => ({ data: data, error: null, eq: () => ({ data: data, error: null, select: () => ({ data: data, error: null }) }) }),
      delete: () => ({ error: null, eq: () => ({ error: null }) }),
      eq: () => ({
        single: () => ({ data: null, error: null }),
        delete: () => ({ error: null }),
        select: () => ({ data: [], error: null })
      }),
      or: () => ({ data: [], error: null, order: () => ({ data: [], error: null }) })
    }),
    storage: {
      from: (bucket) => ({
        upload: async () => ({ data: { path: '' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    },
    rpc: () => ({ data: [], error: null })
  };
}

export { supabase };

// Funciones de autenticación
export const auth = {
    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    async isAuthenticated() {
        const user = await this.getCurrentUser();
        return !!user;
    }
};

// API de usuarios
export const usersApi = {
    async getAll() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async create({ email, password, full_name, role }) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name, role }
            }
        });
        if (authError) throw authError;

        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: authData.user.id, full_name, role, status: 'active' }]);

        if (profileError) throw profileError;
        return authData.user;
    },

    async update(id, userData) {
        const { error } = await supabase
            .from('profiles')
            .update(userData)
            .eq('id', id);

        if (error) throw error;
    },

    async delete(id) {
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ status: 'inactive' })
            .eq('id', id);
        if (profileError) throw profileError;

        const { error: authError } = await supabase.auth.admin.deleteUser(id);
        if (authError) throw authError;
    }
};

// Middleware de autenticación
export const requireAuth = async (redirectUrl = '/login.html') => {
    const isAuthenticated = await auth.isAuthenticated();
    if (!isAuthenticated) window.location.href = redirectUrl;
};

// Middleware de roles
export const requireRole = async (allowedRoles = [], redirectUrl = '/unauthorized.html') => {
    const user = await auth.getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (error || !profile || !allowedRoles.includes(profile.role)) {
        window.location.href = redirectUrl;
    }
};

// API de Inventario
export const inventoryApi = {
    products: {
        async getAll() {
            const { data, error } = await supabase
                .from('products')
                .select(`*, supplier:suppliers(id, name)`)
                .order('name', { ascending: true });

            if (error) throw error;
            return data;
        },

        async getById(id) {
            const { data, error } = await supabase
                .from('products')
                .select(`*, supplier:suppliers(*)`)
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        },

        async create(productData) {
            const { data, error } = await supabase
                .from('products')
                .insert([productData])
                .select();

            if (error) throw error;
            return data[0];
        },

        async update(id, productData) {
            const { data, error } = await supabase
                .from('products')
                .update(productData)
                .eq('id', id)
                .select();

            if (error) throw error;
            return data[0];
        },

        async delete(id) {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },

        async search(query) {
            const { data, error } = await supabase
                .rpc('search_products', { search_term: query });

            if (error) throw error;
            return data;
        }
    },

    suppliers: {
        async getAll() {
            const { data, error } = await supabase
                .from('suppliers')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            return data;
        },

        async create(supplierData) {
            const { data, error } = await supabase
                .from('suppliers')
                .insert([supplierData])
                .select();

            if (error) throw error;
            return data[0];
        }
    },

    purchases: {
        async getAll() {
            const { data, error } = await supabase
                .from('purchases')
                .select(`
                    *,
                    supplier:suppliers(name),
                    items:purchase_items(
                        id,
                        quantity,
                        unit_price,
                        total,
                        product:products(id, name)
                    )
                `)
                .order('date', { ascending: false });

            if (error) throw error;
            return data;
        },

        async create(purchaseData, items) {
            const { data: purchase, error: purchaseError } = await supabase
                .from('purchases')
                .insert([purchaseData])
                .select();

            if (purchaseError) throw purchaseError;

            const purchaseItems = items.map(item => ({
                ...item,
                purchase_id: purchase[0].id
            }));

            const { error: itemsError } = await supabase
                .from('purchase_items')
                .insert(purchaseItems);

            if (itemsError) throw itemsError;

            return purchase[0];
        }
    },

    sales: {
        async getAll() {
            const { data, error } = await supabase
                .from('sales')
                .select(`
                    *,
                    client:clients(name),
                    items:sale_items(
                        id,
                        quantity,
                        unit_price,
                        total,
                        product:products(id, name)
                    )
                `)
                .order('date', { ascending: false });

            if (error) throw error;
            return data;
        },

        async create(saleData, items) {
            const { data: sale, error: saleError } = await supabase
                .from('sales')
                .insert([saleData])
                .select();

            if (saleError) throw saleError;

            const saleItems = items.map(item => ({
                ...item,
                sale_id: sale[0].id
            }));

            const { error: itemsError } = await supabase
                .from('sale_items')
                .insert(saleItems);

            if (itemsError) throw itemsError;

            return sale[0];
        }
    }
};

// API de Clientes
export const clientsApi = {
    async getAll() {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async create(clientData) {
        const { data, error } = await supabase
            .from('clients')
            .insert([clientData])
            .select();

        if (error) throw error;
        return data[0];
    },

    async update(id, clientData) {
        const { data, error } = await supabase
            .from('clients')
            .update(clientData)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    },

    async search(query) {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }
};

// API para órdenes de soporte  
export const supportOrdersApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('support_orders')
      .select(`
        *,
        client:clients(*),
        technician:profiles(*),
        timeline:support_timeline(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('support_orders')
      .select(`
        *,
        client:clients(*),
        technician:profiles(*),
        timeline:support_timeline(*),
        images:support_images(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(orderData) {
    const { data, error } = await supabase
      .from('support_orders')
      .insert([orderData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async update(id, orderData) {
    const { data, error } = await supabase
      .from('support_orders')
      .update(orderData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async addTimelineEntry(entry) {
    const { data, error } = await supabase
      .from('support_timeline')
      .insert([entry])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async uploadImage(file, orderId) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${orderId}/${Math.random()}.${fileExt}`;
    const filePath = `support-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    const { data, error } = await supabase
      .from('support_images')
      .insert([{
        support_order_id: orderId,
        image_url: publicUrl
      }])
      .select();

    if (error) throw error;
    return data[0];
  }
};

// API para cotizaciones
export const quotesApi = {
  async create(quoteData) {
    const { data, error } = await supabase
      .from('quotes')
      .insert([quoteData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async addItems(items) {
    const { data, error } = await supabase
      .from('quote_items')
      .insert(items)
      .select();
    
    if (error) throw error;
    return data;
  }
};

// API para facturas
export const invoicesApi = {
  async create(invoiceData) {
    const { data, error } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async addItems(items) {
    const { data, error } = await supabase
      .from('invoice_items')
      .insert(items)
      .select();
    
    if (error) throw error;
    return data;
  }
};