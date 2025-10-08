// Simple admin client-side prototype using localStorage
(function(){
  // Allow admin access if user logged in via main site with role 'admin' or via legacy kol_admin_auth
  const auth = JSON.parse(localStorage.getItem('kol_admin_auth')||'null');
  const userRole = localStorage.getItem('tcv_user_role');
  if (!auth && userRole !== 'admin') {
    // if not admin, redirect to main login
    location.href = 'index.html#login';
  }

  const el = id => document.getElementById(id);
  const main = el('adminContent');
  const gotoUsers = el('gotoUsers');
  const gotoCategories = el('gotoCategories');
  const gotoDisputes = el('gotoDisputes');
  const adminLogout = el('adminLogout');

  const seedIfEmpty = (key, sample) => {
    const cur = JSON.parse(localStorage.getItem(key)||'null');
    if (!cur) localStorage.setItem(key, JSON.stringify(sample));
  };

  seedIfEmpty('tcv_users', [
    { id: 'b1', role: 'brand', email: 'brand@ravi.vn', name: 'RAVI', locked:false },
    { id: 'k1', role: 'koc', email: 'koc1@kol.local', name: 'KOC A', locked:false }
  ]);
  seedIfEmpty('tcv_categories', ['marketing','sales','it']);
  seedIfEmpty('tcv_packages', [{ id:'p1', name:'Basic', price:100 }, { id:'p2', name:'Pro', price:300 }]);
  seedIfEmpty('tcv_bookings', [ {id:'bk1', amount:150, status:'success', date: Date.now()-86400000 }, {id:'bk2', amount:250, status:'pending', date: Date.now()} ]);

  const renderUsers = () => {
    const users = JSON.parse(localStorage.getItem('tcv_users')||'[]');
    main.innerHTML = `
      <h6>Quản lý người dùng</h6>
      <div class=\"mb-2 d-flex gap-2\"> <button id=\"btnAddUser\" class=\"btn btn-sm btn-primary\">Thêm</button> <button id=\"btnRefresh\" class=\"btn btn-sm btn-outline-secondary\">Làm mới</button></div>
      <table class=\"table table-striped\"><thead><tr><th>Email</th><th>Tên</th><th>Vai trò</th><th>Khóa</th><th>Hành động</th></tr></thead><tbody>
      ${users.map(u => `<tr><td>${u.email}</td><td>${u.name||''}</td><td>${u.role}</td><td>${u.locked?'<span class=\\"text-danger\\">Yes</span>':'No'}</td><td><button class=\\"btn btn-sm btn-outline-primary btn-edit\\" data-id=\\"${u.id}\\">Sửa</button> <button class=\\"btn btn-sm btn-outline-danger btn-del\\" data-id=\\"${u.id}\\">Xóa</button> <button class=\\"btn btn-sm btn-outline-secondary btn-lock\\" data-id=\\"${u.id}\\">Khóa/ Mở</button></td></tr>`).join('')}
      </tbody></table>`;
    document.getElementById('btnAddUser').addEventListener('click', showAddUser);
    document.querySelectorAll('.btn-edit').forEach(b=>b.addEventListener('click', e=>showEditUser(b.getAttribute('data-id'))));
    document.querySelectorAll('.btn-del').forEach(b=>b.addEventListener('click', e=>{ if(confirm('Xóa tài khoản?')){ deleteUser(b.getAttribute('data-id')); renderUsers(); }}));
    document.querySelectorAll('.btn-lock').forEach(b=>b.addEventListener('click', e=>{ toggleLock(b.getAttribute('data-id')); renderUsers(); }));
  };

  const showAddUser = () => {
    main.innerHTML = `
      <h6>Thêm người dùng</h6>
      <form id=\"frmUser\"><div class=\"mb-2\"><label>Email</label><input required id=\"uEmail\" class=\"form-control\"></div>
      <div class=\"mb-2\"><label>Tên</label><input id=\"uName\" class=\"form-control\"></div>
      <div class=\"mb-2\"><label>Vai trò</label><select id=\"uRole\" class=\"form-select\"><option value=\"brand\">Brand</option><option value=\"koc\">KOC/KOL</option></select></div>
      <div class=\"d-grid\"><button class=\"btn btn-primary\">Lưu</button></div></form>`;
    document.getElementById('frmUser').addEventListener('submit', (e)=>{ e.preventDefault(); addUser(); });
  };

  const addUser = () => {
    const email = document.getElementById('uEmail').value.trim();
    const name = document.getElementById('uName').value.trim();
    const role = document.getElementById('uRole').value;
    const users = JSON.parse(localStorage.getItem('tcv_users')||'[]');
    const id = 'u'+Date.now();
    users.push({ id, email, name, role, locked:false });
    localStorage.setItem('tcv_users', JSON.stringify(users));
    renderUsers();
  };

  const showEditUser = (id) => {
    const users = JSON.parse(localStorage.getItem('tcv_users')||'[]');
    const u = users.find(x=>x.id===id);
    if (!u) return alert('Không tìm thấy');
    main.innerHTML = `
      <h6>Sửa người dùng</h6>
      <form id=\"frmUserEdit\"> <div class=\"mb-2\"><label>Email</label><input id=\"uEmail\" class=\"form-control\" value=\"${u.email}\" disabled></div>
      <div class=\"mb-2\"><label>Tên</label><input id=\"uName\" class=\"form-control\" value=\"${u.name||''}\"></div>
      <div class=\"mb-2\"><label>Vai trò</label><select id=\"uRole\" class=\"form-select\"><option value=\"brand\" ${u.role==='brand'?'selected':''}>Brand</option><option value=\"koc\" ${u.role==='koc'?'selected':''}>KOC/KOL</option></select></div>
      <div class=\"d-grid\"><button class=\"btn btn-primary\">Lưu</button></div></form>`;
    document.getElementById('frmUserEdit').addEventListener('submit', (e)=>{ e.preventDefault(); saveEditUser(id); });
  };

  const saveEditUser = (id) => {
    const users = JSON.parse(localStorage.getItem('tcv_users')||'[]');
    const u = users.find(x=>x.id===id);
    if (!u) return;
    u.name = document.getElementById('uName').value.trim();
    u.role = document.getElementById('uRole').value;
    localStorage.setItem('tcv_users', JSON.stringify(users));
    renderUsers();
  };

  const deleteUser = (id) => {
    const users = JSON.parse(localStorage.getItem('tcv_users')||'[]');
    localStorage.setItem('tcv_users', JSON.stringify(users.filter(x=>x.id!==id)));
  };

  const toggleLock = (id) => {
    const users = JSON.parse(localStorage.getItem('tcv_users')||'[]');
    const u = users.find(x=>x.id===id);
    if (!u) return;
    u.locked = !u.locked;
    localStorage.setItem('tcv_users', JSON.stringify(users));
  };

  const renderCategories = () => {
    const cats = JSON.parse(localStorage.getItem('tcv_categories')||'[]');
    main.innerHTML = `
      <h6>Danh mục ngành hàng</h6>
      <div class=\"mb-2\"><button id=\"btnAddCat\" class=\"btn btn-sm btn-primary\">Thêm</button></div>
      <ul class=\"list-group\">${cats.map(c=>`<li class=\\"list-group-item d-flex justify-content-between\\">${c}<span><button class=\\"btn btn-sm btn-outline-danger btn-del-cat\\" data-cat=\\"${c}\\">Xóa</button></span></li>`).join('')}</ul>`;
    document.getElementById('btnAddCat').addEventListener('click', ()=>{
      const v = prompt('Tên danh mục mới'); if(!v) return; cats.push(v); localStorage.setItem('tcv_categories', JSON.stringify(cats)); renderCategories();
    });
    document.querySelectorAll('.btn-del-cat').forEach(b=>b.addEventListener('click', ()=>{ const c=b.getAttribute('data-cat'); if(confirm('Xóa?')){ const s = cats.filter(x=>x!==c); localStorage.setItem('tcv_categories', JSON.stringify(s)); renderCategories(); } }));
  };

  const renderPackages = () => {
    const packs = JSON.parse(localStorage.getItem('tcv_packages')||'[]');
    main.innerHTML = `
      <h6>Gói dịch vụ</h6>
      <div class=\"mb-2 d-flex gap-2\"><button id=\"btnAddPack\" class=\"btn btn-sm btn-primary\">Thêm</button><button id=\"btnRefreshP\" class=\"btn btn-sm btn-outline-secondary\">Làm mới</button></div>
      <table class=\"table\"><thead><tr><th>Tên</th><th>Giá</th><th>Hành động</th></tr></thead><tbody>${packs.map(p=>`<tr><td>${p.name}</td><td>${p.price}</td><td><button class=\\"btn btn-sm btn-del-pack\\" data-id=\\"${p.id}\\">Xóa</button></td></tr>`).join('')}</tbody></table>`;
    document.getElementById('btnAddPack').addEventListener('click', ()=>{ const name = prompt('Tên gói'); const price = prompt('Giá'); if(!name) return; packs.push({ id:'p'+Date.now(), name, price: Number(price)||0}); localStorage.setItem('tcv_packages', JSON.stringify(packs)); renderPackages(); });
    document.querySelectorAll('.btn-del-pack').forEach(b=>b.addEventListener('click', ()=>{ if(confirm('Xóa gói?')){ const id=b.getAttribute('data-id'); localStorage.setItem('tcv_packages', JSON.stringify(packs.filter(x=>x.id!==id))); renderPackages(); }}));
  };

  gotoUsers.addEventListener('click', renderUsers);
  gotoCategories.addEventListener('click', ()=>{ renderCategories(); });
  gotoDisputes.addEventListener('click', ()=>{ main.innerHTML = '<h6>Khiếu nại & Tranh chấp</h6><p class="small text-muted">Danh sách tranh chấp (demo).</p>'; });

  adminLogout.addEventListener('click', ()=>{ localStorage.removeItem('kol_admin_auth'); location.href='index.html'; });

  // stats
  const bookings = JSON.parse(localStorage.getItem('tcv_bookings')||'[]');
  el('statBookings').textContent = bookings.length;
  const avg = bookings.length ? Math.round(bookings.reduce((s,b)=>s+(b.amount||0),0)/bookings.length) : 0;
  el('statAvg').textContent = avg;
  const successRate = bookings.length ? Math.round(100 * bookings.filter(b=>b.status==='success').length / bookings.length) : 0;
  el('statSuccess').textContent = successRate + '%';

})();
