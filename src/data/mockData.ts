export type StatusFuncionario = 'Ativo' | 'Inativo' | 'Afastado' | 'Desligado';

export const statusDisplayLabel: Record<StatusFuncionario, string> = {
  'Ativo': 'Ativo',
  'Inativo': 'Em Licença',
  'Afastado': 'Afastado',
  'Desligado': 'Desligado',
};
export type TipoContrato = 'CLT' | 'PJ' | 'Estágio' | 'Temporário';
export type Genero = 'Masculino' | 'Feminino' | 'Outro';

export interface Avaliacao {
  id: string;
  periodo: string;
  data: string;
  produtividade: number;
  comunicacao: number;
  trabalhoEquipe: number;
  proatividade: number;
  lideranca: number;
  resultados: number;
  pontosFortes: string;
  pontosMelhoria: string;
}

export interface HistoricoItem {
  id: string;
  tipo: 'admissao' | 'promocao' | 'mudanca_cargo' | 'advertencia' | 'desligamento' | 'afastamento';
  data: string;
  descricao: string;
  responsavel: string;
}

export interface Documento {
  id: string;
  nome: string;
  tipo: string;
  dataUpload: string;
  tamanho: string;
}

export type TipoChavePix = 'CPF' | 'CNPJ' | 'E-mail' | 'Telefone' | 'Chave Aleatória';

export interface Funcionario {
  id: string;
  foto: string;
  nome: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  genero: Genero;
  endereco: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  telefone: string;
  chavePix?: string;
  tipoChavePix?: TipoChavePix;
  emailPessoal: string;
  matricula: string;
  cargo: string;
  departamento: string;
  centroCusto: string;
  dataAdmissao: string;
  tipoContrato: TipoContrato;
  salario: number;
  cargaHoraria: number;
  emailCorporativo: string;
  gestorDireto: string;
  status: StatusFuncionario;
  dataDesligamento?: string;
  motivoDesligamento?: string;
  valorRescisao?: number;
  dataPagamentoRescisao?: string;
  pagamentoConfirmado?: boolean;
  contratoAssinado?: boolean;
  dataFimExperiencia?: string;
  avaliacoes: Avaliacao[];
  historico: HistoricoItem[];
  documentos: Documento[];
}

const departamentos = ['Tecnologia', 'Recursos Humanos', 'Financeiro', 'Comercial', 'Marketing', 'Operações'];

export const funcionariosMock: Funcionario[] = [
  {
    id: '1',
    foto: '',
    nome: 'Ana Carolina Silva',
    cpf: '123.456.789-00',
    rg: '12.345.678-9',
    dataNascimento: '1990-03-15',
    genero: 'Feminino',
    endereco: { rua: 'Rua das Flores', numero: '123', bairro: 'Jardins', cidade: 'São Paulo', estado: 'SP', cep: '01234-567' },
    telefone: '(11) 99999-1234',
    emailPessoal: 'ana.silva@email.com',
    matricula: 'MAT001',
    cargo: 'Desenvolvedora Senior',
    departamento: 'Tecnologia',
    centroCusto: 'CC-TEC-001',
    dataAdmissao: '2020-02-10',
    tipoContrato: 'CLT',
    salario: 12000,
    cargaHoraria: 40,
    emailCorporativo: 'ana.silva@gestapeople.com',
    gestorDireto: 'Carlos Mendes',
    status: 'Ativo',
    dataFimExperiencia: '2026-04-15',
    avaliacoes: [
      { id: 'av1', periodo: 'Q4 2025', data: '2025-12-15', produtividade: 5, comunicacao: 4, trabalhoEquipe: 5, proatividade: 4, lideranca: 4, resultados: 5, pontosFortes: 'Excelente capacidade técnica e liderança.', pontosMelhoria: 'Delegar mais tarefas operacionais.' },
      { id: 'av2', periodo: 'Q3 2025', data: '2025-09-15', produtividade: 4, comunicacao: 4, trabalhoEquipe: 4, proatividade: 5, lideranca: 3, resultados: 4, pontosFortes: 'Proativa e colaborativa.', pontosMelhoria: 'Melhorar apresentações para stakeholders.' },
    ],
    historico: [
      { id: 'h1', tipo: 'admissao', data: '2020-02-10', descricao: 'Admissão como Desenvolvedora Pleno', responsavel: 'RH' },
      { id: 'h2', tipo: 'promocao', data: '2022-06-01', descricao: 'Promoção para Desenvolvedora Senior', responsavel: 'Carlos Mendes' },
    ],
    documentos: [
      { id: 'd1', nome: 'Contrato de Trabalho', tipo: 'PDF', dataUpload: '2020-02-10', tamanho: '245 KB' },
      { id: 'd2', nome: 'Exame Admissional', tipo: 'PDF', dataUpload: '2020-02-08', tamanho: '180 KB' },
    ],
  },
  {
    id: '2', foto: '', nome: 'Bruno Oliveira Santos', cpf: '234.567.890-11', rg: '23.456.789-0', dataNascimento: '1988-07-22', genero: 'Masculino',
    endereco: { rua: 'Av. Paulista', numero: '1000', bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP', cep: '01310-100' },
    telefone: '(11) 98888-5678', emailPessoal: 'bruno.santos@email.com', matricula: 'MAT002', cargo: 'Gerente de Projetos', departamento: 'Tecnologia',
    centroCusto: 'CC-TEC-002', dataAdmissao: '2019-05-15', tipoContrato: 'CLT', salario: 15000, cargaHoraria: 40,
    emailCorporativo: 'bruno.santos@gestapeople.com', gestorDireto: 'Diretor de TI', status: 'Ativo',
    avaliacoes: [{ id: 'av3', periodo: 'Q4 2025', data: '2025-12-15', produtividade: 4, comunicacao: 5, trabalhoEquipe: 4, proatividade: 4, lideranca: 5, resultados: 4, pontosFortes: 'Ótimo líder e comunicador.', pontosMelhoria: 'Focar mais em métricas de resultado.' }],
    historico: [{ id: 'h3', tipo: 'admissao', data: '2019-05-15', descricao: 'Admissão como Analista de Projetos', responsavel: 'RH' }, { id: 'h4', tipo: 'promocao', data: '2021-03-01', descricao: 'Promoção para Gerente de Projetos', responsavel: 'Diretor de TI' }],
    documentos: [{ id: 'd3', nome: 'Contrato de Trabalho', tipo: 'PDF', dataUpload: '2019-05-15', tamanho: '250 KB' }],
  },
  {
    id: '3', foto: '', nome: 'Carla Fernanda Lima', cpf: '345.678.901-22', rg: '34.567.890-1', dataNascimento: '1995-11-03', genero: 'Feminino',
    endereco: { rua: 'Rua Augusta', numero: '456', bairro: 'Consolação', cidade: 'São Paulo', estado: 'SP', cep: '01305-000' },
    telefone: '(11) 97777-9012', emailPessoal: 'carla.lima@email.com', matricula: 'MAT003', cargo: 'Analista de RH', departamento: 'Recursos Humanos',
    centroCusto: 'CC-RH-001', dataAdmissao: '2021-08-02', tipoContrato: 'CLT', salario: 7500, cargaHoraria: 40,
    emailCorporativo: 'carla.lima@gestapeople.com', gestorDireto: 'Maria Gestora', status: 'Ativo',
    avaliacoes: [], historico: [{ id: 'h5', tipo: 'admissao', data: '2021-08-02', descricao: 'Admissão como Analista de RH', responsavel: 'RH' }],
    documentos: [{ id: 'd4', nome: 'Contrato de Trabalho', tipo: 'PDF', dataUpload: '2021-08-02', tamanho: '230 KB' }],
  },
  {
    id: '4', foto: '', nome: 'Daniel Rodrigues Costa', cpf: '456.789.012-33', rg: '45.678.901-2', dataNascimento: '1992-01-18', genero: 'Masculino',
    endereco: { rua: 'Rua Oscar Freire', numero: '789', bairro: 'Pinheiros', cidade: 'São Paulo', estado: 'SP', cep: '05409-010' },
    telefone: '(11) 96666-3456', emailPessoal: 'daniel.costa@email.com', matricula: 'MAT004', cargo: 'Analista Financeiro', departamento: 'Financeiro',
    centroCusto: 'CC-FIN-001', dataAdmissao: '2022-01-10', tipoContrato: 'CLT', salario: 8500, cargaHoraria: 40,
    emailCorporativo: 'daniel.costa@gestapeople.com', gestorDireto: 'Paulo Diretor', status: 'Afastado',
    avaliacoes: [{ id: 'av4', periodo: 'Q3 2025', data: '2025-09-15', produtividade: 3, comunicacao: 3, trabalhoEquipe: 4, proatividade: 3, lideranca: 2, resultados: 3, pontosFortes: 'Bom trabalho em equipe.', pontosMelhoria: 'Melhorar produtividade e pontualidade.' }],
    historico: [{ id: 'h6', tipo: 'admissao', data: '2022-01-10', descricao: 'Admissão como Analista Financeiro Jr', responsavel: 'RH' }, { id: 'h7', tipo: 'afastamento', data: '2026-02-15', descricao: 'Afastamento por licença médica', responsavel: 'RH' }],
    documentos: [{ id: 'd5', nome: 'Contrato de Trabalho', tipo: 'PDF', dataUpload: '2022-01-10', tamanho: '240 KB' }],
  },
  {
    id: '5', foto: '', nome: 'Elisa Martins Almeida', cpf: '567.890.123-44', rg: '56.789.012-3', dataNascimento: '1993-05-25', genero: 'Feminino',
    endereco: { rua: 'Rua Frei Caneca', numero: '321', bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP', cep: '01307-001' },
    telefone: '(11) 95555-7890', emailPessoal: 'elisa.almeida@email.com', matricula: 'MAT005', cargo: 'Coordenadora de Marketing', departamento: 'Marketing',
    centroCusto: 'CC-MKT-001', dataAdmissao: '2020-09-14', tipoContrato: 'CLT', salario: 11000, cargaHoraria: 40,
    emailCorporativo: 'elisa.almeida@gestapeople.com', gestorDireto: 'Diretor de Marketing', status: 'Ativo',
    avaliacoes: [], historico: [{ id: 'h8', tipo: 'admissao', data: '2020-09-14', descricao: 'Admissão como Analista de Marketing', responsavel: 'RH' }, { id: 'h9', tipo: 'promocao', data: '2023-01-01', descricao: 'Promoção para Coordenadora', responsavel: 'Diretor de Marketing' }],
    documentos: [],
  },
  {
    id: '6', foto: '', nome: 'Felipe Henrique Souza', cpf: '678.901.234-55', rg: '67.890.123-4', dataNascimento: '1987-12-08', genero: 'Masculino',
    endereco: { rua: 'Alameda Santos', numero: '654', bairro: 'Cerqueira César', cidade: 'São Paulo', estado: 'SP', cep: '01418-000' },
    telefone: '(11) 94444-1234', emailPessoal: 'felipe.souza@email.com', matricula: 'MAT006', cargo: 'Executivo de Vendas', departamento: 'Comercial',
    centroCusto: 'CC-COM-001', dataAdmissao: '2021-03-22', tipoContrato: 'CLT', salario: 9000, cargaHoraria: 40,
    emailCorporativo: 'felipe.souza@gestapeople.com', gestorDireto: 'Gerente Comercial', status: 'Desligado',
    dataDesligamento: '2026-03-10', motivoDesligamento: 'Pedido de demissão',
    valorRescisao: 18500, dataPagamentoRescisao: '2026-03-25', pagamentoConfirmado: true, contratoAssinado: true,
    avaliacoes: [], historico: [{ id: 'h10', tipo: 'admissao', data: '2021-03-22', descricao: 'Admissão como Executivo de Vendas', responsavel: 'RH' }, { id: 'h11', tipo: 'desligamento', data: '2026-03-10', descricao: 'Desligamento por pedido de demissão', responsavel: 'RH' }],
    documentos: [],
  },
  {
    id: '7', foto: '', nome: 'Gabriela Nascimento Dias', cpf: '789.012.345-66', rg: '78.901.234-5', dataNascimento: '1996-08-30', genero: 'Feminino',
    endereco: { rua: 'Rua Haddock Lobo', numero: '987', bairro: 'Jardins', cidade: 'São Paulo', estado: 'SP', cep: '01414-001' },
    telefone: '(11) 93333-5678', emailPessoal: 'gabriela.dias@email.com', matricula: 'MAT007', cargo: 'Estagiária de TI', departamento: 'Tecnologia',
    centroCusto: 'CC-TEC-003', dataAdmissao: '2025-06-01', tipoContrato: 'Estágio', salario: 2500, cargaHoraria: 30,
    emailCorporativo: 'gabriela.dias@gestapeople.com', gestorDireto: 'Ana Carolina Silva', status: 'Ativo',
    avaliacoes: [], historico: [{ id: 'h12', tipo: 'admissao', data: '2025-06-01', descricao: 'Admissão como Estagiária de TI', responsavel: 'RH' }],
    documentos: [],
  },
  {
    id: '8', foto: '', nome: 'Hugo Rafael Pereira', cpf: '890.123.456-77', rg: '89.012.345-6', dataNascimento: '1991-04-12', genero: 'Masculino',
    endereco: { rua: 'Rua da Consolação', numero: '555', bairro: 'Consolação', cidade: 'São Paulo', estado: 'SP', cep: '01301-000' },
    telefone: '(11) 92222-9012', emailPessoal: 'hugo.pereira@email.com', matricula: 'MAT008', cargo: 'Analista de Operações', departamento: 'Operações',
    centroCusto: 'CC-OPS-001', dataAdmissao: '2023-04-03', tipoContrato: 'CLT', salario: 7000, cargaHoraria: 40,
    emailCorporativo: 'hugo.pereira@gestapeople.com', gestorDireto: 'Gerente de Operações', status: 'Ativo',
    avaliacoes: [], historico: [{ id: 'h13', tipo: 'admissao', data: '2023-04-03', descricao: 'Admissão como Analista de Operações', responsavel: 'RH' }],
    documentos: [],
  },
  {
    id: '9', foto: '', nome: 'Isabela Cristina Rocha', cpf: '901.234.567-88', rg: '90.123.456-7', dataNascimento: '1994-09-17', genero: 'Feminino',
    endereco: { rua: 'Av. Brigadeiro Faria Lima', numero: '1200', bairro: 'Itaim Bibi', cidade: 'São Paulo', estado: 'SP', cep: '04538-132' },
    telefone: '(11) 91111-3456', emailPessoal: 'isabela.rocha@email.com', matricula: 'MAT009', cargo: 'Consultora de Vendas', departamento: 'Comercial',
    centroCusto: 'CC-COM-002', dataAdmissao: '2022-07-11', tipoContrato: 'PJ', salario: 10000, cargaHoraria: 40,
    emailCorporativo: 'isabela.rocha@gestapeople.com', gestorDireto: 'Gerente Comercial', status: 'Desligado',
    dataDesligamento: '2026-03-18', motivoDesligamento: 'Fim de contrato PJ',
    valorRescisao: 22000, dataPagamentoRescisao: '2026-04-05', pagamentoConfirmado: false, contratoAssinado: true,
    avaliacoes: [], historico: [{ id: 'h14', tipo: 'admissao', data: '2022-07-11', descricao: 'Admissão como Consultora PJ', responsavel: 'RH' }, { id: 'h15', tipo: 'desligamento', data: '2026-03-18', descricao: 'Fim de contrato PJ', responsavel: 'RH' }],
    documentos: [],
  },
  {
    id: '10', foto: '', nome: 'João Pedro Machado', cpf: '012.345.678-99', rg: '01.234.567-8', dataNascimento: '1989-02-28', genero: 'Masculino',
    endereco: { rua: 'Rua Vergueiro', numero: '333', bairro: 'Liberdade', cidade: 'São Paulo', estado: 'SP', cep: '01504-001' },
    telefone: '(11) 90000-7890', emailPessoal: 'joao.machado@email.com', matricula: 'MAT010', cargo: 'Coordenador Financeiro', departamento: 'Financeiro',
    centroCusto: 'CC-FIN-002', dataAdmissao: '2018-11-05', tipoContrato: 'CLT', salario: 13000, cargaHoraria: 40,
    emailCorporativo: 'joao.machado@gestapeople.com', gestorDireto: 'Paulo Diretor', status: 'Ativo',
    avaliacoes: [{ id: 'av5', periodo: 'Q4 2025', data: '2025-12-15', produtividade: 5, comunicacao: 4, trabalhoEquipe: 5, proatividade: 5, lideranca: 4, resultados: 5, pontosFortes: 'Excelente gestão financeira e organização.', pontosMelhoria: 'Aprimorar habilidades de apresentação executiva.' }],
    historico: [{ id: 'h16', tipo: 'admissao', data: '2018-11-05', descricao: 'Admissão como Analista Financeiro', responsavel: 'RH' }, { id: 'h17', tipo: 'promocao', data: '2021-06-01', descricao: 'Promoção para Coordenador Financeiro', responsavel: 'Paulo Diretor' }],
    documentos: [{ id: 'd6', nome: 'Contrato de Trabalho', tipo: 'PDF', dataUpload: '2018-11-05', tamanho: '235 KB' }],
  },
  {
    id: '11', foto: '', nome: 'Larissa Mendes Barbosa', cpf: '111.222.333-44', rg: '11.222.333-4', dataNascimento: '1997-06-20', genero: 'Feminino',
    endereco: { rua: 'Rua Bela Cintra', numero: '888', bairro: 'Jardins', cidade: 'São Paulo', estado: 'SP', cep: '01415-000' },
    telefone: '(11) 98765-4321', emailPessoal: 'larissa.barbosa@email.com', matricula: 'MAT011', cargo: 'Designer UX/UI', departamento: 'Tecnologia',
    centroCusto: 'CC-TEC-004', dataAdmissao: '2024-01-15', tipoContrato: 'CLT', salario: 9500, cargaHoraria: 40,
    emailCorporativo: 'larissa.barbosa@gestapeople.com', gestorDireto: 'Bruno Oliveira Santos', status: 'Ativo',
    avaliacoes: [], historico: [{ id: 'h18', tipo: 'admissao', data: '2024-01-15', descricao: 'Admissão como Designer UX/UI', responsavel: 'RH' }],
    documentos: [],
  },
  {
    id: '12', foto: '', nome: 'Marcos Vinícius Teixeira', cpf: '222.333.444-55', rg: '22.333.444-5', dataNascimento: '1985-10-05', genero: 'Masculino',
    endereco: { rua: 'Av. Rebouças', numero: '1500', bairro: 'Pinheiros', cidade: 'São Paulo', estado: 'SP', cep: '05402-100' },
    telefone: '(11) 98877-6655', emailPessoal: 'marcos.teixeira@email.com', matricula: 'MAT012', cargo: 'Gerente de RH', departamento: 'Recursos Humanos',
    centroCusto: 'CC-RH-002', dataAdmissao: '2017-03-01', tipoContrato: 'CLT', salario: 16000, cargaHoraria: 40,
    emailCorporativo: 'marcos.teixeira@gestapeople.com', gestorDireto: 'Diretor Geral', status: 'Ativo',
    avaliacoes: [], historico: [{ id: 'h19', tipo: 'admissao', data: '2017-03-01', descricao: 'Admissão como Analista de RH Senior', responsavel: 'RH' }, { id: 'h20', tipo: 'promocao', data: '2019-07-01', descricao: 'Promoção para Gerente de RH', responsavel: 'Diretor Geral' }],
    documentos: [],
  },
  {
    id: '13', foto: '', nome: 'Natália Freitas Gomes', cpf: '333.444.555-66', rg: '33.444.555-6', dataNascimento: '1993-03-26', genero: 'Feminino',
    endereco: { rua: 'Rua Pamplona', numero: '200', bairro: 'Jardim Paulista', cidade: 'São Paulo', estado: 'SP', cep: '01405-100' },
    telefone: '(11) 97654-3210', emailPessoal: 'natalia.gomes@email.com', matricula: 'MAT013', cargo: 'Assistente Administrativo', departamento: 'Operações',
    centroCusto: 'CC-OPS-002', dataAdmissao: '2024-06-10', tipoContrato: 'Temporário', salario: 4500, cargaHoraria: 40,
    emailCorporativo: 'natalia.gomes@gestapeople.com', gestorDireto: 'Gerente de Operações', status: 'Desligado',
    dataDesligamento: '2026-03-22', motivoDesligamento: 'Término de contrato temporário',
    valorRescisao: 9500, dataPagamentoRescisao: '2026-04-10', pagamentoConfirmado: false, contratoAssinado: false,
    avaliacoes: [], historico: [{ id: 'h21', tipo: 'admissao', data: '2024-06-10', descricao: 'Admissão como Assistente Administrativo Temporário', responsavel: 'RH' }, { id: 'h22', tipo: 'desligamento', data: '2026-03-22', descricao: 'Término de contrato temporário', responsavel: 'RH' }],
    documentos: [],
  },
  {
    id: '14', foto: '', nome: 'Pedro Lucas Araújo', cpf: '444.555.666-77', rg: '44.555.666-7', dataNascimento: '1990-12-14', genero: 'Masculino',
    endereco: { rua: 'Rua Estados Unidos', numero: '100', bairro: 'Jardins', cidade: 'São Paulo', estado: 'SP', cep: '01427-000' },
    telefone: '(11) 96543-2109', emailPessoal: 'pedro.araujo@email.com', matricula: 'MAT014', cargo: 'Analista de Marketing Digital', departamento: 'Marketing',
    centroCusto: 'CC-MKT-002', dataAdmissao: '2023-09-18', tipoContrato: 'CLT', salario: 7800, cargaHoraria: 40,
    emailCorporativo: 'pedro.araujo@gestapeople.com', gestorDireto: 'Elisa Martins Almeida', status: 'Inativo',
    avaliacoes: [], historico: [{ id: 'h23', tipo: 'admissao', data: '2023-09-18', descricao: 'Admissão como Analista de Marketing Digital', responsavel: 'RH' }],
    documentos: [],
  },
];

export const chartDataHeadcount = [
  { departamento: 'Tecnologia', total: 4 },
  { departamento: 'RH', total: 2 },
  { departamento: 'Financeiro', total: 2 },
  { departamento: 'Comercial', total: 2 },
  { departamento: 'Marketing', total: 2 },
  { departamento: 'Operações', total: 2 },
];

export const chartDataCrescimento = [
  { mes: 'Out/25', total: 10 },
  { mes: 'Nov/25', total: 11 },
  { mes: 'Dez/25', total: 12 },
  { mes: 'Jan/26', total: 13 },
  { mes: 'Fev/26', total: 14 },
  { mes: 'Mar/26', total: 14 },
];

export const chartDataStatus = [
  { name: 'Ativo', value: 8, color: '#10B981' },
  { name: 'Em Licença', value: 1, color: '#EF4444' },
  { name: 'Afastado', value: 1, color: '#F97316' },
  { name: 'Desligado', value: 3, color: '#9CA3AF' },
];
