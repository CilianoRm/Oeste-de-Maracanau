# Oeste de Maracanaú — versão pronta para VS Code

Esta pasta já está configurada para o seu projeto Supabase e inclui o módulo **Reunião de meio de semana**.

## Para abrir no Visual Studio Code

1. Extraia o ZIP.
2. Abra a pasta extraída no Visual Studio Code.
3. Abra o terminal na pasta do projeto.
4. Rode `npm run dev`.
5. Abra o endereço mostrado pelo Vite (normalmente `http://localhost:5173/Oeste-de-Maracanau/`).

A pasta `node_modules` já acompanha esta versão para Windows. Se o Windows ou o npm reclamar de dependências, rode `npm install` uma vez e depois `npm run dev`.

## Supabase — faça estes 2 passos uma vez

No Supabase > SQL Editor:

1. Execute `supabase/meeting_migration.sql` para criar a tabela da reunião.
2. Execute `supabase/public_read_fix.sql` para evitar os erros 401 nas telas públicas.

## Atualização automática da reunião

O projeto aponta para:
`https://xlvjugjwhfdhbaluphhy.supabase.co/functions/v1/meeting-import`

Para a atualização automática semanal funcionar, publique a função que está em:
`supabase/functions/meeting-import/index.ts`

Com o Supabase CLI, dentro da pasta do projeto:
`supabase functions deploy meeting-import --project-ref xlvjugjwhfdhbaluphhy`

Mesmo se a função ainda não estiver publicada, esta versão possui uma programação de segurança para a semana de 7–13 de setembro de 2026, para a tela de reunião não ficar vazia.

## O que conferir

- Senha pública: `OesteM131268`
- Tela inicial com **Territórios** e **Reunião meio de semana**
- Reunião protegida pelo login de administrador
- Administração de pessoas das partes
- Horário, limpeza e designações mecânicas
- Atualização dos temas da semana
- Geração de PNG da reunião
- Territórios, grupos, membros, programação, histórico, mapa e indicações

---

## CORREÇÃO DA REUNIÃO — IMPORTANTE

Nesta versão a reunião foi ajustada para não depender do acesso direto do navegador ao WOL.

### Usando no VS Code
Ao executar `npm run dev`, o próprio Vite faz a consulta à fonte oficial pelo computador e entrega os dados ao navegador. Isso elimina o erro CORS.

### Usando no GitHub Pages
O workflow do GitHub agora busca a programação oficial automaticamente toda segunda-feira e publica `meeting-current.json` junto com o site. Portanto, a programação semanal não depende da Edge Function para o uso normal.

A Edge Function continua incluída como opção extra para atualização sob demanda. Para publicá-la, execute:

`supabase/DEPLOY_REUNIAO_WINDOWS.bat`

### PNG da reunião
Os nomes de participantes agora são mantidos em uma única linha. Quando o nome é comprido, o tamanho da fonte diminui automaticamente até caber. As designações mecânicas usam letras mais grossas e escuras.

## NOVO — identificar ruas automaticamente
No painel, acesse **Territórios e mapa > Ruas > Identificar no mapa**. Escolha um território que já tenha a área desenhada. O sistema busca as ruas do OpenStreetMap, mas **nada é salvo sem sua confirmação**. Você pode desmarcar, corrigir o nome e criar um apelido antes de adicionar. Depois, o nome e o apelido continuam editáveis pelo botão de lápis.
