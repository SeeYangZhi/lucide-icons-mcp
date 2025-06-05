import { writeFile } from "fs/promises";

// Fetch latest release tag from GitHub API
let latestRelease = "";
try {
  const res = await fetch(
    "https://api.github.com/repos/lucide-icons/lucide/releases/latest"
  );
  if (res.ok) {
    const data = await res.json();
    latestRelease = data.tag_name || "";
  }
} catch (err) {
  console.warn("Failed to fetch latest release:", err);
}

// Write latest release to version.txt
await writeFile("data/version.txt", latestRelease);
