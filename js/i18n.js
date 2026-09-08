window.currentLang = (() => {
    try {
        const savedLanguage = localStorage.getItem('rairaitei-language');
        return savedLanguage === 'vn' || savedLanguage === 'jp'
            ? savedLanguage
            : 'jp';
    } catch (error) {
        return 'jp';
    }
})();

window.translations = {
    jp: {
        document_title: '来来亭 整理券作成ツール',
        language_button_label: '言語を切り替える（現在：日本語）',
        preview_title: 'プレビュー',
        mobile_print_text: '印刷 / PDF保存',
        text_collapse: '全画面表示',
        control_panel_title: '設定パネル',
        core_size_label: '本体',
        nav_template: 'テンプレート設計',
        nav_size: 'サイズ',
        nav_border: '枠線・装飾',
        nav_number: '番号枠',
        nav_message: 'メッセージ',
        nav_branch: '店舗名',
        template_design_title: 'テンプレート設計',
        template_design_status: '開発中',
        toggle_bg_label: '背景を表示',
        toggle_border_label: '枠線とLEDを表示',
        toggle_mascot_label: 'マスコットを表示',
        toggle_number_label: '番号と枠を表示',
        toggle_message_label: 'メッセージを表示',
        toggle_branch_label: '店舗名を表示',
        sec1_title: '1. サイズ・背景',
        core_w: '本体の幅 (mm)',
        core_h: '本体の高さ (mm)',
        bg_color: '背景色',
        bg_img: '背景画像（任意）',
        bg_opacity: '背景画像の透明度',
        margin_x: '左右の裁断余白',
        margin_y: '上下の裁断余白',
        sec_border_title: '赤枠・LED',
        border_w: '赤枠の太さ',
        dot_density: 'LEDの密度',
        dot_1: 'LED 1（大）',
        dot_2: 'LED 2（小）',
        dot_offset: 'LEDの内側位置',
        sec_mascot_title: 'マスコット',
        mascot_default: '来来亭モデル',
        mascot_custom: '画像をアップロード',
        bg_remove: '背景を削除 ⚠️',
        mascot_size: 'マスコットの大きさ',
        pos_y_mascot: '上下位置',
        sec2_title: '2. 番号・枠',
        font_size_num: '番号の大きさ',
        num_offset: '番号の上下位置',
        frame_w: '番号枠の幅',
        frame_h: '番号枠の高さ',
        pos_y_frame: '枠の上下位置',
        text_color_num: '番号の色',
        bg_color_num: '枠の背景色',
        border_color_num: '枠線の色',
        border_w_num: '枠線の太さ',
        sec3_title: '3. メッセージ（中央）',
        fw_normal_msg: '標準',
        fw_bold_msg: '太字',
        fw_bolder_msg: '極太',
        fs_normal_msg: '標準',
        fs_italic_msg: '斜体',
        font_size_msg: '文字サイズ',
        pos_y_msg: '上下位置',
        text_color_msg: '文字色',
        text_outline_c_msg: '縁取り色',
        text_outline_w_msg: '縁取り幅',
        sec4_title: '4. 店舗名（下部）',
        fw_normal_branch: '標準',
        fw_bold_branch: '太字',
        fw_bolder_branch: '極太',
        fs_normal_branch: '標準',
        fs_italic_branch: '斜体',
        font_size_branch: '文字サイズ',
        pos_y_branch: '上下位置',
        frame_w_branch: '枠の幅',
        pad_y_branch: '上下の余白',
        radius_branch: '角丸',
        text_color_branch: '文字色',
        bg_color_branch: '枠の背景色',
        text_outline_c_branch: '縁取り色',
        text_outline_w_branch: '縁取り幅',
        choose_file: 'ファイルを選択',
        no_file_selected: 'ファイルが選択されていません',
        btn_print_pc: '印刷 / PDF保存',
        btn_backup: 'デザインを保存（HTML）',
        print_loading_title: '印刷データを準備しています…',
        print_loading_desc: 'ブラウザが印刷またはPDF保存画面を開きます。このタブを閉じないでください。',
        force_close_text: '戻る（停止した場合）',
        export_modal_title: 'PDF出力設定',
        print_mode_sequential: '連番印刷',
        print_mode_custom: '指定番号',
        sequential_label: '1番から次の番号まで:',
        custom_label: '番号を入力（例: 1-5; 8; 12-15）:',
        custom_placeholder: '2; 5; 10-15',
        info_paper_label: '用紙サイズ:',
        info_size_label: 'チケット1枚のサイズ:',
        info_per_page_label: '1ページあたり:',
        info_total_label: 'A4の合計ページ数:',
        generate_pdf_text: '印刷 / 保存を確定',
        close_export_label: 'PDF出力設定を閉じる',
        mascot_alt: 'マスコット画像',
        paper_portrait: 'A4 縦',
        paper_landscape: 'A4 横',
        tickets_unit: '枚',
        pages_unit: 'ページ',
        error_ticket_library: 'チケット描画ライブラリを読み込めませんでした。',
        error_pdf_library: 'PDF作成ライブラリを読み込めませんでした。',
        error_invalid_quantity: '有効なチケット番号または枚数を入力してください。',
        error_ticket_too_large: 'チケットが大きすぎるため、A4用紙に配置できません。',
        error_pdf_create: 'PDFの作成中にエラーが発生しました。',
        error_backup_create: 'デザイン保存ファイルの作成中にエラーが発生しました。',
        pdf_wait: 'A4 PDFを作成しています。しばらくお待ちください…',
        progress_ticket: 'チケットを作成中 {current}/{total}…',
        processing: '処理中…',
        in_app_browser_warning: '{browser}内のブラウザからは直接印刷できません。このページをSafariまたはChromeで開いてから、もう一度お試しください。',
        in_app_browser_generic: '現在のアプリ',
        popup_blocked_notice: 'PDF表示がブロックされました。PDFファイルをダウンロードします。'
    },
    vn: {
        document_title: 'Công cụ tạo phiếu thứ tự RaiRaiTei',
        language_button_label: 'Đổi ngôn ngữ (hiện tại: Tiếng Việt)',
        preview_title: 'Xem trước',
        mobile_print_text: 'In / Lưu PDF',
        text_collapse: 'Toàn màn hình',
        control_panel_title: 'Bảng điều khiển',
        core_size_label: 'Lõi vé',
        nav_template: 'Thiết kế mẫu',
        nav_size: 'Kích thước',
        nav_border: 'Viền & trang trí',
        nav_number: 'Khung số',
        nav_message: 'Lời nhắn',
        nav_branch: 'Tên chi nhánh',
        template_design_title: 'Thiết kế mẫu',
        template_design_status: 'đang phát triển',
        toggle_bg_label: 'Bật nền',
        toggle_border_label: 'Bật viền & đèn',
        toggle_mascot_label: 'Bật biểu tượng',
        toggle_number_label: 'Bật số & khung',
        toggle_message_label: 'Bật lời nhắn',
        toggle_branch_label: 'Bật tên chi nhánh',
        sec1_title: '1. Kích thước & nền',
        core_w: 'Chiều rộng lõi vé (mm)',
        core_h: 'Chiều cao lõi vé (mm)',
        bg_color: 'Màu nền',
        bg_img: 'Ảnh nền (không bắt buộc)',
        bg_opacity: 'Độ trong suốt ảnh nền',
        margin_x: 'Lề cắt trái/phải',
        margin_y: 'Lề cắt trên/dưới',
        sec_border_title: 'Khung viền đỏ & đèn',
        border_w: 'Độ dày viền đỏ',
        dot_density: 'Mật độ đèn',
        dot_1: 'Đèn 1 (lớn)',
        dot_2: 'Đèn 2 (nhỏ)',
        dot_offset: 'Vị trí đèn vào trong',
        sec_mascot_title: 'Biểu tượng',
        mascot_default: 'Mẫu RaiRaiTei',
        mascot_custom: 'Tải ảnh lên',
        bg_remove: 'Xóa nền ⚠️',
        mascot_size: 'Kích thước biểu tượng',
        pos_y_mascot: 'Vị trí lên/xuống',
        sec2_title: '2. Số thứ tự & khung',
        font_size_num: 'Kích thước số',
        num_offset: 'Vị trí số lên/xuống',
        frame_w: 'Chiều rộng khung số',
        frame_h: 'Chiều cao khung số',
        pos_y_frame: 'Vị trí khung lên/xuống',
        text_color_num: 'Màu số',
        bg_color_num: 'Màu nền khung',
        border_color_num: 'Màu viền khung',
        border_w_num: 'Độ dày viền khung',
        sec3_title: '3. Lời nhắn (giữa)',
        fw_normal_msg: 'Thường',
        fw_bold_msg: 'Đậm',
        fw_bolder_msg: 'Rất đậm',
        fs_normal_msg: 'Thẳng',
        fs_italic_msg: 'Nghiêng',
        font_size_msg: 'Kích thước chữ',
        pos_y_msg: 'Vị trí lên/xuống',
        text_color_msg: 'Màu chữ',
        text_outline_c_msg: 'Màu viền chữ',
        text_outline_w_msg: 'Độ dày viền',
        sec4_title: '4. Tên chi nhánh (dưới)',
        fw_normal_branch: 'Thường',
        fw_bold_branch: 'Đậm',
        fw_bolder_branch: 'Rất đậm',
        fs_normal_branch: 'Thẳng',
        fs_italic_branch: 'Nghiêng',
        font_size_branch: 'Kích thước chữ',
        pos_y_branch: 'Vị trí lên/xuống',
        frame_w_branch: 'Chiều rộng khung',
        pad_y_branch: 'Đệm trên/dưới',
        radius_branch: 'Bo góc',
        text_color_branch: 'Màu chữ',
        bg_color_branch: 'Màu nền khung',
        text_outline_c_branch: 'Màu viền chữ',
        text_outline_w_branch: 'Độ dày viền',
        choose_file: 'Chọn tệp',
        no_file_selected: 'Chưa chọn tệp',
        btn_print_pc: 'In / Lưu PDF',
        btn_backup: 'Lưu thiết kế (HTML)',
        print_loading_title: 'Đang chuẩn bị dữ liệu in…',
        print_loading_desc: 'Trình duyệt sẽ mở màn hình in hoặc lưu PDF. Vui lòng không đóng thẻ này.',
        force_close_text: 'Quay lại (nếu bị kẹt)',
        export_modal_title: 'Tùy chọn xuất PDF',
        print_mode_sequential: 'In liên tục',
        print_mode_custom: 'In số chỉ định',
        sequential_label: 'In từ số 1 đến số:',
        custom_label: 'Nhập số (ví dụ: 1-5; 8; 12-15):',
        custom_placeholder: '2; 5; 10-15',
        info_paper_label: 'Khổ giấy:',
        info_size_label: 'Kích thước một vé:',
        info_per_page_label: 'Số vé trên một trang:',
        info_total_label: 'Tổng số trang A4:',
        generate_pdf_text: 'Xác nhận in / lưu',
        close_export_label: 'Đóng tùy chọn xuất PDF',
        mascot_alt: 'Ảnh biểu tượng',
        paper_portrait: 'A4 dọc',
        paper_landscape: 'A4 ngang',
        tickets_unit: 'vé',
        pages_unit: 'trang',
        error_ticket_library: 'Không tải được thư viện dựng vé.',
        error_pdf_library: 'Không tải được thư viện tạo PDF.',
        error_invalid_quantity: 'Vui lòng nhập số lượng hoặc số vé hợp lệ.',
        error_ticket_too_large: 'Kích thước vé quá lớn để xếp trên giấy A4.',
        error_pdf_create: 'Đã xảy ra lỗi khi tạo PDF.',
        error_backup_create: 'Đã xảy ra lỗi khi tạo tệp lưu thiết kế.',
        pdf_wait: 'Đang tạo PDF A4, vui lòng chờ…',
        progress_ticket: 'Đang dựng vé {current}/{total}…',
        processing: 'Đang xử lý…',
        in_app_browser_warning: 'Không thể in trực tiếp trong trình duyệt của {browser}. Vui lòng mở trang này bằng Safari hoặc Chrome rồi thử lại.',
        in_app_browser_generic: 'ứng dụng hiện tại',
        popup_blocked_notice: 'Trình duyệt đã chặn cửa sổ PDF. Tệp PDF sẽ được tải xuống.'
    }
};

window.t = function(key, variables = {}) {
    const language = window.translations[window.currentLang]
        ? window.currentLang
        : 'jp';
    const fallback = window.translations.jp[key] || key;
    let value = window.translations[language][key] || fallback;

    Object.entries(variables).forEach(([name, replacement]) => {
        value = value.replaceAll(`{${name}}`, String(replacement));
    });

    return value;
};

window.refreshTranslatedFileNames = function() {
    [
        ['bg-upload', 'bg-upload-name'],
        ['mascot-upload', 'mascot-upload-name']
    ].forEach(([inputId, statusId]) => {
        const input = document.getElementById(inputId);
        const status = document.getElementById(statusId);

        if (!input || !status) return;

        status.textContent = input.files && input.files[0]
            ? input.files[0].name
            : window.t('no_file_selected');
    });
};

window.applyTranslations = function() {
    const textElementIds = [
        'preview_title',
        'mobile_print_text',
        'text_collapse',
        'control_panel_title',
        'nav_template',
        'nav_size',
        'nav_border',
        'nav_number',
        'nav_message',
        'nav_branch',
        'template_design_title',
        'template_design_status',
        'toggle_bg_label',
        'toggle_border_label',
        'toggle_mascot_label',
        'toggle_number_label',
        'toggle_message_label',
        'toggle_branch_label',
        'sec1_title',
        'core_w',
        'core_h',
        'bg_color',
        'bg_img',
        'bg_opacity',
        'margin_x',
        'margin_y',
        'sec_border_title',
        'border_w',
        'dot_density',
        'dot_1',
        'dot_2',
        'dot_offset',
        'sec_mascot_title',
        'mascot_default',
        'mascot_custom',
        'bg_remove',
        'mascot_size',
        'pos_y_mascot',
        'sec2_title',
        'font_size_num',
        'num_offset',
        'frame_w',
        'frame_h',
        'pos_y_frame',
        'text_color_num',
        'bg_color_num',
        'border_color_num',
        'border_w_num',
        'sec3_title',
        'fw_normal_msg',
        'fw_bold_msg',
        'fw_bolder_msg',
        'fs_normal_msg',
        'fs_italic_msg',
        'font_size_msg',
        'pos_y_msg',
        'text_color_msg',
        'text_outline_c_msg',
        'text_outline_w_msg',
        'sec4_title',
        'fw_normal_branch',
        'fw_bold_branch',
        'fw_bolder_branch',
        'fs_normal_branch',
        'fs_italic_branch',
        'font_size_branch',
        'pos_y_branch',
        'frame_w_branch',
        'pad_y_branch',
        'radius_branch',
        'text_color_branch',
        'bg_color_branch',
        'text_outline_c_branch',
        'text_outline_w_branch',
        'bg-upload-button',
        'mascot-upload-button',
        'btn_print_pc',
        'btn_backup',
        'print_loading_title',
        'print_loading_desc',
        'force_close_text',
        'export_modal_title',
        'print_mode_sequential',
        'print_mode_custom',
        'sequential_label',
        'custom_label',
        'info_paper_label',
        'info_size_label',
        'info_per_page_label',
        'info_total_label',
        'generate_pdf_text'
    ];

    textElementIds.forEach((id) => {
        const element = document.getElementById(id);
        const key = id === 'bg-upload-button' || id === 'mascot-upload-button'
            ? 'choose_file'
            : id;

        if (element) element.textContent = window.t(key);
    });

    document.documentElement.lang =
        window.currentLang === 'jp' ? 'ja' : 'vi';
    document.title = window.t('document_title');

    const headerCoreLabel =
        document.getElementById('core_size_label_header');
    const headerCoreSize =
        document.getElementById('header-core-size');

    if (headerCoreLabel) {
        headerCoreLabel.textContent = window.t('core_size_label');
    }

    if (headerCoreSize) {
        const width =
            parseFloat(document.getElementById('core-width-input').value) || 44;
        const height =
            parseFloat(document.getElementById('core-height-input').value) || 79;
        const headerTextNode = Array.from(headerCoreSize.childNodes)
            .find((node) => node.nodeType === Node.TEXT_NODE);

        if (headerTextNode) {
            headerTextNode.nodeValue =
                `: ${(width / 10).toFixed(2)}x${(height / 10).toFixed(2)}cm`;
        }
    }

    const customInput = document.getElementById('print-custom');
    if (customInput) {
        customInput.placeholder = window.t('custom_placeholder');
    }

    const mascotImage = document.getElementById('mascot-preview');
    if (mascotImage) {
        mascotImage.alt = window.t('mascot_alt');
    }

    ['lang-toggle-btn', 'mobile-lang-toggle-btn'].forEach((id) => {
        const button = document.getElementById(id);

        if (button) {
            const label = window.t('language_button_label');
            button.setAttribute('aria-label', label);
            button.title = label;
        }
    });

    const closeButton = document.getElementById('close-export-modal');
    if (closeButton) {
        closeButton.setAttribute(
            'aria-label',
            window.t('close_export_label')
        );
    }

    window.refreshTranslatedFileNames();

    if (window.calculateAILayout) {
        window.calculateAILayout();
    }
};

window.setLanguage = function(language) {
    if (language !== 'jp' && language !== 'vn') return;

    window.currentLang = language;

    try {
        localStorage.setItem('rairaitei-language', language);
    } catch (error) {
        // The language still changes when browser storage is unavailable.
    }

    window.applyTranslations();
};

document.addEventListener('DOMContentLoaded', () => {
    [
        ['bg-upload', 'bg-upload-name'],
        ['mascot-upload', 'mascot-upload-name']
    ].forEach(([inputId]) => {
        const input = document.getElementById(inputId);

        if (input) {
            input.addEventListener(
                'change',
                window.refreshTranslatedFileNames
            );
        }
    });

    window.applyTranslations();
});
