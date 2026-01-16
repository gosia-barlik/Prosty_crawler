# Wymagania
Node.js >= 18

# KROK 1 - Utworzenie projektu
npm init -y

# KROK 2 - Konfiguracja projektu
w package.json dodać:
{
  "type": "module",
  "scripts": {
    "start": "node src/index.js"
  }
}

# KROK 3 - Instalacja zależności
npm install crawlee playwright
npx playwright install

# KROK 4 - Utworzenie index.js

crawler/
├── src/
│   └── index.js
├── package.json
└── package-lock.json

# KROK 5 - Uruchomienie
npm start