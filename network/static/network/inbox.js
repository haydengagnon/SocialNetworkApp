document.addEventListener('DOMContentLoaded', function() {
    function getCSRFToken() {
        return window.CSRF_TOKEN;
    }
    if (auth == "True") {
        if (document.querySelector('#new-post-form')) {
            document.querySelector('#new-post-form').onsubmit = function(event) {

                const content = document.querySelector('#post-content').value;

                fetch('/posts', {
                    method: 'POST',
                    body: JSON.stringify({
                        content: content
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCSRFToken()
                    }
                })
                .then(response => response.json())
                .then(result => {
                    document.querySelector('#post-content').value = '';

                    const postsView = document.querySelector('#all-posts');
                    const postDiv = document.createElement('div');
                    postDiv.className = 'post';

                    postDiv.innerHTML = `
                        <h2 id="post-user">Posted by: <a href="/profile/${result.user}">${result.user}</a></h2><hr>
                        <h4 class="posted-content" id="post-content-${result.id}">${result.content}</h4>
                        <div class="editing-buttons" id="editing-buttons-${result.id}"></div>
                        <p id="post-timestamp">
                            Post on: ${result.timestamp}
                            <button class="btn btn-outline-secondary edit-btn" data-post-id="${ result.id }">Edit</button>
                            <button class="btn btn-outline-primary like-btn" data-post-id="${ result.id }">
                            Like <span class="like-count">${result.like_count}</span>
                            </button>
                        </p>
                    `;
                    postsView.prepend(postDiv);

                    const likeButton = postDiv.querySelector('.like-btn');
                    likeButton.addEventListener('click', function() {
                        const postId = likeButton.dataset.postId;

                        fetch(`/posts/${postId}/like`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': getCSRFToken()
                            }
                        })
                        .then(response => response.json())
                        .then(data => {
                            const likeCount = likeButton.querySelector('.like-count');
                            likeCount.textContent = data.like_count;

                            likeButton.classList.toggle('btn-primary', result.liked);
                            likeButton.classList.toggle('btn-outline-primary', !result.liked);
                            
                        })
                        .catch(error => console.log(error));
                    });

                    const editButton = postDiv.querySelector('.edit-btn');
                    editButton.addEventListener('click', function(event) {
                        const postId = this.dataset.postId;
                        const postContent = document.querySelector(`#post-content-${postId}`);
                        const editButtons = document.querySelector(`#editing-buttons-${postId}`);
        
                        const originalContent = postContent.textContent.trim();
                        this.dataset.originalContent = originalContent;
        
                        postContent.innerHTML = `<textarea class="form-control" id="edit-content-${postId}">${originalContent}</textarea>`;
        
                        editButtons.innerHTML = `
                            <button class="btn btn-success save-btn" data-post-id="${postId}">Save</button>
                            <button class="btn btn-danger cancel-btn" data-post-id="${postId}">Cancel</button>
                        `;
        
                        document.querySelectorAll('.edit-btn').forEach(button => {
                            button.style.display = 'none';
                        })
                    })

                    document.addEventListener('click', function(event) {
                        if (event.target.classList.contains('save-btn')) {
                            const postId = event.target.dataset.postId;
                            const editedContent = document.querySelector(`#edit-content-${postId}`).value.trim();
                
                            fetch(`/posts/${postId}/edit`, {
                                method: 'PUT',
                                body: JSON.stringify({
                                    content: editedContent
                                }),
                                headers: {
                                    'content-type': 'application/json',
                                    'X-CSRFToken': getCSRFToken()
                                }
                            })
                            .then(response => response.json())
                            .then(result => {
                                const postContent = document.querySelector(`#post-content-${postId}`);
                                const editButtons = document.querySelector(`#editing-buttons-${postId}`);
                
                                postContent.innerHTML = `<h4 class="posted-content" id="post-content-${postId}">${result.content.trim()}</h4>`;
                
                                editButtons.innerHTML = `<div class="editing-buttons" id="editing-buttons-${postId}"></div>`;
                
                                document.querySelectorAll('.edit-btn').forEach(button => {
                                    button.style.display = 'block';
                                })
                            })
                            .catch(error => console.log('Error:', error));
                        }
                    })

                    document.addEventListener('click', function(event) {
                        if (event.target.classList.contains('cancel-btn')) {
                            const postId = event.target.dataset.postId;
                            const postContent = document.querySelector(`#post-content-${postId}`);
                            const editButtons = document.querySelector(`#editing-buttons-${postId}`);
                
                            const originalContent = document.querySelector(`#edit-content-${postId}`).textContent.trim();
                
                            postContent.innerHTML = `<h4 class="posted-content" id="post-content-${postId}">${originalContent}</h4>`;
                
                            editButtons.innerHTML = `<div class="editing-buttons" id="editing-buttons-${postId}"></div>`;
                
                            document.querySelectorAll('.edit-btn').forEach(button => {
                                button.style.display = 'block';
                            })
                        }
                    })
                })
                .catch(error => console.log(error));
                return false
            };
        }
    }
    
    if (auth == "True") {
        document.querySelectorAll('.like-btn').forEach(button => {
            button.onclick = function() {
                const postId = this.dataset.postId;
                const likeButton = this;

                fetch(`/posts/${postId}/like`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCSRFToken()
                    },
                    body: JSON.stringify({})
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        const likeCountSpan = likeButton.querySelector('.like-count');
                        likeCountSpan.innerText = result.like_count;

                        likeButton.classList.toggle('btn-primary', result.liked);
                        likeButton.classList.toggle('btn-outline-primary', !result.liked);
                    }
                    else {
                        console.error('Error liking post:', result.error)
                    }
                })
                .catch(error => console.log('Fetch error:', error));
            };
        });
    }

    if (auth == "True") {
        document.querySelectorAll('.follow-btn').forEach(button => {
            button.onclick = function() {
                const username = this.dataset.username;
                const followButton = this;

                fetch(`/users/${username}/follow`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCSRFToken(),
                    },
                    body: JSON.stringify({})
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        if (result.following == true) {
                            followButton.innerHTML = `
                                Unfollow <span class="follower-count">${ result.following_count }</span>
                            `;
                        }
                        else {
                            followButton.innerHTML = `
                                Follow <span class="follower-count">${ result.following_count }</span>
                            `;
                        }
                        followButton.classList.toggle('btn-primary', result.following);
                        followButton.classList.toggle('btn-outline-primary', !result.following);
                    } 
                    else {
                        console.error('Error following user:', result.error);
                    }
                })
                .catch(error => console.error('Fetch error:', error));
            };
        });
    }

    if (auth == "True") {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function(event) {
                const postId = this.dataset.postId;
                const postContent = document.querySelector(`#post-content-${postId}`);
                const editButtons = document.querySelector(`#editing-buttons-${postId}`);

                const originalContent = postContent.textContent.trim();
                this.dataset.originalContent = originalContent;

                postContent.innerHTML = `<textarea class="form-control" id="edit-content-${postId}">${originalContent}</textarea>`;

                editButtons.innerHTML = `
                    <button class="btn btn-success save-btn" data-post-id="${postId}">Save</button>
                    <button class="btn btn-danger cancel-btn" data-post-id="${postId}">Cancel</button>
                `;

                document.querySelectorAll('.edit-btn').forEach(button => {
                    button.style.display = 'none';
                })
            })
        })
    }

    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('save-btn')) {
            const postId = event.target.dataset.postId;
            const editedContent = document.querySelector(`#edit-content-${postId}`).value.trim();

            fetch(`/posts/${postId}/edit`, {
                method: 'PUT',
                body: JSON.stringify({
                    content: editedContent
                }),
                headers: {
                    'content-type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                }
            })
            .then(response => response.json())
            .then(result => {
                const postContent = document.querySelector(`#post-content-${postId}`);
                const editButtons = document.querySelector(`#editing-buttons-${postId}`);

                postContent.innerHTML = `<h4 class="posted-content" id="post-content-${postId}">${result.content.trim()}</h4>`;

                editButtons.innerHTML = `<div class="editing-buttons" id="editing-buttons-${postId}"></div>`;

                document.querySelectorAll('.edit-btn').forEach(button => {
                    button.style.display = 'block';
                })
            })
            .catch(error => console.log('Error:', error));
        }
    })

    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('cancel-btn')) {
            const postId = event.target.dataset.postId;
            const postContent = document.querySelector(`#post-content-${postId}`);
            const editButtons = document.querySelector(`#editing-buttons-${postId}`);

            const originalContent = document.querySelector(`#edit-content-${postId}`).textContent.trim();

            postContent.innerHTML = `<h4 class="posted-content" id="post-content-{ post.id }}">${originalContent}</h4>`;

            editButtons.innerHTML = `<div class="editing-buttons" id="editing-buttons-${postId}"></div>`;

            document.querySelectorAll('.edit-btn').forEach(button => {
                button.style.display = 'block';
            })
        }
    })
});