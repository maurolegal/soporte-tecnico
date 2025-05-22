// No necesitas el import, usa el objeto global supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://stddbzpxdqxuzhhqywtc.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZGRienB4ZHF4dXpoaHF5d3RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MTgzOTAsImV4cCI6MjA2MzQ5NDM5MH0.ZLrpXpw5ATu0ymcXgWMBfYiCLsoDxULRYRn_31NMzTE'
export const supabase = window.supabase.createClient(supabaseUrl, supabaseKey)

// Funciones de autenticación
export const auth = {
    // Iniciar sesión
    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) throw error
        return data
    },

    // Cerrar sesión
    async signOut() {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    },

    // Obtener usuario actual
    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser()
        return user
    },

    // Verificar si el usuario está autenticado
    async isAuthenticated() {
        const user = await this.getCurrentUser()
        return !!user
    }
}

// API de usuarios
export const usersApi = {
    // Obtener todos los usuarios
    async getAll() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
        
        if (error) throw error
        return data
    },

    // Obtener un usuario por ID
    async getById(id) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single()
        
        if (error) throw error
        return data
    },

    // Crear un nuevo usuario
    async create({ email, password, full_name, role }) {
        // 1. Crear el usuario en auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name,
                    role
                }
            }
        })
        if (authError) throw authError

        // 2. Crear el perfil en la tabla profiles
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([
                {
                    id: authData.user.id,
                    full_name,
                    role,
                    status: 'active'
                }
            ])
        
        if (profileError) throw profileError
        return authData.user
    },

    // Actualizar un usuario
    async update(id, userData) {
        const { error } = await supabase
            .from('profiles')
            .update(userData)
            .eq('id', id)
        
        if (error) throw error
    },

    // Eliminar un usuario
    async delete(id) {
        // 1. Desactivar el usuario en profiles
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ status: 'inactive' })
            .eq('id', id)
        
        if (profileError) throw profileError

        // 2. Eliminar el usuario de auth (opcional, dependiendo de tus necesidades)
        const { error: authError } = await supabase.auth.admin.deleteUser(id)
        if (authError) throw authError
    }
}

// Middleware de autenticación
export const requireAuth = async (redirectUrl = '/login.html') => {
    const isAuthenticated = await auth.isAuthenticated()
    if (!isAuthenticated) {
        window.location.href = redirectUrl
    }
}

// Middleware de roles
export const requireRole = async (allowedRoles = [], redirectUrl = '/unauthorized.html') => {
    const user = await auth.getCurrentUser()
    if (!user) {
        window.location.href = '/login.html'
        return
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (error || !profile || !allowedRoles.includes(profile.role)) {
        window.location.href = redirectUrl
    }
}

// Funciones para clientes
export const clientsApi = {
    // Obtener todos los clientes
    async getAll() {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false })
        
        if (error) throw error
        return data
    },

    // Obtener un cliente por ID
    async getById(id) {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .single()
        
        if (error) throw error
        return data
    },

    // Crear un nuevo cliente
    async create(clientData) {
        const { data, error } = await supabase
            .from('clients')
            .insert([clientData])
            .select()
        
        if (error) throw error
        return data[0]
    },

    // Actualizar un cliente
    async update(id, clientData) {
        const { data, error } = await supabase
            .from('clients')
            .update(clientData)
            .eq('id', id)
            .select()
        
        if (error) throw error
        return data[0]
    },

    // Buscar clientes
    async search(query) {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
            .order('created_at', { ascending: false })
        
        if (error) throw error
        return data
    }
}

// Funciones para órdenes de soporte
export const supportOrdersApi = {
    // Obtener todas las órdenes
    async getAll() {
        const { data, error } = await supabase
            .from('support_orders')
            .select(`
                *,
                client:clients(*),
                technician:profiles(*),
                timeline:support_timeline(*)
            `)
            .order('created_at', { ascending: false })
        
        if (error) throw error
        return data
    },

    // Obtener una orden por ID
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
            .single()
        
        if (error) throw error
        return data
    },

    // Crear una nueva orden
    async create(orderData) {
        const { data, error } = await supabase
            .from('support_orders')
            .insert([orderData])
            .select()
        
        if (error) throw error
        return data[0]
    },

    // Actualizar una orden
    async update(id, orderData) {
        const { data, error } = await supabase
            .from('support_orders')
            .update(orderData)
            .eq('id', id)
            .select()
        
        if (error) throw error
        return data[0]
    },

    // Agregar entrada a la línea de tiempo
    async addTimelineEntry(entry) {
        const { data, error } = await supabase
            .from('support_timeline')
            .insert([entry])
            .select()
        
        if (error) throw error
        return data[0]
    },

    // Subir imagen
    async uploadImage(file, orderId) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${orderId}/${Math.random()}.${fileExt}`
        const filePath = `support-images/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(filePath)

        const { data, error } = await supabase
            .from('support_images')
            .insert([{
                support_order_id: orderId,
                image_url: publicUrl
            }])
            .select()

        if (error) throw error
        return data[0]
    }
}

// Funciones para cotizaciones
export const quotesApi = {
    // Crear cotización
    async create(quoteData) {
        const { data, error } = await supabase
            .from('quotes')
            .insert([quoteData])
            .select()
        
        if (error) throw error
        return data[0]
    },

    // Agregar items a la cotización
    async addItems(items) {
        const { data, error } = await supabase
            .from('quote_items')
            .insert(items)
            .select()
        
        if (error) throw error
        return data
    }
}

// Funciones para facturas
export const invoicesApi = {
    // Crear factura
    async create(invoiceData) {
        const { data, error } = await supabase
            .from('invoices')
            .insert([invoiceData])
            .select()
        
        if (error) throw error
        return data[0]
    },

    // Agregar items a la factura
    async addItems(items) {
        const { data, error } = await supabase
            .from('invoice_items')
            .insert(items)
            .select()
        
        if (error) throw error
        return data
    }
} 