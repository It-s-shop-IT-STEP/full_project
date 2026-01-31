const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

function getGrammarLabel(count) {
    if (count % 10 === 1 && count % 100 !== 11) return `У кошику ${count} товар`;
    if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return `У кошику ${count} товари`;
    return `У кошику ${count} товарів`;
}

window.toggleSizeDropdown = function(index) {
    const menu = document.getElementById(`size-dropdown-${index}`);
    const arrow = document.getElementById(`arrow-${index}`);
    const isOpened = menu.classList.toggle('active');
    arrow.innerText = isOpened ? '∧' : '∨'; 
};

function renderCartItems() {
    const cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    const container = document.getElementById('cart-items-wrapper');
    const headerTitle = document.getElementById('cart-plural-title');
    
    // Рахуємо ЗАГАЛЬНУ кількість усіх одиниць товару
    let totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    headerTitle.innerText = getGrammarLabel(totalItemsCount);

    let totalPrice = 0;

    if (cart.length === 0) {
        container.innerHTML = '<div style="padding: 60px 0; text-align: center; color: #888;">Ваш кошик порожній</div>';
        updatePriceSummary(0);
        return;
    }

    container.innerHTML = cart.map((item, index) => {
        totalPrice += (item.price * item.quantity);

        const sizeButtons = ALL_SIZES.map(s => `
            <button id="btn-${index}-${s}" class="size-square-btn ${item.size === s ? 'selected' : ''}" 
                    onclick="updateItemSize(${index}, '${s}')">${s}</button>
        `).join('');

        return `
            <div class="cart-item-row">
                <img src="${item.image}" alt="">
                <div class="item-main-info">
                    <div class="item-header-row">
                        <h4>${item.name}</h4>
                        <button class="btn-remove-cart" onclick="removeProduct(${index})">Видалити</button>
                    </div>
                    <p class="item-color-text">Колір: ${item.color}</p>
                    <div class="item-price-blue">${item.price} грн</div>

                    
                    <div class="size-management">
                        <div class="size-current-display" onclick="toggleSizeDropdown(${index})">
                            Розмір: <strong id="current-size-text-${index}">${item.size}</strong> 
                            <span class="arrow-indicator" id="arrow-${index}">∨</span>
                        </div>
                        <div class="size-expandable-menu" id="size-dropdown-${index}">
                            <p style="font-size: 14px; margin-bottom: 10px;">Оберіть інший розмір</p>
                            <div class="size-grid-layout">${sizeButtons}</div>
                        </div>
                    </div>

                    
                    <div class="qty-control-group">
                        <button class="qty-btn-action" onclick="changeQuantity(${index}, -1)">-</button>
                        <span class="qty-display-val">${item.quantity}</span>
                        <button class="qty-btn-action" onclick="changeQuantity(${index}, 1)">+</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    updatePriceSummary(totalPrice);
}

// Оновлення розміру без повного перерендеру списку (щоб меню не закривалось)
window.updateItemSize = function(index, newSize) {
    let cart = JSON.parse(localStorage.getItem('it_shop_cart'));
    cart[index].size = newSize;
    localStorage.setItem('it_shop_cart', JSON.stringify(cart));

    // Оновлюємо візуально обрану кнопку в поточному рядку
    const buttons = document.querySelectorAll(`#size-dropdown-${index} .size-square-btn`);
    buttons.forEach(btn => btn.classList.remove('selected'));
    document.getElementById(`btn-${index}-${newSize}`).classList.add('selected');
    
    // Оновлюємо текст поточного розміру
    document.getElementById(`current-size-text-${index}`).innerText = newSize;
};

window.changeQuantity = function(index, delta) {
    let cart = JSON.parse(localStorage.getItem('it_shop_cart'));
    cart[index].quantity = Math.max(1, cart[index].quantity + delta);
    localStorage.setItem('it_shop_cart', JSON.stringify(cart));
    renderCartItems();
};

window.removeProduct = function(index) {
    let cart = JSON.parse(localStorage.getItem('it_shop_cart'));
    cart.splice(index, 1);
    localStorage.setItem('it_shop_cart', JSON.stringify(cart));
    renderCartItems();
};

function updatePriceSummary(total) {
    document.getElementById('subtotal-val').innerText = `${total} грн`;
    document.getElementById('final-total-val').innerText = `${total} грн`;
}

document.addEventListener('DOMContentLoaded', renderCartItems);