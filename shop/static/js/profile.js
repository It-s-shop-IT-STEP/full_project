const NP_API_KEY = '49f64034109f180560a35b4829c1ee5a';

// Універсальна функція запиту до Нової Пошти
async function fetchNP(method, properties) {
    const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
        method: 'POST',
        body: JSON.stringify({
            apiKey: NP_API_KEY,
            modelName: "Address",
            calledMethod: method,
            methodProperties: properties
        })
    });
    return await response.json();
}

// 1. Пошук міста
window.handleCityInput = async function(inputElement) {
    const query = inputElement.value.trim();
    const resultsContainer = document.getElementById('city-results');
    if (query.length < 2) { resultsContainer.style.display = 'none'; return; }

    const data = await fetchNP('getCities', { FindByString: query, Limit: "10" });
    if (data.success && data.data.length > 0) {
        resultsContainer.innerHTML = data.data.map(city => {
            const safeName = city.Description.replace(/'/g, "\\'").replace(/"/g, "&quot;");
            return `<div class="np-item" onclick="selectCity('${safeName}', '${city.Ref}')">${city.Description}</div>`;
        }).join('');
        resultsContainer.style.display = 'block';
    }
};

window.selectCity = function(name, ref) {
    document.getElementById('city-input').value = name;
    document.getElementById('city-ref').value = ref;
    document.getElementById('city-results').style.display = 'none';
};

// 2. Пошук відділення
window.handleWarehouseInput = async function(inputElement) {
    const query = inputElement.value.trim();
    const cityRef = document.getElementById('city-ref').value;
    const resultsContainer = document.getElementById('warehouse-results');

    if (!cityRef) {
        resultsContainer.innerHTML = '<div class="np-item" style="color:red">Спочатку оберіть місто</div>';
        resultsContainer.style.display = 'block';
        return;
    }

    const data = await fetchNP('getWarehouses', { CityRef: cityRef, FindByString: query });
    if (data.success && data.data.length > 0) {
        resultsContainer.innerHTML = data.data.map(w => {
            const safeWarehouse = w.Description.replace(/'/g, "\\'").replace(/"/g, "&quot;");
            return `<div class="np-item" onclick="selectWarehouse('${safeWarehouse}')">${w.Description}</div>`;
        }).join('');
        resultsContainer.style.display = 'block';
    }
};

// 3. Вибір відділення (КЛІК ПРАЦЮЄ)
// Оновлена функція вибору відділення
window.selectWarehouse = function(name) {
    console.log("Клік спрацював на:", name);
    document.getElementById('warehouse-input').value = name;
    document.getElementById('warehouse-results').style.display = 'none';

    saveDeliveryToLocal(); // Викликаємо спільну функцію збереження
};

// Нова функція для збереження всіх налаштувань доставки та оплати в пам'ять
function saveDeliveryToLocal() {
    const city = document.getElementById('city-input').value;
    const warehouse = document.getElementById('warehouse-input').value;
    const payment = document.querySelector('input[name="payment_method"]:checked')?.value || 'cash';

    const deliveryData = {
        city: city,
        warehouse: warehouse,
        type: warehouse.toLowerCase().includes('поштомат') ? 'Поштомат' : 'Відділення',
        payment: payment
    };
    
    localStorage.setItem('user_delivery_choice', JSON.stringify(deliveryData));
    console.log("Дані для Order збережено:", deliveryData);
}

// Додай прослуховувач на зміну радіо-кнопок оплати
document.querySelectorAll('input[name="payment_method"]').forEach(input => {
    input.addEventListener('change', saveDeliveryToLocal);
});

// 4. ЗБЕРЕЖЕННЯ НА СЕРВЕР (Django)
window.saveProfile = async function(event, type) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const btn = form.querySelector('button[type="submit"]');
    
    // Візуальний фідбек
    const originalText = btn.innerText;
    btn.innerText = "Збереження...";
    btn.disabled = true;

    try {
        const response = await fetch('/update-profile/', {
            method: 'POST',
            body: formData,
            headers: {
                // Отримуємо CSRF токен безпосередньо з форми
                'X-CSRFToken': form.querySelector('[name=csrfmiddlewaretoken]').value
            }
        });

        if (response.ok) {
            // Оновлюємо текст у режимі перегляду залежно від типу
            if (type === 'payment') {
                const method = formData.get('payment_method');
                document.getElementById('view-payment').innerText = 
                    method === 'card' ? 'Карткою на сайті' : 'Оплата при отриманні';

                let deliveryData = JSON.parse(localStorage.getItem('user_delivery_choice')) || {};
                deliveryData.payment = method; 
                localStorage.setItem('user_delivery_choice', JSON.stringify(deliveryData));
                
                console.log("Оплата збережена в пам'ять:", method);
            } else if (type === 'delivery') {
                document.getElementById('view-city').innerText = formData.get('city');
                document.getElementById('view-warehouse').innerText = formData.get('warehouse');

                let deliveryData = JSON.parse(localStorage.getItem('user_delivery_choice')) || {};
                deliveryData.city = formData.get('city');
                deliveryData.warehouse = formData.get('warehouse');
                deliveryData.type = formData.get('warehouse').toLowerCase().includes('поштомат') ? 'Поштомат' : 'Відділення';
                localStorage.setItem('user_delivery_choice', JSON.stringify(deliveryData));
            }             
            
            toggleEdit(`block-${type}`);
        }
    } catch (error) {
        console.error("Помилка мережі:", error);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

// 5. ТАБИ ТА РЕДАГУВАННЯ
window.toggleEdit = function(blockId) {
    const block = document.getElementById(blockId);
    const view = block.querySelector('.view-mode');
    const edit = block.querySelector('.edit-mode');
    
    if (edit.style.display === 'none' || edit.style.display === '') {
        view.style.display = 'none';
        edit.style.display = 'block';
    } else {
        view.style.display = 'block';
        edit.style.display = 'none';
    }
};

// Закриття списків при кліку поза ними
document.addEventListener('click', (e) => {
    if (!e.target.closest('.np-container')) {
        document.querySelectorAll('.np-dropdown').forEach(d => d.style.display = 'none');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');

            // 1. Видаляємо клас active у всіх кнопок і контенту
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(tab => tab.style.display = 'none');

            // 2. Активуємо потрібну вкладку
            item.classList.add('active');
            const targetBlock = document.getElementById(targetTab);
            if (targetBlock) {
                targetBlock.style.display = 'block';
            }

            // 3. ДОДАЙ ЦЕЙ БЛОК: якщо відкрили вкладку повідомлень
            if (targetTab === 'messages') {
                markAsReadOnServer(); // Викликаємо функцію, яка повідомить сервер
            }
        });
    });
});

async function markAsReadOnServer() {
    try {
        await fetch('/mark-messages-read/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            }
        });
        // Ми просто відправили сигнал серверу. 
        // Повідомлення залишаться "unread" візуально, поки сторінку не оновлять.
    } catch (e) {
        console.error("Помилка сервера", e);
    }
}