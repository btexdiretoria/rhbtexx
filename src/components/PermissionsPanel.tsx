import { useSystemUsers } from '@/hooks/useFinancial';
import { useUserPermissions, useUpsertPermission, ALL_SECTIONS } from '@/hooks/usePermissions';
import { Switch } from '@/components/ui/switch';

export default function PermissionsPanel() {
  const { data: users = [] } = useSystemUsers();
  const { data: permissions = [] } = useUserPermissions();
  const upsert = useUpsertPermission();

  const getAccess = (userId: string, sectionKey: string) => {
    const p = permissions.find(p => p.user_id === userId && p.section_key === sectionKey);
    return p ? p.has_access : true; // default true
  };

  const toggle = (userId: string, sectionKey: string) => {
    const current = getAccess(userId, sectionKey);
    upsert.mutate({ user_id: userId, section_key: sectionKey, has_access: !current });
  };

  // Only show non-admin users
  const nonAdminUsers = users.filter(u => u.nivel_acesso !== 'Administrador');

  return (
    <div className="kpi-card space-y-4">
      <h3 className="font-heading font-semibold text-foreground">Permissões de Acesso</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Usuário</th>
              {ALL_SECTIONS.map(s => (
                <th key={s.key} className="text-center py-2 px-2 text-muted-foreground font-medium whitespace-nowrap">{s.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nonAdminUsers.map(user => (
              <tr key={user.id} className="border-b border-border/50">
                <td className="py-3 pr-4">
                  <div>
                    <p className="font-medium text-foreground">{user.nome}</p>
                    <p className="text-xs text-muted-foreground">{user.nivel_acesso}</p>
                  </div>
                </td>
                {ALL_SECTIONS.map(s => (
                  <td key={s.key} className="text-center py-3 px-2">
                    <Switch
                      checked={getAccess(user.id, s.key)}
                      onCheckedChange={() => toggle(user.id, s.key)}
                    />
                  </td>
                ))}
              </tr>
            ))}
            {nonAdminUsers.length === 0 && (
              <tr><td colSpan={ALL_SECTIONS.length + 1} className="py-4 text-center text-muted-foreground">Nenhum usuário não-administrador encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
