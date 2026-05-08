import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.routes";
import { chatRouter } from "./routes/chat.routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/mcp/chat", chatRouter);
