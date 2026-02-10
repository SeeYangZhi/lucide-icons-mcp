/**
 * Entry point for the MCP server using stdio transport.
 *
 * This implementation creates an MCP server instance and connects it to a
 * standard input/output (stdio) transport, allowing communication over
 * process stdio streams.
 *
 * If the server fails to start or encounters an error during initialization,
 * the process will exit with a non-zero status code.
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createMcpServer } from "./utils.js";

/**
 * Initializes and starts the MCP server with StdioTransport.
 * This function is exported to be callable from other modules (e.g., cli.ts).
 */
export async function runStdioServer() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
