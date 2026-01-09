from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth import authenticate, logout
from django.contrib.auth import login as auth_login
from django.contrib.auth.models import User
from .models import Product
from .forms import RegistrationForm


# -------------------------
# ГОЛОВНІ СТОРІНКИ
# -------------------------

def main_page(request):
    return render(request, 'main.html')


def profile(request):
    return render(request, 'profile.html')


def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)

        if user is not None:
            auth_login(request, user)
            return redirect('main')
        else:
            messages.error(request, 'Invalid username or password')

    return render(request, 'login.html')


def logout_view(request):
    logout(request)
    return redirect('login')


# -------------------------
# РЕЄСТРАЦІЯ (ВИПРАВЛЕНО)
# -------------------------

def register_view(request):
    if request.method == 'POST':
        # 1. Отримуємо дані з форми
        form = RegistrationForm(request.POST)

        # 2. Перевіряємо форму
        if form.is_valid():
            user = form.save(commit=False)

            # 3. Формуємо username з імені та прізвища
            f_name = form.cleaned_data.get('first_name', '').lower()
            l_name = form.cleaned_data.get('last_name', '').lower()
            base_username = f"{f_name}{l_name}"

            username = base_username
            counter = 1

            # 4. Гарантуємо унікальність username
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            user.username = username

            # 5. Обовʼязково хешуємо пароль
            user.set_password(form.cleaned_data['password'])

            # 6. Звичайний користувач (НЕ персонал)
            user.is_staff = False
            user.is_superuser = False

            # 7. Зберігаємо користувача
            user.save()

            messages.success(request, 'Account created successfully')
            return redirect('login')

        else:
            messages.error(request, 'Registration failed. Please check the form.')

    else:
        form = RegistrationForm()

    return render(request, 'register.html', {'form': form})
# -------------------------
# КАТАЛОГ ТОВАРІВ
# -------------------------

def catalog(request):
    # Цей рядок витягує всі товари з бази
    products = Product.objects.all()

    # Ми передаємо список 'products' у HTML
    return render(request, 'catalog.html', {'products': products})


def product_detail(request, id):
    # Отримуємо товар за ID або видаємо помилку 404
    product = get_object_or_404(Product, id=id)
    return render(request, 'product_detail.html', {'product': product})


def checkout(request):
    return render(request, 'checkout.html')