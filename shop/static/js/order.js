const API_KEY = '49f64034109f180560a35b4829c1ee5a';
let searchTimeout;

document.addEventListener('DOMContentLoaded', () => {
    initDeliveryLogic();
    renderPreview();
});

// 1. Перемикання способів доставки
// 1. Перемикання способів доставки
function initDeliveryLogic() {
    const deliveryCheckboxes = document.querySelectorAll('input[name="delivery_method"]');

    deliveryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('click', function(e) {
            const currentSubFields = this.closest('.delivery-option-group').querySelector('.np-sub-fields');

            if (this.checked) {
                // Знімаємо галочки з УСІХ інших чекбоксів і ховаємо їхні поля
                deliveryCheckboxes.forEach(otherCheckbox => {
                    if (otherCheckbox !== this) {
                        otherCheckbox.checked = false;
                        const otherSubFields = otherCheckbox.closest('.delivery-option-group').querySelector('.np-sub-fields');
                        if (otherSubFields) {
                            otherSubFields.classList.remove('active');
                        }
                    }
                });
                // Відкриваємо поля поточного вибору
                if (currentSubFields) {
                    currentSubFields.classList.add('active');
                }
            } else {
                // Якщо клікнули по вже вибраному чекбоксу — ховаємо його поля
                if (currentSubFields) {
                    currentSubFields.classList.remove('active');
                }
            }
        });
    });

    // Пошук міст

    // Пошук міст
    document.querySelectorAll('.city-input, .city-input-address').forEach(input => {
        input.addEventListener('input', function() {
            const query = this.value.trim();
            const listId = this.getAttribute('list');
            if (query.length < 2) return;

            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => fetchCities(query, listId), 400);
        });

        // Вибір міста з даталіста
        input.addEventListener('change', function() {
            const list = document.getElementById(this.getAttribute('list'));
            const option = Array.from(list.options).find(opt => opt.value === this.value);
            if (option) {
                const cityRef = option.getAttribute('data-ref');
                const parent = this.closest('.delivery-option-group');
                if (parent.querySelector('.point-input')) {
                    loadWarehouses(cityRef, parent);
                }
            }
        });
    });
}

// 2. Запит міст у Нової Пошти
async function fetchCities(query, listId) {
    try {
        const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
            method: 'POST',
            body: JSON.stringify({
                apiKey: API_KEY,
                modelName: "Address",
                calledMethod: "getCities",
                methodProperties: { FindByString: query, Limit: "10" }
            })
        });
        const result = await response.json();
        const datalist = document.getElementById(listId);
        
        if (result.success) {
            datalist.innerHTML = result.data.map(city => 
                `<option value="${city.Description}" data-ref="${city.Ref}">`
            ).join('');
        }
    } catch (e) { console.error("City fetch error:", e); }
}

// 3. Завантаження відділень/поштоматів
async function loadWarehouses(cityRef, parent) {
    const pointInput = parent.querySelector('.point-input');
    const dropdown = parent.querySelector('.custom-dropdown-list');
    const type = parent.querySelector('input[name="delivery_method"]').value;

    pointInput.placeholder = "Завантаження...";
    
    try {
        const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
            method: 'POST',
            body: JSON.stringify({
                apiKey: API_KEY,
                modelName: "Address",
                calledMethod: "getWarehouses",
                methodProperties: { CityRef: cityRef }
            })
        });
        const result = await response.json();

        if (result.success) {
            const filtered = result.data.filter(w => {
                const isPostomat = w.Description.includes("Поштомат") || w.CategoryOfWarehouse === "Postomat";
                return type === "Поштомат" ? isPostomat : !isPostomat;
            });

            pointInput.disabled = false;
            pointInput.placeholder = "Натисніть для вибору";
            
            pointInput.onclick = () => {
                dropdown.style.display = 'block';
                dropdown.innerHTML = filtered.map(w => `<div>${w.Description}</div>`).join('');
                
                dropdown.querySelectorAll('div').forEach(item => {
                    item.onclick = () => {
                        pointInput.value = item.innerText;
                        dropdown.style.display = 'none';
                    };
                });
            };
        }
    } catch (e) { console.error("Warehouse error:", e); }
}

// 4. Рендер товарів у правій колонці
function renderPreview() {
    const cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    const container = document.getElementById('order-preview-items');
    let total = 0;

    container.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        return `
            <div class="mini-card">
                <img src="${item.image}" alt="">
                <div class="mini-details">
                    <p><strong>${item.name}</strong></p>
                    <p>${item.quantity} шт. x ${item.price} грн</p>
                </div>
            </div>`;
    }).join('');

    document.getElementById('final-total-val').innerText = total + " грн";
}

async function sendOrderToTelegram() {
    // Твій код відправки замовлення
    alert("Замовлення оформлено!");
}

// --- 3. ВІДПРАВКА ЗАМОВЛЕННЯ ---

async function sendOrderToTelegram() {
    const cart = getCartData();
    if (cart.length === 0) return alert("Кошик порожній!");

    const firstName = document.getElementById('cust-first-name')?.value.trim();
    const lastName = document.getElementById('cust-last-name')?.value.trim();
    const phone = document.getElementById('cust-phone')?.value.trim();
    const email = document.getElementById('cust-email')?.value.trim();

    if (!firstName || !lastName || !phone) {
        return alert("Будь ласка, заповніть обов'язкові контактні дані (Ім'я, Прізвище, Телефон).");
    }

    const activeGroup = document.querySelector('.np-sub-fields.active');
    let fullAddress = "Не вказано";
    
    if (activeGroup) {
        const city = activeGroup.querySelector('.city-input, .np-search-input-address')?.value || "";
        const point = activeGroup.querySelector('.point-input')?.value || activeGroup.querySelector('#address-details')?.value || "";
        fullAddress = `${city}, ${point}`;
    }

    const comment = document.getElementById('order-comment')?.value.trim() || "Без коментаря";
    const paymentRadio = document.querySelector('input[name="payment"]:checked');
    const paymentMethod = paymentRadio && (paymentRadio.value === 'Карткою' || paymentRadio.value === 'card') ? 'card' : 'cash';

    const orderData = {
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        email: email,
        address: fullAddress,
        comment: comment,
        payment_method: paymentMethod,
        total_price: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        cart: cart 
    };

    try {
        const res = await fetch('/checkout/', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken') 
            },
            body: JSON.stringify(orderData)
        });

        if (res.ok) {
            alert("Замовлення успішно оформлено!");
            localStorage.removeItem('it_shop_cart');
            window.location.href = "/profile/"; 
        } else {
            const err = await res.json();
            alert("Помилка: " + (err.message || "Спробуйте ще раз"));
        }
    } catch (e) {
        alert("Помилка з'єднання з сервером.");
    }
}

// --- 4. ІНТЕРФЕЙС ТА АВТОЗАПОВНЕННЯ ---











function renderPreview() {
    const cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    const container = document.getElementById('order-preview-items');
    let total = 0;

    container.innerHTML = cart.map((item, index) => {
        total += item.price * item.quantity;

        return `
        <div class="mini-card">
            <img src="${item.image}">
            
            <div class="mini-info">
                <h4>${item.name}</h4>
                <p>Розмір: ${item.size || 'S'}</p>
                <p>Колір: ${item.color || 'Білий'}</p>

                <div class="mini-price">${item.price} грн</div>

                <span class="remove-item" onclick="removeItem(${index})">
                    Видалити 🗑
                </span>
            </div>
        </div>`;
    }).join('');

    document.getElementById('final-total-val').innerText = total + ' грн';
}

function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];

    cart.splice(index, 1); // видаляємо товар
    localStorage.setItem('it_shop_cart', JSON.stringify(cart));

    renderPreview(); // перерендер
}













function autoFillFromProfile() {
    const saved = JSON.parse(localStorage.getItem('user_delivery_choice'));
    if (!saved) return;

    const radio = document.querySelector(`input[name="delivery_method"][value="${saved.type}"]`);
    if (radio) {
        radio.checked = true;
        // Тригеримо зміну, щоб відкрити потрібні поля
        radio.dispatchEvent(new Event('change'));

        const parent = radio.closest('.delivery-option-group');
        const cityInput = parent.querySelector('.city-input');
        const pointInput = parent.querySelector('.point-input');
        
        if (cityInput) cityInput.value = saved.city;
        if (pointInput) {
            pointInput.value = saved.warehouse;
            pointInput.disabled = false;
        }
    }

    if (saved.payment) {
        const pVal = (saved.payment === 'card' || saved.payment === 'Карткою') ? 'Карткою' : 'При отриманні';
        const pRadio = document.querySelector(`input[name="payment"][value="${pVal}"]`);
        if (pRadio) pRadio.checked = true;
    }
}





