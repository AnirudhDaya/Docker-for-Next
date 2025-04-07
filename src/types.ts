// Project type options
export enum ProjectType {
  PLAIN = 'plain',
  ENV = 'env',
  PRISMA = 'prisma'
}

// Config options for the deployment setup
export interface DeployConfig {
  projectType: ProjectType;
  repoName: string;
  githubPAT: string;
  envFilePath: string;
  domainName?: string;
  setupProdBranch: boolean;
  prodDomainName?: string; 
  prodPort?: number;
}

// Template file type
export interface TemplateFile {
  fileName: string;
  content: string;
}

// Environment variables structure
export interface EnvVariables {
  [key: string]: string;
}

// GitHub Secrets API response
export interface GitHubSecretsResponse {
  success: boolean;
  variables?: string[];
}