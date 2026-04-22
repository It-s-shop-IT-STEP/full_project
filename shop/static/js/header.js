document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');

    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            mobileNav.classList.toggle('active');
        });
    }

    // Закриття меню при кліку поза ним
    document.addEventListener('click', function(event) {
        if (!menuBtn.contains(event.target) && !mobileNav.contains(event.target)) {
            mobileNav.classList.remove('active');
        }
    });
});