# RestoManager Pro

Application de gestion opérationnelle et comptable pour la restauration (Horeca), développée dans le cadre du projet de fin d'études (**EAFC Namur-Cadets** — Encadrant : Yolan Fery).

## Architecture Microservices

Le projet est structuré en **monorepo** autour de deux microservices Spring Boot autonomes (bases de données isolées) et d'une interface client React :

    +--------------------+      HTTP / JWT (Bearer)      +-----------------------------------+
    |   Frontend React   | ----------------------------> |        restaurant-service         |
    |  TypeScript + TW4  |                               |             (Port 8081)           |
    |    (Port 5173)     | --+                           | - Authentification JWT & RBAC     |
    +--------------------+   |                           | - Carte, Produits & TVA           |
                             |                           | - Plan de salle & Réservations    |
                             |                           +-----------------+-----------------+
                             |                                             |
                             |   HTTP / JWT (Bearer)                       | PostgreSQL (restaurant_db)
                             |                           +-----------------v-----------------+
                             +-------------------------> |           order-service           |
                                                         |             (Port 8082)           |
                                                         | - Prise de commande & Snapshots   |
                                                         | - Écran Cuisine (KDS)             |
                                                         | - Reporting & Export CSV          |
                                                         +-----------------+-----------------+
                                                                           |
                                                                           | RestClient (HTTP)
                                                                           v
                                                         Synchronisation Produits & Tables
                                                         + PostgreSQL (order_db)

## Stack Technique

- **Back-End :** Java 21+, Spring Boot 4.1.2, Spring Data JPA, Spring Security (JWT HMAC-SHA256 stateless), Flyway Migrations.
- **Bases de données :** PostgreSQL 16 (2 instances logiques isolées : `restaurant_db` et `order_db`).
- **Front-End :** React 19, TypeScript, Vite, Tailwind CSS v4.
- **Qualité & DevOps :** JUnit 5, Mockito, GitHub Actions (CI), Conventional Commits, Release-Please.

## Sécurité & Contrôle d'Accès (RBAC)

L'authentification repose sur des jetons **JWT signés (HS256)** émis par `restaurant-service` (`/api/auth/login`) et validés de manière stateless par `order-service`.

| Rôle | Compte de démonstration | Mot de passe | Permissions clés |
| :--- | :--- | :--- | :--- |
| **ADMIN** (Gérant) | `admin@restomanager.be` | `password123` | Accès complet : gestion carte/prix, salle, commandes, rapports TVA et export CSV. |
| **WAITER** (Salle) | `serveur@restomanager.be` | `password123` | Plan de salle, réservations, prise de commande, préparations rapides, service et encaissement. |
| **KITCHEN** (Cuisine) | `cuisine@restomanager.be` | `password123` | Écran cuisine (KDS), suivi des préparations, rupture de stock sur les produits. |

## Règles Métier Implémentées

1. **Intégrité comptable par Snapshots :** Lorsqu'une commande est validée dans `order-service`, le nom du produit, son prix HTVA et son taux de TVA belge (12 % nourriture, 21 % boissons) sont figés dans `order_items`.
2. **Anti-surbooking :** Le moteur de réservation bloque toute double réservation sur une même table dans une fenêtre glissante de **±2 heures** et vérifie la capacité maximale de couverts.
3. **Export Comptable CSV :** Ventilation automatique de la TVA collectée par taux et génération du journal de caisse (`GET /api/reports/export.csv`).

## Lancement en Local

1. **Démarrer l'infrastructure PostgreSQL (Docker) :**
   `docker compose up -d`
2. **Démarrer les deux microservices Back-End (dans deux terminaux distincts) :**
   - `cd restaurant-service && ./mvnw spring-boot:run`
   - `cd order-service && ./mvnw spring-boot:run`
3. **Démarrer l'interface Front-End React :**
   - `cd frontend && npm install && npm run dev`
   - Ouvrir `http://localhost:5173`