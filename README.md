# 📚 Book Journal — Guia de Instalação

Seu app de biblioteca pessoal e Book Club, pronto para publicar online.

---

## O que você vai precisar

- Uma conta Google (para o Firebase — gratuito)
- Uma conta GitHub (para hospedar o código — gratuito)
- Uma conta Vercel (para publicar online — gratuito)
- Um computador com acesso à internet

**Tempo estimado: 20-30 minutos**

---

## Passo 1: Criar o projeto no Firebase (banco de dados)

1. Acesse **https://console.firebase.google.com**
2. Clique em **"Criar um projeto"** (ou "Add project")
3. Dê o nome **"book-journal"** e clique em Continuar
4. Desative o Google Analytics (não precisamos) e clique em **Criar projeto**
5. Aguarde e clique em **Continuar**

### 1.1: Criar o banco de dados Firestore

1. No menu lateral, clique em **"Firestore Database"** (ou "Cloud Firestore")
2. Clique em **"Criar banco de dados"**
3. Selecione **"Iniciar no modo de teste"** (permite leitura/escrita livre por 30 dias — depois ajustaremos as regras)
4. Escolha a região **"southamerica-east1"** (São Paulo) e clique em **Ativar**

### 1.2: Registrar o app web

1. Na página inicial do projeto Firebase, clique no ícone **"Web"** (parece `</>`)
2. Dê o apelido **"book-journal-web"**
3. **NÃO** marque "Firebase Hosting"
4. Clique em **"Registrar app"**
5. Vai aparecer um bloco de código com `firebaseConfig`. **Copie os valores** — você vai precisar deles no Passo 4

Vai ser algo assim:
```js
const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "book-journal-xxxxx.firebaseapp.com",
  projectId: "book-journal-xxxxx",
  storageBucket: "book-journal-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

---

## Passo 2: Subir o código no GitHub

### Opção A: Pelo site (mais fácil)

1. Acesse **https://github.com** e faça login (ou crie uma conta)
2. Clique no **"+"** no canto superior direito → **"New repository"**
3. Nome: **book-journal** | Deixe como **Public** | Clique em **"Create repository"**
4. Na página do repositório, clique em **"uploading an existing file"**
5. Arraste **TODA a pasta** `book-journal-app` (com todos os arquivos dentro)
6. Clique em **"Commit changes"**

### Opção B: Pelo terminal (se souber usar)

```bash
cd book-journal-app
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/book-journal.git
git push -u origin main
```

---

## Passo 3: Publicar no Vercel

1. Acesse **https://vercel.com** e faça login com sua conta GitHub
2. Clique em **"Add New..."** → **"Project"**
3. Encontre o repositório **"book-journal"** e clique em **"Import"**
4. Em **Framework Preset**, selecione **"Vite"**
5. Clique em **"Deploy"**
6. Aguarde 1-2 minutos. Quando aparecer **"Congratulations!"**, seu app está no ar!
7. Você receberá um link tipo `book-journal-xxx.vercel.app`

**Esse é o link que você vai compartilhar com suas amigas!**

---

## Passo 4: Configurar o Firebase no código

1. Abra o arquivo `src/firebase.js` no GitHub (clique no arquivo → ícone de lápis para editar)
2. Substitua os valores de exemplo pelos que você copiou no Passo 1.2:

```js
const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};
```

3. Clique em **"Commit changes"**
4. O Vercel vai detectar a mudança e re-publicar automaticamente em ~1 minuto

---

## Passo 5: Configurar regras de segurança do Firestore

Após os 30 dias do modo de teste, você precisa adicionar regras. No Firebase Console:

1. Vá em **Firestore Database** → **Regras**
2. Substitua o conteúdo por:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookclub/{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Clique em **"Publicar"**

> ⚠️ Essas regras permitem acesso livre. Para um app público com muitos usuários, você precisaria de autenticação. Para uso entre amigas, é suficiente.

---

## Passo 6: Adicionar à tela inicial do celular (PWA)

### iPhone/iPad:
1. Abra o link do app no **Safari**
2. Toque no ícone de **compartilhar** (quadrado com seta pra cima)
3. Toque em **"Adicionar à Tela de Início"**
4. Confirme o nome e toque em **"Adicionar"**

### Android:
1. Abra o link no **Chrome**
2. Toque nos **três pontinhos** → **"Adicionar à tela inicial"**

Agora o app aparece como um ícone no seu celular, abre em tela cheia e funciona como um app nativo!

---

## Passo 7: Convidar suas amigas

1. Envie o link do Vercel por WhatsApp/iMessage
2. Cada amiga abre o link e adiciona à tela inicial
3. Na aba **Book Club**, cada uma cria seu perfil
4. Pronto! Todas compartilham o mesmo Book Club 🎉

**Dados pessoais** (biblioteca, wishlist) ficam no celular de cada uma.
**Dados do Book Club** (livro do mês, votação, updates) são compartilhados via Firebase em tempo real.

---

## Estrutura do projeto

```
book-journal-app/
├── public/
│   ├── manifest.json      ← Configuração PWA
│   └── icon.svg           ← Ícone do app
├── src/
│   ├── main.jsx           ← Ponto de entrada
│   ├── App.jsx            ← Todo o app (componentes, lógica, UI)
│   └── firebase.js        ← Configuração Firebase + storage
├── index.html             ← HTML base
├── package.json           ← Dependências
├── vite.config.js         ← Configuração do Vite
└── README.md              ← Este arquivo
```

---

## Precisa de ajuda?

Se tiver problemas, volte ao Claude e descreva o erro. Posso te ajudar a resolver!

Funcionalidades do app:
- 📚 Biblioteca pessoal com review, avaliação e citações
- 📋 Wishlist com ordenação
- 📖 Séries de livros agrupadas
- 📱 Rastreamento Kindle Unlimited
- 💜 Lista "Eu Recomendo" com compartilhamento
- 📖 Book Club com membros, progresso e ranking
- 🗳️ Votação do próximo livro
- 📊 Estatísticas e análises
- ⏱️ Contador de dias de leitura
- ⚙️ Backup e restauração de dados
