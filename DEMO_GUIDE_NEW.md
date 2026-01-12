# Posting App - Demo Guide

A T3 Stack application with authentication, posts CRUD, and API documentation.

---

## 📁 Project Structure

```
T3-Stack/
├── prisma/
│   ├── schema.prisma      # Database schema definition
│   └── db.sqlite          # SQLite database file
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── api/           # API routes
│   │   │   ├── posts/route.ts         # GET/POST /api/posts
│   │   │   ├── posts/[id]/route.ts    # GET/PUT/DELETE /api/posts/:id
│   │   │   ├── users/route.ts         # GET /api/users
│   │   │   ├── users/[id]/route.ts    # GET /api/users/:id
│   │   │   └── auth/
│   │   │       ├── [...nextauth]/route.ts  # NextAuth handler
│   │   │       ├── login/route.ts          # Custom credentials login
│   │   │       └── signup/route.ts         # User registration
│   │   ├── auth/
│   │   │   ├── signin/page.tsx    # Sign in page
│   │   │   └── signup/page.tsx    # Sign up page
│   │   ├── posts/
│   │   │   └── [id]/edit/page.tsx # Edit post page
│   │   ├── api-docs/page.tsx      # Swagger UI page
│   │   ├── page.tsx               # Homepage
│   │   └── layout.tsx             # Root layout
│   ├── server/
│   │   ├── auth/
│   │   │   ├── config.ts          # NextAuth configuration
│   │   │   └── index.ts           # Auth exports
│   │   └── db.ts                  # Prisma client
│   └── lib/
│       └── swagger.ts             # Swagger/OpenAPI config
├── .env                           # Environment variables
└── package.json                   # Dependencies
```

---

## 🗄️ Database Schema

### 📂 File: `prisma/schema.prisma`

**What this file does:** Defines the structure of our database - what tables exist and what columns they have. Prisma reads this file and creates the actual database tables.

```prisma
model User {
    id            String    @id @default(cuid())   // Unique ID, auto-generated
    name          String?                          // User's display name (optional)
    email         String?   @unique                // Email must be unique across all users
    password      String?                          // Hashed password for login
    image         String?                          // Profile picture URL
    posts         Post[]                           // Relationship: one user can have many posts
}
```

**Line-by-line:**
- `model User` - Creates a table called "User"
- `@id` - This field is the primary key (unique identifier)
- `@default(cuid())` - Automatically generates a random unique ID
- `String?` - The `?` means this field is optional (can be null)
- `@unique` - No two users can have the same email
- `Post[]` - Array of posts, creates a one-to-many relationship

```prisma
model Post {
    id          Int      @id @default(autoincrement())  // Auto-incrementing number (1, 2, 3...)
    name        String                                   // Post title (required)
    description String?                                  // Post description (optional)
    image       String?                                  // Image URL (optional)
    createdAt   DateTime @default(now())                 // Timestamp when created
    updatedAt   DateTime @updatedAt                      // Auto-updates when post is modified
    createdBy   User     @relation(...)                  // Link to the User who created it
    createdById String                                   // Foreign key - stores the User's ID
}
```

**Line-by-line:**
- `@default(autoincrement())` - Database automatically assigns 1, 2, 3, etc.
- `@default(now())` - Automatically sets to current date/time when created
- `@updatedAt` - Prisma automatically updates this whenever the record changes
- `@relation` - Creates a foreign key relationship to another table

---

## 🔧 Database Client

### 📂 File: `src/server/db.ts`

**What this file does:** Creates a single Prisma client instance that the whole app uses to talk to the database.

```typescript
import { PrismaClient } from "../../generated/prisma";

// This prevents creating multiple database connections in development
// (Next.js hot reloading would create a new connection each time otherwise)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Use existing client if available, otherwise create a new one
export const db = globalForPrisma.prisma ?? new PrismaClient({ log: ["query"] });

// In development, save the client to the global object so it persists
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

**How to use it anywhere:**
```typescript
import { db } from "~/server/db";

// CREATE - Insert a new record
await db.post.create({ 
    data: { name: "Hello", createdById: "user123" } 
});

// READ - Get all records
const allPosts = await db.post.findMany();

// READ - Get one record by ID
const onePost = await db.post.findUnique({ where: { id: 1 } });

// UPDATE - Modify a record
await db.post.update({ 
    where: { id: 1 }, 
    data: { name: "Updated title" } 
});

// DELETE - Remove a record
await db.post.delete({ where: { id: 1 } });
```

---

## 🔐 Authentication

### 📂 File: `src/server/auth/config.ts`

**What this file does:** Configures NextAuth.js - the library that handles user login/logout. Sets up two ways to sign in: Discord OAuth and email/password.

```typescript
export const authConfig = {
    providers: [
        // DISCORD OAUTH - Let users sign in with their Discord account
        DiscordProvider({
            clientId: process.env.AUTH_DISCORD_ID!,      // From Discord Developer Portal
            clientSecret: process.env.AUTH_DISCORD_SECRET!, // From Discord Developer Portal
        }),
        
        // CREDENTIALS - Email/password login
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            // This function runs when someone tries to log in
            async authorize(credentials) {
                // 1. Find user in database by email
                // 2. Check if password matches
                // 3. Return user object if valid, null if invalid
            },
        }),
    ],
    
    // Connect NextAuth to our Prisma database
    adapter: PrismaAdapter(db),
    
    // Use JWT tokens instead of database sessions (faster)
    session: { strategy: "jwt" },
}
```

---

### 📂 File: `src/app/api/auth/signup/route.ts`

**What this file does:** API endpoint that creates new user accounts. Called when someone fills out the signup form.

```typescript
export async function POST(request: Request) {
    // 1. GET THE DATA from the request body (what the user typed in the form)
    const { name, email, password } = await request.json();
    
    // 2. CHECK IF EMAIL ALREADY EXISTS
    const existingUser = await db.user.findUnique({ 
        where: { email }  // Look for a user with this email
    });
    
    if (existingUser) {
        // Someone already registered with this email - return error
        return NextResponse.json(
            { error: "Email already registered" }, 
            { status: 400 }  // 400 = Bad Request
        );
    }
    
    // 3. HASH THE PASSWORD (never store plain text passwords!)
    // SHA256 converts "password123" into "ef92b778..."
    const hashedPassword = crypto.createHash("sha256")
        .update(password)
        .digest("hex");
    
    // 4. CREATE THE USER in the database
    const user = await db.user.create({
        data: { 
            name,                    // From form
            email,                   // From form  
            password: hashedPassword // Hashed version
        },
    });
    
    // 5. RETURN SUCCESS with the new user data
    return NextResponse.json(
        { user }, 
        { status: 201 }  // 201 = Created
    );
}
```

---

### 📂 File: `src/app/api/auth/login/route.ts`

**What this file does:** Custom login endpoint that verifies email/password and creates a session cookie. We use this instead of NextAuth's built-in credentials because of a CSRF bug.

```typescript
export async function POST(request: Request) {
    // 1. GET LOGIN CREDENTIALS from request
    const { email, password } = await request.json();
    
    // 2. FIND THE USER in database
    const user = await db.user.findUnique({ where: { email } });
    
    // 3. HASH THE PASSWORD the user entered (to compare with stored hash)
    const hashedPassword = hashPassword(password);
    
    // 4. CHECK IF USER EXISTS AND PASSWORD MATCHES
    if (!user || user.password !== hashedPassword) {
        return NextResponse.json(
            { error: "Invalid email or password" }, 
            { status: 401 }  // 401 = Unauthorized
        );
    }
    
    // 5. CREATE A JWT TOKEN (encrypted data that proves who the user is)
    const token = await encode({
        token: {
            sub: user.id,      // Subject = user ID
            name: user.name,
            email: user.email,
            exp: now + 30 * 24 * 60 * 60,  // Expires in 30 days
        },
        secret,                // Secret key to encrypt the token
        salt: "authjs.session-token",
    });
    
    // 6. SET THE COOKIE in the response
    // This cookie will be sent with every future request to identify the user
    response.headers.set("Set-Cookie", 
        `authjs.session-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
    );
    
    // 7. RETURN SUCCESS
    return response;
}
```

**Key concepts:**
- **JWT (JSON Web Token)** - Encrypted string containing user info
- **HttpOnly cookie** - JavaScript can't access it (security)
- **The cookie** - Browser sends it with every request so server knows who you are

---

### How to check if a user is logged in (use anywhere on server):

```typescript
import { auth } from "~/server/auth";

// auth() reads the cookie, decodes the JWT, and returns session info
const session = await auth();

if (session?.user) {
    // User IS logged in
    console.log("User ID:", session.user.id);
    console.log("User name:", session.user.name);
} else {
    // User is NOT logged in
}
```

---

## 📄 Pages

### 📂 File: `src/app/page.tsx` (Homepage)

**What this file does:** The main page of the app. Shows posts, lets logged-in users create posts, and shows edit/delete buttons on posts you own.

```typescript
export default async function HomePage() {
    // 1. CHECK IF USER IS LOGGED IN
    const session = await auth();
    
    // 2. FETCH POSTS FROM DATABASE
    const posts = await db.post.findMany({
        include: {
            // Also fetch the user who created each post
            createdBy: { 
                select: { id: true, name: true }  // Only get id and name
            }
        },
        orderBy: { createdAt: "desc" },  // Newest first
        take: 20,                         // Limit to 20 posts
    });
    
    // 3. RENDER THE PAGE
    return (
        <main>
            {/* Only show create form if logged in */}
            {session && <CreatePostForm />}
            
            {/* Loop through posts and display each one */}
            {posts.map((post) => (
                <PostCard 
                    key={post.id} 
                    post={post} 
                    // Check if current user owns this post
                    isOwner={session?.user?.id === post.createdById} 
                />
            ))}
        </main>
    );
}
```

**Server Action - Creating a post:**

```typescript
async function createPost(formData: FormData) {
    "use server";  // ← This makes the function run on the SERVER, not in browser
    
    // 1. VERIFY USER IS LOGGED IN
    const session = await auth();
    if (!session?.user?.id) return;  // Exit if not logged in
    
    // 2. GET FORM DATA
    // formData comes from the HTML form submission
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const image = formData.get("image") as string;
    
    // 3. INSERT INTO DATABASE
    await db.post.create({
        data: { 
            name,                           // Post title
            description: description || null, // Description (or null if empty)
            image: image || null,           // Image URL (or null if empty)
            createdById: session.user.id    // Link to the logged-in user
        },
    });
    
    // 4. REFRESH THE PAGE to show the new post
    revalidatePath("/");
}
```

**Server Action - Deleting a post:**

```typescript
async function deletePost() {
    "use server";
    
    // Delete the post from database
    await db.post.delete({ where: { id: post.id } });
    
    // Refresh the page so deleted post disappears
    revalidatePath("/");
}
```

---

### 📂 File: `src/app/posts/[id]/edit/page.tsx` (Edit Post Page)

**What this file does:** Edit form for a specific post. The `[id]` in the folder name means it's a dynamic route - `/posts/5/edit` would edit post with ID 5.

```typescript
export default async function EditPostPage({ params }) {
    // 1. GET THE POST ID FROM THE URL
    // If URL is /posts/5/edit, then id = "5"
    const { id } = await params;
    const postId = parseInt(id);  // Convert string to number
    
    // 2. CHECK USER IS LOGGED IN
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/auth/signin");  // Send to login page
    }
    
    // 3. FETCH THE POST FROM DATABASE
    const post = await db.post.findUnique({ 
        where: { id: postId } 
    });
    
    // 4. CHECK IF USER OWNS THE POST
    if (post.createdById !== session.user.id) {
        redirect("/");  // Not owner? Send home
    }
    
    // 5. SERVER ACTION TO UPDATE THE POST
    async function updatePost(formData: FormData) {
        "use server";
        
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const image = formData.get("image") as string;
        
        // Update the post in database
        await db.post.update({
            where: { id: postId },
            data: { name, description, image },
        });
        
        redirect("/");  // Go back to homepage
    }
    
    // 6. RENDER FORM with current values pre-filled
    return (
        <form action={updatePost}>
            <input name="name" defaultValue={post.name} />
            <textarea name="description" defaultValue={post.description} />
            <input name="image" defaultValue={post.image} />
            <button type="submit">Save Changes</button>
        </form>
    );
}
```

---

### 📂 File: `src/app/auth/signin/page.tsx` (Sign In Page)

**What this file does:** Login page with Discord button and email/password form. Uses `"use client"` because it needs JavaScript interactivity.

```typescript
"use client";  // ← This component runs in the BROWSER (can use useState, onClick, etc.)

import { useState } from "react";
import { signIn } from "next-auth/react";

function SignInForm() {
    // State to store form input values
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    
    // Handle form submission
    const handleCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();  // Stop page from refreshing
        
        // Call our custom login API
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Login successful! Redirect to homepage
            router.push("/");
            router.refresh();  // Refresh to update session
        } else {
            // Show error message
            setError(data.error);
        }
    };
    
    // Handle Discord sign in
    const handleDiscordSignIn = () => {
        // signIn() is a NextAuth function that redirects to Discord
        signIn("discord", { callbackUrl: "/" });
    };
    
    return (
        <div>
            <button onClick={handleDiscordSignIn}>Sign in with Discord</button>
            
            <form onSubmit={handleCredentialsSubmit}>
                <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                />
                <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                />
                <button type="submit">Sign In</button>
            </form>
            
            {error && <p>{error}</p>}
        </div>
    );
}
```

---

## 🔌 API Routes

### 📂 File: `src/app/api/posts/route.ts`

**What this file does:** Handles GET (list all posts) and POST (create post) requests to `/api/posts`

```typescript
// GET /api/posts - Returns all posts as JSON
export async function GET() {
    // Fetch all posts with their authors
    const posts = await db.post.findMany({
        include: { 
            createdBy: { 
                select: { id: true, name: true, email: true } 
            } 
        },
        orderBy: { createdAt: "desc" },
    });
    
    // Return as JSON response
    return NextResponse.json(posts);
}

// POST /api/posts - Creates a new post
export async function POST(request: Request) {
    // 1. Check if user is logged in
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Unauthorized" }, 
            { status: 401 }
        );
    }
    
    // 2. Get data from request body
    const { name, description, image } = await request.json();
    
    // 3. Validate required fields
    if (!name) {
        return NextResponse.json(
            { error: "Post name is required" }, 
            { status: 400 }
        );
    }
    
    // 4. Create the post
    const post = await db.post.create({
        data: { 
            name, 
            description, 
            image, 
            createdById: session.user.id 
        },
    });
    
    // 5. Return the created post
    return NextResponse.json(post, { status: 201 });
}
```

---

### 📂 File: `src/app/api/posts/[id]/route.ts`

**What this file does:** Handles GET (single post), PUT (update), and DELETE for `/api/posts/123`

```typescript
// GET /api/posts/123 - Get a single post
export async function GET(request: Request, { params }) {
    const { id } = await params;
    
    const post = await db.post.findUnique({ 
        where: { id: parseInt(id) } 
    });
    
    if (!post) {
        return NextResponse.json(
            { error: "Post not found" }, 
            { status: 404 }
        );
    }
    
    return NextResponse.json(post);
}

// PUT /api/posts/123 - Update a post
export async function PUT(request: Request, { params }) {
    const session = await auth();
    const { id } = await params;
    
    // Find the post
    const existingPost = await db.post.findUnique({ 
        where: { id: parseInt(id) } 
    });
    
    // Check if user owns the post
    if (existingPost.createdById !== session.user.id) {
        return NextResponse.json(
            { error: "Forbidden - You can only edit your own posts" }, 
            { status: 403 }  // 403 = Forbidden
        );
    }
    
    // Update the post
    const { name, description, image } = await request.json();
    const post = await db.post.update({
        where: { id: parseInt(id) },
        data: { name, description, image },
    });
    
    return NextResponse.json(post);
}

// DELETE /api/posts/123 - Delete a post
export async function DELETE(request: Request, { params }) {
    const session = await auth();
    const { id } = await params;
    
    // Check ownership (same as PUT)
    const existingPost = await db.post.findUnique({ 
        where: { id: parseInt(id) } 
    });
    
    if (existingPost.createdById !== session.user.id) {
        return NextResponse.json(
            { error: "Forbidden" }, 
            { status: 403 }
        );
    }
    
    // Delete the post
    await db.post.delete({ where: { id: parseInt(id) } });
    
    return NextResponse.json({ message: "Post deleted successfully" });
}
```

---

## 📚 Swagger API Documentation

### 📂 File: `src/lib/swagger.ts`

**What this file does:** Defines the OpenAPI/Swagger schema that generates the API documentation page.

```typescript
export const getApiDocs = async () => {
    const spec = createSwaggerSpec({
        apiFolder: "src/app/api",  // Where to scan for API routes
        definition: {
            openapi: "3.0.0",
            info: { 
                title: "T3 Stack API", 
                version: "1.0.0" 
            },
            components: {
                schemas: {
                    // Define what a "Post" looks like in the API
                    Post: {
                        type: "object",
                        properties: {
                            id: { type: "integer" },
                            name: { type: "string" },
                            description: { type: "string", nullable: true },
                            image: { type: "string", nullable: true },
                        },
                    },
                },
            },
        },
    });
    return spec;
};
```

**Access at:** http://localhost:3000/api-docs

---

## 🔑 Key Concepts Summary

| Concept | What it means |
|---------|---------------|
| **Server Component** | Runs on server, can access database directly, no useState/useEffect |
| **Client Component** | Runs in browser, can use React hooks, needs `"use client"` |
| **Server Action** | Function with `"use server"` that runs on server but can be called from forms |
| **API Route** | File in `app/api/` that handles HTTP requests (GET, POST, PUT, DELETE) |
| **JWT** | Encrypted token stored in cookie that identifies the logged-in user |
| **Prisma** | ORM that lets you use JavaScript to query the database |

---

## 🛠️ Commands

```bash
npm run dev              # Start development server (http://localhost:3000)
npx prisma studio        # Open database GUI (http://localhost:5555)
npx prisma db push       # Apply schema changes to database
npx prisma db push --force-reset  # Delete all data and recreate tables
npm run build            # Build for production
```

---

## 📍 Quick Reference Table

| What to show | File location |
|--------------|---------------|
| Database schema | `prisma/schema.prisma` |
| Database client | `src/server/db.ts` |
| Homepage & CRUD | `src/app/page.tsx` |
| Sign in page | `src/app/auth/signin/page.tsx` |
| Sign up page | `src/app/auth/signup/page.tsx` |
| Edit post page | `src/app/posts/[id]/edit/page.tsx` |
| Posts API (list/create) | `src/app/api/posts/route.ts` |
| Posts API (get/update/delete) | `src/app/api/posts/[id]/route.ts` |
| Users API | `src/app/api/users/route.ts` |
| Auth config | `src/server/auth/config.ts` |
| Custom login API | `src/app/api/auth/login/route.ts` |
| Signup API | `src/app/api/auth/signup/route.ts` |
| Swagger config | `src/lib/swagger.ts` |
| Environment vars | `.env` |
