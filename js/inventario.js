// Funciones para el módulo de inventario
import { supabase, inventoryApi } from './supabase.js';

// Variables globales
let products = [];
let categories = [];
window.allProducts = [];
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
            <button type="button" class="btn btn-primary" id="btnSaveProduct">
                <i class="fas fa-save me-2"></i>Guardar Producto
            </button>
        </div>
    `;
    
    // Configurar cálculo automático de ganancia
    setupProfitCalculation();
    
    // Cargar proveedores y categorías
    loadSuppliers();
    
    // Agregar evento para guardar producto
    document.getElementById('btnSaveProduct').addEventListener('click', saveProduct);
    
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
    
    try {
        // Comprobar si se seleccionó "Agregar nuevo proveedor"
        const supplierSelect = document.getElementById('productSupplier');
        let supplierId = null;
        
        if (supplierSelect.value === 'nuevo') {
            // Si se seleccionó "nuevo", mostrar modal para crear proveedor
            showNewSupplierModal();
            return; // Salimos de la función y el guardado continuará después de que se cree el proveedor
        } else {
            // Usar el proveedor seleccionado (podría ser null si se seleccionó "Seleccionar proveedor")
            supplierId = supplierSelect.value || null;
        }
        
        await saveProductWithSupplierId(supplierId);
        
    } catch (error) {
        console.error('Error al guardar producto:', error);
        showNotification(`Error al guardar el producto: ${error.message}`, 'danger');
    }
}

// Función auxiliar para guardar producto con un ID de proveedor específico
async function saveProductWithSupplierId(supplierId) {
    try {
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
            supplier_id: supplierId,
            purchase_date: document.getElementById('productPurchaseDate').value,
            warranty_months: parseInt(document.getElementById('productWarranty').value) || 0,
            notes: document.getElementById('productNotes').value
        };
        
        if (currentProductId) {
            // Actualizar producto existente
            await inventoryApi.products.update(currentProductId, newProduct);
            showNotification('Producto actualizado correctamente', 'success');
        } else {
            // Crear nuevo producto
            const createdProduct = await inventoryApi.products.create(newProduct);
            
            // Si hay stock inicial, registrar compra inicial
            if (newProduct.stock > 0) {
                await registerInitialPurchase(createdProduct.id, newProduct);
            }
            
            showNotification('Producto añadido correctamente', 'success');
        }
        
        // Cerrar modal y actualizar lista
        bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
        await loadProducts();
        
    } catch (error) {
        console.error('Error al guardar producto:', error);
        showNotification(`Error al guardar el producto: ${error.message}`, 'danger');
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
        // Usar la API de inventario en lugar de llamar a supabase directamente
        const purchaseData = await inventoryApi.purchases.create(purchase, [purchaseItem]);
        console.log('Compra inicial registrada:', purchaseData);
    } catch (error) {
        console.error('Error al registrar compra inicial:', error);
        // No bloqueamos el flujo principal si esto falla
    }
}

// Cargar proveedores
export async function loadSuppliers() {
    try {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .order('name');
            
        if (error) throw error;
        
        suppliers = data || [];
        
        // Actualizar select de proveedores
        const select = document.getElementById('productSupplier');
        if (select) {
            const defaultOptions = select.innerHTML.split('<option value="nuevo">')[0];
            select.innerHTML = defaultOptions + '<option value="nuevo">+ Agregar nuevo proveedor</option>';
            
            suppliers.forEach(supplier => {
                const option = document.createElement('option');
                option.value = supplier.id;
                option.textContent = supplier.name;
                select.insertBefore(option, select.lastElementChild);
            });
        }
        
        return suppliers;
        
    } catch (error) {
        console.error('Error al cargar proveedores:', error);
        showNotification('Error al cargar proveedores', 'danger');
        return [];
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

// Función para cargar productos
export async function loadProducts() {
    try {
        const data = await inventoryApi.products.getAll();
        products = data;
        window.allProducts = data; // Guardar en variable global para búsquedas
        
        updateProductsTable();
        updateProductCounters();
        
        console.log('Productos cargados:', products.length);
    } catch (error) {
        console.error('Error al cargar productos:', error);
        showNotification('Error al cargar los productos', 'danger');
    }
}

// Función para cargar compras
export async function loadPurchases() {
    try {
        const data = await inventoryApi.purchases.getAll();
        window.purchases = data;
        
        updatePurchasesTable();
        
        console.log('Compras cargadas:', data.length);
    } catch (error) {
        console.error('Error al cargar compras:', error);
        showNotification('Error al cargar las compras', 'danger');
    }
}

// Función para cargar ventas
export async function loadSales() {
    try {
        const data = await inventoryApi.sales.getAll();
        window.sales = data;
        
        updateSalesTable();
        
        console.log('Ventas cargadas:', data.length);
    } catch (error) {
        console.error('Error al cargar ventas:', error);
        showNotification('Error al cargar las ventas', 'danger');
    }
}

// Función para actualizar los contadores de productos
function updateProductCounters() {
    const totalProducts = products.length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.min_stock).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.stock * p.purchase_price), 0);
    
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('lowStock').textContent = lowStock;
    document.getElementById('outOfStock').textContent = outOfStock;
    document.getElementById('totalValue').textContent = formatCurrency(totalValue);
    
    // Actualizar las barras de progreso
    if (totalProducts > 0) {
        document.querySelector('#lowStock').closest('.card').querySelector('.progress-bar').style.width = 
            `${(lowStock / totalProducts) * 100}%`;
            
        document.querySelector('#outOfStock').closest('.card').querySelector('.progress-bar').style.width = 
            `${(outOfStock / totalProducts) * 100}%`;
    }
}

// Función para actualizar la tabla de productos
function updateProductsTable() {
    const tbody = document.querySelector('#productsTable tbody');
    tbody.innerHTML = '';
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay productos registrados</td></tr>';
        return;
    }
    
    products.forEach(product => {
        const row = document.createElement('tr');
        const stockClass = product.stock <= product.min_stock ? 
            (product.stock === 0 ? 'table-danger' : 'table-warning') : '';
        
        row.className = stockClass;
        
        row.innerHTML = `
            <td>${product.code || '-'}</td>
            <td>${product.name}</td>
            <td>${product.category || '-'}</td>
            <td>${formatNumber(product.stock)}${product.unit ? ' ' + product.unit : ''}</td>
            <td>${formatCurrency(product.purchase_price)}</td>
            <td>${formatCurrency(product.sale_price)}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-info btn-custom" onclick="viewProduct('${product.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-warning btn-custom" onclick="editProduct('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-custom" onclick="deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Función para actualizar la tabla de compras
function updatePurchasesTable() {
    const tbody = document.querySelector('#purchasesTable tbody');
    tbody.innerHTML = '';
    
    if (!window.purchases || window.purchases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay compras registradas</td></tr>';
        return;
    }
    
    window.purchases.forEach(purchase => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${purchase.invoice_number || '-'}</td>
            <td>${purchase.supplier ? purchase.supplier.name : '-'}</td>
            <td>${formatDate(purchase.date)}</td>
            <td>${formatCurrency(purchase.total)}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-info btn-custom" onclick="viewPurchase('${purchase.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-secondary btn-custom" onclick="printPurchase('${purchase.id}')">
                        <i class="fas fa-print"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Función para actualizar la tabla de ventas
function updateSalesTable() {
    const tbody = document.querySelector('#salesTable tbody');
    tbody.innerHTML = '';
    
    if (!window.sales || window.sales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay ventas registradas</td></tr>';
        return;
    }
    
    window.sales.forEach(sale => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${sale.invoice_number || '-'}</td>
            <td>${sale.client ? sale.client.name : '-'}</td>
            <td>${formatDate(sale.date)}</td>
            <td>${formatCurrency(sale.total)}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-info btn-custom" onclick="viewSale('${sale.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-secondary btn-custom" onclick="printSale('${sale.id}')">
                        <i class="fas fa-print"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Funciones de utilidad para formateo
function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function formatNumber(num) {
    return parseFloat(num).toFixed(2).replace(/\.00$/, '');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit'
    });
}

// Mostrar el modal de nuevo proveedor
function showNewSupplierModal() {
    const modal = document.getElementById('newSupplierModal');
    const modalInstance = new bootstrap.Modal(modal);
    
    // Agregar evento para guardar el proveedor
    document.getElementById('btnSaveSupplier').addEventListener('click', saveNewSupplier, {once: true});
    
    modalInstance.show();
}

// Guardar nuevo proveedor y continuar con el guardado del producto
async function saveNewSupplier() {
    const form = document.getElementById('supplierForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    try {
        const supplierData = {
            name: document.getElementById('supplierName').value.trim(),
            contact_name: document.getElementById('supplierContact').value.trim() || null,
            phone: document.getElementById('supplierPhone').value.trim() || null,
            email: document.getElementById('supplierEmail').value.trim() || null,
            address: document.getElementById('supplierAddress').value.trim() || null,
            status: 'active'
        };
        
        // Crear proveedor
        const newProvider = await inventoryApi.suppliers.create(supplierData);
        showNotification(`Proveedor "${supplierData.name}" creado correctamente`, 'success');
        
        // Cerrar el modal de proveedor
        bootstrap.Modal.getInstance(document.getElementById('newSupplierModal')).hide();
        
        // Actualizar el select de proveedores
        await loadSuppliers();
        
        // Seleccionar el nuevo proveedor
        const supplierSelect = document.getElementById('productSupplier');
        if (supplierSelect) {
            supplierSelect.value = newProvider.id;
        }
        
        // Continuar con el guardado del producto
        await saveProductWithSupplierId(newProvider.id);
        
    } catch (error) {
        console.error('Error al guardar proveedor:', error);
        showNotification(`Error al guardar el proveedor: ${error.message}`, 'danger');
    }
} 