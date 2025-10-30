# Wanwa - Coolify Quick Start Guide

Ce guide vous permet de déployer Wanwa sur Coolify (Hostinger KVM) en quelques minutes.

## 🚀 Installation Rapide

### Méthode 1: Installation Automatique (Recommandée)

```bash
# 1. Cloner le repository
git clone https://github.com/cirquephotovideo/wanwa.git
cd wanwa

# 2. Lancer le script d'installation
sudo ./scripts/coolify-setup.sh
```

Le script vous guidera à travers :
- ✅ Installation de Coolify (si nécessaire)
- ✅ Configuration des variables d'environnement
- ✅ Configuration du firewall
- ✅ Setup SSL/TLS
- ✅ Génération des fichiers de configuration

### Méthode 2: Installation Manuelle

#### Étape 1: Installer Coolify

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Accédez à Coolify : `http://VOTRE_IP:8000`

#### Étape 2: Créer une Application dans Coolify

1. Connectez-vous à Coolify
2. Créez un nouveau projet
3. Ajoutez une nouvelle application
4. Sélectionnez "Git Repository"
5. Entrez l'URL : `https://github.com/cirquephotovideo/wanwa`
6. Branch: `main` (ou votre branche de déploiement)

#### Étape 3: Configurer les Variables d'Environnement

Dans Coolify, ajoutez ces variables d'environnement :

```env
# Application
NODE_ENV=production
FRONTEND_URL=https://votre-domaine.com

# Supabase (REQUIS)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_PROJECT_ID=xxxxx

# Amazon SP-API (Optionnel)
AMAZON_CLIENT_ID=amzn1.application-oa2-client...
AMAZON_CLIENT_SECRET=xxxxx

# AI Providers (Optionnel)
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Redis (Optionnel mais recommandé)
REDIS_PASSWORD=un_mot_de_passe_securise
```

#### Étape 4: Configuration du Domaine

1. Dans Coolify, allez dans **Domains**
2. Ajoutez votre domaine : `wanwa.example.com`
3. Activez **HTTPS** (Let's Encrypt automatique)
4. Activez **Redirect WWW** si souhaité

#### Étape 5: Configurer le Build

Dans Coolify → Build Settings :

- **Dockerfile** : `Dockerfile`
- **Docker Compose** : `docker-compose.coolify.yml` (optionnel)
- **Port** : `80`
- **Health Check Path** : `/health`

#### Étape 6: Déployer

Cliquez sur **Deploy** dans Coolify.

Le déploiement prendra 3-5 minutes.

## ⚙️ Configuration Post-Déploiement

### 1. Déployer les Edge Functions Supabase

```bash
# Sur votre machine locale
supabase login
supabase link --project-ref VOTRE_PROJECT_ID
supabase functions deploy
```

### 2. Exécuter les Migrations

```bash
supabase db push
```

### 3. Ajouter des Données de Démo (Optionnel)

```bash
./scripts/seed-data.sh
```

### 4. Vérifier le Déploiement

- ✅ Application : `https://votre-domaine.com`
- ✅ Health Check : `https://votre-domaine.com/health`
- ✅ Admin Panel : `https://votre-domaine.com/admin`

## 📊 Fichiers de Configuration Coolify

### coolify.yaml

Configuration complète de l'application pour Coolify :
- Métadonnées de l'app
- Configuration du build
- Stratégie de déploiement
- Health checks
- Ressources (CPU/RAM)
- Domaines et SSL
- Sauvegardes
- Monitoring

### docker-compose.coolify.yml

Configuration Docker Compose optimisée :
- Service app (Nginx + React)
- Service Redis (cache optionnel)
- Volumes persistants
- Health checks
- Limites de ressources
- Logging

### scripts/coolify-setup.sh

Script d'installation automatique :
- ✅ Vérification des prérequis système
- ✅ Installation de Coolify
- ✅ Configuration interactive
- ✅ Génération des variables d'environnement
- ✅ Setup du firewall (UFW)
- ✅ Configuration SSL

### scripts/post-deploy.sh

Script post-déploiement automatique :
- ✅ Health check de l'application
- ✅ Vérification Supabase
- ✅ Nettoyage du cache
- ✅ Rotation des logs
- ✅ Notifications Slack/Email

### public/health.html

Page de health check interactive :
- ✅ Status de l'application
- ✅ Temps de réponse
- ✅ Uptime
- ✅ Informations système
- ✅ Rafraîchissement automatique

## 🔧 Configuration Avancée

### Activer Redis (Cache)

Redis améliore les performances en cachant les données fréquemment utilisées.

**Dans Coolify** :
1. Utilisez `docker-compose.coolify.yml`
2. Ajoutez la variable : `REDIS_PASSWORD=votre_mot_de_passe`

### Configurer les Notifications

#### Slack

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

#### Email (via SendGrid)

```env
NOTIFICATION_EMAIL=admin@example.com
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxx
```

### Activer le Monitoring

Coolify inclut un monitoring intégré :
- CPU usage
- Memory usage
- Network I/O
- Disk usage
- Application logs

Accédez au monitoring : **Application → Metrics**

### Configurer les Sauvegardes

Dans `coolify.yaml`, les sauvegardes sont configurées :

```yaml
backup:
  enabled: true
  schedule: "0 2 * * *"  # Daily at 2 AM
  retention: 7  # Keep 7 days
```

## 🐛 Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs
docker logs wanwa-app

# Vérifier les variables d'environnement
docker exec wanwa-app env | grep SUPABASE
```

### Erreur de connexion Supabase

```bash
# Tester la connexion Supabase
curl -H "apikey: VOTRE_ANON_KEY" \
  https://xxxxx.supabase.co/rest/v1/
```

### SSL/TLS ne fonctionne pas

1. Vérifiez que le domaine pointe vers votre serveur
2. Vérifiez les ports 80 et 443 : `sudo ufw status`
3. Régénérez le certificat dans Coolify

### Build échoue

Vérifiez les logs de build dans Coolify :
- Variables d'environnement manquantes ?
- Erreurs de dépendances npm ?
- Problème de mémoire ? (augmenter les limites)

### Health check échoue

```bash
# Vérifier manuellement
curl http://localhost/health

# Vérifier le conteneur
docker exec wanwa-app wget -O- http://localhost/health
```

## 📈 Optimisations de Performance

### 1. Activer le Cache Redis

Redis réduit la charge sur Supabase et améliore les temps de réponse.

### 2. Augmenter les Ressources

Dans `docker-compose.coolify.yml` :

```yaml
resources:
  limits:
    cpus: '4'      # Augmenter si nécessaire
    memory: 4G     # Augmenter pour gros catalogues
```

### 3. Configurer le Cache Nginx

Le Dockerfile inclut déjà la configuration optimale du cache Nginx.

### 4. Activer la Compression

Nginx est configuré avec gzip pour compresser les assets.

### 5. CDN (Optionnel)

Pour de meilleures performances globales, configurez un CDN :
- Cloudflare (gratuit)
- BunnyCDN
- AWS CloudFront

## 🔒 Sécurité

### Checklist de Sécurité

- [ ] HTTPS activé (Let's Encrypt)
- [ ] Firewall configuré (ports 80, 443 uniquement)
- [ ] Variables d'environnement sécurisées
- [ ] Mots de passe Redis forts
- [ ] Clés API en variables d'environnement (jamais en code)
- [ ] Rate limiting activé
- [ ] Logs de sécurité activés
- [ ] Sauvegardes automatiques configurées

### Mettre à Jour l'Application

```bash
# Dans Coolify, cliquez simplement sur "Redeploy"
# Ou via webhook Git (push sur main)
```

### Rollback en Cas de Problème

Coolify garde les 5 derniers déploiements :
1. Allez dans **Deployments**
2. Sélectionnez une version précédente
3. Cliquez sur **Rollback**

## 📚 Ressources

- [Documentation Coolify](https://coolify.io/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Guide de Déploiement Complet](./docs/DEPLOYMENT.md)
- [Guide de Configuration](./docs/CONFIGURATION.md)
- [Guide de Migration](./docs/MIGRATION.md)

## 💬 Support

- **GitHub Issues** : https://github.com/cirquephotovideo/wanwa/issues
- **Documentation** : https://github.com/cirquephotovideo/wanwa
- **Email** : support@wanwa.com

---

## 🎉 Félicitations !

Votre application Wanwa est maintenant déployée sur Coolify !

**Prochaines étapes** :
1. ✅ Configurez vos intégrations (Amazon, plateformes e-commerce)
2. ✅ Importez vos premiers produits
3. ✅ Testez l'enrichissement IA
4. ✅ Configurez vos exports
5. ✅ Invitez votre équipe

**Besoin d'aide ?** Consultez notre [documentation complète](./docs/) ou ouvrez une issue sur GitHub.
