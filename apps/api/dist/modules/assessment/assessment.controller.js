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
exports.AssessmentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const assessment_service_1 = require("./assessment.service");
const submit_assessment_dto_1 = require("./dto/submit-assessment.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let AssessmentController = class AssessmentController {
    constructor(assessmentService) {
        this.assessmentService = assessmentService;
    }
    submit(req, dto) {
        return this.assessmentService.submit(req.user.id, dto);
    }
    findAll(req) {
        return this.assessmentService.getUserAssessments(req.user.id);
    }
    findOne(id, req) {
        return this.assessmentService.getAssessmentById(id, req.user.id);
    }
};
exports.AssessmentController = AssessmentController;
__decorate([
    (0, common_1.Post)('submit'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, submit_assessment_dto_1.SubmitAssessmentDto]),
    __metadata("design:returntype", void 0)
], AssessmentController.prototype, "submit", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AssessmentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AssessmentController.prototype, "findOne", null);
exports.AssessmentController = AssessmentController = __decorate([
    (0, swagger_1.ApiTags)('Assessment'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('assessment'),
    __metadata("design:paramtypes", [assessment_service_1.AssessmentService])
], AssessmentController);
//# sourceMappingURL=assessment.controller.js.map