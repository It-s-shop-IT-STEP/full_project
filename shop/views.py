from django.shortcuts import render

def main_page(request):
    return render(request, 'main.html')

def profile(request):
    return render(request, 'profile.html')

def register(request):
    return render(request, 'register.html')

def login(request):
    return render(request, 'login.html')

def catalog(request):
    return render(request, 'catalog.html')

def checkout(request):
    return render(request, 'checkout.html')



from django.shortcuts import render, get_object_or_404
from .models import Product

def product_detail(request, product_id):
    # Отримуємо товар за ID або видаємо помилку 404, якщо не знайдено
    product = get_object_or_404(Product, id=product_id)
    return render(request, 'product_detail.html', {'product': product})

from django.shortcuts import render
from .models import Product  # Імпортуємо модель

def index(request):
    products = Product.objects.all()  # Беремо всі товари з бази
    return render(request, 'catalog.html', {'products': products})

from django.shortcuts import render
from .models import Product #

def catalog(request):
    # Цей рядок витягує всі товари з бази
    products = Product.objects.all() 
    # Ми передаємо список 'products' у ваш HTML
    return render(request, 'catalog.html', {'products': products})

from django.shortcuts import render, get_object_or_404
from .models import Product

def product_detail(request, id):
    product = get_object_or_404(Product, id=id)
    return render(request, 'product_detail.html', {'product': product})

from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from .forms import RegistrationForm  # Імпортуємо нашу форму


def register_view(request):
    if request.method == 'POST':
        # 1. ПЕРЕВІРКА: Що реально прийшло з сайту?
        print("--- ДАНІ POST ЗАПИТУ ---")
        print(request.POST) 
        
        form = RegistrationForm(request.POST)
        
        # 2. ПЕРЕВІРКА: Чому форма не зберігається?
        if form.is_valid():
            user = form.save(commit=False)
            f_name = form.cleaned_data.get('first_name', '')
            l_name = form.cleaned_data.get('last_name', '')
            user.username = f"{f_name}{l_name}"
            user.set_password(form.cleaned_data['password'])
            user.save()
            print("УСПІХ: Користувач в базі!")
            return redirect('login')
        else:
            print("--- ПОМИЛКИ ФОРМИ ---")
            print(form.errors) # ОЦЕ ВИВЕДЕ КОНКРЕТНУ ПРИЧИНУ
    else:
        form = RegistrationForm()
    
    return render(request, 'register.html', {'form': form})