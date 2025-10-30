# Guide de Déploiement Coolify sur Hostinger KVM

Ce guide explique comment déployer **Wanwa** sur un serveur Hostinger VPS/KVM en utilisant **Coolify**.

---

## 🎯 Vue d'ensemble

**Coolify** est une plateforme self-hosted alternative à Heroku/Vercel qui simplifie le déploiement d'applications.

**Stack de déploiement :**
- **Serveur** : Hostinger KVM VPS
- **Orchestration** : Coolify
- **Frontend** : React + Vite (conteneur Docker)
- **Backend** : Supabase Edge Functions (déployées séparément)
- **Base de données** : Supabase Cloud

---

## 📋 Prérequis

### 1. Serveur Hostinger KVM

**Configuration minimale recommandée :**
- RAM : 4 GB minimum (8 GB recommandé)
- CPU : 2 vCPU minimum
- Disque : 50 GB SSD
- OS : Ubuntu 22.04 LTS

### 2. Nom de Domaine

- Domaine configuré chez Hostinger ou registrar externe
- DNS A record pointant vers IP du serveur

### 3. Comptes Externes

- Compte Supabase avec projet créé
- Repository GitHub (public ou privé)

---

## 🚀 Installation Coolify

### Étape 1 : Connexion SSH au Serveur

```bash
# Connexion au serveur Hostinger
ssh root@your-vps-ip

# Mettre à jour le système
apt update && apt upgrade -y
```

### Étape 2 : Installer Docker

```bash
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Vérifier l'installation
docker --version
docker compose version
```

### Étape 3 : Installer Coolify

```bash
# Installation automatique de Coolify
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# L'installation prend environ 5-10 minutes
# Coolify sera accessible sur http://your-vps-ip:8000
```

### Étape 4 : Configuration Initiale Coolify

1. Ouvrir navigateur : `http://your-vps-ip:8000`
2. Créer compte administrateur
3. Configurer email (optionnel)
4. Suivre le wizard de configuration

---

## 🔧 Configuration du Projet dans Coolify

### Étape 1 : Créer un Nouveau Projet

1. Dashboard Coolify → **New Project**
2. Nom : `wanwa-production`
3. Description : `Système de Gestion Catalogue Produits`

### Étape 2 : Ajouter une Ressource

#### Option A : Déploiement depuis GitHub

```yaml
# Dans Coolify:
1. Cliquer "New Resource" → "Public Repository"
2. Repository URL: https://github.com/cirquephotovideo/wanwa
3. Branch: claude/product-catalog-architecture-011CUdqCmzfjsH1NJ4RztEcC
4. Build Pack: Nixpacks (auto-détecté)
```

#### Option B : Dockerfile Personnalisé

Créer `Dockerfile` à la racine :

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Créer `nginx.conf` :

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Étape 3 : Configuration des Variables d'Environnement

Dans Coolify → Resource → **Environment Variables** :

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=your-project-id

# Application
VITE_APP_NAME=Wanwa
VITE_APP_URL=https://your-domain.com
NODE_ENV=production

# Frontend URL (for Edge Functions callbacks)
FRONTEND_URL=https://your-domain.com
```

### Étape 4 : Configurer le Domaine

1. Coolify → Resource → **Domains**
2. Ajouter domaine : `wanwa.your-domain.com`
3. Activer **SSL/TLS** (Let's Encrypt automatique)
4. Activer **Force HTTPS**

---

## 🗄️ Configuration Supabase

### Étape 1 : Déployer les Edge Functions

```bash
# Sur votre machine locale
cd wanwa

# Login Supabase
supabase login

# Lier le projet
supabase link --project-ref your-project-id

# Déployer les migrations
supabase db push

# Déployer toutes les Edge Functions
supabase functions deploy

# Vérifier le déploiement
supabase functions list
```

### Étape 2 : Configurer les Secrets Supabase

```bash
# Configurer les secrets pour Edge Functions
supabase secrets set AMAZON_CLIENT_ID="amzn1.application-oa2-client.xxx"
supabase secrets set AMAZON_CLIENT_SECRET="amzn1.oa2-cs.v1.xxx"
supabase secrets set OPENAI_API_KEY="sk-xxx"
supabase secrets set ANTHROPIC_API_KEY="sk-ant-xxx"
supabase secrets set OLLAMA_BASE_URL="http://localhost:11434"
supabase secrets set FRONTEND_URL="https://wanwa.your-domain.com"

# Vérifier
supabase secrets list
```

### Étape 3 : Configurer CORS dans Supabase

Dans Supabase Dashboard → **API Settings** → **CORS Origins** :

```
https://wanwa.your-domain.com
```

---

## 🔄 Déploiement Continu (CI/CD)

### Option 1 : Webhook GitHub (Recommandé)

1. Coolify → Resource → **Webhooks**
2. Copier l'URL du webhook
3. GitHub → Repository → Settings → Webhooks
4. Ajouter webhook :
   - Payload URL : URL copiée
   - Content type : `application/json`
   - Events : `push` sur branch `main`

**Résultat** : Chaque push sur `main` déclenche auto-redéploiement

### Option 2 : GitHub Actions

Créer `.github/workflows/deploy-coolify.yml` :

```yaml
name: Deploy to Coolify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Coolify Deployment
        run: |
          curl -X POST ${{ secrets.COOLIFY_WEBHOOK_URL }}
```

---

## 📊 Monitoring & Maintenance

### Logs dans Coolify

```bash
# Accéder aux logs en temps réel
Coolify → Resource → Logs → Live Logs

# Télécharger logs
Coolify → Resource → Logs → Download
```

### Métriques Serveur

```bash
# SSH dans le serveur
ssh root@your-vps-ip

# Voir utilisation ressources
docker stats

# Voir conteneurs actifs
docker ps

# Logs application
docker logs <container-id> --tail 100 -f
```

### Backup Base de Données

```bash
# Backup automatique Supabase (configuré dans dashboard)
# Ou backup manuel :
supabase db dump -f backup.sql

# Restore
supabase db reset --db-url "postgresql://..."
```

---

## 🔐 Sécurité

### 1. Firewall (UFW)

```bash
# Installer UFW si pas déjà fait
apt install ufw

# Configuration de base
ufw default deny incoming
ufw default allow outgoing

# Autoriser SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8000/tcp  # Coolify dashboard

# Activer firewall
ufw enable

# Vérifier status
ufw status
```

### 2. Fail2Ban (Protection Brute Force)

```bash
# Installer Fail2Ban
apt install fail2ban

# Configurer
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Éditer jail.local
nano /etc/fail2ban/jail.local

# Activer et démarrer
systemctl enable fail2ban
systemctl start fail2ban
```

### 3. SSL/TLS

Coolify gère automatiquement Let's Encrypt.

Pour renouveler manuellement :
```bash
# Dans Coolify dashboard
Resource → SSL/TLS → Renew Certificate
```

---

## 🚨 Troubleshooting

### Problème : Build échoue

```bash
# Vérifier logs build
Coolify → Resource → Build Logs

# Solutions courantes:
1. Vérifier Node version (doit être 18+)
2. Vérifier variables d'environnement
3. Vider cache build: Coolify → Resource → Clear Build Cache
```

### Problème : Application ne démarre pas

```bash
# Vérifier port exposé
# Dans Dockerfile, s'assurer que EXPOSE correspond au port configuré

# Vérifier health check
Coolify → Resource → Health Check → Test
```

### Problème : Erreurs Supabase

```bash
# Vérifier CORS
Supabase Dashboard → API Settings → CORS Origins

# Vérifier RLS policies
Supabase Dashboard → SQL Editor → Exécuter:
SELECT * FROM pg_policies;

# Tester Edge Functions
curl -X POST https://your-project.supabase.co/functions/v1/ai-chat \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{"message": "test"}'
```

---

## 📝 Checklist Post-Déploiement

- [ ] Application accessible sur domaine
- [ ] SSL/TLS activé et fonctionnel
- [ ] Variables d'environnement configurées
- [ ] Edge Functions déployées
- [ ] Migrations DB appliquées
- [ ] CORS configuré
- [ ] Webhook GitHub configuré
- [ ] Monitoring activé
- [ ] Backup configuré
- [ ] Firewall configuré
- [ ] Fail2Ban activé

---

## 🔗 Ressources

- [Documentation Coolify](https://coolify.io/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Hostinger VPS Guide](https://www.hostinger.com/tutorials/vps)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## 💡 Optimisations Avancées

### 1. Redis pour Cache (Optionnel)

```bash
# Ajouter Redis dans Coolify
New Resource → Database → Redis

# Utiliser dans application
REDIS_URL=redis://redis:6379
```

### 2. CDN pour Assets Statiques

Utiliser Cloudflare devant Coolify :
1. Ajouter site à Cloudflare
2. Configurer DNS Proxy
3. Activer cache pour assets

### 3. Horizontal Scaling

```bash
# Dans Coolify
Resource → Scale → Increase Instances: 2-3

# Coolify gère automatiquement le load balancing
```

---

**Déploiement estimé : 30-45 minutes pour setup complet** ⏱️

Pour assistance : support@wanwa.app
