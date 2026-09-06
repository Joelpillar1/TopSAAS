# TopSAAS Model Context Protocol (MCP) Integration

Connect AI agents like Claude Desktop, Cursor, Antigravity, and custom LLM workflows directly to the live TopSAAS database.

## MCP Configuration (Claude Desktop / Cursor)

Add the following to your `claude_desktop_config.json` or `mcp_config.json`:

```json
{
  "mcpServers": {
    "topsaas": {
      "command": "npx",
      "args": ["-y", "@topsaas/mcp-server@latest"],
      "env": {
        "TOPSAAS_API_URL": "https://topsaas.com/products.json"
      }
    }
  }
}
```

## Available MCP Tools
- `search_products`: Search tools by keywords, problem statements, and categories.
- `get_leaderboard`: Fetch live ranked tools with upvote scores and descriptions.
- `get_product_details`: Get founder info, coupon codes, and video demos.
