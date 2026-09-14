/* ============================================================ */
/* FILE: js/templates.js                                        */
/* ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    const masterTicketInner =
        document.getElementById('master-ticket-inner');
    const springButton = document.getElementById('spring-template-btn');
    const standardButton =
        document.getElementById('standard-template-btn');

    if (!masterTicketInner || !springButton || !standardButton) return;

    const springPreset = {
        'bg-opacity': 1,
        'cut-margin-x': 0,
        'cut-margin-y': 0,
        'mascot-width': 67.4,
        'mascot-y': -1.3,
        'number-size': 108,
        'number-offset-y': 0.5,
        'frame-width': 40.87,
        'frame-height': 36.9,
        'frame-y': 21.6,
        'msg-size': 8,
        'msg-y': 7.7,
        'branch-size': 6,
        'branch-y': 2.8,
        'branch-width': 77,
        'branch-pad-y': 0.7,
        'branch-radius': 0
    };

    const borderControlIds = [
        'border-tool-toggle',
        'border-width',
        'dot-density',
        'dot-size-1',
        'dot-size-2',
        'dot-offset'
    ];

    // Các chi tiết này là ảnh trang trí cố định của mẫu Mùa Xuân.
    // Khóa chúng để không có điều khiển nào tạo cảm giác thay đổi được nhưng không có hiệu lực.
    const springStaticArtControlIds = [
        'bg-color',
        'bg-opacity',
        'number-bg-color',
        'number-border-color',
        'number-border-width',
        'branch-bg',
        'branch-radius'
    ];

    const setInputValue = (id, value, eventName = 'input') => {
        const input = document.getElementById(id);

        if (!input) return;
        input.value = value;
        input.dispatchEvent(new Event(eventName, { bubbles: true }));
    };

    const setToolState = (id, checked, disabled = false) => {
        const toggle = document.getElementById(id);

        if (!toggle) return;
        toggle.checked = checked;
        toggle.disabled = disabled;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const setControlDisabled = (id, disabled) => {
        const control = document.getElementById(id);
        if (control) control.disabled = disabled;

        const valueControl = document.getElementById(`${id}-val`);
        if (valueControl) {
            valueControl.disabled = disabled;
            valueControl.parentElement?.querySelectorAll('button').forEach((button) => {
                button.disabled = disabled;
            });
        }
    };

    const setBorderControlsDisabled = (disabled) => {
        borderControlIds.forEach((id) => setControlDisabled(id, disabled));
    };

    const setSpringStaticArtControlsDisabled = (disabled) => {
        springStaticArtControlIds.forEach((id) => setControlDisabled(id, disabled));
    };

    const selectTemplate = (name) => {
        [springButton, standardButton].forEach((button) => {
            const selected = button.dataset.template === name;
            button.classList.toggle('is-selected', selected);
            button.setAttribute('aria-pressed', String(selected));
        });
    };

    const activateSpring = () => {
        masterTicketInner.classList.add('spring-template');
        document.body.dataset.template = 'spring';
        /*
          Nền mặc định của mẫu là ảnh hoa anh đào. Ảnh người dùng tải lên khi
          đang dùng mẫu (image-editor đặt --bg-image) sẽ đè lên ảnh này.
          Bấm lại "Mùa Xuân" để đưa nền về mặc định.
        */
        document.body.style.setProperty(
            '--bg-image',
            "url('https://cdn.jsdelivr.net/gh/hoangvandat8679-dot/assets-images@main/spring-background.png')"
        );

        if (window.applyControlPreset) {
            window.applyControlPreset(springPreset);
        }

        setInputValue('bg-color', '#fff9f2');
        setInputValue('number-color', '#ed5793');
        setInputValue('number-bg-color', '#ffffff');
        setInputValue('number-border-color', '#d5ad45');
        setInputValue('msg-color', '#111111');
        setInputValue('branch-color', '#ffffff');
        setInputValue('branch-bg', '#ec5a8b');

        setInputValue('number-font-select', "'Times New Roman', 'Noto Serif JP', serif", 'change');
        setInputValue('msg-font', "'Noto Sans JP', sans-serif", 'change');
        setInputValue('branch-font', "'Noto Sans JP', sans-serif", 'change');

        const defaultMascot = document.querySelector(
            'input[name="mascot-type"][value="default"]'
        );
        if (defaultMascot) {
            defaultMascot.checked = true;
            defaultMascot.dispatchEvent(
                new Event('change', { bubbles: true })
            );
        }

        setToolState('background-tool-toggle', true, true);
        setToolState('border-tool-toggle', false, true);
        setToolState('mascot-tool-toggle', true);
        setToolState('number-tool-toggle', true);
        setToolState('message-tool-toggle', true);
        setToolState('branch-tool-toggle', true);
        setBorderControlsDisabled(true);
        setSpringStaticArtControlsDisabled(true);

        selectTemplate('spring');
        window.calculateAILayout?.();
    };

    const activateStandard = () => {
        masterTicketInner.classList.remove('spring-template');
        delete document.body.dataset.template;
        document.body.style.removeProperty('--bg-image');

        if (window.applyControlPreset) {
            window.applyControlPreset();
        }

        setInputValue('bg-color', '#fcd116');
        setInputValue('number-color', '#e60012');
        setInputValue('number-bg-color', '#ffffff');
        setInputValue('number-border-color', '#e60012');
        setInputValue('msg-color', '#111111');
        setInputValue('branch-color', '#ffffff');
        setInputValue('branch-bg', '#e60012');
        setInputValue('number-font-select', "'Impact', sans-serif", 'change');

        setBorderControlsDisabled(false);
        setSpringStaticArtControlsDisabled(false);
        setToolState('background-tool-toggle', true);
        setToolState('border-tool-toggle', true);
        setToolState('mascot-tool-toggle', true);
        setToolState('number-tool-toggle', true);
        setToolState('message-tool-toggle', true);
        setToolState('branch-tool-toggle', true);

        selectTemplate('standard');
        window.calculateAILayout?.();
    };

    springButton.addEventListener('click', activateSpring);
    standardButton.addEventListener('click', activateStandard);
    selectTemplate('standard');
});
