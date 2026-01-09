import { Controller , Get , UseGuards } from "@nestjs/common";
import { CreditsService } from "./credits.service";
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags('Credits')
@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

    @Get()
    @ApiOperation({ summary: 'Get user credits and subscription info' })
    @ApiCookieAuth()
    @ApiResponse({ status: 200, description: 'User credits retrieved successfully.' })
    async getCredits(@CurrentUser('userId') userId: string) {
    return this.creditsService.getUserCredits(userId);
   }

@Get('history')
  @ApiOperation({ summary: 'Get credit transaction history' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, description: 'History retrieved successfully' })
  async getHistory(@CurrentUser('userId') userId: string) {
    return this.creditsService.getCreditHistory(userId);
  }

}
