# Territórios — Oeste de Maracanaú

Aplicativo mobile-first para organização de territórios de pregação, programação do serviço de campo, mapa, histórico de paradas, continuidade e indicação inteligente de onde trabalhar primeiro.

## Stack

- React + Vite
- Supabase (Postgres, Auth e Realtime)
- Leaflet + OpenStreetMap
- Lucide Icons
- Canvas nativo do navegador para gerar PNG sem depender de renderização HTML

## 1. Supabase — banco de dados

1. Crie um projeto no Supabase.
2. No SQL Editor, execute `supabase/schema.sql`.
3. Se o banco já tiver sido criado por uma versão anterior do projeto, execute também `supabase/migration_fix.sql`.
4. Execute `supabase/seed.sql`.
5. Em Project Settings → API, copie a Project URL e a Publishable/anon key.

### Criar o administrador

1. Vá em **Authentication → Users → Add user**.
2. Crie o usuário com o e-mail que você deseja usar para administração.
3. Defina uma senha forte.
4. Abra `supabase/admin_setup.sql`.
5. Troque `SEU_EMAIL_AQUI` pelo e-mail real.
6. Execute o arquivo no SQL Editor.
7. A consulta final deve mostrar o usuário com `role = admin`.

O botão de administração só fica disponível para usuários autenticados cujo perfil tem `role = 'admin'`. As alterações também são protegidas pelo RLS do banco.

## 2. Configurar o computador

Crie `.env` na raiz do projeto a partir de `.env.example`:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
```

Nunca coloque `service_role` ou uma Secret key no frontend.

Depois:

```bash
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite, normalmente `http://localhost:5173/Oeste-de-Maracanau/`.

## 3. Acesso normal

### Onde abrir o painel administrativo

Depois de entrar com a senha normal, o menu lateral passa a mostrar **Acesso administrativo**. Clique nele e informe o e-mail e a senha do usuário criado em Supabase Authentication.

Se o usuário tiver `role = admin` na tabela `profiles`, o sistema abre automaticamente o **Painel Administrativo**. Em telas pequenas, a opção fica no menu **Mais**.


A tela inicial usa a senha de entrada definida no produto:

`OesteM131268`

Ela não é uma autenticação de produção. O acesso administrativo é separado e usa Supabase Auth + RLS.

## 4. Funcionalidades

### Usuário normal

- Início
- Mapa
- Territórios
- Grupos e membros
- Serviço de campo
- Histórico
- Indicação inteligente
- Continuidade do território
- Busca de rua

### Administrador

- Dashboard
- Criar, editar, ativar/desativar e excluir territórios
- Abrir qualquer território diretamente no mapa
- Desenhar e salvar o limite exato do território
- Limpar uma área desenhada
- Criar/editar/excluir grupos
- Criar/editar/excluir membros e definir dirigentes
- Criar/editar/excluir locais de saída
- Criar/editar/excluir programação
- Cadastro de ruas vinculadas a cada território
- Seleção automática de ruas ao escolher o território na programação
- Gerar imagem PNG profissional com 6 a 10 saídas de campo
- Atualizações em tempo real via Supabase Realtime

## 5. Programação semanal

O banco suporta programação recorrente por `weekday`/`weekday_name`/`time` e também datas específicas. O frontend entende os dois formatos, inclusive quando `service_date` é NULL.

## 6. Indicação inteligente

A prioridade considera principalmente:

- território nunca trabalhado;
- dias desde o último registro;
- quantidade de vezes trabalhado;
- ruas que possuem histórico e estão há mais tempo sem registro.

A indicação é calculada a partir dos dados reais salvos no Supabase.

## 7. Mapa

O administrador seleciona um território, abre o mapa e usa **Desenhar território**. Cada clique adiciona um ponto. Com pelo menos 3 pontos, clique em **Salvar área**. O polígono fica salvo na coluna `territories.polygon`.

## 8. PNG

Em **Painel Administrativo → Imagens / relatórios**, escolha de 6 a 10 saídas. A geração fica bloqueada com menos de 6. O PNG inclui dia, horário, local de saída, dirigente, território, rua, números inicial/final e período da programação. A geração usa Canvas nativo para evitar o problema de imagem vazia.

## 9. Realtime

As principais tabelas são inscritas no Supabase Realtime. Alterações feitas pelo administrador podem atualizar automaticamente as telas abertas.

## 10. GitHub Pages

O projeto usa:

```js
base: '/Oeste-de-Maracanau/'
```

No GitHub:

1. Settings → Pages.
2. Em Build and deployment, selecione **GitHub Actions**.
3. Faça push para `main`.
4. O workflow `.github/workflows/deploy.yml` executará o build e publicará `dist`.

No GitHub → Settings → Secrets and variables → Actions, configure as variáveis:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

O workflow aceita essas variáveis e também os secrets com os mesmos nomes para compatibilidade.

## 11. Teste antes de publicar

```bash
npm install
npm run dev
npm run build
```

O `npm run build` deve terminar sem erros.


## 12. Reunião de meio de semana

A aplicação agora começa, depois da senha pública, com duas áreas:

- **Territórios** — mantém todo o sistema de territórios já existente.
- **Reunião meio de semana** — área protegida pelo usuário administrador do Supabase.

A reunião é alimentada pela programação oficial da Biblioteca On-line da Torre de Vigia. O sistema identifica automaticamente a **segunda-feira da semana atual** e usa a quarta-feira correspondente para localizar a programação oficial. A semana de 31/08–06/09/2026, por exemplo, está na fonte oficial como **JEREMIAS 31**, com as partes 1–8, cânticos e durações. A fonte é a página oficial indicada no aplicativo.

### O que muda toda semana

Os **temas da apostila** são importados/atualizados automaticamente. Os nomes da congregação não são obtidos da fonte externa. Eles são escolhidos no painel administrativo usando os membros já cadastrados no sistema.

Quando uma nova semana é encontrada, o sistema preserva as designações anteriores como ponto de partida para você não precisar começar do zero. Você pode então trocar apenas as pessoas necessárias.

### Banco de dados da reunião

Execute:

```text
supabase/meeting_migration.sql
```

no SQL Editor do Supabase.

A tabela `meeting_weeks` guarda a programação semanal, temas, cânticos, participantes e configurações do PNG. A leitura é pública para usuários que já passaram pela senha da aplicação; gravação é restrita ao perfil administrativo.

### Atualização automática da fonte oficial

Para que o GitHub Pages consiga consultar a fonte oficial sem depender de CORS do navegador, o projeto inclui:

```text
supabase/functions/meeting-import/index.ts
```

No terminal, com o Supabase CLI configurado:

```bash
supabase functions deploy meeting-import
```

Depois, no `.env` local e nos Secrets do GitHub Actions, configure:

```env
VITE_MEETING_IMPORT_URL=https://SEU-PROJETO.supabase.co/functions/v1/meeting-import
```

No GitHub Pages, adicione `VITE_MEETING_IMPORT_URL` em **Settings → Secrets and variables → Actions** e use esse secret no workflow de build.

Se a função ainda não estiver publicada, o aplicativo tenta consultar a fonte diretamente quando estiver rodando localmente e, se não conseguir, mantém a programação já salva/fallback sem apagar as designações.

### Administrar a reunião

Entre como administrador e abra:

**Painel Administrativo → Reunião meio de semana**

Você encontrará:

- **Atualizar temas** — busca novamente a programação oficial;
- seleção de pessoas para oração, presidente e partes 1–8;
- dirigente e leitor da parte 8;
- oração final;
- grupo de limpeza;
- designações mecânicas;
- **Gerar PNG**.

As partes podem ter mais de uma pessoa, permitindo situações como `Mayara & Anarlete`.

### PNG

O botão **Gerar PNG** cria uma imagem vertical inspirada no modelo fornecido para o projeto, com:

- período da semana;
- congregação;
- data e horário;
- cânticos;
- oração inicial;
- presidente;
- seções Tesouros da Palavra de Deus, Faça seu Melhor no Ministério e Nossa Vida Cristã;
- títulos e duração das partes;
- participantes;
- dirigente e leitor do estudo bíblico;
- oração final;
- limpeza pós-reunião;
- designações mecânicas.

O arquivo é gerado no navegador por Canvas e baixado como:

```text
Reuniao_Meio_de_Semana_AAAA-MM-DD.png
```

### Segurança

Não coloque `.env`, `service_role` ou Secret Key no GitHub. O arquivo `.env` não faz parte do ZIP limpo entregue; crie-o novamente na máquina a partir de `.env.example`.

A autenticação administrativa continua sendo feita pelo Supabase Auth e pelo perfil `profiles.role = 'admin'`.

### Programação semanal do serviço de campo
A programação do Serviço de Campo é exibida por semana (segunda a domingo). O sistema abre na semana atual e permite escolher qualquer outra semana. Cada semana é independente: se não houver registros cadastrados para a semana escolhida, nenhuma informação de local, dirigente, território ou rua será exibida até que o administrador crie as designações daquela semana.


## Painel administrativo v9
O painel foi reorganizado em ambientes: Territórios + Áreas do mapa + Ruas; Grupos + Membros + Locais; Programação + Imagens/Relatórios. A Visão geral e a Reunião de meio de semana permanecem separadas.

### Identificar ruas de um território
Em **Painel Administrativo > Territórios e mapa > Ruas**, clique em **Identificar no mapa**, escolha um território com área desenhada e clique em **Buscar ruas**. Revise os nomes retornados, altere se necessário, adicione apelidos locais e salve somente as ruas desejadas. O recurso usa dados públicos do OpenStreetMap via Overpass e mantém o cadastro manual como alternativa.
