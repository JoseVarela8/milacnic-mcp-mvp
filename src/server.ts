import dotenv from "dotenv";
dotenv.config();

import { app } from "./app";

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`MCP MiLACNIC MVP running on port ${port}`);
});
