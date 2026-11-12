# pauta. — Portal de Conteúdo

Calendário, briefing, roteiro, thumbs, metadados e aprovações de conteúdo (YouTube + Instagram) em um só lugar.
Você (admin) gerencia tudo; cada cliente entra no portal e vê só o que é dele, aprova, comenta e sugere ideias.

## Configuração (uma vez só)

### 1. Repositório no GitHub
1. Crie um repositório **vazio** no GitHub (ex.: `portal-conteudo`).
2. Nesta pasta:
   ```bash
   git add -A && git commit -m "Primeira versão"
   git remote add origin https://github.com/SEU-USUARIO/portal-conteudo.git
   git push -u origin main
   ```

### 2. Supabase
1. Crie um projeto em supabase.com.
2. **Integrations → GitHub**: conecte o repositório acima, branch `main`, diretório `supabase`.
   A cada push, as migrations em `supabase/migrations/` são aplicadas automaticamente.
   (Alternativa manual: copie o conteúdo de `supabase/migrations/20261111000000_init.sql` no **SQL Editor** e rode.)
3. **Authentication → Sign In / Providers**: desligue *Allow new users to sign up* (só entra quem for convidado).
4. **Authentication → URL Configuration**:
   - Site URL: a URL do site (ex.: `https://pauta.vercel.app`)
   - Redirect URLs: adicione `https://pauta.vercel.app/auth/callback` e `http://localhost:3000/auth/callback`
5. **Crie sua conta de admin**: Authentication → Users → *Add user → Create new user* com seu e-mail.
   O **primeiro usuário criado vira admin automaticamente**.
6. (Recomendado) **Authentication → Emails → SMTP**: configure um SMTP (ex.: Resend, grátis).
   O e-mail padrão do Supabase só envia poucas mensagens por hora. Enquanto isso, use o botão **Gerar link** para mandar o acesso por WhatsApp.

### 3. Variáveis de ambiente
Copie `.env.example` para `.env.local` e preencha com os dados de **Project Settings → API**.

### 4. Rodar localmente
```bash
npm install
npm run dev
```
Abra http://localhost:3000 e entre com seu e-mail.

### 5. Publicar na Vercel
1. vercel.com → *Add New Project* → importe o repositório.
2. Coloque as mesmas 4 variáveis do `.env.local` (com `NEXT_PUBLIC_SITE_URL` = URL da Vercel).
3. Deploy. Atualize a Site URL/Redirect URLs no Supabase se a URL mudar.

## Importar a planilha antiga
No Google Sheets: *Arquivo → Fazer download → CSV*. Depois:
```bash
npx tsx scripts/import-sheet.ts --arquivo planilha.csv --cliente "Nome do Cliente" --simular   # confere
npx tsx scripts/import-sheet.ts --arquivo planilha.csv --cliente "Nome do Cliente"             # grava
```
Os dados de novembro do Brunno Moleta já estão em `scripts/exemplos/brunno-moleta-novembro.csv`.
Títulos que já existem não são duplicados.

## Como funciona
- **Fluxos por formato** (`src/lib/pipelines.ts`, espelhado na função `pipeline_steps` do banco):
  - YouTube vídeo: Ideia → Título & Thumb → Aprovação → Roteiro → Gravar → Editar → Metadados → Agendado → Postado
  - Reels: Ideia → Roteiro → Aprovação → Gravar → Editar → Legenda → Agendado → Postado
  - Carrossel/Post: Ideia → Copy → Design → Aprovação → Legenda → Agendado → Postado
  - Stories: Ideia → Produção → Aprovação → Postado
- Na etapa **Aprovação** o cliente vê "Bora aprovar?": aprovar avança uma etapa; pedir ajuste (com comentário) volta uma.
- **Segurança**: tudo isolado por cliente via RLS no Postgres; arquivos num bucket privado com links temporários.

## Próxima fase
Colar o link do YouTube → puxar a legenda que o próprio YouTube gera → (opcional) gerar descrição, tags e capítulos com IA.
