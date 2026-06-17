from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Subscription

class UserAdmin(BaseUserAdmin):
    ordering = ['email']
    list_display = ['email', 'firstName', 'lastName', 'role', 'isVerified', 'isBlocked']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('firstName', 'lastName', 'bio', 'website', 'avatar')}),
        ('Permissions', {'fields': ('role', 'isVerified', 'isBlocked', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Tokens', {'fields': ('tokenUsed', 'totalToken')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password', 'firstName', 'lastName')}
        ),
    )
    search_fields = ['email', 'firstName', 'lastName']
    filter_horizontal = ('groups', 'user_permissions',)

admin.site.register(User, UserAdmin)
admin.site.register(Subscription)
