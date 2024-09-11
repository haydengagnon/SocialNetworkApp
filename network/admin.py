from django.contrib import admin
from .models import Post, User, Like, Follow

# Register your models here.
@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("user", "timestamp")

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "email")

@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ("follower", "following")

@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ("user", "post")