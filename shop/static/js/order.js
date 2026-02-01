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
    const cart = getCartData();
    if (cart.length === 0) return alert("Кошик порожній!");

    // Збір персональних даних
    const firstName = document.getElementById('cust-first-name')?.value.trim();
    const lastName = document.getElementById('cust-last-name')?.value.trim();
    const phone = document.getElementById('cust-phone')?.value.trim();
    const email = document.getElementById('cust-email')?.value.trim();

    // Збір адреси (з активного блоку)
    const activeGroup = document.querySelector('.np-sub-fields.active');
    let fullAddress = "Не вказано";
    if (activeGroup) {
        const city = activeGroup.querySelector('.city-input')?.value || "";
        const point = activeGroup.querySelector('.point-input')?.value || "";
        fullAddress = `${city}, ${point}`;
    }

    // Збір коментаря (id="order-comment")
    const comment = document.getElementById('order-comment')?.value.trim() || "Без коментаря";

    // Збір оплати
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