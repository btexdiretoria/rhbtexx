import { useMemo, useState } from 'react';
import { Plus, Trash2, FileDown, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import { useEmployees } from '@/hooks/useEmployees';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Linha { id: string; descricao: string; valor: string; }

const uid = () => Math.random().toString(36).slice(2);
const num = (v: string) => {
  const n = parseFloat(String(v).replace(/\./g, '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
};
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Holerites() {
  const { data: employees = [] } = useEmployees();
  const [employeeId, setEmployeeId] = useState<string>('');
  const [competencia, setCompetencia] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [proventos, setProventos] = useState<Linha[]>([{ id: uid(), descricao: '', valor: '' }]);
  const [descontos, setDescontos] = useState<Linha[]>([{ id: uid(), descricao: 'INSS', valor: '' }]);

  const employee = employees.find(e => e.id === employeeId);

  const handleSelectEmployee = (id: string) => {
    setEmployeeId(id);
    setProventos([{ id: uid(), descricao: '', valor: '' }]);
    setDescontos([{ id: uid(), descricao: 'INSS', valor: '' }]);
  };

  const totalProventos = useMemo(() => proventos.reduce((s, l) => s + num(l.valor), 0), [proventos]);
  const totalDescontos = useMemo(() => descontos.reduce((s, l) => s + num(l.valor), 0), [descontos]);
  const liquido = totalProventos - totalDescontos;

  const competenciaLabel = competencia ? `${competencia.slice(5, 7)}/${competencia.slice(0, 4)}` : '—';

  const update = (
    setter: React.Dispatch<React.SetStateAction<Linha[]>>,
    id: string,
    field: 'descricao' | 'valor',
    value: string,
  ) => setter(prev => prev.map(l => (l.id === id ? { ...l, [field]: value } : l)));

  const downloadPdf = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210;
    const M = 15;
    let y = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('RECIBO DE PAGAMENTO', W / 2, y, { align: 'center' });
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Competência: ${competenciaLabel}`, W / 2, y, { align: 'center' });
    y += 8;

    doc.rect(M, y, W - 2 * M, 22);
    doc.setFont('helvetica', 'bold');
    doc.text('Funcionário:', M + 3, y + 6);
    doc.text('Cargo:', M + 3, y + 12);
    doc.text('Salário base (referência):', M + 3, y + 18);
    doc.setFont('helvetica', 'normal');
    doc.text(employee?.nome ?? '—', M + 30, y + 6);
    doc.text(employee?.cargo ?? '—', M + 30, y + 12);
    doc.text(employee ? brl(Number(employee.salario ?? 0)) : '—', M + 60, y + 18);
    y += 28;

    const colItem = M + 12;
    const colDesc = M + 18;
    const colVal = W - M - 3;

    const section = (title: string, rows: Linha[], total: number) => {
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(230, 230, 230);
      doc.rect(M, y, W - 2 * M, 8, 'F');
      doc.setFontSize(11);
      doc.text(title.toUpperCase(), M + 3, y + 5.5);
      y += 8;

      doc.setFillColor(245, 245, 245);
      doc.rect(M, y, W - 2 * M, 7, 'F');
      doc.setFontSize(9);
      doc.text('Item', M + 4, y + 5);
      doc.text('Descrição', colDesc, y + 5);
      doc.text('Valor', colVal, y + 5, { align: 'right' });
      y += 7;

      doc.setFont('helvetica', 'normal');
      rows.forEach((l, i) => {
        doc.setDrawColor(220, 220, 220);
        doc.line(M, y, W - M, y);
        doc.text(`${i + 1}`, M + 5, y + 5);
        doc.text(l.descricao || '-', colDesc, y + 5);
        doc.text(brl(num(l.valor)), colVal, y + 5, { align: 'right' });
        y += 7;
      });
      if (rows.length === 0) {
        doc.text('—', M + 5, y + 5);
        doc.text('Nenhum lançamento', colDesc, y + 5);
        y += 7;
      }

      doc.setDrawColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(M, y, W - 2 * M, 8, 'F');
      doc.text(`Total de ${title.toLowerCase()}`, colDesc, y + 5.5);
      doc.text(brl(total), colVal, y + 5.5, { align: 'right' });
      y += 12;
    };

    section('Proventos', proventos, totalProventos);
    section('Descontos', descontos, totalDescontos);

    doc.setFillColor(230, 240, 250);
    doc.rect(M, y, W - 2 * M, 12, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('VALOR LÍQUIDO A RECEBER', M + 3, y + 8);
    doc.text(brl(liquido), W - M - 3, y + 8, { align: 'right' });
    y += 40;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const hoje = new Date().toLocaleDateString('pt-BR');
    doc.line(M, y, M + 70, y);
    doc.text('Assinatura do Funcionário', M, y + 5);
    doc.text(`Data: ${hoje}`, M + 75, y + 5);

    doc.save(`holerite-${(employee?.nome ?? 'funcionario').replace(/\s+/g, '-').toLowerCase()}-${competenciaLabel.replace('/', '-')}.pdf`);
  };

  const renderTable = (
    title: string,
    rows: Linha[],
    setter: React.Dispatch<React.SetStateAction<Linha[]>>,
    total: number,
  ) => (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between bg-muted px-4 py-2">
        <h3 className="font-heading font-semibold text-sm text-foreground uppercase tracking-wide">{title}</h3>
        <Button variant="ghost" size="sm" onClick={() => setter(prev => [...prev, { id: uid(), descricao: '', valor: '' }])}>
          <Plus className="w-4 h-4 mr-1" /> Adicionar
        </Button>
      </div>
      <div className="divide-y divide-border">
        {rows.map(l => (
          <div key={l.id} className="flex items-center gap-2 px-3 py-2">
            <Input
              className="flex-1"
              placeholder="Descrição"
              value={l.descricao}
              onChange={e => update(setter, l.id, 'descricao', e.target.value)}
            />
            <Input
              className="w-32 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0,00"
              value={l.valor}
              onWheel={e => e.currentTarget.blur()}
              onChange={e => update(setter, l.id, 'valor', e.target.value)}
            />
            <Button variant="ghost" size="icon" onClick={() => setter(prev => prev.filter(x => x.id !== l.id))}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
        {rows.length === 0 && <p className="px-4 py-3 text-sm text-muted-foreground">Nenhum lançamento.</p>}
      </div>
      <div className="flex items-center justify-between bg-muted/60 px-4 py-2 font-semibold text-sm">
        <span>Total de {title}</span>
        <span>{brl(total)}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Holerites PS
          </h1>
          <p className="text-sm text-muted-foreground">Gere o recibo de pagamento de um funcionário</p>
        </div>
        <Button onClick={downloadPdf} disabled={!employee}>
          <FileDown className="w-4 h-4 mr-2" /> Baixar PDF
        </Button>
      </div>

      <div className="kpi-card grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Funcionário</Label>
          <Select value={employeeId} onValueChange={handleSelectEmployee}>
            <SelectTrigger><SelectValue placeholder="Selecione o funcionário" /></SelectTrigger>
            <SelectContent>
              {employees.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.nome} — {e.cargo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Competência</Label>
          <Input type="month" value={competencia} onChange={e => setCompetencia(e.target.value)} />
        </div>
      </div>

      <div className="kpi-card space-y-5">
        <div className="text-center border-b border-border pb-3">
          <h2 className="font-heading text-lg font-bold text-foreground">RECIBO DE PAGAMENTO</h2>
          <p className="text-sm text-muted-foreground">Competência: {competenciaLabel}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 border border-border rounded-lg p-4">
          <div>
            <p className="text-xs text-muted-foreground">Funcionário</p>
            <p className="font-semibold text-foreground">{employee?.nome ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cargo</p>
            <p className="font-semibold text-foreground">{employee?.cargo ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Salário base (referência)</p>
            <p className="font-semibold text-foreground">{employee ? brl(Number(employee.salario ?? 0)) : '—'}</p>
          </div>
        </div>

        {renderTable('Proventos', proventos, setProventos, totalProventos)}
        {renderTable('Descontos', descontos, setDescontos, totalDescontos)}

        <div className="flex items-center justify-between rounded-lg bg-primary/10 border border-primary/30 px-4 py-3">
          <span className="font-heading font-bold text-foreground uppercase text-sm">Valor Líquido a Receber</span>
          <span className="font-heading text-xl font-bold text-primary">{brl(liquido)}</span>
        </div>

        <div className="grid gap-10 sm:grid-cols-1 max-w-xs mx-auto pt-10">
          <div className="border-t border-foreground/40 pt-1 text-xs text-muted-foreground text-center">
            Assinatura do Funcionário
            <span className="block mt-0.5">Data: {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
