import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from .models import User, Post, Like, Follow


def index(request):
    posts = Post.objects.all().order_by('-timestamp')

    paginator = Paginator(posts, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    if(request.user.is_authenticated):
        liked_posts = Like.objects.filter(user=request.user, post__in=posts).values_list('post_id', flat=True)
        return render(request, "network/index.html", {
            "posts": posts,
            "liked_posts": liked_posts,
            "page_obj": page_obj
        })
    else:
        return render(request, "network/index.html", {
            "posts": posts,
            "page_obj": page_obj
        })


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

@login_required
def create_post(request):
    if request.method == "POST":
        data = json.loads(request.body)
        content = data.get("content", "")

        if content:
            post = Post(user=request.user, content=content)
            post.save()
            return JsonResponse({
                "id": post.id,
                "user": post.user.username,
                "content": post.content,
                "timestamp": post.timestamp.strftime("%b %d, %Y, %I:%M %p"),
                "like_count": post.like_count()
            }, status=201)
        else:
            return JsonResponse({"message": "Cannot be empty."}, status=400)
        
    return JsonResponse({"error": "POST request required."}, status=400)

def profile(request, username):
    user = get_object_or_404(User, username=username)

    posts = Post.objects.filter(user=user).order_by('-timestamp')
    follower_count = user.followers.count()

    paginator = Paginator(posts, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)    

    is_following = False
    if request.user.is_authenticated:
        is_following = Follow.objects.filter(follower=request.user, following=user).exists()
        liked_posts = Like.objects.filter(user=request.user, post__in=posts).values_list('post_id', flat=True)

        return render(request, "network/profile.html", {
            "posts": posts,
            "post_user": user,
            "follower_count": follower_count,
            "liked_posts": liked_posts,
            "is_following": is_following,
            "page_obj": page_obj
        })
    else:
        return render(request, "network/profile.html", {
            "posts": posts,
            "post_user": user,
            "follower_count": follower_count,
            "page_obj": page_obj
        })

@login_required
def like_post(request, post_id):
    if request.method == "POST":
        post = get_object_or_404(Post, id=post_id)
        user = request.user

        like, created = Like.objects.get_or_create(user=user, post=post)
        
        if not created:
            like.delete()
            liked = False
        else:
            liked = True

        return JsonResponse({
            'success': True,
            'liked': liked,
            'like_count': post.likes.count()
        })
    return JsonResponse({'error': 'POST request required.'}, status=400)

@login_required
def following(request, username):
    user = request.user
    following = Follow.objects.filter(follower=user).values_list('following', flat=True)

    posts = Post.objects.filter(user__in=following).order_by('-timestamp')

    paginator = Paginator(posts, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    if (request.user.is_authenticated):
        liked_posts = Like.objects.filter(user=request.user, post__in=posts).values_list('post_id', flat=True)

        return render(request, "network/following.html", {
            "posts": posts,
            "post_user": user,
            "liked_posts": liked_posts,
            "page_obj": page_obj
        })
    else:
        return render(request, "network/following.html", {
            "posts": posts,
            "post_user": user,
            "page_obj": page_obj
        })

@login_required
def follow_user(request, username):
    if request.method == "POST":
        user_to_follow = get_object_or_404(User, username=username)
        user = request.user

        if user != user_to_follow:
            follow, created = Follow.objects.get_or_create(follower=user, following=user_to_follow)
            if not created:
                follow.delete()
                following = False
            else:
                following = True

            follower_count = user_to_follow.followers.count()

            return JsonResponse({
                'success': True,
                'following': following,
                'following_count':follower_count
            }, status=200)
    return JsonResponse({'error': 'POST request required.'}, status=400)

def followers(request, username):
    profile = get_object_or_404(User, username=username)
    followers = Follow.objects.filter(following=profile).select_related('follower')

    return render(request, "network/followers.html", {
        "profile": profile,
        "followers": followers
    })

def followed(request, username):
    profile = get_object_or_404(User, username=username)
    followers = Follow.objects.filter(follower=profile).select_related('following')

    return render(request, "network/followed.html", {
        "profile": profile,
        "followers": followers
    })

def liked(request, username):
    profile = get_object_or_404(User, username=username)
    
    liked = Like.objects.filter(user=profile).values_list('post', flat=True)
    posts = Post.objects.filter(id__in=liked).order_by('-timestamp')

    paginator = Paginator(posts, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    if (request.user.is_authenticated):
        liked_posts = Like.objects.filter(user=request.user, post__in=posts).values_list('post_id', flat=True)

        return render(request, "network/liked.html", {
            "profile": profile,
            "posts": posts,
            "liked_posts": liked_posts,
            "page_obj": page_obj
        })
    else:
        return render(request, "network/liked.html", {
            "profile": profile,
            "posts": posts,
            "page_obj": page_obj
        })

@csrf_exempt
@login_required
def edit_post(request, post_id):
    if request.method == "PUT":
        try:
            post = Post.objects.get(id=post_id, user=request.user)
            data = json.loads(request.body)
            post.content = data.get("content")
            post.save()
            return JsonResponse({"content": post.content}, status=200)
        except Post.DoesNotExist:
            return JsonResponse({"error": "Post not found or you're not authorized to edit"}, status=400)
    else:
        return JsonResponse({"error": "PUT request required"}, status=400)