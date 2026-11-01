# Achei Mobile

Aplicativo móvel do Achei, mantido em repositório separado do frontend web e da API. A base usa Expo, React Native, TypeScript e Expo Router para Android e iOS, consumindo a mesma API Go e o mesmo banco do produto.

## Estado inicial

- Projeto Expo SDK 58 criado com rotas e identidade visual inicial do Achei.
- IDs nativos: `tech.praesens.achei` (Android e iOS).
- A integração móvel com Clerk e as telas funcionais do inventário ainda serão adicionadas.
- O backend continua sendo a API existente; este repositório não cria outro banco nem outra API.

## Desenvolvimento

```bash
npm install
cp .env.example .env
npm start
```

Para abrir no Android ou iOS, use um development build. A autenticação nativa do Clerk e a câmera/QR code dependem de módulos nativos e não funcionam no Expo Go. Builds de iOS precisam ser feitos no macOS ou via EAS Build.

## Configuração pendente do Clerk

O app deverá reutilizar a aplicação Clerk do Achei. Antes de integrar login nativo:

1. Habilite **Native API** em Clerk Dashboard → Native applications.
2. Registre o app Android e iOS com os IDs definidos em `app.json`.
3. Configure a chave pública da instância no `.env` como `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.

Nunca coloque `CLERK_SECRET_KEY`, `DATABASE_URL` ou qualquer segredo neste app. Valores `EXPO_PUBLIC_*` são incluídos no bundle e não podem ser segredos.

## Variáveis

- `EXPO_PUBLIC_API_URL`: URL HTTPS da API Go do Achei.
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`: chave pública do Clerk para a instância apropriada.

O `.env` local é ignorado pelo Git. Use `.env.example` como referência e não publique credenciais.
