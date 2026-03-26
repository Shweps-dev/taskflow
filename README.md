<<<<<<< HEAD
# TaskFlow — Task Manager

Viacdielna kontajnerizovaná webová aplikácia pre správu úloh (Task Manager) s autentifikáciou používateľov, CRUD operáciami a kategóriami.

---

## Architektúra

```
┌─────────────────────────────────────────────────────┐
│  Používateľský prehliadač                           │
└──────────────────────┬──────────────────────────────┘
                       │ :8080
          ┌────────────▼────────────┐
          │  FRONTEND               │  ← fe-be-network
          │  nginx + React (Vite)   │
          │  Port: 80 (kontajner)   │
          └────────────┬────────────┘
                       │ proxy /api → backend:4000
          ┌────────────▼────────────┐
          │  BACKEND                │  ← be-db-network
          │  Node.js + Express      │
          │  Port: 4000             │
          └────────────┬────────────┘
                       │ pg://db:5432
          ┌────────────▼────────────┐
          │  DATABASE               │
          │  PostgreSQL 16          │
          │  Port: 5432             │
          │  Volume: taskflow-pgdata│
          └─────────────────────────┘
```

### Sieťová izolácia

| Sieť              | Popis                                  |
|-------------------|----------------------------------------|
| `taskflow-fe-be`  | Frontend ↔ Backend komunikácia         |
| `taskflow-be-db`  | Backend ↔ Databáza komunikácia         |

> **Databáza nie je priamo dostupná z frontendu** — frontend je len v sieti `fe-be`, databáza len v sieti `be-db`. Backend je v oboch sieťach a slúži ako jediný sprostredkovateľ.

---

## Technológie

| Vrstva     | Technológia                        | Verzia  |
|------------|------------------------------------|---------|
| Frontend   | React, Vite, React Router          | 18 / 5  |
| Web server | nginx                              | 1.27    |
| Backend    | Node.js, Express                   | 22 / 4  |
| Autentif.  | JWT (jsonwebtoken), bcryptjs       | latest  |
| Databáza   | PostgreSQL                         | 16      |
| Kontejnery | Docker, Docker Compose             | latest  |

---

## Funkcie aplikácie

- **Registrácia a prihlásenie** — heslá hashované pomocou bcrypt (12 rounds)
- **JWT autentifikácia** — tokeny s expiráciou
- **CRUD úlohy** — vytvorenie, zobrazenie, úprava, mazanie úloh
- **CRUD kategórie** — vlastné kategórie s farebnými štítkami
- **Filtrovanie** — podľa stavu, priority, kategórie, fulltext vyhľadávanie
- **Stavy úloh** — `todo`, `in_progress`, `done`
- **Priority** — `low`, `medium`, `high`
- **Termín (due date)** — voliteľný dátum splnenia

---

## Požiadavky

- Docker Engine ≥ 24
- Docker Compose ≥ 2.20
- Voľný port `8080` (konfigurovateľné)

---

## Spustenie

### 1. Klonovanie / rozbalenie projektu

```bash
cd taskmanager
```

### 2. Konfigurácia

Súbor `.env` je priložený s predvolenými hodnotami. **Pred nasadením zmeňte heslo a JWT secret:**

```bash
# Vygenerujte silný JWT secret:
openssl rand -hex 32
```

Upravte `.env`:

```env
DB_PASSWORD=vaše_silné_heslo
JWT_SECRET=vygenerovaný_secret
```

### 3. Spustenie aplikácie

```bash
chmod +x start-app.sh end-app.sh
./start-app.sh
```

Alebo priamo cez Docker Compose:

```bash
docker compose up --build -d
```

### 4. Otvorte aplikáciu

```
http://localhost:8080
```

---

## Zastavenie aplikácie

```bash
./end-app.sh
```

Dáta v databáze zostanú zachované v Docker volume `taskflow-pgdata`.

Ak chcete odstrániť aj dáta:

```bash
docker volume rm taskflow-pgdata
```

---

## REST API — prehľad endpointov

### Auth

| Metóda | Endpoint              | Popis                  |
|--------|-----------------------|------------------------|
| POST   | `/api/auth/register`  | Registrácia            |
| POST   | `/api/auth/login`     | Prihlásenie            |
| GET    | `/api/auth/me`        | Aktuálny používateľ    |

### Tasks

| Metóda | Endpoint                    | Popis               |
|--------|-----------------------------|---------------------|
| GET    | `/api/tasks`                | Zoznam úloh         |
| POST   | `/api/tasks`                | Nová úloha          |
| PUT    | `/api/tasks/:id`            | Úprava úlohy        |
| PATCH  | `/api/tasks/:id/status`     | Zmena stavu         |
| DELETE | `/api/tasks/:id`            | Zmazanie úlohy      |

### Categories

| Metóda | Endpoint                | Popis                |
|--------|-------------------------|----------------------|
| GET    | `/api/categories`       | Zoznam kategórií     |
| POST   | `/api/categories`       | Nová kategória       |
| PUT    | `/api/categories/:id`   | Úprava kategórie     |
| DELETE | `/api/categories/:id`   | Zmazanie kategórie   |

---

## Štruktúra projektu

```
taskmanager/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── middleware/auth.js
│       ├── models/db.js
│       └── routes/
│           ├── auth.js
│           ├── tasks.js
│           └── categories.js
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── api/client.js
│       ├── context/AuthContext.jsx
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   └── DashboardPage.jsx
│       └── components/
│           ├── TaskModal.jsx
│           └── CategoryModal.jsx
├── docker-compose.yml
├── .env
├── start-app.sh
├── end-app.sh
└── README.md
```

---

## Konfigurácia — premenné prostredia

| Premenná        | Popis                            | Predvolená hodnota |
|-----------------|----------------------------------|--------------------|
| `DB_NAME`       | Názov databázy                   | `taskmanager`      |
| `DB_USER`       | Používateľ databázy              | `taskuser`         |
| `DB_PASSWORD`   | Heslo databázy                   | —                  |
| `JWT_SECRET`    | Tajný kľúč pre JWT tokeny        | —                  |
| `JWT_EXPIRES_IN`| Platnosť tokenu                  | `7d`               |
| `FRONTEND_PORT` | Port na hosťovskom systéme       | `8080`             |

> Citlivé hodnoty (`DB_PASSWORD`, `JWT_SECRET`) nie sú nikdy hardcodované v zdrojovom kóde.
=======
# taskflow
Full-stack task manager app with authentication, CRUD operations, and Docker deployment
>>>>>>> 189ccac (Initial commit)
