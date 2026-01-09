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

function apiGetBattleStatus(token) {
    return httpGet(CONFIG.API_BASE_URL + "/game/battle/status", token);
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
                cmdResearch(msg, senderHash);
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
            case "상태":
            case "status":
                cmdStatus(msg, senderHash);
                break;
            case "도움":
            case "help":
            case "?":
                cmdHelp(msg);
                break;
            case "테스트":
                msg.reply("XNOVA 봇이 정상 작동합니다!");
                break;
            case "해시":
                msg.reply("해시: " + senderHash);
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
    
    let res = result.data;
    let text = "[자원 현황]\n\n";
    text += "메탈: " + formatNumber(res.metal) + "\n";
    text += "크리스탈: " + formatNumber(res.crystal) + "\n";
    text += "중수소: " + formatNumber(res.deuterium) + "\n";
    text += "에너지: " + formatNumber(res.energy) + "/" + formatNumber(res.maxEnergy);
    
    if (res.production) {
        text += "\n\n[생산량/시간]\n";
        text += "M: +" + formatNumber(res.production.metal) + "\n";
        text += "C: +" + formatNumber(res.production.crystal) + "\n";
        text += "D: +" + formatNumber(res.production.deuterium);
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
    
    if (data.mines) {
        text += "메탈광산: Lv." + (data.mines.metalMine || 0) + "\n";
        text += "크리스탈광산: Lv." + (data.mines.crystalMine || 0) + "\n";
        text += "중수소합성기: Lv." + (data.mines.deuteriumSynthesizer || 0) + "\n";
        text += "태양광발전소: Lv." + (data.mines.solarPlant || 0);
    }
    
    if (data.constructionProgress && data.constructionProgress.building) {
        let prog = data.constructionProgress;
        let remainSec = Math.max(0, Math.floor((new Date(prog.endTime) - Date.now()) / 1000));
        text += "\n\n[건설중] " + prog.building + " Lv." + prog.targetLevel;
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
    
    if (data.technologies) {
        let tech = data.technologies;
        if (tech.energyTechnology) text += "에너지: Lv." + tech.energyTechnology + "\n";
        if (tech.weaponsTechnology) text += "무기: Lv." + tech.weaponsTechnology + "\n";
        if (tech.shieldingTechnology) text += "방어막: Lv." + tech.shieldingTechnology + "\n";
        if (tech.armorTechnology) text += "장갑: Lv." + tech.armorTechnology + "\n";
        if (tech.combustionDrive) text += "연소엔진: Lv." + tech.combustionDrive + "\n";
        if (tech.impulseDrive) text += "임펄스엔진: Lv." + tech.impulseDrive + "\n";
        if (tech.hyperspaceDrive) text += "하이퍼드라이브: Lv." + tech.hyperspaceDrive;
    }
    
    if (data.researchProgress && data.researchProgress.research) {
        let prog = data.researchProgress;
        let remainSec = Math.max(0, Math.floor((new Date(prog.endTime) - Date.now()) / 1000));
        text += "\n\n[연구중] " + prog.research + " Lv." + prog.targetLevel;
        text += "\n남은시간: " + formatTime(remainSec);
    }
    
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
    
    const fleetNames = {
        lightFighter: "경전투기",
        heavyFighter: "중전투기",
        cruiser: "순양함",
        battleship: "전함",
        battlecruiser: "순양전함",
        bomber: "폭격기",
        destroyer: "디스트로이어",
        deathstar: "데스스타",
        smallCargo: "소형화물선",
        largeCargo: "대형화물선",
        colonyShip: "식민선",
        recycler: "수확선",
        espionageProbe: "정찰위성"
    };
    
    let hasFleet = false;
    if (data.fleet) {
        for (let key in data.fleet) {
            if (data.fleet[key] > 0 && fleetNames[key]) {
                text += fleetNames[key] + ": " + formatNumber(data.fleet[key]) + "\n";
                hasFleet = true;
            }
        }
    }
    
    if (!hasFleet) {
        text += "보유 함대 없음";
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
    
    const defenseNames = {
        rocketLauncher: "로켓발사대",
        lightLaser: "경레이저",
        heavyLaser: "중레이저",
        ionCannon: "이온캐논",
        gaussCannon: "가우스캐논",
        plasmaTurret: "플라즈마포탑"
    };
    
    let hasDefense = false;
    if (data.defense) {
        for (let key in data.defense) {
            if (data.defense[key] > 0 && defenseNames[key]) {
                text += defenseNames[key] + ": " + formatNumber(data.defense[key]) + "\n";
                hasDefense = true;
            }
        }
    }
    
    if (!hasDefense) {
        text += "보유 방어시설 없음";
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
            text += (isActive ? "> " : "  ") + planet.name + " [" + planet.coordinate + "]\n";
        }
    } else {
        text += "행성 없음";
    }
    
    msg.reply(text);
}

function cmdStatus(msg, senderHash) {
    let token = getValidToken(senderHash);
    if (!token) {
        msg.reply("[오류] 먼저 계정을 연동하세요. (!연동)");
        return;
    }
    
    let result = apiGetBattleStatus(token);
    if (!result.success) {
        msg.reply("[오류] 상태 조회 실패");
        return;
    }
    
    let data = result.data;
    let text = "[진행중인 작업]\n\n";
    let hasActivity = false;
    
    if (data.activeMissions && data.activeMissions.length > 0) {
        text += "[미션]\n";
        for (let i = 0; i < data.activeMissions.length; i++) {
            let mission = data.activeMissions[i];
            let remainSec = Math.max(0, Math.floor((new Date(mission.arrivalTime) - Date.now()) / 1000));
            text += "- " + (mission.missionType || "미션") + " > " + mission.targetCoord + " (" + formatTime(remainSec) + ")\n";
        }
        hasActivity = true;
    }
    
    if (data.incomingAttacks && data.incomingAttacks.length > 0) {
        text += "\n[경고! 공격]\n";
        for (let i = 0; i < data.incomingAttacks.length; i++) {
            let attack = data.incomingAttacks[i];
            let remainSec = Math.max(0, Math.floor((new Date(attack.arrivalTime) - Date.now()) / 1000));
            text += "- " + attack.attackerName + " (" + formatTime(remainSec) + ")\n";
        }
        hasActivity = true;
    }
    
    if (!hasActivity) {
        text += "진행중인 작업 없음";
    }
    
    msg.reply(text);
}

function cmdHelp(msg) {
    let text = "[XNOVA 봇 명령어]\n\n";
    text += "[계정]\n";
    text += "!연동 - 연동 방법\n";
    text += "!인증 [코드] - 계정 연동\n";
    text += "!해제 - 연동 해제\n\n";
    text += "[조회]\n";
    text += "!자원 - 자원 현황\n";
    text += "!건물 - 건물 현황\n";
    text += "!연구 - 연구 현황\n";
    text += "!함대 - 함대 현황\n";
    text += "!방어 - 방어시설\n";
    text += "!행성 - 행성 목록\n";
    text += "!상태 - 진행중 작업\n";
    text += "!해시 - 내 해시값";
    
    msg.reply(text);
}

// ==================== 이벤트 리스너 등록 ====================
bot.addListener(Event.MESSAGE, onMessage);

// 초기 데이터 로드
loadData();

Log.i("XNOVA 봇이 시작되었습니다.");
