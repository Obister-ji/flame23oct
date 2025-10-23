import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import AIAgents from "./pages/AIAgents";
import BackgroundRemover from "./pages/BackgroundRemover";
import Pathfindra from "./pages/Pathfindra";
import EmailWriter from "./pages/EmailWriter";
import PromptWriter from "./pages/PromptWriter";
import TaskForce from "./pages/TaskForce";
import MediaMama from "./pages/MediaMama";
import MCPPlayground from "./components/MCPPlayground";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import FlameClerkProvider from "./providers/ClerkProvider";
import { SignedIn, SignedOut, SignInButton, UserButton } from "./components/ClerkAuthWrapper";
import { SecureChatWidget } from "./components/SecureChatWidget";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <FlameClerkProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/agents" element={<AIAgents />} />
            <Route path="/background-remover" element={<BackgroundRemover />} />
            <Route path="/pathfindra" element={<Pathfindra />} />
            <Route path="/email-writer" element={<EmailWriter />} />
            <Route path="/prompt-writer" element={<PromptWriter />} />
            <Route path="/task-force" element={<TaskForce />} />
            <Route path="/media-mama" element={<MediaMama />} />
            <Route path="/mcp-playground" element={<MCPPlayground />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <SecureChatWidget />
        </BrowserRouter>
      </TooltipProvider>
    </FlameClerkProvider>
  </QueryClientProvider>
);

export default App;
