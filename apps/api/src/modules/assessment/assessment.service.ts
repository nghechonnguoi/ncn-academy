import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubmitAssessmentDto, StudentProfileDto } from './dto/submit-assessment.dto';
import { VOCATIONAL_CAREERS } from './vocational-careers.data';
import { UNIVERSITY_CAREERS } from './university-careers.data';

type RiasecKey = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
type MbtiLetter = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

// ── Bảng map chữ cái → số Pythagorean ──────────────────────────────────────
const LETTER_NUM: Record<string, number> = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,
  J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,
  S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8,
};
const VOWELS = new Set(['A','E','I','O','U']);

// Bảng map chuyển chữ có dấu → chữ Latin
const VIET_MAP: Record<string, string> = {
  À:'A',Á:'A',Â:'A',Ã:'A',Ä:'A',Å:'A',Ă:'A',Ắ:'A',Ặ:'A',Ằ:'A',Ẳ:'A',Ẵ:'A',Ấ:'A',Ầ:'A',Ẩ:'A',Ẫ:'A',Ậ:'A',
  È:'E',É:'E',Ê:'E',Ế:'E',Ề:'E',Ể:'E',Ễ:'E',Ệ:'E',Ë:'E',
  Ì:'I',Í:'I',Ỉ:'I',Ĩ:'I',Ị:'I',Ï:'I',
  Ò:'O',Ó:'O',Ô:'O',Ố:'O',Ồ:'O',Ổ:'O',Ỗ:'O',Ộ:'O',Ơ:'O',Ớ:'O',Ờ:'O',Ở:'O',Ỡ:'O',Ợ:'O',Õ:'O',Ö:'O',
  Ù:'U',Ú:'U',Ư:'U',Ứ:'U',Ừ:'U',Ử:'U',Ữ:'U',Ự:'U',Û:'U',Ü:'U',Ũ:'U',Ụ:'U',
  Ỳ:'Y',Ý:'Y',Ỷ:'Y',Ỹ:'Y',Ỵ:'Y',
  Đ:'D',
};

@Injectable()
export class AssessmentService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(userId: string, dto: SubmitAssessmentDto) {
    const answerMap: Record<string, number | string> = {};
    for (const { questionId, answer } of dto.answers) {
      answerMap[questionId] = answer;
    }

    // ══ PHÂN HỆ A — HOLLAND (RIASEC) ════════════════════════════════════════
    const hScores: Record<RiasecKey, number> = { R:0, I:0, A:0, S:0, E:0, C:0 };
    const hCounts: Record<RiasecKey, number> = { R:0, I:0, A:0, S:0, E:0, C:0 };
    const RIASEC_PREFIX = /^Q_([RIASEC])/;

    for (const [qId, val] of Object.entries(answerMap)) {
      const m = qId.match(RIASEC_PREFIX);
      if (m && !qId.includes('MBTI') && !qId.includes('IKIGAI') && !qId.includes('CONSTRAINT')) {
        const cat = m[1] as RiasecKey;
        hScores[cat] += Number(val) || 0;
        hCounts[cat]++;
      }
    }

    // % Holland (0–100)
    const hPct = {} as Record<RiasecKey, number>;
    for (const cat of Object.keys(hScores) as RiasecKey[]) {
      const cnt = hCounts[cat] || 1;
      hPct[cat] = Math.round((hScores[cat] / (cnt * 5)) * 100);
    }
    const sortedH = (Object.entries(hPct) as [RiasecKey, number][]).sort((a,b)=>b[1]-a[1]);
    const top3 = sortedH.slice(0,3).map(([k])=>k).join('');
    const riasecResult = { ...hPct, top3, topCode: sortedH[0][0] };

    // ══ PHÂN HỆ B — MBTI ════════════════════════════════════════════════════
    const MBTI_MAP: Record<string, {A: MbtiLetter, B: MbtiLetter}> = {
      Q_M1:{A:'E',B:'I'}, Q_M2:{A:'E',B:'I'}, Q_M3:{A:'E',B:'I'},
      Q_M4:{A:'S',B:'N'}, Q_M5:{A:'S',B:'N'}, Q_M6:{A:'S',B:'N'},
      Q_M7:{A:'T',B:'F'}, Q_M8:{A:'T',B:'F'}, Q_M9:{A:'T',B:'F'},
      Q_M10:{A:'J',B:'P'}, Q_M11:{A:'J',B:'P'}, Q_M12:{A:'J',B:'P'},
    };
    const mbtiDim: Record<MbtiLetter, number> = {E:0,I:0,S:0,N:0,T:0,F:0,J:0,P:0};
    for (const [qId, val] of Object.entries(answerMap)) {
      const m = MBTI_MAP[qId];
      if (m) {
        const letter = m[val as 'A'|'B'];
        if (letter) mbtiDim[letter]++;
      }
    }
    const mbtiCode = [
      mbtiDim.E >= mbtiDim.I ? 'E' : 'I',
      mbtiDim.S >= mbtiDim.N ? 'S' : 'N',
      mbtiDim.T >= mbtiDim.F ? 'T' : 'F',
      mbtiDim.J >= mbtiDim.P ? 'J' : 'P',
    ].join('');

    // ══ PHÂN HỆ C — IKIGAI ══════════════════════════════════════════════════
    const ikigaiTalent = {
      SPEECH:   Number(answerMap['Q_IKIGAI_TALENT_1']) || 3,
      STRATEGY: Number(answerMap['Q_IKIGAI_TALENT_2']) || 3,
      CRAFT:    Number(answerMap['Q_IKIGAI_TALENT_3']) || 3,
    };
    const ikigaiValue    = (answerMap['Q_IKIGAI_VALUE']    as string) || null;
    const ikigaiEnv      = (answerMap['Q_IKIGAI_ENV']      as string) || null;
    const ikigaiStrength = (answerMap['Q_IKIGAI_STRENGTH'] as string) || null;
    const ikigaiAvoid    = (answerMap['Q_IKIGAI_AVOID']    as string) || null;
    const dreamText      = ((answerMap['Q_IKIGAI_DREAM']   as string) || '').toLowerCase().trim();

    // Constraint flags
    const clinicalAnswer = (answerMap['Q_CONSTRAINT_CLINICAL'] as string) || 'CLINICAL_NA';
    const artsAnswer     = (answerMap['Q_CONSTRAINT_ARTS']     as string) || 'ARTS_NA';
    const eduAnswer      = (answerMap['Q_CONSTRAINT_EDU']      as string) || 'EDU_NA';
    const bizAnswer      = (answerMap['Q_CONSTRAINT_BIZ']      as string) || null;
    const lawAnswer      = (answerMap['Q_CONSTRAINT_LAW']      as string) || 'LAW_NA';

    // ══ PHÂN HỆ D — NHÂN SỐ HỌC ════════════════════════════════════════════
    const numerology = dto.profile
      ? this.calcNumerology(dto.profile)
      : { LP:5, soul:5, mission:5, talent:5, passionNums:[5] };

    // ══ TỔNG HỢP & LƯU ══════════════════════════════════════════════════════
    const engineInput = {
      hPct, mbtiCode, ikigaiTalent,
      ikigaiValue, ikigaiEnv, ikigaiStrength, ikigaiAvoid,
      dreamText,
      clinicalAnswer, artsAnswer, eduAnswer, bizAnswer, lawAnswer,
      numerology,
    };

    const careerResult         = this.matchCareers(engineInput, top3);
    const vocationalCareerResult =
      dto.track === 'vocational'
        ? this.matchVocationalCareers(engineInput, top3)
        : null;

    const assessment = await this.prisma.assessment.create({
      data: {
        userId,
        answers: dto.answers as any,
        riasecResult: { ...riasecResult, mbtiCode } as any,
        careerResult: {
          track: dto.track ?? 'university',
          university: careerResult,
          vocational: vocationalCareerResult,
          profile: dto.profile ?? null,
        } as any,
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

  async getUserAssessments(userId: string) {
    const resetDate = new Date('2026-07-05T00:00:00.000Z');
    return this.prisma.assessment.findMany({
      where: { userId, createdAt: { gte: resetDate } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, riasecResult: true, careerResult: true, createdAt: true },
    });
  }

  async getAssessmentById(id: string, userId: string) {
    const resetDate = new Date('2026-07-05T00:00:00.000Z');
    return this.prisma.assessment.findFirst({
      where: { id, userId, createdAt: { gte: resetDate } },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  NHÂN SỐ HỌC — tính 5 chỉ số từ họ tên + ngày sinh
  // ══════════════════════════════════════════════════════════════════════════
  private calcNumerology(profile: StudentProfileDto) {
    const reduceNum = (n: number, keepMaster = false): number => {
      while (n > 9) {
        if (keepMaster && (n===11||n===22||n===33)) return n;
        n = String(n).split('').reduce((a,d)=>a+parseInt(d),0);
      }
      return n;
    };

    const toLatinUpper = (s: string) => {
      let r = s.toUpperCase();
      for (const [from, to] of Object.entries(VIET_MAP)) r = r.split(from).join(to);
      return r.replace(/[^A-Z\s]/g,'');
    };

    // Ngày sinh → LP (Life Path), Talent
    const digits = (profile.birthDate ?? '').replace(/\D/g,'').split('').map(Number);
    const dayDigits = ((profile.birthDate ?? '').split('/')[0]||'').replace(/\D/g,'').split('').map(Number);
    const LP      = reduceNum(digits.reduce((a,b)=>a+b,0), true);
    const talent  = reduceNum(dayDigits.reduce((a,b)=>a+b,0));

    // Họ tên → Mission, Soul, Passion
    const latin = toLatinUpper(profile.fullName ?? '');
    let soulRaw=0, missionRaw=0;
    const freq: Record<number,number> = {};
    for (const ch of latin.replace(/\s/g,'')) {
      const v = LETTER_NUM[ch];
      if (!v) continue;
      missionRaw += v;
      freq[v] = (freq[v]||0) + 1;
      if (VOWELS.has(ch)) soulRaw += v;
    }
    const soul    = reduceNum(soulRaw, true);
    const mission = reduceNum(missionRaw, true);
    const maxFreq = Object.keys(freq).length ? Math.max(...Object.values(freq)) : 0;
    const passionNums = maxFreq > 0
      ? Object.keys(freq).filter(k=>freq[+k]===maxFreq).map(Number).sort((a,b)=>a-b)
      : [5];

    return { LP, soul, mission, talent, passionNums };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  CÔNG THỨC 3 VÒNG — Engine dùng chung cho CẢ HAI track
  //
  //  ICI = S_identity × 0.60 + S_niche × 0.25 + S_market × 0.15
  //
  //  VÒNG 1 — S_identity: RIASEC weighted dot-product (proxy cho Nhân số)
  //    weight[0]=1.0 | weight[1]=0.67 | weight[2]=0.33
  //    normalize /1.5; cap 100
  //    Diversity Guard: ≤3/industry → top 30
  //
  //  VÒNG 2 — S_niche: Holland 25% + MBTI 65% + Ikigai bonuses
  //    Hexagon Penalty: dist=3→×0.20 | dist=2,2→×0.70
  //    MBTI base=40 + Σ(khớp tính cách → +10 mỗi chiều)
  //    Ikigai Value/Env/Strength bonus (max +12 mỗi chiều)
  //    Ikigai Avoid penalty (max −15)
  //    Talent CRAFT/SPEECH/STRATEGY bonus/penalty
  //    Dream alignment bonus (+15/+8)
  //    Diversity Guard: ≤2/industry → top 15
  //
  //  VÒNG 3 — ICI + Constraint filters + Diversity → topN
  // ══════════════════════════════════════════════════════════════════════════

  private threeRoundMatch(
    pool: Array<{ name: string; riasec: string; niche: string; industry: string; [k: string]: any }>,
    input: ReturnType<typeof this.buildEngineInput>,
    topN: number,
    getMarket: (career: any) => number,
  ): any[] {
    const { hPct, mbtiCode, ikigaiTalent, ikigaiValue, ikigaiEnv,
            ikigaiStrength, ikigaiAvoid, dreamText,
            clinicalAnswer, artsAnswer, eduAnswer, bizAnswer, lawAnswer } = input;

    const RIASEC_ORDER: RiasecKey[] = ['R','I','A','S','E','C'];
    const hexDist = (a: string, b: string) => {
      const ia = RIASEC_ORDER.indexOf(a as RiasecKey);
      const ib = RIASEC_ORDER.indexOf(b as RiasecKey);
      if (ia<0||ib<0) return 0;
      const diff = Math.abs(ia-ib);
      return Math.min(diff, 6-diff);
    };

    // RIASEC weighted score cho một nghề (chuẩn hoá 0–100)
    const riasecScore = (riasec: string) => {
      let raw = 0;
      for (let i=0; i<riasec.length; i++)
        raw += (hPct[riasec[i] as RiasecKey]??0) * ((3-i)/3);
      return Math.min(100, +(raw/1.5).toFixed(4));
    };

    // Diversity Guard
    const guard = <T extends { career: { industry?: string } }>(arr: T[], max: number, limit: number) => {
      const cnt: Record<string,number> = {};
      return arr.filter(({career}) => {
        const ind = career.industry||'other';
        cnt[ind] = (cnt[ind]||0)+1;
        return cnt[ind] <= max;
      }).slice(0, limit);
    };

    const sortedH = (Object.entries(hPct) as [RiasecKey,number][]).sort((a,b)=>b[1]-a[1]);
    const userTop1 = sortedH[0]?.[0]??'R';
    const userTop2 = sortedH[1]?.[0]??'I';

    // Ikigai Holland boost maps (từ script.js gốc)
    const VALUE_BOOST:Record<string,Partial<Record<RiasecKey,number>>> = {
      MONEY:{E:8}, IMPACT:{S:8}, FREEDOM:{A:6,I:4}, MASTERY:{I:6,C:4}, RECOGNITION:{E:6,S:4},
    };
    const ENV_BOOST:Record<string,Partial<Record<RiasecKey,number>>> = {
      TEAM:{S:6,E:4}, SOLO:{I:6,C:4}, FIELD:{R:6,E:4}, REMOTE:{I:4,A:4}, MIXED:{},
    };
    const STRENGTH_BOOST:Record<string,Partial<Record<RiasecKey,number>>> = {
      COMMUNICATE:{E:8,S:4}, ANALYZE:{I:8,C:4}, CREATE:{A:8,I:4}, ORGANIZE:{C:8,R:2}, EMPATHIZE:{S:8,A:4},
    };
    const AVOID_PENALTY:Record<string,Partial<Record<RiasecKey,number>>> = {
      AVOID_ROUTINE:{C:-10,R:-6}, AVOID_PEOPLE:{S:-10,E:-6},
      AVOID_PRESSURE:{E:-8}, AVOID_ABSTRACT:{I:-8,A:-4}, AVOID_RULES:{C:-10},
    };

    // Dream keywords
    const BIZ_KW=['doanh nhân','kinh doanh','giám đốc','chủ tịch','startup','ceo','khởi nghiệp','founder'];
    const INSP_KW=['truyền cảm hứng','huấn luyện','đào tạo','diễn giả','tư vấn','giáo viên','khai vấn','coach','speaker'];
    const CARE_KW=['bác sĩ','y tế','sức khỏe','chăm sóc','tâm lý','trị liệu'];
    const TECH_KW=['lập trình','công nghệ','kỹ sư','developer','data','ai','robot','phần mềm'];
    const hasBiz  = BIZ_KW.some(k=>dreamText.includes(k));
    const hasInsp = INSP_KW.some(k=>dreamText.includes(k));
    const hasCare = CARE_KW.some(k=>dreamText.includes(k));
    const hasTech = TECH_KW.some(k=>dreamText.includes(k));

    // RE patterns
    const RE_CRAFT  = /kỹ thuật|cơ khí|xây dựng|thủ công|lắp đặt|vận hành|chế tạo|thợ|spa|ẩm thực|bếp|nail|make.?up|barista|cắt tóc|massage|sửa chữa|điện lạnh/i;
    const RE_SPEECH  = /tư vấn|hướng dẫn|mc |giảng dạy|đào tạo viên|huấn luyện|coach|khai vấn|diễn giả|speaker|giảng viên|giáo viên/i;
    const RE_STRATEGY= /quản trị|chiến lược|phân tích|kế hoạch|tâm lý|nghiên cứu|marketing|thương hiệu|consultant|advisor|strategy/i;
    const RE_CLINICAL_DIR = /bác sĩ|điều dưỡng|y tá|phẫu thuật|cấp cứu|hộ sinh/i;
    const RE_ARTS_PERF    = /diễn viên|ca sĩ|vũ công|nhạc sĩ|biên đạo|biểu diễn nghệ thuật|sân khấu/i;
    const RE_EDU          = /giáo viên|giảng viên|nhà đào tạo|huấn luyện viên|sư phạm|đào tạo viên|life coach|khai vấn|hướng nghiệp|trainer/i;
    const RE_BIZ          = /khởi nghiệp|doanh nhân|startup|founder|giám đốc điều hành|ceo|tự kinh doanh/i;
    const RE_LAW          = /luật sư|pháp chế|công tố viên|thẩm phán|kiểm sát/i;

    // ── VÒNG 1: S_identity (RIASEC proxy) ───────────────────────────────────
    const r1 = guard(
      pool.map(career => ({ career, S_identity: riasecScore(career.riasec) }))
          .sort((a,b)=>b.S_identity-a.S_identity),
      3, 30,
    );

    // ── VÒNG 2: S_niche ─────────────────────────────────────────────────────
    const r2 = guard(
      r1.map(({career, S_identity}) => {
        const nameLC = career.name.toLowerCase();

        // Holland score + Hexagon Penalty
        let hollandScore = riasecScore(career.riasec);
        const d1 = hexDist(userTop1, career.riasec[0]);
        const d2 = hexDist(userTop2, career.riasec[0]);
        if (d1===3||d2===3) hollandScore *= 0.20;
        else if (d1===2&&d2>=2) hollandScore *= 0.70;

        // MBTI score: base 40 + khớp mỗi chiều +10
        // Map nghề → MBTI tiêu biểu theo RIASEC primary
        const careerMbtiHint = this.riasecToMbtiHint(career.riasec[0] as RiasecKey);
        let mbtiBase = 40;
        for (const letter of mbtiCode) {
          if (careerMbtiHint.includes(letter)) mbtiBase += 10;
        }
        const mbtiScore = Math.max(0, Math.min(100, mbtiBase));

        // S_niche nền tảng: Holland 25% + MBTI 65%
        let S_niche = hollandScore*0.25 + mbtiScore*0.65;

        // Ikigai VALUE bonus
        if (ikigaiValue && VALUE_BOOST[ikigaiValue]) {
          let bonus=0;
          for (const [cat,pts] of Object.entries(VALUE_BOOST[ikigaiValue])) {
            const careH = career.riasec.includes(cat) ? 7 : 0;
            if (careH>=6) bonus+=pts; else if (careH>=4) bonus+=Math.round(pts*0.5);
          }
          S_niche = Math.min(100, S_niche+Math.min(12,bonus));
        }
        // Ikigai ENV bonus
        if (ikigaiEnv && ENV_BOOST[ikigaiEnv]) {
          let bonus=0;
          for (const [cat,pts] of Object.entries(ENV_BOOST[ikigaiEnv])) {
            if (career.riasec[0]===cat) bonus+=pts;
          }
          S_niche = Math.min(100, S_niche+Math.min(10,bonus));
        }
        // Ikigai STRENGTH bonus
        if (ikigaiStrength && STRENGTH_BOOST[ikigaiStrength]) {
          let bonus=0;
          for (const [cat,pts] of Object.entries(STRENGTH_BOOST[ikigaiStrength])) {
            if (career.riasec.includes(cat)) bonus+=pts;
          }
          S_niche = Math.min(100, S_niche+Math.min(12,bonus));
        }
        // Ikigai AVOID penalty
        if (ikigaiAvoid && AVOID_PENALTY[ikigaiAvoid]) {
          let pen=0;
          for (const [cat,pts] of Object.entries(AVOID_PENALTY[ikigaiAvoid])) {
            if (career.riasec[0]===cat) pen+=pts;
          }
          S_niche = Math.max(0, S_niche+Math.max(-15,pen));
        }

        // Talent CRAFT
        if (RE_CRAFT.test(nameLC)) {
          if (ikigaiTalent.CRAFT>=4) S_niche = Math.min(100,S_niche+15);
          else if (ikigaiTalent.CRAFT<=2) S_niche *= 0.30;
        }
        // Talent SPEECH/STRATEGY
        if (RE_SPEECH.test(nameLC) || RE_STRATEGY.test(nameLC)) {
          if (ikigaiTalent.SPEECH>=4||ikigaiTalent.STRATEGY>=4) S_niche=Math.min(100,S_niche+12);
          if (ikigaiTalent.SPEECH>=4&&ikigaiTalent.STRATEGY>=4) S_niche=Math.min(100,S_niche+5);
        }

        // Dream alignment
        if (dreamText.length>0) {
          let dreamBonus=0;
          if (hasBiz&&hasInsp && career.riasec.includes('S')&&career.riasec.includes('E')) dreamBonus=20;
          else if (hasBiz && career.riasec[0]==='E') dreamBonus=15;
          else if (hasInsp && career.riasec.includes('S')) dreamBonus=15;
          else if (hasCare && /y tế|y khoa|dược|chăm sóc|tâm lý/i.test(nameLC)) dreamBonus=15;
          else if (hasTech && (career.riasec[0]==='I'||career.riasec[0]==='R')) dreamBonus=15;
          S_niche = Math.min(100, S_niche+dreamBonus);
        }

        S_niche = Math.max(0, +S_niche.toFixed(4));
        return { career, S_identity, S_niche };
      }).sort((a,b)=>b.S_niche-a.S_niche),
      2, 15,
    );

    // ── VÒNG 3: ICI + Constraint filters ────────────────────────────────────
    const r3 = r2.map(({career, S_identity, S_niche}) => {
      const nameLC = career.name.toLowerCase();
      const S_market = getMarket(career);
      let pct = Math.min(99, Math.round(S_identity*0.60 + S_niche*0.25 + S_market*0.15));

      // Constraint penalties
      if (RE_CLINICAL_DIR.test(nameLC) && clinicalAnswer==='CLINICAL_AVOID') pct = Math.round(pct*0.20);
      if (RE_ARTS_PERF.test(nameLC)    && artsAnswer==='ARTS_AVOID')         pct = Math.round(pct*0.30);
      if (RE_EDU.test(nameLC)          && eduAnswer==='EDU_AVOID')           pct = Math.round(pct*0.50);
      if (RE_BIZ.test(nameLC)          && bizAnswer==='BIZ_AVOID')           pct = Math.round(pct*0.40);
      if (RE_LAW.test(nameLC)          && lawAnswer==='LAW_AVOID')           pct = Math.round(pct*0.30);

      return { career, pct };
    }).sort((a,b)=>b.pct-a.pct);

    const final = guard(r3, 2, topN);
    return final.map((item,i) => ({ rank:i+1, ...item.career, pct:item.pct }));
  }

  // Helper: MBTI letters tiêu biểu theo RIASEC primary (approximation)
  private riasecToMbtiHint(r: RiasecKey): string {
    const map: Record<RiasecKey, string> = {
      R: 'ISTP', I: 'INTP', A: 'INFP', S: 'ESFJ', E: 'ENTJ', C: 'ISTJ',
    };
    return map[r] ?? 'INTJ';
  }

  // Wrap engine input vào object để tránh truyền tham số dài
  private buildEngineInput(params: any) { return params; }

  // ── University track: top 5, S_market = 65 ──────────────────────────────
  private matchCareers(input: any, top3: string) {
    return this.threeRoundMatch(UNIVERSITY_CAREERS, input, 5, () => 65);
  }

  // ── Vocational track: top 10, S_market từ salary ─────────────────────────
  private matchVocationalCareers(input: any, top3: string) {
    const deriveMarket = (career: any): number => {
      const nums = (career.salary??'').match(/\d+/g)?.map(Number)??[];
      if (!nums.length) return 50;
      const upper = Math.max(...nums);
      return Math.min(100, Math.round(10 + ((upper-5)/35)*90));
    };
    return this.threeRoundMatch(VOCATIONAL_CAREERS, input, 10, deriveMarket);
  }
}
