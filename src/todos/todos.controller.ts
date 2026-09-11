import { Controller, Get, Post } from '@nestjs/common';

@Controller('todos')
export class TodosController {
    @Post()
    getTodos() {
        return 'List of todos';
    }

}
