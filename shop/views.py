import json, requests
from django.http import JsonResponse
from .models import Order, OrderItem
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from .models import Product
from .forms import RegistrationForm

# -------------------------
# ГОЛОВНІ СТОРІНКИ
# -------------------------

def main_page(request):
    return render(request, 'main.html')


def welcome(request):
    return render(request, 'welcome.html')


# -------------------------
# АВТОРИЗАЦІЯ ТА РЕЄСТРАЦІЯ
# -------------------------

def login_view(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        # Використовуємо email як username для authenticate
        user = authenticate(request, username=email, password=password)

        if user is not None:
            login(request, user)
            return redirect('main') 
        else:
            messages.error(request, "Невірний email або пароль.")
            
    return render(request, 'login.html')


def logout_view(request):
    logout(request)
    return redirect('login')


def register_view(request):
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            email = form.cleaned_data.get('email')
            user.username = email 
            user.email = email
            user.set_password(form.cleaned_data['password'])
            user.save()

            messages.success(request, 'Акаунт створено успішно!')
            return redirect('login')
        else:
            messages.error(request, 'Помилка реєстрації. Перевірте дані.')
    else:
        form = RegistrationForm()
    return render(request, 'register.html', {'form': form})


# -------------------------
# КАТАЛОГ ТОВАРІВ (З ФІЛЬТРАЦІЄЮ)
# -------------------------

def catalog(request):
    # Отримуємо категорію з посилання, наприклад: /catalog/?category=hoodies
    category_slug = request.GET.get('category')
    
    if category_slug:
        # Фільтруємо товари за категорією
        products = Product.objects.filter(category=category_slug)
    else:
        # Якщо категорія не обрана, показуємо всі товари
        products = Product.objects.all()

    context = {
        'products': products,
        'current_category': category_slug  # Передаємо в HTML, щоб виділити активну кнопку
    }
    return render(request, 'catalog.html', context)


def product_detail(request, id):
    product = get_object_or_404(Product, id=id)
    return render(request, 'product_detail.html', {'product': product})


# -------------------------
# ПРОФІЛЬ ТА ЗАМОВЛЕННЯ
# -------------------------

@login_required(login_url='login')
def profile_view(request):
    return render(request, 'profile.html', {'user': request.user})


@login_required(login_url='login')
def checkout_view(request):
    # Сторінка кошика перед фінальним замовленням
    return render(request, 'checkout.html')


@login_required(login_url='login')
def order_view(request):
    # Сторінка з формою Нової Пошти та Telegram-ботом
    return render(request, 'order.html', {'user': request.user})

TELEGRAM_BOT_TOKEN = '8312173871:AAEjQGFJlQ6D3SJMPpTJsDHhbKqDle2dOhY'
TELEGRAM_CHAT_ID = '628064779'

@login_required(login_url='login')
def checkout_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            cart = data.get('cart', [])

            # 1. Створюємо замовлення в базі
            order = Order.objects.create(
                first_name=data.get('first_name'),
                last_name=data.get('last_name', ''),
                email=data.get('email'),
                phone=data.get('phone'),
                address=data.get('address'),
                total_price=data.get('total_price')
            )

            # 2. Зберігаємо товари та готуємо текст для бота
            items_msg = ""
            for item in cart:
                OrderItem.objects.create(
                    order=order,
                    product_name=item['name'],
                    price=item['price'],
                    quantity=item.get('quantity', 1),
                    size=item.get('size', '—'),
                    color=item.get('color', '—')
                )
                items_msg += f"• {item['name']} [{item.get('color')}, {item.get('size')}] x{item.get('quantity')} — {item['price']} грн\n"

            # 3. Відправка в Telegram через сервер
            full_msg = (
                f"📦 <b>ЗАМОВЛЕННЯ №{order.id}</b>\n"
                f"👤 Клієнт: {order.first_name} {order.last_name}\n"
                f"📞 Тел: {order.phone}\n"
                f"📍 Адреса: {order.address}\n\n"
                f"<b>Товари:</b>\n{items_msg}\n"
                f"💰 <b>РАЗОМ: {order.total_price} грн</b>"
            )
            
            requests.post(f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage", 
                          json={"chat_id": TELEGRAM_CHAT_ID, "text": full_msg, "parse_mode": "HTML"})

            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

    return render(request, 'checkout.html')