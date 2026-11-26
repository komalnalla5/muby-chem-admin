import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
});

// http://localhost:5173/ run on browser for frontend
// http://localhost:5002/api/products?page=1&limit=10 //for api testing backend
// npm run dev // to run on mubychemadmin.in\frontend path
// open main folder in vs code not seprate
