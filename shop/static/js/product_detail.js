// 1. ВІЗУАЛЬНЕ ПЕРЕМИКАННЯ ТА ОНОВЛЕННЯ ТЕКСТУ ОПЦІЙ
document.addEventListener('DOMContentLoaded', () => {
    // Обробка вибору кольору
    const colorLabels = document.querySelectorAll('.color-dot');
    colorLabels.forEach(label => {
        label.addEventListener('click', function() {
            // Знімаємо активний клас з усіх
            colorLabels.forEach(el => el.classList.remove('active'));
            // Додаємо поточному
            this.classList.add('active');
            
            // Оновлюємо текст у заголовку (наприклад, КОЛІР БІЛИЙ)
            const colorValue = this.querySelector('input').value;
            const titleSpan = this.closest('.option-group').querySelector('h3 span');
            if (titleSpan) titleSpan.innerText = colorValue.toUpperCase();
        });
    });

    // Обробка вибору розміру
    const sizeLabels = document.querySelectorAll('.size-item');
    sizeLabels.forEach(label => {
        label.addEventListener('click', function() {
            sizeLabels.forEach(el => el.classList.remove('active'));
            this.classList.add('active');
            
            const sizeValue = this.querySelector('input').value;
            const titleSpan = this.closest('.option-group').querySelector('h3 span');
            if (titleSpan) titleSpan.innerText = sizeValue;
        });
    });

    // Зміна тексту кнопки, якщо ми в режимі редагування (з URL)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('edit')) {
        const buyBtn = document.querySelector('.btn-to-catalog');
        if (buyBtn) buyBtn.innerText = "ЗБЕРЕГТИ ЗМІНИ";
    }
});

// 2. ФУНКЦІЯ ДОДАВАННЯ В КОШИК З ПАРАМЕТРАМИ
function addToCart(id, name, price, image) {
    // Зчитуємо обрані значення з radio-buttons
    const selectedColor = document.querySelector('input[name="color"]:checked')?.value || "Білий";
    const selectedSize = document.querySelector('input[name="size"]:checked')?.value || "S";

    // Створюємо унікальний ключ (id + колір + розмір), щоб в кошику це були різні позиції
    const productKey = `${id}-${selectedColor}-${selectedSize}`;
    
    let cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    
    // Перевіряємо, чи ми редагуємо існуючий товар (параметр edit в URL)
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');

    if (editId) {
        // Режим редагування: видаляємо старий варіант і додаємо новий
        cart = cart.filter(item => item.id !== editId);
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
        alert("Зміни збережено!");
        window.location.href = '/checkout/'; // Повертаємо в кошик після редагування
    } else {
        // Звичайний режим: додаємо або збільшуємо кількість
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
    
    // Оновлюємо лічильник в хедері (якщо функція доступна)
    if (typeof updateHeaderBadges === 'function') {
        updateHeaderBadges();
    }
}