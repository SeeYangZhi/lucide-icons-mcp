// For more information, see https://crawlee.dev/
import { launchOptions } from "camoufox-js";
import { PlaywrightCrawler } from "crawlee";
import { firefox } from "playwright";

import { router } from "./routes.js";

const startUrls = ["https://lucide.dev/icons/categories"];

const crawler = new PlaywrightCrawler({
  // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
  requestHandler: router,
  requestHandlerTimeoutSecs: 180, // Increased timeout to 3 minutes
  // Comment this option to scrape the full website.
  browserPoolOptions: {
    // Disable the default fingerprint spoofing to avoid conflicts with Camoufox.
    useFingerprints: false
  },
  launchContext: {
    launcher: firefox,
    launchOptions: await launchOptions({
      headless: true,
      timeout: 90000
      // Pass your own Camoufox parameters here...
      // block_images: true,
      // fonts: ['Times New Roman'],
      // ...
    })
  }
});

await crawler.run(startUrls);
