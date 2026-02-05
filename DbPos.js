// === DbPos.js: قاعدة بيانات نقطة البيع والمخزون ===
let dbPos;
const POS_DB_NAME = 'MyPosDB';
const POS_DB_VERSION = 1;

const posRequest = indexedDB.open(POS_DB_NAME, POS_DB_VERSION);

posRequest.onupgradeneeded = function(event) {
    let db = event.target.result;

    // 1. الأصناف (المنتجات)
    if (!db.objectStoreNames.contains('items')) {
        db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
    }
    // 2. الفئات (التصنيفات)
    if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
    }
    // 3. العملاء والموردين
    if (!db.objectStoreNames.contains('contacts')) {
        db.createObjectStore('contacts', { keyPath: 'id', autoIncrement: true });
    }
    // 4. حركات المبيعات
    if (!db.objectStoreNames.contains('sales')) {
        db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
    }
    // 5. إعدادات التكامل (لربط الحسابات مع النظام المحاسبي)
    if (!db.objectStoreNames.contains('integration')) {
        db.createObjectStore('integration', { keyPath: 'key' });
    }
    // أضف هذا الجزء داخل onupgradeneeded في DbPos.js
    if (!db.objectStoreNames.contains('purchases')) {
        db.createObjectStore('purchases', { keyPath: 'id', autoIncrement: true });
    }

};

// === DbPos.js التعديل ===
posRequest.onsuccess = function(event) {
    dbPos = event.target.result;
    console.log("POS Database opened successfully");

    // إرسال إشارة للمتصفح بأن القاعدة جاهزة الآن
    if (typeof startPosApp === 'function') {
        startPosApp();
    }
};

// دالة لإضافة صنف جديد
function dbPosAddItem(item, callback) {
    const tx = dbPos.transaction(['items'], 'readwrite');
    const store = tx.objectStore('items');
    const request = store.add(item);
    request.onsuccess = () => callback(true);
    request.onerror = () => callback(false);
}

// دالة لجلب جميع الأصناف
function dbPosGetAllItems(callback) {
    const tx = dbPos.transaction(['items'], 'readonly');
    const store = tx.objectStore('items');
    const request = store.getAll();
    request.onsuccess = () => callback(request.result);
}

// دالة لجلب جميع الفئات (التصنيفات)
function dbPosGetAllCategories(callback) {
    const tx = dbPos.transaction(['categories'], 'readonly');
    const store = tx.objectStore('categories');
    store.getAll().onsuccess = (e) => callback(e.target.result);
}
// تحديث صنف موجود
function dbPosUpdateItem(item, callback) {
    const tx = dbPos.transaction(['items'], 'readwrite');
    const request = tx.objectStore('items').put(item);
    request.onsuccess = () => callback(true);
}

// حذف صنف
function dbPosDeleteItem(id, callback) {
    const tx = dbPos.transaction(['items'], 'readwrite');
    const request = tx.objectStore('items').delete(id);
    request.onsuccess = () => callback(true);
}

// إضافة فئة جديدة (مثل: مشروبات، معلبات)
function dbPosAddCategory(categoryName, callback) {
    const tx = dbPos.transaction(['categories'], 'readwrite');
    const request = tx.objectStore('categories').add({ name: categoryName });
    request.onsuccess = () => callback(true);
}
// دالة حفظ فاتورة بيع جديدة
function dbPosAddSale(saleData, callback) {
    const tx = dbPos.transaction(['sales', 'items'], 'readwrite');
    const salesStore = tx.objectStore('sales');
    const itemsStore = tx.objectStore('items');

    // 1. حفظ الفاتورة
    salesStore.add(saleData);

    // 2. تحديث الكميات في المخزن تلقائياً
    saleData.items.forEach(soldItem => {
        const getReq = itemsStore.get(soldItem.id);
        getReq.onsuccess = () => {
            const item = getReq.result;
            if (item) {
                item.stock -= soldItem.qty; // خصم الكمية المباعة
                itemsStore.put(item);
            }
        };
    });

    tx.oncomplete = () => callback(true);
    tx.onerror = () => callback(false);
}

// جلب كافة المبيعات مرتبة من الأحدث للأقدم
function dbPosGetAllSales(callback) {
    const tx = dbPos.transaction(['sales'], 'readonly');
    const store = tx.objectStore('sales');
    const request = store.getAll();
    request.onsuccess = () => {
        // ترتيب النتائج لتظهر الفواتير الأخيرة في الأعلى
        const sortedSales = request.result.sort((a, b) => new Date(b.date) - new Date(a.date));
        callback(sortedSales);
    };
}

function dbPosAddContact(contact, callback) {
    const tx = dbPos.transaction(['contacts'], 'readwrite');
    const store = tx.objectStore('contacts');
    const request = store.add(contact);
    request.onsuccess = () => callback(true);
    request.onerror = () => callback(false);
}

// جلب كافة الجهات
function dbPosGetAllContacts(callback) {
    const tx = dbPos.transaction(['contacts'], 'readonly');
    tx.objectStore('contacts').getAll().onsuccess = (e) => callback(e.target.result);
}

// دالة تسجيل مشتريات (تزيد المخزون)
function dbPosAddPurchase(purchaseData, callback) {
    const tx = dbPos.transaction(['items'], 'readwrite'); // سنكتفي بتحديث المخزن حالياً
    const itemsStore = tx.objectStore('items');

    purchaseData.items.forEach(pItem => {
        const req = itemsStore.get(pItem.id);
        req.onsuccess = () => {
            const item = req.result;
            if (item) {
                item.stock += parseFloat(pItem.qty); // زيادة المخزون
                itemsStore.put(item);
            }
        };
    });
    tx.oncomplete = () => callback(true);
}

// جلب الفواتير التي لم ترحل بعد
function dbPosGetUnpostedSales(callback) {
    const tx = dbPos.transaction(['sales'], 'readonly');
    const store = tx.objectStore('sales');
    const request = store.getAll();
    request.onsuccess = () => {
        const unposted = request.result.filter(s => !s.isPosted);
        callback(unposted);
    };
}

// تحديث حالة الفاتورة إلى "تم الترحيل"
function dbPosMarkAsPosted(saleId, callback) {
    const tx = dbPos.transaction(['sales'], 'readwrite');
    const store = tx.objectStore('sales');
    const req = store.get(saleId);
    req.onsuccess = () => {
        const sale = req.result;
        sale.isPosted = true;
        store.put(sale);
    };
    tx.oncomplete = () => callback(true);
}

// جلب المشتريات غير المرحلة
function dbPosGetUnpostedPurchases(callback) {
    const tx = dbPos.transaction(['purchases'], 'readonly');
    const store = tx.objectStore('purchases');
    const request = store.getAll();
    request.onsuccess = () => {
        const unposted = request.result.filter(p => !p.isPosted);
        callback(unposted);
    };
}

// وسم المشتريات كمرحلة
function dbPosMarkPurchaseAsPosted(id, callback) {
    const tx = dbPos.transaction(['purchases'], 'readwrite');
    const store = tx.objectStore('purchases');
    const req = store.get(id);
    req.onsuccess = () => {
        const p = req.result;
        p.isPosted = true;
        store.put(p);
    };
    tx.oncomplete = () => callback(true);
}

function dbPosAddPurchaseRecord(purchase, callback) {
    const tx = dbPos.transaction(['purchases', 'items'], 'readwrite');
    const pStore = tx.objectStore('purchases');
    const iStore = tx.objectStore('items');

    pStore.add(purchase);

    // تحديث المخزون الفعلي لكل صنف في الفاتورة
    purchase.items.forEach(pItem => {
        const req = iStore.get(pItem.id);
        req.onsuccess = () => {
            const item = req.result;
            if (item) {
                item.stock += parseFloat(pItem.qty);
                item.cost = parseFloat(pItem.cost); // تحديث سعر التكلفة لآخر شراء
                iStore.put(item);
            }
        };
    });

    tx.oncomplete = () => callback(true);
}
