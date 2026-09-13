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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitAssessmentDto = exports.StudentProfileDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class AnswerItem {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnswerItem.prototype, "questionId", void 0);
class StudentProfileDto {
}
exports.StudentProfileDto = StudentProfileDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], StudentProfileDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], StudentProfileDto.prototype, "birthDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], StudentProfileDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], StudentProfileDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StudentProfileDto.prototype, "favoriteSubjects", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StudentProfileDto.prototype, "pastActivities", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StudentProfileDto.prototype, "familyOrientation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StudentProfileDto.prototype, "specialTalents", void 0);
class SubmitAssessmentDto {
}
exports.SubmitAssessmentDto = SubmitAssessmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Thông tin học sinh' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => StudentProfileDto),
    __metadata("design:type", StudentProfileDto)
], SubmitAssessmentDto.prototype, "profile", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Mảng câu trả lời (số hoặc chuỗi)' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AnswerItem),
    __metadata("design:type", Array)
], SubmitAssessmentDto.prototype, "answers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Lộ trình học: university | vocational', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['university', 'vocational']),
    __metadata("design:type", String)
], SubmitAssessmentDto.prototype, "track", void 0);
//# sourceMappingURL=submit-assessment.dto.js.map