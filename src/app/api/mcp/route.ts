import { DISCOVERY_TOOLS, GLOBE_COMMAND_TOOLS, HARDWARE_ODYSSEUS_TOOLS, executeMcpTool } from '@/core/mcp/mcpTools';

/**
 * GET /api/mcp
 * Returns discoverable MCP tool schemas.
 */
export async function GET() {
  return Response.json({
    success: true,
    protocol: 'mcp-1.0',
    tools: [
      ...DISCOVERY_TOOLS,
      ...GLOBE_COMMAND_TOOLS,
      ...HARDWARE_ODYSSEUS_TOOLS,
    ],
  });
}

/**
 * POST /api/mcp
 * Execute an MCP tool.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tool, arguments: args } = body;

    if (!tool) {
      return Response.json({ success: false, error: 'Missing tool name parameter' }, { status: 400 });
    }

    const result = await executeMcpTool(tool, args || {});
    return Response.json({
      success: true,
      tool,
      result,
    });
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 });
  }
}
