# FastFood VPS Deployment Guide (Podman)

## 1. Prepare the Environment
Ensure you are in the project folder on your VPS.

## 2. Build the Image
Build the image locally so Podman can use it.
```bash
podman build -t fastfood .
```

## 3. Deploy with Play Kube
Use the generated YAML to start both the App and MongoDB in a single Pod. They will share the network, so the app connects to Mongo via `localhost:27017`.

```bash
# Start the pod (and create the volume automatically)
podman play kube deploy/fastfood.yaml
```

## 4. Verify
Check that the pod is running:
```bash
podman pod ps
podman ps
```

You should see `fastfood-pod` in the list.

## 5. Configure DNS & Caddy
1.  Point `fastfood.simonemiglio.eu` to your VPS IP address.
2.  Add the contents of `deploy/Caddyfile_snippet` to your `/etc/caddy/Caddyfile` (or wherever your `docker-compose` mounts it).
3.  Reload Caddy:
    ```bash
    # If run via docker-compose
    docker compose restart caddy
    # OR reload command
    docker compose exec caddy caddy reload
    ```

## 6. Maintenance
To stop and remove the deployment:
```bash
podman play kube deploy/fastfood.yaml --down
```
