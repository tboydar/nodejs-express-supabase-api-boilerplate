# E-Commerce Demo API

Eine produktionsbereite E-Commerce-Backend-API, entwickelt mit Node.js, Express.js, PostgreSQL und Supabase. Dieses Projekt demonstriert ein vollständiges E-Commerce-Backend mit Produktverwaltung, Benutzerauthentifizierung, Warenkorb und Bestellverwaltung.

## 🚀 Funktionen

### Kern E-Commerce-Funktionalität
- **Produktverwaltung**: CRUD-Operationen, Kategorien, Lagerverfolgung
- **Benutzerauthentifizierung**: Registrierung, Anmeldung mit Supabase Auth
- **Warenkorb**: Artikel hinzufügen/entfernen, Mengenverwaltung
- **Bestellverwaltung**: Bestellungen aufgeben, Bestellhistorie, Statusverfolgung
- **Mock-Zahlung**: Simulierte Zahlungsabwicklung für Demo-Zwecke

### Technische Funktionen
- **RESTful API-Design**: Saubere, konsistente API-Endpunkte
- **Datenbank-Migrationen**: PostgreSQL-Schema-Management mit node-pg-migrate
- **Authentifizierung**: JWT-basierte Authentifizierung mit Supabase
- **Request-Validierung**: Eingabevalidierung und Bereinigung
- **Fehlerbehandlung**: Zentralisierte Fehlerbehandlungs-Middleware
- **Tests**: Umfassende Testsuite mit Jest und Supertest
- **Mock-Daten**: Eingebaute Testdaten für Demo-Zwecke

## 🛠️ Tech-Stack

- **Backend**: Node.js, Express.js
- **Datenbank**: PostgreSQL (über Supabase)
- **Authentifizierung**: Supabase Auth
- **ORM**: Drizzle ORM (typsicher)
- **Tests**: Jest, Supertest
- **Paketmanager**: pnpm
- **Containerisierung**: Docker & Docker Compose
- **Migration**: node-pg-migrate

## 📦 Schnellstart

### Voraussetzungen
- Node.js (v16 oder höher)
- pnpm
- Docker & Docker Compose (für lokale Entwicklung)

### Installation

1. **Repository klonen**
   ```bash
   git clone <repository-url>
   cd nodejs-express-supabase-api-boilerplate
   ```

2. **Abhängigkeiten installieren**
   ```bash
   pnpm install
   ```

3. **Umgebung einrichten**
   ```bash
   cp .env.example .env
   # Bearbeiten Sie .env mit Ihrer Konfiguration
   ```

4. **Mit Docker starten (Empfohlen)**
   ```bash
   docker-compose up
   ```

   Oder **lokal starten**:
   ```bash
   # Datenbank-Migrationen ausführen
   pnpm migrate:up
   
   # Datenbank mit Mock-Daten befüllen
   pnpm db:seed
   
   # Entwicklungsserver starten
   pnpm dev
   ```

Die API ist verfügbar unter `http://localhost:3000`

## 🔧 Verfügbare Skripte

```bash
# Entwicklung
pnpm dev                    # Entwicklungsserver starten
pnpm start                  # Produktionsserver starten

# Datenbank
pnpm migrate:up            # Datenbank-Migrationen ausführen
pnpm migrate:down          # Letzte Migration rückgängig machen
pnpm migrate:create        # Neue Migration erstellen
pnpm db:seed               # Datenbank mit Mock-Daten befüllen

# Drizzle ORM
pnpm db:generate           # Drizzle-Schema generieren
pnpm db:migrate            # Schema-Änderungen übertragen
pnpm db:studio             # Drizzle Studio öffnen

# Tests
pnpm test                   # Alle Tests ausführen
pnpm test:watch            # Tests im Watch-Modus ausführen
pnpm test:coverage         # Tests mit Coverage-Bericht ausführen

# Code-Qualität
pnpm lint                  # ESLint ausführen
pnpm lint:fix              # Linting-Probleme beheben
pnpm format                # Code mit Prettier formatieren

# Docker
docker-compose up          # API + Postgres starten
docker-compose down        # Container stoppen
```

## 📚 API-Dokumentation

### Basis-URL
```
http://localhost:3000/api/v1
```

### Authentifizierung
Die meisten Endpunkte erfordern Authentifizierung. Fügen Sie das JWT-Token im Authorization-Header hinzu:
```
Authorization: Bearer <ihr-jwt-token>
```

### Endpunkt-Übersicht

#### Produkte
- `GET /products` - Produkte auflisten (unterstützt Paginierung, Filterung)
- `GET /products/:id` - Produktdetails abrufen
- `POST /products` - Produkt erstellen (nur Admin)
- `PUT /products/:id` - Produkt aktualisieren (nur Admin)
- `DELETE /products/:id` - Produkt löschen (nur Admin)

#### Kategorien
- `GET /categories` - Alle Kategorien auflisten
- `GET /categories/:id/products` - Produkte nach Kategorie abrufen

#### Authentifizierung
- `POST /auth/register` - Benutzerregistrierung
- `POST /auth/login` - Benutzeranmeldung
- `GET /auth/profile` - Benutzerprofil abrufen
- `PUT /auth/profile` - Benutzerprofil aktualisieren

#### Warenkorb
- `GET /cart` - Warenkorb-Inhalt abrufen
- `POST /cart` - Artikel zum Warenkorb hinzufügen
- `PUT /cart/:id` - Artikelmenge im Warenkorb aktualisieren
- `DELETE /cart/:id` - Artikel aus Warenkorb entfernen

#### Bestellungen
- `POST /orders` - Neue Bestellung erstellen
- `GET /orders` - Benutzerbestellungen abrufen
- `GET /orders/:id` - Bestelldetails abrufen

## 🗄️ Datenbank-Schema

### Kern-Tabellen
- **products** - Produktinformationen, Preise, Lagerbestand
- **categories** - Produktkategorien
- **profiles** - Benutzerprofile (erweitert Supabase auth.users)
- **cart_items** - Warenkorb-Artikel
- **orders** - Bestellinformationen
- **order_items** - Bestellpositionen

### Drizzle ORM Vorteile
- **Typsicherheit** - TypeScript-first Design für weniger Laufzeitfehler
- **Performance** - SQL-nahe Performance mit optimierten Abfragen
- **Entwicklererfahrung** - Ausgezeichnete Autovervollständigung und Drizzle Studio
- **Flexibilität** - Unterstützt komplexe Abfragen und native SQL

## 🧪 Tests

Vollständige Testsuite ausführen:
```bash
pnpm test
```

Tests im Watch-Modus während der Entwicklung ausführen:
```bash
pnpm test:watch
```

Test-Coverage-Bericht generieren:
```bash
pnpm test:coverage
```

## 🚀 Deployment

### Umgebungsvariablen
```bash
# Datenbank
DATABASE_URL=postgresql://benutzername:passwort@localhost:5432/datenbank

# Supabase
SUPABASE_URL=https://ihr-projekt.supabase.co
SUPABASE_ANON_KEY=ihr-anon-key
SUPABASE_SERVICE_ROLE_KEY=ihr-service-role-key

# JWT
JWT_SECRET=ihr-jwt-geheimschlüssel

# App
PORT=3000
NODE_ENV=production
```

### Produktions-Deployment
1. Ihr Supabase-Projekt einrichten
2. Umgebungsvariablen konfigurieren
3. Datenbank-Migrationen ausführen
4. Mit Ihrer bevorzugten Plattform deployen (Vercel, Railway, etc.)

## 🛍️ E-Commerce-Features

### Produktsystem
- CRUD-Operationen für Produkte
- Kategorieverwaltung
- Lagerverfolgung und Warenwirtschaft
- Produktbilder und Galerie-Unterstützung
- SKU-Verwaltung

### Benutzerverwaltung
- Sichere Registrierung und Anmeldung
- Profilmanagement
- Rollenbasierte Zugriffskontrolle (Kunde, Admin)
- Adressverwaltung

### Warenkorb-System
- Artikel hinzufügen/entfernen
- Mengenverwaltung
- Persistente Warenkörbe
- Bestandsprüfung

### Bestellverwaltung
- Bestellerstellung aus Warenkorb
- Bestellstatus-Verfolgung
- Bestellhistorie
- Rechnungs- und Versandadressen

## 🤝 Beitragen

1. Repository forken
2. Feature-Branch erstellen (`git checkout -b feature/tolles-feature`)
3. Änderungen committen (`git commit -m 'Tolles Feature hinzufügen'`)
4. Branch pushen (`git push origin feature/tolles-feature`)
5. Pull Request öffnen

## 📝 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE](LICENSE) Datei für Details.

## 📧 Support

Für Support und Fragen öffnen Sie bitte ein Issue im GitHub-Repository.

---

**Hinweis**: Dies ist eine Demo-Anwendung mit Mock-Daten zu Demonstrationszwecken. Für den Produktionseinsatz implementieren Sie bitte ordnungsgemäße Zahlungsabwicklung, Sicherheitsmaßnahmen und Datenvalidierung.