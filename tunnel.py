import subprocess
import time

# Start HTTP server quietly in the background
print("Starting local HTTP server on port 3000...")
http_process = subprocess.Popen(["python", "-m", "http.server", "3000"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(2)

# Start pinggy tunnel
print("Starting Pinggy SSH tunnel...")
try:
    ssh_process = subprocess.Popen(
        ["ssh", "-p", "443", "-o", "StrictHostKeyChecking=no", "-R0:localhost:3000", "a.pinggy.io"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )

    # Read output to find URL
    url = None
    print("Waiting for URL...")
    for i in range(50):
        line = ssh_process.stdout.readline()
        if not line:
            continue
        print("SSH Output:", line.strip())
        if "http://" in line or "https://" in line:
            parts = line.split()
            for p in parts:
                if p.startswith("http"):
                    url = p
                    break
        if url and "rn" not in url: # Exclude random warning URLs
            break

    if url:
        print("\n\n=== SUCCESS ===")
        print("PUBLIC URL:", url)
        print("===============\n")
        with open("public_url.txt", "w") as f:
            f.write(url)
    else:
        print("Failed to establish Pinggy tunnel. The output might have been blocked.")
except Exception as e:
    print("Error:", e)
