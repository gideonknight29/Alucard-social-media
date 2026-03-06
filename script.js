// script.js

// Authentication
function login(username, password) {
    // Authenticate user (mock)
    console.log(`Logging in ${username}`);
}

function signup(username, password) {
    // Register user (mock)
    console.log(`Signing up ${username}`);
}

// Posts
function createPost(content) {
    console.log(`Post created: ${content}`);
}

function fetchPosts() {
    console.log('Fetching posts...');
    return []; // Return mock posts
}

// Messaging
function sendMessage(toUser, message) {
    console.log(`Message to ${toUser}: ${message}`);
}

function fetchMessages() {
    console.log('Fetching messages...');
    return []; // Return mock messages
}

// Notifications
function fetchNotifications() {
    console.log('Fetching notifications...');
    return []; // Return mock notifications
}

// User Profiles
function getUserProfile(username) {
    console.log(`Fetching profile for ${username}`);
}

// Example usage
signup('user1', 'password123');
createPost('Hello World!');
fetchPosts();
