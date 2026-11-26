import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 5002;

const server = app.listen(PORT, () => {
  console.log(`Admin backend running on http://localhost:${PORT}`);
});

server.on("error", (err) => {
  console.error("Server error:", err.message);
});