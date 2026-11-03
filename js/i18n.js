// Module lá (leaf): KHÔNG import module app nào khác. i18n được mọi
// module dùng ngay trong lúc khởi tạo (t() ở top-level của preset-manager,
// layout-sync, controls, ticket-drag) — nếu i18n import ngược lại chúng,
// vòng phụ thuộc làm các hằng translations/currentLang chưa kịp khởi tạo
// khi bị đọc (lỗi TDZ trên trình duyệt thật, bản đóng gói test không lộ).
// Module cần vẽ lại khi đổi ngôn ngữ thì nghe sự kiện
// 'rairaitei:language-changed' do applyTranslations phát ra.
export let currentLang = (() => {
    try {
        const savedLanguage = localStorage.getItem('rairaitei-language');
        return savedLanguage === 'vn' || savedLanguage === 'jp'
            ? savedLanguage
            : 'jp';
    } catch (error) {
        return 'jp';
    }
})();

export const translations = {
    jp: {
        document_title: '来来亭 整理券作成ツール',
        language_button_label: '言語を切り替える（現在：日本語）',
        preview_title: 'プレビュー',
        mobile_print_text: '印刷 / PDF保存',
        history_undo_label: '元に戻す',
        history_redo_label: 'やり直す',
        text_collapse: '全画面表示',
        text_thermal_mode: '熱転写',
        export_png_text: '単一チケット画像（PNG）を保存',
        control_panel_title: '設定パネル',
        core_size_label: '本体',
        nav_template: 'テンプレート設計',
        nav_size: 'サイズ',
        nav_border: '枠線・装飾',
        nav_number: '番号枠',
        nav_message: 'メッセージ',
        nav_branch: '店舗名',
        chip_all: 'すべて',
        chip_size: '1. サイズ',
        chip_border: '2. 枠・シンボル',
        chip_number: '3. 番号と枠',
        chip_message: '4. メッセージ',
        chip_branch: '5. 店舗名',
        template_design_title: 'テンプレート設計',
        template_design_status: '開発中',
        seasonal_template_title: '季節のテンプレート',
        template_spring_name: '春',
        template_spring_description: '桜のデザイン',
        template_summer_name: '夏',
        template_summer_description: '祭り・ひまわり',
        template_autumn_name: '秋',
        template_autumn_description: '紅葉・お月見',
        template_winter_name: '冬',
        template_winter_description: '雪・イルミネーション',
        template_standard_name: '標準デザインに戻す',
        toggle_bg_label: '背景を表示',
        toggle_border_label: '枠線とLEDを表示',
        toggle_mascot_label: 'マスコットを表示',
        toggle_number_label: '番号を表示',
        toggle_frame_label: '番号枠を表示',
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
        btn_backup: 'デザインを保存（JSON）',
        btn_restore: 'デザインを読み込む',
        history_download_label: 'デザインを保存',
        history_upload_label: 'デザインを読み込む',
        history_clear_label: '履歴を消去',
        nav_settings: '設定',
        nav_saved: '保存済み',
        settings_back_label: '戻る',
        print_loading_title: '印刷データを準備しています…',
        print_loading_desc: 'ブラウザが印刷またはPDF保存画面を開きます。このタブを閉じないでください。',
        force_close_text: '戻る（停止した場合）',
        export_modal_title: 'PDF出力設定',
        print_mode_sequential: '連番印刷',
        print_mode_custom: '指定番号',
        duplex_print_label: '両面印刷（表裏を一致）',
        duplex_print_hint: '表面をすべて出力した後、各行の列順を反転した裏面を出力します。横方向に返しても番号位置が一致します。',
        print_side_front: '表面',
        print_side_back: '裏面',
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
        popup_blocked_notice: 'PDF表示がブロックされました。PDFファイルをダウンロードします。',
        txt_focus_preview: '拡大',
        txt_focus_restore: '戻す',
        handle_compact: 'チケット優先',
        handle_expanded: 'パネル展開中',
        saved_presets_title: '保存済みデザイン',
        save_preset_section: '現在のデザインを保存',
        save_preset_placeholder: 'デザイン名（例：繁忙期、感謝祭…）',
        btn_save_current_preset: 'このデザインを保存',
        saved_presets_list_title: 'マイデザイン一覧',
        preset_empty_title: '保存されたデザインはありません',
        preset_empty_desc: 'お好みのデザインを作成し、名前を入力して「このデザインを保存」を押してください。',
        btn_export_all_presets: '全デザインを一括書き出し（JSON）',
        btn_import_preset_file: 'JSONファイルから読み込む',
        btn_clear_all_presets: '全保存デザインを削除',
        preset_btn_apply: '適用',
        preset_default_name: 'カスタムデザイン',
        preset_imported_name: 'インポートデザイン',
        preset_save_success: '保存完了！',
        preset_confirm_delete: 'デザイン「{name}」を削除してもよろしいですか？',
        preset_confirm_clear_all: '警告：保存されたすべてのデザインを完全に削除しますか？',
        preset_prompt_rename: '新しいデザイン名を入力してください：',
        preset_import_success: '{count}件のデザインを正常に読み込みました！',
        preset_import_invalid: '有効なデザインデータが見つかりませんでした。',
        preset_import_error: 'JSONファイルの読み込み中にエラーが発生しました。',
        preset_empty_export: '書き出せるデザインがまだありません。',
        error_save_preset: 'デザインを保存できませんでした。',
        preset_file_read_error: 'ファイルの読み込み中にエラーが発生しました。',
        print_test_text: '印刷チェックページを印刷',
        storage_quota_full: 'ブラウザの保存容量がいっぱいです。不要なデザインを削除してください。',
        storage_quota_warning: 'ブラウザの保存容量が80%を超えています。古いデザインの削除やJSONへの書き出しをご検討ください。',
        preset_import_newer: 'このファイルは新しいバージョンのアプリで作成されています。アプリを更新してから再度お試しください。',
        draft_status_label: '自動保存した下書きを表示しています（{time}）',
        preflight_not_ready: '印刷の準備ができていません',
        preflight_lib_missing: '印刷ライブラリ（{name}）が読み込まれていません。ページを再読み込みしてください。',
        preflight_img_not_ready: 'チケット内の画像がまだ読み込まれていません。少し待ってから再度お試しください。',
        print_test_button: '印刷チェックページを印刷',
        draft_reset_button: '初期状態に戻す',
        draft_reset_confirm: 'デザインを初期状態に戻し、下書きを削除しますか？',
        preset_apply_tooltip: 'このデザインを読み込む',
        preset_rename_tooltip: '名前を変更',
        preset_export_tooltip: 'JSONとして保存',
        preset_delete_tooltip: '削除',
        crop_marks_label: '裁断ガイド線（トンボ・Crop Marks）',
        crop_marks_hint: 'ハサミやカッターでキレイに切り離せるよう、各チケットの境界に裁断マークを配置します。'
    },
    vn: {
        document_title: 'Công cụ tạo phiếu thứ tự RaiRaiTei',
        language_button_label: 'Đổi ngôn ngữ (hiện tại: Tiếng Việt)',
        preview_title: 'Xem trước',
        mobile_print_text: 'In / Lưu PDF',
        history_undo_label: 'Hoàn tác',
        history_redo_label: 'Làm lại',
        text_collapse: 'Toàn màn hình',
        text_thermal_mode: 'In nhiệt',
        export_png_text: 'Tải ảnh vé đơn (PNG)',
        control_panel_title: 'Bảng điều khiển',
        core_size_label: 'Lõi vé',
        nav_template: 'Thiết kế mẫu',
        nav_size: 'Kích thước',
        nav_border: 'Viền & trang trí',
        nav_number: 'Khung số',
        nav_message: 'Lời nhắn',
        nav_branch: 'Tên chi nhánh',
        chip_all: 'Tất cả',
        chip_size: '1. Kích thước & Nền',
        chip_border: '2. Viền & Linh vật',
        chip_number: '3. Số thứ tự & Khung',
        chip_message: '4. Lời nhắn',
        chip_branch: '5. Tên quán',
        template_design_title: 'Thiết kế mẫu',
        template_design_status: 'đang phát triển',
        seasonal_template_title: 'Mẫu Theo Mùa',
        template_spring_name: 'Mùa Xuân',
        template_spring_description: 'Thiết kế hoa anh đào',
        template_summer_name: 'Mùa Hè',
        template_summer_description: 'Lễ hội & Hướng dương',
        template_autumn_name: 'Mùa Thu',
        template_autumn_description: 'Lá đỏ & Ngắm trăng',
        template_winter_name: 'Mùa Đông',
        template_winter_description: 'Tuyết & Ánh sáng',
        template_standard_name: 'Quay về thiết kế gốc',
        toggle_bg_label: 'Bật nền',
        toggle_border_label: 'Bật viền & đèn',
        toggle_mascot_label: 'Bật biểu tượng',
        toggle_number_label: 'Bật số thứ tự',
        toggle_frame_label: 'Bật khung số',
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
        btn_backup: 'Lưu thiết kế (JSON)',
        btn_restore: 'Tải thiết kế lên',
        history_download_label: 'Lưu thiết kế',
        history_upload_label: 'Tải thiết kế lên',
        history_clear_label: 'Xóa lịch sử',
        nav_settings: 'Thiết lập',
        nav_saved: 'Đã lưu',
        settings_back_label: 'Quay lại',
        print_loading_title: 'Đang chuẩn bị dữ liệu in…',
        print_loading_desc: 'Trình duyệt sẽ mở màn hình in hoặc lưu PDF. Vui lòng không đóng thẻ này.',
        force_close_text: 'Quay lại (nếu bị kẹt)',
        export_modal_title: 'Tùy chọn xuất PDF',
        print_mode_sequential: 'In liên tục',
        print_mode_custom: 'In số chỉ định',
        duplex_print_label: 'In hai mặt khớp nhau',
        duplex_print_hint: 'In toàn bộ mặt trước, rồi in mặt sau với thứ tự cột được đảo để khớp khi lật ngang.',
        print_side_front: 'MẶT TRƯỚC',
        print_side_back: 'MẶT SAU',
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
        popup_blocked_notice: 'Trình duyệt đã chặn cửa sổ PDF. Tệp PDF sẽ được tải xuống.',
        txt_focus_preview: 'Phóng to',
        txt_focus_restore: 'Thu nhỏ',
        handle_compact: 'Xem vé lớn',
        handle_expanded: 'Bảng mở rộng',
        saved_presets_title: 'Mẫu thiết kế đã lưu',
        save_preset_section: 'Lưu thiết kế hiện tại',
        save_preset_placeholder: 'Tên mẫu (VD: Giờ cao điểm, Tết…)',
        btn_save_current_preset: 'Lưu mẫu này',
        saved_presets_list_title: 'Danh sách mẫu của bạn',
        preset_empty_title: 'Chưa có mẫu nào được lưu',
        preset_empty_desc: 'Tùy chỉnh vé theo ý muốn, đặt tên và nhấn "Lưu mẫu này" ở trên để lưu vào bộ sưu tập.',
        btn_export_all_presets: 'Xuất toàn bộ mẫu (JSON)',
        btn_import_preset_file: 'Nạp từ file JSON',
        btn_clear_all_presets: 'Xóa tất cả mẫu đã lưu',
        preset_btn_apply: 'Nạp',
        preset_default_name: 'Mẫu tùy chỉnh',
        preset_imported_name: 'Mẫu nhập',
        preset_save_success: 'Đã lưu thành công!',
        preset_confirm_delete: 'Bạn có chắc chắn muốn xóa mẫu "{name}"?',
        preset_confirm_clear_all: 'CẢNH BÁO: Bạn có chắc chắn muốn xóa TẤT CẢ các mẫu đã lưu?',
        preset_prompt_rename: 'Nhập tên mới cho mẫu:',
        preset_import_success: 'Đã nạp thành công {count} mẫu thiết kế!',
        preset_import_invalid: 'Không tìm thấy dữ liệu mẫu hợp lệ!',
        preset_import_error: 'Lỗi khi đọc file JSON! Vui lòng kiểm tra lại.',
        preset_empty_export: 'Chưa có mẫu nào để xuất!',
        error_save_preset: 'Không thể lưu mẫu thiết kế!',
        preset_file_read_error: 'Lỗi khi đọc file!',
        print_test_text: 'In trang kiểm tra in',
        storage_quota_full: 'Bộ nhớ trình duyệt đã đầy! Hãy xóa bớt một số mẫu cũ.',
        storage_quota_warning: 'Bộ nhớ trình duyệt đã dùng trên 80%. Nên xóa bớt mẫu cũ hoặc xuất JSON để giải phóng.',
        preset_import_newer: 'Tệp này được tạo bởi phiên bản app mới hơn. Hãy cập nhật app rồi thử lại.',
        draft_status_label: 'Đang xem bản nháp tự lưu lúc {time}',
        preflight_not_ready: 'Chưa sẵn sàng để in',
        preflight_lib_missing: 'Thư viện in ({name}) chưa tải được. Hãy nạp lại trang.',
        preflight_img_not_ready: 'Ảnh trong vé chưa tải xong. Đợi một chút rồi thử lại.',
        print_test_button: 'In trang kiểm tra',
        draft_reset_button: 'Về mặc định',
        draft_reset_confirm: 'Đưa thiết kế về mặc định và xóa bản nháp?',
        preset_apply_tooltip: 'Nhấn để nạp mẫu này',
        preset_rename_tooltip: 'Đổi tên',
        preset_export_tooltip: 'Tải file JSON',
        preset_delete_tooltip: 'Xóa',
        crop_marks_label: 'Vạch cắt chuẩn kéo/dao rọc giấy (Crop Marks)',
        crop_marks_hint: 'Vẽ vạch chữ thập và vạch kẻ mảnh theo lề 1.0mm giữa các con vé để cắt rời chính xác từng milimet.'
    }
};

export function t(key, variables = {}) {
    const language = translations[currentLang]
        ? currentLang
        : 'jp';
    const fallback = translations.jp[key] || key;
    let value = translations[language][key] || fallback;

    Object.entries(variables).forEach(([name, replacement]) => {
        value = value.replaceAll(`{${name}}`, String(replacement));
    });

    return value;
};

export function refreshTranslatedFileNames() {
    [
        ['bg-upload', 'bg-upload-name'],
        ['mascot-upload', 'mascot-upload-name']
    ].forEach(([inputId, statusId]) => {
        const input = document.getElementById(inputId);
        const status = document.getElementById(statusId);

        if (!input || !status) return;

        status.textContent = input.files && input.files[0]
            ? input.files[0].name
            : t('no_file_selected');
    });
};

export function applyTranslations() {
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
        'seasonal_template_title',
        'template_spring_name',
        'template_spring_description',
        'template_summer_name',
        'template_summer_description',
        'template_autumn_name',
        'template_autumn_description',
        'template_winter_name',
        'template_winter_description',
        'template_standard_name',
        'toggle_bg_label',
        'toggle_border_label',
        'toggle_mascot_label',
        'toggle_number_label',
        'toggle_frame_label',
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
        'btn_restore',
        'history_download_label',
        'history_upload_label',
        'history_clear_label',
        'nav_settings',
        'nav_saved',
        'print_loading_title',
        'print_loading_desc',
        'force_close_text',
        'export_modal_title',
        'print_mode_sequential',
        'print_mode_custom',
        'duplex_print_label',
        'duplex_print_hint',
        'sequential_label',
        'custom_label',
        'info_paper_label',
        'info_size_label',
        'info_per_page_label',
        'info_total_label',
        'generate_pdf_text',
        'print_test_text',
        'export_png_text',
        'text_thermal_mode',
        'chip_all',
        'chip_size',
        'chip_border',
        'chip_number',
        'chip_message',
        'chip_branch',
        'txt_focus_preview',
        'saved_presets_title',
        'save_preset_section',
        'btn_save_current_preset',
        'saved_presets_list_title',
        'btn_export_all_presets',
        'btn_import_preset_file',
        'btn_clear_all_presets',
        'preset_empty_title',
        'preset_empty_desc',
        'crop_marks_label',
        'crop_marks_hint'
    ];

    textElementIds.forEach((id) => {
        const element = document.getElementById(id);
        const key = id === 'bg-upload-button' || id === 'mascot-upload-button'
            ? 'choose_file'
            : id;

        if (element) element.textContent = t(key);
    });

    const presetNameInput = document.getElementById('save-preset-name');
    if (presetNameInput) {
        presetNameInput.placeholder = t('save_preset_placeholder');
    }

    const handleStatusEl = document.getElementById('handle_status_text');
    if (handleStatusEl) {
        const isExp = document.getElementById('controls-sidebar')?.classList.contains('sheet-expanded');
        handleStatusEl.textContent = t(isExp ? 'handle_expanded' : 'handle_compact');
    }

    document.documentElement.lang =
        currentLang === 'jp' ? 'ja' : 'vi';
    document.title = t('document_title');

    const headerCoreLabel =
        document.getElementById('core_size_label_header');
    const headerCoreSize =
        document.getElementById('header-core-size');

    if (headerCoreLabel) {
        headerCoreLabel.textContent = t('core_size_label');
    }

    if (headerCoreSize) {
        const width =
            parseFloat(document.getElementById('core-width-input').value) || 43;
        const height =
            parseFloat(document.getElementById('core-height-input').value) || 78;
        const headerTextNode = Array.from(headerCoreSize.childNodes)
            .find((node) => node.nodeType === Node.TEXT_NODE);

        if (headerTextNode) {
            headerTextNode.nodeValue =
                `: ${(width / 10).toFixed(2)}x${(height / 10).toFixed(2)}cm`;
        }
    }

    const customInput = document.getElementById('print-custom');
    if (customInput) {
        customInput.placeholder = t('custom_placeholder');
    }

    const mascotImage = document.getElementById('mascot-preview');
    if (mascotImage) {
        mascotImage.alt = t('mascot_alt');
    }

    ['lang-toggle-btn', 'mobile-lang-toggle-btn'].forEach((id) => {
        const button = document.getElementById(id);

        if (button) {
            const label = t('language_button_label');
            button.setAttribute('aria-label', label);
            button.title = label;
        }
    });

    [
        ['pc-top-print-btn', 'mobile_print_text'],
        ['mobile-print-btn', 'mobile_print_text'],
        ['history-undo', 'history_undo_label'],
        ['history-redo', 'history_redo_label']
    ].forEach(([id, key]) => {
        const button = document.getElementById(id);

        if (button) {
            const label = t(key);
            button.setAttribute('aria-label', label);
            button.title = label;
        }
    });

    const closeButton = document.getElementById('close-export-modal');
    if (closeButton) {
        closeButton.setAttribute(
            'aria-label',
            t('close_export_label')
        );
    }

    const settingsBackButton =
        document.getElementById('settings-back-btn');
    if (settingsBackButton) {
        const backLabel = t('settings_back_label');

        settingsBackButton.setAttribute('aria-label', backLabel);
        settingsBackButton.title = backLabel;
    }

    refreshTranslatedFileNames();

    // Các module khác (kéo thả, bản nháp, preset, dàn trang) nghe sự
    // kiện này để vẽ lại theo ngôn ngữ mới — thay cơ chế gọi trực tiếp
    // trước đây (R1), giữ i18n là module lá không phụ thuộc ngược.
    document.dispatchEvent(new CustomEvent('rairaitei:language-changed'));
};

export function setLanguage(language) {
    if (language !== 'jp' && language !== 'vn') return;

    currentLang = language;

    try {
        localStorage.setItem('rairaitei-language', language);
    } catch (error) {
        // The language still changes when browser storage is unavailable.
    }

    applyTranslations();
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
                refreshTranslatedFileNames
            );
        }
    });

    applyTranslations();
});
