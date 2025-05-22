# Instrucciones para Ejecutar Migraciones en supabase

Este documento explica cómo actualizar las tablas de la base de datos en supabase con las migraciones SQL necesarias para el proyecto TechSupport Pro.

## Opción 1: A través del Panel de SQL de supabase (Recomendado)

1. **Accede al Panel de supabase**:
   - Ingresa a [https://app.supabase.io/](https://app.supabase.io/)
   - Inicia sesión con tus credenciales
   - Selecciona tu proyecto (`TechSupport Pro`)

2. **Abre el Editor SQL**:
   - En el menú lateral, haz clic en "SQL Editor"
   - Crea una nueva consulta haciendo clic en "New Query"

3. **Ejecuta el archivo combinado de migraciones**:
   - Abre el archivo `db/supabase_migrations_combined.sql` de este proyecto
   - Copia todo su contenido
   - Pégalo en la ventana del Editor SQL de supabase
   - Haz clic en "Run" o "Execute" para ejecutar todas las migraciones

4. **Verifica la ejecución**:
   - Revisa los mensajes de salida para asegurarte de que no haya errores
   - Verifica que las nuevas tablas y columnas se hayan creado correctamente

## Opción 2: Usando el script de Node.js

Si prefieres ejecutar las migraciones desde tu entorno local, puedes usar el script de Node.js que hemos preparado:

1. **Instala las dependencias**:
   ```bash
   npm install
   ```

2. **Ejecuta el script de migraciones**:
   ```bash
   npm run migrate
   ```

3. **Verifica la ejecución**:
   - Revisa los mensajes de salida en la consola para confirmar que las migraciones se ejecutaron correctamente
   - Verifica en el panel de supabase que las tablas y columnas se hayan creado correctamente

## Notas importantes

- **Ejecución segura**: Las migraciones están diseñadas para ser idempotentes (se pueden ejecutar varias veces sin causar errores) gracias al uso de `IF NOT EXISTS` y otras protecciones.
- **Respaldo**: Siempre es recomendable hacer un respaldo de la base de datos antes de ejecutar migraciones importantes.
- **Solución de problemas**: Si encuentras errores durante la ejecución de las migraciones, revisa los detalles del error en los mensajes de salida. Los problemas comunes pueden ser:
  - Tablas o columnas que ya existen
  - Errores de sintaxis en el SQL
  - Problemas de permisos en la base de datos

## Estructura de las migraciones

Las migraciones incluidas en este proyecto son:

1. **add_service_dates.sql**: 
   - Agrega campos de fechas de servicio a la tabla de clientes
   - Crea índices para mejorar el rendimiento de las consultas

2. **inventory_tables.sql**:
   - Crea las tablas necesarias para el módulo de inventario:
     - Categorías
     - Proveedores
     - Productos
     - Compras y detalles de compras
     - Ventas y detalles de ventas
   - Define funciones y triggers para mantener el stock actualizado
   - Agrega datos de ejemplo iniciales

Si tienes alguna pregunta o problema durante el proceso de migración, no dudes en contactar al equipo de desarrollo. 