window.currentBgBase64 = null; window.currentMascotBase64 = null; window.mascotImgSrcRaw = null;

document.addEventListener('DOMContentLoaded', () => {
    const mascotPreview = document.getElementById('mascot-preview');
    const customMascotPanel = document.getElementById('custom-mascot-panel');

    customMascotPanel.classList.remove('hidden');

    async function loadDefaultMascot() {
        try {
            const res = await fetch('assets/images/mascot.png');

            if (!res.ok) {
                throw new Error('Default mascot could not be loaded.');
            }

            const blob = await res.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
                window.mascotImgSrcRaw = reader.result; 
                processMascot(window.mascotImgSrcRaw);  
            }
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Failed to load the default mascot.', error);
        }
    }
    loadDefaultMascot();

    document.getElementsByName('mascot-type').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'default') {
                loadDefaultMascot();

                const mascotWidthSlider =
                    document.getElementById('mascot-width');

                mascotWidthSlider.value = '0';
                mascotWidthSlider.dispatchEvent(
                    new Event('input', { bubbles: true })
                );
            } else {
                if (window.mascotImgSrcRaw) processMascot(window.mascotImgSrcRaw); else mascotPreview.src = '';
            }
        });
    });

    function processMascot(imageSrc) {
        const img = new Image(); img.crossOrigin = "Anonymous"; 
        img.onload = function() {
            // Logic quét mảng pixel để xóa các vùng có màu Trắng
            if(document.getElementById('remove-white-bg').checked) {
                const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
                const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
                const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
                for(let i = 0; i < data.data.length; i += 4) { 
                    if(data.data[i] > 245 && data.data[i+1] > 245 && data.data[i+2] > 245) data.data[i+3] = 0; 
                }
                ctx.putImageData(data, 0, 0); 
                window.currentMascotBase64 = canvas.toDataURL('image/png'); 
                mascotPreview.src = window.currentMascotBase64;
            } else { 
                window.currentMascotBase64 = imageSrc; 
                mascotPreview.src = window.currentMascotBase64; 
            }
        }
        img.src = imageSrc;
    }

    // Lắng nghe sự kiện khi người dùng tự bấm nút tải ảnh hoặc tích/bỏ tích nút xóa nền
    document.getElementById('mascot-upload').addEventListener('change', function(e) { 
        if (e.target.files[0]) { 
            const reader = new FileReader(); 
            reader.onload = function(event) { 
                window.mascotImgSrcRaw = event.target.result; 
                document.querySelector('input[value="custom"]').checked = true;
                processMascot(window.mascotImgSrcRaw); 
            }; 
            reader.readAsDataURL(e.target.files[0]); 
        } 
    });
    
    document.getElementById('remove-white-bg').addEventListener('change', () => { 
        if(window.mascotImgSrcRaw) processMascot(window.mascotImgSrcRaw); 
    });
    
    document.getElementById('bg-upload').addEventListener('change', function(e) { 
        if (e.target.files[0]) { 
            const reader = new FileReader(); 
            reader.onload = function(event) { 
                window.currentBgBase64 = event.target.result; 
                document.body.style.setProperty('--bg-image', `url('${window.currentBgBase64}')`); 
            }; 
            reader.readAsDataURL(e.target.files[0]); 
        } 
    });
});