// javascript functionality civicConnect //
class CivicConnect {
  constructor() {
    this.registeredUsers = JSON.parse(localStorage.getItem("registeredUsers")) || []
    this.currentUser = this.getCurrentUser()
    this.currentPage = "login" // Start with login page
    this.isAuthenticated = this.checkAuthStatus() // Check if user is already authenticated
    this.feedManager = null
    this.init()
  }

  init() {
    this.setupEventListeners()
    this.setupNavigation()
    this.setupAuthForms() // Add authentication form handlers
    this.setupThemeToggle() // Setup theme toggle

    // Only load app content if authenticated
    if (this.isAuthenticated) {
      this.loadPosts()
      this.showEmergencyAlert()
      this.setupFeedManager() // Instantiate FeedManager here
      this.setupProfileManager()
      this.setupSettingsManager()
      this.showPage("home")
    } else {
      this.showPage("login")
    }
  }

  setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById("mobileMenuButton")
    const mobileMenu = document.getElementById("mobileMenu")
    if (mobileMenuButton && mobileMenu) {
      mobileMenuButton.addEventListener("click", () => {
        mobileMenu.classList.toggle("hidden")
      })
    }

    // User dropdown toggle
    const userMenuButton = document.getElementById("userMenuButton")
    const userDropdown = document.getElementById("userDropdown")
    if (userMenuButton && userDropdown) {
      userMenuButton.addEventListener("click", (e) => {
        e.stopPropagation()
        userDropdown.classList.toggle("hidden")
      })

      document.addEventListener("click", () => {
        userDropdown.classList.add("hidden")
      })
    }

    // Search functionality
    const searchInput = document.getElementById("searchInput")
    if (searchInput) {
      searchInput.addEventListener("input", this.debounce(this.handleSearch.bind(this), 300))
    }

    // Create post modal
    const postContent = document.getElementById("postContent")
    if (postContent) {
      postContent.addEventListener("input", this.updateCharCount.bind(this))
    }

    // Close modal when clicking outside
    const createPostModal = document.getElementById("createPostModal")
    if (createPostModal) {
      createPostModal.addEventListener("click", (e) => {
        if (e.target === createPostModal) {
          this.closeCreatePost()
        }
      })
    }
  }

  setupNavigation() {
    // Update active states for navigation
    const updateActiveNav = (page) => {
      // Update mobile navigation
      const mobileNavLinks = document.querySelectorAll("#mobileMenu a")
      mobileNavLinks.forEach((link) => {
        link.classList.remove("text-blue-600", "dark:text-blue-400", "bg-blue-50", "dark:bg-blue-900/20")
        link.classList.add("text-gray-600", "dark:text-gray-300")
      })

      // Update bottom navigation
      const bottomNavButtons = document.querySelectorAll("#bottomNav button")
      bottomNavButtons.forEach((btn) => {
        btn.classList.remove("text-blue-600", "dark:text-blue-400")
        btn.classList.add("text-gray-500", "dark:text-gray-400")
      })

      // NEW: Update desktop navigation
      const desktopNavLinks = document.querySelectorAll("#desktopNav a")
      desktopNavLinks.forEach((link) => {
        link.classList.remove("text-blue-600", "dark:text-blue-400", "border-b-2", "border-blue-600") // Remove active styles
        link.classList.add("text-gray-600", "dark:text-gray-300") // Add default styles
      })

      // Set active state for current page
      const activeLink = document.querySelector(`[onclick*="showPage('${page}')"]`) // Use * to match partial string
      if (activeLink) {
        activeLink.classList.remove("text-gray-600", "dark:text-gray-300", "text-gray-500", "dark:text-gray-400")
        activeLink.classList.add("text-blue-600", "dark:text-blue-400")

        if (activeLink.closest("#mobileMenu")) {
          activeLink.classList.add("bg-blue-50", "dark:bg-blue-900/20")
        } else if (activeLink.closest("#desktopNav")) {
          // Apply desktop specific active style
          activeLink.classList.add("border-b-2", "border-blue-600")
        }
      }
    }

    this.updateActiveNav = updateActiveNav
  }

  showPage(page) {
    // Hide all pages
    const pages = document.querySelectorAll(".page-content")
    pages.forEach((p) => p.classList.add("hidden"))

    // Show selected page
    const targetPage = document.getElementById(`${page}Page`)
    if (targetPage) {
      targetPage.classList.remove("hidden")
      this.currentPage = page
      this.updateActiveNav(page)

      // Close mobile menu
      const mobileMenu = document.getElementById("mobileMenu")
      if (mobileMenu) {
        mobileMenu.classList.add("hidden")
      }

      // NEW: Control visibility of header and bottom navigation
      const mainHeader = document.getElementById("mainHeader")
      const bottomNav = document.getElementById("bottomNav")

      if (page === "login" || page === "signup") {
        if (mainHeader) mainHeader.classList.add("hidden")
        if (bottomNav) bottomNav.classList.add("hidden")
      } else {
        if (mainHeader) mainHeader.classList.remove("hidden")
        if (bottomNav) bottomNav.classList.remove("hidden")
      }

      // Load page-specific content
      if (page === "profile") {
        this.loadProfileData()
      } else if (page === "settings") {
        this.loadSettingsData()
      } else if (page === "schemes") {
        this.loadSchemesData()
      } else if (page === "jobs") {
        this.loadJobsData()
      }
    }
  }

  getCurrentUser() {
    // Try to get from sessionStorage first (for non-remembered sessions)
    let user = sessionStorage.getItem("currentUser")
    if (user) {
      return JSON.parse(user)
    }

    // Fallback to localStorage (for remembered sessions)
    user = localStorage.getItem("currentUser")
    if (user) {
      return JSON.parse(user)
    }

    // Default demo user if no user is found
    return {
      id: 1,
      name: "John Doe",
      username: "johndoe",
      email: "john.doe@example.com",
      bio: "Passionate about community engagement and making a difference in local governance.",
      location: "Mumbai, India",
      joinDate: "March 2024",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
      isVerified: false,
    }
  }

  async loadPosts() {
    try {
      const loadingSpinner = document.getElementById("loadingSpinner")
      if (loadingSpinner) loadingSpinner.style.display = "flex"

      // Fetch posts from JSONPlaceholder and random images
      const [postsResponse, usersResponse] = await Promise.all([
        fetch("https://jsonplaceholder.typicode.com/posts?_limit=10"),
        fetch("https://jsonplaceholder.typicode.com/users?_limit=10"),
      ])

      const posts = await postsResponse.json()
      const users = await usersResponse.json()

      // Create mock posts with real data
      this.posts = posts.map((post, index) => ({
        id: post.id,
        user: {
          id: users[index % users.length].id,
          name: users[index % users.length].name,
          username: users[index % users.length].username.toLowerCase(),
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${users[index % users.length].username}`,
          isVerified: Math.random() > 0.7,
        },
        content: post.title,
        image: `https://picsum.photos/600/400?random=${post.id}`,
        likes: Math.floor(Math.random() * 500) + 10,
        comments: Math.floor(Math.random() * 50) + 1,
        shares: Math.floor(Math.random() * 20),
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 7), // Random time in last 7 days
        liked: false,
        saved: false,
      }))

      this.renderPosts()
    } catch (error) {
      console.error("Error loading posts:", error)
      this.showError("Failed to load posts. Please try again.")
    } finally {
      const loadingSpinner = document.getElementById("loadingSpinner")
      if (loadingSpinner) loadingSpinner.style.display = "none"
    }
  }

  renderPosts() {
    const container = document.getElementById("postsContainer")
    if (!container) return

    container.innerHTML = ""

    this.posts.forEach((post) => {
      const postElement = this.createPostElement(post)
      container.appendChild(postElement)
    })
  }

  createPostElement(post) {
    const postDiv = document.createElement("div")
    postDiv.className =
      "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 post-card"

    const timeAgo = this.getTimeAgo(post.timestamp)
    const verifiedBadge = post.user.isVerified
      ? '<svg class="w-4 h-4 text-blue-500 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
      : ""

    postDiv.innerHTML = `
          <!-- Post Header -->
          <div class="flex items-center justify-between p-4">
              <div class="flex items-center space-x-3">
                  <img src="${post.user.avatar}" alt="${post.user.name}" class="w-10 h-10 rounded-full">
                  <div>
                      <div class="flex items-center">
                          <h3 class="font-semibold text-gray-900 dark:text-white">${post.user.name}</h3>
                          ${verifiedBadge}
                      </div>
                      <p class="text-sm text-gray-500 dark:text-gray-400">@${post.user.username} • ${timeAgo}</p>
                  </div>
              </div>
              <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                  </svg>
              </button>
          </div>

          <!-- Post Content -->
          <div class="px-4 pb-3">
              <p class="text-gray-900 dark:text-white">${post.content}</p>
          </div>

          <!-- Post Image -->
          <div class="relative">
              <img src="${post.image}" alt="Post image" class="w-full h-64 object-cover cursor-pointer" 
                   onclick="openImageModal('${post.image}')" loading="lazy">
          </div>

          <!-- Post Actions -->
          <div class="p-4">
              <div class="flex items-center space-x-6">
                  <button onclick="toggleLike(${post.id})" class="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors">
                      <svg class="w-5 h-5 ${post.liked ? "text-red-500 fill-current" : ""}" fill="${post.liked ? "currentColor" : "none"}" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                      </svg>
                      <span>${post.likes}</span>
                  </button>
                  <button onclick="openComments(${post.id})" class="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                      </svg>
                      <span>${post.comments}</span>
                  </button>
                  <button onclick="sharePost(${post.id})" class="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                      </svg>
                      <span>${post.shares}</span>
                  </button>
              </div>
              <button onclick="toggleSave(${post.id})" class="text-gray-500 hover:text-yellow-500 transition-colors">
                  <svg class="w-5 h-5 ${post.saved ? "text-yellow-500 fill-current" : ""}" fill="${post.saved ? "currentColor" : "none"}" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                  </svg>
              </button>
          </div>
      `

    return postDiv
  }

  getTimeAgo(timestamp) {
    const now = new Date()
    const diff = now - new Date(timestamp)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    return `${days}d`
  }

  toggleLike(postId) {
    const post = this.posts.find((p) => p.id === postId)
    if (post) {
      post.liked = !post.liked
      post.likes += post.liked ? 1 : -1
      this.renderPosts()
    }
  }

  toggleSave(postId) {
    const post = this.posts.find((p) => p.id === postId)
    if (post) {
      post.saved = !post.saved
      this.renderPosts()
    }
  }

  sharePost(postId) {
    if (navigator.share) {
      navigator.share({
        title: "AlucardConnect Post",
        text: "Check out this post on AlucardConnect",
        url: window.location.href,
      })
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href)
      this.showNotification("Link copied to clipboard!")
    }
  }

  openComments(postId) {
    // Implementation for comments modal
    console.log("Opening comments for post:", postId)
    this.showNotification("Comments feature coming soon!", "info")
  }

  openImageModal(imageSrc) {
    // Implementation for image modal
    console.log("Opening image:", imageSrc)
    this.showNotification("Image viewer coming soon!", "info")
  }

  createPost() {
    const modal = document.getElementById("createPostModal")
    if (modal) {
      modal.classList.remove("hidden")
      document.body.style.overflow = "hidden" // Prevent scrolling background
      document.getElementById("postContent").focus()
    }
  }

  closeCreatePost() {
    const modal = document.getElementById("createPostModal")
    if (modal) {
      modal.classList.add("hidden")
      document.body.style.overflow = "" // Restore scrolling
      document.getElementById("postContent").value = ""
      document.getElementById("imagePreview").classList.add("hidden")
      document.getElementById("imageUpload").value = "" // Clear file input
      this.updateCharCount()
    }
  }

  updateCharCount() {
    const postContent = document.getElementById("postContent")
    const charCount = document.getElementById("charCount")
    const postButton = document.getElementById("postButton")

    if (postContent && charCount && postButton) {
      const remaining = 280 - postContent.value.length
      charCount.textContent = `${remaining} characters remaining`
      postButton.disabled = postContent.value.trim().length === 0 || remaining < 0
    }
  }

  previewImage(event) {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const preview = document.getElementById("imagePreview")
        const previewImg = document.getElementById("previewImg")
        if (preview && previewImg) {
          previewImg.src = e.target.result
          preview.classList.remove("hidden")
        }
      }
      reader.readAsDataURL(file)
    }
  }

  removeImage() {
    const preview = document.getElementById("imagePreview")
    const imageUpload = document.getElementById("imageUpload")
    if (preview && imageUpload) {
      preview.classList.add("hidden")
      imageUpload.value = ""
    }
  }

  submitPost() {
    const content = document.getElementById("postContent").value.trim()
    const imageFile = document.getElementById("imageUpload").files[0] // Get the image file

    if (content || imageFile) {
      // Simulate image upload if a file is selected
      let imageUrl = null
      if (imageFile) {
        imageUrl = URL.createObjectURL(imageFile) // Create a temporary URL for display
      }

      // Create new post
      const newPost = {
        id: Date.now(),
        user: this.currentUser,
        content: content,
        image: imageUrl,
        likes: 0,
        comments: 0,
        shares: 0,
        timestamp: new Date(),
        liked: false,
        saved: false,
      }

      this.posts.unshift(newPost)
      this.renderPosts()
      this.closeCreatePost()
      this.showNotification("Post created successfully!", "success")
    } else {
      this.showNotification("Please add content or an image to your post.", "error")
    }
  }

  handleSearch(event) {
    const query = event.target.value.toLowerCase()
    // Implementation for search functionality
    console.log("Searching for:", query)
    this.showNotification(`Searching for "${query}"...`, "info")
  }

  showEmergencyAlert() {
    // Show emergency alert if there's an active alert
    const alert = document.getElementById("emergencyAlert")
    if (alert && !localStorage.getItem("alertDismissed")) {
      alert.classList.remove("hidden")
    }
  }

  dismissAlert() {
    const alert = document.getElementById("emergencyAlert")
    if (alert) {
      alert.classList.add("hidden")
      localStorage.setItem("alertDismissed", "true")
    }
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div")
    notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
      type === "success"
        ? "bg-green-600 text-white"
        : type === "error"
          ? "bg-red-600 text-white"
          : "bg-blue-600 text-white"
    }`
    notification.textContent = message

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.style.opacity = "0"
      setTimeout(() => {
        notification.remove()
      }, 300)
    }, 3000)
  }

  showError(message) {
    // Simple error notification
    const notification = document.createElement("div")
    notification.className = "fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
    notification.textContent = message
    document.body.appendChild(notification)

    setTimeout(() => {
      notification.remove()
    }, 5000)
  }

  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  logout() {
    localStorage.removeItem("currentUser")
    localStorage.removeItem("authToken")
    sessionStorage.removeItem("currentUser")
    sessionStorage.removeItem("authToken")
    this.isAuthenticated = false
    this.showNotification("Logged out successfully!", "success")

    // Clear content of all main pages (NEW)
    document.getElementById("postsContainer").innerHTML = ""
    document.getElementById("schemesContainer").innerHTML = ""
    document.getElementById("jobsContainer").innerHTML = ""
    document.getElementById("userPosts").innerHTML = ""
    document.getElementById("userActivity").innerHTML = ""

    this.showPage("login")
  }

  // Authentication Management
  setupAuthForms() {
    // Login form
    const loginForm = document.getElementById("loginForm")
    if (loginForm) {
      loginForm.addEventListener("submit", this.handleLogin.bind(this))
    }

    // Signup form
    const signupForm = document.getElementById("signupForm")
    if (signupForm) {
      signupForm.addEventListener("submit", this.handleSignup.bind(this))
    }

    // Password visibility toggles
    this.setupPasswordToggles()
  }

  setupPasswordToggles() {
    // Login password toggle
    const loginToggle = document.getElementById("toggleLoginPassword")
    const loginPassword = document.getElementById("loginPassword")
    const loginEyeIcon = document.getElementById("loginEyeIcon")

    if (loginToggle && loginPassword && loginEyeIcon) {
      loginToggle.addEventListener("click", () => {
        const isPassword = loginPassword.type === "password"
        loginPassword.type = isPassword ? "text" : "password"

        if (isPassword) {
          loginEyeIcon.innerHTML = `
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                `
        } else {
          loginEyeIcon.innerHTML = `
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                `
        }
      })
    }

    // Signup password toggle
    const signupToggle = document.getElementById("toggleSignupPassword")
    const signupPassword = document.getElementById("signupPassword")
    const signupEyeIcon = document.getElementById("signupEyeIcon")

    if (signupToggle && signupPassword && signupEyeIcon) {
      signupToggle.addEventListener("click", () => {
        const isPassword = signupPassword.type === "password"
        signupPassword.type = isPassword ? "text" : "password"

        if (isPassword) {
          signupEyeIcon.innerHTML = `
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                `
        } else {
          signupEyeIcon.innerHTML = `
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                `
        }
      })
    }
  }

  async handleLogin(e) {
    e.preventDefault()

    const email = document.getElementById("loginEmail").value.trim()
    const password = document.getElementById("loginPassword").value
    const rememberMe = document.getElementById("rememberMe").checked
    const submitBtn = document.getElementById("loginSubmitBtn")
    const btnText = document.getElementById("loginBtnText")
    const spinner = document.getElementById("loginSpinner")

    // Basic validation
    if (!email || !password) {
      this.showNotification("Please fill in all fields", "error")
      return
    }

    if (!this.isValidEmail(email)) {
      this.showNotification("Please enter a valid email address", "error")
      return
    }

    // Show loading state
    submitBtn.disabled = true
    btnText.textContent = "Signing In..."
    spinner.classList.remove("hidden")

    try {
      // Simulate API call
      await this.delay(1000)

      // Mock authentication - find user in registeredUsers
      const foundUser = this.registeredUsers.find((user) => user.email === email && user.password === password)

      if (foundUser) {
        this.isAuthenticated = true
        this.currentUser = foundUser // Set current user to the found user

        // Store authentication based on "remember me"
        if (rememberMe) {
          localStorage.setItem("authToken", "mock-jwt-token")
          localStorage.setItem("currentUser", JSON.stringify(foundUser))
          sessionStorage.removeItem("authToken") // Clear session storage if remembered
          sessionStorage.removeItem("currentUser")
        } else {
          sessionStorage.setItem("authToken", "mock-jwt-token")
          sessionStorage.setItem("currentUser", JSON.stringify(foundUser))
          localStorage.removeItem("authToken") // Clear local storage if not remembered
          localStorage.removeItem("currentUser")
        }

        this.showNotification(`Welcome back, ${foundUser.name.split(" ")[0]}!`, "success")

        // Initialize app content
        this.loadPosts()
        this.showEmergencyAlert()
        this.setupFeedManager()
        this.setupProfileManager()
        this.setupSettingsManager()

        this.showPage("home")
      } else {
        throw new Error("Invalid credentials")
      }
    } catch (error) {
      this.showNotification("Invalid email or password", "error")
    } finally {
      // Reset loading state
      submitBtn.disabled = false
      btnText.textContent = "Sign In"
      spinner.classList.add("hidden")
    }
  }

  async handleSignup(e) {
    e.preventDefault()

    const firstName = document.getElementById("firstName").value.trim()
    const lastName = document.getElementById("lastName").value.trim()
    const email = document.getElementById("signupEmail").value.trim()
    const password = document.getElementById("signupPassword").value
    const confirmPassword = document.getElementById("confirmPassword").value
    const agreeTerms = document.getElementById("agreeTerms").checked
    const submitBtn = document.getElementById("signupSubmitBtn")
    const btnText = document.getElementById("signupBtnText")
    const spinner = document.getElementById("signupSpinner")

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      this.showNotification("Please fill in all fields", "error")
      return
    }

    if (!this.isValidEmail(email)) {
      this.showNotification("Please enter a valid email address", "error")
      return
    }

    if (password.length < 6) {
      this.showNotification("Password must be at least 6 characters long", "error")
      return
    }

    if (password !== confirmPassword) {
      this.showNotification("Passwords do not match", "error")
      return
    }

    if (!agreeTerms) {
      this.showNotification("Please agree to the Terms of Service and Privacy Policy", "error")
      return
    }

    // Check if user already exists
    if (this.registeredUsers.some((user) => user.email === email)) {
      this.showNotification("An account with this email already exists. Please sign in.", "error")
      return
    }

    // Show loading state
    submitBtn.disabled = true
    btnText.textContent = "Creating Account..."
    spinner.classList.remove("hidden")

    try {
      // Simulate API call
      await this.delay(1000)

      // Mock user creation
      const newUser = {
        id: Date.now(),
        name: `${firstName} ${lastName}`,
        username: email.split("@")[0].replace(/[^a-zA-Z0-9]/g, ""), // Basic username sanitization
        email: email,
        password: password, // In a real app, hash this!
        bio: "New to CivicConnect",
        location: "India",
        joinDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${lastName}`,
        isVerified: false,
      }

      this.registeredUsers.push(newUser)
      localStorage.setItem("registeredUsers", JSON.stringify(this.registeredUsers)) // Save mock database

      this.currentUser = newUser
      this.isAuthenticated = true
      localStorage.setItem("authToken", "mock-jwt-token") // Automatically remember new signups
      localStorage.setItem("currentUser", JSON.stringify(newUser))
      sessionStorage.removeItem("authToken") // Clear session storage
      sessionStorage.removeItem("currentUser")

      this.showNotification("Account created successfully! Welcome to CivicConnect!", "success")

      // Initialize app content
      this.loadPosts()
      this.showEmergencyAlert()
      this.setupFeedManager()
      this.setupProfileManager()
      this.setupSettingsManager()

      this.showPage("home")
    } catch (error) {
      this.showNotification("Error creating account. Please try again.", "error")
    } finally {
      // Reset loading state
      submitBtn.disabled = false
      btnText.textContent = "Create Account"
      spinner.classList.add("hidden")
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  checkAuthStatus() {
    const sessionToken = sessionStorage.getItem("authToken")
    const localStorageToken = localStorage.getItem("authToken")
    return !!(sessionToken || localStorageToken)
  }

  // Profile Management
  setupProfileManager() {
    const editBtn = document.getElementById("editProfileBtn")
    const changePhotoBtn = document.getElementById("changePhotoBtn")

    editBtn?.addEventListener("click", () => this.openEditProfileModal())
    changePhotoBtn?.addEventListener("click", () => this.changeProfilePhoto())

    // Profile tabs
    const profileTabs = document.querySelectorAll(".profile-tab")
    profileTabs.forEach((tab) => {
      tab.addEventListener("click", (e) => {
        const tabName = e.target.dataset.tab
        this.showProfileTab(tabName)
      })
    })
  }

  openEditProfileModal() {
    // Populate form with current data
    const fields = {
      editName: document.getElementById("editName"),
      editUsername: document.getElementById("editUsername"),
      editBio: document.getElementById("editBio"),
      editLocation: document.getElementById("editLocation"),
    }

    if (fields.editName) fields.editName.value = this.currentUser.name
    if (fields.editUsername) fields.editUsername.value = this.currentUser.username
    if (fields.editBio) fields.editBio.value = this.currentUser.bio
    if (fields.editLocation) fields.editLocation.value = this.currentUser.location

    // Show modal
    const modal = document.getElementById("editProfileModal")
    if (modal) {
      modal.classList.remove("hidden")
      document.body.style.overflow = "hidden" // Prevent scrolling background
    }

    // Setup form submission
    const form = document.getElementById("editProfileForm")
    if (form) {
      // Remove previous listener to prevent multiple bindings
      form.removeEventListener("submit", this.handleEditProfileSubmitBound)
      this.handleEditProfileSubmitBound = this.handleEditProfileSubmit.bind(this)
      form.addEventListener("submit", this.handleEditProfileSubmitBound)
    }

    // Setup close buttons
    const closeBtn = document.getElementById("closeEditModal")
    const cancelBtn = document.getElementById("cancelEdit")
    closeBtn?.addEventListener("click", () => this.closeEditProfileModal())
    cancelBtn?.addEventListener("click", () => this.closeEditProfileModal())

    // Close modal on outside click
    modal?.addEventListener("click", (e) => {
      if (e.target === modal) {
        this.closeEditProfileModal()
      }
    })
  }

  closeEditProfileModal() {
    const modal = document.getElementById("editProfileModal")
    if (modal) {
      modal.classList.add("hidden")
      document.body.style.overflow = "" // Restore scrolling
    }
  }

  handleEditProfileSubmit(e) {
    e.preventDefault()

    // Get form data
    const formData = {
      name: document.getElementById("editName")?.value || "",
      username: document.getElementById("editUsername")?.value || "",
      bio: document.getElementById("editBio")?.value || "",
      location: document.getElementById("editLocation")?.value || "",
    }

    // Validate
    if (!formData.name.trim() || !formData.username.trim()) {
      this.showNotification("Please fill in all required fields", "error")
      return
    }

    // Update user data in the mock database
    this.registeredUsers = this.registeredUsers.map((user) =>
      user.email === this.currentUser.email ? { ...user, ...formData } : user,
    )
    localStorage.setItem("registeredUsers", JSON.stringify(this.registeredUsers))

    // Update current user in session/local storage
    this.currentUser = { ...this.currentUser, ...formData }
    if (localStorage.getItem("authToken")) {
      // Check if remembered
      localStorage.setItem("currentUser", JSON.stringify(this.currentUser))
    } else {
      sessionStorage.setItem("currentUser", JSON.stringify(this.currentUser))
    }

    this.populateProfile()
    this.closeEditProfileModal()
    this.showNotification("Profile updated successfully!", "success")
  }

  loadProfileData() {
    this.populateProfile()
    this.loadUserPosts()
    this.loadUserActivity()
  }

  populateProfile() {
    const elements = {
      displayName: document.getElementById("displayName"),
      displayUsername: document.getElementById("displayUsername"),
      displayBio: document.getElementById("displayBio"),
      displayLocation: document.getElementById("displayLocation"),
      displayJoinDate: document.getElementById("displayJoinDate"),
      profileImage: document.getElementById("profileImage"),
    }

    if (elements.displayName) elements.displayName.textContent = this.currentUser.name
    if (elements.displayUsername) elements.displayUsername.textContent = `@${this.currentUser.username}`
    if (elements.displayBio) elements.bio.textContent = this.currentUser.bio
    if (elements.displayLocation) elements.displayLocation.textContent = this.currentUser.location
    if (elements.displayJoinDate) elements.displayJoinDate.textContent = `Joined ${this.currentUser.joinDate}`
    if (elements.profileImage) elements.profileImage.src = this.currentUser.avatar
  }

  loadUserPosts() {
    const container = document.getElementById("userPosts")
    if (!container) return

    // Filter posts that belong to the current user
    const userPosts = this.posts.filter((post) => post.user.id === this.currentUser.id)

    if (userPosts.length === 0) {
      container.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400">No posts yet.</p>'
      return
    }

    container.innerHTML = userPosts
      .map(
        (post) => `
          <div class="border-b border-gray-200 dark:border-gray-700 pb-4">
              <p class="text-gray-900 dark:text-white mb-2">${post.content}</p>
              <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>${this.getTimeAgo(post.timestamp)}</span>
                  <div class="flex items-center gap-4">
                      <span class="flex items-center gap-1">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                          </svg>
                          ${post.likes}
                      </span>
                      <span class="flex items-center gap-1">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                          </svg>
                          ${post.comments}
                      </span>
                  </div>
              </div>
          </div>
      `,
      )
      .join("")
  }

  loadUserActivity() {
    const container = document.getElementById("userActivity")
    if (!container) return

    const activities = [
      {
        type: "like",
        description: "Liked a post about road maintenance",
        timestamp: "1 hour ago",
      },
      {
        type: "comment",
        description: "Commented on healthcare scheme discussion",
        timestamp: "3 hours ago",
      },
      {
        type: "follow",
        description: "Started following Mumbai Traffic Police",
        timestamp: "1 day ago",
      },
      {
        type: "post",
        description: "Created a new post about community meeting",
        timestamp: "2 days ago",
      },
    ]

    const getActivityIcon = (type) => {
      switch (type) {
        case "like":
          return '<svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>'
        case "comment":
          return '<svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>'
        case "follow":
          return '<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>'
        case "post":
          return '<svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>'
        default:
          return '<svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle></svg>'
      }
    }

    container.innerHTML = activities
      .map(
        (activity) => `
          <div class="flex items-center gap-3">
              <div class="flex-shrink-0">
                  ${getActivityIcon(activity.type)}
              </div>
              <div class="flex-1">
                  <p class="text-sm text-gray-900 dark:text-white">${activity.description}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">${activity.timestamp}</p>
              </div>
          </div>
      `,
      )
      .join("")
  }

  showProfileTab(tabName) {
    // Update tab buttons
    const tabs = document.querySelectorAll(".profile-tab")
    tabs.forEach((tab) => {
      tab.classList.remove("active", "text-blue-600", "dark:text-blue-400", "border-blue-600")
      tab.classList.add("text-gray-500", "dark:text-gray-400")
      tab.style.borderBottomWidth = "0px" // Reset border
    })

    const activeTab = document.querySelector(`[data-tab="${tabName}"]`)
    if (activeTab) {
      activeTab.classList.add("active", "text-blue-600", "dark:text-blue-400")
      activeTab.style.borderBottomWidth = "2px" // Set active border
      activeTab.classList.remove("text-gray-500", "dark:text-gray-400")
    }

    // Update tab content
    const contents = document.querySelectorAll(".profile-tab-content")
    contents.forEach((content) => content.classList.add("hidden"))

    const activeContent = document.getElementById(`user${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`)
    if (activeContent) {
      activeContent.classList.remove("hidden")
    }
  }

  changeProfilePhoto() {
    const seeds = [
      "user1",
      "user2",
      "user3",
      "user4",
      "user5",
      "john",
      "jane",
      "alex",
      "sarah",
      "mike",
      "avatar1",
      "avatar2",
      "avatar3",
    ]
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)]
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`

    this.currentUser.avatar = newAvatar
    // Update in mock database
    this.registeredUsers = this.registeredUsers.map((user) =>
      user.email === this.currentUser.email ? { ...user, avatar: newAvatar } : user,
    )
    localStorage.setItem("registeredUsers", JSON.stringify(this.registeredUsers))

    // Update in session/local storage
    if (localStorage.getItem("authToken")) {
      localStorage.setItem("currentUser", JSON.stringify(this.currentUser))
    } else {
      sessionStorage.setItem("currentUser", JSON.stringify(this.currentUser))
    }

    const profileImage = document.getElementById("profileImage")
    if (profileImage) {
      profileImage.src = newAvatar
    }

    this.showNotification("Profile photo updated!", "success")
  }

  // Settings Management
  setupSettingsManager() {
    // Add event listeners for settings functionality
    this.setupNotificationToggles()
    this.setupThemeSelector()
    this.setupSupportModals()
  }

  loadSettingsData() {
    // Load current settings
    const currentTheme = localStorage.getItem("theme") || "system"
    const themeSelector = document.getElementById("themeSelector")
    if (themeSelector) {
      themeSelector.value = currentTheme
    }
    console.log("Loading settings data...")
  }

  setupNotificationToggles() {
    const toggles = document.querySelectorAll('input[type="checkbox"]')
    toggles.forEach((toggle) => {
      toggle.addEventListener("change", (e) => {
        const settingElement = e.target.closest(".flex").querySelector("h3")
        const setting = settingElement ? settingElement.textContent : "Setting"
        this.showNotification(`${setting} ${e.target.checked ? "enabled" : "disabled"}`, "info")
      })
    })
  }

  setupThemeToggle() {
    const themeToggleBtn = document.getElementById("themeToggle")
    const sunIcon = document.getElementById("sunIcon")
    const moonIcon = document.getElementById("moonIcon")
    const htmlElement = document.documentElement // Target the html element

    const applyTheme = (theme) => {
      if (theme === "dark") {
        htmlElement.classList.add("dark")
        if (sunIcon) sunIcon.classList.remove("hidden")
        if (moonIcon) moonIcon.classList.add("hidden")
      } else if (theme === "light") {
        htmlElement.classList.remove("dark")
        if (sunIcon) sunIcon.classList.add("hidden")
        if (moonIcon) moonIcon.classList.remove("hidden")
      } else {
        // system
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          htmlElement.classList.add("dark")
          if (sunIcon) sunIcon.classList.remove("hidden")
          if (moonIcon) moonIcon.classList.add("hidden")
        } else {
          htmlElement.classList.remove("dark")
          if (sunIcon) sunIcon.classList.add("hidden")
          if (moonIcon) moonIcon.classList.remove("hidden")
        }
      }
    }

    const savedTheme = localStorage.getItem("theme")
    if (savedTheme) {
      applyTheme(savedTheme)
    } else {
      applyTheme("system") // Default to system theme
    }

    themeToggleBtn?.addEventListener("click", () => {
      const currentTheme = localStorage.getItem("theme") || "system"
      let newTheme
      if (currentTheme === "light") {
        newTheme = "dark"
      } else if (currentTheme === "dark") {
        newTheme = "system"
      } else {
        // system
        newTheme = "light"
      }
      localStorage.setItem("theme", newTheme)
      applyTheme(newTheme)
      this.showNotification(`Theme set to ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)}`, "info")
    })

    // Listen for system theme changes
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      if (localStorage.getItem("theme") === "system") {
        applyTheme("system")
      }
    })
  }

  setupThemeSelector() {
    const themeSelect = document.getElementById("themeSelector")
    if (themeSelect) {
      themeSelect.addEventListener("change", (e) => {
        const newTheme = e.target.value
        localStorage.setItem("theme", newTheme)
        document.documentElement.classList.remove("light", "dark") // Clear existing classes from html
        if (newTheme === "dark") {
          document.documentElement.classList.add("dark")
        } else if (newTheme === "light") {
          // No 'light' class needed, just ensure 'dark' is removed
        } else {
          // system
          if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            document.documentElement.classList.add("dark")
          }
        }
        this.setupThemeToggle() // Re-apply theme logic to update icons
        this.showNotification(`Theme changed to ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)}`, "info")
      })
    }
  }

  setupSupportModals() {
    // Modal functionality will be added here
  }

  // Feed Management (formerly in separate feed.js file)
  setupFeedManager() {
    this.feedManager = new FeedManager()
  }

  // Schemes Management
  async loadSchemesData() {
    const container = document.getElementById("schemesContainer")
    const loading = document.getElementById("schemesLoading")

    if (!container) return

    loading?.classList.remove("hidden")
    container.innerHTML = ""

    try {
      // Mock schemes data
      const schemes = [
        {
          id: 1,
          title: "Pradhan Mantri Awas Yojana",
          category: "housing",
          description: "Affordable housing scheme for urban poor",
          eligibility: "Annual income below ₹6 lakh",
          benefits: "Subsidy up to ₹2.67 lakh",
          deadline: "2024-12-31",
          state: "All States",
          status: "active",
        },
        {
          id: 2,
          title: "Beti Bachao Beti Padhao",
          category: "education",
          description: "Girl child education and empowerment scheme",
          eligibility: "Girl children",
          benefits: "Educational support and awareness",
          deadline: "Ongoing",
          state: "All States",
          status: "active",
        },
        {
          id: 3,
          title: "PM Kisan Samman Nidhi",
          category: "agriculture",
          description: "Income support to farmer families",
          eligibility: "Small and marginal farmers",
          benefits: "₹6000 per year",
          deadline: "Ongoing",
          state: "All States",
          status: "active",
        },
        {
          id: 4,
          title: "Ayushman Bharat",
          category: "healthcare",
          description: "Health insurance for economically vulnerable families",
          eligibility: "As per SECC database",
          benefits: "Coverage up to ₹5 lakh per family",
          deadline: "Ongoing",
          state: "All States",
          status: "active",
        },
        {
          id: 5,
          title: "MUDRA Yojana",
          category: "employment",
          description: "Micro finance for small businesses",
          eligibility: "Non-corporate, non-farm small enterprises",
          benefits: "Loans up to ₹10 lakh",
          deadline: "Ongoing",
          state: "All States",
          status: "active",
        },
        {
          id: 6,
          title: "Skill India Mission",
          category: "education",
          description: "Skill development and training programs",
          eligibility: "Youth aged 15-45",
          benefits: "Free skill training and certification",
          deadline: "Ongoing",
          state: "All States",
          status: "active",
        },
      ]

      schemes.forEach((scheme) => {
        const schemeElement = this.createSchemeCard(scheme)
        container.appendChild(schemeElement)
      })

      // Setup filter functionality
      this.setupSchemeFilters(schemes)
    } catch (error) {
      console.error("Error loading schemes:", error)
      this.showNotification("Failed to load schemes", "error")
    } finally {
      loading?.classList.add("hidden")
    }
  }

  createSchemeCard(scheme) {
    const card = document.createElement("div")
    card.className =
      "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"

    const categoryColors = {
      housing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      education: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      healthcare: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      agriculture: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      employment: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    }

    card.innerHTML = `
          <div class="flex justify-between items-start mb-4">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[scheme.category] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"}">
                  ${scheme.category.charAt(0).toUpperCase() + scheme.category.slice(1)}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">${scheme.state}</span>
          </div>
          
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${scheme.title}</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">${scheme.description}</p>
          
          <div class="space-y-2 mb-4">
              <div class="flex items-start">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300 w-20">Eligibility:</span>
                  <span class="text-sm text-gray-600 dark:text-gray-400 flex-1">${scheme.eligibility}</span>
              </div>
              <div class="flex items-start">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300 w-20">Benefits:</span>
                  <span class="text-sm text-gray-600 dark:text-gray-400 flex-1">${scheme.benefits}</span>
              </div>
              <div class="flex items-start">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300 w-20">Deadline:</span>
                  <span class="text-sm text-gray-600 dark:text-gray-400 flex-1">${scheme.deadline}</span>
              </div>
          </div>
          
          <div class="flex space-x-3">
              <button onclick="applyScheme(${scheme.id})" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                  Apply Now
              </button>
              <button onclick="saveScheme(${scheme.id})" class="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                  Save for Later
              </button>
          </div>
      `

    return card
  }

  setupSchemeFilters(schemes) {
    const categoryFilter = document.getElementById("categoryFilter")
    const eligibilityFilter = document.getElementById("eligibilityFilter")
    const stateFilter = document.getElementById("stateFilter")

    const applyFilters = () => {
      const category = categoryFilter?.value || ""
      const eligibility = eligibilityFilter?.value || ""
      const state = stateFilter?.value || ""

      const filteredSchemes = schemes.filter((scheme) => {
        return (
          (!category || scheme.category === category) &&
          (!eligibility || scheme.eligibility.toLowerCase().includes(eligibility.toLowerCase())) &&
          (!state || scheme.state.toLowerCase().includes(state.toLowerCase()))
        )
      })

      const container = document.getElementById("schemesContainer")
      container.innerHTML = ""
      if (filteredSchemes.length === 0) {
        container.innerHTML =
          '<p class="text-center text-gray-500 dark:text-gray-400 col-span-full">No schemes found matching your criteria.</p>'
      } else {
        filteredSchemes.forEach((scheme) => {
          const schemeElement = this.createSchemeCard(scheme)
          container.appendChild(schemeElement)
        })
      }
    }

    categoryFilter?.addEventListener("change", applyFilters)
    eligibilityFilter?.addEventListener("change", applyFilters)
    stateFilter?.addEventListener("change", applyFilters)
  }

  // Jobs Management
  async loadJobsData() {
    const container = document.getElementById("jobsContainer")
    const loading = document.getElementById("jobsLoading")

    if (!container) return

    loading?.classList.remove("hidden")
    container.innerHTML = ""

    try {
      // Mock jobs data
      const jobs = [
        {
          id: 1,
          title: "Railway Group D",
          department: "railways",
          organization: "Indian Railways",
          location: "Pan India",
          experience: "fresher",
          education: "10th",
          vacancies: 103769,
          salary: "₹18,000 - ₹22,000",
          lastDate: "2024-02-15",
          description: "Various posts in Railway Group D category",
          applicationFee: "₹250 (Gen), ₹250 (OBC), Free (SC/ST/PWD)",
          status: "active",
        },
        {
          id: 2,
          title: "SBI Clerk",
          department: "banking",
          organization: "State Bank of India",
          location: "All India",
          experience: "fresher",
          education: "graduate",
          vacancies: 8773,
          salary: "₹20,000 - ₹25,000",
          lastDate: "2024-01-30",
          description: "Junior Associate positions in State Bank of India",
          applicationFee: "₹750 (Gen), ₹125 (SC/ST/PWD)",
          status: "active",
        },
        {
          id: 3,
          title: "SSC CGL",
          department: "defense",
          organization: "Staff Selection Commission",
          location: "All India",
          experience: "fresher",
          education: "graduate",
          vacancies: 26331,
          salary: "₹25,000 - ₹80,000",
          lastDate: "2024-03-15",
          description: "Combined Graduate Level Examination",
          applicationFee: "₹100 (Gen), Free (Women/SC/ST/PWD)",
          status: "active",
        },
        {
          id: 4,
          title: "Police Constable",
          department: "defense",
          organization: "State Police",
          location: "Maharashtra",
          experience: "fresher",
          education: "12th",
          vacancies: 4685,
          salary: "₹21,700 - ₹69,100",
          lastDate: "2024-02-28",
          description: "Police Constable recruitment in Maharashtra",
          applicationFee: "₹524 (Gen), ₹324 (OBC), ₹224 (SC/ST)",
          status: "active",
        },
        {
          id: 5,
          title: "UPSC Civil Services",
          department: "administration",
          organization: "Union Public Service Commission",
          location: "All India",
          experience: "fresher",
          education: "graduate",
          vacancies: 1105,
          salary: "₹56,100 - ₹2,50,000",
          lastDate: "2024-03-31",
          description: "Civil Services Examination for IAS, IPS, IFS",
          applicationFee: "₹200 (Gen), Free (Women/SC/ST/PWD)",
          status: "active",
        },
      ]

      jobs.forEach((job) => {
        const jobElement = this.createJobCard(job)
        container.appendChild(jobElement)
      })

      // Setup filter functionality
      this.setupJobFilters(jobs)
    } catch (error) {
      console.error("Error loading jobs:", error)
      this.showNotification("Failed to load jobs", "error")
    } finally {
      loading?.classList.add("hidden")
    }
  }

  createJobCard(job) {
    const card = document.createElement("div")
    card.className =
      "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"

    const daysLeft = Math.ceil((new Date(job.lastDate) - new Date()) / (1000 * 60 * 60 * 24))
    const urgencyClass =
      daysLeft <= 7
        ? "text-red-600 dark:text-red-400"
        : daysLeft <= 15
          ? "text-yellow-600 dark:text-yellow-400"
          : "text-green-600 dark:text-green-400"

    card.innerHTML = `
          <div class="flex justify-between items-start mb-4">
              <div>
                  <h3 class="text-xl font-semibold text-gray-900 dark:text-white">${job.title}</h3>
                  <p class="text-gray-600 dark:text-gray-400">${job.organization}</p>
              </div>
              <div class="text-right">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      ${job.vacancies} Vacancies
                  </span>
                  <p class="text-sm ${urgencyClass} mt-1">${daysLeft} days left</p>
              </div>
          </div>
          
          <p class="text-gray-600 dark:text-gray-400 mb-4">${job.description}</p>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                  <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Location</span>
                  <p class="text-sm text-gray-900 dark:text-white">${job.location}</p>
              </div>
              <div>
                  <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Education</span>
                  <p class="text-sm text-gray-900 dark:text-white">${job.education}</p>
              </div>
              <div>
                  <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Experience</span>
                  <p class="text-sm text-gray-900 dark:text-white">${job.experience}</p>
              </div>
              <div>
                  <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Salary</span>
                  <p class="text-sm text-gray-900 dark:text-white">${job.salary}</p>
              </div>
          </div>
          
          <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div class="flex items-center justify-between">
                  <div>
                      <p class="text-sm text-gray-600 dark:text-gray-400">Application Fee: ${job.applicationFee}</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">Last Date: ${job.lastDate}</p>
                  </div>
                  <div class="flex space-x-3">
                      <button onclick="viewJobDetails(${job.id})" class="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                          View Details
                      </button>
                      <button onclick="applyJob(${job.id})" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                          Apply Now
                      </button>
                  </div>
              </div>
          </div>
      `

    return card
  }

  setupJobFilters(jobs) {
    const departmentFilter = document.getElementById("departmentFilter")
    const experienceFilter = document.getElementById("experienceFilter")
    const educationFilter = document.getElementById("educationFilter")
    const locationFilter = document.getElementById("locationFilter")

    const applyFilters = () => {
      const department = departmentFilter?.value || ""
      const experience = experienceFilter?.value || ""
      const education = educationFilter?.value || ""
      const location = locationFilter?.value || ""

      const filteredJobs = jobs.filter((job) => {
        return (
          (!department || job.department === department) &&
          (!experience || job.experience === experience) &&
          (!education || job.education === education) &&
          (!location || job.location.toLowerCase().includes(location.toLowerCase()))
        )
      })

      const container = document.getElementById("jobsContainer")
      container.innerHTML = ""
      if (filteredJobs.length === 0) {
        container.innerHTML =
          '<p class="text-center text-gray-500 dark:text-gray-400 col-span-full">No jobs found matching your criteria.</p>'
      } else {
        filteredJobs.forEach((job) => {
          const jobElement = this.createJobCard(job)
          container.appendChild(jobElement)
        })
      }
    }

    departmentFilter?.addEventListener("change", applyFilters)
    experienceFilter?.addEventListener("change", applyFilters)
    educationFilter?.addEventListener("change", applyFilters)
    locationFilter?.addEventListener("change", applyFilters)
  }
}

// Feed Manager Class (consolidated from feed.js)
class FeedManager {
  constructor() {
    this.page = 1
    this.loading = false
    this.hasMore = true
    this.init()
  }

  init() {
    this.setupInfiniteScroll()
    this.setupPullToRefresh()
  }

  setupInfiniteScroll() {
    let ticking = false

    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (this.shouldLoadMore()) {
            this.loadMorePosts()
          }
          ticking = false
        })
        ticking = true
      }
    })
  }

  shouldLoadMore() {
    if (this.loading || !this.hasMore) return false

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight

    // Load more when 1000px from bottom
    return scrollTop + windowHeight >= documentHeight - 1000
  }

  async loadMorePosts() {
    if (this.loading || !this.hasMore) return

    this.loading = true
    this.showLoadingIndicator()

    try {
      // Simulate API call
      await this.delay(1000)

      // Load more posts (simulated)
      const morePosts = await this.fetchMorePosts()

      if (morePosts.length === 0) {
        this.hasMore = false
        this.showEndMessage()
      } else {
        this.appendPosts(morePosts)
        this.page++
      }
    } catch (error) {
      console.error("Error loading more posts:", error)
      this.showErrorMessage()
    } finally {
      this.loading = false
      this.hideLoadingIndicator()
    }
  }

  async fetchMorePosts() {
    try {
      const response = await fetch(`https://jsonplaceholder.typicode.com/posts?_page=${this.page + 1}&_limit=5`)
      const posts = await response.json()

      return posts.map((post) => ({
        id: post.id + 1000, // Offset to avoid conflicts
        user: {
          id: post.userId,
          name: `User ${post.userId}`,
          username: `user${post.userId}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${post.userId}`,
          isVerified: Math.random() > 0.8,
        },
        content: post.title,
        image: `https://picsum.photos/600/400?random=${post.id + 1000}`,
        likes: Math.floor(Math.random() * 200) + 10,
        comments: Math.floor(Math.random() * 30) + 1,
        shares: Math.floor(Math.random() * 10),
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 3),
        liked: false,
        saved: false,
      }))
    } catch (error) {
      console.error("Error fetching more posts:", error)
      return []
    }
  }

  appendPosts(posts) {
    const container = document.getElementById("postsContainer")
    if (!container || !window.app) return

    posts.forEach((post) => {
      window.app.posts.push(post)
      const postElement = window.app.createPostElement(post)
      container.appendChild(postElement)
    })
  }

  setupPullToRefresh() {
    let startY = 0
    let pullDistance = 0
    let isPulling = false
    const threshold = 80
    const refreshIndicator = document.createElement("div")
    refreshIndicator.id = "pullToRefreshIndicator"
    refreshIndicator.className =
      "fixed top-0 left-0 right-0 text-center py-2 bg-blue-500 text-white z-50 transition-all duration-200 ease-out opacity-0"
    refreshIndicator.innerHTML = `
          <div class="flex items-center justify-center space-x-2">
              <svg class="w-5 h-5 animate-spin hidden" id="pullSpinner" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span id="pullText">Pull to refresh</span>
          </div>
      `
    document.body.prepend(refreshIndicator)

    document.addEventListener("touchstart", (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY
        isPulling = true
        refreshIndicator.style.transition = "none" // Disable transition during pull
      }
    })

    document.addEventListener("touchmove", (e) => {
      if (!isPulling) return

      const currentY = e.touches[0].clientY
      pullDistance = Math.max(0, currentY - startY)

      if (pullDistance > 0 && window.scrollY === 0) {
        e.preventDefault() // Prevent page scroll
        refreshIndicator.style.opacity = Math.min(pullDistance / threshold, 1).toString()
        refreshIndicator.style.transform = `translateY(${Math.min(pullDistance, threshold)}px)`
        document.getElementById("pullText").textContent =
          pullDistance > threshold ? "Release to refresh" : "Pull to refresh"
      }
    })

    document.addEventListener("touchend", () => {
      if (isPulling) {
        refreshIndicator.style.transition = "all 0.2s ease-out" // Re-enable transition
        if (pullDistance > threshold) {
          this.refreshFeed()
        }
        this.resetPullIndicator()
      }
      isPulling = false
      pullDistance = 0
      startY = 0
    })
  }

  updatePullIndicator(distance, threshold) {
    const refreshIndicator = document.getElementById("pullToRefreshIndicator")
    if (refreshIndicator) {
      refreshIndicator.style.opacity = Math.min(distance / threshold, 1).toString()
      refreshIndicator.style.transform = `translateY(${Math.min(distance, threshold)}px)`
      document.getElementById("pullText").textContent = distance > threshold ? "Release to refresh" : "Pull to refresh"
    }
  }

  resetPullIndicator() {
    const refreshIndicator = document.getElementById("pullToRefreshIndicator")
    const pullSpinner = document.getElementById("pullSpinner")
    if (refreshIndicator) {
      refreshIndicator.style.opacity = "0"
      refreshIndicator.style.transform = "translateY(0)"
      if (pullSpinner) pullSpinner.classList.add("hidden")
    }
  }

  async refreshFeed() {
    if (this.loading) return

    this.loading = true
    this.showRefreshIndicator()

    try {
      // Reload all posts
      if (window.app) {
        await window.app.loadPosts()
      }
      this.page = 1
      this.hasMore = true
      window.app.showNotification("Feed refreshed!", "success")
    } catch (error) {
      console.error("Error refreshing feed:", error)
      window.app.showNotification("Failed to refresh feed.", "error")
    } finally {
      this.loading = false
      this.hideRefreshIndicator()
    }
  }

  showLoadingIndicator() {
    const spinner = document.getElementById("loadingSpinner")
    if (spinner) {
      spinner.style.display = "flex"
    }
  }

  hideLoadingIndicator() {
    const spinner = document.getElementById("loadingSpinner")
    if (spinner) {
      spinner.style.display = "none"
    }
  }

  showRefreshIndicator() {
    const refreshIndicator = document.getElementById("pullToRefreshIndicator")
    const pullSpinner = document.getElementById("pullSpinner")
    const pullText = document.getElementById("pullText")
    if (refreshIndicator && pullSpinner && pullText) {
      refreshIndicator.style.opacity = "1"
      refreshIndicator.style.transform = "translateY(0)"
      pullSpinner.classList.remove("hidden")
      pullText.textContent = "Refreshing..."
    }
  }

  hideRefreshIndicator() {
    const refreshIndicator = document.getElementById("pullToRefreshIndicator")
    const pullSpinner = document.getElementById("pullSpinner")
    const pullText = document.getElementById("pullText")
    if (refreshIndicator && pullSpinner && pullText) {
      refreshIndicator.style.opacity = "0"
      refreshIndicator.style.transform = "translateY(-100%)" // Move it out of view
      pullSpinner.classList.add("hidden")
      pullText.textContent = "Pull to refresh"
    }
  }

  showEndMessage() {
    const container = document.getElementById("postsContainer")
    if (container) {
      const endMessage = document.createElement("div")
      endMessage.className = "text-center py-8 text-gray-500 dark:text-gray-400"
      endMessage.innerHTML = `
              <p class="text-lg font-medium">You're all caught up!</p>
              <p class="text-sm">Check back later for new posts.</p>
          `
      container.appendChild(endMessage)
    }
  }

  showErrorMessage() {
    const notification = document.createElement("div")
    notification.className =
      "fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
    notification.textContent = "Error loading posts. Please try again."
    document.body.appendChild(notification)

    setTimeout(() => {
      notification.remove()
    }, 3000)
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Global functions for inline event handlers
function showPage(page) {
  window.app.showPage(page)
}

function createPost() {
  window.app.createPost()
}

function closeCreatePost() {
  window.app.closeCreatePost()
}

function previewImage(event) {
  window.app.previewImage(event)
}

function removeImage() {
  window.app.removeImage()
}

function submitPost() {
  window.app.submitPost()
}

function toggleLike(postId) {
  window.app.toggleLike(postId)
}

function toggleSave(postId) {
  window.app.toggleSave(postId)
}

function sharePost(postId) {
  window.app.sharePost(postId)
}

function openComments(postId) {
  window.app.openComments(postId)
}

function openImageModal(imageSrc) {
  window.app.openImageModal(imageSrc)
}

function dismissAlert() {
  window.app.dismissAlert()
}

function logout() {
  window.app.logout()
}

function openHelpModal() {
  window.app.showNotification("Help Center opened", "info")
}

function openContactModal() {
  window.app.showNotification("Contact Support opened", "info")
}

function openAboutModal() {
  window.app.showNotification("About CivicConnect opened", "info")
}

// Schemes functions
function applyScheme(schemeId) {
  window.app.showNotification("Application submitted successfully!", "success")
}

function saveScheme(schemeId) {
  window.app.showNotification("Scheme saved for later", "info")
}

// Jobs functions
function applyJob(jobId) {
  window.app.showNotification("Redirecting to application portal...", "info")
}

function viewJobDetails(jobId) {
  window.app.showNotification("Job details opened", "info")
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = new CivicConnect()
})
