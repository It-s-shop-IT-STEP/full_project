function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// --- 1. ПЕРЕМІННІ ---
cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
favorites = JSON.parse(localStorage.getItem('it_shop_favorites')) || [];

// --- 2. ПРИ ЗАВАНТАЖЕННІ ---
document.addEventListener('DOMContentLoaded', () => {
    updateHeaderBadges();
    initGlobalModals();
    renderCart(); // Малюємо кошик зразу
    renderFavTab(); // Малюємо улюблене зразу
});

// --- 3. ЛОГІКА ХЕДЕРА ТА ВІДКРИТТЯ ---

function updateHeaderBadges() {
    cartCount = document.getElementById('cart-count');
    const favCount = document.getElementById('fav-count');

    currentCart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    const currentFavs = JSON.parse(localStorage.getItem('it_shop_favorites')) || [];

    if (cartCount) {
        totalItems = currentCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        cartCount.innerText = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    if (favCount) {
        favCount.innerText = currentFavs.length;
        favCount.style.display = currentFavs.length > 0 ? 'flex' : 'none';
    }
}

function initGlobalModals() {
    const favModal = document.getElementById('fav-modal');
    cartModal = document.getElementById('cart-modal');
    const favBtn = document.getElementById('fav-icon-trigger');
    cartBtn = document.getElementById('cart-icon-trigger');

    if (favBtn) {
        favBtn.onclick = (e) => {
            e.preventDefault();
            if (favModal) {
                favModal.style.display = 'block';
                renderFavTab();
            }
        };
    }

    if (cartBtn) {
        cartBtn.onclick = (e) => {
            e.preventDefault();
            if (cartModal) {
                cartModal.style.display = 'block';
                renderCart();
            }
        };
    }

    document.querySelectorAll('.close-fav, .close-cart, #close-fav-btn').forEach(btn => {
        btn.onclick = () => {
            if (favModal) favModal.style.display = 'none';
            if (cartModal) cartModal.style.display = 'none';
        };
    });

    window.addEventListener('click', (e) => {
        if (e.target === favModal) favModal.style.display = 'none';
        if (e.target === cartModal) cartModal.style.display = 'none';
    });
}

// --- 4. РЕНДЕР ТА КЕРУВАННЯ ---

async function renderCart() {
    const container = document.getElementById('cart-items-container');
    const totalPriceElement = document.getElementById('cart-total-price');
    if (!container) return;

    cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">Ваш кошик порожній</p>';
        if (totalPriceElement) totalPriceElement.innerText = '0';
        return;
    }

    // --- НОВА ЛОГІКА: Оновлення цін з сервера ---
    const ids = [...new Set(cart.map(item => item.originalId))];
    try {
        const response = await fetch('/get_cart_prices/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ ids: ids })
            
        });
        const data = await response.json();
        
        // Оновлюємо ціни в нашому масиві cart
        cart.forEach(item => {
            if (data.prices[item.originalId]) {
                item.price = data.prices[item.originalId];
            }
        });
        localStorage.setItem('it_shop_cart', JSON.stringify(cart));
    } catch (e) {}
    // --- КІНЕЦЬ НОВОЇ ЛОГІКИ ---

    let total = 0;
    container.innerHTML = cart.map(item => {
        const currentPrice = parseFloat(item.price); 
        total += currentPrice * item.quantity;
        return `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>Артикул: ${item.article}</p>
                    <div class="price-row">
                        <span class="price-blue">${currentPrice} грн х ${item.quantity} шт</span>
                    </div>
                    <button class="delete-item" onclick="removeFromCart('${item.id}')">Видалити 🗑️</button>
                </div>
            </div>`;
    }).join('');
    if (totalPriceElement) totalPriceElement.innerText = total;
}

function renderFavTab() {
    const list = document.getElementById('fav-items-list');
    if (!list) return;

    favorites = JSON.parse(localStorage.getItem('it_shop_favorites')) || [];

    if (favorites.length === 0) {
        list.innerHTML = '<p style="text-align:center; padding:20px;">Список порожній</p>';
        return;
    }

    list.innerHTML = favorites.map(item => `
        <div class="fav-item-row">
            <img src="${item.image}" alt="${item.name}">
            <div class="fav-item-details">
                <h4>${item.name}</h4>
                <p class="price">${Math.ceil(item.price)} грн</p>
                <button class="move-btn" onclick="transferToCartFromFav('${item.id}')">ПЕРЕМІСТИТИ В КОШИК</button>
            </div>
            <button class="remove-fav-btn" onclick="removeFromFavorites('${item.id}')">&times;</button>
        </div>`).join('');
}

// --- 5. ДІЇ (ADD, REMOVE, MOVE) ---

function changeQty(productId, delta) {
    cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity = (item.quantity || 1) + delta;
        if (item.quantity < 1) return removeFromCart(productId);
        localStorage.setItem('it_shop_cart', JSON.stringify(cart));
        renderCart();
        updateHeaderBadges();
    }
}

function removeFromCart(productId) {
    cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('it_shop_cart', JSON.stringify(cart));
    renderCart();
    updateHeaderBadges();
}

function removeFromFavorites(productId) {
    favorites = JSON.parse(localStorage.getItem('it_shop_favorites')) || [];
    favorites = favorites.filter(item => item.id !== productId);
    localStorage.setItem('it_shop_favorites', JSON.stringify(favorites));
    renderFavTab();
    updateHeaderBadges();
}

function transferToCartFromFav(id) {
    favorites = JSON.parse(localStorage.getItem('it_shop_favorites')) || [];
    item = favorites.find(i => i.id === id);
    if (item) {
        // Оскільки в улюбленому немає вибору кольору, ставимо дефолтні, як у твоїй addToCart
        defColor = "Чорний";
        defSize = "S";
        productKey = `${item.id}-${defColor}-${defSize}`;

        cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
        const existing = cart.find(i => i.id === productKey);
        
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                id: productKey,
                originalId: item.id,
                name: item.name,
                price: parseFloat(item.price),
                image: item.image,
                color: defColor,
                size: defSize,
                quantity: 1
            });
        }
        localStorage.setItem('it_shop_cart', JSON.stringify(cart));
        removeFromFavorites(id);
        renderCart();
        updateHeaderBadges();
    }
}

// Подія для кнопки оформлення (Checkout)
document.addEventListener('DOMContentLoaded', () => {
    const checkoutBtn = document.getElementById('checkout-redirect-btn');
    if (checkoutBtn) {
        checkoutBtn.onclick = () => {
            if (JSON.parse(localStorage.getItem('it_shop_cart') || '[]').length === 0) {
                alert("Кошик порожній!");
            } else {
                window.location.href = '/checkout/';
            }
        };
    }
});