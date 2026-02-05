// === Inti.js: محرك التكامل المحاسبي الشامل (مبيعات + مشتريات) ===

let accountsCache = []; 

function initIntegration() {
    const tab5 = document.getElementById('tab5');
    tab5.innerHTML = `
        <div style="padding:15px; font-family:Tahoma; direction:rtl;">
            <div style="background:#2c3e50; color:white; padding:15px; border-radius:8px; margin-bottom:15px;">
                <h3 style="margin:0; font-size:14px;">🔗 مركز الربط والمزامنة (ERP Bridge)</h3>
                <p style="font-size:10px; margin:5px 0 0 0; color:#bdc3c7;">توجيه القيود الآلية للمبيعات والمشتريات والمخزون</p>
            </div>

            <div style="background:white; padding:15px; border-radius:8px; border:1px solid #ddd; margin-bottom:15px; max-height:55vh; overflow-y:auto;">
                <h4 style="margin:0 0 10px 0; font-size:12px; border-bottom:1px solid #eee; padding-bottom:5px;">⚙️ إعدادات توجيه الحسابات</h4>
                
                <div style="display:grid; grid-template-columns: 1fr; gap:8px;">
                    <div class="field">
                        <label class="lbl">حساب النقدية (الخزينة):</label>
                        <select id="map-cash" class="inti-select"></select>
                    </div>
                    <div class="field">
                        <label class="lbl">حساب ذمم العملاء (مبيعات آجلة):</label>
                        <select id="map-receivable" class="inti-select"></select>
                    </div>
                    <div class="field">
                        <label class="lbl">حساب ذمم الموردين (مشتريات آجلة):</label>
                        <select id="map-payable" class="inti-select"></select>
                    </div>
                    <div class="field">
                        <label class="lbl">حساب إيراد المبيعات:</label>
                        <select id="map-sales" class="inti-select"></select>
                    </div>
                    <div class="field">
                        <label class="lbl">حساب الضريبة (VAT):</label>
                        <select id="map-vat" class="inti-select"></select>
                    </div>
                    <div class="field">
                        <label class="lbl">حساب المخزون (الأصول):</label>
                        <select id="map-inventory" class="inti-select"></select>
                    </div>
                    <div class="field">
                        <label class="lbl">حساب تكلفة المبيعات (COGS):</label>
                        <select id="map-cogs" class="inti-select"></select>
                    </div>
                </div>

                <button onclick="saveFullMapping()" style="width:100%; padding:10px; background:#34495e; color:white; border:none; border-radius:5px; margin-top:15px; font-weight:bold;">حفظ إعدادات الربط</button>
            </div>

            <div style="display:flex; gap:10px;">
                <div style="flex:1; background:#fff; padding:15px; border-radius:8px; border:1px solid #27ae60; text-align:center;">
                    <small>مبيعات معلقة</small>
                    <div id="pending-sales" style="font-size:18px; font-weight:bold; color:#27ae60;">0</div>
                    <button onclick="syncSales()" id="btn-sync-sales" disabled style="width:100%; padding:8px; background:#27ae60; color:white; border:none; border-radius:4px; margin-top:5px; font-size:10px;">ترحيل المبيعات</button>
                </div>
                
                <div style="flex:1; background:#fff; padding:15px; border-radius:8px; border:1px solid #e67e22; text-align:center;">
                    <small>مشتريات معلقة</small>
                    <div id="pending-purchases" style="font-size:18px; font-weight:bold; color:#e67e22;">0</div>
                    <button onclick="syncPurchases()" id="btn-sync-purchases" disabled style="width:100%; padding:8px; background:#e67e22; color:white; border:none; border-radius:4px; margin-top:5px; font-size:10px;">ترحيل المشتريات</button>
                </div>
            </div>
        </div>

        <style>
            .lbl { display:block; font-size:9px; font-weight:bold; margin-bottom:2px; color:#555; }
            .inti-select { width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:10px; }
        </style>
    `;

    loadAccountsForInti();
}

// جلب الحسابات من قاعدة بيانات المحاسبة
function loadAccountsForInti() {
    const req = indexedDB.open('MyAccountingDB');
    req.onsuccess = (e) => {
        const dbFin = e.target.result;
        const tx = dbFin.transaction(['accounts'], 'readonly');
        tx.objectStore('accounts').getAll().onsuccess = (ev) => {
            const accs = ev.target.result;
            const parentIds = new Set(accs.map(a => a.parentId));
            accountsCache = accs.filter(a => !parentIds.has(a.id));
            
            const options = `<option value="">-- اختر الحساب --</option>` + 
                accountsCache.map(a => `<option value="${a.id}">${a.code} - ${a.name}</option>`).join('');
            
            ['map-cash', 'map-receivable', 'map-payable', 'map-sales', 'map-vat', 'map-inventory', 'map-cogs'].forEach(id => {
                document.getElementById(id).innerHTML = options;
            });

            loadSavedFullMapping();
            updateSyncCounts();
        };
    };
}

// تحديث عداد العمليات غير المرحلة
function updateSyncCounts() {
    dbPosGetUnpostedSales(sales => {
        document.getElementById('pending-sales').innerText = sales.length;
        document.getElementById('btn-sync-sales').disabled = (sales.length === 0);
    });
    
    // ملاحظة: تأكد من تعريف dbPosGetUnpostedPurchases في DbPos.js
    if (typeof dbPosGetUnpostedPurchases === 'function') {
        dbPosGetUnpostedPurchases(purchases => {
            document.getElementById('pending-purchases').innerText = purchases.length;
            document.getElementById('btn-sync-purchases').disabled = (purchases.length === 0);
        });
    }
}

// --- ترحيل المبيعات (الجرد المستمر) ---
function syncSales() {
    const config = getMappingConfig();
    if (!config) return;

    dbPosGetUnpostedSales(sales => {
        const req = indexedDB.open('MyAccountingDB');
        req.onsuccess = (e) => {
            const dbFin = e.target.result;
            sales.forEach(sale => {
                let totalCost = 0; let vat = sale.total * (0.15 / 1.15); let net = sale.total - vat;
                sale.items.forEach(it => totalCost += (it.cost * it.qty));

                const entry = {
                    date: sale.date, desc: `مبيعات POS فاتورة #${sale.id}`,
                    details: [
                        { accountId: parseInt(sale.paymentMethod==='cash'?config.cash:config.receivable), debit: sale.total, credit: 0 },
                        { accountId: parseInt(config.cogs), debit: totalCost, credit: 0 },
                        { accountId: parseInt(config.sales), debit: 0, credit: net },
                        { accountId: parseInt(config.vat), debit: 0, credit: vat },
                        { accountId: parseInt(config.inventory), debit: 0, credit: totalCost }
                    ]
                };
                saveJournalToFin(dbFin, entry, () => dbPosMarkAsPosted(sale.id, updateSyncCounts));
            });
            alert("تم ترحيل المبيعات وتحديث المخزن مالياً.");
        };
    });
}

// --- ترحيل المشتريات (تزويد المخزن) ---
function syncPurchases() {
    const config = getMappingConfig();
    if (!config) return;

    dbPosGetUnpostedPurchases(purchases => {
        const req = indexedDB.open('MyAccountingDB');
        req.onsuccess = (e) => {
            const dbFin = e.target.result;
            purchases.forEach(p => {
                let vat = p.total * 0.15; // المشتريات عادة يضاف لها الضريبة
                let net = p.total;
                let totalWithVat = p.total + vat;

                const entry = {
                    date: p.date, desc: `مشتريات POS فاتورة #${p.id} - المورد: ${p.supplierName}`,
                    details: [
                        { accountId: parseInt(config.inventory), debit: net, credit: 0 }, // زيادة المخزون كأصل
                        { accountId: parseInt(config.vat), debit: vat, credit: 0 },      // ضريبة مدخلات (لنا)
                        { accountId: parseInt(config.payable), debit: 0, credit: totalWithVat } // التزام للمورد
                    ]
                };
                saveJournalToFin(dbFin, entry, () => dbPosMarkPurchaseAsPosted(p.id, updateSyncCounts));
            });
            alert("تم ترحيل المشتريات وإثبات مديونية الموردين.");
        };
    });
}

// دوال مساعدة
function saveJournalToFin(db, entry, callback) {
    const tx = db.transaction(['journals'], 'readwrite');
    entry.createdAt = new Date().toISOString();
    tx.objectStore('journals').add(entry).onsuccess = callback;
}

function getMappingConfig() {
    const config = {
        cash: document.getElementById('map-cash').value,
        receivable: document.getElementById('map-receivable').value,
        payable: document.getElementById('map-payable').value,
        sales: document.getElementById('map-sales').value,
        vat: document.getElementById('map-vat').value,
        inventory: document.getElementById('map-inventory').value,
        cogs: document.getElementById('map-cogs').value
    };
    if (Object.values(config).some(v => !v)) { alert("يرجى إكمال خريطة الحسابات!"); return null; }
    return config;
}

function saveFullMapping() {
    const config = getMappingConfig();
    if(config) localStorage.setItem('pos_erp_mapping', JSON.stringify(config));
    alert("تم الحفظ.");
}

function loadSavedFullMapping() {
    const saved = JSON.parse(localStorage.getItem('pos_erp_mapping'));
    if (saved) {
        Object.keys(saved).forEach(key => {
            const el = document.getElementById('map-' + key);
            if(el) el.value = saved[key];
        });
    }
}
