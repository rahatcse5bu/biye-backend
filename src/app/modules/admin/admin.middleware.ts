// This file is no longer needed as we now use the existing user authentication system
// with role-based access control using auth("admin") middleware

// The admin authentication now uses:
// 1. Google Sign-In with Firebase for frontend authentication
// 2. Existing user login API (/api/v1/user-info/create-login-user/app)
// 3. Role checking via user_role field in UserInfo model
// 4. Standard auth("admin") middleware for protected routes

export {};