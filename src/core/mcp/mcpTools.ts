import { getFavorites, getInstalledPlugins, getTelemetryLogs } from '@/lib/jsonStorage';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const DISCOVERY_TOOLS: McpToolDefinition[] = [
  {
    name: 'list_installed_plugins',
    description: 'Returns list of all currently installed dynamic plugins in the system.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_favorites',
    description: 'Returns list of operator bookmarked entities and landmarks.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

export const GLOBE_COMMAND_TOOLS: McpToolDefinition[] = [
  {
    name: 'fly_to_coordinates',
    description: 'Fly globe camera to latitude, longitude, and altitude.',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: 'Latitude (-90 to 90)' },
        longitude: { type: 'number', description: 'Longitude (-180 to 180)' },
        altitude: { type: 'number', description: 'Altitude in meters' },
      },
      required: ['latitude', 'longitude'],
    },
  },
  {
    name: 'set_active_layer',
    description: 'Toggle visibility of a map layer or plugin.',
    inputSchema: {
      type: 'object',
      properties: {
        pluginId: { type: 'string', description: 'ID of the target plugin' },
        enabled: { type: 'boolean', description: 'Enable or disable layer' },
      },
      required: ['pluginId', 'enabled'],
    },
  },
];

export const HARDWARE_ODYSSEUS_TOOLS: McpToolDefinition[] = [
  {
    name: 'get_hardware_status',
    description: 'Fetch status and telemetry from connected Odysseus hardware and LoRa bridge.',
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'string', description: 'Optional target hardware device ID' },
      },
    },
  },
  {
    name: 'generate_edge_llm',
    description: 'Run prompt on local offline LLM model via Odysseus bridge daemon.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'User prompt text' },
        model: { type: 'string', description: 'Optional local model override' },
      },
      required: ['prompt'],
    },
  },
];

/**
 * Handle MCP Tool Execution.
 */
export async function executeMcpTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case 'list_installed_plugins':
      return { plugins: getInstalledPlugins() };
    case 'list_favorites':
      return { favorites: getFavorites() };
    case 'get_hardware_status':
      return { telemetry: getTelemetryLogs('Odysseus-Hardware').slice(0, 10) };
    case 'fly_to_coordinates':
      return { success: true, command: 'flyTo', target: args };
    case 'set_active_layer':
      return { success: true, command: 'setActiveLayer', pluginId: args.pluginId, enabled: args.enabled };
    case 'generate_edge_llm':
      return { success: true, model: args.model || 'local-edge-model', prompt: args.prompt, result: 'Offline LLM inference complete.' };
    default:
      throw new Error(`Unknown MCP Tool: ${name}`);
  }
}
