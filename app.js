// ===== DATA =====
const products = [
  { code:'SKU-001', name:'รอก Shimano Sienna 2500',   cat:'รอก',  cost:800,  price:1290, qty:14 },
  { code:'SKU-002', name:'คันตกปลา Okuma 6ft',        cat:'คัน',  cost:900,  price:1500, qty:45 },
  { code:'SKU-003', name:'สายเอ็น 0.4mm (500m)',      cat:'สาย',  cost:180,  price:290,  qty:8  },
  { code:'SKU-004', name:'เบ็ดตกปลา #6 (แพ็ค 100)',  cat:'เบ็ด', cost:60,   price:100,  qty:2  },
  { code:'SKU-005', name:'เหยื่อปลอม ชุดสีแดง',       cat:'เหยื่อ',cost:350, price:590,  qty:5  },
  { code:'SKU-006', name:'ลูกลอยโฟม (ชุด 10)',         cat:'อื่นๆ',cost:40,  price:90,   qty:32 },
  { code:'SKU-007', name:'ตะขอสามง่าม #4 (แพ็ค 20)',  cat:'เบ็ด', cost:30,   price:60,   qty:55 },
  { code:'SKU-008', name:'เหยื่อหนอน (แพ็ค 50)',      cat:'เหยื่อ',cost:100, price:180,  qty:20 },
  { code:'SKU-009', name:'รอก Penn Battle III 3000',   cat:'รอก',  cost:1800, price:2990, qty:7  },
  { code:'SKU-010', name:'กระป๋องเก็บเหยื่อสด',        cat:'อื่นๆ',cost:120, price:220,  qty:18 },
  { code:'SKU-011', name:'สายเอ็น 0.6mm (500m)',       cat:'สาย',  cost:200,  price:320,  qty:15 },
  { code:'SKU-012', name:'คันตกปลา Penn Pursuit 7ft',  cat:'คัน',  cost:1200, price:2100, qty:11 },
];

const posItems = [
  { icon:'🎣', name:'รอก Shimano 2500',    price:1290 },
  { icon:'🪝', name:'คันตกปลา Okuma 6ft', price:1500 },
  { icon:'🧵', name:'สายเอ็น 0.4mm',      price:290  },
  { icon:'🪝', name:'เบ็ด #6 (แพ็ค)',      price:100  },
  { icon:'🐟', name:'เหยื่อปลอม (แดง)',    price:590  },
  { icon:'⭕', name:'ลูกลอยโฟม (ชุด)',     price:90   },
  { icon:'🐛', name:'เหยื่อหนอน (แพ็ค)',  price:180  },
  { icon:'🎣', name:'รอก Penn Battle 3000', price:2990 },
  { icon:'🧰', name:'กระป๋องเก็บเหยื่อ',  price:220  },
];

let cart = [];
let filteredProducts = [...products];

// ===== NAVIGATION =====
const pageTitles = {
  dashboard: 'แดชบอร์ด',
  products:  'จัดการสินค้า',
  stock:     'รับ/จ่ายสินค้า',
  sales:     'บันทึกการขาย',
  reports:   'รายงานสรุป',
  suppliers: 'ซัพพลายเออร์',
  settings:  'ตั้งค่าระบบ',
};

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    const page = item.dataset.page;
    navigateTo(page);
    // close sidebar on mobile
    if (window.innerWidth <= 700) document.getElementById('sidebar').classList.remove('open');
  });
});

function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + page));
  document.getElementById('pageTitle').textContent = pageTitles[page] || page;
}

document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ===== DATE =====
const d = new Date();
document.getElementById('currentDate').textContent =
  d.toLocaleDateString('th-TH', { weekday:'short', year:'numeric', month:'short', day:'numeric' });

// ===== PRODUCTS TABLE =====
function renderProducts() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const cat    = document.getElementById('categoryFilter')?.value || '';
  filteredProducts = products.filter(p =>
    (p.name.toLowerCase().includes(search) || p.code.toLowerCase().includes(search)) &&
    (cat === '' || p.cat === cat)
  );

  const tbody = document.getElementById('productBody');
  tbody.innerHTML = filteredProducts.map((p, i) => `
    <tr>
      <td><span style="font-family:monospace;font-size:12px;color:var(--text-muted)">${p.code}</span></td>
      <td><strong>${p.name}</strong></td>
      <td><span class="tag tag-in">${p.cat}</span></td>
      <td>฿${p.cost.toLocaleString()}</td>
      <td>฿${p.price.toLocaleString()}</td>
      <td class="${p.qty <= 5 ? 'qty-low' : 'qty-ok'}">${p.qty} ${p.qty <= 5 ? '⚠️' : ''}</td>
      <td>${p.qty === 0 ? '<span class="status status-pending">หมดสต็อก</span>' : '<span class="status status-done">มีสินค้า</span>'}</td>
      <td>
        <div class="tbl-actions">
          <button class="btn-edit" onclick="editProduct(${i})">✏️ แก้ไข</button>
          <button class="btn-del"  onclick="deleteProduct(${i})">🗑️ ลบ</button>
        </div>
      </td>
    </tr>
  `).join('');

  const count = document.getElementById('productCount');
  if (count) count.textContent = `แสดง ${filteredProducts.length} จาก ${products.length} รายการ`;
}

document.getElementById('searchInput')?.addEventListener('input', renderProducts);
document.getElementById('categoryFilter')?.addEventListener('change', renderProducts);

function editProduct(i) { showToast(`✏️ แก้ไขสินค้า: ${products[i].name}`); }
function deleteProduct(i) {
  if (confirm(`ลบสินค้า "${products[i].name}" ออกจากระบบ?`)) {
    products.splice(i, 1);
    renderProducts();
    showToast('🗑️ ลบสินค้าเรียบร้อย');
  }
}

function addProduct(e) {
  e.preventDefault();
  const name  = document.getElementById('newName').value.trim();
  const code  = document.getElementById('newCode').value.trim() || `SKU-${String(products.length+1).padStart(3,'0')}`;
  const cat   = document.getElementById('newCategory').value;
  const qty   = parseInt(document.getElementById('newQty').value) || 0;
  const cost  = parseFloat(document.getElementById('newCost').value) || 0;
  const price = parseFloat(document.getElementById('newPrice').value) || 0;
  products.push({ code, name, cat, cost, price, qty });
  renderProducts();
  closeModal('addProductModal');
  showToast('✅ เพิ่มสินค้าเรียบร้อย');
  e.target.reset();
}

// ===== STOCK FORM =====
function submitStock(e, type) {
  e.preventDefault();
  const label = type === 'in' ? '📥 รับสินค้าเข้าเรียบร้อย' : '📤 จ่ายสินค้าออกเรียบร้อย';
  showToast(label);
  e.target.reset();
}

// ===== POS =====
function renderPOS(items) {
  const grid = document.getElementById('posGrid');
  grid.innerHTML = items.map((p, i) => `
    <div class="pos-item" onclick="addToCart(${i})">
      <div class="pos-item-icon">${p.icon}</div>
      <div class="pos-item-name">${p.name}</div>
      <div class="pos-item-price">฿${p.price.toLocaleString()}</div>
    </div>
  `).join('');
}

function posFilter(q) {
  const filtered = q ? posItems.filter(p => p.name.toLowerCase().includes(q.toLowerCase())) : posItems;
  renderPOS(filtered);
}

function addToCart(i) {
  const item = posItems[i];
  const found = cart.find(c => c.name === item.name);
  if (found) found.qty++;
  else cart.push({ ...item, qty: 1 });
  renderCart();
  showToast(`🛒 เพิ่ม ${item.name}`);
}

function renderCart() {
  const list = document.getElementById('cartList');
  if (cart.length === 0) {
    list.innerHTML = '<div class="cart-empty">ยังไม่มีสินค้าในตะกร้า</div>';
    updateTotal();
    return;
  }
  list.innerHTML = cart.map((c, i) => `
    <div class="cart-row">
      <div class="cart-name">${c.icon} ${c.name}</div>
      <div class="cart-qty">
        <button class="qty-btn" onclick="changeQty(${i},-1)">−</button>
        <span class="qty-num">${c.qty}</span>
        <button class="qty-btn" onclick="changeQty(${i},1)">+</button>
      </div>
      <div class="cart-subtotal">฿${(c.price * c.qty).toLocaleString()}</div>
      <button class="cart-remove" onclick="removeFromCart(${i})">✕</button>
    </div>
  `).join('');
  updateTotal();
}

function changeQty(i, delta) {
  cart[i].qty += delta;
  if (cart[i].qty <= 0) cart.splice(i, 1);
  renderCart();
}

function removeFromCart(i) {
  cart.splice(i, 1);
  renderCart();
}

function updateTotal() {
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const disc  = parseFloat(document.getElementById('discount')?.value) || 0;
  const net   = Math.max(0, total - disc);
  const t = document.getElementById('cartTotal');
  const n = document.getElementById('cartNet');
  if (t) t.textContent = `฿${total.toLocaleString()}`;
  if (n) n.textContent = `฿${net.toLocaleString()}`;
}

function checkout() {
  if (cart.length === 0) { showToast('⚠️ กรุณาเพิ่มสินค้าก่อนชำระเงิน'); return; }
  const net = document.getElementById('cartNet')?.textContent || '฿0';
  cart = [];
  renderCart();
  if (document.getElementById('discount')) document.getElementById('discount').value = '';
  showToast(`✅ ชำระเงินสำเร็จ ${net}`);
}

// ===== CHART (lightweight, no library) =====
function drawChart() {
  const canvas = document.getElementById('salesChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const data = [8200, 11500, 9800, 14300, 10200, 15600, 12850];
  const labels = ['9 พ.ค.','10 พ.ค.','11 พ.ค.','12 พ.ค.','13 พ.ค.','14 พ.ค.','15 พ.ค.'];
  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  canvas.width = w * devicePixelRatio;
  canvas.height = h * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const pad = { top: 20, right: 20, bottom: 36, left: 52 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;
  const max = Math.max(...data) * 1.15;
  const step = cw / (data.length - 1);

  // gridlines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + ch - (ch / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cw, y); ctx.stroke();
    ctx.fillStyle = '#94a3b8'; ctx.font = '11px Segoe UI';
    ctx.textAlign = 'right';
    ctx.fillText(`฿${Math.round((max / 4 * i) / 1000)}K`, pad.left - 6, y + 4);
  }

  // area gradient
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
  grad.addColorStop(0, 'rgba(3,105,161,.25)');
  grad.addColorStop(1, 'rgba(3,105,161,.02)');

  const pts = data.map((v, i) => ({
    x: pad.left + i * step,
    y: pad.top + ch - (v / max) * ch
  }));

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const cp1x = pts[i-1].x + step * .45, cp1y = pts[i-1].y;
    const cp2x = pts[i].x   - step * .45, cp2y = pts[i].y;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, pts[i].x, pts[i].y);
  }
  ctx.lineTo(pts[pts.length-1].x, pad.top + ch);
  ctx.lineTo(pts[0].x, pad.top + ch);
  ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  // line
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const cp1x = pts[i-1].x + step * .45, cp1y = pts[i-1].y;
    const cp2x = pts[i].x   - step * .45, cp2y = pts[i].y;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, pts[i].x, pts[i].y);
  }
  ctx.strokeStyle = '#0369a1'; ctx.lineWidth = 2.5;
  ctx.stroke();

  // dots + labels
  pts.forEach((pt, i) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0369a1'; ctx.lineWidth = 2.5;
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#475569'; ctx.font = '11px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], pt.x, pad.top + ch + 22);
  });
}

// ===== MODAL =====
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

// ===== TOAST =====
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ===== INIT =====
renderProducts();
renderPOS(posItems);
setTimeout(drawChart, 100);

// Redraw chart on resize
window.addEventListener('resize', () => setTimeout(drawChart, 50));
