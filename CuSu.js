// === CuSu.js: إدارة سريعة للموردين والعملاء ===

/**
 * دالة بناء أزرار الإضافة السريعة في تبويب المخزون
 */
function renderCuSuActionButtons() {
    const container = document.getElementById('inv-sub-content');
    if (!container) return;

    // إضافة الأزرار في أعلى المنطقة الفرعية
    const actionHtml = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
            <button onclick="openAddContactModal('sup')" 
                style="padding: 15px; background: #e67e22; color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 11px; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
                <span style="font-size: 20px; margin-bottom: 5px;">🚛</span>
                إضافة مورد جديد
            </button>
            
            <button onclick="openAddContactModal('cus')" 
                style="padding: 15px; background: #2ecc71; color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 11px; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
                <span style="font-size: 20px; margin-bottom: 5px;">👤</span>
                إضافة عميل جديد
            </button>
        </div>
        
        <div id="contacts-display-list"></div>
    `;

    container.innerHTML = actionHtml;
    refreshContactsList(); // تحديث القائمة فوراً بعد رسم الأزرار
}

/**
 * فتح نافذة الإدخال (Modal) بناءً على النوع
 * @param {string} type - 'sup' للموردين أو 'cus' للعملاء
 */
function openAddContactModal(type) {
    const typeName = (type === 'sup') ? "مورد" : "عميل";
    const color = (type === 'sup') ? "#e67e22" : "#2ecc71";
    
    // استخدام prompt مبدئياً لسرعة التنفيذ أو بناء Modal مخصص
    const name = prompt(`إدخال اسم الـ ${typeName} الجديد:`);
    if (!name || name.trim() === "") return;

    const phone = prompt(`رقم الهاتف (اختياري):`, "");

    const newContact = {
        name: name.trim(),
        type: type, // 'sup' or 'cus'
        phone: phone,
        balance: 0,
        createdAt: new Date().toISOString()
    };

    // استدعاء دالة الحفظ من DbPos.js
    if (typeof dbPosAddContact === 'function') {
        dbPosAddContact(newContact, (success) => {
            if (success) {
                alert(`تم إضافة الـ ${typeName} بنجاح ✅`);
                refreshContactsList();
            }
        });
    } else {
        console.error("دالة dbPosAddContact غير موجودة في DbPos.js");
    }
}

/**
 * تحديث قائمة الأسماء المعروضة تحت الأزرار
 */
function refreshContactsList() {
    const listContainer = document.getElementById('contacts-display-list');
    if (!listContainer || typeof dbPosGetAllContacts !== 'function') return;

    dbPosGetAllContacts((contacts) => {
        if (contacts.length === 0) {
            listContainer.innerHTML = `<p style="text-align:center; color:#999; margin-top:20px; font-size:10px;">لا يوجد موردين أو عملاء مسجلين حالياً.</p>`;
            return;
        }

        listContainer.innerHTML = contacts.map(c => `
            <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border-right: 4px solid ${c.type === 'sup' ? '#e67e22' : '#2ecc71'};">
                <div>
                    <div style="font-weight: bold; font-size: 11px;">${c.name}</div>
                    <div style="font-size: 9px; color: #7f8c8d;">${c.type === 'sup' ? '🚛 مورد' : '👤 عميل'} | ${c.phone || 'بدون هاتف'}</div>
                </div>
                <div style="text-align: left;">
                    <div style="font-size: 8px; color: #999;">الرصيد الحسابي</div>
                    <div style="font-weight: bold; font-size: 11px;">${parseFloat(c.balance || 0).toFixed(2)}</div>
                </div>
            </div>
        `).join('');
    });
}