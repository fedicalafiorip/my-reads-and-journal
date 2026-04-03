# 📚 Book Journal — Guia de Deploy

## O que você vai precisar

- Uma conta Google (para Firebase — gratuito)
- Uma conta GitHub (gratuita)  
- Uma conta Vercel (gratuita — crie com seu GitHub)

## Tempo estimado: ~30 minutos

---

## PASSO 1: Criar projeto no Firebase (5 min)

1. Acesse **https://console.firebase.google.com**
2. Clique **"Criar um projeto"** (ou "Add project")
3. Nome do projeto: `book-journal` → clique Continuar
4. Desative o Google Analytics (não precisa) → clique Criar projeto
5. Quando carregar, clique **"Continuar"**

### 1.1 — Ativar Autenticação
1. No menu lateral, clique em **"Authentication"**
2. Clique **"Começar"** (Get started)
3. Na aba "Sign-in method", ative **"Google"**
4. Escolha seu email como email de suporte → Salvar
5. Ative também **"Anônimo"** (Anonymous) → Salvar

### 1.2 — Criar banco de dados (Firestore)
1. No menu lateral, clique em **"Firestore Database"**
2. Clique **"Criar banco de dados"** (Create database)
3. Selecione **"Iniciar no modo de teste"** (Start in test mode)
4. Escolha a região mais próxima (ex: `southamerica-east1`) → Criar

### 1.3 — Registrar o app web
1. Na página inicial do projeto, clique no ícone **"</>"** (Web)
2. Nome do app: `book-journal` 
3. Marque **"Also set up Firebase Hosting"** — NÃO precisa
4. Clique **"Register app"**
5. Vai aparecer um bloco de código com `firebaseConfig`. **COPIE esses valores:**

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "book-journal-xxxxx.firebaseapp.com",
  projectId: "book-journal-xxxxx",
  storageBucket: "book-journal-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

6. Abra o arquivo `src/firebase.js` do projeto e cole esses valores no lugar indicado.

---

## PASSO 2: Configurar o projeto (5 min)

1. Abra o arquivo `src/firebase.js`
2. Substitua os valores de `firebaseConfig` pelos seus (do passo 1.3)
3. Salve o arquivo

---

## PASSO 3: Subir para o GitHub (5 min)

### Opção A — Pelo site do GitHub (mais fácil):
1. Acesse **https://github.com/new**
2. Nome do repositório: `book-journal`
3. Deixe público → clique **"Create repository"**
4. Clique **"uploading an existing file"**
5. Arraste TODOS os arquivos da pasta `book-journal-app` para a área de upload
6. Clique **"Commit changes"**

### Opção B — Pelo terminal (se souber usar Git):
```bash
cd book-journal-app
git init
git add .
git commit -m "Book Journal app"
git remote add origin https://github.com/SEU_USUARIO/book-journal.git
git push -u origin main
```

---

## PASSO 4: Deploy na Vercel (5 min)

1. Acesse **https://vercel.com** e faça login com GitHub
2. Clique **"Add New" → "Project"**
3. Encontre o repositório `book-journal` e clique **"Import"**
4. Em **"Framework Preset"**, selecione **"Vite"**
5. Clique **"Deploy"**
6. Aguarde 1-2 minutos. Quando terminar, você recebe uma URL como:
   `https://book-journal-abc123.vercel.app`

🎉 **Pronto! Seu app está online!**

---

## PASSO 5: Instalar no celular como app (1 min)

### iPhone/iPad:
1. Abra a URL no Safari
2. Toque no botão de compartilhar (⬆️)
3. Toque em **"Adicionar à Tela de Início"**
4. Dê o nome "Book Journal" → Adicionar

### Android:
1. Abra a URL no Chrome
2. Toque nos 3 pontinhos (⋮)
3. Toque em **"Instalar app"** ou **"Adicionar à tela inicial"**

---

## PASSO 6: Convidar amigas 🎉

Envie a URL do seu app para suas amigas!  
Cada uma:
1. Abre o link
2. Faz login com Google (para o Book Club)
3. Cria seu perfil no Book Club
4. Tem sua própria biblioteca pessoal

---

## Segurança do Firestore (IMPORTANTE - fazer depois de testar)

O modo de teste expira em 30 dias. Para manter seguro, vá em:
Firestore → Rules, e substitua as regras por:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookclub/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

Isso garante que só usuários logados possam ler/escrever no Book Club.

---

## Problemas comuns

**"Module not found"** → Rode `npm install` antes de qualquer coisa  
**Firebase error** → Verifique se colou o `firebaseConfig` corretamente  
**Tela branca** → Abra o console do navegador (F12) e veja o erro  
**Book Club não sincroniza** → Verifique se o Firestore está ativo no Firebase Console  

---

## Estrutura do projeto

```
book-journal-app/
├── index.html              ← Página HTML principal
├── package.json            ← Dependências do projeto
├── vite.config.js          ← Configuração do build
├── public/
│   ├── manifest.json       ← Config PWA (instalar como app)
│   └── icon-192.png        ← Ícone do app (trocar pelo seu)
├── src/
│   ├── main.jsx            ← Entrada do React
│   ├── App.jsx             ← Todo o código do app
│   ├── firebase.js         ← Configuração Firebase (editar!)
│   ├── storage.js          ← Camada de dados
│   └── index.css           ← Estilos globais
└── GUIA-DEPLOY.md          ← Este guia
```
