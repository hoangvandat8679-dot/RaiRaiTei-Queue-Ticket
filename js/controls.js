/* ============================================================ */
/* FILE: js/controls.js                                         */
/* ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('msg-input').addEventListener('input', (e) => { const displayMsg = document.getElementById('display-msg'); displayMsg.textContent = e.target.value; displayMsg.style.whiteSpace = 'pre-line'; });
    document.getElementById('branch-input').addEventListener('input', (e) => { document.getElementById('display-branch').textContent = e.target.value; });
    
    ['number-font-select', 'msg-font', 'msg-weight', 'msg-style', 'branch-font', 'branch-weight', 'branch-style'].forEach(id => {
        const el = document.getElementById(id); if(el) el.addEventListener('change', (e) => { document.body.style.setProperty(`--${id.replace('-select', '')}`, e.target.value); });
    });

    const colorInputs = ['bg-color', 'number-color', 'number-bg-color', 'number-border-color', 'msg-color', 'msg-stroke-c', 'branch-color', 'branch-bg', 'branch-stroke-c'];
    colorInputs.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            document.body.style.setProperty(`--${id}`, el.value);
            el.addEventListener('input', (e) => {
                document.body.style.setProperty(`--${id}`, e.target.value);
            });
        }
    });

    const toolToggles = [
        {
            id: 'background-tool-toggle',
            property: '--background-layer-display',
            enabledDisplay: 'block'
        },
        {
            id: 'border-tool-toggle',
            property: '--border-display',
            enabledDisplay: 'block'
        },
        {
            id: 'mascot-tool-toggle',
            property: '--mascot-display',
            enabledDisplay: 'block'
        },
        {
            id: 'number-tool-toggle',
            property: '--number-display',
            enabledDisplay: 'flex'
        },
        {
            id: 'message-tool-toggle',
            property: '--message-display',
            enabledDisplay: 'block'
        },
        {
            id: 'branch-tool-toggle',
            property: '--branch-display',
            enabledDisplay: 'block'
        }
    ];

    toolToggles.forEach((definition) => {
        const toggle = document.getElementById(definition.id);

        if (!toggle) return;

        const applyToolState = () => {
            document.body.style.setProperty(
                definition.property,
                toggle.checked
                    ? definition.enabledDisplay
                    : 'none'
            );
        };

        toggle.addEventListener('change', applyToolState);
        applyToolState();
    });

    /*
      Mỗi thanh trượt biểu diễn độ lệch so với giá trị chuẩn.
      Điểm giữa luôn là 0; giá trị CSS thực = base + delta.
    */
    const controls = [
        { id: 'bg-opacity', unit: '', base: 0.20, limit: 0.20, min: 0, max: 1 },
        { id: 'cut-margin-x', unit: 'mm', base: 1.0, limit: 1.0, min: 0, max: 10, affectsLayout: true },
        { id: 'cut-margin-y', unit: 'mm', base: 1.0, limit: 1.0, min: 0, max: 10, affectsLayout: true },
        { id: 'border-width', unit: 'mm', base: 2.0, limit: 1.5, min: 0.5, max: 10 },
        { id: 'dot-size-1', unit: 'mm', base: 1.5, limit: 1.5, min: 0, max: 8 },
        { id: 'dot-size-2', unit: 'mm', base: 1.2, limit: 1.2, min: 0, max: 8 },
        { id: 'dot-offset', unit: 'mm', base: 0.3, limit: 0.3, min: 0, max: 10 },
        { id: 'dot-density', unit: '', base: 68, limit: 20, min: 10, max: 100 },
        { id: 'mascot-width', unit: '%', base: 61, limit: 39, min: 10, max: 100 },
        { id: 'mascot-y', unit: 'mm', base: 0, limit: 20, min: -20, max: 150 },
        { id: 'number-size', unit: 'pt', base: 100, limit: 90, min: 10, max: 250 },
        { id: 'number-offset-y', unit: 'mm', base: 0, limit: 50, min: -100, max: 100 },
        { id: 'frame-width', unit: 'mm', base: 39, limit: 20, min: 10, max: 150 },
        { id: 'frame-height', unit: 'mm', base: 37.5, limit: 20, min: 10, max: 150 },
        { id: 'frame-y', unit: 'mm', base: 21.5, limit: 20, min: 0, max: 200 },
        { id: 'number-border-width', unit: 'mm', base: 1, limit: 1, min: 0, max: 5 },
        { id: 'msg-size', unit: 'pt', base: 8, limit: 5, min: 3, max: 50 },
        { id: 'msg-y', unit: 'mm', base: 6, limit: 6, min: 0, max: 150 },
        { id: 'msg-stroke-w', unit: 'pt', base: 0, limit: 2, min: 0, max: 5 },
        { id: 'branch-size', unit: 'pt', base: 6, limit: 3, min: 3, max: 50 },
        { id: 'branch-y', unit: 'mm', base: 2.5, limit: 2.5, min: 0, max: 50 },
        { id: 'branch-width', unit: '%', base: 90, limit: 10, min: 10, max: 100 },
        { id: 'branch-pad-y', unit: 'mm', base: 0, limit: 3, min: 0, max: 10 },
        { id: 'branch-radius', unit: 'mm', base: 3.2, limit: 3.2, min: 0, max: 10 },
        { id: 'branch-stroke-w', unit: 'pt', base: 0, limit: 2, min: 0, max: 5 }
    ];

    const clamp = (value, min, max) =>
        Math.min(max, Math.max(min, value));

    const decimalsForStep = (step) => {
        const text = String(step || '1');
        return text.includes('.') ? text.split('.')[1].length : 0;
    };

    const formatDelta = (value, decimals) => {
        const threshold = Math.pow(10, -decimals) / 2;

        if (Math.abs(value) < threshold) return '0';

        const formatted = value.toFixed(decimals);
        return value > 0 ? '+' + formatted : formatted;
    };

    const createDeltaStepper = (numInput) => {
        let wrapper = numInput.closest('.delta-stepper');

        if (!wrapper) {
            wrapper = document.createElement('span');
            wrapper.className = 'delta-stepper';
            numInput.parentNode.insertBefore(wrapper, numInput);
            wrapper.appendChild(numInput);
        }

        let buttonGroup = wrapper.querySelector(
            '.delta-stepper-buttons'
        );

        if (!buttonGroup) {
            buttonGroup = document.createElement('span');
            buttonGroup.className = 'delta-stepper-buttons';

            const increaseButton = document.createElement('button');
            increaseButton.type = 'button';
            increaseButton.className =
                'delta-step-button delta-step-up';
            increaseButton.setAttribute('aria-label', '+0.1');
            increaseButton.setAttribute('title', '+0.1');
            increaseButton.setAttribute('aria-controls', numInput.id);

            const decreaseButton = document.createElement('button');
            decreaseButton.type = 'button';
            decreaseButton.className =
                'delta-step-button delta-step-down';
            decreaseButton.setAttribute('aria-label', '-0.1');
            decreaseButton.setAttribute('title', '-0.1');
            decreaseButton.setAttribute('aria-controls', numInput.id);

            buttonGroup.append(increaseButton, decreaseButton);
            wrapper.appendChild(buttonGroup);
        }

        return {
            increaseButton: buttonGroup.querySelector(
                '.delta-step-up'
            ),
            decreaseButton: buttonGroup.querySelector(
                '.delta-step-down'
            )
        };
    };

    controls.forEach((definition) => {
        const rangeInput = document.getElementById(definition.id);
        const numInput =
            document.getElementById(definition.id + '-val');

        if (!rangeInput || !numInput) return;

        const fineStep = 0.1;
        const decimals = decimalsForStep(fineStep);

        rangeInput.min = String(-definition.limit);
        rangeInput.max = String(definition.limit);
        rangeInput.step = String(fineStep);

        numInput.type = 'text';
        numInput.inputMode = 'decimal';
        numInput.autocomplete = 'off';

        const {
            increaseButton,
            decreaseButton
        } = createDeltaStepper(numInput);

        const applyDelta = (
            rawDelta,
            syncRange = true,
            syncText = true
        ) => {
            const delta = clamp(
                Number.isFinite(rawDelta) ? rawDelta : 0,
                -definition.limit,
                definition.limit
            );
            const roundedDelta = Math.round(
                delta * Math.pow(10, decimals)
            ) / Math.pow(10, decimals);
            const actualValue = clamp(
                definition.base + roundedDelta,
                definition.min,
                definition.max
            );

            if (syncRange) {
                rangeInput.value = String(roundedDelta);
            }
            if (syncText) {
                numInput.value = formatDelta(
                    roundedDelta,
                    decimals
                );
            }

            document.body.style.setProperty(
                '--' + definition.id,
                String(
                    Math.round(actualValue * 10000) / 10000
                ) + definition.unit
            );

            if (
                definition.affectsLayout &&
                window.calculateAILayout
            ) {
                window.calculateAILayout();
            }

            return roundedDelta;
        };

        const stepDelta = (direction) => {
            const rawValue = numInput.value
                .trim()
                .replace(',', '.')
                .replace(/^\+/, '');
            const parsedValue = Number(rawValue);
            const currentDelta = Number.isFinite(parsedValue)
                ? parsedValue
                : Number(rangeInput.value) || 0;

            applyDelta(currentDelta + direction * fineStep);
        };

        const bindStepButton = (button, direction) => {
            if (!button) return;

            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                stepDelta(direction);
                numInput.focus({ preventScroll: true });
            });
        };

        bindStepButton(increaseButton, 1);
        bindStepButton(decreaseButton, -1);

        let initialDelta = Number(
            String(rangeInput.value).replace(',', '.')
        );

        if (!Number.isFinite(initialDelta)) initialDelta = 0;
        applyDelta(initialDelta);

        rangeInput.addEventListener('input', (event) => {
            applyDelta(Number(event.target.value));
        });

        numInput.addEventListener('input', (event) => {
            const raw = event.target.value
                .trim()
                .replace(',', '.');

            if (
                raw === '' ||
                raw === '-' ||
                raw === '+' ||
                raw === '.' ||
                raw === '-.' ||
                raw === '+.'
            ) {
                return;
            }

                       const parsed = Number(raw);

            if (!Number.isFinite(parsed)) return;

            const delta = clamp(
                parsed,
                -definition.limit,
                definition.limit
            );

            rangeInput.value = String(delta);
            applyDelta(delta, false, false);
        });

        numInput.addEventListener('blur', () => {
            const parsed = Number(
                numInput.value.trim().replace(',', '.')
            );
            applyDelta(
                Number.isFinite(parsed)
                    ? parsed
                    : Number(rangeInput.value)
            );
        });

        numInput.addEventListener('keydown', (event) => {
            if (event.key !== 'ArrowUp' &&
                event.key !== 'ArrowDown') {
                return;
            }

            event.preventDefault();
            stepDelta(event.key === 'ArrowUp' ? 1 : -1);
        });
    });

    const coreWInput = document.getElementById('core-width-input'); const coreHInput = document.getElementById('core-height-input');
    function updateCoreSize() {
        const w = Math.min(297, Math.max(1, parseFloat(coreWInput.value) || 44)); const h = Math.min(297, Math.max(1, parseFloat(coreHInput.value) || 79));
        coreWInput.value = w.toFixed(1); coreHInput.value = h.toFixed(1);
        document.body.style.setProperty('--core-width', w + 'mm'); document.body.style.setProperty('--core-height', h + 'mm');
        const headerCoreLabel = document.getElementById('core_size_label_header');
        if (headerCoreLabel) { headerCoreLabel.textContent = window.translations[window.currentLang]['core_size_label']; const headerTextNode = Array.from(document.getElementById('header-core-size').childNodes).find(node => node.nodeType === Node.TEXT_NODE); if (headerTextNode) headerTextNode.nodeValue = `: ${(w/10).toFixed(2)}x${(h/10).toFixed(2)}cm`; }
        window.calculateAILayout();
    }
    coreWInput.addEventListener('input', updateCoreSize); coreHInput.addEventListener('input', updateCoreSize);
    updateCoreSize();
    document.getElementById('print-quantity').addEventListener('input', (e) => { let qty = parseInt(e.target.value, 10); if (!Number.isFinite(qty)) qty = 1; e.target.value = Math.min(5000, Math.max(1, qty)); window.calculateAILayout(); });
});

