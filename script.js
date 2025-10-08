const STORAGE_KEYS = {
  userEmail: 'tcv_user_email',
  cvData: 'tcv_cv',
  userRole: 'tcv_user_role',
  userName: 'tcv_user_name',
  cvPdfMap: 'tcv_cv_pdf_map'
};

const select = (selector) => document.querySelector(selector);
const on = (el, event, handler) => el && el.addEventListener(event, handler);

const setYear = () => {
  const y = select('#year');
  if (y) y.textContent = new Date().getFullYear();
};

const showToast = (message, type = 'success') => {
  const existing = document.querySelector('.toast-container');
  const container = existing || document.createElement('div');
  if (!existing) {
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(container);
  }
  const id = `t-${Date.now()}`;
  const bg = type === 'success' ? 'text-bg-success' : type === 'error' ? 'text-bg-danger' : 'text-bg-primary';
  container.insertAdjacentHTML('beforeend', `
    <div id="${id}" class="toast align-items-center ${bg} border-0 mb-2" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `);
  const toastEl = document.getElementById(id);
  const toast = new bootstrap.Toast(toastEl, { delay: 2500 });
  toast.show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
};

const getEmailName = (email) => {
  if (!email) return '';
  const namePart = email.split('@')[0] || '';
  if (!namePart) return email;
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
};

const validateRequired = (inputs) => {
  let ok = true;
  inputs.forEach((input) => {
    const value = (input.value || '').trim();
    if (!value) {
      input.classList.add('is-invalid');
      ok = false;
    } else {
      input.classList.remove('is-invalid');
    }
  });
  return ok;
};

const persist = {
  setEmail(email) {
    localStorage.setItem(STORAGE_KEYS.userEmail, email);
  },
  setUserInfo({ email, role, name }) {
    if (email) localStorage.setItem(STORAGE_KEYS.userEmail, email);
    if (role) localStorage.setItem(STORAGE_KEYS.userRole, role);
    if (name) localStorage.setItem(STORAGE_KEYS.userName, name);
  },
  getEmail() {
    return localStorage.getItem(STORAGE_KEYS.userEmail);
  },
  getRole() {
    return localStorage.getItem(STORAGE_KEYS.userRole);
  },
  getName() {
    return localStorage.getItem(STORAGE_KEYS.userName);
  },
  clearAll() {
    localStorage.removeItem(STORAGE_KEYS.userEmail);
    localStorage.removeItem(STORAGE_KEYS.cvData);
    localStorage.removeItem(STORAGE_KEYS.userRole);
    localStorage.removeItem(STORAGE_KEYS.userName);
  },
  saveCv(data) {
    localStorage.setItem(STORAGE_KEYS.cvData, JSON.stringify(data));
  },
  loadCv() {
    const raw = localStorage.getItem(STORAGE_KEYS.cvData);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  saveUserPdf(email, base64) {
    try {
      const map = JSON.parse(localStorage.getItem(STORAGE_KEYS.cvPdfMap) || '{}');
      map[email] = base64;
      localStorage.setItem(STORAGE_KEYS.cvPdfMap, JSON.stringify(map));
    } catch {}
  },
  loadUserPdf(email) {
    try {
      const map = JSON.parse(localStorage.getItem(STORAGE_KEYS.cvPdfMap) || '{}');
      return map[email] || null;
    } catch {
      return null;
    }
  },
  removeUserPdf(email) {
    try {
      const map = JSON.parse(localStorage.getItem(STORAGE_KEYS.cvPdfMap) || '{}');
      delete map[email];
      localStorage.setItem(STORAGE_KEYS.cvPdfMap, JSON.stringify(map));
    } catch {}
  }
};

const renderCvPreview = (target, data) => {
  if (!target) return;
  if (!data) {
    target.innerHTML = `<div class="text-secondary">Chưa có dữ liệu. Hãy điền form và bấm "Lưu CV".</div>`;
    return;
  }
  const skillsItems = (data.skills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `<li>${s}</li>`) 
    .join('');

  const expLines = (data.experience || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `<li>${l}</li>`)
    .join('');

  target.innerHTML = `
    <div class="border rounded-4 p-3 p-md-4">
      <div class="d-flex align-items-center mb-2">
        <div class="flex-grow-1">
          <div class="cv-name">${data.fullName || '—'}</div>
          <div class="cv-position">${data.position || ''}</div>
        </div>
        <span class="badge bg-light text-dark border">CV</span>
      </div>
      <div>
        <div class="cv-section-title">Kỹ năng</div>
        ${skillsItems ? `<ul class="cv-list">${skillsItems}</ul>` : `<div class="text-secondary">Chưa cập nhật</div>`}
      </div>
      <div>
        <div class="cv-section-title">Kinh nghiệm</div>
        ${expLines ? `<ul class="cv-list">${expLines}</ul>` : `<div class="text-secondary">Chưa cập nhật</div>`}
      </div>
    </div>
  `;
};

// ===== Job Detail Rendering =====
const getQueryParam = (key) => new URLSearchParams(window.location.search).get(key);

const DEFAULT_JOBS = [
  {
    id: 'rv-sales-001',
    title: '[Nam] Nhân viên Kinh doanh khối KH Khu Công Nghiệp Nhật Bản',
    company: 'Công ty RAVI',
    location: 'Hà Nội',
    salary: 'Up to 15 triệu + thưởng nóng',
    type: 'Toàn thời gian',
    postedAt: '3 ngày trước',
    description: [
      'Tìm kiếm, mở rộng tệp khách hàng khu công nghiệp Nhật Bản.',
      'Tư vấn giải pháp, đàm phán ký kết hợp đồng.',
      'Quản lý pipeline, theo dõi công nợ và chăm sóc sau bán.'
    ],
    requirements: [
      'Nam, tốt nghiệp CĐ/ĐH, ưu tiên biết tiếng Nhật/N2 trở lên.',
      'Kinh nghiệm sales B2B 1 năm+, ưu tiên ngành công nghiệp.',
      'Giao tiếp tốt, chịu được áp lực, sẵn sàng di chuyển.'
    ],
    benefits: [
      'Lương cứng + % hoa hồng + thưởng nóng theo doanh số.',
      'BHXH, nghỉ phép, lộ trình thăng tiến rõ ràng.',
      'Đào tạo kỹ năng sales, phụ cấp điện thoại/đi lại.'
    ],
    contact: { name: 'Phòng Nhân sự', email: 'hr@ravi.vn', phone: '024-1234-5678' }
  },
  {
    id: 'hz-sale-002',
    title: 'Nhân viên Sale/Trực Page',
    company: 'HAZALY',
    location: 'Hồ Chí Minh',
    salary: '7 - 12 triệu + KPI',
    type: 'Toàn thời gian',
    postedAt: 'Hôm nay',
    description: ['Tư vấn khách hàng qua inbox, chốt đơn, chăm sóc sau bán.'],
    requirements: ['Có kinh nghiệm trực page là lợi thế.'],
    benefits: ['Lương cơ bản + thưởng KPI, môi trường năng động.']
  }
];

const fetchJobs = async () => {
  try {
    const res = await fetch('data/jobs.json', { cache: 'no-store' });
    if (!res.ok) return DEFAULT_JOBS;
    const data = await res.json();
    const localJobs = JSON.parse(localStorage.getItem('tcv_jobs_local') || '[]');
    const base = Array.isArray(data) && data.length ? data : DEFAULT_JOBS;
    return [...localJobs, ...base];
  } catch {
    const localJobs = JSON.parse(localStorage.getItem('tcv_jobs_local') || '[]');
    return [...localJobs, ...DEFAULT_JOBS];
  }
};

// Load users.json and return a map by email for quick lookup
const loadUsersMap = async () => {
  try {
    const res = await fetch('data/users.json', { cache: 'no-store' });
    if (!res.ok) return {};
    const d = await res.json();
    const map = {};
    (d.seekers || []).forEach(u => { if (u.email) map[u.email] = u; });
    (d.posters || []).forEach(u => { if (u.email) map[u.email] = u; });
    (d.admin || []).forEach(u => { if (u.email) map[u.email] = u; });
    return map;
  } catch (e) {
    return {};
  }
};

const renderDetailPage = async () => {
  const jobId = getQueryParam('id');
  const jobs = await fetchJobs();
  let job = jobs.find(j => j.id === jobId);
  // Try per-job JSON override if available
  try {
    const overrideRes = await fetch(`data/job-detail/${jobId}.json`, { cache: 'no-store' });
    if (overrideRes.ok) {
      const override = await overrideRes.json();
      job = { ...job, ...override } || override;
    }
  } catch {}
  if (!job) job = jobs[0];
  if (!job) return;

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '—';
  };

  setText('jobTitle', job.title);
  setText('jobCompany', job.company);
  setText('jobSalary', job.salary);
  setText('jobLocation', job.location);
  setText('jobType', job.type);
  setText('jobPosted', job.postedAt);

  const ulDesc = document.getElementById('jobDescription');
  const ulReq = document.getElementById('jobRequirements');
  const ulBen = document.getElementById('jobBenefits');
  const related = document.getElementById('relatedJobs');

  if (ulDesc && Array.isArray(job.description)) {
    ulDesc.innerHTML = job.description.map(i => `<li>${i}</li>`).join('');
  }
  if (ulReq && Array.isArray(job.requirements)) {
    ulReq.innerHTML = job.requirements.map(i => `<li>${i}</li>`).join('');
  }
  if (ulBen && Array.isArray(job.benefits)) {
    ulBen.innerHTML = job.benefits.map(i => `<li>${i}</li>`).join('');
  }

  // contact
  if (job.contact) {
    const c = job.contact;
    const contactName = document.getElementById('contactName');
    const contactEmail = document.getElementById('contactEmail');
    const contactPhone = document.getElementById('contactPhone');
    if (contactName) contactName.textContent = c.name || '—';
    if (contactEmail) {
      contactEmail.textContent = c.email || '—';
      if (c.email) contactEmail.href = `mailto:${c.email}`;
    }
    if (contactPhone) {
      contactPhone.textContent = c.phone || '—';
      if (c.phone) contactPhone.href = `tel:${c.phone}`;
    }
  }

  // related jobs (simple)
  if (related) {
    related.innerHTML = jobs
      .filter(j => j.id !== job.id)
      .slice(0, 3)
      .map(j => `
        <a class="d-block text-decoration-none" href="detail-job.html?id=${j.id}">
          <div class="d-flex gap-3">
            <div class="rounded-3 border d-flex align-items-center justify-content-center" style="width:44px;height:44px;background:#fff;">
              <span class="fw-bold text-primary">${(j.company || 'J')[0]}</span>
            </div>
            <div class="flex-grow-1">
              <div class="small fw-semibold">${j.title}</div>
              <div class="small text-secondary">${j.company} • ${j.location}</div>
            </div>
          </div>
        </a>
      `).join('');
  }

  // save/apply buttons
  const saveBtn = document.getElementById('saveBtn');
  const applyBtn = document.getElementById('applyBtn');
  on(saveBtn, 'click', () => {
    const pressed = saveBtn.getAttribute('aria-pressed') === 'true';
    saveBtn.setAttribute('aria-pressed', String(!pressed));
    showToast(!pressed ? 'Đã lưu tin tuyển dụng' : 'Đã bỏ lưu', 'success');
  });
  on(applyBtn, 'click', async () => {
    const email = persist.getEmail();
    if (!email) {
      showToast('Vui lòng đăng nhập để ứng tuyển', 'error');
      setTimeout(() => window.location.href = 'index.html#login', 800);
      return;
    }
    // Try to attach candidate's stored PDF
    const cvPdf = persist.loadUserPdf(email);
    const candidateName = persist.getName() || getEmailName(email);
    const applications = JSON.parse(localStorage.getItem('tcv_applications') || '[]');
    // try get posterEmail from jobs dataset (merged with local)
    const jobs = await fetchJobs();
    const currentJob = jobs.find(j => j.id === jobId);
    const posterEmail = currentJob?.posterEmail || currentJob?.contact?.email || '';
    // prevent duplicate apply
    const dup = applications.find(a => a.candidateEmail === email && a.jobId === jobId);
    if (dup) {
      showToast('Bạn đã ứng tuyển công việc này. Vui lòng chờ phản hồi.', 'error');
      return;
    }
    applications.unshift({
      jobId,
      jobTitle: document.getElementById('jobTitle')?.textContent || 'Công việc',
      posterEmail,
      candidateEmail: email,
      candidateName,
      candidateCv: persist.loadCv(),
      cvPdf,
      status: 'applied',
      createdAt: Date.now()
    });
    localStorage.setItem('tcv_applications', JSON.stringify(applications));
    showToast('Ứng tuyển thành công! CV của bạn đã gửi đến nhà tuyển dụng.', 'success');
  });
};

const initIndexPage = () => {
  const emailStored = persist.getEmail();
  if (emailStored) {
    window.location.href = 'dashboard.html';
    return;
  }
  const form = select('#authForm');
  const email = select('#email');
  const pwd = select('#password');
  const fetchUsers = async () => {
    try {
      const res = await fetch('data/users.json', { cache: 'no-store' });
      return await res.json();
    } catch {
      return { seekers: [], posters: [] };
    }
  };

  on(form, 'submit', (e) => {
    e.preventDefault();
    const ok = validateRequired([email, pwd]) && email.checkValidity();
    if (!ok) {
      email.reportValidity();
      return;
    }
    const inputEmail = email.value.trim();
    const inputPwd = pwd.value.trim();

    fetchUsers().then((data) => {
      // include admin array from data/users.json if present
      const allUsers = [...(data.seekers||[]), ...(data.posters||[]), ...(data.admin||[])];
      const found = allUsers.find(u => u.email.toLowerCase() === inputEmail.toLowerCase() && u.password === inputPwd);
      if (!found) {
        showToast('Email hoặc mật khẩu không đúng', 'error');
        return;
      }
      persist.setUserInfo({ email: found.email, role: found.role, name: found.name || getEmailName(found.email) });
      showToast('Đăng nhập thành công!', 'success');
      setTimeout(() => {
        if (found.role === 'poster') {
          window.location.href = 'poster.html';
        } else if (found.role === 'admin') {
          window.location.href = 'admin-dashboard.html';
        } else {
          window.location.href = 'home.html';
        }
      }, 600);
    });
  });
};

const initDashboardPage = () => {
  const email = persist.getEmail();
  if (!email) {
    window.location.href = 'index.html';
    return;
  }
  const greet = select('#greetNav');
  if (greet) greet.textContent = `Xin chào, ${getEmailName(email)}`;

  const form = select('#cvForm');
  const fullName = select('#fullName');
  const position = select('#position');
  const skills = select('#skills');
  const experience = select('#experience');
  const preview = select('#cvPreview');
  const logoutBtn = select('#logoutBtn');

  const existing = persist.loadCv();
  if (existing) {
    fullName.value = existing.fullName || '';
    position.value = existing.position || '';
    skills.value = existing.skills || '';
    experience.value = existing.experience || '';
    renderCvPreview(preview, existing);
  } else {
    renderCvPreview(preview, null);
  }

  // PDF upload handling
  const pdfInput = document.getElementById('cvPdfInput');
  const pdfUploadBtn = document.getElementById('cvPdfUploadBtn');
  const pdfLink = document.getElementById('cvPdfLink');
  const pdfRemoveBtn = document.getElementById('cvPdfRemoveBtn');

  const refreshPdfUi = () => {
    const current = persist.loadUserPdf(email);
    if (current) {
      pdfLink.classList.remove('d-none');
      pdfRemoveBtn.classList.remove('d-none');
      pdfLink.href = current;
      pdfLink.download = `${getEmailName(email)}-CV.pdf`;
    } else {
      pdfLink.classList.add('d-none');
      pdfRemoveBtn.classList.add('d-none');
      pdfLink.removeAttribute('href');
    }
  };
  refreshPdfUi();

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  on(pdfUploadBtn, 'click', async () => {
    const file = pdfInput?.files?.[0];
    if (!file) { showToast('Vui lòng chọn tệp PDF', 'error'); return; }
    if (file.type !== 'application/pdf') { showToast('Chỉ chấp nhận PDF', 'error'); return; }
    if (file.size > 2 * 1024 * 1024) { showToast('Kích thước tối đa 2MB', 'error'); return; }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      persist.saveUserPdf(email, dataUrl);
      refreshPdfUi();
      showToast('Đã tải lên CV PDF', 'success');
    } catch {
      showToast('Tải lên thất bại', 'error');
    }
  });

  on(pdfRemoveBtn, 'click', () => {
    persist.removeUserPdf(email);
    refreshPdfUi();
    showToast('Đã xóa CV PDF', 'success');
  });

  on(form, 'submit', (e) => {
    e.preventDefault();
    const ok = validateRequired([fullName, position, skills, experience]);
    if (!ok) return;

    const data = {
      fullName: fullName.value.trim(),
      position: position.value.trim(),
      skills: skills.value.trim(),
      experience: experience.value.trim()
    };
    persist.saveCv(data);
    renderCvPreview(preview, data);
    showToast('Đã lưu CV!', 'success');
  });

  on(logoutBtn, 'click', () => {
    persist.clearAll();
    showToast('Đã đăng xuất.', 'primary');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 600);
  });
};

document.addEventListener('DOMContentLoaded', () => {
  setYear();
  const onIndex = !!document.getElementById('authForm');
  const onDashboard = !!document.getElementById('cvForm');
  const onHome = !!document.getElementById('jobsGrid');
  const onEmployer = !!document.querySelector('body > nav.navbar-dark') || window.location.pathname.endsWith('poster.html');
  const onJobPost = window.location.pathname.endsWith('job-post.html');
  const onJobManage = window.location.pathname.endsWith('job-manage.html');
  if (onIndex) initIndexPage();
  if (onDashboard) initDashboardPage();
  if (onHome) {
    // show admin back button when logged in as admin
    const adminBackArea = document.getElementById('adminBackArea');
    try {
      const role = persist.getRole();
      if (adminBackArea) adminBackArea.classList.toggle('d-none', role !== 'admin');
    } catch (e) {}
    // Suggested categories from dataset
    const suggestedWrap = document.getElementById('suggestedCats');
    const renderSuggestedCategories = (jobs) => {
      if (!suggestedWrap) return;
      const map = new Map();
      jobs.forEach(j => {
        const cat = (j.category || '').trim();
        if (!cat) return;
        map.set(cat, (map.get(cat)||0)+1);
      });
      const cats = Array.from(map.entries()).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([c])=>c);
      if (!cats.length) { suggestedWrap.innerHTML=''; return; }
      suggestedWrap.innerHTML = cats.map(c => `<button class="btn btn-sm btn-outline-primary rounded-pill btn-suggest-cat" data-cat="${c}">${c}</button>`).join('');
      suggestedWrap.querySelectorAll('.btn-suggest-cat').forEach(btn => {
        on(btn,'click',()=>{
          const kw = btn.getAttribute('data-cat');
          const kwInput = document.getElementById('searchKeyword');
          if (kwInput) { kwInput.value = kw; }
          const searchBtn = document.getElementById('searchBtn');
          if (searchBtn) searchBtn.click();
        });
      });
    };
    // greet user if logged in
    const email = persist.getEmail();
    const authArea = document.getElementById('authAreaHome');
    const userArea = document.getElementById('userAreaHome');
    const greet = document.getElementById('greetHome');
    const logoutBtn = document.getElementById('logoutBtnHome');
    if (email && userArea && authArea) {
      authArea.classList.add('d-none');
      userArea.classList.remove('d-none');
      userArea.classList.add('d-flex');
      const displayName = persist.getName() || getEmailName(email);
      const role = persist.getRole();
      if (greet) greet.textContent = `Xin chào, ${displayName}${role ? role === 'poster' ? ' (Nhà tuyển dụng)' : ' (Ứng viên)' : ''}`;
      const back = document.getElementById('employerBackLink');
      if (back) back.classList.toggle('d-none', role !== 'poster');
      const seekerLink = document.getElementById('seekerAppliedLink');
      if (seekerLink) seekerLink.classList.toggle('d-none', role !== 'seeker');
    }
    on(logoutBtn, 'click', () => {
      persist.clearAll();
      showToast('Đã đăng xuất.', 'primary');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 600);
    });

    // simple save job toggle
    document.querySelectorAll('.btn-save-job').forEach((btn) => {
      on(btn, 'click', (e) => {
        const pressed = btn.getAttribute('aria-pressed') === 'true';
        btn.setAttribute('aria-pressed', String(!pressed));
        btn.querySelector('span').classList.toggle('text-danger', !pressed);
      });
    });
    // filter by city chips
    document.querySelectorAll('.chip-location').forEach((chip) => {
      on(chip, 'click', () => {
        document.querySelectorAll('.chip-location').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const city = chip.getAttribute('data-filter');
        document.querySelectorAll('#jobsGrid > [data-city]').forEach((card) => {
          card.style.display = !city || card.getAttribute('data-city') === city ? '' : 'none';
        });
      });
    });

    // Load jobs from JSON and render cards
    const jobsGrid = document.getElementById('jobsGrid');
    // pagination state
    const pagination = { page: 1, pageSize: 9, data: [] };

    const renderJobsPage = () => {
      if (!jobsGrid) return;
      const start = (pagination.page - 1) * pagination.pageSize;
      const slice = pagination.data.slice(start, start + pagination.pageSize);
      jobsGrid.innerHTML = slice.map((j) => `
        <div class="col-12 col-md-6 col-xl-4" data-city="${(j.location || '').toLowerCase().includes('hồ chí minh') ? 'hcm' : (j.location || '').toLowerCase().includes('đà nẵng') ? 'dn' : 'hn'}">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body p-3">
              <div class="d-flex gap-3">
                <div class="flex-shrink-0">
                  <div class="rounded-3 border d-flex align-items-center justify-content-center" style="width:56px;height:56px;background:#fff;">
                    <span class="fw-bold text-primary">${(j.company || 'J')[0].toUpperCase()}</span>
                  </div>
                </div>
                <div class="flex-grow-1">
                  <div class="d-flex align-items-start justify-content-between">
                    <h6 class="mb-1"><a href="detail-job.html?id=${j.id}" class="link-dark">${j.title}</a></h6>
                    <button class="btn btn-link btn-sm text-decoration-none btn-save-job" aria-pressed="false" title="Lưu">
                      <span class="text-secondary">❤</span>
                    </button>
                  </div>
                  <div class="small text-secondary">${j.company}</div>
                  <div class="mt-2 d-flex flex-wrap gap-2 small">
                    <span class="badge bg-light text-dark border">${j.salary || 'Thỏa thuận'}</span>
                    <span class="badge bg-light text-dark border">${j.location || ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `).join('');
      // pagination controls
      const totalPages = Math.max(1, Math.ceil(pagination.data.length / pagination.pageSize));
      const pagEl = document.getElementById('jobsPagination');
      if (pagEl) {
        pagEl.innerHTML = `
          <ul class="pagination">
            <li class="page-item ${pagination.page===1?'disabled':''}"><a class="page-link" href="#" data-page="prev">«</a></li>
            ${Array.from({length: totalPages}).map((_,i)=>`<li class="page-item ${i+1===pagination.page?'active':''}"><a class="page-link" href="#" data-page="${i+1}">${i+1}</a></li>`).join('')}
            <li class="page-item ${pagination.page===totalPages?'disabled':''}"><a class="page-link" href="#" data-page="next">»</a></li>
          </ul>`;
        pagEl.querySelectorAll('a.page-link').forEach(a=>{
          on(a,'click',(e)=>{
            e.preventDefault();
            const val = a.getAttribute('data-page');
            const total = Math.max(1, Math.ceil(pagination.data.length / pagination.pageSize));
            if (val==='prev' && pagination.page>1) pagination.page--; else if (val==='next' && pagination.page<total) pagination.page++; else if (!isNaN(Number(val))) pagination.page = Number(val);
            renderJobsPage();
          })
        })
      }
    };

    fetchJobs().then((jobs) => { pagination.data = jobs; renderJobsPage(); renderSuggestedCategories(jobs); });

    // search functionality
    const keywordInput = document.getElementById('searchKeyword');
    const citySelect = document.getElementById('searchCity');
    const searchBtn = document.getElementById('searchBtn');

    const matches = (text, kw) => text.toLowerCase().includes(kw.toLowerCase());
    const performSearch = () => {
      const kw = (keywordInput?.value || '').trim();
      const city = citySelect?.value || '';
      const cards = document.querySelectorAll('#jobsGrid > [data-city]');
      cards.forEach((card) => {
        const title = card.querySelector('h6')?.textContent || '';
        const company = card.querySelector('.small.text-secondary')?.textContent || '';
        const cityOk = !city || card.getAttribute('data-city') === city;
        const kwOk = !kw || matches(title, kw) || matches(company, kw);
        card.style.display = cityOk && kwOk ? '' : 'none';
      });
    };

    on(searchBtn, 'click', performSearch);
    on(keywordInput, 'keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); performSearch(); } });
    on(citySelect, 'change', performSearch);
  }
  // role-based redirect if already logged in and on employer page
  if (onEmployer) {
    const role = persist.getRole();
    const name = persist.getName() || getEmailName(persist.getEmail());
    const greet = document.getElementById('employerGreeting');
    if (greet) greet.textContent = name ? `Xin chào, ${name}` : '—';
    if (role !== 'poster') {
      // Non-poster should not access employer page
      window.location.href = 'home.html';
    }
    const logout = document.getElementById('logoutBtnEmployer');
    on(logout, 'click', () => {
      persist.clearAll();
      showToast('Đã đăng xuất.', 'primary');
      setTimeout(() => window.location.href = 'index.html', 600);
    });
  }

  // Handle job post form submit
  if (onJobPost) {
    const form = document.getElementById('jobPostForm');
    const title = document.getElementById('jpTitle');
    const category = document.getElementById('jpCategory');
    const locationInput = document.getElementById('jpLocation');
    const cover = document.getElementById('jpCover');
    const desc = document.getElementById('jpDesc');
    const req = document.getElementById('jpReq');
    const benefits = document.getElementById('jpBenefits');
    const salary = document.getElementById('jpSalary');
    const type = document.getElementById('jpType');
    const deadline = document.getElementById('jpDeadline');
    const contactEmail = document.getElementById('jpContactEmail');

    on(form, 'submit', (e) => {
      e.preventDefault();
      const ok = validateRequired([title, category, desc]);
      if (!ok) return;
      const job = {
        id: `${Date.now()}`,
        title: title.value.trim(),
        company: persist.getName() || 'Nhà tuyển dụng',
        location: locationInput.value.trim(),
        salary: salary.value.trim(),
        type: type.value.trim() || 'Toàn thời gian',
        postedAt: 'Vừa đăng',
        description: desc.value.split('\n').filter(Boolean),
        requirements: req.value.split('\n').filter(Boolean),
        benefits: benefits.value.split('\n').filter(Boolean),
        cover: cover.value.trim(),
        contact: { name: persist.getName() || 'HR', email: contactEmail.value.trim(), phone: '' },
        posterEmail: persist.getEmail()
      };
      try {
        const existing = JSON.parse(localStorage.getItem('tcv_jobs_local') || '[]');
        existing.unshift(job);
        localStorage.setItem('tcv_jobs_local', JSON.stringify(existing));
      } catch {}
      showToast('Đăng tin thành công!', 'success');
      setTimeout(() => window.location.href = 'detail-job.html?id=' + job.id, 600);
    });
  }
  // Universal header auth toggle for any page that has the header
  const authAreaGlobal = document.getElementById('authAreaHome');
  const userAreaGlobal = document.getElementById('userAreaHome');
  const greetGlobal = document.getElementById('greetHome');
  const logoutGlobal = document.getElementById('logoutBtnHome');
  if (authAreaGlobal && userAreaGlobal) {
    const email = persist.getEmail();
    if (email) {
      authAreaGlobal.classList.add('d-none');
      userAreaGlobal.classList.remove('d-none');
      userAreaGlobal.classList.add('d-flex');
      const displayName = persist.getName() || getEmailName(email);
      const role = persist.getRole();
      if (greetGlobal) greetGlobal.textContent = `Xin chào, ${displayName}${role ? role === 'poster' ? ' (Nhà tuyển dụng)' : ' (Ứng viên)' : ''}`;
    }
    on(logoutGlobal, 'click', () => {
      persist.clearAll();
      showToast('Đã đăng xuất.', 'primary');
      setTimeout(() => window.location.href = 'index.html', 600);
    });
  }
  // register page
  const regForm = document.getElementById('registerForm');
  if (regForm) {
    const regName = document.getElementById('regName');
    const regEmail = document.getElementById('regEmail');
    const regPassword = document.getElementById('regPassword');
    const regPassword2 = document.getElementById('regPassword2');
    const agree = document.getElementById('agreeTerms');

    on(regForm, 'submit', (e) => {
      e.preventDefault();
      const ok = validateRequired([regName, regEmail, regPassword, regPassword2]) && regEmail.checkValidity() && agree.checked && regPassword.value.trim() === regPassword2.value.trim();
      if (!ok) {
        if (regPassword.value.trim() !== regPassword2.value.trim()) {
          regPassword2.classList.add('is-invalid');
        }
        regEmail.reportValidity();
        return;
      }
      persist.setEmail(regEmail.value.trim());
      showToast('Đăng ký thành công!', 'success');
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 600);
    });
  }
  const onDetail = !!document.getElementById('relatedJobs');
  if (onDetail) {
    renderDetailPage();
  }

  // Poster inbox rendering
  if (onEmployer || window.location.pathname.endsWith('poster.html')) {
    (async () => {
      const usersMap = await loadUsersMap();
      const applications = JSON.parse(localStorage.getItem('tcv_applications') || '[]');
      const myEmail = persist.getEmail();
      const myApps = applications.filter(a => a.posterEmail === myEmail);
      const list = document.getElementById('applicationsList');
      const count = document.getElementById('inboxCount');
      if (count) count.textContent = String(myApps.length);
      if (list) {
        if (!myApps.length) {
          list.innerHTML = '<div class="text-secondary small">Chưa có hồ sơ.</div>';
        } else {
          list.innerHTML = myApps.map(a => {
            const lastLog = (a.log && a.log.length) ? a.log[0] : null;
            const logText = lastLog ? (lastLog.action === 'offer_sent' ? `Đã gửi đề nghị ${lastLog.price?(' - ' + lastLog.price + ' VNĐ'):''}` : lastLog.action === 'offer_accepted' ? 'Người tìm việc đã chấp nhận' : lastLog.action === 'offer_declined' ? 'Người tìm việc đã từ chối' : lastLog.action === 'offer_cancelled' ? 'Đề nghị đã bị huỷ' : '') : '';
            const seeker = usersMap[a.candidateEmail] || null;
            const displayName = a.candidateName || seeker?.name || a.candidateEmail;
            const seekerInfo = seeker ? `${seeker.role ? (seeker.role === 'seeker' ? '' : seeker.role) : ''}` : '';
            return `
            <div class="border rounded-3 p-2">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="fw-semibold small"> Tên ứng viên: ${displayName}</div>
                  <div class="text-secondary small">Ứng tuyển: ${a.jobTitle}</div>
                  ${logText?`<div class="small text-secondary mt-1">${logText}</div>`:''}
                  ${a.candidateCv?`<div class="small text-muted mt-1">${a.candidateCv.position?(`${a.candidateCv.position} • `):''}${a.candidateCv.skills?(`${a.candidateCv.skills.split(',').slice(0,3).join(', ')}`):''}</div>`:''}
                </div>
                  <a class="btn btn-sm btn-outline-primary" href="${a.cvPdf}" download>CV PDF</a>
              </div>
              </div>
          `}).join('');
        }
      }
    })();
  }

  // Manage posted jobs
  if (onJobManage) {
    const container = document.getElementById('manageJobsList');
    const empty = document.getElementById('manageEmpty');
    const myEmail = persist.getEmail();
    fetchJobs().then((jobs) => {
      const myJobs = jobs.filter(j => (j.posterEmail || (j.contact && j.contact.email)) === myEmail);
      if (!myJobs.length) {
        if (empty) empty.classList.remove('d-none');
        return;
      }
      if (empty) empty.classList.add('d-none');
      container.innerHTML = myJobs.map(j => `
        <div class="col-12 col-md-6 col-xl-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body p-3">
              <div class="d-flex align-items-start justify-content-between">
                <h6 class="mb-1"><a href="detail-job.html?id=${j.id}" class="link-dark">${j.title}</a></h6>
                <button class="btn btn-sm btn-outline-danger btn-delete-job" data-id="${j.id}">Xóa</button>
              </div>
              <div class="small text-secondary">${j.company} • ${j.location || ''}</div>
              <div class="mt-2 small">${j.salary || 'Thỏa thuận'}</div>
            </div>
          </div>
        </div>
      `).join('');

      container.querySelectorAll('.btn-delete-job').forEach(btn => {
        on(btn, 'click', () => {
          const id = btn.getAttribute('data-id');
          const local = JSON.parse(localStorage.getItem('tcv_jobs_local') || '[]');
          const filtered = local.filter(j => j.id !== id);
          localStorage.setItem('tcv_jobs_local', JSON.stringify(filtered));
          showToast('Đã xóa công việc', 'success');
          btn.closest('.col-12').remove();
        });
      });
    });
  }

  // Poster applications management page
  if (window.location.pathname.endsWith('applications-manage.html')) {
    (async () => {
      const usersMap = await loadUsersMap();
      const myEmail = persist.getEmail();
      const apps = JSON.parse(localStorage.getItem('tcv_applications') || '[]').filter(a => a.posterEmail === myEmail);
      const body = document.getElementById('applicationsBody');
      const kwInput = document.getElementById('appSearchKw');
      const jobSelect = document.getElementById('appFilterJob');
      const btnSearch = document.getElementById('appSearchBtn');
      const btnReset = document.getElementById('appResetBtn');

    // fill job filter
    const jobTitles = Array.from(new Set(apps.map(a => a.jobTitle))).sort();
    jobTitles.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t; opt.textContent = t; jobSelect.appendChild(opt);
    });

    const render = (rows) => {
      if (!rows.length) {
        body.innerHTML = '<tr><td colspan="4" class="text-secondary">Không có kết quả.</td></tr>';
        return;
      }
      body.innerHTML = rows.map(a => `
        <tr>
          <td>
            <div class="fw-semibold">${a.candidateName || (usersMap[a.candidateEmail]?.name) || a.candidateEmail}</div>
            <div class="text-secondary small">${a.candidateEmail}</div>
            ${a.candidateCv?`<div class="small text-muted mt-1">${a.candidateCv.position?(`${a.candidateCv.position} • `):''}${a.candidateCv.skills?(`${a.candidateCv.skills.split(',').slice(0,3).join(', ')}`):''}</div>`:''}
            ${usersMap[a.candidateEmail] ? `
              <div class="small text-muted mt-1">
                ${usersMap[a.candidateEmail].title ? `<div><strong>Chức danh:</strong> ${usersMap[a.candidateEmail].title}</div>` : ''}
                ${usersMap[a.candidateEmail].location ? `<div><strong>Địa chỉ:</strong> ${usersMap[a.candidateEmail].location}</div>` : ''}
                ${usersMap[a.candidateEmail].phone ? `<div><strong>Điện thoại:</strong> ${usersMap[a.candidateEmail].phone}</div>` : ''}
                ${usersMap[a.candidateEmail].bio ? `<div class="mt-1">${usersMap[a.candidateEmail].bio}</div>` : ''}
              </div>
            ` : ''}
          </td>
          <td>${a.jobTitle} ${a.status?`<span class='badge ${a.status==='rejected'?'bg-danger':a.status==='offered'?'bg-primary':a.status==='offered-accepted'?'bg-success':a.status==='offered-declined'?'bg-danger':'bg-secondary'} ms-2'>${a.status==='rejected'?'Đã từ chối':a.status==='offered'?'Đã gửi đề nghị':a.status==='offered-accepted'?'Người tìm việc đã chấp nhận':a.status==='offered-declined'?'Người tìm việc đã từ chối':'Đã nộp'}</span>`:''}</td>
          <td>${a.cvPdf ? `<a href="${a.cvPdf}" download>CV PDF</a>` : '<span class="text-secondary">(Chưa đính kèm)</span>'}</td>
          <td class="text-end">
            <div class="btn-group">
              <button class="btn btn-sm btn-outline-secondary btn-view" data-cand="${a.candidateEmail}" data-job="${a.jobId}">Xem</button>
              <button class="btn btn-sm btn-outline-danger btn-reject" data-cand="${a.candidateEmail}" data-job="${a.jobId}">Từ chối</button>
              <button class="btn btn-sm btn-primary btn-offer" data-cand="${a.candidateEmail}" data-job="${a.jobId}">Gửi đề nghị</button>
              <button class="btn btn-sm btn-outline-secondary btn-delete-app" data-cand="${a.candidateEmail}" data-job="${a.jobId}">Xóa</button>
            </div>
          </td>
        </tr>
      `).join('');
      // reject application
      body.querySelectorAll('.btn-reject').forEach(btn => {
        on(btn, 'click', () => {
          const cand = btn.getAttribute('data-cand');
          const jobId = btn.getAttribute('data-job');
          const all = JSON.parse(localStorage.getItem('tcv_applications') || '[]');
          const idx = all.findIndex(x => x.candidateEmail===cand && x.jobId===jobId && x.posterEmail===myEmail);
          if (idx>-1) {
            // mark as rejected and add a log entry so the seeker sees a notification
            all[idx].status = 'rejected';
            all[idx].log = all[idx].log || [];
            all[idx].log.unshift({ ts: Date.now(), by: myEmail, action: 'application_rejected', note: 'Hồ sơ bị từ chối bởi nhà tuyển dụng' });
            localStorage.setItem('tcv_applications', JSON.stringify(all));
            showToast('Đã từ chối hồ sơ', 'success');
            doFilter();
          }
        });
      });

      // delete application
      body.querySelectorAll('.btn-delete-app').forEach(btn => {
        on(btn, 'click', () => {
          const cand = btn.getAttribute('data-cand');
          const jobId = btn.getAttribute('data-job');
          const all = JSON.parse(localStorage.getItem('tcv_applications') || '[]');
          const filtered = all.filter(x => !(x.candidateEmail===cand && x.jobId===jobId && x.posterEmail===myEmail));
          localStorage.setItem('tcv_applications', JSON.stringify(filtered));
          // Also remove or mark related offers as cancelled
          try {
            const offers = JSON.parse(localStorage.getItem('tcv_offers') || '[]');
            let changed = false;
            const updated = offers.map(o => {
              if (o.candidateEmail===cand && o.jobId===jobId && o.posterEmail===myEmail) {
                changed = true;
                return { ...o, status: 'cancelled' };
              }
              return o;
            });
            if (changed) localStorage.setItem('tcv_offers', JSON.stringify(updated));
          } catch (e) { /* ignore */ }
          showToast('Đã xóa hồ sơ (và huỷ các đề nghị liên quan)', 'success');
          doFilter();
        });
      });

      body.querySelectorAll('.btn-offer').forEach(btn => {
        on(btn, 'click', () => {
          const cand = btn.getAttribute('data-cand');
          const jobId = btn.getAttribute('data-job');
          const modalEl = document.getElementById('offerModal');
          const modal = new bootstrap.Modal(modalEl);
          modal.show();
          const send = document.getElementById('offerSendBtn');
          const price = document.getElementById('offerPrice');
          const note = document.getElementById('offerNote');
          const onSend = () => {
            if (!price.value.trim() || !note.value.trim()) return;
            const offers = JSON.parse(localStorage.getItem('tcv_offers') || '[]');
            const offerObj = { posterEmail: myEmail, candidateEmail: cand, jobId, price: Number(price.value), note: note.value.trim(), status: 'sent', createdAt: Date.now() };
            offers.unshift(offerObj);
            localStorage.setItem('tcv_offers', JSON.stringify(offers));
            // update application status to offered and link the offer createdAt as offerId
            const all = JSON.parse(localStorage.getItem('tcv_applications') || '[]');
            const idx = all.findIndex(x => x.candidateEmail===cand && x.jobId===jobId && x.posterEmail===myEmail);
            if (idx>-1) {
              all[idx].status = 'offered';
              // add log/details field and link to offer
              all[idx].offerId = offerObj.createdAt;
              all[idx].log = all[idx].log || [];
              all[idx].log.unshift({ ts: Date.now(), by: myEmail, action: 'offer_sent', offerId: offerObj.createdAt, note: offerObj.note, price: offerObj.price });
              localStorage.setItem('tcv_applications', JSON.stringify(all));
            }
            showToast('Đã gửi đề nghị hợp tác', 'success');
            modal.hide();
            send.removeEventListener('click', onSend);
          };
          send.addEventListener('click', onSend);
          modalEl.addEventListener('hidden.bs.modal', () => send.removeEventListener('click', onSend), { once: true });
        });
      });

      // view candidate details (modal)
      const ensureModal = () => {
        if (document.getElementById('candidateModal')) return;
        const modalHtml = `
        <div class="modal fade" id="candidateModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Thông tin ứng viên</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div id="candidateMeta"></div>
                <hr />
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
              </div>
            </div>
          </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
      };

      body.querySelectorAll('.btn-view').forEach(btn => {
        on(btn, 'click', async () => {
          const cand = btn.getAttribute('data-cand');
          ensureModal();
          const modalEl = document.getElementById('candidateModal');
          const metaEl = document.getElementById('candidateMeta');
          const cvPreviewEl = document.getElementById('candidateCvPreview');
          const usersMap = await loadUsersMap();
          const seeker = usersMap[cand] || null;
          // fill meta
          // Build meta HTML using fields actually present in data/users.json
          const skillsList = seeker?.skills ? (Array.isArray(seeker.skills) ? seeker.skills.join(', ') : seeker.skills) : '';
          metaEl.innerHTML = `
            <div class="small">
              <div class="fw-semibold mb-1"><strong>Tên ứng viên: </strong> ${seeker?.name || cand}</div>
              ${seeker?.position ? `<div><strong>Vị trí:</strong> ${seeker.position}</div>` : ''}
              ${skillsList ? `<div><strong>Kỹ năng:</strong> ${skillsList}</div>` : ''}
              ${seeker?.experience ? `<div><strong>Kinh nghiệm:</strong> ${seeker.experience}</div>` : ''}
              ${seeker?.description ? `<div class="mt-2">${seeker.description}</div>` : ''}
            </div>`;
          // render CV snapshot if stored in applications
          const allApps = JSON.parse(localStorage.getItem('tcv_applications') || '[]');
          const app = allApps.find(x => x.candidateEmail === cand && x.posterEmail === persist.getEmail());
          const cvData = app?.candidateCv || null;
          renderCvPreview(cvPreviewEl, cvData);
          // add CV PDF download link if available
          const footer = modalEl.querySelector('.modal-footer');
          // remove existing download button if any
          const existingDl = modalEl.querySelector('.btn-download-cv');
          if (existingDl) existingDl.remove();
          if (app && app.cvPdf) {
            const dl = document.createElement('a');
            dl.className = 'btn btn-outline-primary btn-download-cv me-2';
            dl.href = app.cvPdf;
            dl.download = `${seeker?.name || cand}-CV.pdf`;
            dl.textContent = 'Tải CV PDF';
            footer.insertBefore(dl, footer.firstChild);
          }
          const modal = new bootstrap.Modal(modalEl);
          modal.show();
        });
      });
    };

    const doFilter = () => {
      const kw = (kwInput.value || '').toLowerCase();
      const job = jobSelect.value;
      const rows = apps.filter(a => {
        const text = `${a.candidateName} ${a.candidateEmail} ${a.jobTitle}`.toLowerCase();
        const kwOk = !kw || text.includes(kw);
        const jobOk = !job || a.jobTitle === job;
        return kwOk && jobOk;
      });
      render(rows);
    };

    on(btnSearch, 'click', doFilter);
    on(kwInput, 'keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doFilter(); } });
    on(jobSelect, 'change', doFilter);
    on(btnReset, 'click', () => { kwInput.value=''; jobSelect.value=''; doFilter(); });
    doFilter();
    })();
  }

  // Seeker applied page
  if (window.location.pathname.endsWith('seeker-applied.html')) {
    const email = persist.getEmail();
    const apps = JSON.parse(localStorage.getItem('tcv_applications') || '[]').filter(a => a.candidateEmail === email);
    const offers = JSON.parse(localStorage.getItem('tcv_offers') || '[]').filter(o => o.candidateEmail === email);
    const list = document.getElementById('appliedList');
    const empty = document.getElementById('appliedEmpty');
    if (!apps.length) { empty.classList.remove('d-none'); return; }
    empty.classList.add('d-none');
    list.innerHTML = apps.map(a => {
      const myOffers = offers.filter(o => o.jobId === a.jobId);
      const offerHtml = myOffers.length ? myOffers.map(o => `<div class="border rounded-3 p-2 mt-2"><div class="small">Đề nghị: <strong>${o.price.toLocaleString()} VNĐ</strong> <span class="badge ${o.status==='accepted'?'bg-success':o.status==='declined'?'bg-danger':'bg-secondary'}">${o.status==='accepted'?'Đã chấp nhận':o.status==='declined'?'Đã từ chối':'Đã gửi'}</span></div><div class="small">${o.note}</div>${o.status==='sent'?`<div class='mt-2 d-flex gap-2'><button class='btn btn-sm btn-success btn-offer-accept' data-id='${o.createdAt}' data-job='${a.jobId}'>Chấp nhận</button><button class='btn btn-sm btn-outline-danger btn-offer-decline' data-id='${o.createdAt}' data-job='${a.jobId}'>Từ chối</button></div>`:''}</div>`).join('') : '<div class="text-secondary small mt-2">Chưa có đề nghị</div>';
      // show application status and latest log for seeker awareness
      const statusBadge = a.status ? `<div class="mt-2"><span class="badge ${a.status==='rejected'?'bg-danger':a.status==='offered'?'bg-primary':a.status==='offered-accepted'?'bg-success':a.status==='offered-declined'?'bg-danger':'bg-secondary'}">${a.status==='rejected'?'Đã bị từ chối':a.status==='offered'?'Đã nhận đề nghị':a.status==='offered-accepted'?'Đề nghị đã chấp nhận':a.status==='offered-declined'?'Đề nghị đã từ chối':'Đã ứng tuyển'}</span></div>` : '';
      const lastAppLog = (a.log && a.log.length) ? a.log[0] : null;
      const logHtml = lastAppLog ? `<div class="small text-secondary mt-1">${lastAppLog.action==='application_rejected' ? 'Nhà tuyển dụng đã từ chối hồ sơ của bạn' : lastAppLog.action==='offer_sent' ? `Nhận đề nghị: ${lastAppLog.price? (lastAppLog.price + ' VNĐ') : ''}` : lastAppLog.action==='offer_accepted' ? 'Bạn đã chấp nhận đề nghị' : lastAppLog.action==='offer_declined' ? 'Bạn đã từ chối đề nghị' : ''}</div>` : '';
      return `
        <div class="border rounded-4 p-3">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <div class="fw-semibold">${a.jobTitle}</div>
              <div class="text-secondary small">Nhà tuyển dụng: ${a.posterEmail || '—'}</div>
              ${statusBadge}
              ${logHtml}
            </div>
            ${a.cvPdf ? `<a class="btn btn-sm btn-outline-primary" href="${a.cvPdf}" download>CV PDF</a>` : ''}
          </div>
          ${offerHtml}
        </div>`;
    }).join('');

    // accept/decline handlers
    list.querySelectorAll('.btn-offer-accept').forEach(btn => {
      on(btn, 'click', () => {
        const id = Number(btn.getAttribute('data-id'));
        const jobId = btn.getAttribute('data-job');
        const all = JSON.parse(localStorage.getItem('tcv_offers') || '[]');
        const idx = all.findIndex(o => o.createdAt===id && o.jobId===jobId && o.candidateEmail===email);
        if (idx>-1) {
          all[idx].status = 'accepted';
          localStorage.setItem('tcv_offers', JSON.stringify(all));
          // Also update the corresponding application so poster inbox shows accepted status; add log
          try {
            const apps = JSON.parse(localStorage.getItem('tcv_applications') || '[]');
            const appIdx = apps.findIndex(a => a.jobId===jobId && a.candidateEmail===email && a.posterEmail===all[idx].posterEmail && (a.offerId===id || !a.offerId));
            if (appIdx > -1) {
              apps[appIdx].status = 'offered-accepted';
              apps[appIdx].log = apps[appIdx].log || [];
              apps[appIdx].log.unshift({ ts: Date.now(), by: email, action: 'offer_accepted', offerId: id });
              localStorage.setItem('tcv_applications', JSON.stringify(apps));
            }
          } catch (e) { /* ignore */ }
          // Update DOM in-place: change badge and remove accept/decline buttons for this offer
          const badge = btn.closest('.border')?.querySelector('.badge');
          if (badge) { badge.className = 'badge bg-success'; badge.textContent = 'Đã chấp nhận'; }
          const actionsWrap = btn.closest('.border')?.querySelector('.mt-2');
          if (actionsWrap) actionsWrap.innerHTML = "<div class='small text-success'>Bạn đã chấp nhận đề nghị.</div>";
          showToast('Đã chấp nhận đề nghị', 'success');
        }
      });
    });
    list.querySelectorAll('.btn-offer-decline').forEach(btn => {
      on(btn, 'click', () => {
        const id = Number(btn.getAttribute('data-id'));
        const jobId = btn.getAttribute('data-job');
        const all = JSON.parse(localStorage.getItem('tcv_offers') || '[]');
        const idx = all.findIndex(o => o.createdAt===id && o.jobId===jobId && o.candidateEmail===email);
        if (idx>-1) {
          all[idx].status = 'declined';
          localStorage.setItem('tcv_offers', JSON.stringify(all));
          // Also update the corresponding application so poster inbox shows declined status; add log
          try {
            const apps = JSON.parse(localStorage.getItem('tcv_applications') || '[]');
            const appIdx = apps.findIndex(a => a.jobId===jobId && a.candidateEmail===email && a.posterEmail===all[idx].posterEmail && (a.offerId===id || !a.offerId));
            if (appIdx > -1) {
              apps[appIdx].status = 'offered-declined';
              apps[appIdx].log = apps[appIdx].log || [];
              apps[appIdx].log.unshift({ ts: Date.now(), by: email, action: 'offer_declined', offerId: id });
              localStorage.setItem('tcv_applications', JSON.stringify(apps));
            }
          } catch (e) { /* ignore */ }
          // Update DOM in-place
          const badge = btn.closest('.border')?.querySelector('.badge');
          if (badge) { badge.className = 'badge bg-danger'; badge.textContent = 'Đã từ chối'; }
          const actionsWrap = btn.closest('.border')?.querySelector('.mt-2');
          if (actionsWrap) actionsWrap.innerHTML = "<div class='small text-danger'>Bạn đã từ chối đề nghị.</div>";
          showToast('Đã từ chối đề nghị', 'success');
        }
      });
    });
  }
});


