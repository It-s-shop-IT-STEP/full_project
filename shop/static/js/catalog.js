// 1. Додавання в кошик (використовуємо глобальний масив cart з main.js)
function addToCart(id, name, price, image) {
    // Шукаємо, чи є вже такий товар
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ 
            id: id, 
            name: name, 
            price: parseFloat(price), 
            image: image, 
            quantity: 1,
            color: "Не обрано",
            size: "Не обрано"
        });
    }
    
    // Викликаємо УНІВЕРСАЛЬНУ функцію збереження з main.js
    if (typeof saveCart === 'function') {
        saveCart(); 
        alert("Товар додано в кошик!");
    } else {
        // Якщо раптом main.js не підключено, робимо це вручну
        localStorage.setItem('it_shop_cart', JSON.stringify(cart));
        if (typeof updateHeaderBadges === 'function') updateHeaderBadges();
        alert("Товар додано!");
    }
}

// 2. Додавання/видалення з улюблених
function toggleFavorite(id, name, price, image) {
    const index = favorites.findIndex(item => item.id === id);
    
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push({ id, name, price: parseFloat(price), image });
    }
    
    // Викликаємо функцію збереження з main.js
    if (typeof saveFavorites === 'function') {
        saveFavorites();
    } else {
        localStorage.setItem('it_shop_favorites', JSON.stringify(favorites));
        if (typeof updateHeaderBadges === 'function') updateHeaderBadges();
    }
}

// 3. Логіка пагінації (залишаємо як було, вона незалежна)
document.addEventListener("DOMContentLoaded", function() {
    const products = document.querySelectorAll('.product-card');
    const loadMoreBtn = document.querySelector('.load-more-btn');
    let visibleCount = 12;

    function updateVisibility() {
        products.forEach((p, index) => {
            p.style.display = (index < visibleCount) ? 'flex' : 'none';
        });
        if (loadMoreBtn) {
            loadMoreBtn.style.display = (visibleCount >= products.length) ? 'none' : 'block';
        }
    }

    if (loadMoreBtn) {
        updateVisibility();
        loadMoreBtn.addEventListener('click', () => {
            visibleCount += 12;
            updateVisibility();
        });
    }
});