import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route";
import orgRoutes from "./routes/org.route";
import userRoutes from "./routes/users.route";
import boardRoutes from "./routes/board.route"
import sectionRoutes from "./routes/section.route"
import cors from "cors"

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors())

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orgs", orgRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/sections", sectionRoutes);
// app.use("/api/issues", issueRoutes);
// app.use("/api/comments", commentRoutes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});