import { Router } from "express";
import { handleChatMessage } from "../orchestrator/chatOrchestrator";

export const chatRouter = Router();

chatRouter.post("/message", async (req, res) => {
  try {
    if (!req.body.message) {
      return res.status(400).json({
        status: "ERROR",
        message: "El mensaje es obligatorio."
      });
    }

    const response = await handleChatMessage(req.body);
    return res.json(response);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "ERROR",
      message: "Ocurrió un error procesando el mensaje."
    });
  }
});
