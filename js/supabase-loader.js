// Script para garantizar que Supabase se cargue correctamente
(function() {
  // Si Supabase ya está cargado, no hacemos nada
  if (window.supabase || window.Supabase) {
    console.log('Supabase ya está cargado');
    return;
  }

  // Cargar Supabase desde la CDN de forma dinámica
  console.log('Cargando Supabase desde CDN...');
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  script.async = false; // Garantizar carga secuencial
  
  script.onload = function() {
    console.log('Supabase cargado correctamente');
    // Notificar que Supabase está disponible
    window.dispatchEvent(new Event('supabase-loaded'));
  };
  
  script.onerror = function() {
    console.error('Error al cargar Supabase desde CDN');
    // Intentar con una CDN alternativa
    const fallbackScript = document.createElement('script');
    fallbackScript.src = 'https://unpkg.com/@supabase/supabase-js@2';
    fallbackScript.async = false;
    
    fallbackScript.onload = function() {
      console.log('Supabase cargado correctamente desde CDN alternativa');
      window.dispatchEvent(new Event('supabase-loaded'));
    };
    
    fallbackScript.onerror = function() {
      console.error('Error al cargar Supabase desde todas las CDNs');
    };
    
    document.head.appendChild(fallbackScript);
  };
  
  document.head.appendChild(script);
})(); 