import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsObject,
  MaxLength,
} from 'class-validator';

export enum AiAgentTypeEnum {
  SEO_AGENT = 'SEO_AGENT',
  CONTENT_AGENT = 'CONTENT_AGENT',
  PRODUCT_AGENT = 'PRODUCT_AGENT',
  LANDING_PAGE_AGENT = 'LANDING_PAGE_AGENT',
  CUSTOMER_SUPPORT_AGENT = 'CUSTOMER_SUPPORT_AGENT',
  INVENTORY_AGENT = 'INVENTORY_AGENT',
  MARKETING_AGENT = 'MARKETING_AGENT',
  CUSTOM_AGENT = 'CUSTOM_AGENT',
}

export class AgentIntegrationDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(50)
  provider: string;

  @IsEnum(AiAgentTypeEnum)
  agentType: AiAgentTypeEnum;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  endpointUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  apiKeyEnvName?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsObject()
  configJson?: Record<string, unknown>;
}
