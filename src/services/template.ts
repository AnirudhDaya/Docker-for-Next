// Modified version of the template.ts file to fix the environment variable issue

import { ProjectType, EnvVariables, TemplateFile } from '../types.js';
import { injectEnvVariables } from './env.js';
import { getPlainNextDockerfile, getEnvNextDockerfile, getPrismaNextDockerfile } from '../templates/dockerfiles/index.js';
import { getPlainNextCompose, getEnvNextCompose, getPrismaNextCompose } from '../templates/compose/index.js';
import { getPlainNextWorkflow, getEnvNextWorkflow, getPrismaNextWorkflow } from '../templates/workflows/index.js';

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
  domainName?: string,
  additionalEnvVars: string[] = []
): TemplateFile[] {
  const templates: TemplateFile[] = [];
  
  // Add domain to environment variables if provided
  const variables = { ...envVars };
  if (domainName) {
    variables.DOMAIN = domainName;
  }
  
  // Get raw templates
  let dockerfileTemplate = getDockerfileTemplate(projectType);
  let composeTemplate = getComposeTemplate(projectType);
  let workflowTemplate = getWorkflowTemplate(projectType);
  
  // Filter out server-related variables
  const systemVars = ['SERVER_HOST', 'SERVER_USER', 'SSH_PRIVATE_KEY'];
  const appEnvVars = additionalEnvVars.filter(varName => !systemVars.includes(varName));
  
  // Add dynamic environment variables to templates
  if (appEnvVars.length > 0 && (projectType === ProjectType.ENV || projectType === ProjectType.PRISMA)) {
    // Add build-time ARG and ENV to Dockerfile
    let buildEnvSection = '';
    appEnvVars.forEach(varName => {
      // Use DOLLAR_SIGN placeholder to prevent variable substitution
      buildEnvSection += `ARG ${varName}\nENV ${varName}=DOLLAR_SIGN${varName}\n`;
    });
    
    // Insert build-time variables before "Build the app"
    dockerfileTemplate = dockerfileTemplate.replace(
      '# Build the app',
      `${buildEnvSection}\n# Build the app`
    );
    
    // Add runtime ARG and ENV to Dockerfile
    let runtimeEnvSection = '';
    appEnvVars.forEach(varName => {
      // Use DOLLAR_SIGN placeholder to prevent variable substitution
      runtimeEnvSection += `ARG ${varName}\nENV ${varName}=DOLLAR_SIGN${varName}\n`;
    });
    
    // Insert runtime variables before EXPOSE
    dockerfileTemplate = dockerfileTemplate.replace(
      'EXPOSE 3000',
      `${runtimeEnvSection}\nEXPOSE 3000`
    );
    
    // Add variables to docker-compose build args
    let composeArgsSection = '';
    appEnvVars.forEach(varName => {
      // Use DOLLAR_SIGN placeholder in compose file
      composeArgsSection += `          - ${varName}=DOLLAR_SIGN{${varName}}\n`;
    });
    
    // Insert build args in compose file
    composeTemplate = composeTemplate.replace(
      /args:([^\n]*)\n/,
      `args:\n${composeArgsSection}`
    );
    
    // Add variables to docker-compose environment
    let composeEnvSection = '';
    appEnvVars.forEach(varName => {
      // Use DOLLAR_SIGN placeholder in compose file
      composeEnvSection += `        - ${varName}=DOLLAR_SIGN{${varName}}\n`;
    });
    
    // Insert environment variables in compose file
    composeTemplate = composeTemplate.replace(
      /environment:([^\n]*)\n/,
      `environment:\n${composeEnvSection}`
    );
    
    // Add variables to workflow exports
    let workflowExportSection = '';
    appEnvVars.forEach(varName => {
      // Use DOLLAR_SIGN placeholder in workflow file
      workflowExportSection += `            export ${varName}="DOLLAR_SIGN{${varName}}"\n`;
    });
    
    // Insert exports in workflow file
    workflowTemplate = workflowTemplate.replace(
      /# Export environment variables\n/,
      `# Export environment variables\n${workflowExportSection}`
    );
    
    // Add variables to workflow unset
    let workflowUnsetSection = '';
    appEnvVars.forEach(varName => {
      workflowUnsetSection += `            unset ${varName}\n`;
    });
    
    // Insert unset commands in workflow file
    workflowTemplate = workflowTemplate.replace(
      /# Clear environment variables\n/,
      `# Clear environment variables\n${workflowUnsetSection}`
    );
    
    // Add environment variables to GitHub workflow
    let workflowEnvSection = '';
    appEnvVars.forEach(varName => {
      workflowEnvSection += `          ${varName}: DOLLAR_SIGN{{ secrets.${varName} }}\n`;
    });
    
    // Insert env variables in workflow env section
    workflowTemplate = workflowTemplate.replace(
      /env:([^\n]*)\n/,
      `env:\n${workflowEnvSection}`
    );
    
    // Add environment variables to envs parameter
    const envsParamRegex = /envs:([^,\n]+)(,|\n)/;
    const match = workflowTemplate.match(envsParamRegex);
    if (match) {
      const currentEnvs = match[1];
      const envsVarList = appEnvVars.join(',');
      workflowTemplate = workflowTemplate.replace(
        envsParamRegex,
        `envs: ${currentEnvs},${envsVarList}$2`
      );
    }
  }
  
  // Update domain in compose file if provided
  if (domainName) {
    composeTemplate = composeTemplate.replace(
      /Host\(`[^`]*`\)/g,
      `Host(\`${domainName}\`)`
    );
  }
  
  // Inject environment variables
  const dockerfileContent = injectEnvVariables(dockerfileTemplate, variables);
  const composeContent = injectEnvVariables(composeTemplate, variables);
  const workflowContent = injectEnvVariables(workflowTemplate, variables);
  
  // Replace DOLLAR_SIGN placeholder with $ in final output
  const replaceVariablePlaceholder = (content: string): string => {
    return content
      .replace(/DOLLAR_SIGN/g, '$')
      .replace(/DOLLAR_SIGN{/g, '${')
      .replace(/DOLLAR_SIGN{{/g, '${{');
  };
  
  // Add to result with placeholder replacement
  templates.push({
    fileName: 'Dockerfile',
    content: replaceVariablePlaceholder(dockerfileContent),
  });
  
  templates.push({
    fileName: 'docker-compose.yml',
    content: replaceVariablePlaceholder(composeContent),
  });
  
  templates.push({
    fileName: '.github/workflows/deploy.yml',
    content: replaceVariablePlaceholder(workflowContent),
  });
  
  return templates;
}