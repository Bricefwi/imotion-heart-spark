# Déploiement Hostinger VPS — IMOTION / Clarivi BUILD

Ce guide décrit le déploiement autonome de l'app React/Vite sur un VPS
Hostinger (ou tout autre VPS Linux), sans casser la compatibilité Lovable.

> ℹ️ Le backend (base Postgres, auth, edge functions, storage) reste hébergé
> sur **Supabase / Lovable Cloud**. Seul le frontend statique est servi
> depuis le VPS.

---

## 1. Prérequis

- VPS Linux (Ubuntu 22.04+ recommandé), 1 vCPU / 1 Go RAM minimum.
- Accès SSH root ou sudo.
- Nom de domaine pointé sur l'IP du VPS (par défaut : `app.imotion-conseils.fr`).
- Sur le VPS :
  ```bash
  apt update && apt install -y docker.io docker-compose-v2 git
  systemctl enable --now docker
  ```
- Projet Supabase / Lovable Cloud existant avec :
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY` (clé `anon`, publique)
  - `VITE_SUPABASE_PROJECT_ID`

---

## 2. Configuration DNS

Sur votre registrar :

| Type | Nom                       | Valeur            | TTL  |
|------|---------------------------|-------------------|------|
| A    | `app.imotion-conseils.fr` | `<IP du VPS>`     | 300  |
| A    | `www.imotion-conseils.fr` | `<IP du VPS>`     | 300  |

Vérification :

```bash
dig +short app.imotion-conseils.fr
```

Caddy obtient automatiquement le certificat Let's Encrypt au premier démarrage
(ports 80 + 443 ouverts requis).

---

## 3. Build & déploiement

### 3.1 Cloner le projet sur le VPS

```bash
git clone <URL_DEPOT> /opt/imotion
cd /opt/imotion
```

### 3.2 Variables d'environnement

```bash
cp .env.example .env.production
nano .env.production    # remplir VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID
```

⚠️ Ne mettez **jamais** `SUPABASE_SERVICE_ROLE_KEY` ici. C'est un secret
backend qui doit vivre exclusivement côté Supabase Edge Functions.

### 3.3 Build + run

```bash
docker compose -f docker-compose.hostinger.yml --env-file .env.production \
  up -d --build
```

Vérifications :

```bash
docker compose -f docker-compose.hostinger.yml ps
curl -I https://app.imotion-conseils.fr
docker exec imotion-frontend wget -qO- http://127.0.0.1/healthz
```

### 3.4 Test local du build (avant push)

```bash
npm ci
npm run build
npm run preview    # http://localhost:4173
```

---

## 4. Mise à jour

```bash
cd /opt/imotion
git pull
docker compose -f docker-compose.hostinger.yml --env-file .env.production \
  up -d --build
docker image prune -f
```

L'image est reconstruite en local sur le VPS — pas besoin de registry.

---

## 5. Rollback

Trois options :

### Option A — Git (recommandé)

```bash
cd /opt/imotion
git log --oneline -n 10         # repérer le SHA stable
git checkout <SHA>
docker compose -f docker-compose.hostinger.yml --env-file .env.production \
  up -d --build
```

### Option B — Image Docker précédente

À chaque build, tagger l'image avant remplacement :

```bash
docker tag imotion-frontend:latest imotion-frontend:$(date +%Y%m%d-%H%M)
```

Puis pour revenir en arrière :

```bash
docker tag imotion-frontend:20260528-1200 imotion-frontend:latest
docker compose -f docker-compose.hostinger.yml up -d
```

### Option C — Snapshot Hostinger

Le panel Hostinger permet un snapshot complet du VPS avant mise à jour.
Restauration en 1 clic en cas d'incident.

---

## 6. Logs & monitoring

```bash
# Logs frontend (Nginx)
docker logs -f imotion-frontend

# Logs proxy (Caddy + TLS)
docker logs -f imotion-proxy

# Tail combiné
docker compose -f docker-compose.hostinger.yml logs -f --tail=200
```

Logs rotés automatiquement (10 Mo × 5 fichiers, cf. `docker-compose.hostinger.yml`).

Healthcheck : `https://app.imotion-conseils.fr/healthz` → `ok`.

---

## 7. Sauvegarde

Le frontend est **stateless** (juste des fichiers statiques) : il suffit de
sauvegarder le dépôt Git + le `.env.production`.

```bash
# Backup .env (à stocker chiffré hors VPS)
scp root@VPS:/opt/imotion/.env.production ./backups/.env.production.$(date +%F)
```

La donnée critique (base, fichiers, auth) vit dans **Supabase / Lovable Cloud**
et bénéficie des sauvegardes automatiques du provider.

Pour exporter manuellement la base :

```bash
# Depuis n'importe quelle machine ayant l'URL psql Supabase
pg_dump "$SUPABASE_DB_URL" -F c -f backup_$(date +%F).dump
```

---

## 8. Compatibilité Lovable

Ce setup **n'altère pas** le mode Lovable :

- `npm run dev` / `npm run build` / `npm run preview` fonctionnent à
  l'identique.
- Le preview Lovable continue de builder sur leur infra.
- Aucun secret n'est codé en dur dans le bundle : en production, l'absence
  des variables Vite fait échouer le build (comportement attendu).

Pour repasser temporairement à Lovable seul, il suffit de stopper le stack
Docker côté VPS :

```bash
docker compose -f docker-compose.hostinger.yml down
```

---

## 9. Troubleshooting

| Symptôme                                          | Cause probable                                    | Fix |
|---------------------------------------------------|---------------------------------------------------|-----|
| 502 Bad Gateway via Caddy                         | Container `frontend` down                         | `docker logs imotion-frontend` |
| Page blanche, console : "Missing Supabase URL"    | Variables `VITE_*` non passées au build           | Re-build avec `--env-file .env.production` |
| Routes profondes en 404                           | Fallback SPA non actif                            | Vérifier `nginx.conf` (`try_files ... /index.html`) |
| Pas de HTTPS                                      | Ports 80/443 fermés au firewall                   | `ufw allow 80,443/tcp` |
| Cert Let's Encrypt en échec                       | DNS non propagé                                   | Attendre 5–15 min puis `docker restart imotion-proxy` |
