// 1. Додавання в кошик
function getProductData(el) {
    const card = el.closest('.product-card');
    const originalId = card.dataset.id;
    const actualPrice = parseFloat(card.dataset.price);
    
    // Оскільки в каталозі ми не вибираємо колір/розмір, 
    // ставимо дефолтні значення, щоб створити ключ
    const defaultColor = "Чорний";
    const defaultSize = "S";
    const productKey = `${originalId}-${defaultColor}-${defaultSize}`;

    return {
        id: productKey,        // Унікальний ключ для кошика
        originalId: originalId, // Обов'язково для валідації на сервері
        article: card.dataset.article,
        price: actualPrice,
        name: card.querySelector('.product-name').innerText,
        image: card.querySelector('.image-box img').src,
        color: defaultColor,
        size: defaultSize
    };
}

function addToCart(btn) {
    const data = getProductData(btn);
    const card = btn.closest('.product-card');
    const actualPrice = parseFloat(card.dataset.price); // Беремо discount_price з атрибута

    cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    
    // Шукаємо за унікальним ключем (id-колір-розмір)
    item = cart.find(i => i.id === data.id);
    
    if (item) {
        item.price = actualPrice; // ПРИМУСОВО ОНОВЛЮЄМО ЦІНУ
        item.quantity += 1;
        // Ціну не перезаписуємо вручну, сервер сам її перевірить при замовленні
    } else {
        cart.push({ ...data, quantity: 1 });
    }

    localStorage.setItem('it_shop_cart', JSON.stringify(cart));
    alert("Товар додано в кошик!");
    
    if (typeof updateHeaderBadges === 'function') updateHeaderBadges();
    if (typeof renderCart === 'function') renderCart();
}

// 2. Додавання/видалення з улюблених
function toggleFavorite(btn) {
    const data = getProductData(btn);
    btn.classList.toggle('active');

    favorites = JSON.parse(localStorage.getItem('it_shop_favorites')) || [];
    index = favorites.findIndex(i => i.id === data.id);

    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(data);
    }

    localStorage.setItem('it_shop_favorites', JSON.stringify(favorites));
    if (typeof updateHeaderBadges === 'function') updateHeaderBadges();
}

// 3. Логіка пагінації та пошуку
document.addEventListener("DOMContentLoaded", function() {
    const productGrid = document.querySelector('.product-grid');
    const products = document.querySelectorAll('.product-card');
    const loadMoreBtn = document.querySelector('.load-more-btn');
    const searchInput = document.querySelector('.search-container input');
    let visibleCount = 12;

    // СИНХРОНІЗАЦІЯ ЦІН
    function syncPrices() {
        cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
        favorites = JSON.parse(localStorage.getItem('it_shop_favorites')) || [];
        let changed = false;

        document.querySelectorAll('.product-card').forEach(card => {
            const id = card.dataset.id;
            const actualPrice = parseInt(card.dataset.price);

            [cart, favorites].forEach(list => {
                const item = list.find(i => i.id === id);
                if (item && item.price !== actualPrice) {
                    item.price = actualPrice;
                    changed = true;
                }
            });
        });

        if (changed) {
            localStorage.setItem('it_shop_cart', JSON.stringify(cart));
            localStorage.setItem('it_shop_favorites', JSON.stringify(favorites));
        }
    }

    // --- ФУНКЦІЯ ВІДНОВЛЕННЯ СТАНУ ІКОНОК ---
    function restoreActiveStates() {
        // Отримуємо актуальні дані з глобальних масивів або LocalStorage
        currentFavIds = favorites.map(item => String(item.id));

        // Підсвічуємо кнопки обраного
        document.querySelectorAll('.wishlist-btn').forEach(btn => {
            const onclickAttr = btn.getAttribute('onclick');
            const idMatch = onclickAttr.match(/'(\d+)'/);
            if (idMatch && currentFavIds.includes(idMatch[1])) {
                btn.classList.add('active');
            }
        });
    }

    function updateVisibility() {
        const products = document.querySelectorAll('.product-card');
        products.forEach((p, index) => {
            p.style.display = (index < visibleCount) ? 'flex' : 'none';
        });
        if (loadMoreBtn) {
            loadMoreBtn.style.display = (visibleCount >= products.length) ? 'none' : 'block';
        }
    }

    // 2. Логіка ЖИВОГО ПОШУКУ
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();

            fetch(`?q=${encodeURIComponent(query)}`, { // encodeURIComponent захищає кирилицю в URL
                headers: {
                    'x-requested-with': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                // Оновлюємо сітку новим HTML
                productGrid.innerHTML = data.html;
                
                // Скидаємо лічильник при новому пошуку та оновлюємо видимість
                visibleCount = 12;
                updateVisibility();
                if (typeof restoreActiveStates === 'function') restoreActiveStates();
            })
            .catch(err => console.error('Помилка пошуку:', err));
        });
    }

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            visibleCount += 12;
            updateVisibility();
        });
    }

    syncPrices();
    updateVisibility();
    restoreActiveStates();
});


// Змінна для зберігання інтервалу зміни зображень
let imageInterval;

function startImageCycle(card) {
    const mainImg = card.querySelector('.main-img');
    const extraImages = Array.from(card.querySelectorAll('.extra-images span')).map(span => span.dataset.src);
    
    if (extraImages.length === 0) return;

    let currentIndex = 0;
    const originalSrc = mainImg.src;

    imageInterval = setInterval(() => {
        mainImg.src = extraImages[currentIndex];
        currentIndex = (currentIndex + 1) % extraImages.length;
    }, 1000); // Швидкість зміни - 1 секунда

    // Зберігаємо оригінальне фото, щоб повернути його
    card.dataset.originalSrc = originalSrc;
}

function stopImageCycle(card) {
    clearInterval(imageInterval);
    const mainImg = card.querySelector('.main-img');
    if (card.dataset.originalSrc) {
        mainImg.src = card.dataset.originalSrc;
    }
}