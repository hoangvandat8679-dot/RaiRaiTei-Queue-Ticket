// Trạng thái ảnh dùng chung (nền tự tải + linh vật): design-history đọc/ghi
// qua object này thay cho các biến toàn cục rời trước đây (R1).
export const imageState = {
    currentBgBase64: null,
    currentMascotBase64: null,
    mascotImgSrcRaw: null
};

// URL linh vật riêng của mẫu đang áp (Hạ/Thu/Đông tách lớp có linh vật riêng
// kèm chữ vòng cung). Registry đặt qua applyTemplateMascot(); mọi thao tác
// linh vật do người dùng tự làm (chọn mặc định/tải ảnh/xóa nền trắng) đều
// xóa dấu này — từ đó linh vật thuộc về người dùng, không còn của mẫu.
let templateMascotUrl = null;

function processMascot(imageSrc, { stripWhite = true } = {}) {
    const mascotPreview = document.getElementById('mascot-preview');
    const img = new Image(); img.crossOrigin = "Anonymous";
    img.onload = function() {
        // Logic quét mảng pixel để xóa các vùng có màu Trắng
        if(stripWhite && document.getElementById('remove-white-bg').checked) {
            const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
            const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            for(let i = 0; i < data.data.length; i += 4) {
                if(data.data[i] > 245 && data.data[i+1] > 245 && data.data[i+2] > 245) data.data[i+3] = 0;
            }
            ctx.putImageData(data, 0, 0);
            imageState.currentMascotBase64 = canvas.toDataURL('image/png');
            mascotPreview.src = imageState.currentMascotBase64;
        } else {
            imageState.currentMascotBase64 = imageSrc;
            mascotPreview.src = imageState.currentMascotBase64;
        }
    }
    img.src = imageSrc;
}

async function loadDefaultMascot() {
    try {
        const res = await fetch('assets/images/mascot.png');

        if (!res.ok) {
            throw new Error('Default mascot could not be loaded.');
        }

        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
            imageState.mascotImgSrcRaw = reader.result;
            processMascot(imageState.mascotImgSrcRaw);
        }
        reader.readAsDataURL(blob);
    } catch (error) {
        console.error('Failed to load the default mascot.', error);
    }
}

// Registry gọi khi áp mẫu: mẫu có linh vật riêng thì nạp ảnh đó qua đúng
// đường xử lý của trình sửa linh vật (kể cả xóa nền trắng nếu đang bật);
// mẫu không có thì chỉ xóa dấu — việc đặt lại linh vật mặc định do nhánh
// radio "default" trong registry đảm nhiệm như trước.
export async function applyTemplateMascot(url) {
    if (!url) {
        templateMascotUrl = null;
        return;
    }
    if (templateMascotUrl === url && imageState.currentMascotBase64) return;
    templateMascotUrl = url;
    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error('Template mascot could not be loaded.');
        }
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
            // Chỉ áp nếu mẫu này vẫn đang là mẫu hiện hành (tránh đua khi
            // người dùng chuyển mẫu nhanh liên tiếp).
            // Ảnh linh vật của mẫu đã có nền trong suốt và chứa chi tiết
            // màu trắng có chủ đích (vd chữ vòng cung trắng của mẫu Hạ)
            // nên không áp bước xóa nền trắng dành cho mascot.png gốc.
            if (templateMascotUrl === url) processMascot(reader.result, { stripWhite: false });
        }
        reader.readAsDataURL(blob);
    } catch (error) {
        console.error('Failed to load the template mascot.', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const mascotPreview = document.getElementById('mascot-preview');
    const customMascotPanel = document.getElementById('custom-mascot-panel');

    customMascotPanel.classList.remove('hidden');

    loadDefaultMascot();

    document.getElementsByName('mascot-type').forEach(radio => {
        radio.addEventListener('change', (e) => {
            templateMascotUrl = null;
            if (e.target.value === 'default') {
                loadDefaultMascot();

                const mascotWidthSlider =
                    document.getElementById('mascot-width');

                mascotWidthSlider.value = '0';
                mascotWidthSlider.dispatchEvent(
                    new Event('input', { bubbles: true })
                );
            } else {
                if (imageState.mascotImgSrcRaw) processMascot(imageState.mascotImgSrcRaw); else mascotPreview.src = '';
            }
        });
    });

    // Lắng nghe sự kiện khi người dùng tự bấm nút tải ảnh hoặc tích/bỏ tích nút xóa nền
    document.getElementById('mascot-upload').addEventListener('change', function(e) {
        if (e.target.files[0]) {
            templateMascotUrl = null;
            const reader = new FileReader();
            reader.onload = function(event) {
                imageState.mascotImgSrcRaw = event.target.result;
                document.querySelector('input[value="custom"]').checked = true;
                processMascot(imageState.mascotImgSrcRaw);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    document.getElementById('remove-white-bg').addEventListener('change', () => {
        templateMascotUrl = null;
        if(imageState.mascotImgSrcRaw) processMascot(imageState.mascotImgSrcRaw);
    });

    document.getElementById('bg-upload').addEventListener('change', function(e) {
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(event) {
                imageState.currentBgBase64 = event.target.result;
                document.body.style.setProperty('--bg-image', `url('${imageState.currentBgBase64}')`);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
});
