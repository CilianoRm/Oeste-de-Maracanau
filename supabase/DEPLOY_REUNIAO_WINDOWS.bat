@echo off
chcp 65001 >nul
set PROJECT_REF=xlvjugjwhfdhbaluphhy

echo ================================================
echo Publicar importador da Reuniao no Supabase
echo ================================================
echo.
echo 1. O navegador sera aberto para voce entrar no Supabase.
echo 2. Depois, a funcao meeting-import sera publicada.
echo.

call npx supabase login
if errorlevel 1 goto :erro

call npx supabase functions deploy meeting-import --project-ref %PROJECT_REF% --no-verify-jwt
if errorlevel 1 goto :erro

echo.
echo ================================================
echo PRONTO: meeting-import foi publicada.
echo Reinicie o site e clique em Atualizar programacao.
echo ================================================
pause
exit /b 0

:erro
echo.
echo Nao foi possivel concluir automaticamente.
echo Confira sua conexao com a internet e se entrou na conta correta do Supabase.
pause
exit /b 1
