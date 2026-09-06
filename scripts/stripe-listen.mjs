import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const findStripeExecutable = () => {
  // 1. Check WinGet Packages on Windows
  const localAppData = process.env.LOCALAPPDATA || "";
  if (localAppData) {
    const wingetDir = path.join(localAppData, "Microsoft", "WinGet", "Packages");
    if (fs.existsSync(wingetDir)) {
      try {
        const folders = fs.readdirSync(wingetDir);
        const stripeFolder = folders.find((name) => name.toLowerCase().includes("stripe"));
        if (stripeFolder) {
          const candidate = path.join(wingetDir, stripeFolder, "stripe.exe");
          if (fs.existsSync(candidate)) {
            return candidate;
          }
        }
      } catch {
        // Ignore directory read errors
      }
    }
  }

  // 2. Default to global 'stripe' from PATH
  return "stripe";
};

const stripeBin = findStripeExecutable();

const args = ["listen", "--forward-to", "localhost:5000/api/v1/payouts/stripe/webhook"];

const child = spawn(stripeBin, args, {
  stdio: "inherit",
});

child.on("error", (err) => {
  console.error("❌ Failed to launch Stripe CLI:", err.message);
  process.exit(1);
});

child.on("close", (code) => {
  process.exit(code ?? 0);
});
