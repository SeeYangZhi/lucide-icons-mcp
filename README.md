# lucide-icons-mcp

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server exposing [Lucide React](https://lucide.dev/) icons as resources and tools for LLMs and agentic applications. Built with Bun and the MCP TypeScript SDK.

## What is Lucide?

[Lucide](https://lucide.dev/) is a beautiful & consistent icon toolkit made by the community. It's an open-source icon library that provides over 1,500+ carefully crafted icons in a single, consistent style. Originally forked from Feather Icons, Lucide has grown into one of the most popular icon libraries for modern web development.

## What is MCP?

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) is a standard for AI tools to request specific context from sources outside their main training data.

This MCP server allows AI coding assistants and other agentic applications to access information about Lucide React icons, enabling better assistance with icon search, discovery, and implementation.

## Features

- 🔍 **Icon Search**: Search through 1,500+ Lucide icons by name or category
- 📂 **Category Browsing**: List icons by categories (Design, Communication, Media, etc.)
- 💡 **Usage Examples**: Get React/JSX code examples for any icon
- 🔧 **Icon Information**: Detailed information about each icon
- 🚀 **MCP Integration**: Ready for Claude Desktop and other MCP clients
- 🌐 **Dual Mode**: HTTP server or stdio-based MCP server
- 📊 **Comprehensive Coverage**: All Lucide icons with proper JSX usage

## Prerequisites

- [Git](https://git-scm.com/)
- [Bun](https://bun.sh/) or [Node.js](https://nodejs.org/)

## Getting Started (Development)

### 1. Clone the repository

```bash
git clone https://github.com/SeeYangZhi/lucide-icons-mcp.git
cd lucide-icons-mcp
```

### 2. Install Bun (if you don't have it)

Refer to the official [Bun installation guide](https://bun.sh/docs/installation).  
After installation, restart your terminal and check:

```bash
bun --version
```

### 3. Install dependencies

```bash
bun install
```

### 4. Build the project

This compiles the TypeScript source to JavaScript in the `build` directory.

```bash
bun run build
```

## Usage

### HTTP Mode

You can run the HTTP server using `npx`:

```bash
npx lucide-icons-mcp
```

This starts the HTTP server (defaults to port 3000).

Or install globally:

```bash
npm install -g lucide-icons-mcp
```

Then run:

```bash
lucide-icons-mcp
```

### Stdio Mode

```bash
npx lucide-icons-mcp --stdio
# or if installed globally
lucide-icons-mcp --stdio
```

## Local Development

There are two main ways to run the MCP server:

### 1. HTTP Mode

Suitable for clients that support communication over HTTP.

**For development (using Bun):**

```bash
bun run start
# or directly
bun run src/entry.ts
```

### 2. Stdio Mode

Often used for direct integration with tools like Claude Desktop or the MCP Inspector.

**For development (using Bun):**

```bash
bun run src/entry.ts --stdio
```

## Configuration with AI Tools

### Example: Claude Desktop

To use this MCP server in [Claude Desktop](https://www.anthropic.com/claude-desktop):

1. Open your Claude Desktop configuration file:

```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

2. Add the server to the `mcpServers` section:

**Option A: via `npx` (Recommended):**

```json
{
  "mcpServers": {
    "lucide-icons": {
      "command": "npx",
      "args": ["lucide-icons-mcp", "--stdio"]
    }
  }
}
```

**Option B: Pointing directly to the build output:**

```json
{
  "mcpServers": {
    "lucide-icons": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/lucide-icons-mcp/build/entry.js", "--stdio"]
    }
  }
}
```

3. Save the file and restart Claude Desktop.
4. You should now see the "lucide-icons" server available in Claude's tools panel.

## Tools Available (MCP)

This MCP server exposes the following tools to AI coding assistants:

### 1. **search_icons**

- **Description**: Search for Lucide icons by name or category
- **Parameters**:
  - `query` (string): Search term for icon name or category
  - `category` (optional string): Filter by specific category
  - `limit` (optional number): Maximum results to return (default: 20)

### 2. **search_categories**

- **Description**: Search for icon categories by name
- **Parameters**:
  - `query` (string): Search term for category name
  - `limit` (optional number): Maximum results to return (default: 10)

### 3. **get_icon_usage_examples**

- **Description**: Get React/JSX usage examples for a specific Lucide icon
- **Parameters**:
  - `name` (string): Icon name (e.g., 'Home', 'User', 'Settings')

### 4. **list_icons_by_category**

- **Description**: List all icons in a specific category
- **Parameters**:
  - `category` (string): Category name to list icons for
  - `limit` (optional number): Maximum results to return

### 5. **list_all_categories**

- **Description**: List all available icon categories with their icon counts
- **Parameters**: None

### 6. **get_icon_info**

- **Description**: Get detailed information about a specific icon
- **Parameters**:
  - `name` (string): Icon name to get information for

### 7. **list_all_icons**

- **Description**: List all available Lucide icons
- **Parameters**:
  - `category` (optional string): Filter by category
  - `limit` (optional number): Maximum results to return (default: 100)

## Example Usage

Here's how an AI tool might use this MCP server:

### Example 1: Finding Icons

**User**: "Find me icons related to ArrowRight"

**AI tool calls `search_icons`**:

```json
{
  "query": "ArrowRight",
  "limit": 5
}
```

**Response**: Lists icons like `ArrowRight`

### Example 2: Getting Usage Examples

**User**: "Show me how to use the ArrowRight icon"

**AI tool calls `get_icon_usage_examples`**:

```json
{
  "name": "ArrowRight"
}
```

**Response**:

```jsx
import { ArrowRight } from "lucide-react";

function Example() {
  return (
    <div>
      <ArrowRight />
    </div>
  );
}
```

### Example 3: Browsing Categories

**User**: "What design-related icons are available?"

**AI tool calls `search_categories`**:

```json
{
  "query": "design"
}
```

Then calls `list_icons_by_category`":

```json
{
  "category": "Design",
  "limit": 10
}
```

## Icon Categories

Lucide icons are organized into categories such as:

- **Accessibility**
- **Accounts & access**
- **Animals**
- **Arrows**
- **Brands**
- **Buildings**
- **Charts**
- **Communication**
- **Connectivity**
- **Cursors**
- **Design**
- **Coding & development**
- **Devices**
- **Emoji**
- **File icons**
- **Finance**
- **Food & beverage**
- **Gaming**
- **Home**
- **Layout**
- **Mail**
- **Mathematics**
- **Medical**
- **Multimedia**
- **Nature**
- **Navigation**
- **Notification**
- **People**
- **Photography**
- **Science**
- **Seasons**
- **Security**
- **Shapes**
- **Shopping**
- **Social**
- **Sports**
- **Sustainability**
- **Text formatting**
- **Time & calendar**
- **Tools**
- **Transportation**
- **Travel**
- **Weather**

## Testing MCP Locally with Inspector

You can test the MCP server locally using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector).

First, ensure the project is built:

```bash
bun run build
```

Then launch the Inspector:

```bash
npx @modelcontextprotocol/inspector node ./build/entry.js --stdio
```

This opens the Inspector interface for interactive testing of your MCP server.

## Development Scripts

- **`bun run dev`**: Starts the server in HTTP mode for development
- **`bun run dev:stdio`**: Starts the stdio MCP server for development
- **`bun run build`**: Compiles TypeScript to JavaScript (output in `build/`)
- **`bun run lint`**: Lints the codebase using ESLint
- **`bun run lint:fix`**: Automatically fixes linting issues
- **`bun run crawl`**: Crawls Lucide website to update icon data
- **`bun run pre-build`**: Crawls data, builds icon metadata, and fixes linting

## Project Structure

```
lucide-icons-mcp/
├── src/
│   ├── entry.ts          # Main entry point
│   ├── http.ts           # HTTP server implementation
│   ├── stdio.ts          # Stdio server implementation
│   ├── utils.ts          # MCP server and tools logic
│   ├── data/
│   │   └── icons.ts      # Generated icon metadata and helpers
│   └── scripts/
│       ├── main.ts       # Web crawler for Lucide icons
│       ├── build-data.ts # Icon data processing
│       └── routes.ts     # Crawler route definitions
├── build/                # Compiled JavaScript output
├── storage/              # Crawler data storage
└── data/                 # Processed icon metadata
```

## Data Sources

This project includes a web crawler that automatically extracts icon information from the Lucide website, ensuring up-to-date icon data and categories.

## Resources

- [Lucide](https://lucide.dev/) - The icon library
- [Lucide React](https://lucide.dev/guide/packages/lucide-react) - React implementation
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - SDK used
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector) - Testing tool
- [Bun](https://bun.sh/) - JavaScript runtime

## License

This project is licensed under the MIT License. See [LICENSE](https://github.com/SeeYangZhi/lucide-icons-mcp/blob/main/LICENSE) for details.

The project includes icons from Lucide, which are licensed under the ISC License. See the [LICENSE](https://github.com/SeeYangZhi/lucide-icons-mcp/blob/main/LICENSE) file for full attribution details.
