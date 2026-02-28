import { createRoot } from "react-dom/client"
import { ExportPlayer } from "./ExportPlayer"

const root = document.getElementById("root")
if (!root) throw new Error("Root element not found")

createRoot(root).render(<ExportPlayer />)
