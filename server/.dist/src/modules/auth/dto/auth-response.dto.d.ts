export declare class AuthResponseDto {
    userId: string;
    email: string;
    fullName: string;
    role: string;
    planType: string;
}
export declare class UserResponseDto {
    id: string;
    email: string;
    fullName: string;
    role: string;
    planType: string;
    avatar?: string;
    provider: string;
    createdAt: Date;
    updatedAt: Date;
}
