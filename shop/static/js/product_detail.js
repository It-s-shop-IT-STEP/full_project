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
    const finalPrice = parseFloat(price);

    // Зчитуємо обрані значення з radio-buttons
    const selectedColor = document.querySelector('input[name="color"]:checked')?.value || "Чорний";
    const selectedSize = document.querySelector('input[name="size"]:checked')?.value || "S";

    // Створюємо унікальний ключ (id + колір + розмір), щоб в кошику це були різні позиції
    const productKey = `${id}-${selectedColor}-${selectedSize}`;
    
    cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];

    const existingIndex = cart.findIndex(item => item.id === productKey);
    
    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
        // Оновлюємо ціну на випадок, якщо вона змінилася в базі, поки юзер думав
        cart[existingIndex].price = finalPrice; 
    } else {
        cart.push({
            id: productKey,
            originalId: id,
            name: name,
            article: article,
            price: finalPrice, // Зберігаємо вже ціну зі знижкою
            image: image,
            color: selectedColor,
            size: selectedSize,
            quantity: 1
        });
    }

    localStorage.setItem('it_shop_cart', JSON.stringify(cart));
    alert("Товар додано в кошик!");
    
    // Оновлюємо лічильник в хедері (якщо функція доступна)
    if (typeof updateHeaderBadges === 'function') {
        updateHeaderBadges();
    }
}


let currentImages = []; // Фотографії поточного кольору
let currentIndex = 0;

function updateGallery(colorName, element, isManual = true) {
    // Оновлюємо текст назви кольору
    document.getElementById('selected-color-name').innerText = colorName.toUpperCase();
        
    const imagesData = element.getAttribute('data-images');
    currentImages = JSON.parse(imagesData);
    if (isManual) currentIndex = 0;

    // Знімаємо активність з усіх точок і додаємо поточній
    document.querySelectorAll('.color-dot').forEach(dot => dot.classList.remove('active'));
    element.classList.add('active');

    // Показуємо перше фото з нового списку
    if (currentImages.length > 0) {
        displayImage();
    }
}

function displayImage() {
    const mainImg = document.getElementById('main-display-image');
    mainImg.style.opacity = '0.5'; // Ефект плавного переходу
    setTimeout(() => {
        mainImg.src = currentImages[currentIndex];
        mainImg.style.opacity = '1';
    }, 150);
}

function changeImage(step) {
    if (currentImages.length === 0) return;
    let newIndex = currentIndex + step;

    // Перевірка: чи вийшли ми за межі фотографій ПОТОЧНОГО кольору
    if (newIndex >= currentImages.length) {
        // Йдемо до наступного кольору
        switchColor(1); 
    } else if (newIndex < 0) {
        // Йдемо до попереднього кольору
        switchColor(-1);
    } else {
        // Залишаємось в поточному кольорі
        currentIndex = newIndex;
        displayImage();
    }
}

function switchColor(direction) {
    const dots = Array.from(document.querySelectorAll('.color-dot'));
    const activeDot = document.querySelector('.color-dot.active');
    let nextIndex = dots.indexOf(activeDot) + direction;

    // Циклічне перемикання між кольорами
    if (nextIndex >= dots.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = dots.length - 1;

    const nextDot = dots[nextIndex];
    
    // Оновлюємо галерею для нового кольору
    // Якщо йдемо вперед (1), ставимо currentIndex = 0 (перше фото)
    // Якщо йдемо назад (-1), ставимо currentIndex = остання фотографія
    updateGallery(nextDot.querySelector('input').value, nextDot, false);
    
    if (direction === -1) {
        currentIndex = currentImages.length - 1;
        displayImage();
    } else {
        currentIndex = 0;
        displayImage();
    }
}

// При завантаженні автоматично обираємо перший колір
document.addEventListener('DOMContentLoaded', () => {
    const firstColor = document.querySelector('.color-dot');
    if (firstColor) firstColor.click();
});