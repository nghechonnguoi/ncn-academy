import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            plan: import(".prisma/client").$Enums.SubscriptionPlan;
            affiliateCode: string;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: {
            id: string;
            email: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            plan: import(".prisma/client").$Enums.SubscriptionPlan;
            affiliateCode: string;
        };
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    me(req: any): {
        id: any;
        email: any;
        name: any;
        role: any;
        plan: any;
        affiliateCode: any;
    };
    googleAuth(idToken: string): Promise<void>;
    logout(req: any): Promise<void>;
}
