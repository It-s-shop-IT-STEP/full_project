// Логіка для вибору розмірів у картці товару
document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelector('.size-btn.active')?.classList.remove('active');
        this.classList.add('active');
    });
});

// Плавний перехід між сторінками (імітація для фронтенду)
function navigateTo(url) {
    document.body.style.opacity = '0';
    setTimeout(() => {
        window.location.href = url;
    }, 300);
}

// Подія для кнопки "Оформити"
const orderBtn = document.querySelector('.btn-blue');
if(orderBtn) {
    orderBtn.addEventListener('click', () => {
        alert('Замовлення прийнято! Дякуємо.');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const checkoutBtn = document.getElementById('checkout-redirect-btn');

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (e) => {
            // Зупиняємо стандартну поведінку, якщо це потрібно
            e.preventDefault(); 
            
            const cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
            
            if (cart.length === 0) {
                alert("Ваш кошик порожній!");
                return;
            }
            
            console.log("Redirecting to checkout..."); // Для перевірки в консолі
            window.location.href = '/checkout/';
        });
    }
});


document.querySelectorAll('.size-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.size-item').forEach(el => el.classList.remove('active'));
        this.classList.add('active');
    });
});

document.querySelectorAll('.color-dot').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.color-dot').forEach(el => el.classList.remove('active'));
        this.classList.add('active');
    });
});


// Завантажуємо дані з пам'яті браузера при старті
let cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
let favorites = JSON.parse(localStorage.getItem('it_shop_favorites')) || [];

// Функція оновлення лічильників у хедері
function updateHeaderBadges() {
    const cartCount = document.getElementById('cart-count');
    const favCount = document.getElementById('fav-count');

    if (cartCount) {
        // Рахуємо загальну кількість одиниць товару
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.innerText = totalItems;
    }
    if (favCount) {
        favCount.innerText = favorites.length;
    }
}

// ДОДАВАННЯ В КОШИК
function addToCart(id, name, price, image) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price: parseFloat(price), image, quantity: 1 });
    }
    saveCart();
}

// ДОДАВАННЯ В УЛЮБЛЕНЕ
function toggleFavorite(id, name, price, image) {
    const index = favorites.findIndex(item => item.id === id);
    if (index > -1) {
        favorites.splice(index, 1); // Видалити, якщо вже є
    } else {
        favorites.push({ id, name, price, image }); // Додати
    }
    saveFavorites();
}

function saveCart() {
    localStorage.setItem('it_shop_cart', JSON.stringify(cart));
    updateHeaderBadges();
    if (typeof renderCart === "function") renderCart(); // Якщо є вікно кошика - оновити
}

function saveFavorites() {
    localStorage.setItem('it_shop_favorites', JSON.stringify(favorites));
    updateHeaderBadges();
}

// Викликаємо оновлення при кожному завантаженні сторінки
document.addEventListener('DOMContentLoaded', updateHeaderBadges);



document.addEventListener('DOMContentLoaded', () => {
    const favModal = document.getElementById('fav-modal');
    const favIcon = document.querySelector('.icon-link[href="/favorites/"]'); // Ваша іконка серця
    const closeFavX = document.querySelector('.close-fav');
    const closeFavBtn = document.getElementById('close-fav-btn');

    // 1. Відкриття вкладки замість переходу на сторінку
    if (favIcon) {
        favIcon.addEventListener('click', (e) => {
            e.preventDefault();
            favModal.style.display = 'block';
            renderFavTab();
        });
    }

    // 2. Закриття
    [closeFavX, closeFavBtn].forEach(el => {
        if(el) el.onclick = () => favModal.style.display = 'none';
    });

    window.onclick = (e) => { if (e.target == favModal) favModal.style.display = 'none'; };
});

// 3. Рендер товарів у вкладці
function renderFavTab() {
    const list = document.getElementById('fav-items-list');
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
                <p class="price">${item.price}$</p>
                <button class="move-btn" onclick="transferToCart('${item.id}')">
                    ПЕРЕМІСТИТИ В КОШИК
                </button>
            </div>
            <button class="remove-fav-btn" onclick="removeFromFavorites('${item.id}'); renderFavTab();">
                &times;
            </button>
        </div>
    `).join('');
}

// 4. Логіка "Перемістити в кошик"
function transferToCart(id) {
    let favorites = JSON.parse(localStorage.getItem('it_shop_favorites')) || [];
    const item = favorites.find(i => i.id === id);

    if (item) {
        // Додаємо в кошик
        addToCart(item.id, item.name, item.price, item.image);
        // Видаляємо з улюблених
        removeFromFavorites(id);
        // Оновлюємо вигляд вкладки
        renderFavTab();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Обробка кліку на Улюблене
    const favTrigger = document.querySelector('a[href*="favorites"]');
    if (favTrigger) {
        favTrigger.addEventListener('click', (e) => {
            e.preventDefault(); // ЦЕ ЗУПИНЯЄ 404 ПОМИЛКУ
            document.getElementById('fav-modal').style.display = 'block';
            if (typeof renderFavTab === 'function') renderFavTab();
        });
    }

    // 2. Обробка кліку на Кошик
    const cartTrigger = document.querySelector('a[href*="cart"]');
    if (cartTrigger) {
        cartTrigger.addEventListener('click', (e) => {
            e.preventDefault(); // ЦЕ ЗУПИНЯЄ 404 ПОМИЛКУ
            document.getElementById('cart-modal').style.display = 'block';
            if (typeof renderCart === 'function') renderCart();
        });
    }

    // 3. Закриття вікон (клік на хрестик)
    document.querySelectorAll('.close-fav, .close-cart, #close-fav-btn').forEach(btn => {
        btn.onclick = () => {
            document.getElementById('fav-modal').style.display = 'none';
            document.getElementById('cart-modal').style.display = 'none';
        };
    });
});


document.addEventListener('DOMContentLoaded', () => {
    const favModal = document.getElementById('fav-modal');
    const cartModal = document.getElementById('cart-modal');

    // Функція для відкриття
    window.openModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            if (modalId === 'fav-modal') renderFavTab();
            if (modalId === 'cart-modal') renderCart();
        }
    };

    // Обробка кліку на іконку серця
    const favIcon = document.querySelector('a[href*="favorites"]');
    if (favIcon) {
        favIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openModal('fav-modal');
        });
    }

    // Обробка кліку на іконку кошика
    const cartIcon = document.querySelector('a[href*="cart"]');
    if (cartIcon) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openModal('cart-modal');
        });
    }

    // Закриття при кліку поза вікном
    window.onclick = function(event) {
        if (event.target == favModal) favModal.style.display = 'none';
        if (event.target == cartModal) cartModal.style.display = 'none';
    };
});


function renderCart() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const totalPriceElement = document.getElementById('cart-total-price');
    
    // Отримуємо товари з localStorage
    let cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; padding:20px;">Ваш кошик порожній</p>';
        if (totalPriceElement) totalPriceElement.innerText = '0';
        return;
    }

    let total = 0;
    // Формуємо HTML для кожного товару за твоїм макетом
    cartItemsContainer.innerHTML = cart.map(item => {
        total += item.price * (item.quantity || 1);
        return `
            <div class="cart-item" style="display: flex; gap: 15px; margin-bottom: 20px; align-items: center;">
                <img src="${item.image}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: contain; background: #F5F5F5; border-radius: 10px;">
                <div class="cart-item-info" style="flex-grow: 1;">
                    <h4 style="margin: 0; font-size: 14px; text-transform: uppercase; font-weight: 800;">${item.name}</h4>
                    <p style="margin: 2px 0; color: #777; font-size: 12px;">Розмір: S | Колір: Білий</p>
                    <p style="margin: 5px 0; font-weight: 700; color: #2E31FF;">${item.price}$ x ${item.quantity || 1}</p>
                    <button onclick="removeFromCart('${item.id}')" style="background:none; border:none; color:#BCBCBC; font-size:12px; cursor:pointer; display:flex; align-items:center; gap:5px; padding:0;">
                        Видалити 🗑️
                    </button>
                </div>
            </div>
        `;
    }).join('');

    if (totalPriceElement) totalPriceElement.innerText = total;
}

// Додай також функцію видалення
function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('it_shop_cart', JSON.stringify(cart));
    
    renderCart(); // Перемальовуємо список
    updateCartCounter(); // Оновлюємо цифру "8" у хедері
}

const cartIcon = document.querySelector('a[href*="cart"]');
if (cartIcon) {
    cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('cart-modal').style.display = 'block';
        renderCart(); // ЦЕЙ РЯДОК МАЄ ВИКЛИКАТИСЯ ОБОВ'ЯЗКОВО ПРИ ВІДКРИТТІ
    });
}


// Функція для оновлення лічильника в хедері (та сама цифра "8" або "9")
function updateCartCounter() {
    const cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    const counter = document.getElementById('cart-count'); // Перевір, щоб у хедері був цей ID
    if (counter) {
        // Рахуємо суму всіх quantity
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        counter.innerText = totalItems;
    }
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];

    if (cart.length === 0) {
        container.innerHTML = '<p>Кошик порожній</p>';
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item" style="border-bottom: 1px solid #eee; padding: 10px 0; display: flex; align-items: center; gap: 15px;">
            <img src="${item.image}" style="width: 50px; border-radius: 8px;">
            <div style="flex-grow: 1;">
                <h4 style="margin: 0;">${item.name}</h4>
                <p style="margin: 2px 0; font-size: 12px; color: #777;">
                    Розмір: <span style="color: #000; font-weight: 600;">${item.size}</span> | 
                    Колір: <span style="color: #000; font-weight: 600;">${item.color}</span>
                </p>
                <div style="color: #2E31FF; font-weight: 700;">${item.price} грн</div>
                
                <div class="quantity-controls">
                    <button onclick="changeQuantity('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeQuantity('${item.id}', 1)">+</button>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                <a href="/product/${item.originalId}/?edit=${item.id}" class="edit-btn" style="text-decoration: none; font-size: 12px; color: #2E31FF;">
                        ✏️
                    </a>
                <button onclick="removeFromCart('${item.id}')" style="background: none; border: none; cursor: pointer;">🗑️</button>
            </div>
        </div>
    `).join('');
    
    // Не забудьте оновити загальну суму в кінці функції
    calculateTotal();
    updateCartCounter();

    
}

// Зміна кількості (+ або -)
function changeQuantity(productId, delta) {
    let cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    const item = cart.find(i => i.id === productId);
    
    if (item) {
        item.quantity = (item.quantity || 1) + delta;
        // Якщо кількість менше 1 — видаляємо товар
        if (item.quantity < 1) {
            removeFromCart(productId);
            return;
        }
    }
    
    localStorage.setItem('it_shop_cart', JSON.stringify(cart));
    renderCart();
}

// Видалення товару (повністю)
function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('it_shop_cart', JSON.stringify(cart));
    
    renderCart();
}


function addToCart(id, name, price, image) {
    const selectedColor = document.querySelector('input[name="color"]:checked')?.value || "Не обрано";
    const selectedSize = document.querySelector('input[name="size"]:checked')?.value || "Не обрано";

    // Перевіряємо, чи є в URL параметр "edit"
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');

    let cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];

    if (editId) {
        // РЕЖИМ РЕДАГУВАННЯ: Знаходимо старий товар і замінюємо його дані
        const itemIndex = cart.findIndex(item => item.id === editId);
        
        if (itemIndex > -1) {
            cart[itemIndex].color = selectedColor;
            cart[itemIndex].size = selectedSize;
            cart[itemIndex].id = `${id}-${selectedColor}-${selectedSize}`; // оновлюємо унікальний ID
            
            alert("Товар оновлено в кошику!");
        }
    } else {
        // ЗВИЧАЙНИЙ РЕЖИМ: Додаємо як новий
        const productKey = `${id}-${selectedColor}-${selectedSize}`;
        const existingIndex = cart.findIndex(item => item.id === productKey);

        if (existingIndex > -1) {
            cart[existingIndex].quantity += 1;
        } else {
            cart.push({
                id: productKey,
                originalId: id,
                name: name,
                price: parseFloat(price),
                image: image,
                color: selectedColor,
                size: selectedSize,
                quantity: 1
            });
        }
        alert("Товар додано в кошик!");
    }

    localStorage.setItem('it_shop_cart', JSON.stringify(cart));
    
    // Якщо ми редагували, після збереження краще повернути користувача в каталог або відкрити кошик
    if (editId) {
        window.location.href = '/catalog/'; 
    } else {
        updateCartCounter();
        renderCart();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('edit')) {
        const btn = document.querySelector('.btn-to-catalog');
        if (btn) btn.innerText = "ЗБЕРЕГТИ ЗМІНИ";
    }
});

function saveToCart(product) {
    let cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    
    // Перевіряємо чи є вже такий товар з такими ж параметрами
    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push(product);
    }

    localStorage.setItem('it_shop_cart', JSON.stringify(cart));
    updateCartCounter(); // Оновити цифру на іконці
    renderCart(); // Якщо кошик відкритий - перемалювати
}

document.querySelectorAll('.option-group input').forEach(input => {
    input.addEventListener('change', (e) => {
        const group = e.target.closest('.option-group');
        const span = group.querySelector('h3 span');
        if (span) {
            span.innerText = e.target.value.toUpperCase();
        }
        
        // Візуальне перемикання класів active (якщо ваш CSS на них зав'язаний)
        group.querySelectorAll('label').forEach(l => l.classList.remove('active'));
        e.target.parentElement.classList.add('active');
    });
});


function calculateTotal() {
    const cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    const totalPriceElement = document.getElementById('cart-total-price');
    
    if (!totalPriceElement) return;

    // Рахуємо суму: ціна * кількість
    const total = cart.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const qty = parseInt(item.quantity) || 1;
        return sum + (price * qty);
    }, 0);

    totalPriceElement.innerText = `${total}`;
}

//telegram
async function sendOrderToTelegram() {
    const cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    
    if (cart.length === 0) {
        alert("Кошик порожній!");
        return;
    }

    // 1. Збір контактних даних (додаємо перевірку на пусті поля)
    const firstName = document.getElementById('cust-first-name')?.value.trim() || "Не вказано";
    const lastName = document.getElementById('cust-last-name')?.value.trim() || "Не вказано";
    const email = document.getElementById('cust-email')?.value.trim() || "Не вказано";
    const phone = document.getElementById('cust-phone')?.value.trim() || "Не вказано";

    // 2. Збір даних про доставку
    const methodRadio = document.querySelector('input[name="delivery_method"]:checked');
    if (!methodRadio) {
        alert("Будь ласка, оберіть спосіб доставки!");
        return;
    }

    const methodType = methodRadio.value; // Warehouse, Postomat або Address
    const parent = methodRadio.closest('.delivery-option-group');
    
    // Отримуємо місто
    const cityInput = parent.querySelector('.city-input, .np-search-input-address');
    const city = cityInput ? cityInput.value.trim() : "Місто не вказано";
    
    // Отримуємо відділення або адресу
    let deliveryPoint = "";
    if (methodType === "Address") {
        deliveryPoint = document.getElementById('address-details')?.value.trim() || "Адреса не вказана";
    } else {
        deliveryPoint = parent.querySelector('.point-input')?.value.trim() || "Відділення не обрано";
    }

    // 3. Спосіб оплати та коментар
    const paymentRadio = document.querySelector('input[name="payment"]:checked');
    const paymentMethod = paymentRadio ? paymentRadio.value : "Не обрано";
    const comment = document.getElementById('order-comment')?.value.trim() || "Без коментаря";

    // ВАШІ ДАНІ ТЕЛЕГРАМ
    const TELEGRAM_BOT_TOKEN = '8312173871:AAEjQGFJlQ6D3SJMPpTJsDHhbKqDle2dOhY';
    const TELEGRAM_CHAT_ID = '628064779';

    // 4. Формування тексту повідомлення
    let message = `🚀 **НОВЕ ЗАМОВЛЕННЯ**\n\n`;
    
    message += `👤 **КЛІЄНТ:**\n`;
    message += `• ПІБ: ${firstName} ${lastName}\n`;
    message += `• Тел: ${phone}\n`;
    message += `• Email: ${email}\n\n`;

    message += `📦 **ДОСТАВКА:**\n`;
    message += `• Тип: ${methodType}\n`;
    message += `• Місто: ${city}\n`;
    message += `• Точка/Адреса: ${deliveryPoint}\n\n`;

    message += `💳 **ОПЛАТА ТА ІНШЕ:**\n`;
    message += `• Метод: ${paymentMethod}\n`;
    message += `• Коментар: ${comment}\n\n`;

    message += `🛒 **ТОВАРИ:**\n`;
    let totalSum = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        totalSum += itemTotal;
        // Екрануємо назву товару, щоб не зламати Markdown
        const cleanName = item.name.replace(/[*_`]/g, ''); 
        message += `${index + 1}. ${cleanName}\n`;
        message += `   🎨 Колір: ${item.color}, 📏 Розмір: ${item.size}\n`;
        message += `   🔢 ${item.quantity} шт. x ${item.price}$ = ${itemTotal}$\n\n`;
    });

    message += `__________________\n`;
    message += `💰 **РАЗОМ ДО ОПЛАТИ: ${totalSum}$**`;

    // 5. Відправка запиту
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        if (response.ok) {
            alert("Дякуємо! Ваше замовлення успішно відправлено.");
            localStorage.removeItem('it_shop_cart'); // Очищення кошика
            window.location.href = "/"; // Повернення на головну
        } else {
            const errorData = await response.json();
            console.error("Помилка Telegram API:", errorData);
            alert("Помилка при відправці в Телеграм. Перевірте консоль.");
        }
    } catch (error) {
        console.error("Критична помилка:", error);
        alert("Не вдалося відправити замовлення. Перевірте інтернет-з'єднання.");
    }
}
function moveToCart(id, name, price, image, color, size) {
    // 1. Створюємо об'єкт товару (як ми робили раніше)
    const product = {
        id: `${id}-${color}-${size}`,
        originalId: id,
        name: name,
        price: parseFloat(price),
        image: image,
        color: color || "Не обрано",
        size: size || "Не обрано",
        quantity: 1
    };

    // 2. Додаємо в кошик
    let cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push(product);
    }
    localStorage.setItem('it_shop_cart', JSON.stringify(cart));

    // 3. ВИДАЛЯЄМО З УЛЮБЛЕНОГО
    removeFromFavorites(id); 

    // 4. Оновлюємо інтерфейс
    updateCartCounter();
    updateFavCounter(); // Оновити лічильник улюбленого (сердечко)
    renderFavTab();     // Перемалювати вкладку улюбленого (товар зникне звідти)
    
    alert("Товар переміщено в кошик!");
}

function removeFromFavorites(productId) {
    let favorites = JSON.parse(localStorage.getItem('it_shop_favorites')) || [];
    // Видаляємо товар за оригінальним ID
    favorites = favorites.filter(item => item.id !== productId);
    localStorage.setItem('it_shop_favorites', JSON.stringify(favorites));
}