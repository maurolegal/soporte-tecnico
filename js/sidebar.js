import { auth } from './supabase.js';

export class Sidebar {
    constructor() {
        this.currentPage = window.location.pathname.split('/').pop() || 'index.html';
        this.sidebarContainer = document.querySelector('.sidebar-container');
        this.init();
    }

    async init() {
        // Cargar el contenido del sidebar
        await this.loadSidebarContent();
        
        // Inicializar la información del usuario
        await this.initUserInfo();
        
        // Activar el enlace actual
        this.setActiveLink();
        
        // Inicializar el toggle para móvil
        this.initMobileToggle();
        
        // Mostrar/ocultar elementos según el rol
        await this.handleRoleBasedVisibility();

        setTimeout(() => {
            document.querySelector('.sidebar').classList.add('show');
        }, 100);
    }

    async loadSidebarContent() {
        try {
            const response = await fetch('/components/sidebar.html');
            const html = await response.text();
            this.sidebarContainer.innerHTML = html;
        } catch (error) {
            console.error('Error loading sidebar:', error);
        }
    }

    async initUserInfo() {
        try {
            const user = await auth.getCurrentUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                // Actualizar información del usuario
                document.getElementById('userName').textContent = profile.full_name;
                document.getElementById('userEmail').textContent = user.email;
                document.getElementById('userRole').textContent = this.formatRole(profile.role);
                document.getElementById('userInitials').textContent = this.getInitials(profile.full_name);
            }
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    }

    setActiveLink() {
        // Remover clase active de todos los enlaces
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Agregar clase active al enlace actual
        const currentLink = document.querySelector(`[data-page="${this.getCurrentPage()}"]`);
        if (currentLink) {
            currentLink.classList.add('active');
        }
    }

    initMobileToggle() {
        const toggleBtn = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');

        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('show');
            });

            // Cerrar sidebar al hacer clic fuera en móvil
            document.addEventListener('click', (e) => {
                if (window.innerWidth < 768 && 
                    !sidebar.contains(e.target) && 
                    !toggleBtn.contains(e.target)) {
                    sidebar.classList.remove('show');
                }
            });
        }
    }

    async handleRoleBasedVisibility() {
        try {
            const user = await auth.getCurrentUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile) {
                // Mostrar/ocultar elementos según el rol
                const adminElements = document.querySelectorAll('.admin-only');
                adminElements.forEach(el => {
                    el.style.display = profile.role === 'admin' ? 'block' : 'none';
                });
            }
        } catch (error) {
            console.error('Error handling role visibility:', error);
        }
    }

    getCurrentPage() {
        const page = this.currentPage.split('.')[0];
        return page === 'index' ? 'dashboard' : page;
    }

    formatRole(role) {
        const roles = {
            admin: 'Administrador',
            tecnico: 'Técnico',
            recepcion: 'Recepción'
        };
        return roles[role] || role;
    }

    getInitials(name) {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase();
    }
}

// Inicializar el sidebar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new Sidebar();
}); 