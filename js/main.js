(function () {
    'use strict';

    const navbar = document.getElementById('mainNav');

    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));

            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });

                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                    const navbarToggler = document.querySelector('.navbar-toggler');
                    navbarToggler.click();
                }
            }
        });
    });

    const SERVICES = {
        'svc-odswiezenie':       { name: 'Odświeżenie',            min: 150,  max: 300  },
        'svc-premium':           { name: 'Premium',                min: 250,  max: 600  },
        'svc-pranie-podstawowe': { name: 'Pranie podstawowe',      min: 150,  max: 400  },
        'svc-pranie-pelne':      { name: 'Pranie pełne',           min: 450,  max: 1200 },
        'svc-czyszczenie-skor':  { name: 'Czyszczenie skór',       min: 150,  max: 550  },
        'svc-mycie-podstawowe':  { name: 'Mycie podstawowe',       min: 150,  max: 200  },
        'svc-mycie-premium':     { name: 'Mycie premium',          min: 250,  max: 600  },
        'svc-dekontaminacja':    { name: 'Dekontaminacja lakieru', min: 350,  max: 800  },
        'svc-felgi':             { name: 'Felgi +',                min: 100,  max: 250  },
        'svc-pol-1step':         { name: 'Polerowanie 1-step',     min: 400,  max: 800  },
        'svc-pol-2step':         { name: 'Polerowanie 2-step',     min: 700,  max: 1300 },
        'svc-pelna-korekta':     { name: 'Pełna korekta',          min: 900,  max: 2000 },
        'svc-wosk':              { name: 'Wosk',                   min: 200,  max: 350  },
        'svc-powloka-15':        { name: 'Powłoka 1,5-roczna',     min: 300,  max: 600  },
        'svc-powloka-3':         { name: 'Powłoka 3-letnia',       min: 500,  max: 750  },
        'svc-powloka-5':         { name: 'Powłoka 5-letnia',       min: 600,  max: 900  },
        'svc-ppf':               { name: 'Folia PPF',               min: 0,    max: 0, individual: true },
    };

    const REQUIRES = {
        'svc-pranie-podstawowe': ['svc-premium'],
        'svc-pranie-pelne':      ['svc-premium'],
        'svc-czyszczenie-skor':  ['svc-premium'],
        'svc-pol-1step':         ['svc-dekontaminacja'],
        'svc-pol-2step':         ['svc-dekontaminacja'],
        'svc-pelna-korekta':     ['svc-dekontaminacja'],
        'svc-wosk':              ['svc-dekontaminacja'],
        'svc-powloka-15':        ['svc-dekontaminacja', 'svc-pelna-korekta'],
        'svc-powloka-3':         ['svc-dekontaminacja', 'svc-pelna-korekta'],
        'svc-powloka-5':         ['svc-dekontaminacja', 'svc-pelna-korekta'],
    };

    function isChecked(id) {
        const el = document.getElementById(id);
        return el ? el.checked : false;
    }

    function getWrapperId(svcId) {
        return 'cb-' + svcId.replace('svc-', '');
    }

    function updateDependencies() {

        const requiredBy = {};
        Object.entries(REQUIRES).forEach(([triggerId, deps]) => {
            if (isChecked(triggerId)) {
                deps.forEach(depId => {
                    if (!requiredBy[depId]) requiredBy[depId] = new Set();
                    requiredBy[depId].add(triggerId);
                });
            }
        });

        const allDeps = new Set(Object.values(REQUIRES).flat());

        allDeps.forEach(depId => {
            const cb = document.getElementById(depId);
            const wrapper = document.getElementById(getWrapperId(depId));
            if (!cb || !wrapper) return;

            const isRequired = !!(requiredBy[depId] && requiredBy[depId].size > 0);

            if (isRequired) {
                cb.checked = true;
                cb.disabled = true;
                wrapper.classList.add('service-required');
                wrapper.classList.add('selected');

                let note = wrapper.querySelector('.required-note');
                if (!note) {
                    note = document.createElement('small');
                    note.className = 'required-note';
                    note.innerHTML = '<i class="fas fa-lock"></i> wymagane';
                    wrapper.querySelector('label').appendChild(note);
                }
            } else {
                cb.disabled = false;
                wrapper.classList.remove('service-required');
                const note = wrapper.querySelector('.required-note');
                if (note) note.remove();
                if (!cb.checked) wrapper.classList.remove('selected');
            }
        });
    }

    function updateSummary() {
        const list = document.getElementById('selectedServices');
        if (!list) return;

        const checked = Object.keys(SERVICES).filter(id => isChecked(id));

        if (checked.length === 0) {
            list.innerHTML = '<li class="empty-state">Brak wybranych usług</li>';
        } else {
            list.innerHTML = checked.map(id => {
                const svc = SERVICES[id];
                const cb = document.getElementById(id);
                const isReq = cb && cb.disabled;
                const badge = isReq ? ' <small class="req-badge"><i class="fas fa-lock"></i> wymagane</small>' : '';
                const priceStr = svc.individual ? 'Wycena indyw.' : `${svc.min}–${svc.max} zł`;
                return `<li>
                    <span>${svc.name}${badge}</span>
                    <span class="svc-range">${priceStr}</span>
                </li>`;
            }).join('');
        }
    }

    function updatePrice() {
        const totalEl = document.getElementById('totalPrice');
        if (!totalEl) return;

        const checked = Object.keys(SERVICES).filter(id => isChecked(id));

        if (checked.length === 0) {
            totalEl.textContent = '— zł';
            return;
        }

        const priced = checked.filter(id => !SERVICES[id].individual);
        const hasIndividual = checked.some(id => SERVICES[id].individual);
        const totalMin = priced.reduce((sum, id) => sum + SERVICES[id].min, 0);
        const totalMax = priced.reduce((sum, id) => sum + SERVICES[id].max, 0);
        if (priced.length === 0 && hasIndividual) {
            totalEl.textContent = "Wycena indywidualna";
        } else if (hasIndividual) {
            totalEl.textContent = `od ${totalMin} do ${totalMax} zł + wycena indyw.`;
        } else {
            totalEl.textContent = `od ${totalMin} do ${totalMax} zł`;
        }
    }

    function onCalcChange() {
        updateDependencies();
        updateSummary();
        updatePrice();
    }

    Object.keys(SERVICES).forEach(id => {
        const cb = document.getElementById(id);
        if (!cb) return;

        const wrapper = cb.closest('.service-checkbox');
        if (!wrapper) return;

        wrapper.addEventListener('click', function (e) {
            const lbl = wrapper.querySelector('label');
            if (lbl && lbl.contains(e.target)) return;
            if (e.target === cb) return;
            if (cb.disabled) return;
            cb.checked = !cb.checked;
            wrapper.classList.toggle('selected', cb.checked);
            onCalcChange();
        });

        cb.addEventListener('change', function () {
            if (this.disabled) return;
            wrapper.classList.toggle('selected', this.checked);
            onCalcChange();
        });
    });

    const scrollTopBtn = document.getElementById('scrollTop');

    if (scrollTopBtn) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 500) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        });

        scrollTopBtn.addEventListener('click', function () {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    const heroSection = document.querySelector('.hero-section');

    if (heroSection) {
        window.addEventListener('scroll', function () {
            const scrolled = window.scrollY;
            const parallaxSpeed = 0.5;

            if (scrolled < window.innerHeight) {
                heroSection.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
            }
        });
    }

    const galleryItems = document.querySelectorAll('.gallery-item');
    const modal = document.getElementById('galleryModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalVehicle = document.getElementById('modalVehicle');
    const modalServices = document.getElementById('modalServices');
    const closeModal = document.querySelector('.gallery-modal-close');

    galleryItems.forEach(item => {
        item.addEventListener('click', function () {
            const image = this.getAttribute('data-image');
            const title = this.getAttribute('data-title');
            const vehicle = this.getAttribute('data-vehicle');
            const services = this.getAttribute('data-services').split(',');

            modalImage.src = image;
            modalImage.alt = `${title} - ${vehicle}`;
            modalTitle.textContent = title;
            modalVehicle.textContent = vehicle;

            modalServices.innerHTML = services.map(service =>
                `<li>${service.trim()}</li>`
            ).join('');

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    function closeGalleryModal() {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    if (closeModal) {
        closeModal.addEventListener('click', closeGalleryModal);
    }

    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closeGalleryModal();
            }
        });
    }

    document.addEventListener('keydown', function (e) {
        if (modal && e.key === 'Escape' && modal.classList.contains('active')) {
            closeGalleryModal();
        }
    });

    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');

        inputs.forEach(input => {
            input.addEventListener('blur', function () {
                if (!this.value) {
                    this.style.borderColor = '#dc3545';
                } else {
                    this.style.borderColor = '#28a745';
                }
            });

            input.addEventListener('input', function () {
                if (this.value) {
                    this.style.borderColor = '#28a745';
                }
            });
        });
    });

    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const navbarCollapse = document.querySelector('.navbar-collapse');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 992 && navbarCollapse && navbarCollapse.classList.contains('show')) {
                new bootstrap.Collapse(navbarCollapse, { toggle: true });
            }
        });
    });

    function loadPromotions() {
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
                        <a href="#contact" class="promotion-btn">Kontakt</a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    window.addEventListener('load', function () {
        document.body.style.opacity = '0';
        setTimeout(() => {
            document.body.style.transition = 'opacity 0.5s ease';
            document.body.style.opacity = '1';
        }, 100);

        loadPromotions();
    });

    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', function () {
        const scrollY = window.scrollY;

        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.navbar-nav a[href="#${sectionId}"]`);

            if (navLink && scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                navLink.classList.add('active');
            }
        });
    });

    const yearElement = document.querySelector('.footer-bottom p');
    if (yearElement) {
        const currentYear = new Date().getFullYear();
        yearElement.innerHTML = yearElement.innerHTML.replace('2024', currentYear);
    }

    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('img[data-src]');

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    }

    window.addEventListener('beforeprint', function () {
        document.body.classList.add('printing');
    });

    window.addEventListener('afterprint', function () {
        document.body.classList.remove('printing');
    });

})();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
    });
}
