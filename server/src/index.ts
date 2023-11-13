import express from "express";
import cors from "cors";
import { authRoutes } from "./routes/auth";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "success" });
});

app.listen(3333, () => {
  console.log("listening on http://localhost:3333");
});
