import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const postId = parseInt(id);
  
  if (isNaN(postId)) {
    notFound();
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const post = await db.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    notFound();
  }

  // Only the owner can edit
  if (post.createdById !== session.user.id) {
    redirect("/");
  }

  async function updatePost(formData: FormData) {
    "use server";
    
    const currentSession = await auth();
    if (!currentSession?.user?.id) return;
    
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const image = formData.get("image") as string;
    
    if (!name) return;
    
    await db.post.update({
      where: { id: postId },
      data: {
        name,
        description: description || null,
        image: image || null,
      },
    });
    
    revalidatePath("/");
    redirect("/");
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#161b22] text-white">
      <div className="container flex flex-col items-center gap-8 px-4 py-16">
        <h1 className="text-4xl font-extrabold tracking-tight">Edit Post</h1>
        
        <form action={updatePost} className="flex w-full max-w-2xl flex-col gap-4 rounded-xl bg-[#0d1117] border border-[#333] p-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-300">
              Title
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={post.name}
              placeholder="Post title..."
              className="rounded-lg bg-[#161b22] border border-[#444] px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#157efb] focus:border-transparent"
              required
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-300">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              defaultValue={post.description ?? ""}
              placeholder="Write a description (optional)..."
              rows={4}
              className="rounded-lg bg-[#161b22] border border-[#444] px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#157efb] focus:border-transparent resize-none"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label htmlFor="image" className="text-sm font-medium text-gray-300">
              Image URL
            </label>
            <input
              type="url"
              id="image"
              name="image"
              defaultValue={post.image ?? ""}
              placeholder="https://example.com/image.jpg"
              className="rounded-lg bg-[#161b22] border border-[#444] px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#157efb] focus:border-transparent"
            />
          </div>

          {/* Image Preview */}
          {post.image && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-300">Current Image</span>
              <div className="rounded-lg overflow-hidden border border-[#333]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.image}
                  alt={post.name}
                  className="w-full max-h-48 object-cover"
                />
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-[#157efb] px-4 py-2 font-semibold text-white hover:bg-[#0f6ddb] transition-colors"
            >
              Save Changes
            </button>
            <Link
              href="/"
              className="rounded-lg bg-[#1a1f26] border border-[#444] px-4 py-2 font-semibold text-center hover:bg-[#252b33] transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
