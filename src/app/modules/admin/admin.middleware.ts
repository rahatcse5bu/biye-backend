// This file is no longer needed as we now use the existing user authentication system
// with role-based access control using auth("admin") middleware

// Admin authentication uses the shared application JWT issued after Google OAuth
// or email/password login, followed by the standard auth("admin") role check.

export {};