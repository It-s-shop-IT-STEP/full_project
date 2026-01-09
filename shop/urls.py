from django.urls import path
from . import views

urlpatterns = [
    path('', views.main_page, name='main'),
    path('profile/', views.profile, name='profile'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('catalog/', views.catalog, name='catalog'),
    path('product/<int:id>/', views.product_detail, name='product_detail'), # Новий шлях
    path('checkout/', views.checkout, name='checkout'),
]

