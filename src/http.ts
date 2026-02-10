/**
 * Implements a stateless HTTP server endpoint for the Model Context Protocol (MCP)
 * using Express and the StreamableHTTPServerTransport.
 *
 * For each incoming POST request to `/mcp`, a new instance of both the MCP server and
 * StreamableHTTPServerTransport is created to ensure complete isolation between requests,
 * preventing request ID collisions when multiple clients connect concurrently.
 *
 * The transport is properly closed when the request ends or is closed by the client.
 * Only POST requests are allowed on `/mcp`; GET and DELETE requests return a JSON-RPC
 * error response with HTTP 405 (Method Not Allowed).
 *
 * @remarks
 * This implementation is intended for stateless, streamable HTTP communication with MCP clients.
 * It is not suitable for scenarios requiring persistent server state across requests.
 *
 * @see StreamableHTTPServerTransport
 * @see createMcpServer
 */

import type { Request, Response } from "express";
import express from "express";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { createMcpServer } from "./utils.js";

export async function startHttpServer() {
  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req: Request, res: Response) => {
    // In stateless mode, create a new instance of transport and server for each request
    // to ensure complete isolation. A single instance would cause request ID collisions
    // when multiple clients connect concurrently.

    try {
      const server = createMcpServer();
      const transport: StreamableHTTPServerTransport =
        new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined
        });
      res.on("close", () => {
        transport.close();
        server.close();
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error"
          },
          id: null
        });
      }
    }
  });

  app.get("/mcp", async (req: Request, res: Response) => {
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Method not allowed."
        },
        id: null
      })
    );
  });

  app.delete("/mcp", async (req: Request, res: Response) => {
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Method not allowed."
        },
        id: null
      })
    );
  });

  // Start the server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    // console.log(`MCP Stateless Streamable HTTP Server listening on port ${PORT}`);
  });
}
