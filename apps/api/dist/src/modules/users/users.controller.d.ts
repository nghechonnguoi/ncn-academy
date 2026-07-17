import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    getMe(req: any): Promise<any>;
    updateMe(req: any, dto: {
        name?: string;
        phone?: string;
    }): Promise<any>;
    findOne(id: string): Promise<any>;
    remove(id: string): Promise<any>;
}
