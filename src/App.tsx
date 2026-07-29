import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
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
import Overtime from "@/pages/Overtime";
import FoodVoucher from "@/pages/FoodVoucher";
import ExpenseControl from "@/pages/ExpenseControl";
import Fluxo from "@/pages/Fluxo";
import FinanceDashboard from "@/pages/FinanceDashboard";
import FinanceCalendar from "@/pages/FinanceCalendar";
import ResumoDiario from "@/pages/ResumoDiario";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedPage = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
              <Route path="/funcionarios" element={<ProtectedPage><Employees /></ProtectedPage>} />
              <Route path="/funcionarios/:id" element={<ProtectedPage><EmployeeProfile /></ProtectedPage>} />
              <Route path="/novo-funcionario" element={<ProtectedPage><NewEmployee /></ProtectedPage>} />
              <Route path="/avaliacoes" element={<ProtectedPage><Evaluations /></ProtectedPage>} />
              <Route path="/desligamentos" element={<ProtectedPage><Terminations /></ProtectedPage>} />
              <Route path="/relatorios" element={<ProtectedPage><Reports /></ProtectedPage>} />
              <Route path="/usuarios" element={<ProtectedPage><Users /></ProtectedPage>} />
              <Route path="/historico" element={<ProtectedPage><AuditLog /></ProtectedPage>} />
              <Route path="/salarios" element={<ProtectedPage><Salaries /></ProtectedPage>} />
              <Route path="/salario-liquido" element={<ProtectedPage><NetSalary /></ProtectedPage>} />
              <Route path="/vale-alimentacao" element={<ProtectedPage><FoodVoucher /></ProtectedPage>} />
              <Route path="/vale-transporte" element={<ProtectedPage><TransportationVoucher /></ProtectedPage>} />
              <Route path="/horas-extras" element={<ProtectedPage><Overtime /></ProtectedPage>} />
              <Route path="/controle-despesas" element={<ProtectedPage><ExpenseControl /></ProtectedPage>} />
              <Route path="/fluxo" element={<ProtectedPage><Fluxo /></ProtectedPage>} />
              <Route path="/dashboard-financas" element={<ProtectedPage><FinanceDashboard /></ProtectedPage>} />
              <Route path="/calendario-financas" element={<ProtectedPage><FinanceCalendar /></ProtectedPage>} />
              <Route path="/configuracoes" element={<ProtectedPage><SettingsPage /></ProtectedPage>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
