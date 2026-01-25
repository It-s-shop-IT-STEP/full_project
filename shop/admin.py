import openpyxl
from django.contrib import admin
from django.http import HttpResponse
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from .models import Product, Order, OrderItem

# --- АДМІНКА ТОВАРІВ ---
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'article')

# --- ЕКСПОРТ ЗАМОВЛЕНЬ В EXCEL ---
def export_to_excel(modeladmin, request, queryset):
    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = 'attachment; filename=orders.xlsx'
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Orders'
    
    columns = ['№ Замовлення', "Ім'я", "Прізвище", "Email", 'Телефон', 'Адреса', 'Товари', 'Сума', 'Дата']
    ws.append(columns)
    
    for order in queryset:
        items_list = []
        for item in order.items.all():
            item_info = f"{item.product_name} ({item.color}, {item.size}) - {item.quantity} шт."
            items_list.append(item_info)
        
        all_items_string = "; ".join(items_list)
        ws.append([
            order.id, order.first_name, order.last_name, order.email, 
            order.phone, order.address, all_items_string, 
            float(order.total_price), order.created_at.replace(tzinfo=None)
        ])
    wb.save(response)
    return response

export_to_excel.short_description = "Завантажити обрані в Excel"

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'first_name', 'last_name', 'total_price', 'created_at')
    actions = [export_to_excel]

# --- КЕРУВАННЯ КОРИСТУВАЧАМИ ---

def export_users_to_excel(modeladmin, request, queryset):
    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = 'attachment; filename=users_base.xlsx'
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'База Користувачів'
    columns = ['ID', 'Username (Email)', "Ім'я", 'Прізвище', 'Email', 'Дата реєстрації', 'Останній вхід']
    ws.append(columns)
    for user in queryset:
        ws.append([
            user.id, user.username, user.first_name, user.last_name, user.email,
            user.date_joined.replace(tzinfo=None) if user.date_joined else '',
            user.last_login.replace(tzinfo=None) if user.last_login else ''
        ])
    wb.save(response)
    return response

export_users_to_excel.short_description = "Завантажити базу користувачів в Excel"

def block_users(modeladmin, request, queryset):
    queryset.update(is_active=False)
block_users.short_description = "Заблокувати обраних користувачів"

def unblock_users(modeladmin, request, queryset):
    queryset.update(is_active=True)
unblock_users.short_description = "Розблокувати обраних користувачів"

# КРИТИЧНО ВАЖЛИВИЙ МОМЕНТ ТУТ:
try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass

@admin.register(User)
class MyUserAdmin(UserAdmin):
    actions = [export_users_to_excel, block_users, unblock_users] 
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_active', 'is_staff')
    list_filter = ('is_active', 'is_staff', 'is_superuser')