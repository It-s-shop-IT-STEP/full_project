document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const tabs = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-tab');

            // Керування класами кнопок
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Керування класами контенту
            tabs.forEach(tab => {
                tab.classList.remove('active');
                if (tab.id === target) {
                    tab.classList.add('active');
                }
            });
        });
    });
});