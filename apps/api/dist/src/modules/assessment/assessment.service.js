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
exports.AssessmentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const vocational_careers_data_1 = require("./vocational-careers.data");
const university_careers_data_1 = require("./university-careers.data");
const LETTER_NUM = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
    J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
    S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const isYVowel = (word, index) => {
    const prev = index > 0 ? word[index - 1] : null;
    const next = index < word.length - 1 ? word[index + 1] : null;
    const prevIsVowel = prev !== null && VOWELS.has(prev);
    const nextIsVowel = next !== null && VOWELS.has(next);
    if (prevIsVowel && nextIsVowel)
        return false;
    return true;
};
const VIET_MAP = {
    À: 'A', Á: 'A', Â: 'A', Ã: 'A', Ä: 'A', Å: 'A', Ă: 'A', Ắ: 'A', Ặ: 'A', Ằ: 'A', Ẳ: 'A', Ẵ: 'A', Ấ: 'A', Ầ: 'A', Ẩ: 'A', Ẫ: 'A', Ậ: 'A',
    È: 'E', É: 'E', Ê: 'E', Ế: 'E', Ề: 'E', Ể: 'E', Ễ: 'E', Ệ: 'E', Ë: 'E',
    Ì: 'I', Í: 'I', Ỉ: 'I', Ĩ: 'I', Ị: 'I', Ï: 'I',
    Ò: 'O', Ó: 'O', Ô: 'O', Ố: 'O', Ồ: 'O', Ổ: 'O', Ỗ: 'O', Ộ: 'O', Ơ: 'O', Ớ: 'O', Ờ: 'O', Ở: 'O', Ỡ: 'O', Ợ: 'O', Õ: 'O', Ö: 'O',
    Ù: 'U', Ú: 'U', Ư: 'U', Ứ: 'U', Ừ: 'U', Ử: 'U', Ữ: 'U', Ự: 'U', Û: 'U', Ü: 'U', Ũ: 'U', Ụ: 'U',
    Ỳ: 'Y', Ý: 'Y', Ỷ: 'Y', Ỹ: 'Y', Ỵ: 'Y',
    Đ: 'D',
};
let AssessmentService = class AssessmentService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async submit(userId, dto) {
        const answerMap = {};
        for (const { questionId, answer } of dto.answers) {
            answerMap[questionId] = answer;
        }
        const hScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
        const hCounts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
        const RIASEC_PREFIX = /^Q_([RIASEC])/;
        for (const [qId, val] of Object.entries(answerMap)) {
            const m = qId.match(RIASEC_PREFIX);
            if (m && !qId.includes('MBTI') && !qId.includes('IKIGAI') && !qId.includes('CONSTRAINT')) {
                const cat = m[1];
                hScores[cat] += Number(val) || 0;
                hCounts[cat]++;
            }
        }
        const hPct = {};
        for (const cat of Object.keys(hScores)) {
            const cnt = hCounts[cat] || 1;
            hPct[cat] = Math.round((hScores[cat] / (cnt * 5)) * 100);
        }
        const sortedH = Object.entries(hPct).sort((a, b) => b[1] - a[1]);
        const top3 = sortedH.slice(0, 3).map(([k]) => k).join('');
        const riasecResult = { ...hPct, top3, topCode: sortedH[0][0] };
        const MBTI_MAP = {
            Q_M1: { A: 'E', B: 'I' }, Q_M2: { A: 'E', B: 'I' }, Q_M3: { A: 'E', B: 'I' },
            Q_M4: { A: 'S', B: 'N' }, Q_M5: { A: 'S', B: 'N' }, Q_M6: { A: 'S', B: 'N' },
            Q_M7: { A: 'T', B: 'F' }, Q_M8: { A: 'T', B: 'F' }, Q_M9: { A: 'T', B: 'F' },
            Q_M10: { A: 'J', B: 'P' }, Q_M11: { A: 'J', B: 'P' }, Q_M12: { A: 'J', B: 'P' },
        };
        const mbtiDim = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
        for (const [qId, val] of Object.entries(answerMap)) {
            const m = MBTI_MAP[qId];
            if (m) {
                const letter = m[val];
                if (letter)
                    mbtiDim[letter]++;
            }
        }
        const mbtiCode = [
            mbtiDim.E >= mbtiDim.I ? 'E' : 'I',
            mbtiDim.S >= mbtiDim.N ? 'S' : 'N',
            mbtiDim.T >= mbtiDim.F ? 'T' : 'F',
            mbtiDim.J >= mbtiDim.P ? 'J' : 'P',
        ].join('');
        const ikigaiTalent = {
            SPEECH: Number(answerMap['Q_IKIGAI_TALENT_1']) || 3,
            STRATEGY: Number(answerMap['Q_IKIGAI_TALENT_2']) || 3,
            CRAFT: Number(answerMap['Q_IKIGAI_TALENT_3']) || 3,
        };
        const ikigaiValue = answerMap['Q_IKIGAI_VALUE'] || null;
        const ikigaiEnv = answerMap['Q_IKIGAI_ENV'] || null;
        const ikigaiStrength = answerMap['Q_IKIGAI_STRENGTH'] || null;
        const ikigaiAvoid = answerMap['Q_IKIGAI_AVOID'] || null;
        const dreamText = (answerMap['Q_IKIGAI_DREAM'] || '').toLowerCase().trim();
        const clinicalAnswer = answerMap['Q_CONSTRAINT_CLINICAL'] || 'CLINICAL_NA';
        const artsAnswer = answerMap['Q_CONSTRAINT_ARTS'] || 'ARTS_NA';
        const eduAnswer = answerMap['Q_CONSTRAINT_EDU'] || 'EDU_NA';
        const bizAnswer = answerMap['Q_CONSTRAINT_BIZ'] || null;
        const lawAnswer = answerMap['Q_CONSTRAINT_LAW'] || 'LAW_NA';
        const numerology = dto.profile
            ? this.calcNumerology(dto.profile)
            : { LP: 5, soul: 5, mission: 5, talent: 5, passionNums: [5] };
        const engineInput = {
            hPct, mbtiCode, ikigaiTalent,
            ikigaiValue, ikigaiEnv, ikigaiStrength, ikigaiAvoid,
            dreamText,
            clinicalAnswer, artsAnswer, eduAnswer, bizAnswer, lawAnswer,
            numerology,
        };
        const careerResult = this.matchCareers(engineInput, top3);
        const vocationalCareerResult = dto.track === 'vocational'
            ? this.matchVocationalCareers(engineInput, top3)
            : null;
        const assessment = await this.prisma.assessment.create({
            data: {
                userId,
                answers: dto.answers,
                riasecResult: { ...riasecResult, mbtiCode },
                careerResult: {
                    track: dto.track ?? 'university',
                    university: careerResult,
                    vocational: vocationalCareerResult,
                    profile: dto.profile ?? null,
                },
            },
        });
        return {
            assessment,
            riasecResult: { ...riasecResult, mbtiCode },
            careerResult,
            vocationalCareerResult,
            track: dto.track ?? 'university',
        };
    }
    async getUserAssessments(userId) {
        const resetDate = new Date('2026-07-05T00:00:00.000Z');
        return this.prisma.assessment.findMany({
            where: { userId, createdAt: { gte: resetDate } },
            orderBy: { createdAt: 'desc' },
            select: { id: true, riasecResult: true, careerResult: true, createdAt: true },
        });
    }
    async getAssessmentById(id, userId) {
        const resetDate = new Date('2026-07-05T00:00:00.000Z');
        return this.prisma.assessment.findFirst({
            where: { id, userId, createdAt: { gte: resetDate } },
        });
    }
    calcNumerology(profile) {
        const reduceNum = (n, keepMaster = false) => {
            while (n > 9) {
                if (keepMaster && (n === 11 || n === 22 || n === 33))
                    return n;
                n = String(n).split('').reduce((a, d) => a + parseInt(d), 0);
            }
            return n;
        };
        const toLatinUpper = (s) => {
            let r = s.toUpperCase();
            for (const [from, to] of Object.entries(VIET_MAP))
                r = r.split(from).join(to);
            return r.replace(/[^A-Z\s]/g, '');
        };
        const digits = (profile.birthDate ?? '').replace(/\D/g, '').split('').map(Number);
        const dayDigits = ((profile.birthDate ?? '').split('/')[0] || '').replace(/\D/g, '').split('').map(Number);
        const LP = reduceNum(digits.reduce((a, b) => a + b, 0), true);
        const talent = reduceNum(dayDigits.reduce((a, b) => a + b, 0));
        const latin = toLatinUpper(profile.fullName ?? '');
        let soulRaw = 0, missionRaw = 0;
        const freq = {};
        for (const word of latin.split(' ')) {
            for (let i = 0; i < word.length; i++) {
                const ch = word[i];
                const v = LETTER_NUM[ch];
                if (!v)
                    continue;
                missionRaw += v;
                freq[v] = (freq[v] || 0) + 1;
                if (ch === 'Y') {
                    if (isYVowel(word, i))
                        soulRaw += v;
                }
                else if (VOWELS.has(ch)) {
                    soulRaw += v;
                }
            }
        }
        const soul = reduceNum(soulRaw, true);
        const mission = reduceNum(missionRaw, true);
        const maxFreq = Object.keys(freq).length ? Math.max(...Object.values(freq)) : 0;
        const passionNums = maxFreq > 0
            ? Object.keys(freq).filter(k => freq[+k] === maxFreq).map(Number).sort((a, b) => a - b)
            : [5];
        return { LP, soul, mission, talent, passionNums };
    }
    threeRoundMatch(pool, input, topN, getMarket) {
        const { hPct, mbtiCode, ikigaiTalent, ikigaiValue, ikigaiEnv, ikigaiStrength, ikigaiAvoid, dreamText, clinicalAnswer, artsAnswer, eduAnswer, bizAnswer, lawAnswer } = input;
        const RIASEC_ORDER = ['R', 'I', 'A', 'S', 'E', 'C'];
        const hexDist = (a, b) => {
            const ia = RIASEC_ORDER.indexOf(a);
            const ib = RIASEC_ORDER.indexOf(b);
            if (ia < 0 || ib < 0)
                return 0;
            const diff = Math.abs(ia - ib);
            return Math.min(diff, 6 - diff);
        };
        const riasecScore = (riasec) => {
            let raw = 0;
            for (let i = 0; i < riasec.length; i++)
                raw += (hPct[riasec[i]] ?? 0) * ((3 - i) / 3);
            return Math.min(100, +(raw / 1.5).toFixed(4));
        };
        const guard = (arr, max, limit) => {
            const cnt = {};
            return arr.filter(({ career }) => {
                const ind = career.industry || 'other';
                cnt[ind] = (cnt[ind] || 0) + 1;
                return cnt[ind] <= max;
            }).slice(0, limit);
        };
        const sortedH = Object.entries(hPct).sort((a, b) => b[1] - a[1]);
        const userTop1 = sortedH[0]?.[0] ?? 'R';
        const userTop2 = sortedH[1]?.[0] ?? 'I';
        const VALUE_BOOST = {
            MONEY: { E: 8 }, IMPACT: { S: 8 }, FREEDOM: { A: 6, I: 4 }, MASTERY: { I: 6, C: 4 }, RECOGNITION: { E: 6, S: 4 },
        };
        const ENV_BOOST = {
            TEAM: { S: 6, E: 4 }, SOLO: { I: 6, C: 4 }, FIELD: { R: 6, E: 4 }, REMOTE: { I: 4, A: 4 }, MIXED: {},
        };
        const STRENGTH_BOOST = {
            COMMUNICATE: { E: 8, S: 4 }, ANALYZE: { I: 8, C: 4 }, CREATE: { A: 8, I: 4 }, ORGANIZE: { C: 8, R: 2 }, EMPATHIZE: { S: 8, A: 4 },
        };
        const AVOID_PENALTY = {
            AVOID_ROUTINE: { C: -10, R: -6 }, AVOID_PEOPLE: { S: -10, E: -6 },
            AVOID_PRESSURE: { E: -8 }, AVOID_ABSTRACT: { I: -8, A: -4 }, AVOID_RULES: { C: -10 },
        };
        const BIZ_KW = ['doanh nhân', 'kinh doanh', 'giám đốc', 'chủ tịch', 'startup', 'ceo', 'khởi nghiệp', 'founder'];
        const INSP_KW = ['truyền cảm hứng', 'huấn luyện', 'đào tạo', 'diễn giả', 'tư vấn', 'giáo viên', 'khai vấn', 'coach', 'speaker'];
        const CARE_KW = ['bác sĩ', 'y tế', 'sức khỏe', 'chăm sóc', 'tâm lý', 'trị liệu'];
        const TECH_KW = ['lập trình', 'công nghệ', 'kỹ sư', 'developer', 'data', 'ai', 'robot', 'phần mềm'];
        const hasBiz = BIZ_KW.some(k => dreamText.includes(k));
        const hasInsp = INSP_KW.some(k => dreamText.includes(k));
        const hasCare = CARE_KW.some(k => dreamText.includes(k));
        const hasTech = TECH_KW.some(k => dreamText.includes(k));
        const RE_CRAFT = /kỹ thuật|cơ khí|xây dựng|thủ công|lắp đặt|vận hành|chế tạo|thợ|spa|ẩm thực|bếp|nail|make.?up|barista|cắt tóc|massage|sửa chữa|điện lạnh/i;
        const RE_SPEECH = /tư vấn|hướng dẫn|mc |giảng dạy|đào tạo viên|huấn luyện|coach|khai vấn|diễn giả|speaker|giảng viên|giáo viên/i;
        const RE_STRATEGY = /quản trị|chiến lược|phân tích|kế hoạch|tâm lý|nghiên cứu|marketing|thương hiệu|consultant|advisor|strategy/i;
        const RE_CLINICAL_DIR = /bác sĩ|điều dưỡng|y tá|phẫu thuật|cấp cứu|hộ sinh/i;
        const RE_ARTS_PERF = /diễn viên|ca sĩ|vũ công|nhạc sĩ|biên đạo|biểu diễn nghệ thuật|sân khấu/i;
        const RE_EDU = /giáo viên|giảng viên|nhà đào tạo|huấn luyện viên|sư phạm|đào tạo viên|life coach|khai vấn|hướng nghiệp|trainer/i;
        const RE_BIZ = /khởi nghiệp|doanh nhân|startup|founder|giám đốc điều hành|ceo|tự kinh doanh/i;
        const RE_LAW = /luật sư|pháp chế|công tố viên|thẩm phán|kiểm sát/i;
        const r1 = guard(pool.map(career => ({ career, S_identity: riasecScore(career.riasec) }))
            .sort((a, b) => b.S_identity - a.S_identity), 3, 30);
        const r2 = guard(r1.map(({ career, S_identity }) => {
            const nameLC = career.name.toLowerCase();
            let hollandScore = riasecScore(career.riasec);
            const d1 = hexDist(userTop1, career.riasec[0]);
            const d2 = hexDist(userTop2, career.riasec[0]);
            if (d1 === 3 || d2 === 3)
                hollandScore *= 0.20;
            else if (d1 === 2 && d2 >= 2)
                hollandScore *= 0.70;
            const careerMbtiHint = this.riasecToMbtiHint(career.riasec[0]);
            let mbtiBase = 40;
            for (const letter of mbtiCode) {
                if (careerMbtiHint.includes(letter))
                    mbtiBase += 10;
            }
            const mbtiScore = Math.max(0, Math.min(100, mbtiBase));
            let S_niche = hollandScore * 0.25 + mbtiScore * 0.65;
            if (ikigaiValue && VALUE_BOOST[ikigaiValue]) {
                let bonus = 0;
                for (const [cat, pts] of Object.entries(VALUE_BOOST[ikigaiValue])) {
                    const careH = career.riasec.includes(cat) ? 7 : 0;
                    if (careH >= 6)
                        bonus += pts;
                    else if (careH >= 4)
                        bonus += Math.round(pts * 0.5);
                }
                S_niche = Math.min(100, S_niche + Math.min(12, bonus));
            }
            if (ikigaiEnv && ENV_BOOST[ikigaiEnv]) {
                let bonus = 0;
                for (const [cat, pts] of Object.entries(ENV_BOOST[ikigaiEnv])) {
                    if (career.riasec[0] === cat)
                        bonus += pts;
                }
                S_niche = Math.min(100, S_niche + Math.min(10, bonus));
            }
            if (ikigaiStrength && STRENGTH_BOOST[ikigaiStrength]) {
                let bonus = 0;
                for (const [cat, pts] of Object.entries(STRENGTH_BOOST[ikigaiStrength])) {
                    if (career.riasec.includes(cat))
                        bonus += pts;
                }
                S_niche = Math.min(100, S_niche + Math.min(12, bonus));
            }
            if (ikigaiAvoid && AVOID_PENALTY[ikigaiAvoid]) {
                let pen = 0;
                for (const [cat, pts] of Object.entries(AVOID_PENALTY[ikigaiAvoid])) {
                    if (career.riasec[0] === cat)
                        pen += pts;
                }
                S_niche = Math.max(0, S_niche + Math.max(-15, pen));
            }
            if (RE_CRAFT.test(nameLC)) {
                if (ikigaiTalent.CRAFT >= 4)
                    S_niche = Math.min(100, S_niche + 15);
                else if (ikigaiTalent.CRAFT <= 2)
                    S_niche *= 0.30;
            }
            if (RE_SPEECH.test(nameLC) || RE_STRATEGY.test(nameLC)) {
                if (ikigaiTalent.SPEECH >= 4 || ikigaiTalent.STRATEGY >= 4)
                    S_niche = Math.min(100, S_niche + 12);
                if (ikigaiTalent.SPEECH >= 4 && ikigaiTalent.STRATEGY >= 4)
                    S_niche = Math.min(100, S_niche + 5);
            }
            if (dreamText.length > 0) {
                let dreamBonus = 0;
                if (hasBiz && hasInsp && career.riasec.includes('S') && career.riasec.includes('E'))
                    dreamBonus = 20;
                else if (hasBiz && career.riasec[0] === 'E')
                    dreamBonus = 15;
                else if (hasInsp && career.riasec.includes('S'))
                    dreamBonus = 15;
                else if (hasCare && /y tế|y khoa|dược|chăm sóc|tâm lý/i.test(nameLC))
                    dreamBonus = 15;
                else if (hasTech && (career.riasec[0] === 'I' || career.riasec[0] === 'R'))
                    dreamBonus = 15;
                S_niche = Math.min(100, S_niche + dreamBonus);
            }
            S_niche = Math.max(0, +S_niche.toFixed(4));
            return { career, S_identity, S_niche };
        }).sort((a, b) => b.S_niche - a.S_niche), 2, 15);
        const r3 = r2.map(({ career, S_identity, S_niche }) => {
            const nameLC = career.name.toLowerCase();
            const S_market = getMarket(career);
            let pct = Math.min(99, Math.round(S_identity * 0.60 + S_niche * 0.25 + S_market * 0.15));
            if (RE_CLINICAL_DIR.test(nameLC) && clinicalAnswer === 'CLINICAL_AVOID')
                pct = Math.round(pct * 0.20);
            if (RE_ARTS_PERF.test(nameLC) && artsAnswer === 'ARTS_AVOID')
                pct = Math.round(pct * 0.30);
            if (RE_EDU.test(nameLC) && eduAnswer === 'EDU_AVOID')
                pct = Math.round(pct * 0.50);
            if (RE_BIZ.test(nameLC) && bizAnswer === 'BIZ_AVOID')
                pct = Math.round(pct * 0.40);
            if (RE_LAW.test(nameLC) && lawAnswer === 'LAW_AVOID')
                pct = Math.round(pct * 0.30);
            return { career, pct };
        }).sort((a, b) => b.pct - a.pct);
        const final = guard(r3, 2, topN);
        return final.map((item, i) => ({ rank: i + 1, ...item.career, pct: item.pct }));
    }
    riasecToMbtiHint(r) {
        const map = {
            R: 'ISTP', I: 'INTP', A: 'INFP', S: 'ESFJ', E: 'ENTJ', C: 'ISTJ',
        };
        return map[r] ?? 'INTJ';
    }
    buildEngineInput(params) { return params; }
    matchCareers(input, top3) {
        return this.threeRoundMatch(university_careers_data_1.UNIVERSITY_CAREERS, input, 5, () => 65);
    }
    matchVocationalCareers(input, top3) {
        const deriveMarket = (career) => {
            const nums = (career.salary ?? '').match(/\d+/g)?.map(Number) ?? [];
            if (!nums.length)
                return 50;
            const upper = Math.max(...nums);
            return Math.min(100, Math.round(10 + ((upper - 5) / 35) * 90));
        };
        return this.threeRoundMatch(vocational_careers_data_1.VOCATIONAL_CAREERS, input, 10, deriveMarket);
    }
};
exports.AssessmentService = AssessmentService;
exports.AssessmentService = AssessmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AssessmentService);
//# sourceMappingURL=assessment.service.js.map