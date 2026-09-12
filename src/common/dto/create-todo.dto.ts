import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateTodoDto {
  @IsString({ message: 'Title must be a text string' })
  @IsNotEmpty({ message: 'Title is required and cannot be empty' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(100, { message: 'Title cannot exceed 100 characters' })
  title: string;
}
