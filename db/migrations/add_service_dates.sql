-- Add missing columns to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS last_service_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_service_date TIMESTAMP WITH TIME ZONE;

-- Update existing clients with sample data (optional)
UPDATE clients 
SET 
    notes = 'Cliente actualizado con campos de servicio',
    last_service_date = NOW() - INTERVAL '3 months',
    next_service_date = NOW() + INTERVAL '3 months'
WHERE last_service_date IS NULL;

-- Create index for service dates to improve query performance
CREATE INDEX IF NOT EXISTS idx_clients_next_service_date ON clients(next_service_date);
CREATE INDEX IF NOT EXISTS idx_clients_last_service_date ON clients(last_service_date); 