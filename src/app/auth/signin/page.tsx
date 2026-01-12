"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const errorParam = searchParams.get("error");
  
  useEffect(() => {
    if (errorParam) {
      setError("Unable to sign in. Please check your credentials.");
    }
  }, [errorParam]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Call our custom login endpoint which sets the session cookie directly
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json() as { error?: string; success?: boolean };
      
      if (!response.ok || !data.success) {
        setError(data.error ?? "Invalid email or password");
        setLoading(false);
        return;
      }
      
      // Session cookie is set, redirect to home
      router.push("/");
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleDiscordSignIn = () => {
    void signIn("discord", { callbackUrl: "/" });
  };

  return (
    <div className="page">
      <div className="signin">
        <div className="card">
          <h1 className="header">Sign In</h1>
          
          {error && (
            <div className="error">
              <p>{error}</p>
            </div>
          )}

          {/* Discord Provider */}
          <div className="provider">
            <button 
              type="button" 
              className="button discord"
              onClick={handleDiscordSignIn}
            >
              <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Sign in with Discord
            </button>
          </div>

          <div className="separator">
            <span>or</span>
          </div>

          {/* Credentials Provider */}
          <form onSubmit={handleCredentialsSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="test@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="button primary" disabled={loading}>
              {loading ? "Signing in..." : "Sign in with Email"}
            </button>
          </form>

          <p className="footer-text">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup">Sign up</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .page {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: grid;
          place-items: center;
          background-color: #161b22;
          font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
          overflow: auto;
        }
        .signin {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem;
        }
        .card {
          background-color: #0d1117;
          border-radius: 0.5rem;
          padding: 1.5rem;
          width: 100%;
          max-width: 340px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        .header {
          color: #fff;
          font-size: 1.25rem;
          font-weight: 600;
          text-align: center;
          margin-bottom: 1rem;
        }
        .error {
          background-color: #c94b4b;
          color: #fff;
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          margin-bottom: 0.75rem;
        }
        .error p {
          margin: 0;
          font-size: 0.8rem;
        }
        .provider {
          margin-bottom: 0.75rem;
        }
        .separator {
          display: flex;
          align-items: center;
          margin: 1rem 0;
          color: #444;
        }
        .separator::before,
        .separator::after {
          content: "";
          flex: 1;
          height: 1px;
          background-color: #444;
        }
        .separator span {
          padding: 0 0.75rem;
          font-size: 0.8rem;
        }
        .field {
          margin-bottom: 0.75rem;
        }
        .field label {
          display: block;
          color: #ccc;
          font-size: 0.8rem;
          font-weight: 500;
          margin-bottom: 0.35rem;
        }
        .field input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          background-color: #161b22;
          border: 1px solid #555;
          border-radius: 0.375rem;
          color: #fff;
          font-size: 0.9rem;
          box-sizing: border-box;
        }
        .field input:focus {
          outline: none;
          border-color: #157efb;
        }
        .field input::placeholder {
          color: #666;
        }
        .button {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: none;
          border-radius: 0.375rem;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: background-color 0.2s;
        }
        .button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .button.discord {
          background-color: #5865F2;
          color: #fff;
        }
        .button.discord:hover:not(:disabled) {
          background-color: #4752c4;
        }
        .button.primary {
          background-color: #157efb;
          color: #fff;
          margin-top: 0.35rem;
        }
        .button.primary:hover:not(:disabled) {
          background-color: #0f6ddb;
        }
        .icon {
          width: 1.1rem;
          height: 1.1rem;
        }
        .footer-text {
          color: #888;
          font-size: 0.8rem;
          text-align: center;
          margin-top: 1rem;
        }
        .footer-text a {
          color: #157efb;
          text-decoration: none;
        }
        .footer-text a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        backgroundColor: '#161b22',
        color: '#fff'
      }}>
        Loading...
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
