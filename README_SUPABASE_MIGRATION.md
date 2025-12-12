# Migração Firebase → Supabase (resultado automático)

Este projeto foi parcialmente migrado para usar **Supabase** em vez de Firebase/Firestore.
Alterações principais:
- Removido uso de Firebase/Firestore.
- Adicionado `src/supabaseClient.js` (usa VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY).
- `src/Admin.jsx` convertido para usar Supabase realtime and supabase.from(...).
- Removidos arquivos do Firebase (service worker e src/firebase.js).
- Adicionado `supabase_schema.sql` com esquema inicial para a tabela `doceeser_pedidos`.

## Variáveis de ambiente
Crie um arquivo `.env` (ou configure no painel do Vite) com:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Como criar as tabelas no Supabase
1. Acesse seu projeto Supabase.
2. Vá em SQL Editor → New Query e cole o conteúdo de `supabase_schema.sql`.
3. Execute para criar a tabela `doceeser_pedidos`.

> Observação: O script cria uma tabela com campos `id`, `data` (jsonb), `status` e `createdAt`.  
> Para uma migração completa dos dados do Firestore, exporte suas coleções para JSON e importe no Supabase (veja instruções abaixo).

## Importando dados do Firestore (resumo)
1. Exporte a coleção `doceeser_pedidos` do Firestore como JSON.
2. Transforme cada documento para inserir nas colunas:
   - `id` = document ID
   - `data` = objeto JSON inteiro (campo jsonb)
   - `status` = data.status (se existir)
   - `createdAt` = data.createdAt (converta para timestamptz)
3. Use `supabase` CLI, `psql` ou SQL editor do Supabase para inserir os registros.

## Notas importantes
- O projeto agora usa notificações in-app via Supabase realtime. O Firebase Cloud Messaging (FCM) foi removido — se você precisa de push nativo para dispositivos, podemos integrar OneSignal ou outro provedor.
- Revise as políticas RLS (Row Level Security) no Supabase antes de colocar em produção.