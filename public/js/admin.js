const AdminPages = {
  async renderDepartmentManagement() {
    try {
      const res = await API.get('/api/departments?includeInactive=true');
      const departments = res || [];
      const deptList = Array.isArray(departments) ? departments : (departments.list || []);

      let tableHtml = '';
      if (!deptList || deptList.length === 0) {
        tableHtml = `
          <div class="empty">
            <div class="icon">🏥</div>
            <p>暂无科室数据</p>
            <p style="color: #999; font-size: 13px; margin-top: 8px;">请新增科室以开始使用排班和预约功能</p>
            <button class="btn btn-primary" style="margin-top: 16px;" onclick="AdminPages.showCreateDepartment()">+ 新增科室</button>
          </div>
        `;
      } else {
        tableHtml = `<table class="table">
          <thead>
            <tr>
              <th>科室名称</th>
              <th>科室编码</th>
              <th>描述</th>
              <th>医生数</th>
              <th>排班数</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>`;

        (deptList || []).forEach(d => {
          const _count = d._count || {};
          const doctorCount = _count.doctors || 0;
          const scheduleCount = _count.schedules || 0;
          const isActive = d.status !== 'INACTIVE';

          tableHtml += `
            <tr>
              <td style="font-weight: 600;">${escapeHtml(d.name || '')}</td>
              <td><code>${escapeHtml(d.code || '-')}</code></td>
              <td>${escapeHtml(d.description || '-')}</td>
              <td>${doctorCount}</td>
              <td>${scheduleCount}</td>
              <td>
                <span class="status-tag ${isActive ? 'status-success' : 'status-default'}">
                  ${isActive ? '启用' : '停用'}
                </span>
              </td>
              <td>${formatDateTime(d.createdAt)}</td>
              <td>
                <button class="btn btn-default btn-sm" onclick="AdminPages.showEditDepartment('${d.id}')">编辑</button>
                <button class="btn ${isActive ? 'btn-warning' : 'btn-success'} btn-sm" style="margin-left: 8px;" onclick="AdminPages.toggleDepartment('${d.id}')">
                  ${isActive ? '停用' : '启用'}
                </button>
              </td>
            </tr>
          `;
        });

        tableHtml += '</tbody></table>';
      }

      document.getElementById('content').innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">科室管理</h2>
          <button class="btn btn-primary" onclick="AdminPages.showCreateDepartment()">+ 新增科室</button>
        </div>
        <div class="card">
          ${tableHtml}
        </div>
        <div id="deptModal" class="card" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 500px; z-index: 1000; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
        </div>
      `;
    } catch (error) {
      showToast(error.message || '加载失败', 'error');
    }
  },

  showCreateDepartment() {
    const html = `
      <h3 style="margin-bottom: 20px;">新增科室</h3>
      <div class="form-group">
        <label>科室名称 <span style="color: red;">*</span></label>
        <input type="text" id="deptName" placeholder="如：内科、外科、儿科">
      </div>
      <div class="form-group">
        <label>科室编码</label>
        <input type="text" id="deptCode" placeholder="如：DEPT_NK">
      </div>
      <div class="form-group">
        <label>描述</label>
        <textarea id="deptDesc" rows="3" placeholder="科室介绍"></textarea>
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="btn btn-default" onclick="AdminPages.closeDeptModal()">取消</button>
        <button class="btn btn-primary" onclick="AdminPages.createDepartment()">确认新增</button>
      </div>
    `;

    const modal = document.getElementById('deptModal');
    modal.innerHTML = html;
    modal.style.display = 'block';
  },

  async createDepartment() {
    const name = document.getElementById('deptName').value.trim();
    const code = document.getElementById('deptCode').value.trim();
    const description = document.getElementById('deptDesc').value.trim();

    if (!name) {
      showToast('请输入科室名称', 'warn');
      return;
    }

    try {
      await API.post('/api/departments', { name, code: code || undefined, description: description || undefined });
      showToast('科室创建成功', 'success');
      AdminPages.closeDeptModal();
      AdminPages.renderDepartmentManagement();
    } catch (error) {
      showToast(error.message || '创建失败', 'error');
    }
  },

  async showEditDepartment(deptId) {
    try {
      const dept = await API.get(`/api/departments/${deptId}`);

      const html = `
        <h3 style="margin-bottom: 20px;">编辑科室</h3>
        <div class="form-group">
          <label>科室名称 <span style="color: red;">*</span></label>
          <input type="text" id="editDeptName" value="${escapeHtml(dept.name || '')}">
        </div>
        <div class="form-group">
          <label>科室编码</label>
          <input type="text" id="editDeptCode" value="${escapeHtml(dept.code || '')}">
        </div>
        <div class="form-group">
          <label>描述</label>
          <textarea id="editDeptDesc" rows="3">${escapeHtml(dept.description || '')}</textarea>
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="btn btn-default" onclick="AdminPages.closeDeptModal()">取消</button>
          <button class="btn btn-primary" onclick="AdminPages.updateDepartment('${deptId}')">保存修改</button>
        </div>
      `;

      const modal = document.getElementById('deptModal');
      modal.innerHTML = html;
      modal.style.display = 'block';
    } catch (error) {
      showToast(error.message || '加载失败', 'error');
    }
  },

  async updateDepartment(deptId) {
    const name = document.getElementById('editDeptName').value.trim();
    const code = document.getElementById('editDeptCode').value.trim();
    const description = document.getElementById('editDeptDesc').value.trim();

    if (!name) {
      showToast('请输入科室名称', 'warn');
      return;
    }

    try {
      await API.put(`/api/departments/${deptId}`, { name, code: code || undefined, description: description || undefined });
      showToast('科室更新成功', 'success');
      AdminPages.closeDeptModal();
      AdminPages.renderDepartmentManagement();
    } catch (error) {
      showToast(error.message || '更新失败', 'error');
    }
  },

  async toggleDepartment(deptId) {
    try {
      await API.patch(`/api/departments/${deptId}/toggle-status`);
      showToast('科室状态已更新', 'success');
      AdminPages.renderDepartmentManagement();
    } catch (error) {
      showToast(error.message || '操作失败', 'error');
    }
  },

  closeDeptModal() {
    const modal = document.getElementById('deptModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  async renderDoctorManagement() {
    const contentEl = document.getElementById('content');
    if (!contentEl) return;

    contentEl.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0;">医生管理</h2>
        <button class="btn btn-primary" onclick="AdminPages.showCreateDoctor()">+ 新增医生</button>
      </div>
      <div class="card">
        <div style="text-align: center; padding: 60px; color: #999;">
          <div style="font-size: 40px; margin-bottom: 12px;">⏳</div>
          <p>加载中...</p>
        </div>
      </div>
      <div id="doctorModal" class="card" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 640px; max-height: 90vh; overflow-y: auto; z-index: 1000; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
      </div>
    `;

    try {
      const keyword = getParam('doctorKeyword') || '';
      const deptId = getParam('doctorDeptId') || '';
      const statusFilter = getParam('doctorStatus') || '';
      const page = parseInt(getParam('doctorPage') || '1', 10);
      const pageSize = parseInt(getParam('doctorPageSize') || '10', 10);

      const params = [];
      params.push('includeInactive=true');
      params.push(`page=${page}`);
      params.push(`pageSize=${pageSize}`);
      if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
      if (deptId) params.push(`departmentId=${deptId}`);
      if (statusFilter) params.push(`status=${statusFilter}`);

      const [doctorsRes, departmentsRes] = await Promise.all([
        API.get(`/api/doctors?${params.join('&')}`),
        API.get('/api/departments?includeInactive=true'),
      ]);

      const departments = departmentsRes || [];
      const deptList = Array.isArray(departments) ? departments : (departments.list || []);
      const result = doctorsRes || { list: [], total: 0, page: 1, totalPages: 1 };
      const doctorList = Array.isArray(result) ? result : (result.list || []);
      const total = result.total || doctorList.length;
      const currentPage = result.page || page;
      const totalPages = result.totalPages || Math.ceil(total / pageSize);

      const deptOptions = `<option value="">全部科室</option>` +
        (deptList || []).map(d =>
          `<option value="${d.id}" ${d.id === deptId ? 'selected' : ''}>${escapeHtml(d.name || '')}</option>`
        ).join('');

      const statusOptions = `
        <option value="">全部状态</option>
        <option value="ACTIVE" ${statusFilter === 'ACTIVE' ? 'selected' : ''}>启用</option>
        <option value="INACTIVE" ${statusFilter === 'INACTIVE' ? 'selected' : ''}>停用</option>
      `;

      const isAdmin = AppState.user && AppState.user.role === 'ADMIN';

      let tableHtml = '';
      if (!doctorList || doctorList.length === 0) {
        tableHtml = `
          <div class="empty">
            <div class="icon">👨‍⚕️</div>
            <p>暂无医生数据</p>
            <p style="color: #999; font-size: 13px; margin-top: 8px;">请新增医生以开始使用排班和预约功能</p>
            <button class="btn btn-primary" style="margin-top: 16px;" onclick="AdminPages.showCreateDoctor()">+ 新增医生</button>
          </div>
        `;
      } else {
        tableHtml = `<table class="table">
          <thead>
            <tr>
              <th>工号</th>
              <th>姓名</th>
              <th>科室</th>
              <th>职称</th>
              <th>联系方式</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>`;

        (doctorList || []).forEach(d => {
          const dept = d.department || {};
          const deptName = dept.name || '-';
          const isActive = d.status !== 'INACTIVE';
          const contact = d.phone || d.email || '-';

          tableHtml += `
            <tr>
              <td><code>${escapeHtml(d.employeeNo || '-')}</code></td>
              <td style="font-weight: 600;">${escapeHtml(d.realName || '')}</td>
              <td>${escapeHtml(deptName)}</td>
              <td>${escapeHtml(d.title || '-')}</td>
              <td>${escapeHtml(contact)}</td>
              <td>
                <span class="status-tag ${isActive ? 'status-success' : 'status-default'}">
                  ${isActive ? '启用' : '停用'}
                </span>
              </td>
              <td>${formatDateTime(d.createdAt)}</td>
              <td>
                <button class="btn btn-default btn-sm" onclick="AdminPages.showEditDoctor('${d.id}')">编辑</button>
                <button class="btn ${isActive ? 'btn-warning' : 'btn-success'} btn-sm" style="margin-left: 4px;" onclick="AdminPages.toggleDoctor('${d.id}')">
                  ${isActive ? '停用' : '启用'}
                </button>
                ${isAdmin ? `
                <button class="btn btn-info btn-sm" style="margin-left: 4px;" onclick="AdminPages.showResetPassword('${d.id}')">重置密码</button>
                <button class="btn btn-danger btn-sm" style="margin-left: 4px;" onclick="AdminPages.deleteDoctor('${d.id}')">删除</button>
                ` : ''}
              </td>
            </tr>
          `;
        });

        tableHtml += '</tbody></table>';
      }

      let paginationHtml = '';
      if (doctorList && doctorList.length > 0 && totalPages > 1) {
        paginationHtml = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
            <div style="color: #666; font-size: 13px;">
              共 ${total} 条，第 ${currentPage} / ${totalPages} 页
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-default btn-sm" ${currentPage <= 1 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''} onclick="AdminPages.goDoctorPage(${currentPage - 1})">上一页</button>
              ${this._renderPageNumbers(currentPage, totalPages)}
              <button class="btn btn-default btn-sm" ${currentPage >= totalPages ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''} onclick="AdminPages.goDoctorPage(${currentPage + 1})">下一页</button>
            </div>
          </div>
        `;
      }

      contentEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">医生管理</h2>
          <button class="btn btn-primary" onclick="AdminPages.showCreateDoctor()">+ 新增医生</button>
        </div>
        <div class="card">
          <div style="display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
              <label style="display: block; margin-bottom: 6px; font-size: 14px;">搜索姓名</label>
              <input type="text" id="filterDoctorKeyword" value="${escapeHtml(keyword)}" placeholder="按姓名搜索" onchange="AdminPages.filterDoctors()" class="form-control">
            </div>
            <div style="flex: 1; min-width: 200px;">
              <label style="display: block; margin-bottom: 6px; font-size: 14px;">科室</label>
              <select id="filterDoctorDept" onchange="AdminPages.filterDoctors()" class="form-control">
                ${deptOptions}
              </select>
            </div>
            <div style="flex: 1; min-width: 200px;">
              <label style="display: block; margin-bottom: 6px; font-size: 14px;">状态</label>
              <select id="filterDoctorStatus" onchange="AdminPages.filterDoctors()" class="form-control">
                ${statusOptions}
              </select>
            </div>
          </div>
          ${tableHtml}
          ${paginationHtml}
        </div>
        <div id="doctorModal" class="card" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 640px; max-height: 90vh; overflow-y: auto; z-index: 1000; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
        </div>
      `;
    } catch (error) {
      const contentEl = document.getElementById('content');
      if (contentEl) {
        contentEl.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0;">医生管理</h2>
            <button class="btn btn-primary" onclick="AdminPages.renderDoctorManagement()">重新加载</button>
          </div>
          <div class="card">
            <div style="text-align: center; padding: 60px; color: #faad14;">
              <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
              <p style="font-weight: 600;">加载失败</p>
              <p style="color: #999; font-size: 13px; margin-top: 8px;">${escapeHtml(error.message || '未知错误')}</p>
            </div>
          </div>
          <div id="doctorModal"></div>
        `;
      }
    }
  },

  _renderPageNumbers(current, total) {
    let html = '';
    const maxShow = 5;
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + maxShow - 1);
    start = Math.max(1, end - maxShow + 1);

    for (let i = start; i <= end; i++) {
      html += `<button class="btn btn-sm ${i === current ? 'btn-primary' : 'btn-default'}" onclick="AdminPages.goDoctorPage(${i})">${i}</button>`;
    }
    return html;
  },

  filterDoctors() {
    const keyword = document.getElementById('filterDoctorKeyword').value;
    const deptId = document.getElementById('filterDoctorDept').value;
    const statusFilter = document.getElementById('filterDoctorStatus').value;
    navigate('doctorManage', {
      doctorKeyword: keyword,
      doctorDeptId: deptId,
      doctorStatus: statusFilter,
      doctorPage: '1',
    });
  },

  goDoctorPage(p) {
    const keyword = getParam('doctorKeyword') || '';
    const deptId = getParam('doctorDeptId') || '';
    const statusFilter = getParam('doctorStatus') || '';
    navigate('doctorManage', {
      doctorKeyword: keyword,
      doctorDeptId: deptId,
      doctorStatus: statusFilter,
      doctorPage: String(p),
    });
  },

  async showCreateDoctor() {
    try {
      const departmentsRes = await API.get('/api/departments');
      const departments = departmentsRes || [];
      const deptList = Array.isArray(departments) ? departments : (departments.list || []);

      const deptOptions = `<option value="">请选择科室</option>` +
        (deptList || []).filter(d => d.status !== 'INACTIVE').map(d =>
          `<option value="${d.id}">${escapeHtml(d.name || '')}</option>`
        ).join('');

      const html = `
        <h3 style="margin-bottom: 20px;">新增医生</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label>登录账号 <span style="color: red;">*</span></label>
            <input type="text" id="newDoctorUsername" placeholder="登录用户名">
          </div>
          <div class="form-group">
            <label>初始密码 <span style="color: red;">*</span></label>
            <input type="text" id="newDoctorPassword" placeholder="至少6位" value="doctor123">
          </div>
          <div class="form-group">
            <label>医生姓名 <span style="color: red;">*</span></label>
            <input type="text" id="newDoctorName" placeholder="如：张医生">
          </div>
          <div class="form-group">
            <label>所属科室 <span style="color: red;">*</span></label>
            <select id="newDoctorDeptId">
              ${deptOptions}
            </select>
          </div>
          <div class="form-group">
            <label>工号 <span style="color: red;">*</span></label>
            <input type="text" id="newDoctorEmployeeNo" placeholder="如：DOC001">
          </div>
          <div class="form-group">
            <label>职称</label>
            <select id="newDoctorTitle">
              <option value="">请选择</option>
              <option value="住院医师">住院医师</option>
              <option value="主治医师">主治医师</option>
              <option value="副主任医师">副主任医师</option>
              <option value="主任医师">主任医师</option>
            </select>
          </div>
          <div class="form-group">
            <label>手机号</label>
            <input type="text" id="newDoctorPhone" placeholder="手机号">
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input type="email" id="newDoctorEmail" placeholder="邮箱地址">
          </div>
        </div>
        <div class="form-group">
          <label>擅长领域</label>
          <input type="text" id="newDoctorSpecialties" placeholder="如：心血管疾病、糖尿病">
        </div>
        <div class="form-group">
          <label>医生简介</label>
          <textarea id="newDoctorBio" rows="3" placeholder="医生简介"></textarea>
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="btn btn-default" onclick="AdminPages.closeDoctorModal()">取消</button>
          <button class="btn btn-primary" onclick="AdminPages.createDoctor()">确认新增</button>
        </div>
      `;

      const modal = document.getElementById('doctorModal');
      modal.innerHTML = html;
      modal.style.display = 'block';
    } catch (error) {
      showToast(error.message || '加载失败', 'error');
    }
  },

  async createDoctor() {
    const username = document.getElementById('newDoctorUsername').value.trim();
    const password = document.getElementById('newDoctorPassword').value.trim();
    const realName = document.getElementById('newDoctorName').value.trim();
    const departmentId = document.getElementById('newDoctorDeptId').value;
    const employeeNo = document.getElementById('newDoctorEmployeeNo').value.trim();
    const title = document.getElementById('newDoctorTitle').value;
    const phone = document.getElementById('newDoctorPhone').value.trim();
    const email = document.getElementById('newDoctorEmail').value.trim();
    const specialties = document.getElementById('newDoctorSpecialties').value.trim();
    const bio = document.getElementById('newDoctorBio').value.trim();

    if (!username || !password || !realName || !departmentId || !employeeNo) {
      showToast('请填写所有必填项', 'warn');
      return;
    }

    if (password.length < 6) {
      showToast('密码长度至少6位', 'warn');
      return;
    }

    try {
      await API.post('/api/doctors', {
        username,
        password,
        realName,
        departmentId,
        employeeNo,
        title: title || undefined,
        phone: phone || undefined,
        email: email || undefined,
        specialties: specialties || undefined,
        bio: bio || undefined,
      });
      showToast('医生创建成功。初始密码：doctor123，首次登录需修改密码', 'success');
      AdminPages.closeDoctorModal();
      AdminPages.renderDoctorManagement();
    } catch (error) {
      showToast(error.message || '创建失败', 'error');
    }
  },

  async showEditDoctor(doctorId) {
    try {
      const [doctor, departmentsRes] = await Promise.all([
        API.get(`/api/doctors/${doctorId}`),
        API.get('/api/departments?includeInactive=true'),
      ]);

      const departments = departmentsRes || [];
      const deptList = Array.isArray(departments) ? departments : (departments.list || []);

      const deptOptions = (deptList || []).map(d =>
        `<option value="${d.id}" ${d.id === doctor.departmentId ? 'selected' : ''}>${escapeHtml(d.name || '')}</option>`
      ).join('');

      const html = `
        <h3 style="margin-bottom: 20px;">编辑医生信息</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label>登录账号</label>
            <input type="text" value="${escapeHtml(doctor.username || '')}" disabled class="form-control" style="background: #f5f5f5;">
          </div>
          <div class="form-group">
            <label>工号</label>
            <input type="text" value="${escapeHtml(doctor.employeeNo || '')}" disabled class="form-control" style="background: #f5f5f5;">
          </div>
          <div class="form-group">
            <label>医生姓名 <span style="color: red;">*</span></label>
            <input type="text" id="editDoctorName" value="${escapeHtml(doctor.realName || '')}">
          </div>
          <div class="form-group">
            <label>所属科室 <span style="color: red;">*</span></label>
            <select id="editDoctorDeptId">
              ${deptOptions}
            </select>
          </div>
          <div class="form-group">
            <label>职称</label>
            <select id="editDoctorTitle">
              <option value="">请选择</option>
              <option value="住院医师" ${doctor.title === '住院医师' ? 'selected' : ''}>住院医师</option>
              <option value="主治医师" ${doctor.title === '主治医师' ? 'selected' : ''}>主治医师</option>
              <option value="副主任医师" ${doctor.title === '副主任医师' ? 'selected' : ''}>副主任医师</option>
              <option value="主任医师" ${doctor.title === '主任医师' ? 'selected' : ''}>主任医师</option>
            </select>
          </div>
          <div class="form-group">
            <label>状态</label>
            <select id="editDoctorStatus">
              <option value="ACTIVE" ${doctor.status === 'ACTIVE' ? 'selected' : ''}>启用</option>
              <option value="INACTIVE" ${doctor.status === 'INACTIVE' ? 'selected' : ''}>停用</option>
            </select>
          </div>
          <div class="form-group">
            <label>手机号</label>
            <input type="text" id="editDoctorPhone" value="${escapeHtml(doctor.phone || '')}">
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input type="email" id="editDoctorEmail" value="${escapeHtml(doctor.email || '')}">
          </div>
        </div>
        <div class="form-group">
          <label>擅长领域</label>
          <input type="text" id="editDoctorSpecialties" value="${escapeHtml(doctor.specialties || '')}">
        </div>
        <div class="form-group">
          <label>医生简介</label>
          <textarea id="editDoctorBio" rows="3">${escapeHtml(doctor.bio || '')}</textarea>
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="btn btn-default" onclick="AdminPages.closeDoctorModal()">取消</button>
          <button class="btn btn-primary" onclick="AdminPages.updateDoctor('${doctorId}')">保存修改</button>
        </div>
      `;

      const modal = document.getElementById('doctorModal');
      modal.innerHTML = html;
      modal.style.display = 'block';
    } catch (error) {
      showToast(error.message || '加载失败', 'error');
    }
  },

  async updateDoctor(doctorId) {
    const realName = document.getElementById('editDoctorName').value.trim();
    const departmentId = document.getElementById('editDoctorDeptId').value;
    const title = document.getElementById('editDoctorTitle').value;
    const status = document.getElementById('editDoctorStatus').value;
    const phone = document.getElementById('editDoctorPhone').value.trim();
    const email = document.getElementById('editDoctorEmail').value.trim();
    const specialties = document.getElementById('editDoctorSpecialties').value.trim();
    const bio = document.getElementById('editDoctorBio').value.trim();

    if (!realName || !departmentId) {
      showToast('请填写所有必填项', 'warn');
      return;
    }

    try {
      await API.put(`/api/doctors/${doctorId}`, {
        realName,
        departmentId,
        title: title || undefined,
        status: status || undefined,
        phone: phone || undefined,
        email: email || undefined,
        specialties: specialties || undefined,
        bio: bio || undefined,
      });
      showToast('医生信息更新成功', 'success');
      AdminPages.closeDoctorModal();
      AdminPages.renderDoctorManagement();
    } catch (error) {
      showToast(error.message || '更新失败', 'error');
    }
  },

  async toggleDoctor(doctorId) {
    try {
      await API.patch(`/api/doctors/${doctorId}/toggle-status`);
      showToast('医生状态已更新', 'success');
      AdminPages.renderDoctorManagement();
    } catch (error) {
      showToast(error.message || '操作失败', 'error');
    }
  },

  showResetPassword(doctorId) {
    const html = `
      <h3 style="margin-bottom: 20px;">重置医生密码</h3>
      <div class="form-group">
        <label>新密码</label>
        <input type="text" value="doctor123（固定初始密码）" disabled class="form-control" style="background: #f5f5f5;">
      </div>
      <p style="color: #faad14; font-size: 13px; margin-bottom: 16px;">
        ⚠️ 重置后密码为：doctor123，医生首次登录时将被强制修改密码
      </p>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="btn btn-default" onclick="AdminPages.closeDoctorModal()">取消</button>
        <button class="btn btn-primary" onclick="AdminPages.resetDoctorPassword('${doctorId}')">确认重置</button>
      </div>
    `;

    const modal = document.getElementById('doctorModal');
    modal.innerHTML = html;
    modal.style.display = 'block';
  },

  async resetDoctorPassword(doctorId) {
    try {
      await API.patch(`/api/doctors/${doctorId}/reset-password`);
      showToast('密码已重置为 doctor123，医生首次登录须修改', 'success');
      AdminPages.closeDoctorModal();
    } catch (error) {
      showToast(error.message || '重置失败', 'error');
    }
  },

  async deleteDoctor(doctorId) {
    if (!confirm('确定要删除该医生吗？\n\n注意：\n• 存在未来排班的医生无法删除\n• 存在待就诊预约的医生无法删除\n\n如需保留历史记录，建议使用"停用"功能。')) {
      return;
    }

    try {
      await API.delete(`/api/doctors/${doctorId}`);
      showToast('医生已删除', 'success');
      AdminPages.renderDoctorManagement();
    } catch (error) {
      showToast(error.message || '删除失败', 'error');
    }
  },

  closeDoctorModal() {
    const modal = document.getElementById('doctorModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  async renderScheduleManagement() {
    try {
      const [departmentsRes, schedulesRes] = await Promise.all([
        API.get('/api/departments'),
        API.get('/api/schedules'),
      ]);
      const departments = departmentsRes || [];
      const schedules = schedulesRes || [];
      const deptList = Array.isArray(departments) ? departments : (departments.list || []);
      const scheduleList = Array.isArray(schedules) ? schedules : (schedules.list || []);

      let tableHtml = '';
      if (!scheduleList || scheduleList.length === 0) {
        tableHtml = `
          <div class="empty">
            <div class="icon">📅</div>
            <p>暂无排班数据</p>
            <button class="btn btn-primary" style="margin-top: 16px;" onclick="AdminPages.showCreateSchedule()">+ 新增排班</button>
          </div>
        `;
      } else {
        tableHtml = `<table class="table">
          <thead>
            <tr>
              <th>日期</th>
              <th>时段</th>
              <th>科室</th>
              <th>医生</th>
              <th>号源数</th>
              <th>剩余号源</th>
              <th>挂号费</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>`;

        (scheduleList || []).forEach(s => {
          const doctor = s.doctor || {};
          const dept = s.department || {};
          const inv = s.slotInventory || {};
          const isCancelled = !!s.isCancelled;

          tableHtml += `
            <tr>
              <td>${formatDate(s.date)}</td>
              <td>${getTimeSlotText(s.timeSlot)}</td>
              <td>${escapeHtml(dept.name || '-')}</td>
              <td>${escapeHtml(doctor.realName || '-')}</td>
              <td>${inv.totalSlots || s.maxSlots || 0}</td>
              <td>${inv.availableSlots || 0}</td>
              <td>¥${s.fee || 0}</td>
              <td>
                <span class="status-tag ${isCancelled ? 'status-default' : 'status-success'}">
                  ${isCancelled ? '已停诊' : '正常'}
                </span>
              </td>
              <td>
                ${!isCancelled ? `<button class="btn btn-warning btn-sm" onclick="AdminPages.showCancelSchedule('${s.id}')">停诊</button>` : ''}
              </td>
            </tr>
          `;
        });

        tableHtml += '</tbody></table>';
      }

      const deptOptions = (deptList || []).filter(d => d.status !== 'INACTIVE').map(d =>
        `<option value="${d.id}">${escapeHtml(d.name || '')}</option>`
      ).join('');

      document.getElementById('content').innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">排班管理</h2>
          <button class="btn btn-primary" onclick="AdminPages.showCreateSchedule()">+ 新增排班</button>
        </div>
        <div class="card">
          ${tableHtml}
        </div>
        <div id="scheduleModal" class="card" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 500px; z-index: 1000; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
        </div>
      `;

      window._deptOptions = deptOptions;
    } catch (error) {
      showToast(error.message || '加载失败', 'error');
    }
  },

  async showCreateSchedule() {
    try {
      const doctorsRes = await API.get('/api/doctors');
      const doctors = doctorsRes || [];
      const doctorList = Array.isArray(doctors) ? doctors : (doctors.list || []);

      const doctorOptions = (doctorList || []).filter(d => d.status !== 'INACTIVE').map(d =>
        `<option value="${d.id}">${escapeHtml(d.realName || '')}</option>`
      ).join('');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const html = `
        <h3 style="margin-bottom: 20px;">新增排班</h3>
        <div class="form-group">
          <label>科室 <span style="color: red;">*</span></label>
          <select id="scheduleDeptId">
            ${window._deptOptions || '<option value="">请先创建科室</option>'}
          </select>
        </div>
        <div class="form-group">
          <label>医生 <span style="color: red;">*</span></label>
          <select id="scheduleDoctorId">
            ${doctorOptions || '<option value="">请先创建医生</option>'}
          </select>
        </div>
        <div class="form-group">
          <label>排班日期 <span style="color: red;">*</span></label>
          <input type="date" id="scheduleDate" min="${tomorrowStr}" value="${tomorrowStr}">
        </div>
        <div class="form-group">
          <label>时段 <span style="color: red;">*</span></label>
          <select id="scheduleTimeSlot">
            <option value="MORNING">上午</option>
            <option value="AFTERNOON">下午</option>
            <option value="EVENING">晚上</option>
          </select>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label>号源数量 <span style="color: red;">*</span></label>
            <input type="number" id="scheduleMaxSlots" value="20" min="1">
          </div>
          <div class="form-group">
            <label>挂号费（元） <span style="color: red;">*</span></label>
            <input type="number" id="scheduleFee" value="100" min="0">
          </div>
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="btn btn-default" onclick="AdminPages.closeScheduleModal()">取消</button>
          <button class="btn btn-primary" onclick="AdminPages.createSchedule()">确认新增</button>
        </div>
      `;

      const modal = document.getElementById('scheduleModal');
      modal.innerHTML = html;
      modal.style.display = 'block';
    } catch (error) {
      showToast(error.message || '加载失败', 'error');
    }
  },

  async createSchedule() {
    const departmentId = document.getElementById('scheduleDeptId').value;
    const doctorId = document.getElementById('scheduleDoctorId').value;
    const date = document.getElementById('scheduleDate').value;
    const timeSlot = document.getElementById('scheduleTimeSlot').value;
    const maxSlots = parseInt(document.getElementById('scheduleMaxSlots').value, 10);
    const fee = parseFloat(document.getElementById('scheduleFee').value);

    if (!departmentId || !doctorId || !date || !timeSlot || !maxSlots || isNaN(fee)) {
      showToast('请填写所有必填项', 'warn');
      return;
    }

    try {
      await API.post('/api/schedules', {
        doctorId,
        departmentId,
        date,
        timeSlot,
        maxSlots,
        fee,
      });
      showToast('排班创建成功', 'success');
      AdminPages.closeScheduleModal();
      AdminPages.renderScheduleManagement();
    } catch (error) {
      showToast(error.message || '创建失败', 'error');
    }
  },

  showCancelSchedule(scheduleId) {
    const html = `
      <h3 style="margin-bottom: 20px;">停诊确认</h3>
      <div class="form-group">
        <label>停诊原因 <span style="color: red;">*</span></label>
        <textarea id="cancelReason" rows="3" placeholder="请填写停诊原因，将通知患者并自动触发退款"></textarea>
      </div>
      <p style="color: #faad14; font-size: 13px; margin-bottom: 16px;">
        ⚠️ 停诊后将：<br>1. 自动通知所有已预约患者<br>2. 自动触发退款流程
      </p>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="btn btn-default" onclick="AdminPages.closeScheduleModal()">取消</button>
        <button class="btn btn-danger" onclick="AdminPages.cancelSchedule('${scheduleId}')">确认停诊</button>
      </div>
    `;

    const modal = document.getElementById('scheduleModal');
    modal.innerHTML = html;
    modal.style.display = 'block';
  },

  async cancelSchedule(scheduleId) {
    const reason = document.getElementById('cancelReason').value.trim();
    if (!reason) {
      showToast('请填写停诊原因', 'warn');
      return;
    }

    try {
      await API.post(`/api/schedules/${scheduleId}/cancel`, { reason });
      showToast('停诊成功，已通知患者并触发退款', 'success');
      AdminPages.closeScheduleModal();
      AdminPages.renderScheduleManagement();
    } catch (error) {
      showToast(error.message || '操作失败', 'error');
    }
  },

  closeScheduleModal() {
    const modal = document.getElementById('scheduleModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  async renderRefundManagement() {
    try {
      const refunds = await API.get('/api/refunds') || [];
      const refundList = Array.isArray(refunds) ? refunds : (refunds.list || []);

      let tableHtml = '';
      if (!refundList || refundList.length === 0) {
        tableHtml = `
          <div class="empty">
            <div class="icon">💰</div>
            <p>暂无退款申请</p>
          </div>
        `;
      } else {
        tableHtml = `<table class="table">
          <thead>
            <tr>
              <th>退款编号</th>
              <th>患者</th>
              <th>金额</th>
              <th>退款原因</th>
              <th>状态</th>
              <th>申请时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>`;

        (refundList || []).forEach(r => {
          const statusText = getStatusText(r.status);
          const statusClass = getStatusClass(r.status);
          tableHtml += `
            <tr>
              <td><code>${r.id.substring(0, 8)}</code></td>
              <td>${escapeHtml((r.patient && r.patient.realName) || '-')}</td>
              <td>¥${r.amount || 0}</td>
              <td>${escapeHtml(r.reason || '-')}</td>
              <td><span class="status-tag ${statusClass}">${statusText}</span></td>
              <td>${formatDateTime(r.createdAt)}</td>
              <td>
                ${r.status === 'PENDING' ? `<button class="btn btn-success btn-sm" onclick="AdminPages.processRefund('${r.id}')">处理退款</button>` : ''}
              </td>
            </tr>
          `;
        });
        tableHtml += '</tbody></table>';
      }

      document.getElementById('content').innerHTML = `
        <div style="margin-bottom: 20px;">
          <h2 style="margin: 0;">退款管理</h2>
        </div>
        <div class="card">
          ${tableHtml}
        </div>
      `;
    } catch (error) {
      showToast(error.message || '加载失败', 'error');
    }
  },

  async processRefund(refundId) {
    try {
      await API.post(`/api/refunds/${refundId}/process`);
      showToast('退款处理成功', 'success');
      AdminPages.renderRefundManagement();
    } catch (error) {
      showToast(error.message || '处理失败', 'error');
    }
  },

  async renderLogs() {
    const content = document.getElementById('content');

    content.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h2 style="margin: 0;">操作日志</h2>
      </div>
      <div class="card">${showLoadingSkeleton(8)}</div>
    `;

    try {
      const logs = await API.get('/api/logs');
      const logList = safeArray(logs);

      let tableHtml = '';
      if (!logList || logList.length === 0) {
        tableHtml = showEmptyPage('📋', '暂无操作日志');
      } else {
        tableHtml = `<table class="table">
          <thead>
            <tr>
              <th>操作类型</th>
              <th>操作人</th>
              <th>内容</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>`;

        logList.forEach(l => {
          tableHtml += `
            <tr>
              <td><span class="status-tag status-info">${escapeHtml(safeValue(l, 'type', '-'))}</span></td>
              <td>${escapeHtml(safeValue(l, 'operator.realName') || '-')}</td>
              <td>${escapeHtml(safeValue(l, 'content', '-'))}</td>
              <td>${formatDateTime(safeValue(l, 'createdAt', ''))}</td>
            </tr>
          `;
        });
        tableHtml += '</tbody></table>';
      }

      content.innerHTML = `
        <div style="margin-bottom: 20px;">
          <h2 style="margin: 0;">操作日志</h2>
        </div>
        <div class="card">
          ${tableHtml}
        </div>
      `;
    } catch (error) {
      showErrorPage(error.message || '加载操作日志失败', function() { AdminPages.renderLogs(); });
    }
  },

  async renderNotifications() {
    const content = document.getElementById('content');

    content.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h2 style="margin: 0;">通知中心</h2>
      </div>
      ${showLoadingSkeleton(5)}
    `;

    try {
      const notifications = await API.get('/api/notifications');
      const notifList = safeArray(notifications);

      let html = '';
      if (!notifList || notifList.length === 0) {
        html = showEmptyPage('🔔', '暂无通知');
      } else {
        html = `<div class="notification-list">`;
        notifList.forEach(n => {
          html += `
            <div class="card notification-item" style="margin-bottom: 12px; padding: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <strong>${escapeHtml(safeValue(n, 'title', ''))}</strong>
                <span style="color: #999; font-size: 12px;">${formatDateTime(safeValue(n, 'createdAt', ''))}</span>
              </div>
              <div style="color: #666; font-size: 14px;">${escapeHtml(safeValue(n, 'content', ''))}</div>
            </div>
          `;
        });
        html += '</div>';
      }

      content.innerHTML = `
        <div style="margin-bottom: 20px;">
          <h2 style="margin: 0;">通知中心</h2>
        </div>
        ${html}
      `;
    } catch (error) {
      showErrorPage(error.message || '加载通知失败', function() { AdminPages.renderNotifications(); });
    }
  },
};

window.AdminPages = AdminPages;
