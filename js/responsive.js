// Funcionalidad para mejorar la responsividad

document.addEventListener('DOMContentLoaded', function() {
    // Agregar el botón de toggle del sidebar si no existe
    if (!document.querySelector('.sidebar-toggle')) {
        const toggleButton = document.createElement('button');
        toggleButton.className = 'sidebar-toggle btn btn-primary';
        toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.appendChild(toggleButton);

        // Manejar el clic en el botón de toggle
        toggleButton.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('show');
        });
    }

    // Verificar si la pantalla es pequeña al cargar
    handleResponsiveness();

    // También verificar cuando se redimensione la ventana
    window.addEventListener('resize', handleResponsiveness);

    // Función para manejar comportamientos específicos en pantallas pequeñas
    function handleResponsiveness() {
        const windowWidth = window.innerWidth;
        
        // Ajustes para pantallas pequeñas
        if (windowWidth < 768) {
            // Asegurar que el sidebar está oculto por defecto
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.remove('show');
            
            // Ocultar el sidebar al hacer clic fuera de él
            document.addEventListener('click', function(e) {
                const sidebar = document.querySelector('.sidebar');
                const toggle = document.querySelector('.sidebar-toggle');
                
                if (sidebar && toggle && 
                    !sidebar.contains(e.target) && 
                    !toggle.contains(e.target)) {
                    sidebar.classList.remove('show');
                }
            });
            
            // Asegurar que todas las tablas sean responsive
            document.querySelectorAll('table').forEach(table => {
                // Si la tabla no está ya en un contenedor .table-responsive
                if (!table.parentElement.classList.contains('table-responsive')) {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'table-responsive';
                    table.parentNode.insertBefore(wrapper, table);
                    wrapper.appendChild(table);
                }
            });
        }
    }

    // Corregir comportamiento de dropdowns en móviles
    document.querySelectorAll('.dropdown-toggle').forEach(dropdown => {
        dropdown.addEventListener('click', function(e) {
            if (window.innerWidth < 768) {
                e.preventDefault();
                e.stopPropagation();
                this.nextElementSibling.classList.toggle('show');
            }
        });
    });
    
    // Cerrar los dropdowns al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (window.innerWidth < 768) {
            if (!e.target.matches('.dropdown-toggle')) {
                document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        }
    });
}); 