import openpyxl
from django.contrib import admin
from .models import Product
from django.http import HttpResponse
from .models import Order, OrderItem
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'article') # Ці колонки буде видно у списку# Register your models here.

# 1. Створюємо функцію без декоратора @admin.action
def export_to_excel(modeladmin, request, queryset):
    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = 'attachment; filename=orders.xlsx'
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Orders'
    
    # Заголовки
    columns = ['№ Замовлення', "Ім'я", "Прізвище", "Email", 'Телефон', 'Адреса', 'Товари', 'Сума', 'Дата']
    ws.append(columns)
    
    for order in queryset:
        items_list = []
        for item in order.items.all():  # Використовуємо related_name='items' з моделі OrderItem
            item_info = f"{item.product_name} ({item.color}, {item.size}) - {item.quantity} шт."
            items_list.append(item_info)
        
        all_items_string = "; ".join(items_list)

        ws.append([
            order.id, 
            order.first_name, 
            order.last_name,
            order.email, 
            order.phone,
            order.address,
            all_items_string, 
            float(order.total_price), # Перетворюємо Decimal у float для Excel
            order.created_at.replace(tzinfo=None) # Прибираємо часовий пояс для Excel
        ])
        
    wb.save(response)
    return response

export_to_excel.short_description = "Завантажити обрані в Excel"

# Додай цей action у свій OrderAdmin
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'first_name', 'last_name', 'total_price', 'created_at')
    actions = [export_to_excel]


# 1. Функція для експорту користувачів
def export_users_to_excel(modeladmin, request, queryset):
    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = 'attachment; filename=users_base.xlsx'
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'База Користувачів'
    
    # Заголовки для таблиці користувачів
    columns = ['ID', 'Username (Email)', "Ім'я", 'Прізвище', 'Email', 'Дата реєстрації', 'Останній вхід']
    ws.append(columns)
    
    for user in queryset:
        ws.append([
            user.id,
            user.username,
            user.first_name,
            user.last_name,
            user.email,
            user.date_joined.replace(tzinfo=None) if user.date_joined else '',
            user.last_login.replace(tzinfo=None) if user.last_login else ''
        ])
        
    wb.save(response)
    return response

export_users_to_excel.short_description = "Завантажити базу користувачів в Excel"

# 2. Перереєстрація стандартної моделі User
admin.site.unregister(User) # Спочатку прибираємо стандартну адмінку

@admin.register(User)
class MyUserAdmin(UserAdmin): # Створюємо свою на основі стандартної
    actions = [export_users_to_excel] # Додаємо нашу кнопку експорту