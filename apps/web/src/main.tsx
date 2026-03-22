import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@chat/ui/globals.css"
import App from "./App"
import { ThemeProvider } from "@/components/theme-provider.tsx"

// 添加全局样式覆盖
import "./styles/global-overrides.css"

// 添加字体优化
const loadFonts = () => {
  // 预加载关键字体
  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = 'https://fonts.googleapis.com'
  document.head.appendChild(link)
  
  const link2 = document.createElement('link')
  link2.rel = 'preconnect'
  link2.href = 'https://fonts.gstatic.com'
  link2.crossOrigin = 'anonymous'
  document.head.appendChild(link2)
}

// 在渲染前加载字体
loadFonts()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider 
      defaultTheme="system"
      storageKey="chat-ui-theme"
      disableTransitionOnChange={false}
    >
      <div className="app-container">
        <App />
      </div>
    </ThemeProvider>
  </StrictMode>
)
