"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Login() {
    const [username, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");

    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        try {
            const res = await axios.post("http://localhost:3001/api/auth/signup", {
                username,
                email,
                password,
            });

            console.log("Login response:", res.data);

            const token = res.data.token;

            localStorage.setItem("token", token);

            router.push("/");
        } catch (error: any) {
            console.error(
                "Login failed:",
                error.response?.data?.message || error.message
            );
        }
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUserName(e.target.value)}
                />

                <input
                    type="email"
                    placeholder="Enter your email here"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Enter your password here"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button type="submit">Click here</button>
            </form>
        </div>
    );
}