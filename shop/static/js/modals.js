// 1. РЕНДЕР УЛЮБЛЕНИХ (FAVORITES)
function renderFavTab() {
    const list = document.getElementById('fav-items-list');
    if (!list) return;

    let favorites = JSON.parse(localStorage.getItem('it_shop_favorites')) || [];

    if (favorites.length === 0) {
        list.innerHTML = '<p class="empty-msg" style="text-align:center; padding:20px;">Список порожній</p>';
        return;
    }

    list.innerHTML = favorites.map(item => `
        <div class="fav-item-row">
            <img src="${item.image}" alt="${item.name}">
            <div class="fav-item-details">
                <h4>${item.name}</h4>
                <p class="price">${item.price} грн</p>
                <button class="move-btn" onclick="transferToCartFromFav('${item.id}')">
                    ПЕРЕМІСТИТИ В КОШИК
                </button>
            </div>
            <button class="remove-fav-btn" onclick="removeFromFavorites('${item.id}'); renderFavTab();">
                &times;
            </button>
        </div>
    `).join('');
}

// 2. РЕНДЕР КОШИКА (CART)
function renderCart() {
    const container = document.getElementById('cart-items-container');
    const totalPriceElement = document.getElementById('cart-total-price');
    if (!container) return;

    let cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">Ваш кошик порожній</p>';
        if (totalPriceElement) totalPriceElement.innerText = '0';
        return;
    }

    let total = 0;
    container.innerHTML = cart.map(item => {
        total += item.price * (item.quantity || 1);
        return `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>Артикул: ${item.id}</p>
                    <p>Розмір: ${item.size || 'S'}</p>
                    <p>Колір: ${item.color || 'Стандарт'}</p>
                    
                    <div class="price-row">
                        <span class="price-blue">${item.price}грн x ${item.quantity || 1}шт.</span>
                    </div>
                    <button class="delete-item" onclick="removeFromCart('${item.id}')">Видалити 🗑️</button>
                </div>
                
            </div>
        `;
    }).join('');

    if (totalPriceElement) totalPriceElement.innerText = total;
}

// 3. ДОПОМІЖНІ ФУНКЦІЇ ДЛЯ МОДАЛОК

function changeQty(productId, delta) {
    let cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity = (item.quantity || 1) + delta;
        if (item.quantity < 1) return removeFromCart(productId);
    }
    localStorage.setItem('it_shop_cart', JSON.stringify(cart));
    renderCart();
    if (typeof updateHeaderBadges === 'function') updateHeaderBadges();
}

function transferToCartFromFav(id) {
    let favorites = JSON.parse(localStorage.getItem('it_shop_favorites')) || [];
    const item = favorites.find(i => i.id === id);

    if (item) {
        // Використовуємо існуючу логіку addToCart
        addToCart(item.id, item.name, item.price, item.image);
        // Видаляємо з улюблених
        removeFromFavorites(id);
        renderFavTab();
    }
}

// Подія для кнопки оформлення
document.addEventListener('DOMContentLoaded', () => {
    const checkoutBtn = document.getElementById('checkout-redirect-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
            if (cart.length === 0) {
                alert("Ваш кошик порожній!");
            } else {
                window.location.href = '/checkout/';
            }
        });
    }




    
});

// <div class="quantity-controls">
    // <button onclick="changeQty('${item.id}', -1)">-</button>
    // <span>${item.quantity || 1}</span>
    // <button onclick="changeQty('${item.id}', 1)">+</button>
// </div>