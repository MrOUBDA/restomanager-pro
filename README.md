# RestoManager Pro

Application de gestion opérationnelle, analytique et comptable pour la restauration (Horeca), développée dans le cadre du projet de fin d'études (**EAFC Namur-Cadets** — Encadrant : Yolan Fery).

## Architecture Microservices

Le projet est structuré en **monorepo** autour de deux microservices Spring Boot autonomes (bases de données isolées) et d'une interface client React :

    +--------------------+      HTTP / JWT (Bearer)      +-----------------------------------+
    |   Frontend React   | ----------------------------> |        restaurant-service         |
    |  TypeScript + TW4  |                               |             (Port 8081)           |
    |    (Port 5173)     | --+                           | - Authentification JWT & RBAC     |
    +--------------------+   |                           | - Carte, Produits & TVA           |
                             |                           | - Plan 2D & Réservations (Retards)|
                             |                           +-----------------+-----------------+
                             |                                             |
                             |   HTTP / JWT (Bearer)                       | PostgreSQL (restaurant_db)
                             |                           +-----------------v-----------------+
                             +-------------------------> |           order-service           |
                                                         |             (Port 8082)           |
                                                         | - Prise de commande & Snapshots   |
                                                         | - Écran Cuisine (KDS)             |
                                                         | - Statistiques ventes & Export CSV|
                                                         +-----------------+-----------------+
                                                                           |
                                                                           | RestClient (HTTP)
                                                                           v
                                                         Synchronisation Produits & Tables
                                                         + PostgreSQL (order_db)

## Stack Technique

- **Back-End :** Java 21+, Spring Boot 4.1.2, Spring Data JPA, Spring Security (JWT HMAC-SHA256 stateless), Flyway Migrations (`V1` à `V5`).
- **Bases de données :** PostgreSQL 16 (2 instances logiques isolées : `restaurant_db` et `order_db`).
- **Front-End :** React 19, TypeScript, Vite, Tailwind CSS v4.
- **Qualité & DevOps :** JUnit 5, Mockito, GitHub Actions (CI), Conventional Commits, Release-Please.

## Sécurité & Contrôle d'Accès (RBAC)

L'authentification repose sur des jetons **JWT signés (HS256)** émis par `restaurant-service` (`/api/auth/login`) et validés de manière stateless par `order-service`.

| Rôle | Compte de démonstration | Mot de passe | Permissions clés |
| :--- | :--- | :--- | :--- |
| **ADMIN** (Gérant) | `admin@restomanager.be` | `password123` | Accès complet : gestion carte/prix, plan 2D, réservations, commandes, statistiques des ventes, rapports TVA et export CSV. |
| **WAITER** (Salle) | `serveur@restomanager.be` | `password123` | Plan de salle 2D, réservations (dont report d'arrivée), prise de commande, préparations rapides, service, encaissement et statistiques. |
| **KITCHEN** (Cuisine) | `cuisine@restomanager.be` | `password123` | Écran cuisine (KDS) plein écran, suivi des préparations en temps réel, rupture de stock sur les produits. |

## Fonctionnalités & Règles Métier Implémentées

1. **Intégrité comptable par Snapshots :** Lorsqu'une commande est validée dans `order-service`, le nom du produit, son prix HTVA et son taux de TVA belge (**12 %** nourriture sur place, **21 %** boissons) sont figés dans `order_items`.
2. **Plan Architectural 2D à 5 statuts & Anti-surbooking :**
   - Visualisation interactive des tables en temps réel selon **5 statuts dynamiques** : **Libre**, **Réservée**, **Retard résa**, **Occupée** et **À régler**.
   - Blocage de toute double réservation sur une même table dans une fenêtre glissante de **±2 heures** et contrôle de la capacité maximale de couverts.
   - Gestion des arrivées tardives avec possibilité de **repousser l'heure d'arrivée** (`POST /api/reservations/{id}/postpone`, suivi en base via la migration Flyway `V5__add_reservation_delayed_flag.sql`).
   - Regroupement des réservations **par catégorie** (*Actives*, *En retard*, *Historique*, *Toutes*) et **par journée** avec compteurs et total des couverts.
3. **Commandes, Écran Cuisine (KDS) & Suivi Journalier :**
   - Écran Cuisine (KDS) temps réel avec code couleur (`SENT_TO_KITCHEN` → `IN_PREPARATION` → `READY` → `SERVED` → `PAID`).
   - Regroupement chronologique des commandes **par journée** avec calcul automatique du **chiffre d'affaires TTC journalier**.
4. **Statistique des Ventes par Catégorie :**
   - Onglet dédié **« Statistique des ventes »** présentant le détail des produits commandés (hors commandes annulées) regroupés par catégorie, avec quantités, part en pourcentage (`%`), chiffre d'affaires TTC, sous-totaux par catégorie et filtre temporel (**Aujourd'hui** / **Toutes les journées**).
5. **Export Comptable CSV :** Ventilation automatique de la TVA collectée par taux et génération du journal de caisse (`GET /api/reports/export.csv`).

## Lancement en Local

1. **Démarrer l'infrastructure PostgreSQL (Docker) :**
   ```powershell
   docker compose up -d
   ```
2. **Démarrer les deux microservices Back-End (dans deux terminaux distincts) :**
   - Windows (PowerShell / Warp) :
     ```powershell
     cd restaurant-service; .\mvnw.cmd spring-boot:run
     cd order-service; .\mvnw.cmd spring-boot:run
     ```
   - Linux / macOS :
     ```bash
     cd restaurant-service && ./mvnw spring-boot:run
     cd order-service && ./mvnw spring-boot:run
     ```
3. **Démarrer l'interface Front-End React :**
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
   - Ouvrir `http://localhost:5173`