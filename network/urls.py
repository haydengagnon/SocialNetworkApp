
from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("profile/<str:username>",views.profile, name="profile"),
    path("following/<str:username>", views.following, name="following"),
    path("profile/<str:username>/followers", views.followers, name="followers"),
    path("profile/<str:username>/following", views.followed, name="followed"),
    path("profile/<str:username>/liked", views.liked, name="liked"),

    # API Routes
    path("posts", views.create_post, name="all_posts"),
    path("posts/<int:post_id>/like", views.like_post, name="like_post"),
    path("posts/<int:post_id>/edit", views.edit_post, name="edit-post"),
    path("users/<str:username>/follow", views.follow_user, name="follow_user"),
]
