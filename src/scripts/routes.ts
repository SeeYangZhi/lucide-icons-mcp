import { createPlaywrightRouter } from "crawlee";
import * as fs from "fs";
import * as path from "path";

export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ log, pushData, request, page }) => {
  const title = await page.title();
  log.info(`${title}`, { url: request.loadedUrl });

  // Extract categories from sidebar navigation
  const categories: { categoryName: string; categoryCount: string }[] = [];

  await page.waitForSelector(
    "#VPSidebarNav > div:nth-child(3) > div.category-list > div > nav > ul > li"
  );

  const categoryElements = await page.$$(
    "#VPSidebarNav > div:nth-child(3) > div.category-list > div > nav > ul > li"
  );

  for (const categoryEl of categoryElements) {
    const spans = await categoryEl.$$("a > span");
    if (spans.length >= 2) {
      const categoryName = spans[0] ? await spans[0].textContent() : null;
      const categoryCount = spans[1] ? await spans[1].textContent() : null;

      if (categoryName && categoryCount) {
        categories.push({
          categoryName: categoryName.trim(),
          categoryCount: categoryCount.trim()
        });
      }
    }
  }

  if (categories.length > 0) {
    const outputDir = path.resolve("storage", "datasets", "default");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const categoriesPath = path.join(outputDir, "categories.json");
    fs.writeFileSync(
      categoriesPath,
      JSON.stringify(categories, null, 2),
      "utf-8"
    );
    log.info(`Categories written to ${categoriesPath}`);

    // --- ICON EXTRACTION LOGIC WITH SCROLL-AND-CAPTURE ---
    type CategoryWithIcons = {
      categoryName: string;
      categoryCount: string;
      icons: Set<string>;
    };
    const categoryMap = new Map<string, CategoryWithIcons>(
      categories.map((c) => [
        c.categoryName,
        { ...c, icons: new Set<string>() }
      ])
    );

    const overviewSelector =
      "#VPContent > div > div > div > div > div > div.overview-container > div:nth-child(2)";
    await page.waitForSelector(overviewSelector);

    // Function to extract currently visible icons in the container
    const captureCurrentIcons = async () => {
      const currentIcons = await page.evaluate((selector: string) => {
        const container = document.querySelector(selector);
        if (!container) return [];

        const result: Array<{ category: string; icon: string }> = [];
        let currentCategory: string | null = null;

        // Process all current children in the container
        for (const child of Array.from(container.children)) {
          if (child.tagName.toLowerCase() === "h2") {
            const className = child.getAttribute("class");
            if (className && className.includes("title")) {
              const catName = child.textContent;
              if (catName) {
                currentCategory = catName.replace(
                  /^[\s\u200B-\u200D\uFEFF]+|[\s\u200B-\u200D\uFEFF]+$/g,
                  ""
                );
              }
            }
          } else if (child.tagName.toLowerCase() === "div" && currentCategory) {
            const className = child.getAttribute("class");
            if (className && className.includes("icons")) {
              const iconElements = child.querySelectorAll("div.icon");
              for (const iconEl of Array.from(iconElements)) {
                const tooltipDiv = iconEl.querySelector("div.tooltip");
                if (tooltipDiv && tooltipDiv.textContent) {
                  const iconName = tooltipDiv.textContent.trim();
                  if (iconName) {
                    result.push({
                      category: currentCategory,
                      icon: iconName
                    });
                  }
                }
              }
            }
          }
        }
        return result;
      }, overviewSelector);

      // Add captured icons to our sets (automatically deduplicates)
      let newIconsCount = 0;
      for (const { category, icon } of currentIcons) {
        const categoryData = categoryMap.get(category);
        if (categoryData) {
          const sizeBefore = categoryData.icons.size;
          categoryData.icons.add(icon);
          if (categoryData.icons.size > sizeBefore) {
            newIconsCount++;
          }
        }
      }

      return { totalVisible: currentIcons.length, newIcons: newIconsCount };
    };

    log.info("Starting scroll-and-capture icon extraction...");

    // Get the scrollable container element handle
    const containerElement = await page.$(overviewSelector);
    if (!containerElement) {
      log.error("Could not find scrollable container element");
      return;
    }

    // Ensure we start from the top of the container
    log.info("Scrolling to top of container...");
    await containerElement.hover();

    // Scroll to the very top first
    await page.evaluate((selector: string) => {
      const container = document.querySelector(selector);
      if (container) {
        container.scrollTop = 0;
      }
    }, overviewSelector);

    // Wait for virtual scroll to settle after jumping to top
    await page.waitForTimeout(1000);

    // Verify we're at the top
    const initialPosition = await page.evaluate((selector: string) => {
      const container = document.querySelector(selector);
      return container ? container.scrollTop : -1;
    }, overviewSelector);

    log.info(`Container scrollTop after reset: ${initialPosition}px`);

    // Small initial scroll to activate virtual scrolling system
    await page.mouse.wheel(0, 50);
    await page.waitForTimeout(300);
    await page.mouse.wheel(0, -50); // Scroll back up
    await page.waitForTimeout(300);

    // Ensure we can see the first category by scrolling up until we find it
    const firstCategoryName = categories[0]?.categoryName || "Accessibility";
    log.info(`Looking for first category: "${firstCategoryName}"`);

    let foundFirstCategory = false;
    let scrollUpAttempts = 0;
    const maxScrollUpAttempts = 100;

    while (!foundFirstCategory && scrollUpAttempts < maxScrollUpAttempts) {
      // Check what categories are currently visible
      const currentVisibleCategories = await page.evaluate(
        (selector: string) => {
          const container = document.querySelector(selector);
          if (!container) return [];

          const visibleCategories: string[] = [];
          for (const child of Array.from(container.children)) {
            if (child.tagName.toLowerCase() === "h2") {
              const className = child.getAttribute("class");
              if (className && className.includes("title")) {
                const catName = child.textContent;
                if (catName) {
                  // Clean up invisible Unicode characters and whitespace
                  const cleanName = catName
                    .replace(
                      /^[\s\u200B-\u200D\uFEFF]+|[\s\u200B-\u200D\uFEFF]+$/g,
                      ""
                    )
                    .trim();
                  visibleCategories.push(cleanName);
                }
              }
            }
          }
          return visibleCategories;
        },
        overviewSelector
      );

      // Check if first category is visible (case-insensitive comparison)
      foundFirstCategory = currentVisibleCategories.some(
        (cat) => cat.toLowerCase() === firstCategoryName.toLowerCase()
      );

      // Capture icons that are currently visible (even during scroll-up)
      await captureCurrentIcons();

      if (!foundFirstCategory) {
        // Scroll up more to find the first category
        await page.mouse.wheel(0, -100);
        await page.waitForTimeout(200);
        scrollUpAttempts++;

        if (scrollUpAttempts % 10 === 0) {
          log.info(
            `Scroll up attempt ${scrollUpAttempts}: Currently visible categories: ${currentVisibleCategories.join(", ")}`
          );
        }
      } else {
        log.info(
          `✅ Found first category "${firstCategoryName}" after ${scrollUpAttempts} scroll up attempts`
        );
        log.info(
          `Currently visible categories: ${currentVisibleCategories.join(", ")}`
        );
      }
    }

    if (!foundFirstCategory) {
      log.info(
        `⚠️  Could not find first category "${firstCategoryName}" after ${maxScrollUpAttempts} attempts. Proceeding anyway...`
      );
    }

    // Wait for virtual scroll to settle
    await page.waitForTimeout(500);

    // Initial capture from the properly positioned top
    const initialCapture = await captureCurrentIcons();
    log.info(
      `Initial capture: ${initialCapture.totalVisible} icons visible, ${initialCapture.newIcons} unique icons captured`
    );

    // Log which categories are initially visible after positioning
    const initialCategories = await page.evaluate((selector: string) => {
      const container = document.querySelector(selector);
      if (!container) return [];

      const visibleCategories: string[] = [];
      for (const child of Array.from(container.children)) {
        if (child.tagName.toLowerCase() === "h2") {
          const className = child.getAttribute("class");
          if (className && className.includes("title")) {
            const catName = child.textContent;
            if (catName) {
              // Clean up invisible Unicode characters and whitespace
              const cleanName = catName
                .replace(
                  /^[\s\u200B-\u200D\uFEFF]+|[\s\u200B-\u200D\uFEFF]+$/g,
                  ""
                )
                .trim();
              visibleCategories.push(cleanName);
            }
          }
        }
      }
      return visibleCategories;
    }, overviewSelector);

    log.info(
      `Categories visible after positioning: ${initialCategories.join(", ")}`
    );

    // Verify first category is at the top (case-insensitive comparison)
    const isProperlyPositioned = initialCategories.some(
      (cat) => cat.toLowerCase() === firstCategoryName.toLowerCase()
    );
    log.info(
      `✅ Properly positioned at start: ${isProperlyPositioned ? "YES" : "NO"}`
    );

    let totalUniqueIcons = 0;
    let previousTotalIcons = 0;
    let stableIterations = 0;
    const maxStableIterations = 10;

    // Get the final category name for completion detection
    const finalCategoryName = categories[categories.length - 1]?.categoryName;
    const finalCategoryExpectedCount = parseInt(
      categories[categories.length - 1]?.categoryCount || "0"
    );

    // Calculate expected total icons from all categories
    const expectedTotalIcons = categories.reduce(
      (sum, cat) => sum + parseInt(cat.categoryCount),
      0
    );

    log.info(
      `Final category to complete: "${finalCategoryName}" (expected ${finalCategoryExpectedCount} icons)`
    );
    log.info(
      `Expected total icons across all categories: ${expectedTotalIcons}`
    );

    // Scroll through the container and capture icons at each position
    for (let iteration = 0; iteration < 500; iteration++) {
      // Increased iterations
      // Use only mouse wheel scrolling - the most reliable strategy
      await containerElement.hover();
      await page.mouse.wheel(0, 200); // Smaller increments to avoid jarring the virtual scroller
      const scrollAction = "wheel scroll (+200px)";

      // Wait for any lazy loading to trigger (reduced timing for gentler scrolling)
      await page.waitForTimeout(300);

      // Additional minimal wait for virtual scroll updates
      try {
        await page.waitForFunction(() => {
          return new Promise((resolve) => {
            // Give the virtual scroll system time to respond
            setTimeout(() => resolve(true), 50);
          });
        });
      } catch (e) {
        // Ignore timeout, continue with extraction
      }

      // Check container state after scroll
      const containerInfo = await page.evaluate((selector: string) => {
        const container = document.querySelector(selector);
        if (container) {
          return {
            scrollTop: container.scrollTop,
            scrollHeight: container.scrollHeight,
            clientHeight: container.clientHeight,
            childCount: container.children.length,
            exists: true
          };
        }
        return { exists: false };
      }, overviewSelector);

      if (!containerInfo.exists) {
        log.error(`Container not found at iteration ${iteration + 1}`);
        break;
      }

      // Capture whatever icons are currently visible
      const { totalVisible, newIcons } = await captureCurrentIcons();

      // Calculate total unique icons across all categories
      totalUniqueIcons = Array.from(categoryMap.values()).reduce(
        (sum, cat) => sum + cat.icons.size,
        0
      );

      // Check if we've completed the final category (smart breakpoint)
      let finalCategoryData: CategoryWithIcons | undefined = undefined;
      let finalCategoryIconCount = 0;
      if (finalCategoryName) {
        finalCategoryData = categoryMap.get(finalCategoryName);
        finalCategoryIconCount = finalCategoryData
          ? finalCategoryData.icons.size
          : 0;
      }
      const isFinalCategoryComplete =
        finalCategoryIconCount >= finalCategoryExpectedCount;

      // Enhanced success check - verify final category completion with additional safety checks
      if (isFinalCategoryComplete) {
        // Log progress for the final category
        if (iteration % 5 === 0) {
          log.info(
            `Final category "${finalCategoryName}": ${finalCategoryIconCount}/${finalCategoryExpectedCount} icons (${isFinalCategoryComplete ? "COMPLETE" : "in progress"})`
          );
        }

        // Early success check - if we've completed the final category and have been stable
        if (stableIterations >= 3) {
          // Additional verification: check if total icons is reasonable
          const totalIconsRatio = totalUniqueIcons / expectedTotalIcons;
          if (totalIconsRatio >= 0.95) {
            // At least 95% of expected icons
            log.info(
              `✅ Final category "${finalCategoryName}" completed with ${finalCategoryIconCount}/${finalCategoryExpectedCount} icons.`
            );
            log.info(
              `✅ Total: ${totalUniqueIcons}/${expectedTotalIcons} icons (${(totalIconsRatio * 100).toFixed(1)}%). Extraction complete!`
            );
            break;
          } else {
            log.info(
              `⚠️  Final category complete but total icons (${totalUniqueIcons}) is only ${(totalIconsRatio * 100).toFixed(1)}% of expected (${expectedTotalIcons}). Continuing...`
            );
            stableIterations = 0; // Reset and continue
          }
        }

        // Additional safety: if final category has significantly more icons than expected, also complete
        if (finalCategoryIconCount > finalCategoryExpectedCount + 5) {
          log.info(
            `⚠️  Final category "${finalCategoryName}" has ${finalCategoryIconCount} icons (expected ${finalCategoryExpectedCount}). Extraction complete with surplus icons!`
          );
          break;
        }
      }

      // Log progress every 10 iterations with more detail
      if (iteration % 10 === 0) {
        const progressPercentage = (
          (totalUniqueIcons / expectedTotalIcons) *
          100
        ).toFixed(1);
        log.info(`Iteration ${iteration + 1}: ${scrollAction}`);
        log.info(
          `  Icons: ${totalVisible} visible, ${newIcons} new, total unique: ${totalUniqueIcons}/${expectedTotalIcons} (${progressPercentage}%)`
        );
        log.info(
          `  Container: scrollTop=${containerInfo.scrollTop}, scrollHeight=${containerInfo.scrollHeight}, children=${containerInfo.childCount}`
        );
        log.info(
          `  Final category "${finalCategoryName}": ${finalCategoryIconCount}/${finalCategoryExpectedCount} icons`
        );

        // Log scroll position relative to total height
        if (
          typeof containerInfo.scrollHeight === "number" &&
          containerInfo.scrollHeight > 0 &&
          typeof containerInfo.scrollTop === "number"
        ) {
          const scrollProgress = (
            (containerInfo.scrollTop / containerInfo.scrollHeight) *
            100
          ).toFixed(1);
          log.info(
            `  Scroll progress: ${scrollProgress}% (${containerInfo.scrollTop}/${containerInfo.scrollHeight})`
          );
        }
      }

      // Check if scrollHeight is changing (indicates new content loading)
      // Since height changes from 15872px to 576px, we need to track any significant changes
      const isScrollHeightStable =
        typeof containerInfo.scrollHeight === "number" &&
        containerInfo.scrollHeight < 500; // If very small, likely collapsed

      // More patient with new icon detection, but stop if scrollHeight is very small AND no new icons
      if (totalUniqueIcons === previousTotalIcons) {
        stableIterations++;
        if (iteration % 20 === 0) {
          log.info(
            `Stable count: ${stableIterations}/${maxStableIterations} (scrollHeight: ${containerInfo.scrollHeight}px, stable: ${isScrollHeightStable})`
          );
        }

        // Only stop if we've been stable for a while AND scrollHeight is very small (collapsed)
        if (stableIterations >= maxStableIterations && isScrollHeightStable) {
          log.info(
            `No new icons found for ${maxStableIterations} iterations and container collapsed (${containerInfo.scrollHeight}px), extraction complete`
          );
          break;
        }

        // Reset stable count if scrollHeight is still reasonable (content still loading)
        if (stableIterations >= maxStableIterations && !isScrollHeightStable) {
          log.info(
            `ScrollHeight still reasonable (${containerInfo.scrollHeight}px), resetting stable count and continuing...`
          );
          stableIterations = 0;
        }
      } else {
        stableIterations = 0;
        const newIconsThisRound = totalUniqueIcons - previousTotalIcons;
        if (newIconsThisRound > 0) {
          log.info(
            `Found ${newIconsThisRound} new unique icons, continuing...`
          );
        }
      }

      previousTotalIcons = totalUniqueIcons;

      // Force continue message every 50 iterations
      if (iteration % 50 === 0 && iteration > 0) {
        log.info(
          `Continuing extraction... (${iteration}/500 iterations completed, ${totalUniqueIcons} icons found)`
        );
      }
    }

    // Final thorough sweep using the same reliable scrolling method
    log.info("Performing final extraction sweep...");
    for (let finalPass = 0; finalPass < 30; finalPass++) {
      // Use consistent mouse wheel scrolling
      await containerElement.hover();
      await page.mouse.wheel(0, 300); // Slightly larger increments for final sweep
      await page.waitForTimeout(500);
      await captureCurrentIcons();
    }

    // Convert Sets to arrays for JSON output
    const iconsOutput = Array.from(categoryMap.values()).map((category) => ({
      categoryName: category.categoryName,
      categoryCount: category.categoryCount,
      icons: Array.from(category.icons).sort() // Sort for consistent output
    }));

    const totalFinalIcons = iconsOutput.reduce(
      (sum, cat) => sum + cat.icons.length,
      0
    );
    log.info(
      `Extraction completed! Total unique icons captured: ${totalFinalIcons}`
    );

    // Log per-category counts
    for (const category of iconsOutput) {
      log.info(`${category.categoryName}: ${category.icons.length} icons`);
    }

    const iconsPath = path.join(outputDir, "icons.json");
    fs.writeFileSync(iconsPath, JSON.stringify(iconsOutput, null, 2), "utf-8");
    log.info(`Icons written to ${iconsPath}`);
    // --- END ICON EXTRACTION LOGIC ---
  }

  await pushData({
    url: request.loadedUrl,
    title,
    categoriesCount: categories.length,
    iconsExtracted: true
  });
});
