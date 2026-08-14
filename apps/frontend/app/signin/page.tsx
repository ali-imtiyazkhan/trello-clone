"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import AuthShell, {
  GithubButton,
  GoogleButton,
  OrDivider,
  PasswordInput,
} from "../components/auth/AuthShell";

const API = "http://localhost:3001/api";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formStatus, setFormStatus] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      router.replace("/boards");
    }
  }, [router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFormStatus("");

    setLoading(true);

    try {
      const res = await axios.post(`${API}/auth/signin`, {
        email,
        password,
      });

      const token = res.data.token;
      localStorage.setItem("token", token);
      router.push("/boards");
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Sign in failed"
          : "Sign in failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue building with your team."
      steps={[
        { number: 1, text: "Register your identity", active: true },
        { number: 2, text: "Build your skill profile" },
        { number: 3, text: "Ship with your team" },
      ]}
    >
      <header className="space-y-2">
        <h2 className="text-3xl font-medium tracking-tight">Sign In</h2>
        <p className="text-white/40 text-sm">
          Access your boards and skill profile.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <GoogleButton onClick={() => setFormStatus("Google sign-in selected.")} />
        <GithubButton onClick={() => setFormStatus("GitHub sign-in selected.")} />
      </div>

      <OrDivider />

      {error && (
        <div className="p-3 bg-red-400/10 border border-red-400/20 text-red-400 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-white">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ava@studio.com"
              required
              className="w-full bg-[#1a1a1a] border-none rounded-xl h-11 px-4 text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-white/20 transition-shadow duration-200"
            />
          </div>

          <PasswordInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 bg-white text-black font-semibold rounded-xl hover:bg-white/90 active:scale-[0.98] mt-4 text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="min-h-5 text-center text-sm text-white/60" role="status">
        {formStatus}
      </p>

      <p className="text-center text-sm text-white/40">
        New here?{" "}
        <Link
          href="/signup"
          className="font-medium text-white underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}