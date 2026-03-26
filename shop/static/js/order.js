const API_KEY = '49f64034109f180560a35b4829c1ee5a';
let validAddressCities = new Set();

document.addEventListener('DOMContentLoaded', () => {
    initDeliveryToggles();
    initCitySearch();
    renderPreview();
    autoFillFromProfile(); // Автозаповнення при завантаженні
    
    // Закриття випадаючих списків при кліку поза ними
    window.addEventListener('click', (e) => {
        if (!e.target.classList.contains('point-input')) {
            document.querySelectorAll('.custom-dropdown-list').forEach(d => d.style.display = 'none');
        }
    });
});

// --- 1. ДОПОМІЖНІ ФУНКЦІЇ ---

function getCartData() {
    // Отримуємо товари за тим самим ключем, що і в рендері прев'ю
    return JSON.parse(localStorage.getItem('it_shop_cart')) || [];
}

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

// --- 2. ПЕРЕМИКАННЯ ТА ПОШУК (НОВА ПОШТА) ---

function initDeliveryToggles() {
    document.querySelectorAll('input[name="delivery_method"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('.np-sub-fields').forEach(f => f.classList.remove('active'));
            const parent = this.closest('.delivery-option-group');
            const subFields = parent.querySelector('.np-sub-fields');
            if (subFields) subFields.classList.add('active');
        });
    });
}

function initCitySearch() {
    document.querySelectorAll('.city-input, .np-search-input-address').forEach(input => {
        input.addEventListener('input', async function() {
            const val = this.value.trim();
            if (val.length < 2) return;
            
            const isAddr = this.classList.contains('np-search-input-address');
            
            try {
                const resp = await fetch('https://api.novaposhta.ua/v2.0/json/', {
                    method: 'POST',
                    body: JSON.stringify({
                        apiKey: API_KEY,
                        modelName: "Address",
                        calledMethod: isAddr ? "getSettlements" : "getCities",
                        methodProperties: { FindByString: val, Limit: "30" }
                    })
                });
                const res = await resp.json();
                
                if (res.success) {
                    const seen = new Set();
                    const options = res.data.map(c => {
                        const name = c.Description || c.MainDescription;
                        const reg = c.AreaDescription || c.RegionsDescription || "";
                        const full = reg ? `${name} (${reg} обл.)` : name;
                        if (seen.has(full)) return '';
                        seen.add(full);
                        return `<option value="${full}" data-ref="${c.Ref || c.DeliveryCity}">`;
                    }).join('');
                    this.nextElementSibling.innerHTML = options;
                }
            } catch (e) { console.error("NP API Error:", e); }
        });

        input.addEventListener('change', function() {
            const datalist = this.nextElementSibling;
            const option = Array.from(datalist.options).find(o => o.value === this.value);
            if (option) {
                loadPoints(this.closest('.delivery-option-group'), option.getAttribute('data-ref'));
            }
        });
    });
}

async function loadPoints(parent, ref) {
    const input = parent.querySelector('.point-input');
    const list = parent.querySelector('.custom-dropdown-list');
    const typeRadio = parent.querySelector('input[name="delivery_method"]');

    const resp = await fetch('https://api.novaposhta.ua/v2.0/json/', {
        method: 'POST',
        body: JSON.stringify({
            apiKey: API_KEY, 
            modelName: "Address", 
            calledMethod: "getWarehouses",
            methodProperties: { CityRef: ref }
        })
    });
    
    const res = await resp.json();
    if (res.success) {
        const items = res.data.filter(w => {
            const isP = w.Description.includes('Поштомат') || w.CategoryOfWarehouse === 'Postomat';
            return typeRadio.value === 'Поштомат' ? isP : !isP;
        });

        input.disabled = false;
        input.value = ""; 
        input.onclick = (e) => { 
            e.stopPropagation();
            list.style.display = 'block'; 
            updateUIList(items, list, input, ""); 
        };
        input.oninput = (e) => updateUIList(items, list, input, e.target.value);
    }
}

function updateUIList(items, listUI, inputUI, filter) {
    const filt = items.filter(i => i.Description.toLowerCase().includes(filter.toLowerCase()));
    listUI.innerHTML = filt.map(i => `<div>${i.Description}</div>`).join('');
    listUI.onclick = (e) => {
        if(e.target.tagName === 'DIV') { 
            inputUI.value = e.target.innerText; 
            listUI.style.display = 'none'; 
        }
    };
}

// --- 3. ВІДПРАВКА ЗАМОВЛЕННЯ ---

async function sendOrderToTelegram() {
    const cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    if (cart.length === 0) return alert("Кошик порожній!");

    // 1. Отримуємо дані
    const firstName = document.getElementById('cust-first-name')?.value.trim();
    const lastName = document.getElementById('cust-last-name')?.value.trim();
    const phone = document.getElementById('cust-phone')?.value.trim();
    const email = document.getElementById('cust-email')?.value.trim();
    const comment = document.getElementById('order-comment')?.value.trim() || "Без коментаря";

    // 2. ВАЛІДАЦІЯ (ОБОВ'ЯЗКОВІ ПОЛЯ)
    if (!firstName || !lastName || !phone) {
        alert("Будь ласка, заповніть контактні дані: Ім'я, Прізвище та Телефон.");
        return; // Зупиняємо відправку
    }

    // 3. ПЕРЕВІРКА АДРЕСИ
    const deliveryRadio = document.querySelector('input[name="delivery_method"]:checked');
    const activeGroup = document.querySelector('.np-sub-fields.active');
    
    if (!deliveryRadio || !activeGroup) {
        alert("Будь ласка, оберіть спосіб доставки (Відділення або Поштомат).");
        return;
    }

    const city = activeGroup.querySelector('.city-input')?.value.trim();
    const point = activeGroup.querySelector('.point-input')?.value.trim();

    if (!city || !point) {
        alert("Будь ласка, вкажіть місто та номер відділення/поштомату.");
        return;
    }

    const fullAddress = `${deliveryRadio.value}: ${city}, ${point}`;

    // 4. ОПЛАТА
    const paymentRadio = document.querySelector('input[name="payment"]:checked');
    const paymentMethod = paymentRadio && (paymentRadio.value === 'Карткою' || paymentRadio.value === 'card') ? 'card' : 'cash';

    // 5. ПІДГОТОВКА ДАНИХ (зберігаємо originalId для уникнення помилок в Django)
    const orderData = {
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        email: email,
        address: fullAddress,
        comment: comment,
        payment_method: paymentMethod,
        cart: cart // Переконайтеся, що об'єкти в cart мають originalId
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

        const result = await res.json();

        if (res.ok && result.status === 'success') {
            localStorage.removeItem('it_shop_cart'); // Очищення кошика
            // ПОКАЗУЄМО МОДАЛЬНЕ ВІКНО
            const modal = document.getElementById('success-modal');
            if (modal) {
                modal.style.display = 'flex';
            }
        } else {
            const err = await res.json();
            // Виводимо конкретну помилку від Django (наприклад, про id)
            alert("Помилка: " + (err.message || "Спробуйте ще раз"));
        }
    } catch (e) {
        console.error("Fetch error:", e);
        alert("Помилка з'єднання з сервером. Перевірте консоль.");
    }
}

// Функція для закриття вікна та повернення на головну
function closeSuccessModal() {
    window.location.href = "/"; // Перенаправлення на головну сторінку
}

// Допоміжна функція для CSRF (якщо її немає)
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

// --- 4. ІНТЕРФЕЙС ТА АВТОЗАПОВНЕННЯ ---

function renderPreview() {
    const previewContainer = document.getElementById('order-preview-items');
    if (!previewContainer) return;

    const cart = getCartData();
    const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    
    previewContainer.innerHTML = cart.map(i => `
        <div style="display:flex; gap:12px; margin-bottom:12px; align-items:center;">
            <img src="${i.image}" style="width:45px; height:45px; object-fit:cover; border-radius:6px; background:#f9f9f9;">
            <div style="line-height:1.3;">
                <div style="font-weight:600; font-size:13px;">${i.name}</div>
                <div style="font-size:11px; color:#666;">${i.quantity} шт. × ${i.price} грн</div>
            </div>
        </div>`).join('');

    const totalEl = document.getElementById('final-total-val');
    if (totalEl) totalEl.innerText = total + ' грн';
}

function autoFillFromProfile() {
    const saved = JSON.parse(localStorage.getItem('user_delivery_choice'));
    if (!saved) return;

    const radio = document.querySelector(`input[name="delivery_method"][value="${saved.type}"]`);
    if (radio) {
        radio.checked = true;
        const parent = radio.closest('.delivery-option-group');
        const fields = parent.querySelector('.np-sub-fields');
        fields.classList.add('active');

        const cityInput = parent.querySelector('.city-input');
        const pointInput = parent.querySelector('.point-input');
        
        if (cityInput) cityInput.value = saved.city;
        if (pointInput) {
            pointInput.value = saved.warehouse;
            pointInput.disabled = false;
        }
    }

    if (saved.payment) {
        const pVal = saved.payment === 'card' ? 'Карткою' : 'При отриманні';
        const pRadio = document.querySelector(`input[name="payment"][value="${pVal}"]`);
        if (pRadio) pRadio.checked = true;
    }
}