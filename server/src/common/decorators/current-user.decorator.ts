import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUser {
  userId: string;
  role: string;
}

interface RequestWithUser extends Request {
  user: JwtUser;
}

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): JwtUser | string => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    
    // If a property name is provided, return that property
    if (data && typeof data === 'string') {
      return user[data as keyof JwtUser] as string;
    }
    
    // Otherwise return the entire user object
    return user;
  },
);
