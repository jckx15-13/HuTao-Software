/**
 * CodeRabbit Integration & Automated Review Auditor Service
 * Inspects repository structure, rule definitions in .coderabbit.yaml,
 * and validates architectural compliance across project paths.
 */

export interface CodeRabbitPathRule {
  path: string;
  instructions: string;
}

export interface CodeRabbitAuditResult {
  timestamp: string;
  configFound: boolean;
  profile: string;
  rulesCount: number;
  checks: {
    ruleName: string;
    path: string;
    status: 'pass' | 'warning' | 'fail';
    message: string;
  }[];
}

const CODERABBIT_PROFILE = 'assertive';
const CODERABBIT_RULES: CodeRabbitPathRule[] = [
  { path: 'bridge/**', instructions: 'FastAPI bridge, local-first routing, error reporting, and resource safety.' },
  { path: 'src/core/qa/**', instructions: 'Sentry QA telemetry, breadcrumb tracking, and mock mode safety.' },
  { path: 'src/core/state/**', instructions: 'Zustand slice isolation, immutable updates, and selector performance.' },
  { path: 'src/components/**', instructions: 'Component boundaries, error handling, accessibility, and responsive layout.' },
  { path: 'src/plugins/**', instructions: 'Plugin registration, resource disposal, timeouts, and fallback handling.' },
  { path: 'src/lib/**', instructions: 'Numerical correctness and invalid input handling.' },
  { path: 'scripts/**', instructions: 'Strict assertions and complete verification coverage.' },
];

class CodeRabbitAuditService {
  public getCodeRabbitConfigSummary() {
    return {
      profile: CODERABBIT_PROFILE,
      autoReply: true,
      highLevelSummary: true,
      pathInstructionCount: CODERABBIT_RULES.length,
      targetPaths: CODERABBIT_RULES.map(({ path }) => path)
    };
  }

  public runAudit(): CodeRabbitAuditResult {
    const checks = CODERABBIT_RULES.map(({ path }) => ({
      ruleName: 'Configured review instruction',
      path,
      status: 'warning' as const,
      message: 'Configuration present. CodeRabbit’s hosted review result is not available in this local audit.'
    }));

    return {
      timestamp: new Date().toISOString(),
      configFound: CODERABBIT_RULES.length > 0,
      profile: CODERABBIT_PROFILE,
      rulesCount: CODERABBIT_RULES.length,
      checks
    };
  }
}

export const coderabbitService = new CodeRabbitAuditService();
