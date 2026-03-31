import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import EmployeeProfile from "@/pages/EmployeeProfile";
import NewEmployee from "@/pages/NewEmployee";
import Evaluations from "@/pages/Evaluations";
import Terminations from "@/pages/Terminations";
import Reports from "@/pages/Reports";
import SettingsPage from "@/pages/SettingsPage";
import Users from "@/pages/Users";
import AuditLog from "@/pages/AuditLog";
import Salaries from "@/pages/Salaries";
import NetSalary from "@/pages/NetSalary";
import TransportationVoucher from "@/pages/TransportationVoucher";
import FoodVoucher from "@/pages/FoodVoucher";
import ExpenseControl from "@/pages/ExpenseControl";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AppProvider>
          <Routes>
            <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/funcionarios" element={<AppLayout><Employees /></AppLayout>} />
            <Route path="/funcionarios/:id" element={<AppLayout><EmployeeProfile /></AppLayout>} />
            <Route path="/novo-funcionario" element={<AppLayout><NewEmployee /></AppLayout>} />
            <Route path="/avaliacoes" element={<AppLayout><Evaluations /></AppLayout>} />
            <Route path="/desligamentos" element={<AppLayout><Terminations /></AppLayout>} />
            <Route path="/relatorios" element={<AppLayout><Reports /></AppLayout>} />
            <Route path="/usuarios" element={<AppLayout><Users /></AppLayout>} />
            <Route path="/historico" element={<AppLayout><AuditLog /></AppLayout>} />
            <Route path="/salarios" element={<AppLayout><Salaries /></AppLayout>} />
            <Route path="/salario-liquido" element={<AppLayout><NetSalary /></AppLayout>} />
            <Route path="/vale-alimentacao" element={<AppLayout><FoodVoucher /></AppLayout>} />
            <Route path="/vale-transporte" element={<AppLayout><TransportationVoucher /></AppLayout>} />
            <Route path="/configuracoes" element={<AppLayout><SettingsPage /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
