// === Itm.js: إدارة الأصناف والمخزون المتقدمة ===

function initItemMgmt() {
    const tab4 = document.getElementById('tab4');
    tab4.innerHTML = `
        <div style="padding:10px; font-family:sans-serif;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h3 style="margin:0; color:#2c3e50;">📦 مستودع الأصناف</h3>
                <div style="display:flex; gap:5px;">
                    <button onclick="showCategoryModal()" style="padding:8px; background:#9b59b6; color:white; border:none; border-radius:4px; font-size:10px;">📁 الفئات</button>
                    <button onclick="showItemModal()" style="padding:8px; background:#27ae60; color:white; border:none; border-radius:4px; font-size:10px;">➕ صنف جديد</button>
                </div>
            </div>

            <div style="display:flex; gap:5px; margin-bottom:15px;">
                <input type="text" id="itemSearch" onkeyup="filterItemsTable()" placeholder="🔍 ابحث بالاسم أو الباركود..." 
                    style="flex:2; padding:10px; border:1px solid #ddd; border-radius:5px;">
                <select id="filterCategory" onchange="filterItemsTable()" style="flex:1; border:1px solid #ddd; border-radius:5px;">
                    <option value="">كل الفئات</option>
                </select>
            </div>

            <div id="items-container" style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; background:white; font-size:11px; box-shadow:0 2px 10px rgba(0,0,0,0.05);">
                    <thead>
                        <tr style="background:#34495e; color:white; text-align:right;">
                            <th style="padding:12px 8px;">الصنف</th>
                            <th style="padding:12px 8px;">الفئة</th>
                            <th style="padding:12px 8px; text-align:center;">السعر</th>
                            <th style="padding:12px 8px; text-align:center;">المخزون</th>
                            <th style="padding:12px 8px; text-align:center;">إجراء</th>
                        </tr>
                    </thead>
                    <tbody id="items-table-body">
                        </tbody>
                </table>
            </div>
        </div>

        <div id="itemModal" class="pos-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:9999; align-items:center; justify-content:center;">
            <div style="background:white; width:95%; max-width:450px; border-radius:8px; overflow:hidden;">
                <div style="background:#2c3e50; color:white; padding:15px; display:flex; justify-content:space-between;">
                    <span id="modalTitle">إضافة صنف جديد</span>
                    <button onclick="closeItemModal()" style="background:none; border:none; color:white; font-size:18px;">✕</button>
                </div>
                <div style="padding:15px;">
                    <input type="hidden" id="editItemId">
                    <label style="font-size:10px; color:#666;">اسم المنتج *</label>
                    <input type="text" id="itemName" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:4px;">
                    
                    <div style="display:flex; gap:10px;">
                        <div style="flex:1;">
                            <label style="font-size:10px; color:#666;">الباركود</label>
                            <input type="text" id="itemBarcode" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:4px;">
                        </div>
                        <div style="flex:1;">
                            <label style="font-size:10px; color:#666;">الفئة</label>
                            <select id="itemCategory" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px;"></select>
                        </div>
                    </div>

                    <div style="display:flex; gap:10px;">
                        <div style="flex:1;">
                            <label style="font-size:10px; color:#666;">سعر التكلفة</label>
                            <input type="number" id="itemCost" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px;">
                        </div>
                        <div style="flex:1;">
                            <label style="font-size:10px; color:#666;">سعر البيع *</label>
                            <input type="number" id="itemPrice" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px;">
                        </div>
                    </div>

                    <div style="display:flex; gap:10px; margin-top:10px;">
                        <div style="flex:1;">
                            <label style="font-size:10px; color:#666;">الكمية الحالية</label>
                            <input type="number" id="itemStock" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px;">
                        </div>
                        <div style="flex:1;">
                            <label style="font-size:10px; color:#666;">حد الطلب (تنبيه)</label>
                            <input type="number" id="itemMinLimit" value="5" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px;">
                        </div>
                    </div>

                    <button onclick="saveItem()" style="width:100%; padding:12px; background:#27ae60; color:white; border:none; border-radius:5px; margin-top:20px; font-weight:bold;">حفظ البيانات</button>
                </div>
            </div>
        </div>
    `;
    loadCategories();
    loadItemsTable();
}

// دالة تحميل الفئات في القوائم المنسدلة
function loadCategories() {
    dbPosGetAllCategories((cats) => {
        const filters = document.getElementById('filterCategory');
        const select = document.getElementById('itemCategory');
        const options = cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        
        filters.innerHTML = '<option value="">كل الفئات</option>' + options;
        select.innerHTML = '<option value="عام">عام</option>' + options;
    });
}

// دالة عرض الجدول مع التنسيق الشرطي للمخزون
function loadItemsTable() {
    dbPosGetAllItems((items) => {
        const tbody = document.getElementById('items-table-body');
        tbody.innerHTML = items.map(it => {
            const lowStock = it.stock <= (it.minLimit || 5);
            return `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:10px;">
                        <div style="font-weight:bold;">${it.name}</div>
                        <div style="font-size:9px; color:#999;">${it.barcode || 'بدون باركود'}</div>
                    </td>
                    <td style="padding:10px; color:#7f8c8d;">${it.category || 'عام'}</td>
                    <td style="padding:10px; text-align:center; font-weight:bold;">${it.price.toFixed(2)}</td>
                    <td style="padding:10px; text-align:center;">
                        <span style="padding:2px 6px; border-radius:10px; background:${lowStock ? '#ffeb3b' : '#e8f5e9'}; color:${lowStock ? '#f57c00' : '#2e7d32'};">
                            ${it.stock}
                        </span>
                    </td>
                    <td style="padding:10px; text-align:center;">
                        <button onclick="editItem(${it.id})" style="border:none; background:none; color:#3498db;">✏️</button>
                        <button onclick="deleteItem(${it.id})" style="border:none; background:none; color:#e74c3c;">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="5" style="text-align:center; padding:30px; color:#999;">المستودع فارغ.. اضف أول صنف الآن</td></tr>';
    });
}

// دالة الحفظ (إضافة أو تعديل)
function saveItem() {
    const id = document.getElementById('editItemId').value;
    const item = {
        name: document.getElementById('itemName').value,
        barcode: document.getElementById('itemBarcode').value,
        category: document.getElementById('itemCategory').value,
        cost: parseFloat(document.getElementById('itemCost').value) || 0,
        price: parseFloat(document.getElementById('itemPrice').value) || 0,
        stock: parseFloat(document.getElementById('itemStock').value) || 0,
        minLimit: parseFloat(document.getElementById('itemMinLimit').value) || 5
    };

    if(!item.name || !item.price) return alert("الاسم والسعر حقول إجبارية");

    if(id) {
        item.id = parseInt(id);
        dbPosUpdateItem(item, () => { closeItemModal(); loadItemsTable(); });
    } else {
        dbPosAddItem(item, () => { closeItemModal(); loadItemsTable(); });
    }
}

function showItemModal() {
    document.getElementById('editItemId').value = "";
    document.getElementById('itemName').value = "";
    document.getElementById('itemModal').style.display = 'flex';
}

function closeItemModal() {
    document.getElementById('itemModal').style.display = 'none';
}

// دالة حذف صنف مع التأكيد
function deleteItem(id) {
    if(confirm("هل أنت متأكد من حذف هذا الصنف؟ لا يمكن التراجع عن هذه الخطوة.")) {
        dbPosDeleteItem(id, () => loadItemsTable());
    }
}
// دالة البحث والفلترة في الجدول
function filterItemsTable() {
    const query = document.getElementById('itemSearch').value.toLowerCase();
    const catFilter = document.getElementById('filterCategory').value;
    const rows = document.querySelectorAll('#items-table-body tr');

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const categoryCell = row.cells[1].innerText; // عمود الفئة
        
        const matchesSearch = text.includes(query);
        const matchesCat = catFilter === "" || categoryCell === catFilter;

        row.style.display = (matchesSearch && matchesCat) ? "" : "none";
    });
}

// دالة إضافة فئة جديدة (نافذة سريعة)
function showCategoryModal() {
    const catName = prompt("أدخل اسم الفئة الجديدة (مثلاً: مشروبات، مواد غذائية):");
    if (catName) {
        dbPosAddCategory(catName, () => {
            alert("تمت إضافة الفئة بنجاح");
            loadCategories(); // تحديث القوائم المنسدلة
        });
    }
}

// دالة لتعديل صنف موجود
function editItem(id) {
    dbPosGetAllItems((items) => {
        const item = items.find(it => it.id === id);
        if (item) {
            document.getElementById('editItemId').value = item.id;
            document.getElementById('itemName').value = item.name;
            document.getElementById('itemBarcode').value = item.barcode || "";
            document.getElementById('itemCategory').value = item.category || "عام";
            document.getElementById('itemCost').value = item.cost;
            document.getElementById('itemPrice').value = item.price;
            document.getElementById('itemStock').value = item.stock;
            document.getElementById('itemMinLimit').value = item.minLimit || 5;
            
            document.getElementById('modalTitle').innerText = "تعديل صنف";
            document.getElementById('itemModal').style.display = 'flex';
        }
    });
}
