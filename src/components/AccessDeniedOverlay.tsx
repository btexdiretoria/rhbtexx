import { ShieldAlert } from 'lucide-react';

export default function AccessDeniedOverlay() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.3)' }}>
      <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl text-center max-w-md mx-4">
        <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-lg font-heading font-bold text-foreground mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground">Solicite permissão ao administrador</p>
      </div>
    </div>
  );
}
