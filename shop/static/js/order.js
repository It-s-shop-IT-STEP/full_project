const API_KEY = '49f64034109f180560a35b4829c1ee5a';
let validAddressCities = new Set();

document.addEventListener('DOMContentLoaded', () => {
    initDeliveryToggles();
    initCitySearch();
    renderPreview();
    
    // Закриття випадаючих списків при кліку поза ними
    window.addEventListener('click', (e) => {
        if (!e.target.classList.contains('point-input')) {
            document.querySelectorAll('.custom-dropdown-list').forEach(d => d.style.display = 'none');
        }
    });
});

// 1. ПЕРЕМИКАННЯ ВАРІАНТІВ ДОСТАВКИ
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

// 2. ПОШУК МІСТ (API НОВА ПОШТА)
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
                    if(isAddr) validAddressCities.clear();
                    
                    const options = res.data.map(c => {
                        if (isAddr && c.CanBookingAddress === false) return '';
                        const name = c.Description || c.MainDescription;
                        const reg = c.AreaDescription || c.RegionsDescription || "";
                        const full = reg ? `${name} (${reg} обл.)` : name;
                        
                        if (seen.has(full)) return '';
                        seen.add(full);
                        if(isAddr) validAddressCities.add(full);
                        
                        return `<option value="${full}" data-ref="${c.Ref || c.DeliveryCity}">`;
                    }).join('');
                    
                    this.nextElementSibling.innerHTML = options;
                }
            } catch (e) { console.error("NP API Error:", e); }
            
            if (isAddr) checkCourierError(this);
        });

        input.addEventListener('change', function() {
            const datalist = this.nextElementSibling;
            const option = Array.from(datalist.options).find(o => o.value === this.value);
            if (option && !this.classList.contains('np-search-input-address')) {
                loadPoints(this.closest('.delivery-option-group'), option.getAttribute('data-ref'));
            }
        });
    });
}

// 3. ЗАВАНТАЖЕННЯ ВІДДІЛЕНЬ/ПОШТОМАТІВ
async function loadPoints(parent, ref) {
    const input = parent.querySelector('.point-input');
    const list = parent.querySelector('.custom-dropdown-list');
    const type = parent.querySelector('input[name="delivery_method"]').value;

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
            return type === 'Поштомат' ? isP : !isP;
        });

        input.disabled = false;
        input.value = ""; // Очищуємо попереднє значення
        
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

function checkCourierError(input) {
    const err = document.getElementById('address-error');
    if (!err) return;
    err.style.display = (input.value.length > 2 && !validAddressCities.has(input.value)) ? 'block' : 'none';
}

// 4. ВІДПРАВКА В ТЕЛЕГРАМ

// Функція для отримання захисного токена Django
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

async function sendOrderToTelegram() {
    const cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    if (cart.length === 0) return alert("Кошик порожній!");

    const orderData = {
        first_name: document.getElementById('cust-first-name').value.trim(),
        last_name: document.getElementById('cust-last-name').value.trim(),
        phone: document.getElementById('cust-phone').value.trim(),
        email: document.getElementById('cust-email').value.trim(),
        address: document.querySelector('.city-input, .np-search-input-address').value + ", " + 
                 document.querySelector('.point-input').value,
        total_price: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        cart: cart
    };

    // Отримання CSRF токена для Django
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    if (!csrfToken) {
        console.error("CSRF token not found! Переконайтеся, що {% csrf_token %} додано в HTML.");
        return;
    }
    try {
        const res = await fetch('/checkout/', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken 
            },
            body: JSON.stringify(orderData)
        });

        if (res.ok) {
            alert("Замовлення збережено в базі та відправлено!");
            localStorage.removeItem('it_shop_cart');
            window.location.href = "/";
        } else {
            alert("Помилка при збереженні замовлення.");
        }
    } catch (e) {
        alert("Помилка з'єднання з сервером.");
    }
}

// 5. ПОПЕРЕДНІЙ ПЕРЕГЛЯД ТОВАРІВ У КОЛОНЦІ
function renderPreview() {
    const previewContainer = document.getElementById('order-preview-items');
    if (!previewContainer) return;

    const cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    
    previewContainer.innerHTML = cart.map(i => `
        <div style="display:flex; gap:12px; margin-bottom:12px; align-items:center;">
            <img src="${i.image}" style="width:45px; height:45px; object-fit:cover; border-radius:6px; background:#f9f9f9;">
            <div style="line-height:1.3;">
                <div style="font-weight:600; font-size:13px;">${i.name}</div>
                <div style="font-size:11px; color:#666;">${i.quantity} шт. × ${i.price} грн</div>
            </div>
        </div>`).join('');

    document.getElementById('final-total-val').innerText = total + ' грн';
}