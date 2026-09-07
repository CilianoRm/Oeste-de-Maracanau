# Reunião de meio de semana — atualização automática

## No Visual Studio Code / `npm run dev`

A versão atual usa um **proxy local do Vite** para buscar a página oficial do WOL pelo servidor do seu computador. Isso evita o bloqueio CORS do navegador.

Portanto, ao executar:

```bash
npm run dev
```

a tela da reunião tenta atualizar diretamente da fonte oficial. O endereço `wol.jw.org` não é chamado pelo navegador; quem faz a consulta é o servidor local do Vite.

## No GitHub Pages

GitHub Pages é um site estático e não consegue fazer essa ponte sozinho. Para a atualização automática funcionar online, publique a função `meeting-import` do Supabase.

No Windows, dê dois cliques em:

`supabase/DEPLOY_REUNIAO_WINDOWS.bat`

O script usa o projeto Supabase `xlvjugjwhfdhbaluphhy`, abre o login do Supabase e publica a função.

Depois confira seu `.env`:

```env
VITE_MEETING_IMPORT_URL=https://xlvjugjwhfdhbaluphhy.supabase.co/functions/v1/meeting-import
```

No GitHub, a mesma variável deve existir em **Settings > Secrets and variables > Actions** como `VITE_MEETING_IMPORT_URL`.

## Erro 404

Se aparecer:

`functions/v1/meeting-import ... 404`

isso significa que a função ainda não foi publicada naquele projeto Supabase. Não é erro da página oficial. Execute o arquivo `.bat` acima.
