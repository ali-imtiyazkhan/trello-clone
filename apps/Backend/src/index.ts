import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});