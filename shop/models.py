from django.db import models
import random
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
import math

class Product(models.Model):
    CATEGORY_CHOICES = [
        ('tshirts', 'Футболки'),
        ('hoodies', 'Худі'),
        ('shoppers', 'Шопери'),
        ('hats', 'Шапки'),
    ]

    name = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='tshirts')
    article = models.CharField(max_length=10, unique=True, blank=True, verbose_name="Артикул")
    price = models.IntegerField(verbose_name="Ціна (грн)")
    discount_percentage = models.IntegerField(
        default=0, 
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="Знижка (%%)"
    )
    image = models.ImageField(upload_to='products/')
    description = models.TextField()
    composition = models.TextField()

    def save(self, *args, **kwargs):
        if not self.article:
            # Словник кодів категорій
            category_codes = {
                'hoodies': '11',
                'tshirts': '22',
                'hats': '33',
                'shoppers': '44',
            }
            
            prefix = "0000"
            cat_code = category_codes.get(self.category, "00") # 00 якщо категорія не знайдена
            
            # Генерація унікального артикула
            while True:
                random_nums = str(random.randint(10, 99)) # Два рандомні числа
                new_article = f"{prefix}{cat_code}{random_nums}"
                
                # Перевірка на унікальність
                if not Product.objects.filter(article=new_article).exists():
                    self.article = new_article
                    break
                    
        super().save(*args, **kwargs)

    @property
    def discount_price(self):
        if self.discount_percentage > 0:
            # Формула: Ціна * (1 - Знижка/100)
            new_price = float(self.price) * (1 - self.discount_percentage / 100)
            return math.ceil(new_price)
        return self.price

    def __str__(self):
        return self.name
    
# 2. Кольори 
class ProductColor(models.Model):
    COLOR_CHOICES = [
        ('black', 'Чорний'),
        ('white', 'Білий'),
        ('grey', 'Сірий'),
    ]
    product = models.ForeignKey(Product, related_name='colors', on_delete=models.CASCADE)
    color = models.CharField(max_length=20, choices=COLOR_CHOICES)

    def __str__(self):
        return f"{self.product.name} - {self.get_color_display()}"

# 3. Фотографії 
class ProductImage(models.Model):
    product_color = models.ForeignKey(ProductColor, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='products/gallery/')

    def __str__(self):
        return f"Фото для {self.product_color}"
    
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