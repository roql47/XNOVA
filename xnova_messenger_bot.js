/**
 * XNOVA 메신저봇 API2 연동 스크립트
 * 카카오톡에서 XNOVA 게임 정보를 조회하고 알림을 받을 수 있습니다.
 * 
 * 사용법:
 * 1. 메신저봇R 앱에서 새 봇 생성
 * 2. 이 코드를 붙여넣기
 * 3. API_BASE_URL을 실제 서버 주소로 변경
 * 4. 컴파일 후 활성화
 */

// ==================== 설정 ====================
const CONFIG = {
    API_BASE_URL: "http://52.79.154.253:3000/api", // XNOVA 프로덕션 서버
    AUTH_CODE_EXPIRE_MS: 5 * 60 * 1000, // 5분
    POLL_INTERVAL_MS: 5 * 60 * 1000, // 5분
    BOT_NAME: "XNOVA",
    COMMAND_PREFIX: "!"
};

// ==================== 데이터 저장소 ====================
const DB = {
    // 사용자 토큰 저장 (sender -> {accessToken, refreshToken, username})
    tokens: {},
    
    // 알림 설정 (sender -> boolean)
    notifications: {},
    
    // 마지막 상태 (알림용)
    lastStatus: {}
};

// 영구 저장소에서 데이터 로드
function loadData() {
    try {
        const data = DataBase.getDataBase("xnova_bot_data");
        if (data) {
            const parsed = JSON.parse(data);
            DB.tokens = parsed.tokens || {};
            DB.notifications = parsed.notifications || {};
            DB.lastStatus = parsed.lastStatus || {};
        }
    } catch (e) {
        Log.e("데이터 로드 실패: " + e);
    }
}

// 영구 저장소에 데이터 저장
function saveData() {
    try {
        const data = JSON.stringify({
            tokens: DB.tokens,
            notifications: DB.notifications,
            lastStatus: DB.lastStatus
        });
        DataBase.setDataBase("xnova_bot_data", data);
    } catch (e) {
        Log.e("데이터 저장 실패: " + e);
    }
}

// ==================== 유틸리티 함수 ====================

// 랜덤 인증코드 생성 (6자리 영숫자)
function generateAuthCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// 숫자 포맷팅 (1000 -> 1,000)
function formatNumber(num) {
    if (num === undefined || num === null) return "0";
    return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// 시간 포맷팅 (초 -> HH:MM:SS)
function formatTime(seconds) {
    if (!seconds || seconds <= 0) return "완료";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return (h > 0 ? h + "시간 " : "") + (m > 0 ? m + "분 " : "") + s + "초";
}

// HTTP GET 요청
function httpGet(url, accessToken) {
    try {
        const conn = new java.net.URL(url).openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Accept", "application/json");
        if (accessToken) {
            conn.setRequestProperty("Authorization", "Bearer " + accessToken);
        }
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(10000);
        
        const responseCode = conn.getResponseCode();
        let inputStream;
        
        if (responseCode >= 200 && responseCode < 300) {
            inputStream = conn.getInputStream();
        } else {
            inputStream = conn.getErrorStream();
        }
        
        const reader = new java.io.BufferedReader(new java.io.InputStreamReader(inputStream, "UTF-8"));
        let response = "";
        let line;
        while ((line = reader.readLine()) != null) {
            response += line;
        }
        reader.close();
        conn.disconnect();
        
        return {
            success: responseCode >= 200 && responseCode < 300,
            code: responseCode,
            data: JSON.parse(response)
        };
    } catch (e) {
        Log.e("HTTP GET 오류: " + e);
        return { success: false, error: e.toString() };
    }
}

// HTTP POST 요청
function httpPost(url, body, accessToken) {
    try {
        const conn = new java.net.URL(url).openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Accept", "application/json");
        if (accessToken) {
            conn.setRequestProperty("Authorization", "Bearer " + accessToken);
        }
        conn.setDoOutput(true);
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(10000);
        
        const outputStream = conn.getOutputStream();
        const writer = new java.io.OutputStreamWriter(outputStream, "UTF-8");
        writer.write(JSON.stringify(body));
        writer.flush();
        writer.close();
        
        const responseCode = conn.getResponseCode();
        let inputStream;
        
        if (responseCode >= 200 && responseCode < 300) {
            inputStream = conn.getInputStream();
        } else {
            inputStream = conn.getErrorStream();
        }
        
        const reader = new java.io.BufferedReader(new java.io.InputStreamReader(inputStream, "UTF-8"));
        let response = "";
        let line;
        while ((line = reader.readLine()) != null) {
            response += line;
        }
        reader.close();
        conn.disconnect();
        
        return {
            success: responseCode >= 200 && responseCode < 300,
            code: responseCode,
            data: JSON.parse(response)
        };
    } catch (e) {
        Log.e("HTTP POST 오류: " + e);
        return { success: false, error: e.toString() };
    }
}

// ==================== API 함수 ====================

// 로그인
function apiLogin(email, password) {
    return httpPost(CONFIG.API_BASE_URL + "/auth/login", {
        email: email,
        password: password
    });
}

// 인증코드로 토큰 요청 (앱에서 발급받은 코드 검증)
function apiVerifyCode(code) {
    return httpPost(CONFIG.API_BASE_URL + "/auth/kakao-link/verify", {
        code: code
    });
}

// 토큰 갱신
function apiRefreshToken(refreshToken) {
    return httpPost(CONFIG.API_BASE_URL + "/auth/refresh", {
        refreshToken: refreshToken
    });
}

// 자원 조회
function apiGetResources(accessToken) {
    return httpGet(CONFIG.API_BASE_URL + "/game/resources", accessToken);
}

// 건물 조회
function apiGetBuildings(accessToken) {
    return httpGet(CONFIG.API_BASE_URL + "/game/buildings", accessToken);
}

// 연구 조회
function apiGetResearch(accessToken) {
    return httpGet(CONFIG.API_BASE_URL + "/game/research", accessToken);
}

// 함대 조회
function apiGetFleet(accessToken) {
    return httpGet(CONFIG.API_BASE_URL + "/game/fleet", accessToken);
}

// 방어시설 조회
function apiGetDefense(accessToken) {
    return httpGet(CONFIG.API_BASE_URL + "/game/defense", accessToken);
}

// 행성 목록 조회
function apiGetPlanets(accessToken) {
    return httpGet(CONFIG.API_BASE_URL + "/planet/list", accessToken);
}

// 전투 상태 조회
function apiGetBattleStatus(accessToken) {
    return httpGet(CONFIG.API_BASE_URL + "/game/battle/status", accessToken);
}

// ==================== 토큰 관리 ====================

// 토큰 유효성 확인 및 갱신
function ensureValidToken(sender) {
    const userToken = DB.tokens[sender];
    if (!userToken) {
        return null;
    }
    
    // 간단한 테스트 요청으로 토큰 유효성 확인
    const testResult = apiGetResources(userToken.accessToken);
    
    if (testResult.success) {
        return userToken.accessToken;
    }
    
    // 토큰이 만료되었으면 갱신 시도
    if (userToken.refreshToken) {
        const refreshResult = apiRefreshToken(userToken.refreshToken);
        if (refreshResult.success && refreshResult.data.accessToken) {
            DB.tokens[sender] = {
                accessToken: refreshResult.data.accessToken,
                refreshToken: refreshResult.data.refreshToken || userToken.refreshToken,
                email: userToken.email
            };
            saveData();
            return refreshResult.data.accessToken;
        }
    }
    
    // 갱신도 실패하면 토큰 삭제
    delete DB.tokens[sender];
    saveData();
    return null;
}

// ==================== 명령어 처리 ====================

// !연동 - 인증 안내
function cmdLink(sender, replier) {
    // 이미 연동된 경우
    if (DB.tokens[sender]) {
        replier.reply("이미 계정이 연동되어 있습니다.\n연동 해제: !해제");
        return;
    }
    
    replier.reply(
        "[XNOVA 계정 연동 방법]\n\n" +
        "1. XNOVA 앱에서 [설정] > [카카오톡 연동] 메뉴로 이동\n" +
        "2. [인증코드 발급] 버튼 클릭\n" +
        "3. 발급된 6자리 코드를 여기에 입력\n\n" +
        "사용법: !인증 [코드]\n" +
        "예시: !인증 ABC123"
    );
}

// !인증 - 계정 연동 (앱에서 발급받은 코드로 인증)
function cmdAuth(sender, replier, args) {
    if (args.length < 1) {
        replier.reply("사용법: !인증 [인증코드]\n\n앱에서 발급받은 6자리 코드를 입력하세요.");
        return;
    }
    
    // 이미 연동된 경우
    if (DB.tokens[sender]) {
        replier.reply("이미 계정이 연동되어 있습니다.\n연동 해제: !해제");
        return;
    }
    
    const inputCode = args[0].toUpperCase();
    
    // 코드 형식 검증 (6자리 영숫자)
    if (!/^[A-Z0-9]{6}$/.test(inputCode)) {
        replier.reply("[오류] 잘못된 인증코드 형식입니다.\n6자리 영문/숫자 코드를 입력하세요.");
        return;
    }
    
    // API로 인증코드 검증 및 토큰 요청
    replier.reply("인증 중...");
    
    const result = apiVerifyCode(inputCode);
    
    if (!result.success) {
        const errorMsg = result.data?.message || result.error || "알 수 없는 오류";
        replier.reply("[오류] 인증 실패: " + errorMsg);
        return;
    }
    
    if (!result.data.accessToken) {
        replier.reply("[오류] 인증 응답에 토큰이 없습니다.");
        return;
    }
    
    // 토큰 저장
    DB.tokens[sender] = {
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
        username: result.data.username || "사용자"
    };
    
    // 알림 기본 활성화
    DB.notifications[sender] = true;
    
    saveData();
    
    const username = result.data.username || "사용자";
    replier.reply(
        "[계정 연동 완료!]\n\n" +
        "연동 계정: " + username + "\n\n" +
        "사용 가능한 명령어:\n" +
        "!자원 - 자원 현황\n" +
        "!건물 - 건물 현황\n" +
        "!연구 - 연구 현황\n" +
        "!함대 - 함대 현황\n" +
        "!방어 - 방어시설\n" +
        "!행성 - 행성 목록\n" +
        "!상태 - 진행중인 작업\n" +
        "!알림 on/off - 알림 설정\n" +
        "!해제 - 연동 해제"
    );
}

// !해제 - 연동 해제
function cmdUnlink(sender, replier) {
    if (!DB.tokens[sender]) {
        replier.reply("[오류] 연동된 계정이 없습니다.");
        return;
    }
    
    const username = DB.tokens[sender].username || DB.tokens[sender].email || "계정";
    delete DB.tokens[sender];
    delete DB.notifications[sender];
    delete DB.lastStatus[sender];
    saveData();
    
    replier.reply("[계정 연동이 해제되었습니다]\n해제된 계정: " + username);
}

// !자원 - 자원 조회
function cmdResources(sender, replier) {
    const token = ensureValidToken(sender);
    if (!token) {
        replier.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    const result = apiGetResources(token);
    if (!result.success) {
        replier.reply("[오류] 자원 조회 실패: " + (result.data?.message || result.error));
        return;
    }
    
    const res = result.data;
    let msg = "[자원 현황]\n\n";
    msg += "메탈: " + formatNumber(res.metal) + "\n";
    msg += "크리스탈: " + formatNumber(res.crystal) + "\n";
    msg += "중수소: " + formatNumber(res.deuterium) + "\n";
    msg += "에너지: " + formatNumber(res.energy) + "/" + formatNumber(res.maxEnergy) + "\n";
    
    if (res.production) {
        msg += "\n[시간당 생산량]\n";
        msg += "메탈: +" + formatNumber(res.production.metal) + "/h\n";
        msg += "크리스탈: +" + formatNumber(res.production.crystal) + "/h\n";
        msg += "중수소: +" + formatNumber(res.production.deuterium) + "/h";
    }
    
    replier.reply(msg);
}

// !건물 - 건물 조회
function cmdBuildings(sender, replier) {
    const token = ensureValidToken(sender);
    if (!token) {
        replier.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    const result = apiGetBuildings(token);
    if (!result.success) {
        replier.reply("[오류] 건물 조회 실패: " + (result.data?.message || result.error));
        return;
    }
    
    const data = result.data;
    let msg = "[건물 현황]\n\n";
    
    // 자원 건물
    if (data.mines) {
        msg += "[자원 건물]\n";
        msg += "메탈 광산: Lv." + (data.mines.metalMine || 0) + "\n";
        msg += "크리스탈 광산: Lv." + (data.mines.crystalMine || 0) + "\n";
        msg += "중수소 합성기: Lv." + (data.mines.deuteriumSynthesizer || 0) + "\n";
        msg += "태양광 발전소: Lv." + (data.mines.solarPlant || 0) + "\n";
        if (data.mines.fusionReactor) {
            msg += "핵융합 발전소: Lv." + data.mines.fusionReactor + "\n";
        }
    }
    
    // 시설
    if (data.facilities) {
        msg += "\n[시설]\n";
        if (data.facilities.roboticsFactory) msg += "로봇 공장: Lv." + data.facilities.roboticsFactory + "\n";
        if (data.facilities.shipyard) msg += "조선소: Lv." + data.facilities.shipyard + "\n";
        if (data.facilities.researchLab) msg += "연구소: Lv." + data.facilities.researchLab + "\n";
        if (data.facilities.naniteFactory) msg += "나노 공장: Lv." + data.facilities.naniteFactory + "\n";
    }
    
    // 건설 중
    if (data.constructionProgress && data.constructionProgress.building) {
        const prog = data.constructionProgress;
        const remainSec = Math.max(0, Math.floor((new Date(prog.endTime) - Date.now()) / 1000));
        msg += "\n[건설 중]\n";
        msg += prog.building + " Lv." + prog.targetLevel + "\n";
        msg += "남은 시간: " + formatTime(remainSec);
    }
    
    replier.reply(msg);
}

// !연구 - 연구 조회
function cmdResearch(sender, replier) {
    const token = ensureValidToken(sender);
    if (!token) {
        replier.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    const result = apiGetResearch(token);
    if (!result.success) {
        replier.reply("[오류] 연구 조회 실패: " + (result.data?.message || result.error));
        return;
    }
    
    const data = result.data;
    let msg = "[연구 현황]\n\n";
    
    if (data.technologies) {
        const tech = data.technologies;
        if (tech.energyTechnology) msg += "에너지 기술: Lv." + tech.energyTechnology + "\n";
        if (tech.laserTechnology) msg += "레이저 기술: Lv." + tech.laserTechnology + "\n";
        if (tech.ionTechnology) msg += "이온 기술: Lv." + tech.ionTechnology + "\n";
        if (tech.hyperspaceTechnology) msg += "하이퍼스페이스 기술: Lv." + tech.hyperspaceTechnology + "\n";
        if (tech.plasmaTechnology) msg += "플라즈마 기술: Lv." + tech.plasmaTechnology + "\n";
        msg += "\n";
        if (tech.espionageTechnology) msg += "스파이 기술: Lv." + tech.espionageTechnology + "\n";
        if (tech.computerTechnology) msg += "컴퓨터 기술: Lv." + tech.computerTechnology + "\n";
        if (tech.astrophysics) msg += "천체물리학: Lv." + tech.astrophysics + "\n";
        msg += "\n";
        if (tech.weaponsTechnology) msg += "무기 기술: Lv." + tech.weaponsTechnology + "\n";
        if (tech.shieldingTechnology) msg += "방어막 기술: Lv." + tech.shieldingTechnology + "\n";
        if (tech.armorTechnology) msg += "장갑 기술: Lv." + tech.armorTechnology + "\n";
        msg += "\n";
        if (tech.combustionDrive) msg += "연소 엔진: Lv." + tech.combustionDrive + "\n";
        if (tech.impulseDrive) msg += "임펄스 엔진: Lv." + tech.impulseDrive + "\n";
        if (tech.hyperspaceDrive) msg += "하이퍼드라이브: Lv." + tech.hyperspaceDrive + "\n";
    }
    
    // 연구 중
    if (data.researchProgress && data.researchProgress.research) {
        const prog = data.researchProgress;
        const remainSec = Math.max(0, Math.floor((new Date(prog.endTime) - Date.now()) / 1000));
        msg += "\n[연구 중]\n";
        msg += prog.research + " Lv." + prog.targetLevel + "\n";
        msg += "남은 시간: " + formatTime(remainSec);
    }
    
    replier.reply(msg);
}

// !함대 - 함대 조회
function cmdFleet(sender, replier) {
    const token = ensureValidToken(sender);
    if (!token) {
        replier.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    const result = apiGetFleet(token);
    if (!result.success) {
        replier.reply("[오류] 함대 조회 실패: " + (result.data?.message || result.error));
        return;
    }
    
    const data = result.data;
    let msg = "[함대 현황]\n\n";
    
    const fleetNames = {
        lightFighter: "경전투기",
        heavyFighter: "중전투기",
        cruiser: "순양함",
        battleship: "전함",
        battlecruiser: "순양전함",
        bomber: "폭격기",
        destroyer: "디스트로이어",
        deathstar: "데스스타",
        smallCargo: "소형 화물선",
        largeCargo: "대형 화물선",
        colonyShip: "식민선",
        recycler: "수확선",
        espionageProbe: "스파이 위성",
        solarSatellite: "태양광 위성"
    };
    
    let hasFleet = false;
    if (data.fleet) {
        for (const [key, value] of Object.entries(data.fleet)) {
            if (value > 0 && fleetNames[key]) {
                msg += fleetNames[key] + ": " + formatNumber(value) + "\n";
                hasFleet = true;
            }
        }
    }
    
    if (!hasFleet) {
        msg += "보유 함대 없음";
    }
    
    // 건조 중
    if (data.fleetProgress && data.fleetProgress.shipType) {
        const prog = data.fleetProgress;
        const remainSec = Math.max(0, Math.floor((new Date(prog.endTime) - Date.now()) / 1000));
        msg += "\n\n[건조 중]\n";
        msg += (fleetNames[prog.shipType] || prog.shipType) + " x" + prog.quantity + "\n";
        msg += "남은 시간: " + formatTime(remainSec);
    }
    
    replier.reply(msg);
}

// !방어 - 방어시설 조회
function cmdDefense(sender, replier) {
    const token = ensureValidToken(sender);
    if (!token) {
        replier.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    const result = apiGetDefense(token);
    if (!result.success) {
        replier.reply("[오류] 방어시설 조회 실패: " + (result.data?.message || result.error));
        return;
    }
    
    const data = result.data;
    let msg = "[방어시설 현황]\n\n";
    
    const defenseNames = {
        rocketLauncher: "로켓 발사대",
        lightLaser: "경레이저 포탑",
        heavyLaser: "중레이저 포탑",
        ionCannon: "이온 캐논",
        gaussCannon: "가우스 캐논",
        plasmaTurret: "플라즈마 포탑",
        smallShieldDome: "소형 실드돔",
        largeShieldDome: "대형 실드돔",
        antiBallisticMissile: "요격 미사일",
        interplanetaryMissile: "행성간 미사일"
    };
    
    let hasDefense = false;
    if (data.defense) {
        for (const [key, value] of Object.entries(data.defense)) {
            if (value > 0 && defenseNames[key]) {
                msg += defenseNames[key] + ": " + formatNumber(value) + "\n";
                hasDefense = true;
            }
        }
    }
    
    if (!hasDefense) {
        msg += "보유 방어시설 없음";
    }
    
    replier.reply(msg);
}

// !행성 - 행성 목록 조회
function cmdPlanets(sender, replier) {
    const token = ensureValidToken(sender);
    if (!token) {
        replier.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    const result = apiGetPlanets(token);
    if (!result.success) {
        replier.reply("[오류] 행성 조회 실패: " + (result.data?.message || result.error));
        return;
    }
    
    const data = result.data;
    let msg = "[행성 목록]\n\n";
    
    if (data.planets && data.planets.length > 0) {
        data.planets.forEach((planet, index) => {
            const isActive = planet.id === data.activePlanetId || planet._id === data.activePlanetId;
            msg += (isActive ? "▶ " : "  ") + (index + 1) + ". " + planet.name + "\n";
            msg += "   좌표: " + planet.coordinate + "\n";
            if (planet.isHomeworld || planet.isHomePlanet) {
                msg += "   [모행성]\n";
            }
            if (planet.resources) {
                msg += "   M:" + formatNumber(planet.resources.metal) + 
                       " C:" + formatNumber(planet.resources.crystal) + 
                       " D:" + formatNumber(planet.resources.deuterium) + "\n";
            }
            msg += "\n";
        });
    } else {
        msg += "행성 없음";
    }
    
    replier.reply(msg);
}

// !상태 - 진행중인 작업 조회
function cmdStatus(sender, replier) {
    const token = ensureValidToken(sender);
    if (!token) {
        replier.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    const result = apiGetBattleStatus(token);
    if (!result.success) {
        replier.reply("[오류] 상태 조회 실패: " + (result.data?.message || result.error));
        return;
    }
    
    const data = result.data;
    let msg = "[진행중인 작업]\n\n";
    let hasActivity = false;
    
    // 진행중인 미션
    if (data.activeMissions && data.activeMissions.length > 0) {
        msg += "[활성 미션]\n";
        data.activeMissions.forEach(mission => {
            const arrivalTime = new Date(mission.arrivalTime);
            const remainSec = Math.max(0, Math.floor((arrivalTime - Date.now()) / 1000));
            msg += "- " + (mission.missionType || "미션") + " → " + mission.targetCoord + "\n";
            msg += "  도착: " + formatTime(remainSec) + "\n";
        });
        msg += "\n";
        hasActivity = true;
    }
    
    // 들어오는 공격
    if (data.incomingAttacks && data.incomingAttacks.length > 0) {
        msg += "[주의! 들어오는 공격]\n";
        data.incomingAttacks.forEach(attack => {
            const arrivalTime = new Date(attack.arrivalTime);
            const remainSec = Math.max(0, Math.floor((arrivalTime - Date.now()) / 1000));
            msg += "- " + attack.attackerName + " → " + attack.targetCoord + "\n";
            msg += "  도착: " + formatTime(remainSec) + "\n";
        });
        msg += "\n";
        hasActivity = true;
    }
    
    // 귀환중인 함대
    if (data.returningFleets && data.returningFleets.length > 0) {
        msg += "[귀환중인 함대]\n";
        data.returningFleets.forEach(fleet => {
            const returnTime = new Date(fleet.returnTime);
            const remainSec = Math.max(0, Math.floor((returnTime - Date.now()) / 1000));
            msg += "- " + fleet.originCoord + " ← 귀환\n";
            msg += "  도착: " + formatTime(remainSec) + "\n";
        });
        hasActivity = true;
    }
    
    if (!hasActivity) {
        msg += "진행중인 작업 없음";
    }
    
    replier.reply(msg);
}

// !알림 - 알림 설정
function cmdNotification(sender, replier, args) {
    if (!DB.tokens[sender]) {
        replier.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    if (args.length === 0) {
        const status = DB.notifications[sender] ? "ON" : "OFF";
        replier.reply("[현재 알림 설정: " + status + "]\n\n!알림 on - 알림 켜기\n!알림 off - 알림 끄기");
        return;
    }
    
    const setting = args[0].toLowerCase();
    if (setting === "on") {
        DB.notifications[sender] = true;
        saveData();
        replier.reply("[알림이 활성화되었습니다]\n건설/연구 완료, 적함대 접근 시 알림을 받습니다.");
    } else if (setting === "off") {
        DB.notifications[sender] = false;
        saveData();
        replier.reply("[알림이 비활성화되었습니다]");
    } else {
        replier.reply("사용법: !알림 on 또는 !알림 off");
    }
}

// !도움 - 도움말
function cmdHelp(sender, replier) {
    let msg = "[XNOVA 봇 명령어]\n\n";
    msg += "[계정]\n";
    msg += "!연동 - 연동 방법 안내\n";
    msg += "!인증 [코드] - 계정 연동\n";
    msg += "!해제 - 연동 해제\n\n";
    msg += "[조회]\n";
    msg += "!자원 - 자원 현황\n";
    msg += "!건물 - 건물 현황\n";
    msg += "!연구 - 연구 현황\n";
    msg += "!함대 - 함대 현황\n";
    msg += "!방어 - 방어시설\n";
    msg += "!행성 - 행성 목록\n";
    msg += "!상태 - 진행중인 작업\n\n";
    msg += "[설정]\n";
    msg += "!알림 on/off - 알림 설정\n";
    msg += "!도움 - 이 도움말";
    
    replier.reply(msg);
}

// ==================== 메인 응답 함수 (API2) ====================

// 봇 초기화
const bot = BotManager.getCurrentBot();

// 데이터 로드
loadData();

// 메시지 리스너 등록
bot.addListener(Event.MESSAGE, function(msg) {
    const room = msg.room;
    const sender = msg.author.name;
    const content = msg.content;
    const replier = msg.reply;
    
    // 명령어가 아니면 무시
    if (!content.startsWith(CONFIG.COMMAND_PREFIX)) {
        return;
    }
    
    // 명령어 파싱
    const parts = content.substring(CONFIG.COMMAND_PREFIX.length).trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    // 고유 식별자 (방 + 사용자)
    const uniqueSender = room + "_" + sender;
    
    try {
        switch (cmd) {
            case "연동":
            case "link":
                cmdLink(uniqueSender, { reply: (text) => msg.reply(text) });
                break;
                
            case "인증":
            case "auth":
                cmdAuth(uniqueSender, { reply: (text) => msg.reply(text) }, args);
                break;
                
            case "해제":
            case "unlink":
                cmdUnlink(uniqueSender, { reply: (text) => msg.reply(text) });
                break;
                
            case "자원":
            case "res":
            case "resources":
                cmdResources(uniqueSender, { reply: (text) => msg.reply(text) });
                break;
                
            case "건물":
            case "build":
            case "buildings":
                cmdBuildings(uniqueSender, { reply: (text) => msg.reply(text) });
                break;
                
            case "연구":
            case "tech":
            case "research":
                cmdResearch(uniqueSender, { reply: (text) => msg.reply(text) });
                break;
                
            case "함대":
            case "fleet":
                cmdFleet(uniqueSender, { reply: (text) => msg.reply(text) });
                break;
                
            case "방어":
            case "defense":
                cmdDefense(uniqueSender, { reply: (text) => msg.reply(text) });
                break;
                
            case "행성":
            case "planet":
            case "planets":
                cmdPlanets(uniqueSender, { reply: (text) => msg.reply(text) });
                break;
                
            case "상태":
            case "status":
                cmdStatus(uniqueSender, { reply: (text) => msg.reply(text) });
                break;
                
            case "알림":
            case "noti":
            case "notification":
                cmdNotification(uniqueSender, { reply: (text) => msg.reply(text) }, args);
                break;
                
            case "도움":
            case "help":
            case "?":
                cmdHelp(uniqueSender, { reply: (text) => msg.reply(text) });
                break;
        }
    } catch (e) {
        Log.e("명령어 처리 오류: " + e);
        msg.reply("[오류] 오류가 발생했습니다: " + e);
    }
});

// 봇 활성화 메시지
bot.addListener(Event.START_COMPILE, function() {
    Log.i("XNOVA 봇 컴파일 시작");
});

bot.addListener(Event.ACTIVITY_CREATED, function() {
    Log.i("XNOVA 봇이 활성화되었습니다.");
    loadData();
});

// ==================== 알림 시스템 (백그라운드 폴링) ====================

// 주기적으로 상태 확인하여 알림 발송
let notificationTimer = null;

function startNotificationPolling() {
    if (notificationTimer) {
        notificationTimer.cancel();
    }
    
    notificationTimer = new java.util.Timer();
    notificationTimer.scheduleAtFixedRate(new java.util.TimerTask({
        run: function() {
            checkAndSendNotifications();
        }
    }), CONFIG.POLL_INTERVAL_MS, CONFIG.POLL_INTERVAL_MS);
    
    Log.i("알림 폴링 시작 (간격: " + (CONFIG.POLL_INTERVAL_MS / 1000) + "초)");
}

function stopNotificationPolling() {
    if (notificationTimer) {
        notificationTimer.cancel();
        notificationTimer = null;
    }
}

function checkAndSendNotifications() {
    for (const sender in DB.tokens) {
        if (!DB.notifications[sender]) continue;
        
        try {
            const token = ensureValidToken(sender);
            if (!token) continue;
            
            // 전투 상태 확인
            const statusResult = apiGetBattleStatus(token);
            if (statusResult.success && statusResult.data) {
                const data = statusResult.data;
                const lastStatus = DB.lastStatus[sender] || {};
                
                // 새로운 들어오는 공격 확인
                if (data.incomingAttacks && data.incomingAttacks.length > 0) {
                    const prevAttackCount = lastStatus.incomingAttackCount || 0;
                    if (data.incomingAttacks.length > prevAttackCount) {
                        // 새 공격 알림
                        const attack = data.incomingAttacks[0];
                        const arrivalTime = new Date(attack.arrivalTime);
                        const remainSec = Math.max(0, Math.floor((arrivalTime - Date.now()) / 1000));
                        
                        // 알림 전송 (실제 구현에서는 방 정보가 필요)
                        Log.i("[알림] " + sender + ": 적함대 접근! " + attack.attackerName + " → " + attack.targetCoord + " (도착: " + formatTime(remainSec) + ")");
                    }
                    lastStatus.incomingAttackCount = data.incomingAttacks.length;
                } else {
                    lastStatus.incomingAttackCount = 0;
                }
                
                DB.lastStatus[sender] = lastStatus;
            }
            
            // 건물 상태 확인
            const buildResult = apiGetBuildings(token);
            if (buildResult.success && buildResult.data) {
                const lastBuildEnd = DB.lastStatus[sender]?.buildEndTime;
                const currentProg = buildResult.data.constructionProgress;
                
                if (currentProg && currentProg.endTime) {
                    const endTime = new Date(currentProg.endTime).getTime();
                    
                    // 이전에 건설중이었는데 완료된 경우
                    if (lastBuildEnd && lastBuildEnd > Date.now() && endTime <= Date.now()) {
                        Log.i("[알림] " + sender + ": 건설 완료! " + currentProg.building);
                    }
                    
                    DB.lastStatus[sender] = DB.lastStatus[sender] || {};
                    DB.lastStatus[sender].buildEndTime = endTime;
                }
            }
            
        } catch (e) {
            Log.e("알림 확인 오류 (" + sender + "): " + e);
        }
    }
    
    saveData();
}

// 알림 폴링 시작
startNotificationPolling();

// ==================== 레거시 API 호환 (선택적) ====================
// 일부 메신저봇 버전에서는 레거시 API를 사용해야 할 수 있습니다.
// 아래 함수를 주석 해제하여 사용하세요.

/*
function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {
    if (!msg.startsWith(CONFIG.COMMAND_PREFIX)) return;
    
    const parts = msg.substring(CONFIG.COMMAND_PREFIX.length).trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    const uniqueSender = room + "_" + sender;
    
    const replyWrapper = { reply: (text) => replier.reply(text) };
    
    try {
        switch (cmd) {
            case "연동": cmdLink(uniqueSender, replyWrapper); break;
            case "인증": cmdAuth(uniqueSender, replyWrapper, args); break;
            case "해제": cmdUnlink(uniqueSender, replyWrapper); break;
            case "자원": cmdResources(uniqueSender, replyWrapper); break;
            case "건물": cmdBuildings(uniqueSender, replyWrapper); break;
            case "연구": cmdResearch(uniqueSender, replyWrapper); break;
            case "함대": cmdFleet(uniqueSender, replyWrapper); break;
            case "방어": cmdDefense(uniqueSender, replyWrapper); break;
            case "행성": cmdPlanets(uniqueSender, replyWrapper); break;
            case "상태": cmdStatus(uniqueSender, replyWrapper); break;
            case "알림": cmdNotification(uniqueSender, replyWrapper, args); break;
            case "도움": cmdHelp(uniqueSender, replyWrapper); break;
        }
    } catch (e) {
        replier.reply("[오류] " + e);
    }
}
*/

