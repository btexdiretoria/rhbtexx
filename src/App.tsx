import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import EmployeeProfile from "@/pages/EmployeeProfile";
import NewEmployee from "@/pages/NewEmployee";
import Evaluations from "@/pages/Evaluations";
import Terminations from "@/pages/Terminations";
import Reports from "@/pages/Reports";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/funcionarios" element={<AppLayout><Employees /></AppLayout>} />
          <Route path="/funcionarios/:id" element={<AppLayout><EmployeeProfile /></AppLayout>} />
          <Route path="/novo-funcionario" element={<AppLayout><NewEmployee /></AppLayout>} />
          <Route path="/avaliacoes" element={<AppLayout><Evaluations /></AppLayout>} />
          <Route path="/desligamentos" element={<AppLayout><Terminations /></AppLayout>} />
          <Route path="/relatorios" element={<AppLayout><Reports /></AppLayout>} />
          <Route path="/configuracoes" element={<AppLayout><SettingsPage /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
