// Script para ejecutar migraciones SQL en supabase
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuración de supabase (misma que la del archivo js/supabase.js)
const supabaseUrl = 'https://stddbzpxdqxuzhhqywtc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZGRienB4ZHF4dXpoaHF5d3RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MTgzOTAsImV4cCI6MjA2MzQ5NDM5MH0.ZLrpXpw5ATu0ymcXgWMBfYiCLsoDxULRYRn_31NMzTE';
const supabase = createClient(supabaseUrl, supabaseKey);

// Ruta a los archivos de migración
const migrationsPath = path.join(__dirname, 'migrations');

// Función para ejecutar una migración
async function executeMigration(filePath) {
    try {
        const sql = fs.readFileSync(filePath, 'utf8');
        console.log(`Ejecutando migración: ${path.basename(filePath)}`);
        
        // Dividir el SQL en sentencias individuales
        const statements = sql
            .split(';')
            .filter(stmt => stmt.trim())
            .map(stmt => stmt.trim() + ';');
        
        // Ejecutar cada sentencia por separado
        for (const statement of statements) {
            try {
                const { error } = await supabase.rpc('exec_sql', { 
                    query: statement 
                });
                
                if (error) {
                    console.error(`Error en sentencia SQL: ${statement}`);
                    console.error(error);
                }
            } catch (stmtError) {
                console.error(`Error al ejecutar una sentencia SQL: ${statement}`);
                console.error(stmtError);
            }
        }
        
        console.log(`Migración completada: ${path.basename(filePath)}`);
    } catch (error) {
        console.error(`Error al leer o ejecutar la migración ${path.basename(filePath)}:`, error);
    }
}

// Función principal para ejecutar todas las migraciones
async function runMigrations() {
    try {
        // Verificar si el directorio existe
        if (!fs.existsSync(migrationsPath)) {
            console.error(`Error: Directorio de migraciones no encontrado en: ${migrationsPath}`);
            return;
        }
        
        // Obtener la lista de archivos de migración
        const files = fs.readdirSync(migrationsPath)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Ordenar alfabéticamente para mantener el orden de ejecución
        
        console.log(`Se encontraron ${files.length} archivos de migración.`);
        
        // Ejecutar cada migración en secuencia
        for (const file of files) {
            const filePath = path.join(migrationsPath, file);
            await executeMigration(filePath);
        }
        
        console.log('Todas las migraciones han sido ejecutadas.');
    } catch (error) {
        console.error('Error al ejecutar las migraciones:', error);
    }
}

// Ejecutar las migraciones
runMigrations(); 