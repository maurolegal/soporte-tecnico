// Funciones para el módulo de inventario
import { supabase } from './supabase.js';

// Variables globales
let products = [];
let categories = [];
let suppliers = [];
let currentProductId = null;

// Función para mostrar el modal de nuevo producto
export function showAddProductModal() {
    const modal = document.getElementById('productModal');
    modal.querySelector('.modal-content').innerHTML = `
        <div class="modal-header bg-white">
            <h5 class="modal-title"><i class="fas fa-box me-2"></i>Nuevo Producto</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
            <form id="productForm">
                <div class="row g-3">
                    <!-- Información básica -->
                    <div class="col-12">
                        <div class="card bg-light">
                            <div class="card-header">
                                <h6 class="mb-0">Información Básica</h6>
                            </div>
                            <div class="card-body">
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Código</label>
                                        <input type="text" class="form-control" id="productCode" placeholder="SKU o código interno">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Categoría</label>
                                        <select class="form-select" id="productCategory" required>
                                            <option value="">Seleccionar categoría</option>
                                            <option value="hardware">Hardware</option>
                                            <option value="software">Software</option>
                                            <option value="accesorios">Accesorios</option>
                                            <option value="redes">Redes</option>
                                            <option value="perifericos">Periféricos</option>
                                            <option value="otros">Otros</option>
                                        </select>
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label">Nombre del Producto</label>
                                        <input type="text" class="form-control" id="productName" required>
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label">Descripción</label>
                                        <textarea class="form-control" id="productDescription" rows="3"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Información de inventario -->
                    <div class="col-md-6">
                        <div class="card bg-light">
                            <div class="card-header">
                                <h6 class="mb-0">Inventario</h6>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label class="form-label">Stock Inicial</label>
                                    <input type="number" class="form-control" id="productStock" min="0" value="0" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Stock Mínimo</label>
                                    <input type="number" class="form-control" id="productMinStock" min="0" value="5">
                                    <div class="form-text">Cantidad mínima para alertas de stock bajo</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Unidad de Medida</label>
                                    <select class="form-select" id="productUnit">
                                        <option value="unidad">Unidad</option>
                                        <option value="pieza">Pieza</option>
                                        <option value="caja">Caja</option>
                                        <option value="par">Par</option>
                                        <option value="metro">Metro</option>
                                        <option value="litro">Litro</option>
                                        <option value="kg">Kilogramo</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Ubicación</label>
                                    <input type="text" class="form-control" id="productLocation" placeholder="Estantería, Almacén, etc.">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Información de precios -->
                    <div class="col-md-6">
                        <div class="card bg-light">
                            <div class="card-header">
                                <h6 class="mb-0">Precios</h6>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label class="form-label">Precio de Compra</label>
                                    <div class="input-group">
                                        <span class="input-group-text">$</span>
                                        <input type="number" class="form-control" id="productPurchasePrice" min="0" step="0.01" required>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Precio de Venta</label>
                                    <div class="input-group">
                                        <span class="input-group-text">$</span>
                                        <input type="number" class="form-control" id="productSalePrice" min="0" step="0.01" required>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Ganancia</label>
                                    <div class="input-group">
                                        <span class="input-group-text">$</span>
                                        <input type="number" class="form-control" id="productProfit" readonly>
                                        <span class="input-group-text profit-percentage">0%</span>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Proveedor</label>
                                    <select class="form-select" id="productSupplier">
                                        <option value="">Seleccionar proveedor</option>
                                        <option value="nuevo">+ Agregar nuevo proveedor</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Información adicional -->
                    <div class="col-12">
                        <div class="card bg-light">
                            <div class="card-header">
                                <h6 class="mb-0">Información Adicional</h6>
                            </div>
                            <div class="card-body">
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Fecha de Compra</label>
                                        <input type="date" class="form-control" id="productPurchaseDate" value="${new Date().toISOString().split('T')[0]}">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Garantía (meses)</label>
                                        <input type="number" class="form-control" id="productWarranty" min="0" value="0">
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label">Notas</label>
                                        <textarea class="form-control" id="productNotes" rows="2"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
        <div class="modal-footer bg-light">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="saveProduct()">
                <i class="fas fa-save me-2"></i>Guardar Producto
            </button>
        </div>
    `;
    
    // Configurar cálculo automático de ganancia
    setupProfitCalculation();
    
    // Cargar proveedores y categorías
    loadSuppliers();
    
    // Mostrar el modal
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}

// Función para guardar un nuevo producto
export async function saveProduct() {
    const form = document.getElementById('productForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const newProduct = {
        code: document.getElementById('productCode').value,
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        category: document.getElementById('productCategory').value,
        stock: parseFloat(document.getElementById('productStock').value) || 0,
        min_stock: parseFloat(document.getElementById('productMinStock').value) || 5,
        unit: document.getElementById('productUnit').value,
        location: document.getElementById('productLocation').value,
        purchase_price: parseFloat(document.getElementById('productPurchasePrice').value) || 0,
        sale_price: parseFloat(document.getElementById('productSalePrice').value) || 0,
        supplier_id: document.getElementById('productSupplier').value,
        purchase_date: document.getElementById('productPurchaseDate').value,
        warranty_months: parseInt(document.getElementById('productWarranty').value) || 0,
        notes: document.getElementById('productNotes').value,
        created_at: new Date().toISOString()
    };
    
    try {
        // Si es un producto nuevo
        if (!currentProductId) {
            const { data, error } = await supabase
                .from('products')
                .insert([newProduct])
                .select();
                
            if (error) throw error;
            
            // Si se agregó stock, registrar como compra
            if (newProduct.stock > 0) {
                await registerInitialPurchase(data[0].id, newProduct);
            }
            
            showNotification('Producto agregado correctamente', 'success');
        } 
        // Si es actualización
        else {
            const { error } = await supabase
                .from('products')
                .update(newProduct)
                .eq('id', currentProductId);
                
            if (error) throw error;
            
            showNotification('Producto actualizado correctamente', 'success');
        }
        
        // Cerrar modal y recargar productos
        const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
        modal.hide();
        
        // Recargar productos
        loadProducts();
        
    } catch (error) {
        console.error('Error al guardar producto:', error);
        showNotification('Error al guardar el producto: ' + error.message, 'danger');
    }
}

// Configurar el cálculo automático de ganancia
function setupProfitCalculation() {
    const purchasePriceInput = document.getElementById('productPurchasePrice');
    const salePriceInput = document.getElementById('productSalePrice');
    const profitInput = document.getElementById('productProfit');
    const profitPercentage = document.querySelector('.profit-percentage');
    
    const calculateProfit = () => {
        const purchasePrice = parseFloat(purchasePriceInput.value) || 0;
        const salePrice = parseFloat(salePriceInput.value) || 0;
        
        const profit = salePrice - purchasePrice;
        const percentage = purchasePrice > 0 ? (profit / purchasePrice) * 100 : 0;
        
        profitInput.value = profit.toFixed(2);
        profitPercentage.textContent = `${percentage.toFixed(0)}%`;
        
        // Cambiar color según ganancia
        if (percentage < 10) {
            profitPercentage.className = 'input-group-text text-bg-danger profit-percentage';
        } else if (percentage < 30) {
            profitPercentage.className = 'input-group-text text-bg-warning profit-percentage';
        } else {
            profitPercentage.className = 'input-group-text text-bg-success profit-percentage';
        }
    };
    
    purchasePriceInput.addEventListener('input', calculateProfit);
    salePriceInput.addEventListener('input', calculateProfit);
}

// Registrar compra inicial
async function registerInitialPurchase(productId, productData) {
    const purchaseItem = {
        product_id: productId,
        quantity: productData.stock,
        unit_price: productData.purchase_price,
        total: productData.stock * productData.purchase_price
    };
    
    const purchase = {
        supplier_id: productData.supplier_id,
        date: productData.purchase_date || new Date().toISOString(),
        total: purchaseItem.total,
        notes: 'Registro inicial de producto',
        invoice_number: 'INIT-' + new Date().getTime().toString().slice(-6),
        status: 'completado'
    };
    
    try {
        // Insertar la compra
        const { data: purchaseData, error: purchaseError } = await supabase
            .from('purchases')
            .insert([purchase])
            .select();
            
        if (purchaseError) throw purchaseError;
        
        // Insertar el detalle de la compra
        const purchaseDetail = {
            purchase_id: purchaseData[0].id,
            ...purchaseItem
        };
        
        const { error: detailError } = await supabase
            .from('purchase_items')
            .insert([purchaseDetail]);
            
        if (detailError) throw detailError;
        
    } catch (error) {
        console.error('Error al registrar compra inicial:', error);
        // No bloqueamos el flujo principal si esto falla
    }
}

// Cargar proveedores
async function loadSuppliers() {
    try {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .order('name');
            
        if (error) throw error;
        
        suppliers = data || [];
        
        // Actualizar select de proveedores
        const select = document.getElementById('productSupplier');
        const defaultOptions = select.innerHTML;
        select.innerHTML = defaultOptions;
        
        suppliers.forEach(supplier => {
            const option = document.createElement('option');
            option.value = supplier.id;
            option.textContent = supplier.name;
            select.insertBefore(option, select.lastElementChild);
        });
        
    } catch (error) {
        console.error('Error al cargar proveedores:', error);
    }
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `alert alert-${type} alert-dismissible fade show notification-toast`;
    notificationDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(notificationDiv);
    
    setTimeout(() => {
        notificationDiv.remove();
    }, 5000);
}

// Exportar funciones principales
export {
    loadProducts,
    loadPurchases,
    loadSales
};

// Cargar productos
async function loadProducts() {
    try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        
        products = data || [];
        updateProductsTable();
        updateInventoryStats();
    } catch (error) {
        console.error('Error al cargar productos:', error.message);
        showNotification('Error al cargar los productos', 'danger');
    }
}

// Cargar compras
async function loadPurchases() {
    try {
        const { data, error } = await supabase.from('purchases').select(`
            *,
            supplier:supplier_id(name)
        `).order('date', { ascending: false });
        
        if (error) throw error;
    } catch (error) {
        console.error('Error al cargar compras:', error.message);
        showNotification('Error al cargar las compras', 'danger');
    }
}

// Cargar ventas
async function loadSales() {
    try {
        const { data, error } = await supabase.from('sales').select(`
            *,
            client:client_id(name)
        `).order('date', { ascending: false });
        
        if (error) throw error;
    } catch (error) {
        console.error('Error al cargar ventas:', error.message);
        showNotification('Error al cargar las ventas', 'danger');
    }
}

// Actualizar estadísticas de inventario
function updateInventoryStats() {
    // Implementación en inventario.html
}

// Actualizar tabla de productos
function updateProductsTable() {
    // Implementación en inventario.html
} 