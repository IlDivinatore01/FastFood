# FastFood VPS Deployment Guide

Your FastFood project is now ready for your "Self-Healing" Podman architecture.

## 1. Prepare VPS Directories
On your VPS (`osvaldo@ubuntu-server`), create the data directories:

```bash
mkdir -p ~/podman/data/fastfood/mongo_data
mkdir -p ~/podman/data/fastfood/frontend_dist
mkdir -p ~/podman/data/fastfood/caddy_config
```

## 2. Upload Configuration
Copy the generated files to their respective locations on your VPS:

| Local File | VPS Location |
| :--- | :--- |
| `deploy/fastfood.pod.yaml` | `~/podman/kube_yaml/fastfood.pod.yaml` |
| `deploy/fastfood.kube` | `~/.config/containers/systemd/fastfood.kube` |
| `deploy/Caddyfile_internal` | `~/podman/data/fastfood/caddy_config/Caddyfile` |

## 3. Upload Source Code
Upload your project source code to `~/podman/site_sources/fastfood` (create the folder first).
Ensure you upload: `backend/`, `frontend/`, `package.json`, `package-lock.json`.

## 4. Build Images
Run these commands on your VPS to build the specialized images:

```bash
cd ~/podman/site_sources/fastfood

# Build Backend
podman build -t localhost/fastfood-backend:1.0.0 -f backend/Containerfile .

# Build Frontend Assets & Extract
podman build -t localhost/fastfood-frontend:1.0.0 -f frontend/Containerfile .
podman run --rm -v ~/podman/data/fastfood/frontend_dist:/output:Z localhost/fastfood-frontend:1.0.0 sh -c "cp -a /app/dist/. /output/"
```

## 5. Activate Service
Reload Systemd to pick up the new Quadlet and start the pod:

```bash
systemctl --user daemon-reload
systemctl --user start fastfood.service
systemctl --user status fastfood.service
```

## 6. Verify
Check if the pod is running and all 3 containers (backend, mongo, caddy) are healthy:
```bash
podman pod ps
podman logs fastfood-pod-caddy
```

Your `global-caddy` (already configured as `reverse_proxy fastfood-pod:5000`) should now successfully route traffic to your new app!
