"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import AuthShell, {
  GithubButton,
  GoogleButton,
  InputGroup,
  OrDivider,
  PasswordInput,
} from "../components/auth/AuthShell";

const API = "http://localhost:3001/api";

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formStatus, setFormStatus] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      router.replace("/boards");
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFormStatus("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API}/auth/signup`, {
        username,
        email,
        password,
      });

      const token = res.data.token;
      localStorage.setItem("token", token);
      router.push("/boards");
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Sign up failed"
          : "Sign up failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Join Flowsilk"
      subtitle="Follow these 3 quick steps to activate your space."
      steps={[
        { number: 1, text: "Register your identity", active: true },
        { number: 2, text: "Build your skill profile" },
        { number: 3, text: "Ship with your team" },
      ]}
    >
      <header className="space-y-2">
        <h2 className="text-3xl font-medium tracking-tight">
          Create New Profile
        </h2>
        <p className="text-white/40 text-sm">
          Input your basic details to begin the journey.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <GoogleButton onClick={() => setFormStatus("Google sign-up selected.")} />
        <GithubButton onClick={() => setFormStatus("GitHub sign-up selected.")} />
      </div>

      <OrDivider />

      {error && (
        <div className="p-3 bg-red-400/10 border border-red-400/20 text-red-400 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <InputGroup
            label="Username"
            placeholder="johndoe"
            type="text"
            value={username}
            onChange={setUsername}
          />
          <InputGroup
            label="Email"
            placeholder="ava@studio.com"
            type="email"
            value={email}
            onChange={setEmail}
          />
        </div>

        <PasswordInput
          label="Password"
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
          hint="Requires at least 8 symbols."
        />

        <PasswordInput
          label="Confirm Password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={setConfirmPassword}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 bg-white text-black font-semibold rounded-xl hover:bg-white/90 active:scale-[0.98] mt-4 text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p
        className="min-h-5 text-center text-sm text-white/60"
        role="status"
      >
        {formStatus}
      </p>

      <p className="text-center text-sm text-white/40">
        Member of the team?{" "}
        <Link
          href="/signin"
          className="font-medium text-white underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}