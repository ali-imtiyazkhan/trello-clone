import axios from "axios";
import React, { useState } from "react"
import { useRouter } from "next/router";

export default function () {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter()

    async function onsubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        try {

            const res = await axios.post("http://localhost:3001/auth/signin", {
                password, email
            })

            const token = res.data.token
            localStorage.setItem("token", token)
            console.log("res is ", res)

            router.push("/")


        } catch (error) {
            console.log(error)
        }
    }


    return <div>

        <form onSubmit={onsubmit}>

            <input onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Enter your email here" />

            <input onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Enter your password here " />

            <button type="submit">Enter</button>

        </form>

    </div>
}