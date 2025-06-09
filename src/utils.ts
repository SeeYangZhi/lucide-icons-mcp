import Fuse from "fuse.js";
import { z } from "zod";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import {
  categories,
  getAllCategories,
  getIconsByCategory,
  iconMetadata
} from "./data/icons.js";

// Common response helper
const createTextResponse = (data: any) => ({
  content: [
    {
      type: "text" as const,
      text: JSON.stringify(data, null, 2)
    }
  ]
});

// Common schemas
const limitSchema = (max: number, defaultValue: number) =>
  z.number().min(1).max(max).default(defaultValue).optional();

const searchSchemas = {
  iconLimit: limitSchema(300, 20),
  categoryLimit: limitSchema(50, 10),
  listLimit: limitSchema(300, 20)
};

// Search utilities
class SearchService {
  static filterIconsByName(icons: typeof iconMetadata, name: string) {
    return icons.filter((icon) =>
      icon.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  static filterIconsByCategory(icons: typeof iconMetadata, category: string) {
    return icons.filter((icon) =>
      icon.categories.some((cat) =>
        cat.toLowerCase().includes(category.toLowerCase())
      )
    );
  }

  static filterCategories(categoryName: string) {
    return categories.filter((category) =>
      category.name.toLowerCase().includes(categoryName.toLowerCase())
    );
  }

  static createFuseSearch<T>(data: T[], keys: string[]) {
    return new Fuse(data, {
      keys,
      isCaseSensitive: false
    });
  }

  static applyLimit<T>(results: T[], limit?: number): T[] {
    return limit ? results.slice(0, limit) : results;
  }
}

// Icon usage example generator
class IconUsageGenerator {
  static generate(iconName: string) {
    const componentName = iconName;
    const importLine = `import { ${componentName} } from 'lucide-react';`;
    const basicExample = `<${componentName} />`;
    const propsExample = `<${componentName} size={24} color="#3b82f6" strokeWidth={1.5} />`;

    return `${importLine}\n\nfunction Example() {\n  return (\n    <div>\n      {/* Basic usage */}\n      ${basicExample}\n      \n      {/* With props */}\n      ${propsExample}\n    </div>\n  );\n}`;
  }
}

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "Lucide Icons MCP Server",
    version: "0.1.4"
  });

  // Tool: search_icons
  server.tool(
    "search_icons",
    "Search for icons from lucide by name or category using partial matching",
    {
      name: z.string().describe("Exact icon name to search for"),
      category: z
        .string()
        .optional()
        .describe("category to filter by (optional)"),
      limit: searchSchemas.iconLimit.describe("Max results to return")
    },
    async ({ name, category, limit }) => {
      let results = SearchService.filterIconsByName(iconMetadata, name);

      if (category) {
        results = SearchService.filterIconsByCategory(results, category);
      }

      results = SearchService.applyLimit(results, limit);
      return createTextResponse(results);
    }
  );

  // Tool: search_categories
  server.tool(
    "search_categories",
    "Search for icon categories by category name using partial matching",
    {
      name: z.string().describe("Category to search for"),
      limit: searchSchemas.categoryLimit.describe("Max results to return")
    },
    async ({ name, limit }) => {
      let results = SearchService.filterCategories(name);
      results = SearchService.applyLimit(results, limit);
      return createTextResponse(results);
    }
  );

  // Tool: fuzzy_search_icons
  server.tool(
    "fuzzy_search_icons",
    "Fuzzy Search for icons from lucide by icon name",
    {
      query: z.string().describe("Search term for icon name"),
      limit: searchSchemas.iconLimit.describe("Max results to return")
    },
    async ({ query, limit }) => {
      const fuse = SearchService.createFuseSearch(iconMetadata, ["name"]);
      let results = fuse.search(query);
      results = SearchService.applyLimit(results, limit);
      return createTextResponse(results);
    }
  );

  // Tool: fuzzy_search_categories
  server.tool(
    "fuzzy_search_categories",
    "Fuzzy Search for icon categories by category name",
    {
      query: z.string().describe("Search term for category name"),
      limit: searchSchemas.categoryLimit.describe("Max results to return")
    },
    async ({ query, limit }) => {
      const fuse = SearchService.createFuseSearch(categories, ["name"]);
      let results = fuse.search(query);
      results = SearchService.applyLimit(results, limit);
      return createTextResponse(results);
    }
  );

  // Tool: get_icon_usage_examples
  server.tool(
    "get_icon_usage_examples",
    "Get usage examples for a Lucide React icon",
    {
      name: z.string().describe("Icon name, e.g. 'home' or 'user'")
    },
    async ({ name }) => {
      const icon = iconMetadata.find(
        (i) => i.name.toLowerCase() === name.toLowerCase()
      );

      if (!icon) {
        return createTextResponse(
          `Icon "${name}" not found. Use search_icons to find available icons.`
        );
      }

      const example = IconUsageGenerator.generate(icon.name);
      return {
        content: [
          {
            type: "text" as const,
            text: example
          }
        ]
      };
    }
  );

  // Tool: list_icons_by_category
  server.tool(
    "list_all_icons_by_category",
    "List all icons in a specific category",
    {
      category: z.string().describe("Category name to list icons for"),
      limit: searchSchemas.listLimit.describe(
        "Max results to return (optional)"
      )
    },
    async ({ category, limit }) => {
      let results = getIconsByCategory(category);

      if (results.length === 0) {
        const availableCategories = getAllCategories();
        return createTextResponse(
          `No icons found in category "${category}". Available categories: ${availableCategories.join(", ")}`
        );
      }

      results = SearchService.applyLimit(results, limit);
      return createTextResponse(results);
    }
  );

  // Tool: list_all_categories
  server.tool(
    "list_all_categories",
    "List all available icon categories with their icon counts",
    {},
    async () => createTextResponse(categories)
  );

  return server;
}
