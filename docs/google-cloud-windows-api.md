# Google Cloud Windows FVS API Deployment

This is the recommended first hosted path for CARBINE outside testing.

## Target Shape

```text
GitHub Pages
  serves CARBINE browser app

Google Compute Engine Windows VM
  runs CARBINE FVS API
  runs official FVS variant executables
```

Testers use only the CARBINE web address. They do not install FVS, open a command prompt, or start a bridge.

## 1. Create the Windows VM

In Google Cloud Console:

1. Go to Compute Engine > VM instances.
2. Create a VM.
3. Use a Windows Server image.
4. Start small for beta testing. Increase CPU/RAM only if runs are slow.
5. Reserve a static external IP for the VM.
6. Allow inbound traffic to the API port only from the frontend/domain path you choose.

For a quick private beta, use port `8787` while testing. For a cleaner public beta, put HTTPS in front of the API with a Google Cloud Load Balancer or another TLS proxy.

## 2. Install Runtime Software on the VM

On the VM:

1. Install Git.
2. Install Node.js LTS.
3. Clone or copy the CARBINE repository.
4. Copy or build the official FVS executables into:

```text
fvs-src\ForestVegetationSimulator-main\bin
```

The folder should contain files like:

```text
fvsne.exe
fvsls.exe
fvswc.exe
```

From the CARBINE repo folder:

```bat
npm.cmd ci
```

## 3. Start the API Manually

From the CARBINE repo folder:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File deploy\google-cloud\windows\start-carbine-fvs-api.ps1
```

After the CARBINE web address is known, start it with the allowed browser origin:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File deploy\google-cloud\windows\start-carbine-fvs-api.ps1 -AllowedOrigins "https://your-carbine-web-address"
```

The API listens on:

```text
http://0.0.0.0:8787
```

Check from the VM:

```powershell
Invoke-RestMethod http://127.0.0.1:8787/health
```

## 4. Auto-Start the API

Open PowerShell as Administrator from the CARBINE repo folder:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File deploy\google-cloud\windows\install-carbine-fvs-api-task.ps1
```

After the CARBINE web address is known:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File deploy\google-cloud\windows\install-carbine-fvs-api-task.ps1 -AllowedOrigins "https://your-carbine-web-address"
```

Start the task immediately:

```powershell
Start-ScheduledTask -TaskName "CARBINE FVS API"
```

Logs are written under:

```text
logs\
```

## 5. Connect the Frontend

In the GitHub repository settings, create this repository variable:

```text
VITE_CARBINE_FVS_API_URL=https://your-carbine-api-address
```

Then run the GitHub Pages workflow.

The deployed CARBINE app should default to `Hosted FVS API`.

## 6. Health Check from Your Workstation

From your local CARBINE repo:

```bat
npm.cmd run hosted:health -- https://your-carbine-api-address
```

It should report:

```text
Reachable: yes
Ready: yes
Variants: FVS...
```

## Security Notes Before Wider Testing

- Put HTTPS in front of the API before sending it to outside testers.
- Set `AllowedOrigins` to the deployed CARBINE web address.
- Restrict API access at the firewall or load balancer if possible.
- Add request-size limits and basic abuse protection before public release.
- Keep raw FVS output available in diagnostics for model review.
- CARBINE is not an official USDA Forest Service product.
