// === pos.js: واجهة نقطة البيع التفاعلية ===

let cart = []; // سلة التسوق الحالية

function initPos() {
    const tab1 = document.getElementById('tab1');
    tab1.innerHTML = `
        <style>
            .pos-container { display: flex; height: calc(100vh - 100px); gap: 10px; padding: 5px; }
            .items-section { flex: 2; display: flex; flex-direction: column; }
            .cart-section { flex: 1.2; background: white; border-radius: 8px; display: flex; flex-direction: column; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .category-bar { display: flex; gap: 5px; overflow-x: auto; padding: 5px 0; white-space: nowrap; }
            .cat-btn { padding: 8px 15px; background: #ecf0f1; border: none; border-radius: 20px; font-size: 10px; cursor: pointer; }
            .cat-btn.active { background: #2c3e50; color: white; }
            .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; overflow-y: auto; padding: 5px; }
            .item-card { background: white; border: 1px solid #eee; border-radius: 8px; padding: 10px; text-align: center; cursor: pointer; transition: transform 0.1s; }
            .item-card:active { transform: scale(0.95); background: #f9f9f9; }
            .cart-items { flex-grow: 1; overflow-y: auto; padding: 10px; }
            .cart-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f5f5f5; padding: 8px 0; font-size: 11px; }
            .pay-btn { background: #27ae60; color: white; border: none; padding: 15px; font-weight: bold; font-size: 14px; cursor: pointer; border-radius: 0 0 8px 8px; }
        </style>

        <div class="pos-container">
            <div class="items-section">
                <input type="text" id="posSearch" placeholder="🔍 بحث سريع..." onkeyup="loadPosItems()" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:5px; margin-bottom:5px;">
                <div id="posCategories" class="category-bar"></div>
                <div id="posItemsGrid" class="items-grid"></div>
            </div>

            <div class="cart-section">
                <div style="padding:10px; background:#34495e; color:white; border-radius:8px 8px 0 0; text-align:center; font-weight:bold;">السلة الحالية</div>
                <div id="cartItems" class="cart-items">
                    <p style="text-align:center; color:#999; margin-top:50px;">السلة فارغة</p>
                </div>
                <div style="padding:15px; background:#f8f9fa; border-top:1px solid #ddd;">
                    <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:15px;">
                        <span>الإجمالي:</span>
                        <span id="cartTotal">0.00</span>
                    </div>
                </div>
                <button class="pay-btn" onclick="checkout()">إتمام البيع (كاش) ✅</button>
            </div>
        </div>
    `;
    loadPosCategories();
    loadPosItems();
}

// تحميل الفئات للفلترة السريعة
function loadPosCategories() {
    dbPosGetAllCategories((cats) => {
        const container = document.getElementById('posCategories');
        let html = `<button class="cat-btn active" onclick="filterPosByCategory('')">الكل</button>`;
        cats.forEach(c => {
            html += `<button class="cat-btn" onclick="filterPosByCategory('${c.name}')">${c.name}</button>`;
        });
        container.innerHTML = html;
    });
}

// عرض الأصناف ككروت
function loadPosItems(filterCat = "") {
    const searchQuery = document.getElementById('posSearch').value.toLowerCase();
    dbPosGetAllItems((items) => {
        const grid = document.getElementById('posItemsGrid');
        const filtered = items.filter(it => 
            (filterCat === "" || it.category === filterCat) &&
            (it.name.toLowerCase().includes(searchQuery) || (it.barcode && it.barcode.includes(searchQuery)))
        );

        grid.innerHTML = filtered.map(it => `
            <div class="item-card" onclick="addToCart(${it.id})">
                <div style="font-weight:bold; font-size:11px; height:30px; overflow:hidden;">${it.name}</div>
                <div style="color:#27ae60; font-weight:bold; margin-top:5px;">${it.price.toFixed(2)}</div>
                <div style="font-size:9px; color:#999;">مخزون: ${it.stock}</div>
            </div>
        `).join('');
    });
}

function filterPosByCategory(cat) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    loadPosItems(cat);
}

// إدارة السلة
function addToCart(itemId) {
    dbPosGetAllItems((items) => {
        const item = items.find(it => it.id === itemId);
        if (!item || item.stock <= 0) return alert("هذا الصنف غير متوفر في المخزن!");

        const cartItem = cart.find(i => i.id === itemId);
        if (cartItem) {
            if (cartItem.qty < item.stock) cartItem.qty++;
            else alert("وصلت للحد الأقصى للمخزون!");
        } else {
            cart.push({ ...item, qty: 1 });
        }
        renderCart();
    });
}

function renderCart() {
    const container = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#999; margin-top:50px;">السلة فارغة</p>`;
        totalEl.innerText = "0.00";
        return;
    }

    let total = 0;
    container.innerHTML = cart.map((it, index) => {
        total += it.price * it.qty;
        return `
            <div class="cart-row">
                <div style="flex:2;">${it.name}</div>
                <div style="flex:1; text-align:center;">
                    <button onclick="updateQty(${index}, -1)" style="border:none; background:#eee; width:20px;">-</button>
                    <span>${it.qty}</span>
                    <button onclick="updateQty(${index}, 1)" style="border:none; background:#eee; width:20px;">+</button>
                </div>
                <div style="flex:1; text-align:left; font-weight:bold;">${(it.price * it.qty).toFixed(2)}</div>
            </div>
        `;
    }).join('');
    
    totalEl.innerText = total.toFixed(2);
}

function updateQty(index, change) {
    cart[index].qty += change;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    renderCart();
}

// عملية الدفع وحفظ الفاتورة
function checkout() {
    if (cart.length === 0) return alert("السلة فارغة!");

    const saleData = {
        date: new Date().toISOString(),
        items: cart,
        total: parseFloat(document.getElementById('cartTotal').innerText),
        paymentMethod: 'cash'
    };

    dbPosAddSale(saleData, (success) => {
        if (success) {
            alert("تمت عملية البيع بنجاح!");
            cart = [];
            renderCart();
            loadPosItems(); // لتحديث كميات المخزن المعروضة
        }
    });
}
