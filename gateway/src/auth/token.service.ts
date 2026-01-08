import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class TokenService {
    constructor (private jwtService: JwtService) {}

    generateAccessToken(userId: string, email: string) {
        return this.jwtService.sign(
            {sub: userId, email: email},
            { expiresIn: '24h'}
        );
    }
    // TODO: Add refresh token methods here when upgrading
  // async generateRefreshToken(userId: string) { }
  // async validateRefreshToken(token: string) { }
  // async revokeRefreshToken(token: string) { }
}