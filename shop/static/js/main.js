// --- 1. ДАНІ (БЕРЕМО З LOCALSTORAGE) ---
let cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
let favorites = JSON.parse(localStorage.getItem('it_shop_favorites')) || [];

// --- 2. ПРИ ЗАВАНТАЖЕННІ БУДЬ-ЯКОЇ СТОРІНКИ ---
document.addEventListener('DOMContentLoaded', () => {
    updateHeaderBadges(); // Оновлюємо цифри на іконках
    initGlobalModals();   // Включаємо відкриття/закриття вікон
});

// --- 3. ЛОГІКА ХЕДЕРА (БАДЖІ ТА МОДАЛКИ) ---

// Оновлення лічильників (цифри біля іконок)
function updateHeaderBadges() {
    const cartCount = document.getElementById('cart-count');
    const favCount = document.getElementById('fav-count');

    const currentCart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    const currentFavs = JSON.parse(localStorage.getItem('it_shop_favorites')) || [];

    if (cartCount) {
        const totalItems = currentCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        cartCount.innerText = totalItems;
        // Можна сховати бадж, якщо 0
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';;
    }
    if (favCount) {
        favCount.innerText = currentFavs.length;
        favCount.style.display = currentFavs.length > 0 ? 'flex' : 'none';
    }
}

// Управління відкриттям модальних вікон
function initGlobalModals() {
    const favModal = document.getElementById('fav-modal');
    const cartModal = document.getElementById('cart-modal');

    // 1. Пошук кнопок за ID (як у твоєму новому HTML)
    const favBtn = document.getElementById('fav-icon-trigger');
    const cartBtn = document.getElementById('cart-icon-trigger');

    if (favBtn) {
        favBtn.onclick = (e) => {
            e.preventDefault(); 
            if (favModal) {
                favModal.style.display = 'block';
                // Перевіряємо чи функція вже існує в пам'яті
                if (window.renderFavTab) window.renderFavTab();
            }
        };
    }

    if (cartBtn) {
        cartBtn.onclick = (e) => {
            e.preventDefault();
            if (cartModal) {
                cartModal.style.display = 'block';
                if (window.renderCart) window.renderCart();
            }
        };
    }

    // Універсальне закриття (хрестики та кнопки)
    document.querySelectorAll('.close-fav, .close-cart, #close-fav-btn').forEach(btn => {
        btn.onclick = () => {
            if (favModal) favModal.style.display = 'none';
            if (cartModal) cartModal.style.display = 'none';
        };
    });

    // Закриття кліком поза вікном
    window.addEventListener('click', (e) => {
        if (e.target === favModal) favModal.style.display = 'none';
        if (e.target === cartModal) cartModal.style.display = 'none';
    });
}

// --- 4. СПІЛЬНІ ФУНКЦІЇ (ВИДАЛЕННЯ/ЗБЕРЕЖЕННЯ) ---

// Збереження кошика та оновлення інтерфейсу
function saveCart() {
    localStorage.setItem('it_shop_cart', JSON.stringify(cart));
    updateHeaderBadges();
}

// Збереження улюблених
function saveFavorites() {
    localStorage.setItem('it_shop_favorites', JSON.stringify(favorites));
    updateHeaderBadges();
}

// Видалення товару (спільне для модалки та сторінки оформлення)
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    
    // Якщо ми на сторінці, де є ці функції — перемальовуємо їх списки
    if (typeof renderCart === 'function') renderCart();
    if (typeof renderCheckoutPage === 'function') renderCheckoutPage();
}

// Видалення з улюблених
function removeFromFavorites(productId) {
    favorites = favorites.filter(item => item.id !== productId);
    saveFavorites();
    if (typeof renderFavTab === 'function') renderFavTab();
}

// Грамматика для слова "товар" (може знадобитися в різних місцях)
function getProductWord(n) {
    n = Math.abs(n) % 100; 
    const n1 = n % 10;
    if (n > 10 && n < 20) return 'товари';
    if (n1 === 1) return 'товар';
    if (n1 > 1 && n1 < 5) return 'товари';
    return 'товарів';
}