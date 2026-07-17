"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AffiliateController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const affiliate_service_1 = require("./affiliate.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let AffiliateController = class AffiliateController {
    constructor(affiliateService) {
        this.affiliateService = affiliateService;
    }
    getStats(req) {
        return this.affiliateService.getStats(req.user.id);
    }
    getCommissions(req, page = '1', limit = '10') {
        return this.affiliateService.getCommissions(req.user.id, +page, +limit);
    }
    requestPayout(req, dto) {
        return this.affiliateService.requestPayout(req.user.id, dto.amount, { bank: dto.bank, account: dto.account });
    }
};
exports.AffiliateController = AffiliateController;
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AffiliateController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('commissions'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], AffiliateController.prototype, "getCommissions", null);
__decorate([
    (0, common_1.Post)('payout'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AffiliateController.prototype, "requestPayout", null);
exports.AffiliateController = AffiliateController = __decorate([
    (0, swagger_1.ApiTags)('Affiliate'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('affiliate'),
    __metadata("design:paramtypes", [affiliate_service_1.AffiliateService])
], AffiliateController);
//# sourceMappingURL=affiliate.controller.js.map