import { supabase } from './supabase.js';

async function cleanData() {
    try {
        console.log('Iniciando limpieza de datos...');

        // Eliminar datos en orden inverso a las dependencias
        // 1. Primero las tablas con foreign keys
        console.log('Eliminando items de facturas...');
        await supabase.from('invoice_items').delete().neq('id', null);

        console.log('Eliminando items de cotizaciones...');
        await supabase.from('quote_items').delete().neq('id', null);

        console.log('Eliminando facturas...');
        await supabase.from('invoices').delete().neq('id', null);

        console.log('Eliminando cotizaciones...');
        await supabase.from('quotes').delete().neq('id', null);

        console.log('Eliminando imágenes de soporte...');
        await supabase.from('support_images').delete().neq('id', null);

        console.log('Eliminando entradas de línea de tiempo...');
        await supabase.from('support_timeline').delete().neq('id', null);

        console.log('Eliminando órdenes de soporte...');
        await supabase.from('support_orders').delete().neq('id', null);

        // 2. Luego las tablas principales
        console.log('Eliminando clientes...');
        await supabase.from('clients').delete().neq('id', null);

        console.log('Eliminando perfiles...');
        await supabase.from('profiles').delete().neq('id', null);

        console.log('¡Limpieza completada con éxito!');
    } catch (error) {
        console.error('Error durante la limpieza:', error.message);
    }
}

// Ejecutar la limpieza
cleanData(); 