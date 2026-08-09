import express from "express"
const app = express();
import dotenv from "dotenv";
dotenv.config();
import { prisma } from "prisma"
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'


app.use(express.json());

app.post("/signup", async (req, res) => {

    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(411).json({
            message: "Please provide username,password and email"
        })
    }
    try {
        const user = await prisma.user.findMany(
            {
                where: {
                    email: email
                }
            }
        )
        if (user.length > 0) {
            return res.status(411).json({
                message: "User already exists"
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email: email,
                username: username,
                password: hashedPassword
            }
        })
        const token = jwt.sign({ userid: newUser.id }, process.env.JWT_SECRET || "here_we_go_again");



        res.status(200).json({
            message: "User created successfully",
            newUser
        })


    } catch (error) {
        console.log(error);
        return res.status(411).json({
            message: "Internal server error"
        })
    }
})




app.listen(3000, () => {
    console.log("your app is running on the port 3000");
});