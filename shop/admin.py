import openpyxl
from django.contrib import admin
from .models import ProfileMessage
from django.http import HttpResponse, HttpResponseRedirect
from django import forms
from django.contrib.admin.helpers import ActionForm
from django.shortcuts import render
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from .models import Product, ProductColor, ProductImage, Order, OrderItem

# --- АДМІНКА ТОВАРІВ ---
def apply_10_percent_discount(modeladmin, request, queryset):
    queryset.update(discount_percentage=10)
apply_10_percent_discount.short_description = "Встановити знижку 10%% на обрані товари"

def clear_discount(modeladmin, request, queryset):
    queryset.update(discount_percentage=0)
clear_discount.short_description = "Прибрати всі знижки"

# 1. Створюємо форму, яка додасть поле "Знижка" в адмін-панель
class DiscountActionForm(ActionForm):
    custom_discount = forms.IntegerField(required=False, label="%", min_value=0, max_value=100)

# 2. Функція дії
def apply_custom_discount(modeladmin, request, queryset):
    # Отримуємо значення з нашого нового поля
    discount = request.POST.get('custom_discount')
    
    if not discount:
        modeladmin.message_user(request, "Помилка: Введіть число у поле знижки поруч із кнопкою 'Виконати'.", level='error')
        return

    # Оновлюємо товари
    updated = queryset.update(discount_percentage=int(discount))
    modeladmin.message_user(request, f"Успішно встановлено знижку {discount}% для {updated} товарів.")

apply_custom_discount.short_description = "Застосувати введену знижку (%%)"

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1 # Скільки порожніх полів для фото виводити відразу

class ProductColorInline(admin.StackedInline):
    model = ProductColor
    extra = 1
    # Це дозволить додавати фото до кольору прямо тут
    show_change_link = True

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    action_form = DiscountActionForm
    readonly_fields = ('article',)
    inlines = [ProductColorInline]
    list_display = ('name', 'price', 'discount_percentage', 'article')
    list_editable = ('discount_percentage',)
    actions = [apply_10_percent_discount, apply_custom_discount, clear_discount]

@admin.register(ProductColor)
class ProductColorAdmin(admin.ModelAdmin):
    inlines = [ProductImageInline]

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


# Спеціальна форма для введення тексту розсилки
class MassMessageForm(forms.Form):
    title = forms.CharField(max_length=255, label="Заголовок")
    text = forms.CharField(widget=forms.Textarea, label="Текст повідомлення")

@admin.register(ProfileMessage)
class ProfileMessageAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'created_at', 'is_read')
    actions = ['send_to_all'] # Додаємо дію у список

    readonly_fields = ('created_at',)

    def save_model(self, request, obj, form, change):
        # Перевіряємо, чи ми створюємо нове повідомлення
        # Якщо в заголовку на початку написати "ВСІМ: ", то розішлемо всім
        if obj.title.startswith("ВСІМ:"):
            title_clean = obj.title.replace("ВСІМ:", "").strip()
            users = User.objects.all()
            
            # Створюємо повідомлення для кожного користувача
            messages = [
                ProfileMessage(
                    user=user,
                    title=title_clean,
                    text=obj.text
                ) for user in users
            ]
            ProfileMessage.objects.bulk_create(messages)
            
            # Виводимо сповіщення в адмінці
            self.message_user(request, f"Розсилку надіслано {len(messages)} користувачам.")
        else:
            # Якщо префікса немає — просто зберігаємо для одного обраного юзера
            super().save_model(request, obj, form, change)