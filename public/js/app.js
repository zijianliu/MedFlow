const AppState = {
  user: null,
  token: null,
  
  init() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      this.token = token;
      this.user = JSON.parse(user);
    }
  },
  
  setAuth(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  
  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  isLoggedIn() {
    return !!this.token;
  },
  
  hasRole(role) {
    return this.user && this.user.role === role;
  }
};

const API = {
  async request(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (AppState.token) {
      headers['Authorization'] = `Bearer ${AppState.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMessage = `请求失败 (${response.status})`;
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            const text = await response.text();
            if (text && text.length < 200) {
              errorMessage = text;
            }
          }
        } catch (e) {
          // ignore parse errors
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('服务器返回格式错误，请检查接口地址');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.message && error.message.includes('token')) {
        AppState.clearAuth();
        showToast('登录已过期，请重新登录', 'error');
        setTimeout(() => renderPage(), 1000);
      }
      throw error;
    }
  },
  
  get(url) {
    return this.request(url, { method: 'GET' });
  },
  
  post(url, data) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  put(url, data) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  patch(url, data) {
    return this.request(url, {
      method: 'PATCH',
      body: JSON.stringify(data || {}),
    });
  },
  
  delete(url) {
    return this.request(url, { method: 'DELETE' });
  },
};

function safeArray(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.list)) return data.list;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.rows)) return data.rows;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.records)) return data.records;
  return [];
}

function safeValue(obj, path, defaultValue = '') {
  if (!obj || typeof obj !== 'object') return defaultValue;
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result === null || result === undefined) return defaultValue;
    result = result[key];
  }
  return result === null || result === undefined ? defaultValue : result;
}

function showErrorPage(message, retryCallback) {
  const content = document.getElementById('content');
  if (!content) return;
  content.innerHTML = `
    <div class="card" style="text-align: center; padding: 48px 24px;">
      <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
      <h3 style="margin-bottom: 8px; color: #ff4d4f;">加载失败</h3>
      <p style="color: #666; margin-bottom: 24px;">${escapeHtml(message)}</p>
      ${retryCallback ? `<button class="btn btn-primary" onclick="(${retryCallback.toString()})()">重新加载</button>` : ''}
    </div>
  `;
}

function showEmptyPage(icon, message, actionHtml = '') {
  return `
    <div class="empty">
      <div class="icon">${icon}</div>
      <p>${escapeHtml(message)}</p>
      ${actionHtml}
    </div>
  `;
}

function showLoadingSkeleton(lineCount = 5) {
  let html = '<div class="loading-skeleton">';
  for (let i = 0; i < lineCount; i++) {
    html += '<div class="skeleton-line" style="height: 20px; margin-bottom: 12px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: skeletonShimmer 1.5s infinite; border-radius: 4px;"></div>';
  }
  html += '</div>';
  return html;
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideDown 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateTime(date) {
  const d = new Date(date);
  return `${formatDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getTimeSlotText(slot) {
  const map = {
    'MORNING': '上午',
    'AFTERNOON': '下午',
    'EVENING': '晚上',
  };
  return map[slot] || slot;
}

function getStatusText(status) {
  const map = {
    'PENDING_PAYMENT': '待支付',
    'CANCELLED': '已取消',
    'TIMED_OUT': '已超时',
    'PENDING_VISIT': '待就诊',
    'CHECKED_IN': '已签到',
    'IN_VISIT': '就诊中',
    'COMPLETED': '已完成',
    'MISSED': '已过号',
    'CLINIC_CANCELLED_REFUND': '停诊待退款',
    'REFUNDING': '退款中',
    'REFUNDED': '已退款',
  };
  return map[status] || status;
}

function getStatusClass(status) {
  const map = {
    'PENDING_PAYMENT': 'status-warn',
    'CANCELLED': 'status-default',
    'TIMED_OUT': 'status-default',
    'PENDING_VISIT': 'status-info',
    'CHECKED_IN': 'status-success',
    'IN_VISIT': 'status-info',
    'COMPLETED': 'status-success',
    'MISSED': 'status-danger',
    'CLINIC_CANCELLED_REFUND': 'status-warn',
    'REFUNDING': 'status-warn',
    'REFUNDED': 'status-success',
  };
  return map[status] || 'status-default';
}

function getRoleText(role) {
  const map = {
    'PATIENT': '患者',
    'DOCTOR': '医生',
    'DEPT_ADMIN': '科室管理员',
    'FINANCE': '财务人员',
    'ADMIN': '系统管理员',
  };
  return map[role] || role;
}

function maskIdCard(idCard) {
  if (!idCard) return '';
  if (idCard.length < 8) return idCard;
  return idCard.slice(0, 4) + '********' + idCard.slice(-4);
}

function maskPhone(phone) {
  if (!phone) return '';
  if (phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

function maskName(name) {
  if (!name) return '';
  if (name.length <= 1) return name;
  return name[0] + '*'.repeat(name.length - 1);
}

function navigate(page, params = {}) {
  const url = new URL(window.location.href);
  url.searchParams.set('page', page);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
  });
  window.history.pushState({}, '', url.toString());
  renderPage();
}

function getParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
