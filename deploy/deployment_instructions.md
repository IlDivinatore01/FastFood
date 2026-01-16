# Deployment Instructions for FastFood

These instructions are tailored for your specific setup at `osvaldo@ubuntu-server`.

## 1. Transfer Code to VPS
You need to move the project files to your VPS `site_sources` directory.

**From your local machine:**
```bash
# Assuming you have ssh access configured
rsync -avz --exclude 'node_modules' --exclude '.git' ./ osvaldo@ubuntu-server:~/podman/site_sources/fastfood/
```

## 2. Build the Image (On VPS)
SSH into your server and build the container image.

```bash
ssh osvaldo@ubuntu-server
cd ~/podman/site_sources/fastfood

# Build the image accessible to Podman
podman build -t localhost/fastfood:latest .
```

## 3. Deploy the Pod
We will use the generated Kubernetes YAML file.

```bash
# 1. Create the data directory for valid hostPath
mkdir -p ~/podman/data/fastfood/mongo

# 2. Copy the YAML to your kube_yaml folder
cp deploy/fastfood.yaml ~/podman/kube_yaml/fastfood.pod.yaml

# 3. IMPORTANT: Edit the file to set a secure JWT_SECRET
nano ~/podman/kube_yaml/fastfood.pod.yaml
# Find JWT_SECRET and change "CHANGE_ME_..." to your secret key

# 4. Start the Pod
podman play kube ~/podman/kube_yaml/fastfood.pod.yaml
```

## 4. Update Caddy
Add the configuration for the new domain.

```bash
# 1. Open your Caddyfile
nano ~/podman/data/caddy/Caddyfile

# 2. Append the contents of deploy/Caddyfile_snippet
# (You can catch it from the source folder)
cat ~/podman/site_sources/fastfood/deploy/Caddyfile_snippet >> ~/podman/data/caddy/Caddyfile

# 3. Reload Caddy (assuming 'main-caddy' or similar is your global proxy)
# Check how you reload caddy normally. If it's a container:
podman exec -w /etc/caddy caddy caddy reload
# OR if it's the pod one:
podman exec -it main-pod-main-caddy caddy reload
```

## 5. Verify
Visit `https://fastfood.simonemiglio.eu`.
