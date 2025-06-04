import { z } from "zod";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import {
  categories,
  getAllCategories,
  getIconsByCategory,
  iconMetadata,
  searchCategories,
  searchIcons
} from "./data/icons.js";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "Lucide Icons MCP Server",
    version: "0.1.0"
  });

  // Tool: search_icons
  server.tool(
    "search_icons",
    "Search for icons from lucide by name or category",
    {
      query: z.string().describe("Search term for icon name or category"),
      category: z
        .string()
        .optional()
        .describe("Category to filter by (optional)"),
      limit: z
        .number()
        .min(1)
        .max(300)
        .default(20)
        .optional()
        .describe("Max results to return")
    },
    async ({ query, category, limit }) => {
      let results = searchIcons(query);

      if (category) {
        // Use case-insensitive category filtering
        results = results.filter(
          (icon) => icon.category.toLowerCase() === category.toLowerCase()
        );
      }

      if (limit) {
        results = results.slice(0, limit);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2)
          }
        ]
      };
    }
  );

  // Tool: search_categories
  server.tool(
    "search_categories",
    "Search for icon categories by name",
    {
      query: z.string().describe("Search term for category name"),
      limit: z
        .number()
        .min(1)
        .max(50)
        .default(10)
        .optional()
        .describe("Max results to return")
    },
    async ({ query, limit }) => {
      let results = searchCategories(query);

      if (limit) {
        results = results.slice(0, limit);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2)
          }
        ]
      };
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
      // Find the icon to get proper casing
      const icon = iconMetadata.find(
        (i) => i.name.toLowerCase() === name.toLowerCase()
      );

      if (!icon) {
        return {
          content: [
            {
              type: "text",
              text: `Icon "${name}" not found. Use search_icons to find available icons.`
            }
          ]
        };
      }

      const componentName = icon.name;
      const importLine = `import { ${componentName} } from 'lucide-react';`;
      const basicExample = `<${componentName} />`;
      const propsExample = `<${componentName} size={24} color="#3b82f6" strokeWidth={1.5} />`;
      const fullExample = `${importLine}\n\nfunction Example() {\n  return (\n    <div>\n      {/* Basic usage */}\n      ${basicExample}\n      \n      {/* With props */}\n      ${propsExample}\n    </div>\n  );\n}`;

      return {
        content: [
          {
            type: "text",
            text: fullExample
          }
        ]
      };
    }
  );

  // Tool: list_icons_by_category
  server.tool(
    "list_icons_by_category",
    "List all icons in a specific category",
    {
      category: z.string().describe("Category name to list icons for"),
      limit: z
        .number()
        .min(1)
        .max(200)
        .optional()
        .describe("Max results to return (optional)")
    },
    async ({ category, limit }) => {
      let results = getIconsByCategory(category);

      if (results.length === 0) {
        const availableCategories = getAllCategories();
        return {
          content: [
            {
              type: "text",
              text: `No icons found in category "${category}". Available categories: ${availableCategories.join(", ")}`
            }
          ]
        };
      }

      if (limit) {
        results = results.slice(0, limit);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2)
          }
        ]
      };
    }
  );

  // Tool: list_all_categories
  server.tool(
    "list_all_categories",
    "List all available icon categories with their icon counts",
    {},
    async () => {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(categories, null, 2)
          }
        ]
      };
    }
  );

  // Tool: get_icon_info
  server.tool(
    "get_icon_info",
    "Get detailed information about a specific icon",
    {
      name: z.string().describe("Icon name to get information for")
    },
    async ({ name }) => {
      const icon = iconMetadata.find(
        (i) => i.name.toLowerCase() === name.toLowerCase()
      );

      if (!icon) {
        return {
          content: [
            {
              type: "text",
              text: `Icon "${name}" not found. Use search_icons to find available icons.`
            }
          ]
        };
      }

      const info = {
        name: icon.name,
        category: icon.category,
        usage: {
          import: `import { ${icon.name} } from 'lucide-react';`,
          jsx: `<${icon.name} size={24} />`,
          withProps: `<${icon.name} size={20} color="#3b82f6" strokeWidth={1.5} />`,
          withClassName: `<${icon.name} className="w-6 h-6 text-blue-500" />`
        }
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(info, null, 2)
          }
        ]
      };
    }
  );

  // Tool: list_all_icons
  server.tool(
    "list_all_icons",
    "List all available Lucide React icons with optional filtering",
    {
      category: z.string().optional().describe("Filter by category (optional)"),
      limit: z
        .number()
        .min(1)
        .max(1598)
        .default(100)
        .optional()
        .describe("Max results to return, defaults to 100")
    },
    async ({ category, limit }) => {
      let results = iconMetadata;

      if (category) {
        results = getIconsByCategory(category);
      }

      if (limit) {
        results = results.slice(0, limit);
      }

      // Return just the names for easier reading
      const iconNames = results.map((icon) => icon.name);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(iconNames, null, 2)
          }
        ]
      };
    }
  );

  return server;
}
