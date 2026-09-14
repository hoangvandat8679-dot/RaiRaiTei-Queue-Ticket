/* ============================================================ */
/* FILE: js/design-history.js                                    */
/* Undo/redo + thư mục thiết kế (tải lên/xuống) dùng chung       */
/* ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    const historyState = {
        undo: [],
        redo: [],
        applying: false,
        images: {
            bg: null,
            mascot: null
        }
    };

    const collectDesign = () => {
        const design = {
            app: 'RaiRaiTei Queue Ticket',
            format: 'rairaitei-design',
            version: 1,
            savedAt: new Date().toISOString(),
            template: document.body.dataset.template || 'standard',
            controls: {},
            colors: {},
            fonts: {},
            toggles: {},
            mascots: {}
        };

        document
            .querySelectorAll('input[type="range"], input[type="number"]')
            .forEach((input) => {
                if (input.id) {
                    design.controls[input.id] = Number(input.value);
                }
            });

        document.querySelectorAll('input[type="color"]').forEach((input) => {
            if (input.id) {
                design.colors[input.id] = input.value;
            }
        });

        ['number-font-select', 'msg-font', 'branch-font'].forEach((id) => {
            const select = document.getElementById(id);

            if (select) {
                design.fonts[id] = select.value;
            }
        });

        [
            'background-tool-toggle',
            'border-tool-toggle',
            'mascot-tool-toggle',
            'number-tool-toggle',
            'message-tool-toggle',
            'branch-tool-toggle',
            'duplex-print-toggle'
        ].forEach((id) => {
            const toggle = document.getElementById(id);

            if (toggle) {
                design.toggles[id] = toggle.checked;
            }
        });

        ['msg-weight', 'msg-style', 'branch-weight', 'branch-style'].forEach(
            (id) => {
                const select = document.getElementById(id);

                if (select) {
                    design.mascots[id] = select.value;
                }
            }
        );

        const mascotType = document.querySelector(
            'input[name="mascot-type"]:checked'
        );

        if (mascotType) {
            design.mascotType = mascotType.value;
        }

        if (window.currentBgBase64) {
            design.backgroundImage = window.currentBgBase64;
            historyState.images.bg = window.currentBgBase64;
        }

        if (window.currentMascotBase64) {
            design.mascotImage = window.currentMascotBase64;
            historyState.images.mascot = window.currentMascotBase64;
        }

        return design;
    };

    const applyValue = (id, value, eventName = 'input') => {
        const input = document.getElementById(id);

        if (!input) return;
        input.value = value;
        input.dispatchEvent(new Event(eventName, { bubbles: true }));
    };

    const applyDesign = (design) => {
        if (
            !design ||
            design.format !== 'rairaitei-design' ||
            typeof design !== 'object'
        ) {
            return false;
        }

        historyState.applying = true;

        try {
            if (design.template === 'spring') {
                const springButton = document.getElementById(
                    'spring-template-btn'
                );

                if (springButton) springButton.click();
            } else {
                const standardButton = document.getElementById(
                    'standard-template-btn'
                );

                if (standardButton) standardButton.click();
            }

            if (design.controls) {
                Object.entries(design.controls).forEach(([id, value]) => {
                    if (typeof value === 'number') {
                        applyValue(id, String(value));
                    }
                });
            }

            if (design.colors) {
                Object.entries(design.colors).forEach(([id, value]) => {
                    if (
                        typeof value === 'string' &&
                        /^#[0-9a-fA-F]{3,8}$/.test(value)
                    ) {
                        applyValue(id, value, 'change');
                    }
                });
            }

            if (design.fonts) {
                Object.entries(design.fonts).forEach(([id, value]) => {
                    if (typeof value === 'string') {
                        const select = document.getElementById(id);
                        const exists =
                            select &&
                            Array.from(select.options).some(
                                (option) => option.value === value
                            );

                        if (exists) {
                            applyValue(id, value, 'change');
                        }
                    }
                });
            }

            if (design.mascots) {
                Object.entries(design.mascots).forEach(([id, value]) => {
                    if (typeof value === 'string') {
                        applyValue(id, value, 'change');
                    }
                });
            }

            if (design.toggles) {
                Object.entries(design.toggles).forEach(([id, value]) => {
                    if (typeof value === 'boolean') {
                        const toggle = document.getElementById(id);

                        if (toggle && !toggle.disabled) {
                            toggle.checked = value;
                            toggle.dispatchEvent(
                                new Event('change', { bubbles: true })
                            );
                        }
                    }
                });
            }

            if (typeof design.backgroundImage === 'string') {
                window.currentBgBase64 = design.backgroundImage;
                document.body.style.setProperty(
                    '--bg-image',
                    `url('${design.backgroundImage}')`
                );
            }

            if (
                typeof design.mascotImage === 'string' &&
                design.mascotImage.startsWith('data:image/')
            ) {
                window.currentMascotBase64 = design.mascotImage;
                const mascotImg = document.getElementById('mascot-preview');

                if (mascotImg) {
                    mascotImg.src = design.mascotImage;
                }
            }

            if (design.mascotType === 'default' || design.mascotType === 'custom') {
                const radio = document.querySelector(
                    `input[name="mascot-type"][value="${design.mascotType}"]`
                );

                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(
                        new Event('change', { bubbles: true })
                    );
                }
            }
        } finally {
            historyState.applying = false;
        }

        return true;
    };

    const updateButtons = () => {
        [
            'history-undo',
            'pc-history-undo'
        ].forEach((id) => {
            const button = document.getElementById(id);

            if (button) {
                button.disabled = historyState.undo.length < 2;
            }
        });

        [
            'history-redo',
            'pc-history-redo'
        ].forEach((id) => {
            const button = document.getElementById(id);

            if (button) {
                button.disabled = historyState.redo.length === 0;
            }
        });
    };

    const capture = () => {
        if (historyState.applying) return;

        historyState.undo.push(collectDesign());

        if (historyState.undo.length > 50) {
            historyState.undo.shift();
        }

        historyState.redo = [];
        updateButtons();
    };

    const undo = () => {
        if (historyState.undo.length < 2) return;

        const current = historyState.undo.pop();

        historyState.redo.push(current);
        applyDesign(historyState.undo[historyState.undo.length - 1]);
        updateButtons();
    };

    const redo = () => {
        if (historyState.redo.length === 0) return;

        const next = historyState.redo.pop();

        historyState.undo.push(next);
        applyDesign(next);
        updateButtons();
    };

    const clearHistory = () => {
        historyState.redo = [];
        historyState.undo = [collectDesign()];
        updateButtons();
    };

    let captureTimer = null;

    const scheduleCapture = () => {
        if (historyState.applying) return;

        clearTimeout(captureTimer);
        captureTimer = setTimeout(capture, 350);
    };

    document.addEventListener('input', (event) => {
        const target = event.target;

        if (
            target instanceof HTMLInputElement &&
            ['range', 'number', 'color', 'text'].includes(target.type)
        ) {
            scheduleCapture();
        }
    });

    document.addEventListener('change', (event) => {
        const target = event.target;

        if (
            target instanceof HTMLInputElement &&
            ['checkbox', 'radio', 'file'].includes(target.type)
        ) {
            if (target.type === 'file') return;
            scheduleCapture();
        } else if (target instanceof HTMLSelectElement) {
            scheduleCapture();
        }
    });

    const clearBtn = document.getElementById('history-clear');
    const downloadBtn = document.getElementById('history-download');
    const restoreInput = document.getElementById('restore-file');

    [
        'history-undo',
        'pc-history-undo'
    ].forEach((id) => {
        const button = document.getElementById(id);

        if (button) button.addEventListener('click', undo);
    });

    [
        'history-redo',
        'pc-history-redo'
    ].forEach((id) => {
        const button = document.getElementById(id);

        if (button) button.addEventListener('click', redo);
    });

    if (clearBtn) clearBtn.addEventListener('click', clearHistory);

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const backupBtn = document.getElementById('backup-btn');

            if (backupBtn) backupBtn.click();
        });
    }

    historyState.undo.push(collectDesign());
    updateButtons();

    window.designHistory = {
        collect: collectDesign,
        apply: applyDesign,
        capture
    };
});
