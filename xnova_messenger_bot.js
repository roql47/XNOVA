/**
 * XNOVA 메신저봇 연동 스크립트 (API2)
 * 카카오톡에서 XNOVA 게임 정보를 조회할 수 있습니다.
 */

// ==================== 봇 초기화 ====================
const bot = BotManager.getCurrentBot();

// ==================== 설정 ====================
const CONFIG = {
    API_BASE_URL: "http://52.79.154.253:3000/api",
    COMMAND_PREFIX: "!"
};

// 데이터 저장 경로
const DATA_PATH = "/storage/emulated/0/ChatBot/database/xnova_data.json";

// ==================== 한글-영어 매핑 (백엔드 NAME_MAPPING 기준) ====================

// 건물 매핑
const BUILDING_MAP = {
    // 정식명칭 (백엔드 기준)
    "메탈광산": "metalMine",
    "크리스탈광산": "crystalMine",
    "듀테륨광산": "deuteriumMine",
    "태양광발전소": "solarPlant",
    "핵융합로": "fusionReactor",
    "로봇공장": "robotFactory",
    "조선소": "shipyard",
    "연구소": "researchLab",
    "나노공장": "nanoFactory",
    // 축약형
    "메광": "metalMine",
    "크광": "crystalMine",
    "듀광": "deuteriumMine",
    "태발": "solarPlant",
    "핵융": "fusionReactor",
    "로공": "robotFactory",
    "나공": "nanoFactory",
    "연소": "researchLab"
};

// 연구 매핑
const RESEARCH_MAP = {
    // 정식명칭 (백엔드 기준)
    "에너지공학": "energyTech",
    "레이저공학": "laserTech",
    "이온공학": "ionTech",
    "초공간기술": "hyperspaceTech",
    "플라즈마공학": "plasmaTech",
    "정탐기술": "espionageTech",
    "컴퓨터공학": "computerTech",
    "원정기술": "astrophysics",
    "연소엔진": "combustionDrive",
    "핵추진엔진": "impulseDrive",
    "초공간엔진": "hyperspaceDrive",
    "무기공학": "weaponsTech",
    "보호막연구": "shieldTech",
    "장갑기술": "armorTech",
    "중력자기술": "gravitonTech",
    "은하망네트워크": "intergalacticResearch",
    // 축약형
    "에공": "energyTech",
    "레공": "laserTech",
    "이공": "ionTech",
    "초기": "hyperspaceTech",
    "플공": "plasmaTech",
    "정탐": "espionageTech",
    "컴공": "computerTech",
    "원정": "astrophysics",
    "연엔": "combustionDrive",
    "핵엔": "impulseDrive",
    "초엔": "hyperspaceDrive",
    "무공": "weaponsTech",
    "보연": "shieldTech",
    "장기": "armorTech"
};

// 함대 매핑
const FLEET_MAP = {
    // 정식명칭 (백엔드 기준)
    "전투기": "lightFighter",
    "공격기": "heavyFighter",
    "구축함": "cruiser",
    "순양함": "battleship",
    "전투순양함": "battlecruiser",
    "폭격기": "bomber",
    "전함": "destroyer",
    "죽음의별": "deathstar",
    "소형화물선": "smallCargo",
    "대형화물선": "largeCargo",
    "식민선": "colonyShip",
    "수확선": "recycler",
    "무인정찰기": "espionageProbe",
    "태양광인공위성": "solarSatellite",
    // 축약형
    "전투": "lightFighter",
    "공격": "heavyFighter",
    "구축": "cruiser",
    "순양": "battleship",
    "전순": "battlecruiser",
    "폭격": "bomber",
    "전함": "destroyer",
    "죽별": "deathstar",
    "소화": "smallCargo",
    "대화": "largeCargo",
    "식민": "colonyShip",
    "수확": "recycler",
    "정찰": "espionageProbe",
    "위성": "solarSatellite"
};

// 방어시설 매핑
const DEFENSE_MAP = {
    // 정식명칭 (백엔드 기준)
    "미사일발사대": "rocketLauncher",
    "경레이저포탑": "lightLaser",
    "중레이저포탑": "heavyLaser",
    "가우스포": "gaussCannon",
    "이온포": "ionCannon",
    "플라즈마포탑": "plasmaTurret",
    "소형보호막돔": "smallShieldDome",
    "대형보호막돔": "largeShieldDome",
    "대탄도미사일": "antiBallisticMissile",
    "대륙간미사일": "interplanetaryMissile",
    // 축약형
    "미발": "rocketLauncher",
    "경레": "lightLaser",
    "중레": "heavyLaser",
    "가우스": "gaussCannon",
    "이온": "ionCannon",
    "플포": "plasmaTurret",
    "소돔": "smallShieldDome",
    "대돔": "largeShieldDome",
    "대탄": "antiBallisticMissile",
    "대륙": "interplanetaryMissile"
};

// 한글명을 영어 코드로 변환
function toCode(name, map) {
    if (!name) return name;
    // 이미 영어라면 그대로 반환
    if (/^[a-zA-Z]+$/.test(name)) return name;
    // 매핑에서 찾기
    return map[name] || name;
}

// 영어 코드를 한글로 변환 (역방향 매핑)
const CODE_TO_NAME = {
    // 건물
    "metalMine": "메탈광산",
    "crystalMine": "크리스탈광산",
    "deuteriumMine": "듀테륨광산",
    "solarPlant": "태양광발전소",
    "fusionReactor": "핵융합로",
    "robotFactory": "로봇공장",
    "shipyard": "조선소",
    "researchLab": "연구소",
    "nanoFactory": "나노공장",
    // 창고 건물
    "metalStorage": "메탈저장소",
    "crystalStorage": "크리스탈저장소",
    "deuteriumTank": "듀테륨탱크",
    // 함대
    "smallCargo": "소형화물선",
    "largeCargo": "대형화물선",
    "lightFighter": "전투기",
    "heavyFighter": "공격기",
    "cruiser": "구축함",
    "battleship": "순양함",
    "battlecruiser": "전투순양함",
    "bomber": "폭격기",
    "destroyer": "전함",
    "deathstar": "죽음의별",
    "recycler": "수확선",
    "espionageProbe": "무인정찰기",
    "solarSatellite": "태양광인공위성",
    "colonyShip": "식민선",
    // 방어시설
    "rocketLauncher": "미사일발사대",
    "lightLaser": "경레이저포탑",
    "heavyLaser": "중레이저포탑",
    "gaussCannon": "가우스포",
    "ionCannon": "이온포",
    "plasmaTurret": "플라즈마포탑",
    "smallShieldDome": "소형보호막돔",
    "largeShieldDome": "대형보호막돔",
    "antiBallisticMissile": "대탄도미사일",
    "interplanetaryMissile": "대륙간미사일",
    // 연구
    "energyTech": "에너지공학",
    "laserTech": "레이저공학",
    "ionTech": "이온공학",
    "hyperspaceTech": "초공간기술",
    "plasmaTech": "플라즈마공학",
    "combustionDrive": "연소엔진",
    "impulseDrive": "핵추진엔진",
    "hyperspaceDrive": "초공간엔진",
    "espionageTech": "정탐기술",
    "computerTech": "컴퓨터공학",
    "astrophysics": "원정기술",
    "intergalacticResearch": "은하망네트워크",
    "gravitonTech": "중력자기술",
    "weaponsTech": "무기공학",
    "shieldTech": "보호막연구",
    "armorTech": "장갑기술"
};

function toKorean(code) {
    if (!code) return code;
    return CODE_TO_NAME[code] || code;
}

// ==================== 데이터 저장소 ====================
let DB = {
    tokens: {},
    notifications: {}
};

// 데이터 로드
function loadData() {
    try {
        let data = FileStream.read(DATA_PATH);
        if (data) {
            let parsed = JSON.parse(data);
            DB.tokens = parsed.tokens || {};
            DB.notifications = parsed.notifications || {};
        }
    } catch (e) {
        Log.e("데이터 로드 실패: " + e);
    }
}

// 데이터 저장
function saveData() {
    try {
        FileStream.save(DATA_PATH, JSON.stringify(DB));
    } catch (e) {
        Log.e("데이터 저장 실패: " + e);
    }
}

// ==================== 유틸리티 함수 ====================

// 숫자 포맷팅
function formatNumber(num) {
    if (num === undefined || num === null) return "0";
    return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// 시간 포맷팅
function formatTime(seconds) {
    if (!seconds || seconds <= 0) return "완료";
    let h = Math.floor(seconds / 3600);
    let m = Math.floor((seconds % 3600) / 60);
    let s = Math.floor(seconds % 60);
    return (h > 0 ? h + "시간 " : "") + (m > 0 ? m + "분 " : "") + s + "초";
}

// 함선 영어 코드를 한글명으로 변환
function getShipName(code) {
    return NAME_MAP[code] || code;
}

// finishTime 파싱 (문자열 또는 숫자)
function parseFinishTime(finishTime) {
    if (!finishTime) return 0;
    // 이미 숫자(밀리초)면 그대로 반환
    if (typeof finishTime === "number") return finishTime;
    // 문자열이면 Date로 파싱
    let d = new Date(finishTime);
    return d.getTime();
}

// 미션 타입 한글 변환
function getMissionName(missionType) {
    let map = {
        "attack": "공격",
        "transport": "수송",
        "deploy": "배치",
        "recycle": "수확",
        "colony": "식민",
        "espionage": "정찰",
        "returning": "귀환"
    };
    return map[missionType] || missionType || "미션";
}

// HTTP POST 요청 (jsoup 사용)
function httpPost(url, body) {
    try {
        let res = org.jsoup.Jsoup.connect(url)
            .header("Content-Type", "application/json")
            .requestBody(JSON.stringify(body))
            .ignoreContentType(true)
            .ignoreHttpErrors(true)
            .timeout(10000)
            .post()
            .text();
        return { success: true, data: JSON.parse(res) };
    } catch (e) {
        return { success: false, error: e.toString() };
    }
}

// HTTP GET 요청 (jsoup 사용)
function httpGet(url, accessToken) {
    try {
        let conn = org.jsoup.Jsoup.connect(url)
            .header("Content-Type", "application/json")
            .ignoreContentType(true)
            .ignoreHttpErrors(true)
            .timeout(10000);
        
        if (accessToken) {
            conn = conn.header("Authorization", "Bearer " + accessToken);
        }
        
        let res = conn.get().text();
        return { success: true, data: JSON.parse(res) };
    } catch (e) {
        return { success: false, error: e.toString() };
    }
}

// ==================== API 함수 ====================

function apiVerifyCode(code) {
    return httpPost(CONFIG.API_BASE_URL + "/auth/kakao-link/verify", { code: code });
}

function apiGetResources(token) {
    return httpGet(CONFIG.API_BASE_URL + "/game/resources", token);
}

function apiGetBuildings(token) {
    return httpGet(CONFIG.API_BASE_URL + "/game/buildings", token);
}

function apiGetResearch(token) {
    return httpGet(CONFIG.API_BASE_URL + "/game/research", token);
}

function apiGetFleet(token) {
    return httpGet(CONFIG.API_BASE_URL + "/game/fleet", token);
}

function apiGetDefense(token) {
    return httpGet(CONFIG.API_BASE_URL + "/game/defense", token);
}

function apiGetPlanets(token) {
    return httpGet(CONFIG.API_BASE_URL + "/planet/list", token);
}

function apiSwitchPlanet(token, planetId) {
    return httpPostAuth(CONFIG.API_BASE_URL + "/planet/switch", { planetId: planetId }, token);
}

function apiGetBattleStatus(token) {
    return httpGet(CONFIG.API_BASE_URL + "/game/battle/status", token);
}

function apiGetRanking(token, type) {
    return httpGet(CONFIG.API_BASE_URL + "/ranking?type=" + (type || "total") + "&limit=20", token);
}

// HTTP POST with Auth
function httpPostAuth(url, body, accessToken) {
    try {
        let res = org.jsoup.Jsoup.connect(url)
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + accessToken)
            .requestBody(JSON.stringify(body))
            .ignoreContentType(true)
            .ignoreHttpErrors(true)
            .timeout(10000)
            .post()
            .text();
        return { success: true, data: JSON.parse(res) };
    } catch (e) {
        return { success: false, error: e.toString() };
    }
}

// 건설 API
function apiStartBuild(token, buildingType) {
    return httpPostAuth(CONFIG.API_BASE_URL + "/game/buildings/upgrade", { buildingType: buildingType }, token);
}

function apiCompleteBuild(token) {
    return httpPostAuth(CONFIG.API_BASE_URL + "/game/buildings/complete", {}, token);
}

function apiCancelBuild(token) {
    return httpPostAuth(CONFIG.API_BASE_URL + "/game/buildings/cancel", {}, token);
}

// 연구 API
function apiStartResearch(token, researchType) {
    return httpPostAuth(CONFIG.API_BASE_URL + "/game/research/start", { researchType: researchType }, token);
}

function apiCompleteResearch(token) {
    return httpPostAuth(CONFIG.API_BASE_URL + "/game/research/complete", {}, token);
}

function apiCancelResearch(token) {
    return httpPostAuth(CONFIG.API_BASE_URL + "/game/research/cancel", {}, token);
}

// 함대/방어시설 건조 API
function apiBuildFleet(token, fleetType, quantity) {
    return httpPostAuth(CONFIG.API_BASE_URL + "/game/fleet/build", { fleetType: fleetType, quantity: quantity }, token);
}

function apiBuildDefense(token, defenseType, quantity) {
    return httpPostAuth(CONFIG.API_BASE_URL + "/game/defense/build", { defenseType: defenseType, quantity: quantity }, token);
}

// 전투 API
function apiAttack(token, targetCoord, fleet) {
    return httpPostAuth(CONFIG.API_BASE_URL + "/game/battle/attack", { targetCoord: targetCoord, fleet: fleet }, token);
}

function apiRecallFleet(token, missionId) {
    let body = missionId ? { missionId: missionId } : {};
    return httpPostAuth(CONFIG.API_BASE_URL + "/game/battle/recall", body, token);
}

// ==================== 토큰 관리 ====================

function getValidToken(senderHash) {
    let userToken = DB.tokens[senderHash];
    if (!userToken) return null;
    return userToken.accessToken;
}

// ==================== 메시지 핸들러 ====================

function onMessage(msg) {
    let content = msg.content;
    
    // 명령어가 아니면 무시
    if (!content.startsWith(CONFIG.COMMAND_PREFIX)) return;
    
    // 데이터 로드
    loadData();
    
    let parts = content.substring(CONFIG.COMMAND_PREFIX.length).trim().split(/\s+/);
    let cmd = parts[0].toLowerCase();
    let args = parts.slice(1);
    let senderHash = msg.author.hash;
    
    try {
        switch (cmd) {
            case "연동":
            case "link":
                cmdLink(msg, senderHash);
                break;
            case "인증":
            case "auth":
                cmdAuth(msg, senderHash, args);
                break;
            case "해제":
            case "unlink":
                cmdUnlink(msg, senderHash);
                break;
            case "자원":
            case "res":
                cmdResources(msg, senderHash);
                break;
            case "건물":
            case "build":
                cmdBuildings(msg, senderHash);
                break;
            case "연구":
            case "tech":
                if (args.length > 0) {
                    cmdResearchStart(msg, senderHash, args);
                } else {
                    cmdResearch(msg, senderHash);
                }
                break;
            case "함대":
            case "fleet":
                cmdFleet(msg, senderHash);
                break;
            case "방어":
            case "defense":
                cmdDefense(msg, senderHash);
                break;
            case "행성":
            case "planet":
                cmdPlanets(msg, senderHash);
                break;
            case "행성전환":
            case "전환":
            case "switch":
                cmdSwitchPlanet(msg, senderHash, args);
                break;
            case "상태":
            case "status":
                cmdStatus(msg, senderHash);
                break;
            case "랭킹":
            case "rank":
                cmdRanking(msg, senderHash, args);
                break;
            case "건설":
                cmdBuild(msg, senderHash, args);
                break;
            case "건설확인":
                cmdBuildComplete(msg, senderHash);
                break;
            case "건설취소":
                cmdBuildCancel(msg, senderHash);
                break;
            case "연구확인":
                cmdResearchComplete(msg, senderHash);
                break;
            case "연구취소":
                cmdResearchCancel(msg, senderHash);
                break;
            case "함대건조":
                cmdFleetBuild(msg, senderHash, args);
                break;
            case "방시건조":
                cmdDefenseBuild(msg, senderHash, args);
                break;
            case "공격":
                cmdAttack(msg, senderHash, args);
                break;
            case "함대귀환":
                cmdRecallFleet(msg, senderHash);
                break;
            case "도움":
            case "help":
            case "?":
                cmdHelp(msg);
                break;
            case "테스트":
                msg.reply("XNOVA 봇이 정상 작동합니다!");
                break;
        }
    } catch (e) {
        msg.reply("[오류] " + e);
        Log.e("명령어 처리 오류: " + e);
    }
}

// ==================== 명령어 함수 ====================

function cmdLink(msg, senderHash) {
    if (DB.tokens[senderHash]) {
        msg.reply("이미 계정이 연동되어 있습니다.\n연동 해제: !해제");
        return;
    }
    
    msg.reply(
        "[XNOVA 계정 연동]\n\n" +
        "1. XNOVA 앱 > 설정 > 카카오톡 연동\n" +
        "2. 인증코드 발급 버튼 클릭\n" +
        "3. 발급된 6자리 코드 입력\n\n" +
        "사용법: !인증 [코드]\n" +
        "예시: !인증 ABC123"
    );
}

function cmdAuth(msg, senderHash, args) {
    if (args.length < 1) {
        msg.reply("사용법: !인증 [인증코드]");
        return;
    }
    
    if (DB.tokens[senderHash]) {
        msg.reply("이미 계정이 연동되어 있습니다.\n연동 해제: !해제");
        return;
    }
    
    let inputCode = args[0].toUpperCase();
    
    if (!/^[A-Z0-9]{6}$/.test(inputCode)) {
        msg.reply("[오류] 6자리 영문/숫자 코드를 입력하세요.");
        return;
    }
    
    msg.reply("인증 중...");
    
    let result = apiVerifyCode(inputCode);
    
    if (!result.success || !result.data.accessToken) {
        let errMsg = (result.data && result.data.message) ? result.data.message : "인증 실패";
        msg.reply("[오류] " + errMsg);
        return;
    }
    
    DB.tokens[senderHash] = {
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
        username: result.data.username || "사용자"
    };
    saveData();
    
    msg.reply(
        "[연동 완료!]\n\n" +
        "계정: " + (result.data.username || "사용자") + "\n\n" +
        "명령어: !자원, !건물, !연구, !함대, !방어, !행성, !상태, !도움"
    );
}

function cmdUnlink(msg, senderHash) {
    if (!DB.tokens[senderHash]) {
        msg.reply("[오류] 연동된 계정이 없습니다.");
        return;
    }
    
    let username = DB.tokens[senderHash].username || "계정";
    delete DB.tokens[senderHash];
    saveData();
    
    msg.reply("[연동 해제됨]\n계정: " + username);
}

function cmdResources(msg, senderHash) {
    let token = getValidToken(senderHash);
    if (!token) {
        msg.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    let result = apiGetResources(token);
    if (!result.success) {
        msg.reply("[오류] 자원 조회 실패");
        return;
    }
    
    let data = result.data;
    let res = data.resources || data;
    let prod = data.production;
    let storage = data.storage;
    
    let text = "[자원 현황]\n\n";
    
    // 창고 용량 정보 포함
    if (storage) {
        let metalOver = res.metal >= storage.metalCapacity;
        let crystalOver = res.crystal >= storage.crystalCapacity;
        let deuteriumOver = res.deuterium >= storage.deuteriumCapacity;
        
        text += "메탈: " + formatNumber(res.metal) + "/" + formatNumber(storage.metalCapacity);
        text += metalOver ? " ⚠️가득참\n" : "\n";
        
        text += "크리스탈: " + formatNumber(res.crystal) + "/" + formatNumber(storage.crystalCapacity);
        text += crystalOver ? " ⚠️가득참\n" : "\n";
        
        text += "중수소: " + formatNumber(res.deuterium) + "/" + formatNumber(storage.deuteriumCapacity);
        text += deuteriumOver ? " ⚠️가득참\n" : "\n";
    } else {
        text += "메탈: " + formatNumber(res.metal) + "\n";
        text += "크리스탈: " + formatNumber(res.crystal) + "\n";
        text += "중수소: " + formatNumber(res.deuterium) + "\n";
    }
    
    if (prod) {
        let maxEnergy = prod.energyProduction || 0;
        text += "에너지: " + formatNumber(res.energy) + "/" + formatNumber(maxEnergy);
        text += "\n\n[생산량/시간]\n";
        text += "M: +" + formatNumber(prod.metal) + "\n";
        text += "C: +" + formatNumber(prod.crystal) + "\n";
        text += "D: +" + formatNumber(prod.deuterium);
    } else {
        text += "에너지: " + formatNumber(res.energy);
    }
    
    msg.reply(text);
}

function cmdBuildings(msg, senderHash) {
    let token = getValidToken(senderHash);
    if (!token) {
        msg.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    let result = apiGetBuildings(token);
    if (!result.success) {
        msg.reply("[오류] 건물 조회 실패");
        return;
    }
    
    let data = result.data;
    let text = "[건물 현황]\n\n";
    
    // buildings 배열에서 건물 정보 추출
    if (data.buildings && data.buildings.length > 0) {
        text += "[광산]\n";
        for (let i = 0; i < data.buildings.length; i++) {
            let b = data.buildings[i];
            if (b.category === "mines") {
                text += b.name + ": Lv." + b.level + "\n";
            }
        }
        text += "\n[시설]\n";
        for (let i = 0; i < data.buildings.length; i++) {
            let b = data.buildings[i];
            if (b.category === "facilities") {
                text += b.name + ": Lv." + b.level + "\n";
            }
        }
    }
    
    // 필드 정보
    if (data.fieldInfo) {
        text += "\n[필드] " + data.fieldInfo.used + "/" + data.fieldInfo.max;
    }
    
    // 건설 진행 정보
    if (data.constructionProgress && data.constructionProgress.name) {
        let prog = data.constructionProgress;
        let remainSec = Math.max(0, Math.floor((new Date(prog.finishTime) - Date.now()) / 1000));
        text += "\n\n[건설중] " + prog.name + " Lv." + prog.targetLevel;
        text += "\n남은시간: " + formatTime(remainSec);
    }
    
    msg.reply(text);
}

function cmdResearch(msg, senderHash) {
    let token = getValidToken(senderHash);
    if (!token) {
        msg.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    let result = apiGetResearch(token);
    if (!result.success) {
        msg.reply("[오류] 연구 조회 실패");
        return;
    }
    
    let data = result.data;
    let text = "[연구 현황]\n\n";
    
    let hasResearch = false;
    // research 배열에서 level > 0인 것만 표시
    if (data.research && data.research.length > 0) {
        for (let i = 0; i < data.research.length; i++) {
            let r = data.research[i];
            if (r.level > 0) {
                text += r.name + ": Lv." + r.level + "\n";
                hasResearch = true;
            }
        }
    }
    
    if (!hasResearch) {
        text += "연구 없음";
    }
    
    // 연구 진행 정보
    if (data.researchProgress && data.researchProgress.name) {
        let prog = data.researchProgress;
        let remainSec = Math.max(0, Math.floor((new Date(prog.finishTime) - Date.now()) / 1000));
        text += "\n\n[연구중] " + prog.name + " Lv." + prog.targetLevel;
        text += "\n남은시간: " + formatTime(remainSec);
    }
    
    text += "\n\n연구 시작: !연구 [연구명]\n예시: !연구 에공";
    
    msg.reply(text);
}

function cmdFleet(msg, senderHash) {
    let token = getValidToken(senderHash);
    if (!token) {
        msg.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    let result = apiGetFleet(token);
    if (!result.success) {
        msg.reply("[오류] 함대 조회 실패");
        return;
    }
    
    let data = result.data;
    let text = "[함대 현황]\n\n";
    
    let hasFleet = false;
    // fleet 배열에서 count > 0인 것만 표시
    if (data.fleet && data.fleet.length > 0) {
        for (let i = 0; i < data.fleet.length; i++) {
            let f = data.fleet[i];
            if (f.count > 0) {
                text += f.name + ": " + formatNumber(f.count) + "\n";
                hasFleet = true;
            }
        }
    }
    
    if (!hasFleet) {
        text += "보유 함대 없음";
    }
    
    // 건조 진행 정보
    if (data.fleetProgress && data.fleetProgress.name) {
        let prog = data.fleetProgress;
        let remainSec = Math.max(0, Math.floor((new Date(prog.finishTime) - Date.now()) / 1000));
        text += "\n\n[건조중] " + prog.name + " x" + prog.quantity;
        text += "\n남은시간: " + formatTime(remainSec);
    }
    
    msg.reply(text);
}

function cmdDefense(msg, senderHash) {
    let token = getValidToken(senderHash);
    if (!token) {
        msg.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    let result = apiGetDefense(token);
    if (!result.success) {
        msg.reply("[오류] 방어시설 조회 실패");
        return;
    }
    
    let data = result.data;
    let text = "[방어시설 현황]\n\n";
    
    let hasDefense = false;
    // defense 배열에서 count > 0인 것만 표시
    if (data.defense && data.defense.length > 0) {
        for (let i = 0; i < data.defense.length; i++) {
            let d = data.defense[i];
            if (d.count > 0) {
                text += d.name + ": " + formatNumber(d.count) + "\n";
                hasDefense = true;
            }
        }
    }
    
    if (!hasDefense) {
        text += "보유 방어시설 없음";
    }
    
    // 건조 진행 정보
    if (data.defenseProgress && data.defenseProgress.name) {
        let prog = data.defenseProgress;
        let remainSec = Math.max(0, Math.floor((new Date(prog.finishTime) - Date.now()) / 1000));
        text += "\n\n[건조중] " + prog.name + " x" + prog.quantity;
        text += "\n남은시간: " + formatTime(remainSec);
    }
    
    msg.reply(text);
}

function cmdPlanets(msg, senderHash) {
    let token = getValidToken(senderHash);
    if (!token) {
        msg.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    let result = apiGetPlanets(token);
    if (!result.success) {
        msg.reply("[오류] 행성 조회 실패");
        return;
    }
    
    let data = result.data;
    let text = "[행성 목록]\n\n";
    
    if (data.planets && data.planets.length > 0) {
        for (let i = 0; i < data.planets.length; i++) {
            let planet = data.planets[i];
            let isActive = planet.id === data.activePlanetId || planet._id === data.activePlanetId;
            text += (isActive ? "▶ " : "  ") + (i + 1) + ". " + planet.name + " [" + planet.coordinate + "]\n";
        }
        text += "\n행성 전환: !전환 [번호]\n예: !전환 2";
    } else {
        text += "행성 없음";
    }
    
    msg.reply(text);
}

function cmdSwitchPlanet(msg, senderHash, args) {
    let token = getValidToken(senderHash);
    if (!token) {
        msg.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    if (args.length < 1) {
        msg.reply("[행성 전환]\n!전환 [번호]\n\n먼저 !행성 명령어로 행성 목록을 확인하세요.");
        return;
    }
    
    let planetIndex = parseInt(args[0], 10);
    if (isNaN(planetIndex) || planetIndex < 1) {
        msg.reply("[오류] 올바른 행성 번호를 입력하세요.\n\n먼저 !행성 명령어로 행성 목록을 확인하세요.");
        return;
    }
    
    // 행성 목록 조회
    let listResult = apiGetPlanets(token);
    if (!listResult.success || !listResult.data.planets) {
        msg.reply("[오류] 행성 목록 조회 실패");
        return;
    }
    
    let planets = listResult.data.planets;
    if (planetIndex > planets.length) {
        msg.reply("[오류] 해당 번호의 행성이 없습니다. (총 " + planets.length + "개)");
        return;
    }
    
    let targetPlanet = planets[planetIndex - 1];
    let planetId = targetPlanet.id || targetPlanet._id;
    
    // 행성 전환 요청
    let result = apiSwitchPlanet(token, planetId);
    if (!result.success || result.data.statusCode) {
        let errMsg = result.data && result.data.message ? result.data.message : "행성 전환 실패";
        msg.reply("[오류] " + errMsg);
        return;
    }
    
    msg.reply("[행성 전환 완료]\n\n" + targetPlanet.name + " [" + targetPlanet.coordinate + "]");
}

function cmdStatus(msg, senderHash) {
    let token = getValidToken(senderHash);
    if (!token) {
        msg.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    let text = "[현재 상태]\n";
    let hasActivity = false;
    
    // 건물 건설 상태
    let buildResult = apiGetBuildings(token);
    if (buildResult.success && buildResult.data.constructionProgress && buildResult.data.constructionProgress.name) {
        let prog = buildResult.data.constructionProgress;
        let finishMs = parseFinishTime(prog.finishTime);
        let remainSec = Math.max(0, Math.floor((finishMs - Date.now()) / 1000));
        let buildName = toKorean(prog.name);
        // buildings 배열에서 현재 레벨 찾기
        let level = "?";
        if (buildResult.data.buildings) {
            for (let i = 0; i < buildResult.data.buildings.length; i++) {
                let b = buildResult.data.buildings[i];
                if (b.type === prog.name) {
                    level = (b.level || 0) + 1;
                    break;
                }
            }
        }
        text += "\n[건설중]\n";
        text += "- " + buildName + " Lv." + level + " (" + formatTime(remainSec) + ")\n";
        hasActivity = true;
    }
    
    // 연구 상태
    let researchResult = apiGetResearch(token);
    if (researchResult.success && researchResult.data.researchProgress && researchResult.data.researchProgress.name) {
        let prog = researchResult.data.researchProgress;
        let finishMs = parseFinishTime(prog.finishTime);
        let remainSec = Math.max(0, Math.floor((finishMs - Date.now()) / 1000));
        let researchName = toKorean(prog.name);
        // research 배열에서 현재 레벨 찾기
        let level = "?";
        if (researchResult.data.research) {
            for (let i = 0; i < researchResult.data.research.length; i++) {
                let r = researchResult.data.research[i];
                if (r.type === prog.name) {
                    level = (r.level || 0) + 1;
                    break;
                }
            }
        }
        text += "\n[연구중]\n";
        text += "- " + researchName + " Lv." + level + " (" + formatTime(remainSec) + ")\n";
        hasActivity = true;
    }
    
    // 함대 건조 상태
    let fleetResult = apiGetFleet(token);
    if (fleetResult.success && fleetResult.data.fleetProgress && fleetResult.data.fleetProgress.name) {
        let prog = fleetResult.data.fleetProgress;
        let finishMs = parseFinishTime(prog.finishTime);
        let remainSec = Math.max(0, Math.floor((finishMs - Date.now()) / 1000));
        let fleetName = toKorean(prog.name);
        text += "\n[함대 건조중]\n";
        text += "- " + fleetName + " x" + (prog.quantity || 1) + " (" + formatTime(remainSec) + ")\n";
        hasActivity = true;
    }
    
    // 방어시설 건조 상태
    let defenseResult = apiGetDefense(token);
    if (defenseResult.success && defenseResult.data.defenseProgress && defenseResult.data.defenseProgress.name) {
        let prog = defenseResult.data.defenseProgress;
        let finishMs = parseFinishTime(prog.finishTime);
        let remainSec = Math.max(0, Math.floor((finishMs - Date.now()) / 1000));
        let defenseName = toKorean(prog.name);
        text += "\n[방어시설 건조중]\n";
        text += "- " + defenseName + " x" + (prog.quantity || 1) + " (" + formatTime(remainSec) + ")\n";
        hasActivity = true;
    }
    
    // 전투/미션 상태
    let battleResult = apiGetBattleStatus(token);
    if (battleResult.success) {
        let data = battleResult.data;
        
        // 내 함대 미션 (fleetMissions 배열)
        if (data.fleetMissions && data.fleetMissions.length > 0) {
            text += "\n[함대 미션]\n";
            for (let i = 0; i < data.fleetMissions.length; i++) {
                let mission = data.fleetMissions[i];
                let remainSec = Math.floor(mission.remainingTime || 0);
                let missionName = getMissionName(mission.missionType);
                let phase = mission.phase === "returning" ? "(귀환중)" : "";
                text += "- " + missionName + " > " + mission.targetCoord + " " + phase + " (" + formatTime(remainSec) + ")\n";
            }
            hasActivity = true;
        }
        
        // 하위호환: pendingAttack
        if (data.pendingAttack && !data.pendingAttack.battleCompleted) {
            text += "\n[출격중]\n";
            let remainSec = Math.floor(data.pendingAttack.remainingTime || 0);
            let missionName = getMissionName(data.pendingAttack.missionType);
            text += "- " + missionName + " > " + data.pendingAttack.targetCoord + " (" + formatTime(remainSec) + ")\n";
            hasActivity = true;
        }
        
        // 귀환중 (pendingReturn)
        if (data.pendingReturn) {
            text += "\n[귀환중]\n";
            let remainSec = Math.floor(data.pendingReturn.remainingTime || 0);
            let missionName = getMissionName(data.pendingReturn.missionType);
            text += "- " + missionName + " 귀환 (" + formatTime(remainSec) + ")\n";
            hasActivity = true;
        }
        
        // 적 공격 (incomingAttack)
        if (data.incomingAttack) {
            text += "\n[!! 적 접근 !!]\n";
            let remainSec = Math.floor(data.incomingAttack.remainingTime || 0);
            text += "- 공격 from " + (data.incomingAttack.attackerCoord || "???") + " (" + formatTime(remainSec) + ")\n";
            
            // 함대 정보 표시 (정탐 레벨에 따름)
            let visibility = data.incomingAttack.fleetVisibility || 'full';
            let fleet = data.incomingAttack.fleet || {};
            
            if (visibility === 'hidden') {
                text += "  └ 함대 정보: 식별 불가 (정탐 기술 격차)\n";
            } else if (Object.keys(fleet).length > 0) {
                text += "  └ 적 함대" + (visibility === 'composition' ? " (수량 불명)" : "") + ":\n";
                for (let shipType in fleet) {
                    let count = fleet[shipType];
                    if (count && count !== 0 && count !== '0') {
                        let shipName = getShipName(shipType);
                        text += "    - " + shipName + ": " + count + "\n";
                    }
                }
            }
            hasActivity = true;
        }
        
        // 함대 슬롯 정보
        if (data.fleetSlots) {
            text += "\n[함대 슬롯] " + data.fleetSlots.used + "/" + data.fleetSlots.max;
        }
    }
    
    if (!hasActivity) {
        text += "\n진행중인 작업 없음";
    }
    
    msg.reply(text);
}

// ==================== 랭킹 명령어 ====================

function cmdRanking(msg, senderHash, args) {
    let token = getValidToken(senderHash);
    if (!token) {
        msg.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    let type = "total";
    if (args.length > 0) {
        let typeArg = args[0].toLowerCase();
        if (typeArg === "건설") type = "construction";
        else if (typeArg === "연구") type = "research";
        else if (typeArg === "함대") type = "fleet";
    }
    
    let result = apiGetRanking(token, type);
    if (!result.success) {
        msg.reply("[오류] 랭킹 조회 실패");
        return;
    }
    
    let data = result.data;
    let ranking = data.ranking || [];
    
    let typeName = type === "total" ? "종합" : 
                   type === "construction" ? "건설" : 
                   type === "research" ? "연구" : "함대";
    
    let text = "[" + typeName + " 랭킹]\n\n";
    
    for (let i = 0; i < Math.min(10, ranking.length); i++) {
        let r = ranking[i];
        text += (i + 1) + ". " + r.playerName + " (" + formatNumber(r.totalScore || r.score) + ")\n";
    }
    
    if (ranking.length === 0) {
        text += "랭킹 정보 없음";
    }
    
    msg.reply(text);
}

// ==================== 건설 명령어 ====================

function cmdBuild(msg, senderHash, args) {
    let token = getValidToken(senderHash);
    if (!token) {
        msg.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    if (args.length < 1) {
        msg.reply("[건설 명령어]\n!건설 [건물명]\n!건설확인\n!건설취소\n\n건물명:\n메탈광산(메광), 크리스탈광산(크광)\n듀테륨광산(듀광), 태양광발전소(태발)\n핵융합로(핵융), 로봇공장(로공)\n조선소, 연구소(연소), 나노공장(나공)");
        return;
    }
    
    let buildingType = toCode(args[0], BUILDING_MAP);
    
    let result = apiStartBuild(token, buildingType);
    if (!result.success || result.data.error || result.data.message && result.data.statusCode) {
        let errMsg = result.data && result.data.message ? result.data.message : "건설 시작 실패";
        msg.reply("[오류] " + errMsg);
        return;
    }
    
    let data = result.data;
    let buildName = toKorean(data.building || buildingType);
    let level = data.targetLevel || (data.currentLevel ? data.currentLevel + 1 : "?");
    let buildTime = data.constructionTime || data.buildTime || 0;
    msg.reply("[건설 시작]\n" + 
              buildName + " Lv." + level + "\n" +
              "완료시간: " + formatTime(buildTime));
}

function cmdBuildComplete(msg, senderHash) {
    let token = getValidToken(senderHash);
    if (!token) {
        msg.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    let result = apiCompleteBuild(token);
    if (!result.success || result.data.error || result.data.statusCode) {
        let errMsg = result.data && result.data.message ? result.data.message : "건설 완료 처리 실패";
        msg.reply("[오류] " + errMsg);
        return;
    }
    
    msg.reply("[건설 완료] " + (result.data.message || "완료되었습니다."));
}

function cmdBuildCancel(msg, senderHash) {
    let token = getValidToken(senderHash);
    if (!token) {
        msg.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    let result = apiCancelBuild(token);
    if (!result.success || result.data.error || result.data.statusCode) {
        let errMsg = result.data && result.data.message ? result.data.message : "건설 취소 실패";
        msg.reply("[오류] " + errMsg);
        return;
    }
    
    msg.reply("[건설 취소됨] " + (result.data.message || "취소되었습니다."));
}

// ==================== 연구 명령어 ====================

function cmdResearchStart(msg, senderHash, args) {
    let token = getValidToken(senderHash);
    if (!token) {
        msg.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    let researchType = toCode(args[0], RESEARCH_MAP);
    
    let result = apiStartResearch(token, researchType);
    if (!result.success || result.data.error || result.data.statusCode) {
        let errMsg = result.data && result.data.message ? result.data.message : "연구 시작 실패";
        msg.reply("[오류] " + errMsg);
        return;
    }
    
    let data = result.data;
    let researchName = toKorean(data.research || researchType);
    let level = data.targetLevel || (data.currentLevel ? data.currentLevel + 1 : "?");
    msg.reply("[연구 시작]\n" + 
              researchName + " Lv." + level + "\n" +
              "완료시간: " + formatTime(data.researchTime || 0));
}

function cmdResearchComplete(msg, senderHash) {
    let token = getValidToken(senderHash);
    if (!token) {
        msg.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    let result = apiCompleteResearch(token);
    if (!result.success || result.data.error || result.data.statusCode) {
        let errMsg = result.data && result.data.message ? result.data.message : "연구 완료 처리 실패";
        msg.reply("[오류] " + errMsg);
        return;
    }
    
    msg.reply("[연구 완료] " + (result.data.message || "완료되었습니다."));
}

function cmdResearchCancel(msg, senderHash) {
    let token = getValidToken(senderHash);
    if (!token) {
        msg.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    let result = apiCancelResearch(token);
    if (!result.success || result.data.error || result.data.statusCode) {
        let errMsg = result.data && result.data.message ? result.data.message : "연구 취소 실패";
        msg.reply("[오류] " + errMsg);
        return;
    }
    
    msg.reply("[연구 취소됨] " + (result.data.message || "취소되었습니다."));
}

// ==================== 함대/방어 건조 명령어 ====================

function cmdFleetBuild(msg, senderHash, args) {
    let token = getValidToken(senderHash);
    if (!token) {
        msg.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    if (args.length < 2) {
        msg.reply("[함대 건조]\n!함대건조 [함선명] [수량]\n\n함선명:\n전투기(전투), 공격기(공격)\n구축함(구축), 순양함(순양), 전투순양함(전순)\n폭격기(폭격), 전함, 죽음의별(죽별)\n소형화물선(소화), 대형화물선(대화)\n식민선(식민), 수확선(수확), 무인정찰기(정찰)");
        return;
    }
    
    let fleetType = toCode(args[0], FLEET_MAP);
    let quantity = parseInt(args[1], 10);
    
    if (isNaN(quantity) || quantity < 1) {
        msg.reply("[오류] 수량은 1 이상의 숫자여야 합니다.");
        return;
    }
    
    let result = apiBuildFleet(token, fleetType, quantity);
    if (!result.success || result.data.error || result.data.statusCode) {
        let errMsg = result.data && result.data.message ? result.data.message : "함대 건조 실패";
        msg.reply("[오류] " + errMsg);
        return;
    }
    
    let data = result.data;
    let fleetName = toKorean(data.fleet || fleetType);
    msg.reply("[함대 건조 시작]\n" + 
              fleetName + " x" + quantity + "\n" +
              "완료시간: " + formatTime(data.totalBuildTime || data.buildTime || 0));
}

function cmdDefenseBuild(msg, senderHash, args) {
    let token = getValidToken(senderHash);
    if (!token) {
        msg.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    if (args.length < 2) {
        msg.reply("[방어시설 건조]\n!방시건조 [방어시설명] [수량]\n\n방어시설명:\n미사일발사대(미발), 경레이저포탑(경레)\n중레이저포탑(중레), 가우스포(가우스)\n이온포(이온), 플라즈마포탑(플포)\n소형보호막돔(소돔), 대형보호막돔(대돔)");
        return;
    }
    
    let defenseType = toCode(args[0], DEFENSE_MAP);
    let quantity = parseInt(args[1], 10);
    
    if (isNaN(quantity) || quantity < 1) {
        msg.reply("[오류] 수량은 1 이상의 숫자여야 합니다.");
        return;
    }
    
    let result = apiBuildDefense(token, defenseType, quantity);
    if (!result.success || result.data.error || result.data.statusCode) {
        let errMsg = result.data && result.data.message ? result.data.message : "방어시설 건조 실패";
        msg.reply("[오류] " + errMsg);
        return;
    }
    
    let data = result.data;
    let defenseName = toKorean(data.defense || defenseType);
    msg.reply("[방어시설 건조 시작]\n" + 
              defenseName + " x" + quantity + "\n" +
              "완료시간: " + formatTime(data.totalBuildTime || data.buildTime || 0));
}

// ==================== 전투 명령어 ====================

function cmdAttack(msg, senderHash, args) {
    let token = getValidToken(senderHash);
    if (!token) {
        msg.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    if (args.length < 3) {
        msg.reply("[공격 명령]\n!공격 [좌표] [함선명] [수량]\n\n예시: !공격 1:55:4 전투기 10\n\n여러 함선: 콤마로 구분\n!공격 1:55:4 전투기,순양함 10,5");
        return;
    }
    
    let targetCoord = args[0];
    let fleetNames = args[1].split(",");
    let fleetCounts = args[2].split(",");
    
    if (!/^\d+:\d+:\d+$/.test(targetCoord)) {
        msg.reply("[오류] 좌표 형식이 잘못되었습니다. 예: 1:55:4");
        return;
    }
    
    let fleet = {};
    for (let i = 0; i < fleetNames.length; i++) {
        let fleetCode = toCode(fleetNames[i], FLEET_MAP);
        let count = parseInt(fleetCounts[i] || fleetCounts[0], 10);
        if (count > 0) {
            fleet[fleetCode] = count;
        }
    }
    
    if (Object.keys(fleet).length === 0) {
        msg.reply("[오류] 함선을 지정해주세요.");
        return;
    }
    
    let result = apiAttack(token, targetCoord, fleet);
    if (!result.success || result.data.error || result.data.statusCode) {
        let errMsg = result.data && result.data.message ? result.data.message : "공격 실패";
        msg.reply("[오류] " + errMsg);
        return;
    }
    
    let data = result.data;
    msg.reply("[공격 출발!]\n목표: " + targetCoord + "\n도착까지: " + formatTime(data.travelTime || 0));
}

function cmdRecallFleet(msg, senderHash) {
    let token = getValidToken(senderHash);
    if (!token) {
        msg.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    let result = apiRecallFleet(token);
    if (!result.success || result.data.error || result.data.statusCode) {
        let errMsg = result.data && result.data.message ? result.data.message : "함대 귀환 실패";
        msg.reply("[오류] " + errMsg);
        return;
    }
    
    msg.reply("[함대 귀환 명령] " + (result.data.message || "귀환 중입니다."));
}

// ==================== 도움말 ====================

function cmdHelp(msg) {
    let text = "[XNOVA 봇 명령어]\n\n";
    
    text += "[계정]\n";
    text += "!연동 - 연동 방법\n";
    text += "!인증 [코드] - 계정 연동\n";
    text += "!해제 - 연동 해제\n\n";
    
    text += "[조회]\n";
    text += "!자원 / !건물 / !함대 / !방어\n";
    text += "!행성 / !상태 / !랭킹\n";
    text += "!전환 [번호] - 행성 전환\n\n";
    
    text += "[건설]\n";
    text += "!건설 메탈광산\n";
    text += "!건설확인 / !건설취소\n\n";
    
    text += "[연구]\n";
    text += "!연구 에너지공학\n";
    text += "!연구확인 / !연구취소\n\n";
    
    text += "[함대/방어]\n";
    text += "!함대건조 전투기 10\n";
    text += "!방시건조 미발 50\n";
    text += "!공격 1:55:4 전투기 10\n";
    text += "!함대귀환\n\n";
    
    text += "축약어: 메광/크광/듀광/태발/핵융\n";
    text += "전투/공격/구축/순양/전순/폭격/전함";
    
    msg.reply(text);
}

// ==================== 이벤트 리스너 등록 ====================
bot.addListener(Event.MESSAGE, onMessage);

// 초기 데이터 로드
loadData();

Log.i("XNOVA 봇이 시작되었습니다.");
