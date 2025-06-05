import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

interface RawIconData {
  categoryName: string;
  categoryCount: number;
  icons: string[];
}

interface RawCategoryData {
  categoryName: string;
  categoryCount: number;
}

async function loadDatasetFiles(): Promise<{
  icons: RawIconData[];
  categories: RawCategoryData[];
}> {
  const datasetPath = "storage/datasets/default";

  try {
    // Read icons.json
    const iconsData = JSON.parse(
      await readFile(join(datasetPath, "icons.json"), "utf-8")
    );

    // Read categories.json
    const categoriesData = JSON.parse(
      await readFile(join(datasetPath, "categories.json"), "utf-8")
    );

    // Merge icons data with additional data if it contains icon information
    const allIcons = Array.isArray(iconsData) ? iconsData : [];

    return {
      icons: allIcons,
      categories: Array.isArray(categoriesData) ? categoriesData : []
    };
  } catch (error) {
    console.error("Error loading dataset files:", error);
    throw error;
  }
}

function createDisplayName(name: string): string {
  // Remove hyphens/underscores, split into words, capitalize each, join as PascalCase
  return name
    .replace(/[-_]/g, " ") // Replace hyphens/underscores with spaces
    .split(" ")
    .map((word) =>
      word && word.length > 0 && typeof word[0] !== "undefined"
        ? word[0].toUpperCase() + word.slice(1).toLowerCase()
        : ""
    )
    .join("");
}

async function processIconData() {
  console.log("Processing icon data from storage/datasets/default...");

  const { icons: rawIcons, categories: rawCategories } =
    await loadDatasetFiles();

  console.log(
    `Found ${rawIcons.length} icon categories and ${rawCategories.length} categories`
  );

  // Process icons: flatten all icons with their category
  type IconMetadata = {
    name: string;
    category: string;
  };

  const allIcons: IconMetadata[] = rawIcons.flatMap((iconCategory) =>
    (iconCategory.icons || []).map((iconName) => ({
      name: createDisplayName(iconName), // Use createDisplayName for the name
      category: iconCategory.categoryName
    }))
  );

  // Remove duplicates by name
  const uniqueIcons = allIcons.filter(
    (icon, idx, arr) => idx === arr.findIndex((i) => i.name === icon.name)
  );

  // Process categories with icon counts
  const processedCategories = rawCategories.map((cat) => ({
    name: cat.categoryName,
    iconCount: cat.categoryCount
  }));

  // Save processed data
  await mkdir("data", { recursive: true });
  await writeFile(
    "data/icon-metadata.json",
    JSON.stringify(uniqueIcons, null, 2)
  );

  // Generate TypeScript module with proper formatting
  const iconMetadataString = uniqueIcons
    .map((icon) => `  { name: "${icon.name}", category: "${icon.category}" }`)
    .join(",\n");

  const categoriesString = processedCategories
    .map((cat) => `  { name: "${cat.name}", iconCount: ${cat.iconCount} }`)
    .join(",\n");

  const tsContent = `// Auto-generated - do not edit manually
// Generated from storage/datasets/default on ${new Date().toISOString()}

export interface IconMetadata {
    name: string;
    category: string;
}

export interface CategoryMetadata {
    name: string;
    iconCount: number;
}

export const iconMetadata: IconMetadata[] = [
${iconMetadataString}
];

export const categories: CategoryMetadata[] = [
${categoriesString}
];

export const iconCount = ${uniqueIcons.length};
export const categoryCount = ${processedCategories.length};

// Helper functions
export function getIconsByCategory(category: string): IconMetadata[] {
    const lowerCategory = category.toLowerCase();
    return iconMetadata.filter(icon => icon.category.toLowerCase().includes(lowerCategory));
}

export function searchIcons(query: string): IconMetadata[] {
    const lowerQuery = query.toLowerCase();
    return iconMetadata.filter(icon => 
        icon.name.toLowerCase().includes(lowerQuery) ||
        icon.category.toLowerCase().includes(lowerQuery)
    );
}

export function getAllCategories(): string[] {
    return categories.map(cat => cat.name);
}

export function searchCategories(query: string): CategoryMetadata[] {
    const lowerQuery = query.toLowerCase();
    return categories.filter(category => 
        category.name.toLowerCase().includes(lowerQuery)
    );
}
`;

  await mkdir("src/data", { recursive: true });
  await writeFile("src/data/icons.ts", tsContent);

  console.log(`✅ Processed ${uniqueIcons.length} unique icons`);
  console.log(`✅ Processed ${processedCategories.length} categories`);
  console.log(`✅ Generated TypeScript module at src/data/icons.ts`);

  // Log category breakdown
  console.log("\n📊 Category breakdown:");
  processedCategories
    .sort((a, b) => b.iconCount - a.iconCount)
    .forEach((cat) => {
      console.log(`  ${cat.name}: ${cat.iconCount} icons`);
    });
}

if (import.meta.main) {
  processIconData().catch(console.error);
}
