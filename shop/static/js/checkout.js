// Функція для визначення відмінювання (ТОВАР/ТОВАРИ/ТОВАРІВ)
function getProductWord(n) {
    n = Math.abs(n) % 100; 
    const n1 = n % 10;
    if (n > 10 && n < 20) return 'ТОВАРІВ';
    if (n1 === 1) return 'ТОВАР';
    if (n1 > 1 && n1 < 5) return 'ТОВАРИ';
    return 'ТОВАРІВ';
}

function renderCheckoutPage() {
    const checkoutList = document.getElementById('checkout-items-list');
    const countTitle = document.getElementById('checkout-count-title');
    const subtotalPrice = document.getElementById('subtotal-price');
    const totalPrice = document.getElementById('total-price');
    
    // Перевірка наявності елементів на сторінці (щоб не було помилок)
    if (!checkoutList || !countTitle) return;

    const cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];

    // Рахуємо загальну кількість одиниць (не просто видів товарів)
    const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    countTitle.innerText = `У КОШИКУ ${totalCount} ${getProductWord(totalCount)}`;

    if (cart.length === 0) {
        checkoutList.innerHTML = '<p class="empty-msg">Кошик порожній</p>';
        subtotalPrice.innerText = '0 грн';
        totalPrice.innerText = '0 грн';
        return;
    }

    let total = 0;
    checkoutList.innerHTML = cart.map(item => {
        const itemSum = item.price * (item.quantity || 1);
        total += itemSum;
        return `
            <div class="checkout-item-row">
                <div class="checkout-item-img">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="checkout-item-info">
                    <h3>${item.name}</h3>
                    <p>Колір: <span>${item.color || 'Не обрано'}</span></p>
                    <p>Розмір: <span>${item.size || 'Не обрано'}</span></p>
                    <div class="item-price-row">
                        <span class="price-blue">${item.price} грн</span>
                    </div>
                </div>
                <div class="checkout-item-qty">
                    <div class="qty-box">${item.quantity || 1}</div>
                </div>
                <button class="btn-remove-checkout" onclick="removeFromCheckout('${item.id}')">
                    Видалити 🗑️
                </button>
            </div>
        `;
    }).join('');

    // Уніфікуємо валюту до $ (або грн, головне щоб однаково)
    subtotalPrice.innerText = total + ' грн';
    totalPrice.innerText = total + ' грн';
}

// Функція видалення саме для цієї сторінки (щоб не перезавантажувати всю сторінку через location.reload)
function removeFromCheckout(productId) {
    let cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('it_shop_cart', JSON.stringify(cart));
    
    // Перемальовуємо сторінку та оновлюємо баджі в хедері
    renderCheckoutPage();
    if (typeof updateHeaderBadges === 'function') updateHeaderBadges();
}

// Запуск при завантаженні сторінки
document.addEventListener('DOMContentLoaded', renderCheckoutPage);