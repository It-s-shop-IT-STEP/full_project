from django.db import models
from django.contrib.auth.models import User

class Product(models.Model):
    CATEGORY_CHOICES = [
        ('tshirts', 'Футболки'),
        ('hoodies', 'Худі'),
        ('shoppers', 'Шопери'),
        ('hats', 'Шапки'),
    ]

    name = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='tshirts')
    article = models.CharField(max_length=50, default="00000031425")
    price = models.IntegerField()
    image = models.ImageField(upload_to='products/')
    description = models.TextField()
    composition = models.TextField()

    def __str__(self):
        return self.name
    
class Order(models.Model):
    # Хто замовив
    first_name = models.CharField(max_length=50, verbose_name="Ім'я")
    last_name = models.CharField(max_length=50, verbose_name="Прізвище")
    email = models.EmailField(verbose_name="Email")
    phone = models.CharField(max_length=20, verbose_name="Телефон")
    address = models.TextField(verbose_name="Адреса доставки")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата замовлення")
    total_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Загальна вартість")
    is_paid = models.BooleanField(default=False, verbose_name="Оплачено")

    class Meta:
        verbose_name = "Замовлення"
        verbose_name_plural = "Замовлення"

    def __str__(self):
        return f"Замовлення №{self.id} - {self.first_name}"

class OrderItem(models.Model):
    # Що замовив і в якій кількості
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product_name = models.CharField(max_length=255) # Зберігаємо назву на випадок видалення товару
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    size = models.CharField(max_length=10, blank=True, null=True)
    color = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.product_name} ({self.quantity} шт.)"