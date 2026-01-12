import Link from "next/link";
import { auth, signOut } from "~/server/auth";
import { db } from "~/server/db";
import { revalidatePath } from "next/cache";

export default async function HomePage() {
  const session = await auth();
  
  const posts = await db.post.findMany({
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#161b22] text-white">
      <div className="container flex flex-col items-center gap-8 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          <span className="text-[#157efb]">Post</span>ing
        </h1>
        
        {/* Auth Section */}
        <div className="flex flex-col items-center gap-4">
          {session ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-lg">
                Welcome, <span className="font-bold">{session.user?.name ?? session.user?.email}</span>!
              </p>
              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <button
                  type="submit"
                  className="rounded-full bg-[#0d1117] border border-[#444] px-6 py-2 font-semibold hover:bg-[#1a1f26] transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex gap-4">
              <Link
                href="/auth/signin"
                className="rounded-full bg-[#157efb] px-6 py-2 font-semibold hover:bg-[#0f6ddb] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-full bg-[#0d1117] border border-[#444] px-6 py-2 font-semibold hover:bg-[#1a1f26] transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Create Post Form */}
        {session && <CreatePostForm />}

        {/* Posts List */}
        <div className="w-full max-w-3xl">
          <h2 className="mb-4 text-2xl font-bold">Recent Posts</h2>
          {posts.length === 0 ? (
            <p className="text-gray-400">No posts yet. Be the first to create one!</p>
          ) : (
            <div className="flex flex-col gap-4">
              {posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  isOwner={session?.user?.id === post.createdById}
                />
              ))}
            </div>
          )}
        </div>

        {/* API Docs Link */}
        <Link
          className="flex max-w-xs flex-col gap-4 rounded-xl bg-[#0d1117] border border-[#333] p-4 text-white hover:bg-[#1a1f26] transition-colors"
          href="/api-docs"
        >
          <h3 className="text-2xl font-bold">API Docs →</h3>
          <div className="text-lg text-gray-300">
            View Swagger UI documentation for all API endpoints.
          </div>
        </Link>
      </div>
    </main>
  );
}

async function CreatePostForm() {
  async function createPost(formData: FormData) {
    "use server";
    
    const session = await auth();
    if (!session?.user?.id) return;
    
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const image = formData.get("image") as string;
    
    if (!name) return;
    
    await db.post.create({
      data: {
        name,
        description: description || null,
        image: image || null,
        createdById: session.user.id,
      },
    });
    
    revalidatePath("/");
  }

  return (
    <form action={createPost} className="flex w-full max-w-2xl flex-col gap-3 rounded-xl bg-[#0d1117] border border-[#333] p-4">
      <h3 className="text-lg font-semibold">Create a New Post</h3>
      <input
        type="text"
        name="name"
        placeholder="Post title..."
        className="rounded-lg bg-[#161b22] border border-[#444] px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#157efb] focus:border-transparent"
        required
      />
      <textarea
        name="description"
        placeholder="Write a description (optional)..."
        rows={3}
        className="rounded-lg bg-[#161b22] border border-[#444] px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#157efb] focus:border-transparent resize-none"
      />
      <input
        type="url"
        name="image"
        placeholder="Image URL (optional)..."
        className="rounded-lg bg-[#161b22] border border-[#444] px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#157efb] focus:border-transparent"
      />
      <button
        type="submit"
        className="rounded-lg bg-[#157efb] px-4 py-2 font-semibold text-white hover:bg-[#0f6ddb] transition-colors"
      >
        Create Post
      </button>
    </form>
  );
}

interface PostData {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  createdAt: Date;
  createdById: string;
  createdBy: {
    id: string;
    name: string | null;
  };
}

function PostCard({ post, isOwner }: { post: PostData; isOwner: boolean }) {
  async function deletePost() {
    "use server";
    await db.post.delete({ where: { id: post.id } });
    revalidatePath("/");
  }

  return (
    <div className="rounded-xl bg-[#0d1117] border border-[#333] p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold">{post.name}</h3>
          <p className="text-sm text-gray-400">
            By {post.createdBy.name ?? "Anonymous"} • {new Date(post.createdAt).toLocaleDateString()}
          </p>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <Link
              href={`/posts/${post.id}/edit`}
              className="rounded-lg bg-[#1a1f26] border border-[#444] px-3 py-1 text-sm hover:bg-[#252b33] transition-colors"
            >
              Edit
            </Link>
            <form action={deletePost}>
              <button
                type="submit"
                className="rounded-lg bg-red-900/30 border border-red-800 px-3 py-1 text-sm text-red-400 hover:bg-red-900/50 transition-colors"
              >
                Delete
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Description */}
      {post.description && (
        <p className="text-gray-300">{post.description}</p>
      )}

      {/* Image */}
      {post.image && (
        <div className="rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image}
            alt={post.name}
            className="w-full max-h-96 object-cover"
          />
        </div>
      )}
    </div>
  );
}
