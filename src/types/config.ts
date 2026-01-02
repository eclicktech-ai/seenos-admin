export interface AgentConfig {
  name: string;
  description: string;
  modelId: string;
  systemPrompt: string;
  tools: string[];
  isEnabled: boolean;
  category: string;
  toolCount: number;
  isModelOverridden: boolean;
  isPromptOverridden: boolean;
  isToolsOverridden: boolean;
  isDescriptionOverridden: boolean;
}

export interface OrchestratorConfig {
  modelId: string;
  systemPrompt: string;
  tools: string[];
  subagents: SubagentSummary[];
  enabledSubagentCount: number;
  isModelOverridden: boolean;
  isPromptOverridden: boolean;
  isToolsOverridden: boolean;
}

export interface SubagentSummary {
  name: string;
  description: string;
  isEnabled: boolean;
  category: string;
  toolCount: number;
}

export interface ToolConfig {
  name: string;
  displayName: string;
  description: string;
  category: string;
  isEnabled: boolean;
  settings?: Record<string, unknown>;
  usedByAgents: string[];
  usedByOrchestrator: boolean;
}

export interface InviteCode {
  id: string;
  code: string;
  maxUses: number;
  usedCount: number;
  remainingUses: number;
  isActive: boolean;
  isValid: boolean;
  expiresAt?: string;
  note?: string;
  createdAt: string;
}

export interface AdminUser {
  userId: string;
  email: string;
  name?: string;
  level: number;
  levelName: string;
  note?: string;
  grantedAt?: string;
}

export interface Playbook {
  id: string;
  skillId: string;
  name: string;
  description?: string;
  difficulty: string;
  tags: string[];
  autoActions: string[];
  artifacts: string[];
  hasConfigure: boolean;
  category: string;
}

// Model types
export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description?: string;
  contextWindow?: number;
  supportsVision?: boolean;
  supportsTools?: boolean;
}

export interface ProviderModels {
  providerId: string;
  providerName: string;
  icon: string;
  models: ModelOption[];
}

export interface ModelsGroupedResponse {
  providers: ProviderModels[];
}

export interface ModelDefaults {
  orchestratorModel: string;
  defaultSubagentModel: string;
}

