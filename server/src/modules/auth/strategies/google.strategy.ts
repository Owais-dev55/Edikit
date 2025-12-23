import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

interface GoogleProfile {
  id: string;
  displayName?: string;
  name: {
    givenName?: string;
    familyName?: string;
  };
  emails: Array<{ value: string }>;
  photos?: Array<{ value: string }>;
  _json?: {
    name?: string;
    given_name?: string;
    family_name?: string;
  };
}

interface GoogleUser {
  googleId: string;
  email: string;
  fullName: string;
  avatar: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('Google OAuth credentials are not properly configured');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback<GoogleUser>,
  ): void {
    const { id, name, emails } = profile;
    const fullName = profile.displayName || name.givenName;

    const user: GoogleUser = {
      googleId: id,
      email: emails[0]?.value || '',
      fullName: fullName || 'Not Found',
      avatar: profile.photos?.[0]?.value || '',
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    done(null, user);
  }
}
