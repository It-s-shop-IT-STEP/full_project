from django import forms
from django.contrib.auth.models import User

class RegistrationForm(forms.ModelForm):
    # Додаємо класи для стилізації, щоб вони відповідали вашому HTML
    password = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': ' '}))
    confirm_password = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': ' '}))

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email']

    def clean_email(self):
        """Перевірка, чи не зайнятий email іншим користувачем"""
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError("Користувач з такою електронною поштою вже зареєстрований.")
        return email

    def clean(self):
        """Загальна перевірка форми (збіг паролів)"""
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        confirm_password = cleaned_data.get("confirm_password")

        if password and confirm_password and password != confirm_password:
            # Додаємо помилку конкретно до поля confirm_password
            self.add_error('confirm_password', "Паролі не збігаються!")
        
        return cleaned_data