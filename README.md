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

O banco do RH atualmente usa o projeto Supabase `jhvwyrfdbfbhyezstxse`. O destino é o **projeto RH** `vguzdfpvqyktnwxwjduk`, separado de PRODUÇÃO. O repositório contém migrações de estrutura, mas não contém os registros, usuários de Auth nem arquivos dos buckets; clonar o repositório não transfere esses dados. Não configure a Vercel para o projeto PRODUÇÃO: as tabelas dos dois sistemas têm nomes e estruturas diferentes.

### Estrutura segura instalada no RH

O projeto RH recebeu `supabase/baseline/rh_locked_schema.sql`, gerado de forma reproduzível por `python3 scripts/build_locked_schema.py`. As 29 tabelas estão com RLS ativo, **sem nenhuma política de acesso**, e os três buckets (`avatars`, `cashflow-files`, `overtime-files`) são privados. Nesta etapa a aplicação não consegue ler nem gravar os registros: é uma proteção deliberada até que as permissões sejam definidas para cada função do RH.

**Não execute diretamente as migrações históricas em um novo ambiente:** algumas delas autorizam qualquer usuário autenticado a ler e modificar CPF, salário e documentos dos funcionários. O baseline elimina essas políticas e não configura a função de IA de holerites.

Antes de trocar o site em produção:

1. Transferir os dados, contas de Auth e arquivos do projeto original; confirmar totais e caminhos.
2. Definir e testar políticas de acesso para administrador, gestor e visualizador antes de permitir uso real. Adaptar também a exibição de avatares: o código atual usa URL pública, incompatível com o bucket privado do RH.
3. Testar a aplicação na URL temporária da Vercel. O domínio `btexindustria.com` deve ser alterado apenas após validação da cópia RH.

A função `extract-holerite` ainda usa `LOVABLE_API_KEY` e o gateway do Lovable. A leitura automática de holerites precisa ser migrada para outro provedor antes de remover a dependência do Lovable.
