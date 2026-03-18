
(function () {
    'use strict';

    const ADMIN_CREDENTIALS = {
        username: 'admin',
        password: 'admin123'
    };

    let currentImageFile = null;

    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        showAdminPanel();
        loadPromotions();
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
                sessionStorage.setItem('adminLoggedIn', 'true');
                showAdminPanel();
                loadPromotions();
            } else {
                alert('Błędna nazwa użytkownika lub hasło!');
            }
        });
    }

    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('promoImage');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');

    if (uploadArea) {
        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });
    }

    const addPromotionForm = document.getElementById('addPromotionForm');
    if (addPromotionForm) {
        addPromotionForm.addEventListener('submit', function (e) {
            e.preventDefault();
            savePromotion();
        });
    }

    function showAdminPanel() {
        document.getElementById('loginBox').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
    }

    window.logout = function () {
        sessionStorage.removeItem('adminLoggedIn');
        location.reload();
    };

    window.togglePromotionForm = function () {
        const form = document.getElementById('promotionForm');
        form.classList.toggle('active');
        if (!form.classList.contains('active')) {
            document.getElementById('addPromotionForm').reset();
            imagePreview.style.display = 'none';
            currentImageFile = null;
        }
    };

    function handleFileUpload(file) {
        if (!file.type.startsWith('image/')) {
            showAlert('Proszę wybrać plik graficzny (JPG, PNG)', 'error');
            return;
        }

        currentImageFile = file;

        const reader = new FileReader();
        reader.onload = function (e) {
            previewImg.src = e.target.result;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    function savePromotion() {
        if (!currentImageFile) {
            showAlert('Proszę dodać grafikę promocji', 'error');
            return;
        }

        const promotion = {
            id: Date.now(),
            title: document.getElementById('promoTitle').value,
            description: document.getElementById('promoDescription').value,
            oldPrice: document.getElementById('promoOldPrice').value,
            newPrice: document.getElementById('promoNewPrice').value,
            badge: document.getElementById('promoBadge').value,
            image: previewImg.src,
            createdAt: new Date().toISOString()
        };

        let promotions = JSON.parse(localStorage.getItem('promotions') || '[]');
        promotions.push(promotion);
        localStorage.setItem('promotions', JSON.stringify(promotions));

        showAlert('Promocja została dodana pomyślnie!', 'success');
        document.getElementById('addPromotionForm').reset();
        imagePreview.style.display = 'none';
        currentImageFile = null;
        togglePromotionForm();
        loadPromotions();
    }

    function loadPromotions() {
        const promotions = JSON.parse(localStorage.getItem('promotions') || '[]');
        const container = document.getElementById('existingPromotions');

        if (promotions.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #6c757d;">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>Brak dodanych promocji</p>
                </div>
            `;
            return;
        }

        container.innerHTML = promotions.map(promo => `
            <div class="admin-promotion-card">
                ${promo.badge ? `<div class="promotion-badge">${promo.badge}</div>` : ''}
                <img src="${promo.image}" alt="${promo.title}" class="admin-promotion-image">
                <div class="admin-promotion-content">
                    <h4 style="font-weight: 700; margin-bottom: 0.5rem;">${promo.title}</h4>
                    <p style="color: #6c757d; font-size: 0.9rem; margin-bottom: 1rem;">${promo.description}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        ${promo.oldPrice ? `<span style="color: #999; text-decoration: line-through;">${promo.oldPrice} zł</span>` : ''}
                        <span style="color: #dc143c; font-weight: 800; font-size: 1.3rem;">${promo.newPrice} zł</span>
                    </div>
                    <div class="admin-promotion-actions">
                        <button class="btn-delete" onclick="deletePromotion(${promo.id})">
                            <i class="fas fa-trash"></i> Usuń
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    window.deletePromotion = function (id) {
        if (!confirm('Czy na pewno chcesz usunąć tę promocję?')) {
            return;
        }

        let promotions = JSON.parse(localStorage.getItem('promotions') || '[]');
        promotions = promotions.filter(p => p.id !== id);
        localStorage.setItem('promotions', JSON.stringify(promotions));

        showAlert('Promocja została usunięta', 'success');
        loadPromotions();
    };

    function showAlert(message, type) {
        const container = document.getElementById('alertContainer');
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <strong>${type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle"></i>'}</strong> ${message}
        `;
        container.appendChild(alert);

        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    window.loadPromotionsForSite = function () {
        const promotions = JSON.parse(localStorage.getItem('promotions') || '[]');
        const container = document.getElementById('promotionsContainer');

        if (!container) return;

        if (promotions.length === 0) {
            container.innerHTML = `
                <div class="no-promotions" style="text-align: center; padding: 3rem; color: #6c757d;">
                    <i class="fas fa-tag" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>Brak aktualnych promocji. Wróć wkrótce!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = promotions.map(promo => `
            <div class="promotion-card">
                ${promo.badge ? `<div class="promotion-badge">${promo.badge}</div>` : ''}
                <img src="${promo.image}" alt="${promo.title}" class="promotion-image">
                <div class="promotion-content">
                    <h3 class="promotion-title">${promo.title}</h3>
                    <p class="promotion-description">${promo.description}</p>
                    <div class="promotion-footer">
                        <div class="promotion-price">
                            ${promo.oldPrice ? `<span class="promotion-old-price">${promo.oldPrice} zł</span>` : ''}
                            <span class="promotion-new-price">${promo.newPrice} zł</span>
                        </div>
                        <a href="#booking" class="promotion-btn">Rezerwuj</a>
                    </div>
                </div>
            </div>
        `).join('');
    };

})();
