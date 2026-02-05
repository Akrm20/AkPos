// === Sale.js: سجل المبيعات وإدارة الفواتير ===

function initSalesHistory() {
    const tab2 = document.getElementById('tab2');
    tab2.innerHTML = `
        <div style="padding:10px;">
            <h3 style="color:#2c3e50; border-bottom:2px solid #eee; padding-bottom:10px;">📋 سجل الفواتير</h3>
            
            <div id="sales-summary-cards" style="display:flex; gap:10px; margin-bottom:15px;">
                <div style="flex:1; background:#fff; padding:10px; border-radius:8px; border-right:4px solid #27ae60; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
                    <div style="font-size:10px; color:#7f8c8d;">إجمالي المبيعات</div>
                    <div id="total-sales-amount" style="font-size:14px; font-weight:bold; color:#2c3e50;">0.00</div>
                </div>
                <div style="flex:1; background:#fff; padding:10px; border-radius:8px; border-right:4px solid #3498db; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
                    <div style="font-size:10px; color:#7f8c8d;">عدد الفواتير</div>
                    <div id="sales-count" style="font-size:14px; font-weight:bold; color:#2c3e50;">0</div>
                </div>
            </div>

            <div id="sales-list-container" style="background:white; border-radius:8px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.05);">
                <table style="width:100%; border-collapse:collapse; font-size:11px;">
                    <thead style="background:#f8f9fa;">
                        <tr>
                            <th style="padding:12px; text-align:right;">التاريخ/الرقم</th>
                            <th style="padding:12px; text-align:center;">المبلغ</th>
                            <th style="padding:12px; text-align:center;">الحالة</th>
                            <th style="padding:12px; text-align:center;">تنسيق</th>
                        </tr>
                    </thead>
                    <tbody id="sales-table-body">
                        </tbody>
                </table>
            </div>
        </div>

        <div id="saleDetailModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:10000; align-items:center; justify-content:center;">
            <div style="background:white; width:90%; max-width:400px; border-radius:10px; overflow:hidden;">
                <div style="padding:15px; background:#2c3e50; color:white; display:flex; justify-content:space-between;">
                    <strong>تفاصيل الفاتورة</strong>
                    <button onclick="closeSaleDetail()" style="background:none; border:none; color:white; font-size:18px;">✕</button>
                </div>
                <div id="sale-detail-content" style="padding:20px; max-height:70vh; overflow-y:auto;">
                    </div>
                <div style="padding:15px; background:#f8f9fa; border-top:1px solid #eee; display:flex; gap:10px;">
                    <button onclick="window.print()" style="flex:1; padding:10px; background:#34495e; color:white; border:none; border-radius:5px;">🖨️ طباعة</button>
                    <button onclick="closeSaleDetail()" style="flex:1; padding:10px; background:#ddd; border:none; border-radius:5px;">إغلاق</button>
                </div>
            </div>
        </div>
    `;
    renderSalesList();
}

function renderSalesList() {
    dbPosGetAllSales((sales) => {
        const tbody = document.getElementById('sales-table-body');
        const countEl = document.getElementById('sales-count');
        const totalEl = document.getElementById('total-sales-amount');
        
        let totalSum = 0;
        countEl.innerText = sales.length;

        tbody.innerHTML = sales.map(s => {
            totalSum += s.total;
            const date = new Date(s.date);
            const timeStr = date.toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'});
            const dateStr = date.toLocaleDateString('ar-SA');
            
            // حالة التكامل (هل تم ترحيلها للمحاسبة؟) سنربطها لاحقاً بـ Inti.js
            const statusIcon = s.isPosted ? '✅' : '⏳';

            return `
                <tr style="border-bottom:1px solid #f1f1f1;" onclick="viewSaleDetail(${s.id})">
                    <td style="padding:12px;">
                        <div style="font-weight:bold;">#INV-${s.id}</div>
                        <div style="font-size:9px; color:#999;">${dateStr} | ${timeStr}</div>
                    </td>
                    <td style="padding:12px; text-align:center; font-weight:bold;">${s.total.toFixed(2)}</td>
                    <td style="padding:12px; text-align:center;">${statusIcon}</td>
                    <td style="padding:12px; text-align:center; color:#3498db;">👁️ عرض</td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="4" style="text-align:center; padding:30px; color:#999;">لا توجد مبيعات مسجلة بعد.</td></tr>';
        
        totalEl.innerText = totalSum.toFixed(2);
    });
}

function viewSaleDetail(id) {
    dbPosGetAllSales((sales) => {
        const sale = sales.find(s => s.id === id);
        if (!sale) return;

        const content = document.getElementById('sale-detail-content');
        content.innerHTML = `
            <div style="text-align:center; margin-bottom:15px;">
                <h2 style="margin:0;">فاتورة بيع</h2>
                <small>رقم: ${sale.id}</small>
            </div>
            <div style="border-top:1px dashed #ccc; border-bottom:1px dashed #ccc; padding:10px 0; margin-bottom:15px;">
                ${sale.items.map(item => `
                    <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:5px;">
                        <span>${item.name} (x${item.qty})</span>
                        <span>${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:16px;">
                <span>الإجمالي:</span>
                <span>${sale.total.toFixed(2)} ريال</span>
            </div>
            <div style="margin-top:20px; font-size:10px; color:#7f8c8d; text-align:center;">
                طريقة الدفع: ${sale.paymentMethod === 'cash' ? 'نقداً' : 'شبكة'}<br>
                ${new Date(sale.date).toLocaleString('ar-SA')}
            </div>
        `;
        document.getElementById('saleDetailModal').style.display = 'flex';
    });
}

function closeSaleDetail() {
    document.getElementById('saleDetailModal').style.display = 'none';
}
