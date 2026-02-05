// === Inv.js: محرك إدارة المخزون والمشتريات والموردين ===

/**
 * الوظيفة الرئيسية: بناء الهيكل الأساسي لتبويب المخزون
 */
function initInventoryMgmt() {
    const tab3 = document.getElementById('tab3');
    if (!tab3) return;

    // رسم القائمة العلوية للتنقل الداخلي
    tab3.innerHTML = `
        <div style="padding:10px; font-family:Tahoma, sans-serif; direction:rtl;">
            <div style="display:flex; background:#e0e0e0; border-radius:8px; margin-bottom:15px; padding:3px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);">
                <button id="btn-show-contacts" onclick="renderContacts()" 
                    style="flex:1; padding:10px; border:none; border-radius:6px; font-size:11px; font-weight:bold; transition: 0.3s; cursor:pointer;">
                    👥 الموردين والعملاء
                </button>
                <button id="btn-show-purchase" onclick="renderPurchaseOrder()" 
                    style="flex:1; padding:10px; border:none; border-radius:6px; font-size:11px; font-weight:bold; transition: 0.3s; cursor:pointer;">
                    📥 توريد بضاعة
                </button>
            </div>

            <div id="inv-sub-content" style="min-height: 300px;"></div> 
        </div>
    `;
    
    // تفعيل القسم الأول تلقائياً عند الفتح
    renderContacts();
}

/**
 * القسم الأول: عرض وإدارة الموردين والعملاء
 * يعتمد بشكل أساسي على ملف CuSu.js
 */
function renderContacts() {
    // 1. تحديث شكل الأزرار (تظليل الموردين)
    updateInvNav('btn-show-contacts');

    // 2. محاولة استدعاء واجهة الأزرار من ملف CuSu.js
    if (typeof renderCuSuActionButtons === 'function') {
        renderCuSuActionButtons();
    } else {
        const container = document.getElementById('inv-sub-content');
        if (container) {
            container.innerHTML = `
                <div style="text-align:center; padding:40px; color:#e74c3c;">
                    <p>⚠️ خطأ: ملف <b>CuSu.js</b> غير محمل.</p>
                    <small>تأكد من استدعاء الملف في indexPos.html</small>
                </div>`;
        }
    }
}

/**
 * القسم الثاني: واجهة تسجيل مشتريات جديدة (تزويد المخزن)
 */
function renderPurchaseOrder() {
    // 1. تحديث شكل الأزرار (تظليل التوريد)
    updateInvNav('btn-show-purchase');
    
    const container = document.getElementById('inv-sub-content');
    if (!container) return;

    container.innerHTML = `
        <div style="background:white; padding:15px; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.05); border:1px solid #eee;">
            <h4 style="margin:0 0 15px 0; color:#2c3e50; font-size:13px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">📥 فاتورة توريد (شراء)</h4>
            
            <label style="font-size:10px; font-weight:bold; display:block; margin-bottom:5px;">اختيار المورد:</label>
            <select id="p-supplier" style="width:100%; padding:10px; margin-bottom:15px; border:1px solid #ddd; border-radius:6px;"></select>

            <div style="background:#fcfcfc; padding:12px; border-radius:8px; border:1px solid #f0f0f0; margin-bottom:15px;">
                <label style="font-size:10px; font-weight:bold; display:block; margin-bottom:5px;">البحث عن صنف:</label>
                <select id="p-item" style="width:100%; padding:10px; margin-bottom:12px; border:1px solid #ddd; border-radius:6px;"></select>
                
                <div style="display:flex; gap:10px;">
                    <div style="flex:1;">
                        <label style="font-size:9px; color:#666;">الكمية:</label>
                        <input type="number" id="p-qty" value="1" min="1" oninput="calculatePurTotal()" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px;">
                    </div>
                    <div style="flex:1;">
                        <label style="font-size:9px; color:#666;">تكلفة الشراء (للوحدة):</label>
                        <input type="number" id="p-cost" placeholder="0.00" oninput="calculatePurTotal()" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px;">
                    </div>
                </div>
            </div>

            <div style="background:#fff3cd; padding:12px; border-radius:8px; margin-bottom:15px; border:1px solid #ffeeba;">
                <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
                    <span>إجمالي الصافي:</span>
                    <span id="p-net">0.00</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:11px; color:#856404;">
                    <span>الضريبة (15%):</span>
                    <span id="p-vat">0.00</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:13px; margin-top:5px; border-top:1px solid #eec; padding-top:5px;">
                    <span>إجمالي الفاتورة:</span>
                    <span id="p-total">0.00</span>
                </div>
            </div>

            <button onclick="processPurchase()" style="width:100%; padding:15px; background:#27ae60; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:13px;">
                اعتماد التوريد للمخزن ✅
            </button>
        </div>
    `;

    // تعبئة الموردين والأصناف من قواعد البيانات
    populatePurchaseDropdowns();
}

/**
 * وظائف حسابية ومعالجة البيانات
 */
function calculatePurTotal() {
    const qty = parseFloat(document.getElementById('p-qty').value) || 0;
    const cost = parseFloat(document.getElementById('p-cost').value) || 0;
    const net = qty * cost;
    const vat = net * 0.15;
    
    document.getElementById('p-net').innerText = net.toFixed(2);
    document.getElementById('p-vat').innerText = vat.toFixed(2);
    document.getElementById('p-total').innerText = (net + vat).toFixed(2);
}

function populatePurchaseDropdowns() {
    // جلب الموردين فقط
    if (typeof dbPosGetAllContacts === 'function') {
        dbPosGetAllContacts(cons => {
            const select = document.getElementById('p-supplier');
            const suppliers = cons.filter(c => c.type === 'sup');
            select.innerHTML = suppliers.map(m => `<option value="${m.id}">${m.name}</option>`).join('') 
                || '<option value="">(أضف مورد أولاً)</option>';
        });
    }

    // جلب الأصناف
    if (typeof dbPosGetAllItems === 'function') {
        dbPosGetAllItems(items => {
            const select = document.getElementById('p-item');
            select.innerHTML = items.map(i => `<option value="${i.id}" data-cost="${i.cost}">${i.name}</option>`).join('');
            
            // تحديث التكلفة تلقائياً عند اختيار صنف
            select.onchange = () => {
                const cost = select.options[select.selectedIndex].dataset.cost;
                document.getElementById('p-cost').value = cost;
                calculatePurTotal();
            };
        });
    }
}

function processPurchase() {
    const sEl = document.getElementById('p-supplier');
    const iEl = document.getElementById('p-item');
    const qty = parseFloat(document.getElementById('p-qty').value);
    const cost = parseFloat(document.getElementById('p-cost').value);

    if (!sEl.value || !iEl.value || qty <= 0) return alert("يرجى التأكد من اختيار المورد، الصنف، والكمية.");

    const purchaseRecord = {
        date: new Date().toISOString(),
        supplierId: parseInt(sEl.value),
        supplierName: sEl.options[sEl.selectedIndex].text,
        items: [{ id: parseInt(iEl.value), qty: qty, cost: cost }],
        total: qty * cost, // الصافي
        isPosted: false
    };

    if (typeof dbPosAddPurchaseRecord === 'function') {
        dbPosAddPurchaseRecord(purchaseRecord, (success) => {
            if (success) {
                alert("تم تحديث المخزون وحفظ فاتورة الشراء بنجاح 📦");
                renderPurchaseOrder();
            }
        });
    }
}

/**
 * دالة التنسيق الآمنة (المسؤولة عن تغيير شكل الأزرار)
 */
function updateInvNav(activeId) {
    const btnContacts = document.getElementById('btn-show-contacts');
    const btnPurchase = document.getElementById('btn-show-purchase');

    // فحص الأمان: التأكد من وجود العناصر قبل محاولة تعديل الـ Style
    if (btnContacts && btnPurchase) {
        // إعادة التنسيق للوضع غير النشط
        [btnContacts, btnPurchase].forEach(btn => {
            btn.style.background = "none";
            btn.style.color = "#555";
        });

        // تمييز الزر النشط
        const activeBtn = document.getElementById(activeId);
        if (activeBtn) {
            activeBtn.style.background = "#2c3e50";
            activeBtn.style.color = "white";
        }
    }
}
