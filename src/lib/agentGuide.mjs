import { SITE_URL } from './siteIdentity.mjs';

export const agentInterface = {
  endpoint: `${SITE_URL}/mcp`,
  tools: 'get_profile · search_content · get_project · list_albums · get_album · get_portfolio_catalog · create_portfolio_view · apply_portfolio_action',
  description: 'Connect with Streamable HTTP at /mcp. Read the portfolio catalog before choosing exact project IDs and layouts. Create a view with up to three approved modules, then apply focused actions to its latest state. Compatible MCP Apps hosts can display the interactive view; other clients receive structured state and a website link.',
  browser: 'On supported browsers, the homepage exposes get_portfolio_catalog, get_portfolio_view, change_portfolio_view, and navigate_portfolio_history. Read the current revision before changing the view. Stale actions are rejected; manual edits cancel pending generation. These tools do not read unsubmitted input.',
  authorship: 'All displayed project facts come from published work. Models choose approved layouts and controls, never arbitrary HTML or invented outcomes. Photography remains in its dedicated gallery and map. The government benchmark is an August 2025 snapshot.',
};

export const agentGuideMarkdown = `## Interactive interfaces

MCP endpoint: ${agentInterface.endpoint}

${agentInterface.description}

Tools: ${agentInterface.tools}

${agentInterface.browser}

${agentInterface.authorship}

Views can be shared with a versioned URL fragment. Links include committed controls, not unfinished prompts or provider metadata. Public tools do not write content, send messages, or access private accounts.
`;
