from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=255)
    article = models.CharField(max_length=50, default="00000031425")
    price = models.IntegerField()
    image = models.ImageField(upload_to='products/')
    description = models.TextField()
    composition = models.TextField()

    def __str__(self):
        return self.name
