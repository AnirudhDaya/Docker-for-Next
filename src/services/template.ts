import { getEnvNextCompose, getPlainNextCompose, getPrismaNextCompose } from '../templates/compose/index.js';
import { getEnvNextDockerfile, getPlainNextDockerfile, getPrismaNextDockerfile } from '../templates/dockerfiles/index.js';
import { getEnvNextWorkflow, getPlainNextWorkflow, getPrismaNextWorkflow } from '../templates/workflows/index.js';
import { ProjectType, EnvVariables, TemplateFile } from '../types.js';
import { injectEnvVariables } from './env.js';


/**
 * Get the appropriate Dockerfile template for the selected project type
 */
function getDockerfileTemplate(projectType: ProjectType): string {
  switch (projectType) {
    case ProjectType.PLAIN:
      return getPlainNextDockerfile();
    case ProjectType.ENV:
      return getEnvNextDockerfile();
    case ProjectType.PRISMA:
      return getPrismaNextDockerfile();
    default:
      throw new Error(`Unknown project type: ${projectType}`);
  }
}

/**
 * Get the appropriate Docker Compose template for the selected project type
 */
function getComposeTemplate(projectType: ProjectType): string {
  switch (projectType) {
    case ProjectType.PLAIN:
      return getPlainNextCompose();
    case ProjectType.ENV:
      return getEnvNextCompose();
    case ProjectType.PRISMA:
      return getPrismaNextCompose();
    default:
      throw new Error(`Unknown project type: ${projectType}`);
  }
}

/**
 * Get the appropriate GitHub workflow template for the selected project type
 */
function getWorkflowTemplate(projectType: ProjectType): string {
  switch (projectType) {
    case ProjectType.PLAIN:
      return getPlainNextWorkflow();
    case ProjectType.ENV:
      return getEnvNextWorkflow();
    case ProjectType.PRISMA:
      return getPrismaNextWorkflow();
    default:
      throw new Error(`Unknown project type: ${projectType}`);
  }
}

/**
 * Generate all required template files with environment variables injected
 */
export function generateTemplates(
  projectType: ProjectType, 
  envVars: EnvVariables = {}, 
  domainName?: string
): TemplateFile[] {
  const templates: TemplateFile[] = [];
  
  // Add domain to environment variables if provided
  const variables = { ...envVars };
  if (domainName) {
    variables.DOMAIN = domainName;
  }
  
  // Get raw templates
  const dockerfileTemplate = getDockerfileTemplate(projectType);
  const composeTemplate = getComposeTemplate(projectType);
  const workflowTemplate = getWorkflowTemplate(projectType);
  
  // Inject environment variables
  const dockerfileContent = injectEnvVariables(dockerfileTemplate, variables);
  const composeContent = injectEnvVariables(composeTemplate, variables);
  const workflowContent = injectEnvVariables(workflowTemplate, variables);
  
  // Add to result
  templates.push({
    fileName: 'Dockerfile',
    content: dockerfileContent,
  });
  
  templates.push({
    fileName: 'docker-compose.yml',
    content: composeContent,
  });
  
  templates.push({
    fileName: '.github/workflows/deploy.yml',
    content: workflowContent,
  });
  
  return templates;
}