import { PrismaService } from '../../common/prisma/prisma.service';
export declare class UserService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<any>;
    findOne(id: string): Promise<any>;
    findUserByEmail(email: string): Promise<any>;
    findUserByGoogleId(googleId: string): Promise<any>;
    findUserByAppleId(appleId: string): Promise<any>;
    update(id: string, data: {
        password?: string;
        [key: string]: unknown;
    }): Promise<any>;
    delete(id: string): Promise<any>;
}
