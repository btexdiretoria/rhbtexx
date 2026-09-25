# Sistema A — Recursos Humanos

Aplicação React/Vite publicada na Vercel e conectada ao Supabase.

## Desenvolvimento

1. Instale as dependências com `npm ci`.
2. Copie `.env.example` para `.env.local` e preencha a URL e a chave **publicável** do projeto Supabase do RH.
3. Execute `npm run dev`.

As variáveis `VITE_` são incluídas no navegador durante o build. Nunca use a chave `service_role` ou `sb_secret_` nesses campos.

## Publicação na Vercel

- Importe o repositório `btexdiretoria/rhbtexx` como projeto **Vite**.
- Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em **Environment Variables** para o ambiente de publicação.
- Use `npm run build` e o diretório de saída `dist`. O arquivo `vercel.json` já direciona rotas internas para a aplicação.
- Publique primeiro no endereço temporário da Vercel e teste login, leitura dos registros e upload antes de mudar `btexindustria.com`.

O banco do RH atualmente usa o projeto Supabase `jhvwyrfdbfbhyezstxse`. O destino será um **novo projeto RH**, separado de PRODUÇÃO. O repositório contém migrações de estrutura, mas não contém os registros, usuários de Auth nem arquivos dos buckets; clonar o repositório não transfere esses dados. Não configure a Vercel para o projeto PRODUÇÃO: as tabelas dos dois sistemas têm nomes e estruturas diferentes.

Antes de trocar o site em produção:

1. Criar o projeto RH no Supabase e apontar para ele somente após aplicar as migrações e transferir dados, contas de Auth e arquivos.
2. Revisar as políticas de acesso nas migrações, especialmente os registros de funcionários, salários e documentos, antes de permitir uso real.
3. Testar a aplicação na URL temporária da Vercel. O domínio `btexindustria.com` deve ser alterado apenas após validação da cópia RH.

A função `extract-holerite` ainda usa `LOVABLE_API_KEY` e o gateway do Lovable. A leitura automática de holerites precisa ser migrada para outro provedor antes de remover a dependência do Lovable.
