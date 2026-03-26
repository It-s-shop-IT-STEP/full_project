import json, requests
from django.http import JsonResponse
from .models import ProfileMessage
from .models import Order, OrderItem
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.template.loader import render_to_string
from django.contrib import messages
from .models import Product
from .forms import RegistrationForm
from django.db.models import Q
from .models import UserProfile
from django.db.models.functions import Lower

products = Product.objects.prefetch_related('colors__images').all()

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
    query = request.GET.get('q', '').strip()
    category = request.GET.get('category')
    products = Product.objects.all()

    if query:
        products = products.filter(
            Q(name__icontains=query) | 
            Q(description__icontains=query) |
            Q(name__contains=query.capitalize()) | # На випадок "худі" -> "Худі"
            Q(name__contains=query.lower())        # На випадок "Худі" -> "худі"
        ).distinct()
    if category:
        products = products.filter(category=category)

    # Додаємо AJAX-гілку для живого пошуку
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        # Передаємо товари в окремий шаблон-фрагмент (тільки картки)
        html = render_to_string('includes/product_list_fragment.html', {'products': products}, request=request)
        return JsonResponse({'html': html})

    return render(request, 'catalog.html', {
        'products': products,
        'current_category': category,
        'query': query
    })


# -------------------------
# ПРОФІЛЬ ТА ЗАМОВЛЕННЯ
# -------------------------

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
            cart_from_js = data.get('cart', [])
            total_verified_price = 0
            
            # 1. Створюємо замовлення СПОЧАТКУ (щоб мати order.id)
            # Отримуємо коментар, щоб не було помилки NameError
            comment = data.get('comment', '—')
            payment_method = data.get('payment_method', 'cash')
            payment_text = "Карткою на сайті" if payment_method == 'card' else "Оплата при отриманні"

            order = Order.objects.create(
                first_name=data.get('first_name'),
                last_name=data.get('last_name', ''),
                email=data.get('email'),
                phone=data.get('phone'),
                address=data.get('address'),
                total_price=0, # Оновимо пізніше
                payment_method=payment_method
            )

            items_msg = ""
            
            # 2. Цикл по товарах з кошика
            for item in cart_from_js:
                # Отримуємо чисте ID (виправляємо помилку "expected a number")
                raw_id = str(item.get('id'))
                clean_id = raw_id.split('-')[0]
            

                try:
                    # Тепер перетворюємо чистий ID на число
                    product_id = int(clean_id)
                    product_db = get_object_or_404(Product, id=product_id)
                except (ValueError, IndexError):
                    return JsonResponse({'status': 'error', 'message': f'Невірний формат ID: {raw_id}'}, status=400)

                actual_price = product_db.discount_price
                qty = int(item.get('quantity', 1))
                total_verified_price += actual_price * qty

                # Зберігаємо OrderItem (використовуємо дані з БД для ціни)
                OrderItem.objects.create(
                    order=order,
                    product_name=product_db.name,
                    product_image=item.get('image'),
                    price=actual_price,
                    quantity=qty,
                    size=item.get('size', '—'),
                    color=item.get('color', '—')
                )
                
                items_msg += f"• {product_db.name} [{item.get('color', '—')}, {item.get('size', '—')}] x{qty} — {actual_price} грн\n"

            # 3. Оновлюємо фінальну ціну в замовленні
            order.total_price = total_verified_price
            order.save()

            # 4. Формуємо повідомлення для Telegram
            full_msg = (
                f"📦 <b>ЗАМОВЛЕННЯ №{order.id}</b>\n\n"
                f"👤 Клієнт: {order.first_name} {order.last_name}\n"
                f"📞 Тел: {order.phone}\n"
                f"📍 Адреса: {order.address}\n"
                f"💳 Оплата: {payment_text}\n"
                f"💬 Коментар: {comment}\n\n"
                f"<b>Товари:</b>\n{items_msg}\n"
                f"💰 <b>РАЗОМ: {order.total_price} грн</b>"
            )
            
            # Вставте ваші реальні токени сюди
            requests.post(f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage", 
                          json={"chat_id": TELEGRAM_CHAT_ID, "text": full_msg, "parse_mode": "HTML"})

            return JsonResponse({'status': 'success'})
        except Exception as e:
            # Виводимо помилку в консоль сервера для відладки
            print(f"Error in checkout: {e}")
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

    return render(request, 'checkout.html')

@login_required
def update_profile(request):
    if request.method == 'POST':
        user = request.user
        
        # 1. Оновлюємо базові дані користувача
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        email = request.POST.get('email')

        if first_name: user.first_name = first_name
        if last_name: user.last_name = last_name
        if email: 
            user.email = email
            user.username = email
        user.save()

        # 2. Безпечно оновлюємо дані доставки
        # Використовуємо get_or_create, щоб уникнути помилки 500
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        city = request.POST.get('city')
        warehouse = request.POST.get('warehouse')

        if city: profile.city = city
        if warehouse: profile.warehouse = warehouse
        profile.save()

        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'}, status=400)

def mark_messages_as_read(request):
    if request.user.is_authenticated:
        # Знаходимо всі непрочитані повідомлення цього користувача і позначаємо їх
        ProfileMessage.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return JsonResponse({'status': 'ok'})
    return JsonResponse({'status': 'error'}, status=403)

def profile_view(request):
    # Отримуємо всі замовлення поточного користувача, від нових до старих
    orders = Order.objects.filter(email=request.user.email).order_by('-created_at')
    return render(request, 'profile.html', {'orders': orders})

def product_detail(request, id):
    product = get_object_or_404(Product, id=id)
    return render(request, 'product_detail.html', {'product': product})

def get_cart_prices(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        product_ids = data.get('ids', [])
        
        # Отримуємо актуальні ціни для списку ID
        products = Product.objects.filter(id__in=product_ids)
        prices_map = {p.id: p.discount_price for p in products}
        
        return JsonResponse({'prices': prices_map})
    return JsonResponse({'status': 'error'}, status=400)