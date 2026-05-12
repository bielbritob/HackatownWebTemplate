# Hackatown Web Template

Monorepositório para hackathon: **vitrines e admin em HTML/CSS/JS**, **tema por marca**, **API PHP** (exemplo em `htdocs/`), **bot WhatsApp** (`bot-wpp`) e **painel de atendimento**.

## Estrutura

| Pasta | Conteúdo |
|--------|-----------|
| `Faroni/` | Marca exemplo: `Landing/`, `Vitrine/`, `AdminPage/`, `LoginAdmin/`, `theme.css` |
| `3AENGENHARIA/` | Segunda marca (landing + vitrine + `theme.css`) |
| `assets/` | Imagens e ficheiros estáticos partilhados (ex.: logos referenciados como `../../assets/...`) |
| `painel-atendimento/` | Painel web do atendente (usa a API do `bot-wpp` em produção) |
| `bot-wpp/` | Node: WhatsApp + Express (`npm` próprio — ver abaixo) |
| `htdocs/projeto_01_hackatown/` | API PHP de exemplo (login, produtos) |
| `theme.css` (raiz) | Opcional; cada marca pode ter o seu em `Marca/theme.css` |
| `.run/` | Configurações de execução **JetBrains** (WebStorm) versionadas |
| `.vscode/` | Sugestões e definições para **VS Code** + Live Server |

## Pré-requisitos

- **Node.js** 18+ (recomendado LTS)
- **npm** (vem com o Node)
- Para PHP/MySQL: **XAMPP** (ou similar) + **MySQL** + **Beekeeper** (opcional), conforme o teu fluxo

## Instalação (clone em qualquer máquina)

Na raiz do repositório:

```bash
npm install
```

Para o bot (pasta separada com as suas dependências):

```bash
cd bot-wpp && npm install && cd ..
```

## Forma recomendada de ver o site: **Vite** (`npm run dev`)

Funciona igual no WebStorm, VS Code ou terminal. O Vite:

- Serve o projeto na raiz (caminhos `../../assets/...` e `../theme.css` funcionam)
- Expõe a pasta `assets/` em `http://localhost:5173/assets/...`
- Faz **proxy** de `/api/*` para `http://127.0.0.1:3000` (útil para o painel falar com o bot enquanto desenvolves o front)

```bash
npm run dev
```

Abre por defeito a landing Faroni. Outras entradas úteis:

- Landing Faroni: `http://localhost:5173/Faroni/Landing/index.html`
- Vitrine Faroni: `http://localhost:5173/Faroni/Vitrine/index.html`
- Admin Faroni: `http://localhost:5173/Faroni/AdminPage/admin.html`
- Login admin: `http://localhost:5173/Faroni/LoginAdmin/LoginAdmin.html`
- Painel atendimento: `http://localhost:5173/painel-atendimento/index.html` (com o bot a correr na porta 3000)
- 3A Engenharia: `http://localhost:5173/3AENGENHARIA/Landing/index.html` e `.../Vitrine/index.html`

Build estático (para deploy sem servidor Node):

```bash
npm run build
```

Saída em `dist/`. Para pré-visualizar o build: `npm run preview`.

## VS Code + **Live Server**

1. Abre a **pasta raiz** do repositório no VS Code (File → Open Folder).
2. Instala a extensão **Live Server** (o projeto sugere extensões ao abrir).
3. Abre um HTML (ex.: `Faroni/Landing/index.html`) e usa **“Open with Live Server”** (ou clique em “Go Live”).

Com `liveServer.settings.root` na raiz do workspace (já definido em `.vscode/settings.json`), os URLs ficam alinhados com os caminhos relativos (`/Faroni/...`, `/assets/...`).

**Nota:** Live Server **não** faz proxy da API do bot. Para o painel com `/api`, usa **Vite** com o bot a correr, ou abre o painel em `http://localhost:3000/painel-atendimento/index.html` quando só o bot estiver ativo.

## JetBrains **WebStorm**

- As configurações partilhadas estão em **`.run/`**:
  - **Vite (site estático)** → `npm run dev`
  - **Bot WhatsApp + API** → `npm run bot` (equivale a `node bot-wpp/index.js`)
- Abre **Run → Edit Configurations** e escolhe uma destas (o WebStorm importa ficheiros `.run/*.run.xml` na raiz).

## Bot WhatsApp e painel

```bash
npm run bot
```

Ou: `cd bot-wpp && node index.js`

- API e painel estático: `http://localhost:3000` (ajusta `PORT` se precisares)
- Migrações SQL: `bot-wpp/sql/schema_atendimento.sql`

Detalhes do fluxo bot ↔ painel ↔ MySQL mantêm-se na pasta `bot-wpp` e no código comentado.

## API PHP (XAMPP)

Coloca a pasta `htdocs/projeto_01_hackatown` (ou o projeto PHP completo) no document root do Apache e configura a base de dados que o PHP e o bot usarem. O front em HTML pode apontar para URLs absolutas da API em desenvolvimento.

## Firebase / chaves

Se no futuro adicionares `firebase.js` ou outras chaves, **não** faças commit de segredos: usa variáveis de ambiente ou ficheiros locais listados no `.gitignore`.

## Licença

ISC (conforme `package.json`).
