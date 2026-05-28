import { IsString, IsObject, MaxLength } from 'class-validator';

export class AgentTaskDto {
  @IsString()
  @MaxLength(100)
  taskType: string;

  @IsObject()
  inputJson: Record<string, unknown>;
}
