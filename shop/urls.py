from django.urls import path
from . import views

urlpatterns = [
    path('', views.main_page, name='main'),
    path('welcome/', views.welcome, name='welcome'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('catalog/', views.catalog, name='catalog'),
    path('product/<int:id>/', views.product_detail, name='product_detail'), # Новий шлях
    path('checkout/', views.checkout_view, name='checkout'),
    path('profile/', views.profile_view, name='profile'),
    path('order/', views.order_view, name='order_page'),
    path('logout/', views.logout_view, name='logout'),
    path('update-profile/', views.update_profile, name='update_profile'),
    path('mark-messages-read/', views.mark_messages_as_read, name='mark_messages_read'),
    path('get_cart_prices/', views.get_cart_prices, name='get_cart_prices')
]