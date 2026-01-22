from django.db import models

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