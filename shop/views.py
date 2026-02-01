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
    query = request.GET.get('q')
    category = request.GET.get('category')
    
    products = Product.objects.all()

    if query:
        products = products.filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        )

    if category:
        products = products.filter(category=category)

    return render(request, 'catalog.html', {
        'products': products,
        'current_category': category,
        'query': query
    })

def product_detail(request, id):
    product = get_object_or_404(Product, id=id)
    return render(request, 'product_detail.html', {'product': product})


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
            cart = data.get('cart', [])

            # Отримуємо нові поля з JSON
            comment = data.get('comment', 'Без коментаря')
            payment_method = data.get('payment_method', 'cash')
            
            # Якщо адреса приходить порожня (бо вона в профілі), 
            # можна спробувати взяти її безпосередньо з data або профілю
            address = data.get('address')
            if not address and request.user.profile:
                address = f"{request.user.profile.city}, {request.user.profile.warehouse}"

            # 1. Створюємо замовлення в базі
            order = Order.objects.create(
                first_name=data.get('first_name'),
                last_name=data.get('last_name', ''),
                email=data.get('email'),
                phone=data.get('phone'),
                address=address,
                total_price=data.get('total_price'),
                # Додай ці поля в модель Order, якщо ще не додала:
                # status='new',
                # payment_method=payment_method 
            )

            payment_text = "Карткою на сайті" if payment_method == 'card' else "Оплата при отриманні"

            # 2. Зберігаємо товари
            items_msg = ""
            for item in cart:
                OrderItem.objects.create(
                    order=order,
                    product_name=item['name'],
                    product_image=item.get('image'),
                    price=item['price'],
                    quantity=item.get('quantity', 1),
                    size=item.get('size', '—'),
                    color=item.get('color', '—')
                )
                items_msg += f"• {item['name']} [{item.get('color', '—')}, {item.get('size', '—')}] x{item.get('quantity')} — {item['price']} грн\n"

            # 3. Формуємо повне повідомлення для Telegram
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
            
            requests.post(f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage", 
                          json={"chat_id": TELEGRAM_CHAT_ID, "text": full_msg, "parse_mode": "HTML"})

            return JsonResponse({'status': 'success'})
        except Exception as e:
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