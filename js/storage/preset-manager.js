import { designHistory } from '../design-history.js';
import { t, applyTranslations } from '../i18n.js';
import { ticketStore } from '../core/store.js';

/**
 * RaiRaiTei Queue Ticket Studio — Preset & Storage Manager (Sprint 7)
 * Quản lý lưu trữ mẫu thiết kế tự tạo (Custom Presets) vào LocalStorage
 * Hỗ trợ tạo ảnh Thumbnail thu nhỏ tự động, Xuất/Nhập file JSON chia sẻ giữa các chi nhánh
 * Kế thừa tinh thần Reactive State & Zero-Dependency từ dotslashgabut/idcardgenerator và nanostores
 */


const STORAGE_KEY = 'rairaitei_custom_presets_v1';

/**
 * Bộ tạo ID ngẫu nhiên duy nhất
 */
function generateId() {
  return 'preset_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
}

/**
 * Helper thông báo an toàn đa môi trường
 */
function showAlert(msg) {
  if (typeof alert === 'function') {
    alert(msg);
  } else {
    console.log('[PresetManager Alert]:', msg);
  }
}

function showConfirm(msg) {
  if (typeof confirm === 'function') {
    return confirm(msg);
  }
  return true;
}

function showPrompt(msg, defaultVal) {
  if (typeof prompt === 'function') {
    return prompt(msg, defaultVal);
  }
  return defaultVal;
}

/**
 * Đọc danh sách presets từ localStorage an toàn
 */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('[PresetManager] Không thể đọc localStorage:', e);
    return [];
  }
}

/**
 * Ghi danh sách presets vào localStorage
 */
// GĐ3 vé 3.2: ước lượng dung lượng localStorage (ký tự x 2 byte UTF-16).
// Hạn mức bảo thủ 5 MB — mức phổ biến của trình duyệt di động.
const QUOTA_LIMIT_BYTES = 5 * 1024 * 1024;
function estimateStorageUsage() {
  let bytes = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key) || '';
      bytes += (key.length + value.length) * 2;
    }
  } catch (e) { /* localStorage không khả dụng: coi như 0 */ }
  return bytes;
}

function saveToStorage(presets) {
  const payload = JSON.stringify(presets);
  // Chặn trước khi ghi nếu dự kiến vượt hạn mức — không để lỗi lặng lẽ.
  try {
    const currentRaw = localStorage.getItem(STORAGE_KEY) || '';
    const projected = estimateStorageUsage()
      - (STORAGE_KEY.length + currentRaw.length) * 2
      + (STORAGE_KEY.length + payload.length) * 2;
    if (projected > QUOTA_LIMIT_BYTES) {
      showAlert(t ? t('storage_quota_full') : 'Bộ nhớ trình duyệt đã đầy! Hãy xóa bớt một số mẫu cũ.');
      return false;
    }
    if (projected > QUOTA_LIMIT_BYTES * 0.8 && !sessionStorage.getItem('rairaitei_quota_warned')) {
      sessionStorage.setItem('rairaitei_quota_warned', '1');
      showAlert(t ? t('storage_quota_warning') : 'Bộ nhớ trình duyệt đã dùng trên 80%. Nên xóa bớt mẫu cũ hoặc xuất JSON để giải phóng.');
    }
  } catch (e) { /* không ước lượng được thì vẫn thử ghi như cũ */ }
  try {
    localStorage.setItem(STORAGE_KEY, payload);
    return true;
  } catch (e) {
    console.error('[PresetManager] Lỗi khi lưu localStorage (có thể đầy bộ nhớ):', e);
    if (e.name === 'QuotaExceededError') {
      showAlert(t ? t('storage_quota_full') : 'Bộ nhớ trình duyệt đã đầy! Hãy xóa bớt một số mẫu cũ.');
    }
    return false;
  }
}

/**
 * Tự động tạo ảnh Thumbnail thu nhỏ (120x218 px ~ tỉ lệ vé 43x78mm)
 * Sử dụng html2canvas nếu có sẵn hoặc Canvas mô phỏng trực tiếp
 */
async function generateThumbnail() {
  const ticketElem = document.querySelector('.ticket-content') || document.querySelector('.ticket-canvas-wrapper');
  if (!ticketElem) return null;

  try {
    if (typeof window.html2canvas === 'function') {
      const canvas = await window.html2canvas(ticketElem, {
        scale: 0.35,
        logging: false,
        useCORS: true,
        backgroundColor: null
      });
      return canvas.toDataURL('image/jpeg', 0.82);
    }
  } catch (err) {
    console.warn('[PresetManager] html2canvas thumbnail fallback:', err);
  }

  // Fallback nếu không có html2canvas hoặc bị lỗi
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 218;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fcd116';
      ctx.fillRect(0, 0, 120, 218);
      ctx.strokeStyle = '#e60012';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, 112, 210);
      ctx.fillStyle = '#111111';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const numElem = document.querySelector('.ticket-number') || document.getElementById('ticket-number');
      const numText = numElem ? numElem.textContent.trim() : '22';
      ctx.fillText(numText, 60, 109);
      return canvas.toDataURL('image/jpeg', 0.8);
    }
  } catch (e) {
    console.warn('[PresetManager] Canvas fallback error:', e);
  }

  return null;
}

// Thu nhỏ thumbnail nếu vượt ngưỡng: vẽ lại lên canvas 90x164, JPEG 0,72.
async function capThumbnailSize(dataUrl) {
  if (!dataUrl || dataUrl.length <= 40000) return dataUrl;
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = dataUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = 90;
    canvas.height = 164;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const shrunk = canvas.toDataURL('image/jpeg', 0.72);
    return shrunk.length < dataUrl.length ? shrunk : dataUrl;
  } catch (e) {
    return dataUrl;
  }
}

const PresetManager = {
  // GĐ3 vé 3.2: cho UI/test biết dung lượng đang dùng
  estimateStorageUsage,
  /**
   * Lấy toàn bộ danh sách presets
   */
  getAll() {
    return loadFromStorage();
  },

  /**
   * Lấy 1 preset theo ID
   */
  getById(id) {
    const list = loadFromStorage();
    return list.find(item => item.id === id) || null;
  },

  /**
   * Lưu thiết kế hiện tại thành một preset mới
   */
  async saveCurrent(name) {
    const trimmedName = (name || '').trim();
    const defaultName = (t ? t('preset_default_name') : 'Mẫu tùy chỉnh') + ' ' + (loadFromStorage().length + 1);
    const finalName = trimmedName || defaultName;

    // 1. Thu thập dữ liệu thiết kế toàn diện
    const design = designHistory && typeof designHistory.collect === 'function'
      ? designHistory.collect()
      : null;

    if (!design) {
      throw new Error('Không thể thu thập dữ liệu thiết kế từ designHistory!');
    }

    // 2. Tự động sinh thumbnail (giới hạn ~40K ký tự ~ 30 KB ảnh — GĐ3 vé 3.2)
    const thumbnail = await capThumbnailSize(await generateThumbnail());

    // 3. Đóng gói Preset Object
    const newPreset = {
      id: generateId(),
      name: finalName,
      template: design.template || 'standard',
      savedAt: new Date().toISOString(),
      thumbnail: thumbnail,
      design: design
    };

    const list = loadFromStorage();
    list.unshift(newPreset); // Đưa lên đầu danh sách
    const success = saveToStorage(list);

    if (success) {
      this.renderUI();
      return newPreset;
    }
    return null;
  },

  /**
   * Áp dụng (Nạp) preset vào thiết kế hiện tại
   */
  apply(id) {
    const preset = this.getById(id);
    if (!preset || !preset.design) {
      console.error('[PresetManager] Không tìm thấy preset với ID:', id);
      return false;
    }

    try {
      if (designHistory && typeof designHistory.apply === 'function') {
        const applied = designHistory.apply(preset.design);
        if (applied) {
          // Đồng bộ snapshot vào ticketStore nếu có
          if (ticketStore && typeof ticketStore.actions?.applySnapshot === 'function') {
            if (preset.design.storeSnapshot) {
              ticketStore.actions.applySnapshot(preset.design.storeSnapshot);
            }
          }
          // Thông báo cập nhật layout
          if (typeof applyTranslations === 'function') {
            applyTranslations();
          }
          return true;
        }
      }
    } catch (err) {
      console.error('[PresetManager] Lỗi khi áp dụng preset:', err);
    }
    return false;
  },

  /**
   * Đổi tên preset
   */
  rename(id, newName) {
    const trimmed = (newName || '').trim();
    if (!trimmed) return false;

    const list = loadFromStorage();
    const target = list.find(item => item.id === id);
    if (!target) return false;

    target.name = trimmed;
    target.updatedAt = new Date().toISOString();
    const success = saveToStorage(list);
    if (success) this.renderUI();
    return success;
  },

  /**
   * Xóa 1 preset
   */
  delete(id) {
    const list = loadFromStorage();
    const filtered = list.filter(item => item.id !== id);
    if (filtered.length === list.length) return false;

    const success = saveToStorage(filtered);
    if (success) this.renderUI();
    return success;
  },

  /**
   * Xóa toàn bộ presets
   */
  clearAll() {
    const success = saveToStorage([]);
    if (success) this.renderUI();
    return success;
  },

  /**
   * Xuất 1 preset thành file JSON tải về
   */
  exportSingle(id) {
    const preset = this.getById(id);
    if (!preset) return;

    const blob = new Blob([JSON.stringify(preset, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sanitizedName = preset.name.replace(/[^a-zA-Z0-9_\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u00C0-\u1EF9]/g, '_');
    a.download = `RaiRaiTei_Preset_${sanitizedName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Xuất toàn bộ danh sách presets thành 1 file JSON
   */
  exportAll() {
    const list = loadFromStorage();
    if (list.length === 0) {
      showAlert(t ? t('preset_empty_export') : 'Chưa có mẫu nào để xuất!');
      return;
    }

    const bundle = {
      app: 'RaiRaiTei Queue Ticket',
      format: 'rairaitei-presets-bundle',
      version: 1,
      exportedAt: new Date().toISOString(),
      total: list.length,
      presets: list
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const d = new Date();
    const timeStr = `${d.getFullYear()}${('0' + (d.getMonth() + 1)).slice(-2)}${('0' + d.getDate()).slice(-2)}`;
    a.download = `RaiRaiTei_All_Presets_${timeStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Nhập preset từ file JSON
   */
  async importFromJsonString(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      // GĐ3 vé 3.3: tệp của phiên bản app MỚI hơn -> báo rõ, không nhập hỏng.
      const supported = (designHistory && designHistory.SUPPORTED_VERSION) || 1;
      const fileVersion = Math.max(
        Number(data.version) || 0,
        Number(data.design && data.design.version) || 0,
        ...(Array.isArray(data.presets) ? data.presets.map(p => Number(p.design && p.design.version) || 0) : [])
      );
      if (fileVersion > supported) {
        showAlert(t ? t('preset_import_newer') : 'Tệp này được tạo bởi phiên bản app mới hơn. Hãy cập nhật app rồi thử lại.');
        return false;
      }
      let importedCount = 0;
      const currentList = loadFromStorage();

      // Trường hợp 1: Bundle chứa nhiều preset
      if (data.format === 'rairaitei-presets-bundle' && Array.isArray(data.presets)) {
        data.presets.forEach(p => {
          if (p.design && p.design.format === 'rairaitei-design') {
            p.id = generateId(); // Tái sinh ID để không trùng lặp
            currentList.unshift(p);
            importedCount++;
          }
        });
      }
      // Trường hợp 2: 1 preset đơn lẻ có bọc Preset object
      else if (data.design && data.design.format === 'rairaitei-design') {
        data.id = generateId();
        currentList.unshift(data);
        importedCount = 1;
      }
      // Trường hợp 3: Tệp export cũ của designHistory (trực tiếp rairaitei-design)
      else if (data.format === 'rairaitei-design') {
        const newPreset = {
          id: generateId(),
          name: (t ? t('preset_imported_name') : 'Mẫu nhập') + ' ' + (currentList.length + 1),
          template: data.template || 'standard',
          savedAt: data.savedAt || new Date().toISOString(),
          thumbnail: null,
          design: data
        };
        currentList.unshift(newPreset);
        importedCount = 1;
      } else {
        throw new Error('Định dạng tệp JSON không hợp lệ!');
      }

      if (importedCount > 0) {
        saveToStorage(currentList);
        this.renderUI();
        showAlert((t ? t('preset_import_success') : 'Đã nhập thành công {count} mẫu thiết kế!').replace('{count}', importedCount));
        return true;
      } else {
        showAlert(t ? t('preset_import_invalid') : 'Không tìm thấy mẫu thiết kế hợp lệ trong tệp!');
        return false;
      }
    } catch (err) {
      console.error('[PresetManager] Lỗi import file JSON:', err);
      showAlert(t ? t('preset_import_error') : 'Lỗi khi đọc file JSON! Vui lòng kiểm tra định dạng.');
      return false;
    }
  },

  /**
   * Render giao diện danh sách Presets trong #panel-saved
   */
  renderUI() {
    const container = document.getElementById('saved-presets-container');
    const countBadge = document.getElementById('saved-presets-count');
    if (!container) return;

    const list = loadFromStorage();
    if (countBadge) {
      countBadge.textContent = list.length;
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="preset-empty-state text-center py-6 px-4 bg-gray-800/60 rounded-xl border border-dashed border-gray-700">
          <div class="text-3xl mb-2">🔖</div>
          <p class="text-xs font-bold text-gray-300 mb-1" id="preset_empty_title">${t ? t('preset_empty_title') : 'Chưa có mẫu nào được lưu'}</p>
          <p class="text-[11px] text-gray-500 leading-relaxed" id="preset_empty_desc">${t ? t('preset_empty_desc') : 'Tùy chỉnh vé theo ý muốn, đặt tên và nhấn "Lưu mẫu này" ở trên để lưu vào bộ sưu tập.'}</p>
        </div>
      `;
      return;
    }

    let html = '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">';
    list.forEach(preset => {
      const dateObj = new Date(preset.savedAt || Date.now());
      const timeFormatted = `${dateObj.getFullYear()}/${('0' + (dateObj.getMonth() + 1)).slice(-2)}/${('0' + dateObj.getDate()).slice(-2)} ${('0' + dateObj.getHours()).slice(-2)}:${('0' + dateObj.getMinutes()).slice(-2)}`;
      const templateLabel = preset.template === 'spring' ? '🌸 春 / Mùa xuân' : '⭐ 標準 / Tiêu chuẩn';
      const thumbSrc = preset.thumbnail || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="218" viewBox="0 0 120 218"><rect width="120" height="218" fill="%23222"/><text x="60" y="109" fill="%23777" font-size="12" text-anchor="middle">No Preview</text></svg>';

      html += `
        <div class="preset-card bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-500 transition-all rounded-xl p-3 flex gap-3 relative group" data-preset-id="${preset.id}">
          <!-- Thumbnail preview -->
          <div class="preset-thumb-wrapper shrink-0 w-16 h-28 bg-black rounded-lg overflow-hidden border border-gray-600 shadow-inner flex items-center justify-center cursor-pointer" onclick="PresetManager.apply('${preset.id}')" title="${t ? t('preset_apply_tooltip') : 'Nhấn để nạp mẫu này'}">
            <img src="${thumbSrc}" alt="${preset.name}" class="w-full h-full object-cover select-none">
          </div>

          <!-- Preset Info & Actions -->
          <div class="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <div class="flex items-center justify-between gap-1 mb-1">
                <h4 class="text-xs font-bold text-white truncate preset-title" title="${preset.name}">${preset.name}</h4>
              </div>
              <div class="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1">
                <span class="inline-block w-1.5 h-1.5 rounded-full bg-[#fcd116]"></span>
                <span class="truncate">${templateLabel}</span>
              </div>
              <div class="text-[9px] text-gray-500 font-mono">${timeFormatted}</div>
            </div>

            <!-- Buttons Bar -->
            <div class="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-700/60">
              <button type="button" class="btn-apply-preset flex-1 bg-[#fcd116] hover:bg-[#e5be13] active:scale-95 text-black font-bold text-[10px] py-1.5 px-2 rounded-lg transition-transform flex items-center justify-center gap-1 shadow-sm" onclick="PresetManager.apply('${preset.id}')">
                <span>🚀</span><span class="preset_btn_apply">${t ? t('preset_btn_apply') : 'Nạp'}</span>
              </button>
              <button type="button" class="p-1.5 bg-gray-700 hover:bg-gray-600 active:scale-95 text-gray-300 hover:text-white rounded-lg text-[10px] transition-colors" onclick="PresetManager.promptRename('${preset.id}')" title="${t ? t('preset_rename_tooltip') : 'Đổi tên'}">
                ✏️
              </button>
              <button type="button" class="p-1.5 bg-gray-700 hover:bg-gray-600 active:scale-95 text-gray-300 hover:text-white rounded-lg text-[10px] transition-colors" onclick="PresetManager.exportSingle('${preset.id}')" title="${t ? t('preset_export_tooltip') : 'Tải file JSON'}">
                ⬇️
              </button>
              <button type="button" class="p-1.5 bg-gray-700 hover:bg-red-600 active:scale-95 text-gray-300 hover:text-white rounded-lg text-[10px] transition-colors" onclick="PresetManager.confirmDelete('${preset.id}')" title="${t ? t('preset_delete_tooltip') : 'Xóa'}">
                🗑️
              </button>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;
  },

  /**
   * Hộp thoại đổi tên nhanh
   */
  promptRename(id) {
    const preset = this.getById(id);
    if (!preset) return;
    const promptMsg = (t ? t('preset_prompt_rename') : 'Nhập tên mới cho mẫu:') ;
    const newName = showPrompt(promptMsg, preset.name);
    if (newName !== null && newName !== undefined) {
      this.rename(id, newName);
    }
  },

  /**
   * Xác nhận xóa preset
   */
  confirmDelete(id) {
    const preset = this.getById(id);
    if (!preset) return;
    const confirmMsg = (t ? t('preset_confirm_delete') : 'Bạn có chắc chắn muốn xóa mẫu "{name}"?').replace('{name}', preset.name);
    if (showConfirm(confirmMsg)) {
      this.delete(id);
    }
  },

  /**
   * Khởi tạo các sự kiện giao diện
   */
  init() {
    // 1. Nút lưu mẫu hiện tại
    const saveBtn = document.getElementById('btn-save-current-preset');
    const nameInput = document.getElementById('save-preset-name');

    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const origText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.classList.add('opacity-60', 'cursor-not-allowed');
        saveBtn.innerHTML = `<span>⏳</span><span>${t ? t('processing') : 'Đang xử lý...'}</span>`;

        try {
          const nameVal = nameInput ? nameInput.value : '';
          const newPreset = await this.saveCurrent(nameVal);
          if (newPreset) {
            if (nameInput) nameInput.value = '';
            // Hiệu ứng thông báo thành công
            saveBtn.innerHTML = `<span>✅</span><span>${t ? t('preset_save_success') : 'Đã lưu thành công!'}</span>`;
            setTimeout(() => {
              saveBtn.innerHTML = origText;
              saveBtn.disabled = false;
              saveBtn.classList.remove('opacity-60', 'cursor-not-allowed');
            }, 1200);
          } else {
            saveBtn.innerHTML = origText;
            saveBtn.disabled = false;
            saveBtn.classList.remove('opacity-60', 'cursor-not-allowed');
          }
        } catch (e) {
          console.error('[PresetManager] Lỗi lưu preset:', e);
          saveBtn.innerHTML = origText;
          saveBtn.disabled = false;
          saveBtn.classList.remove('opacity-60', 'cursor-not-allowed');
          showAlert(t ? t('error_save_preset') : 'Không thể lưu mẫu thiết kế!');
        }
      });
    }

    // Enter trên input tên mẫu
    if (nameInput && saveBtn) {
      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveBtn.click();
        }
      });
    }

    // 2. Xuất toàn bộ JSON
    const exportAllBtn = document.getElementById('btn-export-all-presets');
    if (exportAllBtn) {
      exportAllBtn.addEventListener('click', () => {
        this.exportAll();
      });
    }

    // 3. Nạp file JSON
    const importBtn = document.getElementById('btn-import-preset-file');
    const fileInput = document.getElementById('preset-file-input');

    if (importBtn && fileInput) {
      importBtn.addEventListener('click', () => {
        fileInput.value = '';
        fileInput.click();
      });

      fileInput.addEventListener('change', async () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          await this.importFromJsonString(text);
        } catch (err) {
          console.error(err);
          showAlert(t ? t('preset_file_read_error') : 'Lỗi khi đọc file!');
        }
      });
    }

    // 4. Xóa tất cả
    const clearAllBtn = document.getElementById('btn-clear-all-presets');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        const list = loadFromStorage();
        if (list.length === 0) return;
        const msg = t ? t('preset_confirm_clear_all') : 'CẢNH BÁO: Bạn có chắc chắn muốn xóa TẤT CẢ các mẫu thiết kế đã lưu không?';
        if (showConfirm(msg)) {
          this.clearAll();
        }
      });
    }

    // Render danh sách ban đầu
    this.renderUI();
    console.log('✅ [PresetManager] Sprint 7: Khởi tạo Storage & Preset Manager thành công.');
  }
};

// Xuất ra toàn cục
export { PresetManager };

// Tự động khởi tạo khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PresetManager.init());
} else {
  PresetManager.init();
}
