// 1. Додавання в кошик
function getProductData(el) {
    const card = el.closest('.product-card');
    return {
        id: card.dataset.id,
        article: card.dataset.article,
        price: parseInt(card.dataset.price),
        name: card.querySelector('.product-name').innerText,
        image: card.querySelector('.image-box img').src
    };
}

// function addToCart(btn) {
//     const data = getProductData(btn);

//     let cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
//     const item = cart.find(i => i.id === data.id);
    
//     if (item) {
//         item.quantity += 1;
//         item.price = data.price; // ОНОВЛЕННЯ ЦІНИ, якщо вона змінилась в адмінці
//     } else {
//         cart.push({ ...data, quantity: 1, color: "Не обрано", size: "Не обрано" });
//     }

//     localStorage.setItem('it_shop_cart', JSON.stringify(cart));
//     if (typeof updateHeaderBadges === 'function') updateHeaderBadges();
//     if (typeof renderCart === 'function') renderCart();
// }


function addToCart(btn) {
    const data = getProductData(btn);
    const img = btn.querySelector('img');

    let cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
    const item = cart.find(i => i.id === data.id);
    
    if (item) {
        item.quantity += 1;
        item.price = data.price;
    } else {
        cart.push({ ...data, quantity: 1, color: "Не обрано", size: "Не обрано" });
    }

    localStorage.setItem('it_shop_cart', JSON.stringify(cart));

    // 🔥 робимо іконку чорною (ОДИН РАЗ)
    btn.classList.add('active');
    img.src = img.dataset.active;

    if (typeof updateHeaderBadges === 'function') updateHeaderBadges();
    if (typeof renderCart === 'function') renderCart();
if (typeof restoreActiveStates === 'function') restoreActiveStates();
}






// 2. Додавання/видалення з улюблених
// function toggleFavorite(btn) {
//     const data = getProductData(btn);
//     btn.classList.toggle('active');

//     let favorites = JSON.parse(localStorage.getItem('it_shop_favorites')) || [];
//     const index = favorites.findIndex(i => i.id === data.id);

//     if (index > -1) {
//         favorites.splice(index, 1);
//     } else {
//         favorites.push(data);
//     }

//     localStorage.setItem('it_shop_favorites', JSON.stringify(favorites));
//     if (typeof updateHeaderBadges === 'function') updateHeaderBadges();
// }

function toggleFavorite(btn) {
    const data = getProductData(btn);
    const img = btn.querySelector('img');

    let favorites = JSON.parse(localStorage.getItem('it_shop_favorites')) || [];
    const index = favorites.findIndex(i => i.id === data.id);

    if (index > -1) {
        // ВИДАЛЯЄМО З УЛЮБЛЕНИХ
        favorites.splice(index, 1);
        btn.classList.remove('active');
        img.src = img.dataset.default;
    } else {
        // ДОДАЄМО В УЛЮБЛЕНІ
        favorites.push(data);
        btn.classList.add('active');
        img.src = img.dataset.active;
    }

    localStorage.setItem('it_shop_favorites', JSON.stringify(favorites));
    if (typeof updateHeaderBadges === 'function') updateHeaderBadges();

if (typeof restoreActiveStates === 'function') restoreActiveStates();


}



window.addEventListener('storage', function (e) {
    if (e.key === 'it_shop_cart' || e.key === 'it_shop_favorites') {
        if (typeof restoreActiveStates === 'function') {
            restoreActiveStates();
        }
    }
});
















// 3. Логіка пагінації та пошуку
document.addEventListener("DOMContentLoaded", function() {
    const productGrid = document.querySelector('.product-grid');
    const products = document.querySelectorAll('.product-card');
    const loadMoreBtn = document.querySelector('.load-more-btn');
    const searchInput = document.querySelector('.search-container input');
    let visibleCount = 12;

    // СИНХРОНІЗАЦІЯ ЦІН
    function syncPrices() {
        let cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
        let favorites = JSON.parse(localStorage.getItem('it_shop_favorites')) || [];
        let changed = false;

        document.querySelectorAll('.product-card').forEach(card => {
            const id = card.dataset.id;
            const actualPrice = parseInt(card.dataset.price);[cart, favorites].forEach(list => {
                const item = list.find(i => i.id === id);
                if (item && item.price !== actualPrice) {
                    item.price = actualPrice;
                    changed = true;
                }
            });
        });

        if (changed) {
            localStorage.setItem('it_shop_cart', JSON.stringify(cart));
            localStorage.setItem('it_shop_favorites', JSON.stringify(favorites));
        }

        restoreActiveStates();

    }

    // --- ФУНКЦІЯ ВІДНОВЛЕННЯ СТАНУ ІКОНОК ---
    // function restoreActiveStates() {
    //     // Отримуємо актуальні дані з глобальних масивів або LocalStorage
    //     const currentFavIds = favorites.map(item => String(item.id));

    //     // Підсвічуємо кнопки обраного
    //     document.querySelectorAll('.wishlist-btn').forEach(btn => {
    //         const onclickAttr = btn.getAttribute('onclick');
    //         const idMatch = onclickAttr.match(/'(\d+)'/);
    //         if (idMatch && currentFavIds.includes(idMatch[1])) {
    //             btn.classList.add('active');
    //         }
    //     });
    // }

    // function updateVisibility() {
    //     const products = document.querySelectorAll('.product-card');
    //     products.forEach((p, index) => {
    //         p.style.display = (index < visibleCount) ? 'flex' : 'none';
    //     });
    //     if (loadMoreBtn) {
    //         loadMoreBtn.style.display = (visibleCount >= products.length) ? 'none' : 'block';
    //     }
    // }



// function restoreActiveStates() {
//     const favorites = JSON.parse(localStorage.getItem('it_shop_favorites')) || [];
//     const favIds = favorites.map(item => String(item.id));

//     document.querySelectorAll('.product-card').forEach(card => {
//         const id = card.dataset.id;
//         const btn = card.querySelector('.wishlist-btn');
//         const img = btn.querySelector('img');

//         if (favIds.includes(id)) {
//             btn.classList.add('active');
//             img.src = img.dataset.active;
//         } else {
//             btn.classList.remove('active');
//             img.src = img.dataset.default;
//         }
//     });




//     /////////////////////////////////////////////////////////////////////////////////////////////////////////

//     function restoreActiveStates() {
//     const cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];
//     const cartIds = cart.map(item => String(item.id));

//     document.querySelectorAll('.product-card').forEach(card => {
//         const id = card.dataset.id;
//         const btn = card.querySelector('.cart-btn');
//         const img = btn.querySelector('img');

//         if (cartIds.includes(id)) {
//             btn.classList.add('active');
//             img.src = img.dataset.active;
//         } else {
//             btn.classList.remove('active');
//             img.src = img.dataset.default;
//         }
//     });
// }

// }


function restoreActiveStates() {
    const favorites = JSON.parse(localStorage.getItem('it_shop_favorites')) || [];
    const cart = JSON.parse(localStorage.getItem('it_shop_cart')) || [];

    const favIds = favorites.map(item => String(item.id));
    const cartIds = cart.map(item => String(item.id));

    document.querySelectorAll('.product-card').forEach(card => {
        const id = String(card.dataset.id);

        /* ❤️ УЛЮБЛЕНІ */
        const favBtn = card.querySelector('.wishlist-btn');
        if (favBtn) {
            const favImg = favBtn.querySelector('img');
            if (favIds.includes(id)) {
                favBtn.classList.add('active');
                favImg.src = favImg.dataset.active;
            } else {
                favBtn.classList.remove('active');
                favImg.src = favImg.dataset.default;
            }
        }/* 🛒 КОШИК */
        const cartBtn = card.querySelector('.cart-btn');
        if (cartBtn) {
            const cartImg = cartBtn.querySelector('img');
            if (cartIds.includes(id)) {
                cartBtn.classList.add('active');
                cartImg.src = cartImg.dataset.active;
            } else {
                cartBtn.classList.remove('active');
                cartImg.src = cartImg.dataset.default;
            }
        }
    });
}








    // 2. Логіка ЖИВОГО ПОШУКУ
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value;

            fetch(`?q=${query}`, {
                headers: {
                    'x-requested-with': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                // Оновлюємо сітку новим HTML
                productGrid.innerHTML = data.html;
                
                // Скидаємо лічильник при новому пошуку та оновлюємо видимість
                visibleCount = 12;
                updateVisibility();
                restoreActiveStates();
            })
            .catch(err => console.error('Помилка пошуку:', err));
        });
    }

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            visibleCount += 12;
            updateVisibility();
        });
    }

    syncPrices();
    updateVisibility();
    restoreActiveStates();
});


// Змінна для зберігання інтервалу зміни зображень
let imageInterval;

function startImageCycle(card) {
    const mainImg = card.querySelector('.main-img');
    const extraImages = Array.from(card.querySelectorAll('.extra-images span')).map(span => span.dataset.src);
    
    if (extraImages.length === 0) return;

    let currentIndex = 0;
    const originalSrc = mainImg.src;

    imageInterval = setInterval(() => {
        mainImg.src = extraImages[currentIndex];
        currentIndex = (currentIndex + 1) % extraImages.length;
    }, 1000); // Швидкість зміни - 1 секунда

    // Зберігаємо оригінальне фото, щоб повернути його
    card.dataset.originalSrc = originalSrc;
}

function stopImageCycle(card) {
    clearInterval(imageInterval);
    const mainImg = card.querySelector('.main-img');
    if (card.dataset.originalSrc) {
        mainImg.src = card.dataset.originalSrc;
    }
}














/* ////////////////////////////////////////////////////////////////////////// */