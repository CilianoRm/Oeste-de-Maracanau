# Status — Território Oeste de Maracanaú

Atualização: sistema de ruas por território e geração de PNG 6–10 saídas.

## Alterações desta versão

- Cadastro administrativo de ruas em `territory_roads`.
- Cada rua fica vinculada a um território.
- Na programação, a seleção é em cascata: Território → Rua.
- Ao trocar o território, a lista de ruas é atualizada automaticamente.
- Se não houver rua cadastrada, existe fallback para digitação manual.
- Cadastro/edição de ruas inclui faixa de números e referência.
- Realtime agora também acompanha `territory_roads`.
- Consulta de membros usa a coluna atual `name`, mantendo fallback para `full_name` em registros antigos.
- Gerador de PNG refeito com Canvas nativo, evitando imagem vazia.
- PNG exige no mínimo 6 e permite no máximo 10 saídas.
- A tela administrativa permite escolher 6, 7, 8, 9 ou 10 quando houver quantidade suficiente.
- Layout do PNG foi desenhado para compartilhamento, com cabeçalho, tabela, período e rodapé.
- Schema foi atualizado para refletir `members.name` e os campos de programação usados pelo aplicativo.

## Ajustes de 07/09/2026 — reunião
- Proxy local Vite para WOL: evita CORS durante `npm run dev`.
- Snapshot semanal do WOL via GitHub Actions: atualização automática toda segunda-feira no GitHub Pages.
- Edge Function mantida como atualização alternativa/sob demanda e script Windows de publicação incluído.
- PNG: nomes em uma linha com redução automática de fonte.
- PNG/tela: designações mecânicas em negrito e texto escuro.
- PNG: corrigida inclusão das partes 1, 2 e 3 na seção Tesouros.

## v4 — Designações por semana
- Seletor de semana no admin da reunião, com semana anterior/próxima e data.
- Cada semana mantém suas próprias designações.
- Participantes aparecem como primeiro nome + último sobrenome.
- Designações mecânicas agora escolhem irmãos cadastrados, usando o mesmo seletor das partes.
- Grupo de limpeza agora é escolhido entre os grupos cadastrados.
- PNG e tela usam nomes abreviados e designações mecânicas cadastradas.

## Exportação da reunião — padrão visual v5
- PDF A4 e PNG usam exatamente o mesmo renderizador visual.
- Cabeçalho da semana fica em uma única linha, alinhado com os títulos laterais.
- Textos das partes ficam em peso normal; nomes/designações ficam em negrito.
- Ícones vetoriais foram adicionados aos quadrados laterais das seções, limpeza e mecânicas.
- Horários seguem a lógica da programação e, para início às 19:30 com as durações padrão, reproduzem 19:36, 19:46, 19:56, 20:01, 20:05, 20:10, 20:21, 20:36, 21:06 e 21:10.


## Ajustes v6 — ícones e textos do Ministério
- Ícones vetoriais do quadro da reunião refinados para ficarem mais próximos do padrão visual aprovado (diamante, espiga, ovelha, limpeza e controles).
- As partes 4, 5 e 6 agora aumentam a altura automaticamente quando a fonte oficial traz instruções/subtítulos maiores.
- O texto complementar é quebrado em até 3 linhas, com redução suave de fonte quando necessário, sem sobrepor a parte seguinte.
- PNG e PDF usam o mesmo renderizador, portanto recebem os mesmos ajustes.

## v7 — Serviço de campo por semana
- A tela **Serviço de campo** agora sempre abre na semana atual, de segunda-feira a domingo.
- É possível navegar para a semana anterior/próxima, escolher uma data e voltar para a semana atual.
- Se não houver designações cadastradas para a semana escolhida, o Serviço de Campo fica vazio até que o administrador cadastre local, dirigente, território e demais informações para aquela semana.
- No **Painel Administrativo > Programação**, o administrador escolhe a semana das designações.
- Cada semana é independente: nenhuma programação de outra semana é reutilizada automaticamente.
- O formulário calcula automaticamente a data correta dentro da semana ao mudar o dia da semana.
- **Imagens / relatórios** também ganhou seleção de semana e gera o PNG usando a semana escolhida.
- Não exige alteração no banco de dados: utiliza os campos `weekday`, `weekday_name` e `service_date` já existentes.


## Painel administrativo v9
O painel foi reorganizado em ambientes: Territórios + Áreas do mapa + Ruas; Grupos + Membros + Locais; Programação + Imagens/Relatórios. A Visão geral e a Reunião de meio de semana permanecem separadas.

## v10 — Identificação de ruas pelo mapa
- Em **Territórios e mapa > Ruas**, o botão **Identificar no mapa** consulta vias nomeadas do OpenStreetMap/Overpass que cruzam a área desenhada do território.
- O administrador revisa a lista antes de salvar, podendo desmarcar ruas e alterar o nome detectado.
- Cada rua pode receber um **apelido / identificação** (armazenado no campo existente `reference`, sem exigir migração do banco).
- Ruas já cadastradas no mesmo território são reconhecidas e não são duplicadas.
- A programação de campo mostra o apelido junto do nome oficial ao escolher uma rua.
- Cadastro e edição manuais continuam disponíveis para ruas ausentes ou desatualizadas no mapa.
