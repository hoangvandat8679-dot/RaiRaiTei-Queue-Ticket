/**
 * RaiRaiTei Queue Ticket Studio — Tự lưu bản nháp (GĐ3 vé 3.1)
 * Thiết kế đang chỉnh được lưu vào localStorage (khóa rairaitei_draft_v1)
 * mỗi khi thay đổi (chống dồn dập 900 ms). Mở app: khôi phục bản nháp kèm
 * dòng trạng thái và nút "Về mặc định". Nháp đầy bộ nhớ thì bỏ qua lặng lẽ
 * (chỉ là tiện ích, không bao giờ chặn người dùng); preset theo tên không
 * bị ảnh hưởng. Định dạng nháp bọc ngoài thiết kế rairaitei-design v1.
 */
(function (global) {
  const DRAFT_KEY = 'rairaitei_draft_v1';
  const SAVE_DELAY_MS = 900;
  let saveTimer = null;
  let suppressUntil = 0; // mốc thời gian: bỏ qua lưu trong lúc khôi phục/reset
  let restoredAt = null; // thời điểm lưu của bản nháp đang hiển thị

  const t = (key, fallback) => (global.t ? global.t(key) : fallback);

  function formatTime(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const hh = ('0' + d.getHours()).slice(-2);
    const mm = ('0' + d.getMinutes()).slice(-2);
    return `${hh}:${mm} ${d.getDate()}/${d.getMonth() + 1}`;
  }

  function renderStatus() {
    const bar = document.getElementById('draft-status-bar');
    const text = document.getElementById('draft-status-text');
    const btn = document.getElementById('draft-reset-btn');
    if (!bar || !text) return;
    if (restoredAt) {
      bar.classList.remove('hidden');
      text.textContent = t('draft_status_label', 'Đang xem bản nháp tự lưu lúc {time}')
        .replace('{time}', formatTime(restoredAt));
    } else {
      bar.classList.add('hidden');
    }
    if (btn) btn.textContent = t('draft_reset_button', 'Về mặc định');
  }

  function saveDraft() {
    if (Date.now() < suppressUntil) return;
    if (!global.designHistory || typeof global.designHistory.collect !== 'function') return;
    try {
      const design = global.designHistory.collect();
      if (!design) return;
      const payload = {
        format: 'rairaitei-draft',
        version: 1,
        savedAt: new Date().toISOString(),
        design
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      restoredAt = payload.savedAt;
      renderStatus();
    } catch (e) {
      // Đầy bộ nhớ hoặc localStorage bị chặn: bỏ qua lặng lẽ (xem đầu file).
      console.warn('[DraftManager] Không lưu được bản nháp:', e && e.name);
    }
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, SAVE_DELAY_MS);
  }

  function readDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || data.format !== 'rairaitei-draft' || !data.design) return null;
      if (data.version != null && Number(data.version) > 1) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function restoreDraft() {
    const draft = readDraft();
    if (!draft) return false;
    if (!global.designHistory || typeof global.designHistory.apply !== 'function') return false;
    suppressUntil = Date.now() + 2000;
    const applied = global.designHistory.apply(draft.design);
    if (applied) {
      restoredAt = draft.savedAt || new Date().toISOString();
      renderStatus();
      if (typeof global.designHistory.capture === 'function') {
        global.designHistory.capture();
      }
    }
    return applied;
  }

  function resetToDefault() {
    const msg = t('draft_reset_confirm', 'Đưa thiết kế về mặc định và xóa bản nháp?');
    if (!global.confirm(msg)) return;
    suppressUntil = Date.now() + 2500;
    clearTimeout(saveTimer);
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* bỏ qua */ }
    restoredAt = null;
    if (global.TemplateRegistry) {
      global.TemplateRegistry.apply('standard');
    }
    if (global.designHistory && typeof global.designHistory.capture === 'function') {
      global.designHistory.capture();
    }
    renderStatus();
  }

  function init() {
    const btn = document.getElementById('draft-reset-btn');
    if (btn) btn.addEventListener('click', resetToDefault);
    // Khôi phục sau khi các module khác đã khởi tạo xong.
    setTimeout(restoreDraft, 400);
    document.addEventListener('input', scheduleSave);
    document.addEventListener('change', scheduleSave);
    // Đổi ngôn ngữ: vẽ lại nhãn trạng thái.
    document.addEventListener('rairaitei:language-changed', renderStatus);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.DraftManager = {
    KEY: DRAFT_KEY,
    restoreNow: restoreDraft,
    clear: () => { try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* bỏ qua */ } restoredAt = null; renderStatus(); },
    hasDraft: () => !!readDraft()
  };
})(typeof window !== 'undefined' ? window : this);
