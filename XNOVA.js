// KakaoTalk 봇 (Rhino) 명령어, Ogame 게임 시뮬레이션 - 우주전략 시뮬레이션
// Copyright 2024
// Version: 1.0.0
// API2 기반 챗봇
const bot = BotManager.getCurrentBot();
// 공격 실행 함수 - 오게임 전투 시스템 로직 구현
function performAttack(attackingUnit, targetUnit) {
// 1. 공격력 확인
const attackPower = attackingUnit.attack;

// 2. 보호막 확인
const shieldStrength = targetUnit.shield;

// 3. '튕김' (Bounce) 확인
// 공격력이 (보호막 강도 / 100)보다 작으면 튕겨나감 (0 데미지)
if (attackPower < (shieldStrength / 100)) {
return; // 공격이 튕겨나감, 아무런 피해도 주지 못함
}

// 4. 보호막 피해 계산
if (attackPower <= shieldStrength) {
// 보호막이 모든 피해를 흡수
targetUnit.shield -= attackPower;
return; // 내구도 피해 없음
} else {
// 보호막을 뚫고 남은 피해는 내구도에 적용
const remainingDamage = attackPower - shieldStrength;
targetUnit.shield = 0;
targetUnit.hp -= remainingDamage;

// 내구도가 0 이하면 0으로 고정 (파괴)
if (targetUnit.hp < 0) {
targetUnit.hp = 0;
}
}
}

// 폭발 확인 함수 - 내구도 비율에 따른 폭발 확률 계산
function checkExploded(unit, maxHP) {
// 내구도가 이미 0인 경우 항상 폭발로 처리 (이미 파괴됨)
if (unit.hp <= 0) {
return true;
}

// 내구도가 70% 이하인 경우에만 폭발 가능성 있음
if (unit.hp <= maxHP * 0.7) {
// 폭발 확률 = (1 - (현재 내구도 / 원래 최대 내구도))
const explosionProbability = 1 - (unit.hp / maxHP);

// 확률 계산 (0~1 사이의 난수 생성)
return Math.random() < explosionProbability;
}

// 내구도가 70% 초과면 폭발하지 않음
return false;
}

// 급속사격(Rapid Fire) 발동 확인 함수
function checkRapidFire(attackingUnit, targetUnit) {
// 타깃의 타입에 대한 급속사격 값 확인
const rapidFireValue = attackingUnit.rapidFire[targetUnit.type];

// 급속사격 능력이 없으면 항상 실패
if (!rapidFireValue || rapidFireValue <= 1) {
return false;
}

// 급속사격 발동 확률 = (r - 1) / r
// 예: 급속사격 값이 10이면, 첫 번째 추가 발사 확률은 9/10 = 90%
const rapidFireProbability = (rapidFireValue - 1) / rapidFireValue;

// 확률 계산 (0~1 사이의 난수 생성)
return Math.random() < rapidFireProbability;
}

// 메시지 파일 경로 정의
const MESSAGE_FILE_PATH = "/storage/emulated/0/ChatBot/database/messages.json";
// 채널 파일 경로 정의
const CHANNEL_FILE_PATH = "/storage/emulated/0/ChatBot/database/channel.json";

// 메시지 파일이 없으면 생성하는 함수
function initMessageFile() {
try {
// database 디렉토리 확인 및 생성
let databaseDir = new java.io.File("/storage/emulated/0/ChatBot/database");
if (!databaseDir.exists()) {
databaseDir.mkdirs();
}

// messages.json 파일이 없으면 생성
if (!FileStream.exists(MESSAGE_FILE_PATH)) {
FileStream.save(MESSAGE_FILE_PATH, JSON.stringify({}));
}

// channel.json 파일이 없으면 생성
if (!FileStream.exists(CHANNEL_FILE_PATH)) {
FileStream.save(CHANNEL_FILE_PATH, JSON.stringify({}));
}
} catch (e) {
Log.e("메시지/채널 파일 초기화 실패: " + e);
}
}

// 메시지 데이터 로드 함수
function loadMessageData() {
try {
let data = FileStream.read(MESSAGE_FILE_PATH);
return data ? JSON.parse(data) : {};
} catch (e) {
Log.e("메시지 데이터 로드 실패: " + e);
return {};
}
}

// 메시지 데이터 저장 함수
function saveMessageData(messageData) {
try {
FileStream.save(MESSAGE_FILE_PATH, JSON.stringify(messageData, null, 2));
} catch (e) {
Log.e("메시지 데이터 저장 실패: " + e);
}
}

// 채널 데이터 로드 함수
function loadChannelData() {
try {
if (!FileStream.exists(CHANNEL_FILE_PATH)) {
initMessageFile(); // 채널 파일도 함께 초기화
}
let data = FileStream.read(CHANNEL_FILE_PATH);
return data ? JSON.parse(data) : {};
} catch (e) {
Log.e("채널 데이터 로드 실패: " + e);
return {};
}
}

// 채널 데이터 저장 함수
function saveChannelData(channelData) {
try {
FileStream.save(CHANNEL_FILE_PATH, JSON.stringify(channelData, null, 2));
} catch (e) {
Log.e("채널 데이터 저장 실패: " + e);
}
}

// 사용자별 채널 정보 저장 함수
function saveUserChannel(userHash, channelId, isGroupChat) {
try {
let channelData = loadChannelData();

// 사용자 채널 정보 업데이트
channelData[userHash] = {
channelId: channelId,
isGroupChat: isGroupChat,
updatedAt: new Date().toISOString()
};

saveChannelData(channelData);
Log.d(`사용자 채널 정보 저장 완료: ${userHash} -> ${channelId} (그룹채팅: ${isGroupChat})`);
return true;
} catch (e) {
Log.e(`사용자 채널 정보 저장 실패: ${e}`);
return false;
}
}

// 메시지 추가 함수
function addMessageToUser(userHash, title, content) {
try {
const MAX_MESSAGES = 50; // 보존할 메시지 최대 수
let msgData = loadMessageData();

// 사용자별 메시지 데이터 초기화
if (!msgData[userHash]) {
msgData[userHash] = { messages: [] };
}

// 메시지 수 제한 (오래된 메시지 자동 삭제)
if (msgData[userHash].messages.length >= MAX_MESSAGES) {
msgData[userHash].messages.shift(); // 가장 오래된 메시지 삭제
}

// 새 메시지 추가
msgData[userHash].messages.push({
title,
content,
timestamp: new Date().toISOString(),
read: false
});

saveMessageData(msgData);
return true;
} catch (e) {
Log.e("메시지 추가 중 오류 발생: " + e);
return false;
}
}

// 전투 보고서 생성 함수
function createBattleReportInternal(attackerInfo, defenderInfo, battleResult, targetCoord) {
const currentDate = new Date().toISOString().replace('T', ' ').substring(0, 19);

let report = `# 전투 보고서 (${currentDate})\n\n`;
report += `행성 [${targetCoord}]에서 공격\n\n`;

// 연구 정보
report += `[연구 정보]\n`;
report += `공격자: 무기공학 ${attackerInfo.research?.weapons || 0} (100%), 보호막연구 ${attackerInfo.research?.shield || 0} (100%), 장갑기술 ${attackerInfo.research?.armor || 0} (100%)\n`;
report += `방어자: 무기공학 ${defenderInfo.research?.weapons || 0} (100%), 보호막연구 ${defenderInfo.research?.shield || 0} (100%), 장갑기술 ${defenderInfo.research?.armor || 0} (100%)\n\n`;

// 함대 구성
report += `[함대 구성]\n`;
report += `공격자 함대:\n`;
for (let type in battleResult.initialAttackerFleet) {
if (battleResult.initialAttackerFleet[type] > 0) {
// 함선 통계 가져오기 (안전장치 제거)
let baseAttack = 0, baseShield = 0, hull = 0;
if (fleetData[type] && fleetData[type].details && fleetData[type].details.shipStats) {
baseAttack = fleetData[type].details.shipStats.공격력;
baseShield = fleetData[type].details.shipStats.보호막;
hull = fleetData[type].details.shipStats.장갑;

// 연구 보너스 적용된 값 계산
let attack = Math.floor(baseAttack * (1 + (attackerInfo.research?.weapons || 0) * 0.1));
let shield = Math.floor(baseShield * (1 + (attackerInfo.research?.shield || 0) * 0.1));

report += `${type}: ${battleResult.initialAttackerFleet[type]}대 (무기: ${attack}, 방어막: ${shield}, 장갑: ${hull})\n`;
}
}
}
report += "\n";

report += `방어자 함대:\n`;
for (let type in battleResult.initialDefenderFleet) {
if (battleResult.initialDefenderFleet[type] > 0) {
// 함선 통계 가져오기 (안전장치 제거)
let baseAttack = 0, baseShield = 0, hull = 0;
if (fleetData[type] && fleetData[type].details && fleetData[type].details.shipStats) {
baseAttack = fleetData[type].details.shipStats.공격력;
baseShield = fleetData[type].details.shipStats.보호막;
hull = fleetData[type].details.shipStats.장갑;

// 연구 보너스 적용된 값 계산
let attack = Math.floor(baseAttack * (1 + (defenderInfo.research?.weapons || 0) * 0.1));
let shield = Math.floor(baseShield * (1 + (defenderInfo.research?.shield || 0) * 0.1));

report += `${type}: ${battleResult.initialDefenderFleet[type]}대 (무기: ${attack}, 방어막: ${shield}, 장갑: ${hull})\n`;
}
}
}

// 방어 시설이 있는 경우
let hasDefense = false;
for (let type in battleResult.initialDefenderDefense) {
if (battleResult.initialDefenderDefense[type] > 0) {
if (!hasDefense) {
report += "\n방어자 방어시설:\n";
hasDefense = true;
}
// 방어시설 통계 가져오기 (안전장치 제거)
let baseAttack = 0, baseShield = 0, hull = 0;
if (defenseData[type] && defenseData[type].details) {
baseAttack = defenseData[type].details.공격력;
baseShield = defenseData[type].details.보호막;
hull = defenseData[type].details.장갑;

// 연구 보너스 적용된 값 계산
let attack = Math.floor(baseAttack * (1 + (defenderInfo.research?.weapons || 0) * 0.1));
let shield = Math.floor(baseShield * (1 + (defenderInfo.research?.shield || 0) * 0.1));

report += `${type}: ${battleResult.initialDefenderDefense[type]}대 (무기: ${attack}, 방어막: ${shield}, 장갑: ${hull})\n`;
}
}
}
report += "\n";

// 전투 라운드 정보
report += `[전투 라운드]\n\n`;

let totalAttackerDamage = 0;
let totalDefenderDamage = 0;
let totalAttackerShieldDamage = 0;
let totalAttackerHullDamage = 0;
let totalDefenderShieldDamage = 0;
let totalDefenderHullDamage = 0;
let totalRapidFireCount = 0;

for (let i = 0; i < battleResult.rounds.length; i++) {
const round = battleResult.rounds[i];
report += `◆ 라운드 ${i + 1}\n`;

// 공격자 → 방어자 데미지
let roundAttackerDamage = round.attackerTotalDamage || 0;
let roundDefenderShieldAbsorbed = round.defenderShieldAbsorbed || 0;
let roundDefenderHullDamage = round.defenderHullDamage || 0;

totalAttackerDamage += roundAttackerDamage;
totalDefenderShieldDamage += roundDefenderShieldAbsorbed;
totalDefenderHullDamage += roundDefenderHullDamage;

// 공격자의 속사 횟수 계산
let rapidFireCount = round.rapidFireCount || 0;
totalRapidFireCount += rapidFireCount;

report += `공격자 → 방어자: ${formatNumber(roundAttackerDamage)} 데미지\n`;
report += ` 방어막: ${formatNumber(roundDefenderShieldAbsorbed)}, 선체: ${formatNumber(roundDefenderHullDamage)}\n`;
if (rapidFireCount > 0) {
report += ` 속사 발동: ${rapidFireCount}회\n`;
}

// 방어자 → 공격자 데미지
let roundDefenderDamage = round.defenderTotalDamage || 0;
let roundAttackerShieldAbsorbed = round.attackerShieldAbsorbed || 0;
let roundAttackerHullDamage = round.attackerHullDamage || 0;

totalDefenderDamage += roundDefenderDamage;
totalAttackerShieldDamage += roundAttackerShieldAbsorbed;
totalAttackerHullDamage += roundAttackerHullDamage;

report += `방어자 → 공격자: ${formatNumber(roundDefenderDamage)} 데미지\n`;
report += ` 방어막: ${formatNumber(roundAttackerShieldAbsorbed)}, 선체: ${formatNumber(roundAttackerHullDamage)}\n`;

// 라운드 종료 후 남은 함선 수 계산
let attackerShipCount = 0;
for (let type in round.remainingAttackerFleet) {
attackerShipCount += round.remainingAttackerFleet[type];
}

let defenderShipCount = 0;
for (let type in round.remainingDefenderFleet) {
defenderShipCount += round.remainingDefenderFleet[type];
}

report += `남은 함대: 공격자 ${attackerShipCount}대, 방어자 ${defenderShipCount}대\n\n`;
}

// 전투 결과
report += `[전투 결과]\n`;
if (battleResult.attackerWon) {
report += `전투 종료! 방어자 패배\n\n`;
} else if (battleResult.defenderWon) {
report += `전투 종료! 공격자 패배\n\n`;
} else {
report += `전투 종료! 양측 모두 생존\n\n`;
}

// 함대 생존 정보
report += `[함대 생존 정보]\n`;
report += `공격자 생존 함대:\n`;
let attackerSurvived = false;
for (let type in battleResult.survivingAttackerFleet) {
if (battleResult.survivingAttackerFleet[type] > 0) {
attackerSurvived = true;
let survivalRate = Math.round((battleResult.survivingAttackerFleet[type] / battleResult.initialAttackerFleet[type]) * 100);
report += `${type}: ${battleResult.survivingAttackerFleet[type]}대 (${survivalRate}% 생존)\n`;
}
}
if (!attackerSurvived) {
report += `전멸\n`;
}

report += `\n방어자 생존 함대:\n`;
let defenderSurvived = false;
for (let type in battleResult.survivingDefenderFleet) {
if (battleResult.survivingDefenderFleet[type] > 0) {
defenderSurvived = true;
let survivalRate = Math.round((battleResult.survivingDefenderFleet[type] / battleResult.initialDefenderFleet[type]) * 100);
report += `${type}: ${battleResult.survivingDefenderFleet[type]}대 (${survivalRate}% 생존)\n`;
}
}
if (!defenderSurvived) {
report += `전멸\n`;
}

// 우주 파편 정보
const debrisMetal = battleResult.debris.metal || 0;
const debrisCrystal = battleResult.debris.crystal || 0;
report += `\n[우주 파편]\n`;
report += `메탈: ${formatNumber(debrisMetal)}\n`;
report += `크리스탈: ${formatNumber(debrisCrystal)}\n`;
report += `총 파편: ${formatNumber(debrisMetal + debrisCrystal)}\n`;

// 달 생성 확률 (10만 파편당 1%, 최대 20%)
const totalDebris = debrisMetal + debrisCrystal;
const moonChance = Math.min(20, Math.floor(totalDebris / 100000));
report += `달 생성 확률: ${moonChance}%\n\n`;

// 데미지 통계
report += `[데미지 통계]\n`;
report += `공격자가 가한 데미지: ${formatNumber(totalAttackerDamage)}\n`;
report += `- 방어막에 가한 데미지: ${formatNumber(totalDefenderShieldDamage)}\n`;
report += `- 선체에 가한 데미지: ${formatNumber(totalDefenderHullDamage)}\n`;
if (totalRapidFireCount > 0) {
report += `- 속사로 인한 추가 공격: ${totalRapidFireCount}회\n`;
}

report += `방어자가 가한 데미지: ${formatNumber(totalDefenderDamage)}\n`;
report += `- 방어막에 가한 데미지: ${formatNumber(totalAttackerShieldDamage)}\n`;
report += `- 선체에 가한 데미지: ${formatNumber(totalAttackerHullDamage)}\n`;

// 약탈 정보 (공격자가 이겼을 경우)
if (battleResult.attackerWon && battleResult.loot) {
report += `\n[약탈 자원]\n`;
report += `메탈: ${formatNumber(battleResult.loot.metal || 0)}\n`;
report += `크리스탈: ${formatNumber(battleResult.loot.crystal || 0)}\n`;
report += `듀테륨: ${formatNumber(battleResult.loot.deuterium || 0)}\n`;
}

return report;
}

// 타이머 ID 관리를 위한 객체
let timerManager = {
construction: {},
research: {},
fleet: {},
defense: {},
attack: {},
return: {}
};

// 헬퍼 함수: 숫자에 쉼표 넣기 (직접 구현)
function formatNumber(num) {
// 음수 처리
let isNegative = num < 0;
let absNum = Math.abs(num);

// 숫자를 문자열로 변환
let str = absNum.toString();

// 100 미만인 경우 쉼표를 추가하지 않음
if (absNum < 1000) {
return (isNegative ? "-" : "") + str;
}

// 1000 이상인 경우 3자리마다 쉼표 추가
let result = "";
while (str.length > 3) {
result = "," + str.slice(-3) + result;
str = str.slice(0, -3);
}

return (isNegative ? "-" : "") + str + result;
}

// 헬퍼 함수: 초를 일/시간/분/초 형식으로 변환
function formatTime(totalSeconds) {
totalSeconds = Math.floor(totalSeconds);
let days = Math.floor(totalSeconds / (3600 * 24));
let hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
let minutes = Math.floor((totalSeconds % 3600) / 60);
let seconds = totalSeconds % 60;
let result = "";
if (days > 0) result += days + "일 ";
if (hours > 0 || days > 0) result += hours + "시간 ";
if (minutes > 0 || hours > 0 || days > 0) result += minutes + "분 ";
result += seconds + "초";
return result;
}

// 연구 시간 계산 함수 (시간 단위)
function getResearchTime(metal, crystal, labLevel, universeSpeed = 1) {
// 연구 시간(시간) = (메탈 + 크리스탈) / (20000 × (1 + 연구소 레벨) × 우주 속도)
return (metal + crystal) / (20000 * (1 + labLevel) * universeSpeed);
}

// ===== buildingDB.json 파일은 별도로 database 폴더에 저장되어 있음 =====

// main.js

// buildingDB.json 파일을 불러와 데이터를 전역 변수에 할당 (ES5 방식, Rhino 환경 가정)
function loadBuildingDB() {
try {
let data = FileStream.read("/storage/emulated/0/ChatBot/buildingDB.json");
return data ? JSON.parse(data) : {};
} catch(e) {
return {};
}
}

const buildingDB = loadBuildingDB();
const researchData = buildingDB.researchData;
const fleetData = buildingDB.fleetData;
const defenseData = buildingDB.defenseData;

// 사용자별 게임 데이터 저장
function saveUserGameData(userGameData) {
try {
// 기존 파일을 백업 파일로 복사 (기존 데이터 보존)
let existingData = FileStream.read("/storage/emulated/0/ChatBot/database/gameData.json");
if (existingData) {
FileStream.save("/storage/emulated/0/ChatBot/database/gameData_backup.json", existingData);
}

// 새 데이터 저장
FileStream.save("/storage/emulated/0/ChatBot/database/gameData.json", JSON.stringify(userGameData));
} catch (e) {
Log.e("게임 데이터 저장 중 오류 발생: " + e);
}
}

// 사용자별 게임 데이터 불러오기
function loadUserGameData() {
try {
let data = FileStream.read("/storage/emulated/0/ChatBot/database/gameData.json");
if (!data) {
Log.e("gameData.json 파일을 읽을 수 없습니다: 파일이 비어있거나 존재하지 않습니다.");

// 백업 파일이 있는지 확인
let backupData = FileStream.read("/storage/emulated/0/ChatBot/database/gameData_backup.json");
if (backupData) {
Log.i("백업 파일에서 게임 데이터를 복원합니다.");
try {
let parsed = JSON.parse(backupData);
if (Object.keys(parsed).length > 0) {
// 백업 파일을 원본 위치에 복원
FileStream.save("/storage/emulated/0/ChatBot/database/gameData.json", backupData);
Log.i(`백업에서 복원된 유저 수: ${Object.keys(parsed).length}`);
return parsed;
}
} catch (e) {
Log.e("백업 파일 파싱 중 오류 발생: " + e);
}
}

// 백업도 없으면 빈 객체 반환 (새로 시작)
return {};
}

try {
let parsed = JSON.parse(data);
Log.i(`게임 데이터 로드 완료. 유저 수: ${Object.keys(parsed).length}`);

// 유저 좌표 검증
let coordCheck = {};
for (let id in parsed) {
if (parsed[id].coordinate) {
Log.d(`유저 ${id} 좌표: ${parsed[id].coordinate}`);
coordCheck[parsed[id].coordinate] = (coordCheck[parsed[id].coordinate] || 0) + 1;
}
}

// 좌표 중복 검사
for (let coord in coordCheck) {
if (coordCheck[coord] > 1) {
Log.w(`좌표 중복 발견: ${coord} (${coordCheck[coord]}명)`);
}
}

if (Object.keys(parsed).length === 0) {
Log.e("주의: gameData.json이 비어있습니다. 백업 파일을 확인합니다.");

// 빈 객체인 경우에도 백업 파일 확인
let backupData = FileStream.read("/storage/emulated/0/ChatBot/database/gameData_backup.json");
if (backupData) {
try {
let backupParsed = JSON.parse(backupData);
if (Object.keys(backupParsed).length > 0) {
Log.i("백업 파일에서 데이터 복원: " + Object.keys(backupParsed).length + "개의 사용자 데이터");
// 백업 파일을 원본 위치에 복원
FileStream.save("/storage/emulated/0/ChatBot/database/gameData.json", backupData);
return backupParsed;
}
} catch (e) {
Log.e("백업 파일 파싱 중 오류 발생: " + e);
}
}
}
return parsed;
} catch (e) {
Log.e("데이터 파싱 중 오류 발생: " + e);

// JSON 파싱 오류 시 백업 파일 확인
let backupData = FileStream.read("/storage/emulated/0/ChatBot/database/gameData_backup.json");
if (backupData) {
Log.i("원본 파일 손상, 백업 파일에서 복원 시도");
try {
let backupParsed = JSON.parse(backupData);
// 백업 파일을 원본 위치에 복원
FileStream.save("/storage/emulated/0/ChatBot/database/gameData.json", backupData);
return backupParsed;
} catch (e) {
Log.e("백업 파일도 손상됨: " + e);
}
}

// 모든 복구 시도 실패 시 빈 객체 반환
return {};
}
} catch (e) {
Log.e("gameData.json 파일 로드 중 오류 발생: " + e);
return {};
}
}

// 유니크한 좌표 생성 함수
function generateUniqueCoordinate(userGameData) {
let coordinate;
let isUnique = false;
while (!isUnique) {
let galaxy = 1; // 첫 번째 은하
let y = Math.floor(Math.random() * 99) + 1;
let z = Math.floor(Math.random() * 15) + 1;
coordinate = galaxy + ":" + y + ":" + z;
isUnique = true;
// 모든 사용자들의 좌표와 비교해서 유니크한지 확인
for (let key in userGameData) {
if (userGameData[key].coordinate === coordinate) {
isUnique = false;
break;
}
}
}
return coordinate;
}

// 두 좌표 간의 거리 계산 함수 업데이트 (OGame 스타일)
function calculateDistance(coordA, coordB) {
// 좌표 형식: "galaxy:system:planet"
let partsA = coordA.split(":");
let partsB = coordB.split(":");

let galaxyA = parseInt(partsA[0]);
let systemA = parseInt(partsA[1]);
let planetA = parseInt(partsA[2]);

let galaxyB = parseInt(partsB[0]);
let systemB = parseInt(partsB[1]);
let planetB = parseInt(partsB[2]);

// 다른 은하인 경우
if (galaxyA !== galaxyB) {
return 20000 * Math.abs(galaxyA - galaxyB);
}

// 같은 은하, 다른 시스템인 경우
if (systemA !== systemB) {
return 2700 + (95 * Math.abs(systemA - systemB));
}

// 같은 시스템, 다른 행성인 경우
if (planetA !== planetB) {
return 1000 + (5 * Math.abs(planetA - planetB));
}

// 같은 행성 내 (행성/달)인 경우
return 5;
}

// ----- 광산 자원 증가량 계산 (시간당) -----
function getResourceProduction(level, type) {
let effectiveLevel = level + 1;
let formula = {
"메탈": function(n) { return Math.floor(90 * n * Math.pow(1.1, n)); },
"크리스탈": function(n) { return Math.floor(60 * n * Math.pow(1.1, n)); },
"듀테륨": function(n) { return Math.floor(30 * n * Math.pow(1.1, n)); }
};
return formula[type] ? formula[type](effectiveLevel) : 0;
}

// ----- 에너지 생산량 계산 (시간당) -----
function getEnergyProduction(level) {
// 태양광발전소 에너지 생산 공식: 20 * 레벨 * 1.1^레벨
return Math.floor(20 * level * Math.pow(1.1, level));
}

// ----- 에너지 소비량 계산 (시간당) -----
function getEnergyConsumption(level, type) {
let effectiveLevel = level;
let formula = {
"메탈광산": function(n) { return Math.floor(10 * n * Math.pow(1.1, n)); },
"크리스탈광산": function(n) { return Math.floor(10 * n * Math.pow(1.1, n)); },
"듀테륨광산": function(n) { return Math.floor(20 * n * Math.pow(1.05, n)); },
"핵융합로": function(n) { return 0; } // 핵융합로는 에너지를 소비하지 않고 생산함
};
return formula[type] ? formula[type](effectiveLevel) : 0;
}

// 핵융합로의 듀테륨 소비량 계산 함수
function getFusionDeuteriumConsumption(level) {
if (level <= 0) return 0;
return Math.floor(10 * level * Math.pow(1.1, level));
}

// 광산 업그레이드 비용 공식 (메탈광산, 크리스탈광산, 듀테륨광산 전용)
function getUpgradeCost(currentLevel, type) {
if (type === "메탈광산") {
return {
메탈: Math.floor(60 * Math.pow(1.5, currentLevel)),
크리스탈: Math.floor(15 * Math.pow(1.5, currentLevel))
};
} else if (type === "크리스탈광산") {
return {
메탈: Math.floor(48 * Math.pow(1.6, currentLevel)),
크리스탈: Math.floor(24 * Math.pow(1.6, currentLevel))
};
} else if (type === "듀테륨광산") {
return {
메탈: Math.floor(225 * Math.pow(1.5, currentLevel)),
크리스탈: Math.floor(75 * Math.pow(1.5, currentLevel))
};
} else if (type === "태양광발전소") {
return {
메탈: Math.floor(75 * Math.pow(1.5, currentLevel)),
크리스탈: Math.floor(30 * Math.pow(1.5, currentLevel))
};
} else if (type === "핵융합로") {
return {
메탈: Math.floor(900 * Math.pow(1.8, currentLevel)),
크리스탈: Math.floor(360 * Math.pow(1.8, currentLevel)),
듀테륨: Math.floor(180 * Math.pow(1.8, currentLevel))
};
} else if (type === "로봇공장") {
return {
메탈: Math.floor(400 * Math.pow(2, currentLevel)),
크리스탈: Math.floor(120 * Math.pow(2, currentLevel)),
듀테륨: Math.floor(200 * Math.pow(2, currentLevel))
};
} else if (type === "군수공장") {
return {
메탈: Math.floor(400 * Math.pow(2, currentLevel)),
크리스탈: Math.floor(200 * Math.pow(2, currentLevel)),
듀테륨: Math.floor(100 * Math.pow(2, currentLevel))
};
} else if (type === "연구소") {
return {
메탈: Math.floor(200 * Math.pow(2, currentLevel)),
크리스탈: Math.floor(400 * Math.pow(2, currentLevel)),
듀테륨: Math.floor(200 * Math.pow(2, currentLevel))
};
} else if (type === "조선소") {
return {
메탈: Math.floor(400 * Math.pow(2, currentLevel)),
크리스탈: Math.floor(200 * Math.pow(2, currentLevel)),
듀테륨: Math.floor(100 * Math.pow(2, currentLevel))
};
} else if (type === "나노공장") {
return {
메탈: Math.floor(1000000 * Math.pow(2, currentLevel)),
크리스탈: Math.floor(500000 * Math.pow(2, currentLevel)),
듀테륨: Math.floor(100000 * Math.pow(2, currentLevel))
};
}
return null;
}

// 건설시간 계산 함수
// 모든 건설/건조 시간 공식 설명:
// - 함대 건설 시간: (메탈 비용 + 크리스탈 비용) / (25 × (1 + 조선소 레벨) × 나노봇 공장 보너스) × 시간계수
// - 방어시설 건설 시간: (메탈 비용 + 크리스탈 비용) / (25 × (1 + 로봇 공장 레벨) × 나노봇 공장 보너스) × 시간계수
// - 연구 시간: (메탈 비용 + 크리스탈 비용) / (2500 × (1 + 연구소 레벨) × 나노봇 공장 보너스)
// - 건물 건설 시간: (메탈 비용 + 크리스탈 비용) / (25 × (1 + 로봇 공장 레벨) × 나노봇 공장 보너스) × 시간계수
function getConstructionTime(building, currentLevel, facilityLevel, nanoLevel = 0) {
let cost = getUpgradeCost(currentLevel, building);
if (!cost) return 3600; // 기본 1시간

// 나노봇 공장 보너스 계산 - 레벨당 2배씩 속도 향상 (시간 감소)
let nanoBonus = Math.pow(2, nanoLevel); // 나노봇 공장 보너스 = 2^레벨
let universeSpeedFactor = 1; // 우주 속도 배율 (기본값 1)

// 건물 유형에 따른 건설 시간 계산 (초 단위)
let totalCost = 0;
let facilityBonus = 1;

if (building === "방어시설") {
totalCost = (cost.메탈 || 0) + (cost.크리스탈 || 0);
facilityBonus = 1 + facilityLevel; // 로봇 공장 레벨
return (totalCost / (25 * facilityBonus * nanoBonus * universeSpeedFactor)) * 25; // 방어시설: 원래 2.5배였으나 10배 느리게 => 25배
} else if (building === "함대") {
totalCost = (cost.메탈 || 0) + (cost.크리스탈 || 0);
facilityBonus = 1 + facilityLevel; // 조선소 레벨
return (totalCost / (25 * facilityBonus * nanoBonus * universeSpeedFactor)) * 50; // 함대: 원래 5배였으나 10배 느리게 => 50배
} else if (building === "연구") {
totalCost = (cost.메탈 || 0) + (cost.크리스탈 || 0);
facilityBonus = 1 + facilityLevel; // 연구소 레벨
return (totalCost / (2500 * facilityBonus * nanoBonus * universeSpeedFactor)) * 5; // 연구: 5배 느리게
} else {
// 광산, 군수공장건물 등
totalCost = (cost.메탈 || 0) + (cost.크리스탈 || 0);
facilityBonus = 1 + facilityLevel; // 로봇공장 레벨
return totalCost / (25 * facilityBonus * nanoBonus * universeSpeedFactor) * 4; // 건물: 그대로 4배
}
}

// 건설 완료 처리 함수
function completeConstruction(uuid, building, type, userGameData) {
if (type === "광산") {
userGameData[uuid].광산[building] += 1;
} else if (type === "군수공장") {
userGameData[uuid].군수공장[building] += 1;
} else if (type === "태양광발전소") {
userGameData[uuid].광산[building] += 1;
}
saveUserGameData(userGameData);

let newLevel;
if (type === "광산" || type === "태양광발전소") {
newLevel = userGameData[uuid].광산[building];
} else if (type === "군수공장") {
newLevel = userGameData[uuid].군수공장[building];
}

// 랭킹 점수 업데이트
updatePlayerScore(uuid);

return "✅ " + building + "이(가) Lv" + newLevel + "로 업그레이드되었습니다!";
}

// 연구 완료 처리 함수
function completeResearch(uuid, researchName, userGameData) {
if (!userGameData[uuid].researchLevels) {
userGameData[uuid].researchLevels = {};
}
let currentLevel = userGameData[uuid].researchLevels[researchName] || 0;
userGameData[uuid].researchLevels[researchName] = currentLevel + 1;
saveUserGameData(userGameData);

// 랭킹 점수 업데이트
updatePlayerScore(uuid);

return "✅ " + researchName + " 연구가 Lv" + (currentLevel + 1) + "로 업그레이드되었습니다!";
}

// 함대 건조 완료 처리 함수
function completeFleet(uuid, fleetName, quantity, userGameData) {
try {
// 플레이어 함대 데이터 초기화
if (!userGameData[uuid].fleet) {
userGameData[uuid].fleet = {};
}

// 함대 추가
userGameData[uuid].fleet[fleetName] = (userGameData[uuid].fleet[fleetName] || 0) + quantity;

return fleetName + " " + quantity + "대 건조 완료";
} catch (e) {
Log.e("함대 완성 처리 중 오류 발생: " + e);
return "오류 발생";
}
}

// 방어시설 건조 완료 처리 함수
function completeDefense(uuid, defenseName, quantity, userGameData) {
try {
// 플레이어 방어시설 데이터 초기화
if (!userGameData[uuid].defense) {
userGameData[uuid].defense = {};
}

// 방어시설 추가
userGameData[uuid].defense[defenseName] = (userGameData[uuid].defense[defenseName] || 0) + quantity;

return "✅ " + defenseName + " " + quantity + "대 건조 완료";
} catch (e) {
Log.e("방어시설 완성 처리 중 오류 발생: " + e);
return "오류 발생";
}
}

// 사용자 데이터 초기화
function initUserGameData(uuid, userGameData) {
if (!userGameData[uuid]) { userGameData[uuid] = {}; }

// 좌표 생성 (사용자에게 유니크한 좌표 부여)
if (!userGameData[uuid].coordinate) {
userGameData[uuid].coordinate = generateUniqueCoordinate(userGameData);
}

if (!userGameData[uuid].home) { userGameData[uuid].home = "기지 활성화됨"; }
if (!userGameData[uuid].건물) { userGameData[uuid].건물 = "건설 준비 완료"; }
if (!userGameData[uuid].연구) { userGameData[uuid].연구 = "연구 진행 중"; }
if (!userGameData[uuid].자원) { userGameData[uuid].자원 = {}; }
userGameData[uuid].자원["메탈"] = userGameData[uuid].자원["메탈"] || 5000;
userGameData[uuid].자원["크리스탈"] = userGameData[uuid].자원["크리스탈"] || 2500;
userGameData[uuid].자원["듀테륨"] = userGameData[uuid].자원["듀테륨"] || 1500;
userGameData[uuid].자원["에너지"] = userGameData[uuid].자원["에너지"] || 1000;

if (!userGameData[uuid].광산) { userGameData[uuid].광산 = {}; }
userGameData[uuid].광산["메탈광산"] = userGameData[uuid].광산["메탈광산"] || 0;
userGameData[uuid].광산["크리스탈광산"] = userGameData[uuid].광산["크리스탈광산"] || 0;
userGameData[uuid].광산["듀테륨광산"] = userGameData[uuid].광산["듀테륨광산"] || 0;
userGameData[uuid].광산["태양광발전소"] = userGameData[uuid].광산["태양광발전소"] || 0;
userGameData[uuid].광산["핵융합로"] = userGameData[uuid].광산["핵융합로"] || 0;
if (!userGameData[uuid].군수공장) { userGameData[uuid].군수공장 = {}; }
userGameData[uuid].군수공장["로봇공장"] = userGameData[uuid].군수공장["로봇공장"] || 0;
userGameData[uuid].군수공장["조선소"] = userGameData[uuid].군수공장["조선소"] || 0;
userGameData[uuid].군수공장["연구소"] = userGameData[uuid].군수공장["연구소"] || 0;
userGameData[uuid].군수공장["나노공장"] = userGameData[uuid].군수공장["나노공장"] || 0;

if (!userGameData[uuid].researchLevels) { userGameData[uuid].researchLevels = {}; }
if (!userGameData[uuid].fleet) { userGameData[uuid].fleet = {}; }
if (!userGameData[uuid].defense) { userGameData[uuid].defense = {}; }

// 공격 상태 관련 데이터 초기화
userGameData[uuid].pendingAttack = userGameData[uuid].pendingAttack || null; // 공격 중인 상태
userGameData[uuid].incomingAttack = userGameData[uuid].incomingAttack || null; // 공격받는 중인 상태
userGameData[uuid].pendingReturn = userGameData[uuid].pendingReturn || null; // 귀환 중인 상태

if (!userGameData[uuid].lastUpdate) { userGameData[uuid].lastUpdate = Date.now(); }

saveUserGameData(userGameData);

// 랭킹 시스템 초기화
initRankingData();
// 처음 접속한 경우 점수 계산
updatePlayerScore(uuid);
}

// 자원 자동 증가 (경과시간 계산)
function updateResources(uuid, userGameData) {
let now = Date.now();
let lastUpdate = userGameData[uuid].lastUpdate || now;
let elapsedSeconds = (now - lastUpdate) / 1000;

if (elapsedSeconds > 0) {
let mine = userGameData[uuid].광산;
let 자원 = userGameData[uuid].자원;

// 태양광인공위성 개수 확인
let satelliteCount = userGameData[uuid].fleet?.["태양광인공위성"] || 0;
let fusionLevel = mine["핵융합로"] || 0;

// 에너지 생산량 계산 (태양광인공위성 포함)
let solarLevel = mine["태양광발전소"] || 0;
let solarEnergy = getEnergyProduction(solarLevel);
let satelliteEnergy = satelliteCount * 25;
let fusionEnergy = fusionLevel > 0 ? Math.floor(30 * fusionLevel * Math.pow(1.05, fusionLevel)) : 0;
let energyProduction = solarEnergy + satelliteEnergy + fusionEnergy;

// 에너지 소비량 계산
let energyConsumption = 0;
energyConsumption += getEnergyConsumption(mine["메탈광산"], "메탈광산");
energyConsumption += getEnergyConsumption(mine["크리스탈광산"], "크리스탈광산");
energyConsumption += getEnergyConsumption(mine["듀테륨광산"], "듀테륨광산");
energyConsumption += getEnergyConsumption(mine["핵융합로"], "핵융합로");

// 순 에너지 계산
let netEnergy = energyProduction - energyConsumption;

// 에너지가 부족하면 자원 생산량 감소
let energyRatio = 1.0; // 기본 생산 비율 (100%)

if (energyProduction < energyConsumption) {
// 에너지 부족 비율 계산 (0.0 ~ 1.0)
energyRatio = Math.max(0.0, energyProduction / energyConsumption);

// 최소 생산량 보장 (최소 10% 생산)
energyRatio = Math.max(0.1, energyRatio);
}

// 핵융합로 듀테륨 소비량 계산
let fusionDeuteriumConsumption = getFusionDeuteriumConsumption(fusionLevel);

// 자원 생산 및 소비 적용
자원["메탈"] += getResourceProduction(mine["메탈광산"], "메탈") * (elapsedSeconds / 3600) * energyRatio;
자원["크리스탈"] += getResourceProduction(mine["크리스탈광산"], "크리스탈") * (elapsedSeconds / 3600) * energyRatio;

// 듀테륨 생산량에서 핵융합로 소비량 차감
let deuteriumProduction = getResourceProduction(mine["듀테륨광산"], "듀테륨") * energyRatio;
let netDeuteriumProduction = deuteriumProduction - fusionDeuteriumConsumption;
자원["듀테륨"] += netDeuteriumProduction * (elapsedSeconds / 3600);

자원["에너지"] = netEnergy;

userGameData[uuid].lastUpdate = now;
saveUserGameData(userGameData);
}
}

// 전투 시뮬레이션 함수 - 실제 OGame 전투 시스템 로직으로 변경
function simulateBattle(attackerFleet, defenderFleet, defenderDefense) {
// 공격자와 방어자의 연구 수준 가져오기
let userGameData = loadUserGameData();

// 공격자 UUID 찾기
let attackerUUID = null;
for (let uuid in userGameData) {
if (userGameData[uuid].pendingAttack &&
JSON.stringify(userGameData[uuid].pendingAttack.fleet) === JSON.stringify(attackerFleet)) {
attackerUUID = uuid;
break;
}
}

// 방어자 UUID 찾기
let defenderUUID = null;
for (let uuid in userGameData) {
if (userGameData[uuid].fleet &&
(JSON.stringify(userGameData[uuid].fleet) === JSON.stringify(defenderFleet) ||
JSON.stringify(userGameData[uuid].defense) === JSON.stringify(defenderDefense))) {
defenderUUID = uuid;
break;
}
}

// 연구 수준
let attackerResearch = (attackerUUID && userGameData[attackerUUID]) ?
(userGameData[attackerUUID].researchLevels || {}) : {};
let defenderResearch = (defenderUUID && userGameData[defenderUUID]) ?
(userGameData[defenderUUID].researchLevels || {}) : {};

// 기술 보너스 (10% 증가/레벨) - 실제 오게임은 이 비율임
let attackerWeaponBonus = 1 + (attackerResearch["무기공학"] || 0) * 0.1;
let attackerShieldBonus = 1 + (attackerResearch["보호막연구"] || 0) * 0.1;
let attackerArmorBonus = 1 + (attackerResearch["장갑기술"] || 0) * 0.1;

let defenderWeaponBonus = 1 + (defenderResearch["무기공학"] || 0) * 0.1;
let defenderShieldBonus = 1 + (defenderResearch["보호막연구"] || 0) * 0.1;
let defenderArmorBonus = 1 + (defenderResearch["장갑기술"] || 0) * 0.1;

// 전투 결과 객체 초기화
let result = {
attackerWon: false,
defenderWon: false,
draw: false,
initialAttackerFleet: JSON.parse(JSON.stringify(attackerFleet)),
initialDefenderFleet: JSON.parse(JSON.stringify(defenderFleet)),
initialDefenderDefense: JSON.parse(JSON.stringify(defenderDefense)),
survivingAttackerFleet: {},
survivingDefenderFleet: {},
survivingDefenderDefense: {},
restoredDefenses: {}, // 복구된 방어시설 추가
rounds: [],
attackerLosses: { metal: 0, crystal: 0, deuterium: 0 },
defenderLosses: { metal: 0, crystal: 0, deuterium: 0 },
debris: { metal: 0, crystal: 0 },
loot: { metal: 0, crystal: 0, deuterium: 0 }
};

// 함선과 방어시설 정보 준비
let attackerUnits = [];
let defenderUnits = [];

// 공격자 함선 준비
for (let type in attackerFleet) {
if (attackerFleet[type] > 0 && fleetData[type] && fleetData[type].details && fleetData[type].details.shipStats) {
let fleetStats = fleetData[type].details.shipStats;

// 기본 스탯 가져오기 - 순수 데이터만 사용
let baseAttack = fleetStats.공격력;
let baseShield = fleetStats.보호막;
let baseHP = fleetStats.장갑;
let rapidFire = fleetData[type].details.rapidFire?.속사 || {};

// 기술 보너스 적용
let attack = Math.floor(baseAttack * attackerWeaponBonus);
let shield = Math.floor(baseShield * attackerShieldBonus);
let hp = Math.floor(baseHP * attackerArmorBonus);

// 각 함선을 개별 유닛으로 추가
for (let i = 0; i < attackerFleet[type]; i++) {
attackerUnits.push({
id: `attacker_${type}_${i}`,
type: type,
side: 'attacker',
attack: attack,
shield: shield,
maxShield: shield,
hp: hp,
maxHP: hp,
rapidFire: rapidFire,
isDefense: false
});
}
}
}

// 방어자 함선 준비
for (let type in defenderFleet) {
if (defenderFleet[type] > 0 && fleetData[type] && fleetData[type].details && fleetData[type].details.shipStats) {
let fleetStats = fleetData[type].details.shipStats;

// 기본 스탯 가져오기 - 순수 데이터만 사용
let baseAttack = fleetStats.공격력;
let baseShield = fleetStats.보호막;
let baseHP = fleetStats.장갑;
let rapidFire = fleetData[type].details.rapidFire?.속사 || {};

// 기술 보너스 적용
let attack = Math.floor(baseAttack * defenderWeaponBonus);
let shield = Math.floor(baseShield * defenderShieldBonus);
let hp = Math.floor(baseHP * defenderArmorBonus);


// 각 함선을 개별 유닛으로 추가
for (let i = 0; i < defenderFleet[type]; i++) {
defenderUnits.push({
id: `defender_${type}_${i}`,
type: type,
side: 'defender',
attack: attack,
shield: shield,
maxShield: shield,
hp: hp,
maxHP: hp,
rapidFire: rapidFire,
isDefense: false
});
}
}
}

// 방어 시설 준비
for (let type in defenderDefense) {
if (defenderDefense[type] > 0 && defenseData[type] && defenseData[type].details) {
let defenseStats = defenseData[type].details;

// 순수 데이터만 사용
let baseAttack = defenseStats.공격력;
let baseShield = defenseStats.보호막;
let baseHP = defenseStats.장갑;
let rapidFire = defenseStats.rapidFire || {};

// 기술 보너스 적용
let attack = Math.floor(baseAttack * defenderWeaponBonus);
let shield = Math.floor(baseShield * defenderShieldBonus);
let hp = Math.floor(baseHP * defenderArmorBonus);

// 각 방어시설을 개별 유닛으로 추가
for (let i = 0; i < defenderDefense[type]; i++) {
defenderUnits.push({
id: `defense_${type}_${i}`,
type: type,
side: 'defender',
attack: attack,
shield: shield,
maxShield: shield,
hp: hp,
maxHP: hp,
rapidFire: rapidFire,
isDefense: true
});
}
}
}

// 전투 시작 - 최대 6라운드 (실제 오게임)
const MAX_ROUNDS = 6;

// 전투 라운드 시작
for (let round = 0; round < MAX_ROUNDS; round++) {
// 라운드 정보 초기화
let roundInfo = {
round: round + 1,
attackerTotalDamage: 0,
defenderTotalDamage: 0,
attackerShieldAbsorbed: 0,
defenderShieldAbsorbed: 0,
attackerHullDamage: 0,
defenderHullDamage: 0,
destroyedAttackerShips: {},
destroyedDefenderShips: {},
remainingAttackerFleet: {},
remainingDefenderFleet: {},
remainingDefenderDefense: {},
rapidFireCount: 0 // 급속사격 횟수 초기화
};

// 남아있는 함선 수 확인
if (attackerUnits.length === 0 || defenderUnits.length === 0) {
// 라운드 시작 전에 한쪽이 전멸했으면 현재 상태 기록하고 종료
countRemainingUnits(attackerUnits, defenderUnits, roundInfo);
result.rounds.push(roundInfo);
break;
}

// 전체 유닛을 섞어서 공격 순서 랜덤화
let allUnits = [];
for (let unit of attackerUnits) {
// 복사본 생성하여 원본 보존 (스프레드 연산자 대신 Object.assign 사용)
allUnits.push(Object.assign({}, unit));
}
for (let unit of defenderUnits) {
// 복사본 생성하여 원본 보존 (스프레드 연산자 대신 Object.assign 사용)
allUnits.push(Object.assign({}, unit));
}

// Fisher-Yates 알고리즘으로 배열 섞기 (매번 다른 순서로)
for (let i = allUnits.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1));
[allUnits[i], allUnits[j]] = [allUnits[j], allUnits[i]];
}

// 각 유닛의 공격 처리
for (let attackingUnit of allUnits) {
// 대상 측 유닛 배열 선택
let targetUnits = attackingUnit.side === 'attacker' ? defenderUnits : attackerUnits;

// 대상이 없으면 건너뛰기
if (targetUnits.length === 0) continue;

// 이미 파괴된 유닛은 공격 불가
if (attackingUnit.hp <= 0) continue;

// 발사 횟수 (기본 1회 + 급속사격)
let fireCount = 1;

// 공격 처리
while (fireCount > 0 && targetUnits.length > 0) {
// 랜덤 타겟 선택
const targetIndex = Math.floor(Math.random() * targetUnits.length);
// 배열 범위 체크
if (targetIndex < 0 || targetIndex >= targetUnits.length) continue;

let targetUnit = targetUnits[targetIndex];

// null 체크 추가
if (!targetUnit) {
// 유효하지 않은 타겟은 건너뛰기
targetUnits.splice(targetIndex, 1);
continue;
}

// 대상 유닛이 이미 파괴되었는지 확인
if (targetUnit.hp <= 0) {
// 파괴된 유닛은 배열에서 제거
targetUnits.splice(targetIndex, 1);
continue;
}

// 공격 수행
const initialShield = targetUnit.shield;
const initialHp = targetUnit.hp;

// 공격 실행
performAttack(attackingUnit, targetUnit);

// 데미지 기록
const shieldDamage = Math.max(0, initialShield - targetUnit.shield);
const hullDamage = Math.max(0, initialHp - targetUnit.hp);

// 공격 기록 업데이트
if (attackingUnit.side === 'attacker') {
roundInfo.attackerTotalDamage += (shieldDamage + hullDamage);
roundInfo.defenderShieldAbsorbed += shieldDamage;
roundInfo.defenderHullDamage += hullDamage;
} else {
roundInfo.defenderTotalDamage += (shieldDamage + hullDamage);
roundInfo.attackerShieldAbsorbed += shieldDamage;
roundInfo.attackerHullDamage += hullDamage;
}

// 폭발 확인 (내구도가 남아있는 경우만)
if (targetUnit.hp > 0 && checkExploded(targetUnit, targetUnit.maxHP)) {
// 폭발로 인한 파괴 처리
targetUnit.hp = 0;

// 폭발 기록에 추가
if (attackingUnit.side === 'attacker') {
roundInfo.destroyedDefenderShips[targetUnit.type] = (roundInfo.destroyedDefenderShips[targetUnit.type] || 0) + 1;

// 방어시설이 아닌 함선만 파편 생성
if (!targetUnit.isDefense) {
// 함선 손실 및 잔해 계산 (원가의 30%)
if (fleetData[targetUnit.type]) {
let cost = fleetData[targetUnit.type].cost || {};
result.debris.metal += Math.floor((cost.메탈 || 0) * 0.3);
result.debris.crystal += Math.floor((cost.크리스탈 || 0) * 0.3);

result.defenderLosses.metal += (cost.메탈 || 0);
result.defenderLosses.crystal += (cost.크리스탈 || 0);
result.defenderLosses.deuterium += (cost.듀테륨 || 0);
}
} else {
// 방어시설 손실 기록
let cost = defenseData[targetUnit.type]?.cost || {};
result.defenderLosses.metal += (cost.메탈 || 0);
result.defenderLosses.crystal += (cost.크리스탈 || 0);
result.defenderLosses.deuterium += (cost.듀테륨 || 0);
}
} else {
roundInfo.destroyedAttackerShips[targetUnit.type] = (roundInfo.destroyedAttackerShips[targetUnit.type] || 0) + 1;

// 함선 손실 및 잔해 계산
if (fleetData[targetUnit.type]) {
let cost = fleetData[targetUnit.type].cost || {};
result.debris.metal += Math.floor((cost.메탈 || 0) * 0.3);
result.debris.crystal += Math.floor((cost.크리스탈 || 0) * 0.3);

result.attackerLosses.metal += (cost.메탈 || 0);
result.attackerLosses.crystal += (cost.크리스탈 || 0);
result.attackerLosses.deuterium += (cost.듀테륨 || 0);
}
}
}

// 급속사격 확인
if (targetUnit.hp <= 0 || checkRapidFire(attackingUnit, targetUnit)) {
// 급속사격 발동 성공
fireCount++;
roundInfo.rapidFireCount++;
}

// 표적이 파괴되었으면 목록에서 제거
if (targetUnit.hp <= 0) {
targetUnits.splice(targetIndex, 1);
}

// 발사 카운트 감소
fireCount--;
}
}

// 파괴된 유닛 제거
attackerUnits = attackerUnits.filter(unit => unit.hp > 0);
defenderUnits = defenderUnits.filter(unit => unit.hp > 0);

// 라운드 종료 후 남은 함선 수 계산
countRemainingUnits(attackerUnits, defenderUnits, roundInfo);

// 라운드 정보 저장
result.rounds.push(roundInfo);

// 방패 복구 - 각 라운드 종료 후 방패는 100% 회복
for (let unit of attackerUnits) {
unit.shield = unit.maxShield;
}
for (let unit of defenderUnits) {
unit.shield = unit.maxShield;
}
}

// 최종 결과 계산
// 생존한 함대와 방어시설 계산
let finalAttackerFleet = {};
let finalDefenderFleet = {};
let finalDefenderDefense = {};

// 공격자 함대 계산
for (let unit of attackerUnits) {
finalAttackerFleet[unit.type] = (finalAttackerFleet[unit.type] || 0) + 1;
}

// 방어자 함대 및 방어시설 계산
for (let unit of defenderUnits) {
if (unit.isDefense) {
finalDefenderDefense[unit.type] = (finalDefenderDefense[unit.type] || 0) + 1;
} else {
finalDefenderFleet[unit.type] = (finalDefenderFleet[unit.type] || 0) + 1;
}
}

// 초기 함대에는 있지만 최종 함대에 없는 유닛은 0으로 설정
for (let type in result.initialAttackerFleet) {
if (finalAttackerFleet[type] === undefined) {
finalAttackerFleet[type] = 0;
}
}

for (let type in result.initialDefenderFleet) {
if (finalDefenderFleet[type] === undefined) {
finalDefenderFleet[type] = 0;
}
}

for (let type in result.initialDefenderDefense) {
if (finalDefenderDefense[type] === undefined) {
finalDefenderDefense[type] = 0;
}
}

result.survivingAttackerFleet = finalAttackerFleet;
result.survivingDefenderFleet = finalDefenderFleet;
result.survivingDefenderDefense = finalDefenderDefense;

// 승패 판정
let attackerSurvives = attackerUnits.length > 0;
let defenderSurvives = defenderUnits.some(unit => !unit.isDefense);
let onlyDefenseSurvives = defenderUnits.length > 0 && defenderUnits.every(unit => unit.isDefense);

// 실제 오게임 승패 판정:
// 1. 공격자가 모두 파괴되고 방어자 함선이 생존 = 방어자 승리
// 2. 방어자 함선이 모두 파괴되고 공격자가 생존 = 공격자 승리
// 3. 모두 파괴 = 무승부
// 4. 방어 시설만 남아있는 경우 공격자 승리로 간주
if (!attackerSurvives && defenderSurvives) {
result.defenderWon = true;
} else if (attackerSurvives && (!defenderSurvives || onlyDefenseSurvives)) {
result.attackerWon = true;

// 방어시설 확률적 복구 처리 - 오게임 규칙: 70% 확률
for (let type in result.initialDefenderDefense) {
// 파괴된 방어시설만 처리
let initialCount = result.initialDefenderDefense[type] || 0;
let surviveCount = finalDefenderDefense[type] || 0;
let destroyedCount = initialCount - surviveCount;

if (destroyedCount > 0) {
// 70% 확률로 방어시설 복구 (각 방어시설마다 개별 계산)
let restoredCount = 0;
for (let i = 0; i < destroyedCount; i++) {
if (Math.random() < 0.7) { // 70% 확률
restoredCount++;
}
}

if (restoredCount > 0) {
result.restoredDefenses[type] = restoredCount;
result.survivingDefenderDefense[type] += restoredCount;
}
}
}
} else if (!attackerSurvives && !defenderSurvives) {
result.draw = true;
}

return result;
}

// 배열을 무작위로 섞는 헬퍼 함수 (Fisher-Yates 알고리즘)
function shuffleArray(array) {
for (let i = array.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1));
[array[i], array[j]] = [array[j], array[i]];
}
return array;
}

// 남은 유닛 수를 카운트하는 헬퍼 함수
function countRemainingUnits(attackerUnits, defenderUnits, roundInfo) {
// 공격자 함선 카운트 - 유형별로 정확히 집계
let attackerCount = {};
for (let unit of attackerUnits) {
attackerCount[unit.type] = (attackerCount[unit.type] || 0) + 1;
}

// 방어자 함선 카운트 - 함선과 방어시설 구분
let defenderFleetCount = {};
let defenderDefenseCount = {};

for (let unit of defenderUnits) {
if (unit.isDefense) {
defenderDefenseCount[unit.type] = (defenderDefenseCount[unit.type] || 0) + 1;
} else {
defenderFleetCount[unit.type] = (defenderFleetCount[unit.type] || 0) + 1;
}
}

// 결과 저장 - Object.assign 사용하여 깊은 복사 보장
roundInfo.remainingAttackerFleet = Object.assign({}, attackerCount);
roundInfo.remainingDefenderFleet = Object.assign({}, defenderFleetCount);
roundInfo.remainingDefenderDefense = Object.assign({}, defenderDefenseCount);
}

// processAttackArrival 함수 수정
function processAttackArrival(uuid, targetHash, fleet, capacity) {
try {
Log.d(`함대 공격 도착: 공격자 ${uuid}, 대상 ${targetHash}`);

// 사용자 데이터 로드
let userGameData = loadUserGameData();

// 혹시 사용자 데이터가 없는 경우 처리
if (!userGameData[uuid] || !userGameData[targetHash]) {
Log.e("공격 처리 실패: 사용자 데이터 없음");
return;
}

// 이미 처리된 전투인지 확인
if (userGameData[uuid].pendingAttack && userGameData[uuid].pendingAttack.battleCompleted) {
Log.d("이미 처리된 전투입니다.");
return;
}

// 방어자의 함대 및 방어시설
let defenderFleet = userGameData[targetHash].fleet || {};
let defenderDefense = userGameData[targetHash].defense || {};

// 전투 시뮬레이션
let battleResult = simulateBattle(fleet, defenderFleet, defenderDefense);

// 자원 약탈 계산
let defenderResources = userGameData[targetHash].자원 || {};
let loot = calculateLoot(defenderResources, battleResult, capacity);

// 전투 결과 저장
battleResult.loot = loot;

// 공격 결과 적용
if (battleResult.attackerWon) {
// 방어자 함대 및 방어시설 갱신
userGameData[targetHash].fleet = battleResult.survivingDefenderFleet;

// 방어시설 갱신 (복구된 방어시설 포함)
userGameData[targetHash].defense = battleResult.survivingDefenderDefense;

// 자원 약탈 - 올바른 필드명 사용 및 확인
if (userGameData[targetHash].자원) {
userGameData[targetHash].자원.메탈 = Math.max(0, (userGameData[targetHash].자원.메탈 || 0) - loot.metal);
userGameData[targetHash].자원.크리스탈 = Math.max(0, (userGameData[targetHash].자원.크리스탈 || 0) - loot.crystal);
userGameData[targetHash].자원.듀테륨 = Math.max(0, (userGameData[targetHash].자원.듀테륨 || 0) - loot.deuterium);
}
} else {
// 방어자 승리 또는 무승부
userGameData[targetHash].fleet = battleResult.survivingDefenderFleet;
userGameData[targetHash].defense = battleResult.survivingDefenderDefense;
}

// 귀환하는 함대 저장
let returnFleet = battleResult.survivingAttackerFleet;

// 약탈한 자원
let lootedResources = {
metal: loot.metal,
crystal: loot.crystal,
deuterium: loot.deuterium
};

// 공격 완료 상태 저장
userGameData[uuid].pendingAttack.battleCompleted = true;
userGameData[uuid].pendingAttack.battleResult = battleResult;

// 방어자의 incomingAttack 상태 제거
if (userGameData[targetHash].incomingAttack) {
userGameData[targetHash].incomingAttack = null;
}

// 귀환 시간 계산 (공격과 동일한 시간으로 설정)
let returnTime = userGameData[uuid].pendingAttack.travelTime;

// pendingReturn 객체 생성
userGameData[uuid].pendingReturn = {
fleet: returnFleet,
targetHash: targetHash,
loot: lootedResources,
returnTime: Date.now() + (returnTime * 1000),
startTime: Date.now()
};

// 귀환 도착 예약
scheduleFleetReturn(uuid, Date.now() + (returnTime * 1000));

// 전투 보고서 생성 및 저장
let attackerName = userGameData[uuid].playerName || "익명 행성";
let attackerCoord = userGameData[uuid].coordinate;
let defenderName = userGameData[targetHash].playerName || "익명 행성";
let defenderCoord = userGameData[targetHash].coordinate;

let attackerInfo = {
name: attackerName,
coordinate: attackerCoord,
fleet: battleResult.initialAttackerFleet,
research: {
weapons: userGameData[uuid].researchLevels?.무기공학 || 0,
shield: userGameData[uuid].researchLevels?.보호막연구 || 0,
armor: userGameData[uuid].researchLevels?.장갑기술 || 0
}
};

let defenderInfo = {
name: defenderName,
coordinate: defenderCoord,
fleet: battleResult.initialDefenderFleet,
defense: battleResult.initialDefenderDefense,
research: {
weapons: userGameData[targetHash].researchLevels?.무기공학 || 0,
shield: userGameData[targetHash].researchLevels?.보호막연구 || 0,
armor: userGameData[targetHash].researchLevels?.장갑기술 || 0
}
};

// 전투 보고서 생성
let battleReportContent = createBattleReportInternal(attackerInfo, defenderInfo, battleResult, defenderCoord);

// 복구된 방어시설이 있으면 보고서에 추가
if (Object.keys(battleResult.restoredDefenses || {}).length > 0) {
let restoredText = "\n\n🛠️ 복구된 방어시설:\n";
for (let type in battleResult.restoredDefenses) {
restoredText += `${type}: ${battleResult.restoredDefenses[type]}대\n`;
}
battleReportContent += restoredText;
}

// 전투 보고서 저장
addMessageToUser(uuid, "전투 보고서: " + defenderCoord, battleReportContent);
addMessageToUser(targetHash, "방어 보고서: " + defenderCoord, battleReportContent);

// 알림 전송 - 각 플레이어에게 고유 채널 ID 기반으로 메시지 전송
let returnTimeFormatted = formatTime(returnTime);

// 공격자에게는 공격 성공 및 귀환 정보 전송 - 공격자의 채널 사용
let attackerMsg = `함대가 [${defenderCoord}] 행성을 공격했습니다. 귀환까지 ${returnTimeFormatted} 소요됩니다.`;
if (battleResult.attackerWon) {
attackerMsg += `\n\n✅ 전투 승리! 자원 약탈: 메탈 ${formatNumber(loot.metal)}, 크리스탈 ${formatNumber(loot.crystal)}, 듀테륨 ${formatNumber(loot.deuterium)}`;
} else if (battleResult.draw) {
attackerMsg += "\n\n⚠️ 전투 무승부! 양측 모두 함대 손실이 있었습니다.";
} else {
attackerMsg += "\n\n❌ 전투 패배! 방어자의 함대가 승리했습니다.";
}
sendNotification(uuid, attackerMsg, false); // 공격자 고유 채널 유지

// 방어자에게는 공격받았다는 정보 전송 - 방어자의 채널 사용
let defenderMsg = `[${attackerCoord}] 행성으로부터 공격을 받았습니다!`;
if (battleResult.defenderWon) {
defenderMsg += "\n\n✅ 방어 성공! 공격자의 함대를 격퇴했습니다.";
} else if (battleResult.draw) {
defenderMsg += "\n\n⚠️ 전투 무승부! 양측 모두 함대 손실이 있었습니다.";
} else {
defenderMsg += `\n\n❌ 방어 실패! 자원 손실: 메탈 ${formatNumber(loot.metal)}, 크리스탈 ${formatNumber(loot.crystal)}, 듀테륨 ${formatNumber(loot.deuterium)}`;

// 복구된 방어시설이 있으면 추가
if (Object.keys(battleResult.restoredDefenses || {}).length > 0) {
defenderMsg += "\n\n🛠️ 복구된 방어시설:";
for (let type in battleResult.restoredDefenses) {
defenderMsg += `\n${type}: ${battleResult.restoredDefenses[type]}대`;
}
}
}
sendNotification(targetHash, defenderMsg, false); // 방어자 고유 채널 유지

// 저장
saveUserGameData(userGameData);

Log.d(`공격 처리 완료: ${uuid} -> ${targetHash}, 함대가 귀환 중입니다. 귀환 시간: ${new Date(Date.now() + (returnTime * 1000))}`);

return true; // 성공적으로 처리 완료
} catch (e) {
Log.e("공격 처리 오류: " + e);
return false; // 처리 실패
}
}

// 초기화 코드 (onStartCompile 함수 내부)
function onStartCompile() {
// 랭킹 시스템 초기화
initRankingData();

// 첫 실행 시 모든 점수 계산
if (Object.keys(loadRankingData()).length === 0) {
recalculateAllScores();
}

// 기존 코드...
}

// 함대의 총 선적량 계산
function calculateTotalCapacity(fleet) {
let totalCapacity = 0;

for (let type in fleet) {
if (fleet[type] > 0 && fleetData[type]) {
// 함선 정보에서 선적량 가져오기
let cargoCapacity = 0;
if (fleetData[type].details && fleetData[type].details.shipStats) {
cargoCapacity = fleetData[type].details.shipStats.선적량 || 0;
}

totalCapacity += fleet[type] * cargoCapacity;
}
}

return totalCapacity;
}

// 함대의 연료 소비량 계산 (실제 오게임 로직 적용)
function calculateFuelConsumption(fleet, distance, duration, universeSpeed = 1) {
let totalConsumption = 0;

for (let type in fleet) {
if (fleet[type] > 0 && fleetData[type]) {
// 함선 정보에서 연료소비량과 속도 가져오기
let basicConsumption = 0;
let shipSpeed = 0;
if (fleetData[type].details && fleetData[type].details.shipStats) {
basicConsumption = fleetData[type].details.shipStats.연료소비량 || 0;
shipSpeed = fleetData[type].details.shipStats.속도 || 0;
}

// 임시속도 계산 (올바른 공식 적용)
// tmpSpeed = (35000 / (이동시간 * 우주속도 - 10)) * sqrt((거리 * 10) / 함선속도)
let travelTimeSeconds = duration || 0;
let sqrtTerm = Math.sqrt((distance * 10) / shipSpeed);
let tmpSpeed = 0;

if (travelTimeSeconds > 0) {
let denominator = travelTimeSeconds * universeSpeed - 10;
if (denominator > 0) {
tmpSpeed = (35000 / denominator) * sqrtTerm;
}
}

// 실제 오게임 소비량 공식: (기본연료소비량 * 함선수 * 거리) / 35000 * ((임시속도/10 + 1)^2)
let speedFactor = Math.pow((tmpSpeed/10 + 1), 2);
let consumption = (basicConsumption * fleet[type] * distance) / 35000 * speedFactor;

// 소비량을 500배 줄임
consumption = consumption / 500;

// 최소 1 이상, 정수로 반올림
consumption = Math.max(1, Math.round(consumption));
totalConsumption += consumption;
}
}

return totalConsumption;
}

// 약탈 계산 함수 수정
function calculateLoot(resources, battleResult, capacity) {
// 방어자가 완전히 파괴되지 않으면 약탈 불가
if (!battleResult.attackerWon) {
return {
메탈: 0,
크리스탈: 0,
듀테륨: 0
};
}

// 방어자가 완전히 파괴되면 자원의 최대 30%까지 약탈 가능
let lootRatio = 0.3;
let loot = {
메탈: 0,
크리스탈: 0,
듀테륨: 0
};
let totalLoot = 0;

// 1단계: 자원별 최대 약탈 가능량 계산
if (resources.메탈) {
loot.메탈 = Math.floor(resources.메탈 * lootRatio);
totalLoot += loot.메탈;
}

if (resources.크리스탈) {
loot.크리스탈 = Math.floor(resources.크리스탈 * lootRatio);
totalLoot += loot.크리스탈;
}

if (resources.듀테륨) {
loot.듀테륨 = Math.floor(resources.듀테륨 * lootRatio);
totalLoot += loot.듀테륨;
}

// 2단계: 선적량 초과 시 비율에 맞게 조정
if (totalLoot > capacity) {
let ratio = capacity / totalLoot;
loot.메탈 = Math.floor(loot.메탈 * ratio);
loot.크리스탈 = Math.floor(loot.크리스탈 * ratio);
loot.듀테륨 = Math.floor(loot.듀테륨 * ratio);
}

return loot;
}

// 사용자에게 알림 전송 함수 개선 - 채널 ID를 기억하여 사용
function sendNotification(userHash, message, forceChannelUpdate = false) {
try {
// 사용자 정보 가져오기
let userGameData = loadUserGameData();
if (!userGameData[userHash]) {
Log.e(`알림 전송 실패: 사용자 데이터 없음 (userHash: ${userHash})`);
return;
}

// 로그 추가
Log.d(`알림 전송 시도: ${userHash} - ${message.substring(0, 30)}...`);

// 1. channel.json에서 채널 정보 조회
let channelData = loadChannelData();
let channelInfo = channelData[userHash];

// 강제 업데이트 모드가 아니고, 저장된 채널 정보가 있는 경우
if (!forceChannelUpdate && channelInfo && channelInfo.channelId) {
try {
if (channelInfo.isGroupChat) {
// 그룹채팅으로 전송
bot.send(channelInfo.channelId, message, 1);
Log.d(`채널 파일에 저장된 그룹채널로 알림 전송 완료: ${channelInfo.channelId}`);
return;
} else {
// 개인채팅으로 전송
bot.send(channelInfo.channelId, message, 1);
Log.d(`채널 파일에 저장된 개인채널로 알림 전송 완료: ${channelInfo.channelId}`);
return;
}
} catch (channelError) {
// 채널 전송 실패 시 기존 정보 삭제
Log.e(`저장된 채널로 전송 실패, 다른 방식으로 폴백: ${channelError}`);
delete channelData[userHash];
saveChannelData(channelData);
}
}

// 2. 게임데이터에 저장된 채널 정보 사용 (폴백)
if (!userGameData[userHash].channelId) {
userGameData[userHash].channelId = {};
}

if (!forceChannelUpdate && userGameData[userHash].channelId.id) {
try {
if (userGameData[userHash].channelId.isGroup) {
// 그룹채팅으로 전송
bot.send(userGameData[userHash].channelId.id, message, 1);
Log.d(`게임데이터에 저장된 그룹채널로 알림 전송 완료: ${userGameData[userHash].channelId.id}`);

// channel.json에도 정보 저장
saveUserChannel(userHash, userGameData[userHash].channelId.id, true);
return;
} else {
// 개인채팅으로 전송
bot.send(userGameData[userHash].channelId.id, message, 1);
Log.d(`게임데이터에 저장된 개인채널로 알림 전송 완료: ${userGameData[userHash].channelId.id}`);

// channel.json에도 정보 저장
saveUserChannel(userHash, userGameData[userHash].channelId.id, false);
return;
}
} catch (channelError) {
// 채널 전송 실패 시 기존 정보 삭제
Log.e(`저장된 채널로 전송 실패, 기본 방식으로 폴백: ${channelError}`);
delete userGameData[userHash].channelId.id;
saveUserGameData(userGameData);
}
}

// 3. 기존 lastChatInfo 사용 (폴백 또는 첫 사용 시)
if (userGameData[userHash].lastChatInfo) {
if (userGameData[userHash].lastChatInfo.isGroupChat) {
// 그룹톡으로 전송
if (userGameData[userHash].lastChatInfo.roomName) {
bot.send(userGameData[userHash].lastChatInfo.roomName, message, 1);
Log.d(`그룹톡으로 알림 전송 완료: ${userGameData[userHash].lastChatInfo.roomName}`);

// 채널 ID 저장 (게임데이터에)
userGameData[userHash].channelId = {
id: userGameData[userHash].lastChatInfo.roomName,
isGroup: true,
lastUsed: Date.now()
};
saveUserGameData(userGameData);

// channel.json에도 정보 저장
saveUserChannel(userHash, userGameData[userHash].lastChatInfo.roomName, true);
} else {
Log.e(`알림 전송 실패: 그룹톡 정보 없음 (userHash: ${userHash})`);
}
} else {
// 개인톡으로 전송
if (userGameData[userHash].lastChatInfo.sender) {
bot.send(userGameData[userHash].lastChatInfo.sender, message, 1);
Log.d(`개인톡으로 알림 전송 완료: ${userGameData[userHash].lastChatInfo.sender}`);

// 채널 ID 저장 (게임데이터에)
userGameData[userHash].channelId = {
id: userGameData[userHash].lastChatInfo.sender,
isGroup: false,
lastUsed: Date.now()
};
saveUserGameData(userGameData);

// channel.json에도 정보 저장
saveUserChannel(userHash, userGameData[userHash].lastChatInfo.sender, false);
} else {
Log.e(`알림 전송 실패: 개인톡 정보 없음 (userHash: ${userHash})`);
}
}
} else {
Log.e(`알림 전송 실패: lastChatInfo 없음 (userHash: ${userHash})`);
}
} catch (e) {
Log.e(`알림 전송 중 오류 발생: ${e}, 대상: ${userHash}`);
}
}

// 건설 완료 타이머 설정
function scheduleConstructionCompletion(uuid, building, type, finishTime) {
let remainingTime = finishTime - Date.now();
if (remainingTime <= 0) {
processConstructionCompletion(uuid, building, type);
return;
}

// 이미 존재하는 타이머 제거
if (timerManager.construction[uuid]) {
clearTimeout(timerManager.construction[uuid]);
}

// 새 타이머 설정
timerManager.construction[uuid] = setTimeout(function() {
processConstructionCompletion(uuid, building, type);
}, remainingTime);
}

// 건설 완료 처리
function processConstructionCompletion(uuid, building, type) {
try {
let userGameData = loadUserGameData();
if (!userGameData[uuid] || !userGameData[uuid].construction) return;

let compMsg = completeConstruction(uuid, building, type, userGameData);
delete userGameData[uuid].construction;
saveUserGameData(userGameData);

// 사용자에게 알림
sendNotification(uuid, "건설이 완료되었습니다! " + compMsg);

// 타이머 삭제
delete timerManager.construction[uuid];
} catch (e) {
Log.e("건설 완료 처리 중 오류 발생: " + e);
}
}

// 연구 완료 타이머 설정
function scheduleResearchCompletion(uuid, researchName, finishTime) {
let remainingTime = finishTime - Date.now();
if (remainingTime <= 0) {
processResearchCompletion(uuid, researchName);
return;
}

// 이미 존재하는 타이머 제거
if (timerManager.research[uuid]) {
clearTimeout(timerManager.research[uuid]);
}

// 새 타이머 설정
timerManager.research[uuid] = setTimeout(function() {
processResearchCompletion(uuid, researchName);
}, remainingTime);
}

// 연구 완료 처리
function processResearchCompletion(uuid, researchName) {
try {
let userGameData = loadUserGameData();
if (!userGameData[uuid] || !userGameData[uuid].researchProgress) return;

let compMsg = completeResearch(uuid, researchName, userGameData);
delete userGameData[uuid].researchProgress;
saveUserGameData(userGameData);

// 사용자에게 알림
sendNotification(uuid, "연구가 완료되었습니다! " + compMsg);

// 타이머 삭제
delete timerManager.research[uuid];
} catch (e) {
Log.e("연구 완료 처리 중 오류 발생: " + e);
}
}

// 함대 건조 완료 타이머 설정
function scheduleFleetCompletion(uuid, fleetName, quantity, finishTime) {
let remainingTime = finishTime - Date.now();
if (remainingTime <= 0) {
processFleetCompletion(uuid, fleetName, 1); // 한 번에 1대씩 처리
return;
}

// 이미 존재하는 타이머 제거
if (timerManager.fleet[uuid]) {
clearTimeout(timerManager.fleet[uuid]);
}

// 새 타이머 설정
timerManager.fleet[uuid] = setTimeout(function() {
processFleetCompletion(uuid, fleetName, 1); // 한 번에 1대씩 처리
}, remainingTime);
}

// 함대 건조 완료 처리
function processFleetCompletion(uuid, fleetName, quantity) {
try {
let userGameData = loadUserGameData();
if (!userGameData[uuid] || !userGameData[uuid].fleetProgress) return;

// 함선 1대 완성 처리
let compFleetMsg = completeFleet(uuid, fleetName, quantity, userGameData);

// 총 건조 수량과 이미 완성된 수량 기록
let totalQuantity = userGameData[uuid].fleetProgress.quantity;

// 남은 건조 수량 확인 및 처리
userGameData[uuid].fleetProgress.remainingQuantity = (userGameData[uuid].fleetProgress.remainingQuantity || 0) - quantity;
let completedCount = totalQuantity - userGameData[uuid].fleetProgress.remainingQuantity;

if (userGameData[uuid].fleetProgress.remainingQuantity <= 0) {
// 모든 함선 건조 완료
delete userGameData[uuid].fleetProgress;
// 타이머 삭제
delete timerManager.fleet[uuid];
// 최종 알림 메시지 (모든 함대 건조 완료)
let finalMsg = "- " + fleetName + " " + totalQuantity + "기 건조가 모두 완료되었습니다.";
sendNotification(uuid, finalMsg);
} else {
// 다음 함선 건조 시작
let singleShipTime = userGameData[uuid].fleetProgress.singleShipTime;
let nextFinishTime = Date.now() + singleShipTime;

// 진행 상황 업데이트
userGameData[uuid].fleetProgress.finishTime = nextFinishTime;

// 다음 함선 건조 예약
scheduleFleetCompletion(uuid, fleetName, 1, nextFinishTime);
}

saveUserGameData(userGameData);

} catch (e) {
Log.e("함대 건조 완료 처리 중 오류 발생: " + e);
}
}

// 방어시설 건조 완료 타이머 설정
function scheduleDefenseCompletion(uuid, defenseName, quantity, finishTime) {
let remainingTime = finishTime - Date.now();
if (remainingTime <= 0) {
processDefenseCompletion(uuid, defenseName, quantity);
return;
}

// 이미 존재하는 타이머 제거
if (timerManager.defense[uuid]) {
clearTimeout(timerManager.defense[uuid]);
}

// 새 타이머 설정
timerManager.defense[uuid] = setTimeout(function() {
processDefenseCompletion(uuid, defenseName, quantity);
}, remainingTime);
}

// 방어시설 건조 완료 처리
function processDefenseCompletion(uuid, defenseName, quantity) {
try {
let userGameData = loadUserGameData();
if (!userGameData[uuid] || !userGameData[uuid].defenseProgress) return;

let compDefenseMsg = completeDefense(uuid, defenseName, quantity, userGameData);
delete userGameData[uuid].defenseProgress;
saveUserGameData(userGameData);

// 사용자에게 알림
sendNotification(uuid, "방어시설 건조가 완료되었습니다! " + compDefenseMsg);

// 타이머 삭제
delete timerManager.defense[uuid];
} catch (e) {
Log.e("방어시설 건조 완료 처리 중 오류 발생: " + e);
}
}

// 공격 도착 타이머 설정
function scheduleAttackArrival(uuid, targetHash, arrivalTime, fleet, capacity) {
try {
// 타이머 매니저 초기화
if (!timerManager.attack) {
timerManager.attack = {};
timerManager.attackInfo = {};
}

// 기존 타이머가 있다면 제거
if (timerManager.attack[uuid]) {
clearTimeout(timerManager.attack[uuid]);
}

// 현재 시간과 도착 시간의 차이 계산
let remainingTime = arrivalTime - Date.now();

// 이미 도착 시간이 지났다면 즉시 처리
if (remainingTime <= 0) {
processAttackArrival(uuid, targetHash, fleet, capacity);
return;
}

// 새로운 타이머 설정 (밀리초를 초로 변환)
timerManager.attack[uuid] = setTimeout(() => {
processAttackArrival(uuid, targetHash, fleet, capacity);
}, remainingTime);

// 타이머 정보 저장
timerManager.attackInfo[uuid] = {
targetHash: targetHash,
arrivalTime: arrivalTime,
fleet: fleet,
capacity: capacity
};

} catch (e) {
Log.e("공격 도착 예약 중 오류 발생: " + e);
}
}

// 귀환 시스템 관련 함수들
function scheduleFleetReturn(uuid, returnTime) {
try {
// 사용자 데이터 확인 및 복구
let userGameData = loadUserGameData();
if (!userGameData[uuid]) {
Log.e(`귀환 예약 실패: 사용자 데이터 없음 (uuid: ${uuid})`);
return;
}

// pendingReturn이 없는 경우 복구 시도
if (!userGameData[uuid].pendingReturn) {
// 이전 공격 정보가 있는지 확인
if (userGameData[uuid].pendingAttack && userGameData[uuid].pendingAttack.battleCompleted) {
Log.d(`귀환 정보 누락 감지, 자동으로 복구 시도 (uuid: ${uuid})`);

// 귀환 정보 자동 생성
let pa = userGameData[uuid].pendingAttack;
let returnFleet = userGameData[uuid].returningFleet || {};

// 함대가 없으면 기본 함대 추정 (원래 함대의 50%)
if (Object.keys(returnFleet).length === 0 && pa.fleet) {
returnFleet = {};
for (let type in pa.fleet) {
let survivingCount = Math.floor(pa.fleet[type] * 0.5);
if (survivingCount > 0) {
returnFleet[type] = survivingCount;
}
}
}

// 귀환 정보 생성
userGameData[uuid].pendingReturn = {
fleet: returnFleet,
targetHash: pa.targetHash,
loot: userGameData[uuid].lootedResources || { metal: 0, crystal: 0, deuterium: 0 },
returnTime: returnTime,
startTime: Date.now()
};

saveUserGameData(userGameData);
Log.d(`귀환 정보 자동 복구 완료 (uuid: ${uuid})`);

// 사용자에게 알림
sendNotification(uuid, "함대 귀환 정보가 누락되어 자동으로 복구했습니다. 함대가 곧 귀환합니다.");
} else {
Log.e(`귀환 예약 실패: pendingReturn이 없으며 복구할 수 있는 정보도 없음 (uuid: ${uuid})`);
return;
}
}

// 타이머 매니저 초기화
if (!timerManager.return) {
timerManager.return = {};
timerManager.returnInfo = {};
}

// 기존 타이머가 있다면 제거
if (timerManager.return[uuid]) {
clearTimeout(timerManager.return[uuid]);
}

// 현재 시간과 귀환 시간의 차이 계산
let remainingTime = returnTime - Date.now();

// 이미 귀환 시간이 지났다면 즉시 처리
if (remainingTime <= 0) {
processFleetReturn(uuid);
return;
}

// 새로운 타이머 설정
timerManager.return[uuid] = setTimeout(() => {
processFleetReturn(uuid);
}, remainingTime);

// 타이머 정보 저장
timerManager.returnInfo[uuid] = {
returnTime: returnTime,
uuid: uuid
};

Log.d(`함대 귀환 타이머 설정 완료: ${uuid}, 귀환 시간: ${new Date(returnTime)}, 남은 시간: ${Math.floor(remainingTime/1000)}초`);
} catch (e) {
Log.e("귀환 예약 중 오류 발생: " + e);
}
}

function processFleetReturn(uuid) {
try {
Log.d(`함대 귀환 처리: ${uuid}`);
let userGameData = loadUserGameData();

if (!userGameData[uuid] || !userGameData[uuid].pendingReturn) {
Log.e(`귀환 처리 실패: 사용자 데이터 또는 귀환 정보 없음 (${uuid})`);
return false;
}

// 귀환 정보 가져오기
let pendingReturn = userGameData[uuid].pendingReturn;
let fleet = pendingReturn.fleet;
let loot = pendingReturn.loot;

// 함대를 사용자의 현재 함대에 추가
for (let shipType in fleet) {
userGameData[uuid].fleet[shipType] = (userGameData[uuid].fleet[shipType] || 0) + fleet[shipType];
}

// 약탈한 자원을 사용자의 자원에 추가
if (userGameData[uuid].자원) {
userGameData[uuid].자원.메탈 = (userGameData[uuid].자원.메탈 || 0) + loot.metal;
userGameData[uuid].자원.크리스탈 = (userGameData[uuid].자원.크리스탈 || 0) + loot.crystal;
userGameData[uuid].자원.듀테륨 = (userGameData[uuid].자원.듀테륨 || 0) + loot.deuterium;
}

// 약탈한 자원 정보 메시지 생성
let lootMsg = "";
if (loot.metal > 0 || loot.crystal > 0 || loot.deuterium > 0) {
lootMsg = `\n\n약탈한 자원:`;
if (loot.metal > 0) lootMsg += `\n메탈: ${formatNumber(loot.metal)}`;
if (loot.crystal > 0) lootMsg += `\n크리스탈: ${formatNumber(loot.crystal)}`;
if (loot.deuterium > 0) lootMsg += `\n듀테륨: ${formatNumber(loot.deuterium)}`;
}

// 귀환 함대 정보 메시지 생성
let fleetMsg = "\n\n귀환한 함대:";
let anyShipsReturned = false;
for (let shipType in fleet) {
if (fleet[shipType] > 0) {
fleetMsg += `\n${shipType}: ${fleet[shipType]}대`;
anyShipsReturned = true;
}
}

// 함대 귀환 알림 메시지 보내기
let notificationMsg = `함대가 귀환했습니다!`;
if (anyShipsReturned) {
notificationMsg += fleetMsg;
} else {
notificationMsg += "\n\n모든 함선이 전투에서 파괴되었습니다.";
}

if (lootMsg) {
notificationMsg += lootMsg;
}

sendNotification(uuid, notificationMsg);

// pendingReturn 및 pendingAttack 삭제
delete userGameData[uuid].pendingReturn;
delete userGameData[uuid].pendingAttack;

// 사용자 데이터 저장
saveUserGameData(userGameData);

Log.d(`함대 귀환 처리 완료: ${uuid}`);

return true;
} catch (e) {
Log.e(`함대 귀환 처리 오류: ${e}`);
return false;
}
}

// API2 이벤트 리스너 추가 - 메시지 처리
function onMessage(msg) {
// 로그인 명령어는 별도 처리
if (msg.content.startsWith("로그인 ")) {
// login.js에서 처리하므로 여기서는 넘어감
return;
}

// 도움말 명령어 처리
if (msg.content === "도움말") {
const helpMessage = `🚀 [X-Nova 명령어 도움말]

▶ 기본 명령어:
홈 - 메인 화면 보기
자원 - 현재 자원 확인
광산 - 광산 현황 확인
군수공장 - 군수공장 현황 확인
연구소 - 연구 현황 확인
함대 - 보유 함대 확인
방어시설 - 방어 시설 확인
은하지도 [시스템번호] - 은하 지도 보기
랭킹 - 플레이어 랭킹 확인

▶ 건설 관련 명령어:
건설 [건물명] - 건물 건설 시작
건설 확인 - 건설 확인
건설 취소 - 건설 취소

▶ 연구 관련 명령어:
연구 [연구명] - 연구 시작
연구 확인 - 연구 확인
연구 취소 - 연구 취소

▶ 함대 관련 명령어:
함대건조 [함선명] [수량] - 함대 건조
방시건조 [방어시설명] [수량] - 방어시설 건조
공격 [좌표] [함선명] [수량] - 다른 플레이어 공격
함대귀환 - 함대 귀환 명령

▶ 기타 명령어:
좌표 - 자신의 좌표 확인
단축키도움말 - 단축키 사용법 확인`;

msg.reply(helpMessage);
return;
}

let commands = ["홈", "자원", "광산", "군수공장", "건설", "연구", "연구소", "함대건조", "함대", "확인", "취소", "연구 확인", "연구 취소", "방시건조", "건설 확인", "건설 취소", "좌표", "은하지도", "공격", "함대귀환", "방어시설", "랭킹", "도움말"];

let isCommand = commands.some(function(cmd) {
return (msg.content === cmd || msg.content.startsWith(cmd + " "));
});

// 명령어가 아니면 무시
if (!isCommand) return;

// 그룹채팅인지 확인
let isGroupChat = (msg.room === "실시간 우주함대전략RTS게임 X-Nova");

// 개인톡(1:1 대화)
let isPersonalChat = !isGroupChat;

// 지정된 그룹채팅방이 아니고 개인톡도 아니면 무시
if (!isGroupChat && !isPersonalChat) return;

// 로그인 데이터 직접 로드
let isLoggedIn = false;
let effectiveHash = msg.author.hash;

// 로그인 데이터 확인
try {
let loginData = JSON.parse(FileStream.read("/storage/emulated/0/ChatBot/database/loginData.json") || "{}");
if (loginData[msg.author.hash]) {
effectiveHash = loginData[msg.author.hash];
isLoggedIn = true;
Log.d("로그인 상태 확인: " + msg.author.hash + " -> " + effectiveHash + " (로그인됨)");
} else {
Log.d("로그인 상태 확인: " + msg.author.hash + " (로그인되지 않음)");
}
} catch (e) {
Log.e("로그인 데이터 로드 실패: " + e);
}

let userGameData = loadUserGameData();
// 로그인된 해시값 또는 원래 해시값 사용
let userHash = effectiveHash;

// 자동으로 사용자 데이터 초기화
initUserGameData(userHash, userGameData);

// 사용자의 마지막 채팅 정보 저장 (개인톡/그룹톡 구분을 위해)
userGameData[userHash].lastChatInfo = {
isGroupChat: isGroupChat,
roomName: isGroupChat ? msg.room : null,
sender: msg.sender || msg.author.name, // sender 또는 author.name을 사용하여 항상 닉네임 저장
time: Date.now()
};

// 채널 정보도 함께 저장
saveUserChannel(userHash, isGroupChat ? msg.room : (msg.sender || msg.author.name), isGroupChat);

// **새로 추가된 코드: 전투 완료된 pendingAttack 처리 - 가장 먼저 확인하여 처리**
if (userGameData[userHash].pendingAttack) {
if (userGameData[userHash].pendingAttack.battleCompleted) {
// 전투가 완료된 경우 pendingAttack 삭제
Log.d(`전투 완료된 pendingAttack 제거 시작: ${userHash}`);
delete userGameData[userHash].pendingAttack;
saveUserGameData(userGameData); // 즉시 저장
Log.d(`전투 완료된 pendingAttack 제거 완료: ${userHash}`);

// 경우에 따라 pendingReturn도 없을 수 있으므로 복구
userGameData = loadUserGameData(); // 최신 데이터 다시 로드
if (!userGameData[userHash].pendingReturn && userGameData[userHash].returningFleet) {
Log.d(`귀환 정보 누락 감지, 복구 시도: ${userHash}`);
// 간단한 귀환 정보 생성
userGameData[userHash].pendingReturn = {
fleet: userGameData[userHash].returningFleet,
loot: userGameData[userHash].lootedResources || { metal: 0, crystal: 0, deuterium: 0 },
returnTime: Date.now() + 60000, // 1분 후 도착
startTime: Date.now()
};

// 귀환 타이머 설정
scheduleFleetReturn(userHash, Date.now() + 60000);
saveUserGameData(userGameData);
}
} else {
// 전투가 완료되지 않았지만 도착 시간이 지난 경우 처리
let pa = userGameData[userHash].pendingAttack;
let elapsed = (Date.now() - pa.attackStartTime) / 1000;
if (elapsed >= pa.travelTime) {
Log.d(`도착했지만 처리되지 않은 공격 자동 처리 시작: ${userHash}`);
// 즉시 전투 처리
processAttackArrival(userHash, pa.targetHash, pa.fleet, pa.capacity);
// 데이터 다시 로드 (pendingAttack이 삭제되었을 것)
userGameData = loadUserGameData();
Log.d(`도착했지만 처리되지 않은 공격 자동 처리 완료: ${userHash}`);
}
}
}

saveUserGameData(userGameData);

// 귀환 함대 처리 - 귀환한 함대 즉시 처리
if (userGameData[userHash].pendingReturn) {
let pr = userGameData[userHash].pendingReturn;
if (Date.now() >= pr.returnTime) {
Log.d(`귀환한 함대 감지, 즉시 처리 시작: ${userHash}`);
// 함대 귀환 완료
// 생존한 함대 복원
let fleetToAdd = pr.fleet || pr.survivingFleet || {};
for (let type in fleetToAdd) {
userGameData[userHash].fleet[type] = (userGameData[userHash].fleet[type] || 0) + fleetToAdd[type];
}

// 약탈한 자원 추가
if (pr.loot) {
userGameData[userHash].자원 = userGameData[userHash].자원 || {};
for (let res in pr.loot) {
if (pr.loot[res] > 0) {
userGameData[userHash].자원[res] = (userGameData[userHash].자원[res] || 0) + pr.loot[res];
}
}
}

// 귀환 정보 삭제
delete userGameData[userHash].pendingReturn;
delete userGameData[userHash].pendingAttack; // 혹시 남아있을 경우 대비
delete userGameData[userHash].returningFleet; // 추가: returningFleet도 삭제
delete userGameData[userHash].lootedResources; // 추가: lootedResources도 삭제

saveUserGameData(userGameData);
Log.d(`귀환한 함대 처리 완료: ${userHash}`);

if (userHash === msg.author.hash) {
msg.reply("함대가 귀환했습니다! 생존한 함대와 약탈한 자원이 추가되었습니다.");
}

// 여기서 바로 리턴하여 다른 명령어 처리하지 않음
return;
}
}

// --- 공격 타이머 확인 및 전투 처리 추가 ---
// 공격 함대가 목적지에 도달한 경우 전투 처리
// 참고: 이미 위에서 처리했으므로 여기서는 간소화
if (userGameData[userHash].pendingAttack) {
let pa = userGameData[userHash].pendingAttack;

// 이미 위에서 전투 완료, 목적지 도착 등의 처리를 했으므로
// 여기서는 메시지만 보내고 다음 명령어 처리로 넘어감
if (pa.battleCompleted) {
Log.d(`이미 전투 완료된 공격 감지됨: ${userHash} - 처리 스킵`);
} else {
let elapsed = (Date.now() - pa.attackStartTime) / 1000;
if (elapsed >= pa.travelTime) {
Log.d(`이미 위에서 처리했어야 하는 도착한 공격 감지: ${userHash} - 안전장치 활성화`);
msg.reply("공격이 이미 목적지에 도달했습니다. 잠시 후 다시 시도해주세요.");
return;
}
}
}

saveUserGameData(userGameData);

// --- 건설 확인 응답 처리 (건설 확인 / 건설 취소) ---
if (msg.content === "건설 확인" || msg.content === "건설 취소") {
if (userGameData[userHash].pendingConstruction) {
let pending = userGameData[userHash].pendingConstruction;
if (msg.content === "건설 확인") {
let cost = pending.cost;
let userRes = userGameData[userHash].자원;
let sufficient = true;
for (let res in cost) {
if (userRes[res] < cost[res]) { sufficient = false; break; }
}
if (!sufficient) {
delete userGameData[userHash].pendingConstruction;
saveUserGameData(userGameData);
msg.reply("자원이 부족하여 건설할 수 없습니다.");
return;
}
for (let res in cost) { userRes[res] -= cost[res]; }
userGameData[userHash].construction = {
building: pending.buildingName,
type: pending.buildingType || "광산", // buildingType 속성이 없는 경우 "광산"으로 기본값 설정
startTime: Date.now(),
finishTime: Date.now() + pending.buildTime * 1000
};
delete userGameData[userHash].pendingConstruction;
saveUserGameData(userGameData);

// 건설 완료 타이머 설정
scheduleConstructionCompletion(
userHash,
pending.buildingName,
pending.buildingType || "광산",
Date.now() + pending.buildTime * 1000
);

msg.reply(pending.buildingName + " 업그레이드 건설이 시작되었습니다. 건설시간: " + formatTime(pending.buildTime));
} else {
delete userGameData[userHash].pendingConstruction;
saveUserGameData(userGameData);
msg.reply("건설을 취소하였습니다.");
}
} else {
msg.reply("진행 중인 건설 요청이 없습니다.");
}
return;
}

// --- 연구 확인 응답 처리 (연구 확인 / 연구 취소) ---
if (msg.content === "연구 확인" || msg.content === "연구 취소") {
if (userGameData[userHash].pendingResearch) {
let pending = userGameData[userHash].pendingResearch;
if (msg.content === "연구 확인") {
let cost = pending.cost;
let userRes = userGameData[userHash].자원;
let sufficient = true;
for (let res in cost) {
if (userRes[res] < cost[res]) { sufficient = false; break; }
}
if (sufficient) {
for (let res in cost) { userRes[res] -= cost[res]; }
let currentLevel = userGameData[userHash].researchLevels[pending.researchName] || 0;
let researchTime = pending.time;
userGameData[userHash].researchProgress = {
researchName: pending.researchName,
startTime: Date.now(),
finishTime: Date.now() + researchTime * 1000,
currentLevel: currentLevel
};

// 연구 완료 타이머 설정
scheduleResearchCompletion(
userHash,
pending.researchName,
Date.now() + researchTime * 1000
);

msg.reply(pending.researchName + " 연구가 시작되었습니다. 연구시간: " + formatTime(researchTime));
} else {
msg.reply("자원이 부족하여 연구를 진행할 수 없습니다.");
}
} else {
msg.reply("연구를 취소하였습니다.");
}
delete userGameData[userHash].pendingResearch;
saveUserGameData(userGameData);
} else {
msg.reply("진행 중인 연구 요청이 없습니다.");
}
return;
}

// --- 진행중인 건설, 연구, 함대건조, 방어시설 건조 타이머 확인 및 설정 ---
if (userGameData[userHash].construction) {
let cons = userGameData[userHash].construction;
if (cons.finishTime > Date.now()) {
// 아직 진행 중인 건설이 있으면 타이머 설정
scheduleConstructionCompletion(userHash, cons.building, cons.type, cons.finishTime);
} else {
// 이미 완료된 건설이 있으면 즉시 처리
processConstructionCompletion(userHash, cons.building, cons.type);
msg.reply("건설이 완료되었습니다!");
}
}

if (userGameData[userHash].researchProgress) {
let rp = userGameData[userHash].researchProgress;
if (rp.finishTime > Date.now()) {
// 아직 진행 중인 연구가 있으면 타이머 설정
scheduleResearchCompletion(userHash, rp.researchName, rp.finishTime);
} else {
// 이미 완료된 연구가 있으면 즉시 처리
processResearchCompletion(userHash, rp.researchName);
msg.reply("연구가 완료되었습니다!");
}
}

if (userGameData[userHash].fleetProgress) {
let fp = userGameData[userHash].fleetProgress;
if (fp.finishTime > Date.now()) {
// 아직 진행 중인 함대 건조가 있으면 타이머 설정
scheduleFleetCompletion(userHash, fp.fleetName, fp.quantity, fp.finishTime);
} else {
// 이미 완료된 함대 건조가 있으면 즉시 처리
processFleetCompletion(userHash, fp.fleetName, fp.quantity);
msg.reply("함대 건조가 완료되었습니다!");
}
}

if (userGameData[userHash].defenseProgress) {
let dp = userGameData[userHash].defenseProgress;
if (dp.finishTime > Date.now()) {
// 아직 진행 중인 방어시설 건조가 있으면 타이머 설정
scheduleDefenseCompletion(userHash, dp.defenseName, dp.quantity, dp.finishTime);
} else {
// 이미 완료된 방어시설 건조가 있으면 즉시 처리
processDefenseCompletion(userHash, dp.defenseName, dp.quantity);
msg.reply("방어시설 건조가 완료되었습니다!");
}
}

// 공격 타이머 확인 및 설정
if (userGameData[userHash].pendingAttack) {
let pa = userGameData[userHash].pendingAttack;
let arrivalTime = pa.attackStartTime + (pa.travelTime * 1000);

if (!pa.battleCompleted && arrivalTime > Date.now()) {
// 아직 도착하지 않은 공격이 있으면 타이머 설정
scheduleAttackArrival(userHash, pa.targetHash, arrivalTime, pa.fleet, pa.capacity);
} else if (!pa.battleCompleted) {
// 이미 도착했지만 처리되지 않은 공격이 있으면 즉시 처리
processAttackArrival(userHash, pa.targetHash, pa.fleet, pa.capacity);
// 처리 후 메시지 표시
msg.reply("공격이 목표에 도달했습니다. 전투 결과는 메시지함을 확인하세요.");

// 처리 후 pendingAttack 정리
delete userGameData[userHash].pendingAttack;
saveUserGameData(userGameData);
}
}

// 귀환 타이머 확인 및 설정
if (userGameData[userHash].pendingReturn) {
let pr = userGameData[userHash].pendingReturn;
if (pr.returnTime > Date.now()) {
// 아직 귀환하지 않은 함대가 있으면 타이머 설정
scheduleFleetReturn(userHash, pr.returnTime);
} else {
// 이미 귀환했지만 처리되지 않은 함대가 있으면 즉시 처리
processFleetReturn(userHash);
msg.reply("함대가 귀환했습니다!");
}
}

// "홈" 명령어 처리
if (msg.content === "홈") {
let homeMsg = "🌌 행성 좌표: " + userGameData[userHash].coordinate + "\n\n";

// 공격 중인 상태 표시
if (userGameData[userHash].pendingAttack && !userGameData[userHash].pendingAttack.battleCompleted) {
let pa = userGameData[userHash].pendingAttack;
let elapsed = (Date.now() - pa.attackStartTime) / 1000;
let remaining = Math.max(0, pa.travelTime - elapsed);
homeMsg += "[공격 진행 중]\n목표 좌표: " + pa.targetCoord + "\n남은 이동시간: " + formatTime(remaining) + "\n\n";

// 남은 시간이 0초인 경우 자동으로 처리
if (remaining <= 0) {
processAttackArrival(userHash, pa.targetHash, pa.fleet, pa.capacity);
// 공격 진행 중 메시지 삭제
homeMsg = homeMsg.replace(/\[공격 진행 중\][\s\S]*?남은 이동시간: [^]*?\n\n/, "");
}
}

// 공격받는 중 상태 표시
if (userGameData[userHash].incomingAttack) {
let ia = userGameData[userHash].incomingAttack;
let elapsed = (Date.now() - ia.attackStartTime) / 1000;
let remaining = Math.max(0, ia.travelTime - elapsed);

// 이미 도착한 공격은 처리
if (remaining <= 0) {
// 도착한 공격은 처리된 것으로 간주하고 상태 업데이트
userGameData[userHash].incomingAttack = null;
saveUserGameData(userGameData);
} else {
homeMsg += "[경고: 공격받는 중]\n공격자: " + ia.attackerName + "\n남은 도착시간: " + formatTime(remaining) + "\n\n";
}
}

// 귀환 중인 상태 표시
if (userGameData[userHash].pendingReturn) {
let pr = userGameData[userHash].pendingReturn;
let remainingReturn = Math.max(0, (pr.returnTime - Date.now()) / 1000);
homeMsg += "[함대 귀환 중]\n남은 귀환시간: " + formatTime(remainingReturn) + "\n\n";

// 남은 시간이 0초인 경우 자동으로 처리
if (remainingReturn <= 0) {
processFleetReturn(userHash);
// 귀환 중 메시지 삭제
homeMsg = homeMsg.replace(/\[함대 귀환 중\][\s\S]*?남은 귀환시간: [^]*?\n\n/, "");
}
}

// 원래 홈 정보 표시
if (userGameData[userHash].construction) {
let cons = userGameData[userHash].construction;
let remainingCons = Math.ceil((cons.finishTime - Date.now()) / 1000);
homeMsg += "건설 진행 중: " + cons.building + "\n남은 건설시간: " + formatTime(remainingCons) + "\n";
} else {
homeMsg += "건설 진행 중인 건물이 없습니다.\n";
}
if (userGameData[userHash].researchProgress) {
let rp = userGameData[userHash].researchProgress;
let remainingRp = Math.ceil((rp.finishTime - Date.now()) / 1000);
homeMsg += "연구 진행 중: " + rp.researchName + "\n남은 연구시간: " + formatTime(remainingRp) + "\n";
} else {
homeMsg += "진행중인 연구가 없습니다.\n";
}
if (userGameData[userHash].fleetProgress) {
let fp = userGameData[userHash].fleetProgress;
let remainingFleet = Math.ceil((fp.finishTime - Date.now()) / 1000);

// 남은 함대 수량만 표시하도록 수정
homeMsg += "함대 건조 진행 중: " + fp.fleetName + " (" + fp.remainingQuantity + "기 남음)\n";
homeMsg += "다음 함선 완성까지: " + formatTime(remainingFleet) + "\n";

// 전체 남은 시간 계산 및 표시
let totalRemaining = Math.floor((fp.totalTime - (Date.now() - fp.startTime)) / 1000);
if (totalRemaining < 0) totalRemaining = 0;
homeMsg += "전체 완료까지: " + formatTime(totalRemaining) + "\n";
} else {
homeMsg += "진행중인 함대 건조가 없습니다.\n";
}
if (userGameData[userHash].defenseProgress) {
let dp = userGameData[userHash].defenseProgress;
let remainingDefense = Math.ceil((dp.finishTime - Date.now()) / 1000);
homeMsg += "방어시설 건조 진행 중: " + dp.defenseName + " (" + dp.quantity + "대)\n남은 건조시간: " + formatTime(remainingDefense) + "\n";
} else {
homeMsg += "진행중인 방어시설 건조가 없습니다.\n";
}

msg.reply(homeMsg);
return;
}

// "좌표" 명령어 처리
if (msg.content === "좌표") {
let coordMsg = "🌌 나의 행성 좌표: " + userGameData[userHash].coordinate;
msg.reply(coordMsg);
return;
}

// "공격상태" 명령어 처리 - 공격 상태 확인 및 처리
if (msg.content === "공격상태") {
if (!userGameData[userHash].pendingAttack) {
msg.reply("진행 중인 공격이 없습니다.");
return;
}

let pa = userGameData[userHash].pendingAttack;
let arrivalTime = pa.attackStartTime + (pa.travelTime * 1000);
let now = Date.now();

if (!pa.battleCompleted && arrivalTime <= now) {
// 이미 도착했지만 처리되지 않은 공격 처리
processAttackArrival(userHash, pa.targetHash, pa.fleet, pa.capacity);
msg.reply("공격이 목표에 도달했습니다. 전투 결과는 메시지함을 확인하세요.");
} else if (!pa.battleCompleted) {
// 아직 도착하지 않은 공격
let remaining = Math.max(0, (arrivalTime - now) / 1000);
msg.reply(`공격 함대가 이동 중입니다. 목표 좌표: ${pa.targetCoord}\n남은 이동시간: ${formatTime(remaining)}`);
} else {
// 전투 완료, 귀환 중
msg.reply("공격은 이미 완료되었으며, 함대가 귀환 중입니다.");
}
return;
}

// "방어상태" 명령어 처리 - 공격 받는 상태 확인 및 업데이트
if (msg.content === "방어상태") {
if (!userGameData[userHash].incomingAttack) {
msg.reply("공격 받고 있지 않습니다.");
return;
}

let ia = userGameData[userHash].incomingAttack;
let arrivalTime = ia.attackStartTime + (ia.travelTime * 1000);
let now = Date.now();

if (arrivalTime <= now) {
// 이미 도착했지만 처리되지 않은 공격은 처리된 것으로 간주하고 상태 업데이트
userGameData[userHash].incomingAttack = null;
saveUserGameData(userGameData);
msg.reply("공격이 이미 도착했으며 전투가 완료되었습니다. 전투 결과는 메시지함을 확인하세요.");
} else {
// 아직 도착하지 않은 공격
let remaining = Math.max(0, (arrivalTime - now) / 1000);
msg.reply(`[경고] 공격 받는 중입니다.\n공격자: ${ia.attackerName} (${ia.attackerCoord})\n남은 도착시간: ${formatTime(remaining)}`);
}
return;
}

// "은하지도" 명령어 처리
if (msg.content === "은하지도" || msg.content.startsWith("은하지도 ")) {
let mapMsg = "🌌 [은하지도]\n";
let targetSystem = null;

// 명령어에서 시스템 번호 추출 (은하지도 222 형식)
if (msg.content.startsWith("은하지도 ")) {
let parts = msg.content.split(" ");
if (parts.length > 1 && !isNaN(parseInt(parts[1]))) {
targetSystem = parseInt(parts[1]);
}
}

if (targetSystem) {
// 특정 시스템 보기 (은하지도 222)
mapMsg = `🌌 [은하지도 - 시스템 ${targetSystem}]\n\n`;

// 기본 은하는 1로 가정 (게임에서 여러 은하를 구현한다면 조정 필요)
const galaxy = 1;

// 행성 포인트 1~15 생성
let planetPoints = {};
for (let i = 1; i <= 15; i++) {
planetPoints[i] = { type: "빈 공간", name: null, owner: null, debris: false, moon: false };
}

// 디버깅: 모든 유저의 좌표 확인
Log.d("모든 유저 좌표 확인:");
for (let id in userGameData) {
if (userGameData[id].coordinate) {
Log.d(`${id}: ${userGameData[id].coordinate}`);
}
}

// 해당 시스템의 행성 정보 수집
let foundPlanets = 0;
for (let id in userGameData) {
if (userGameData[id].coordinate) {
let coord = userGameData[id].coordinate;
let parts = coord.split(":");

// 좌표 파싱 및 디버깅
const parsedGalaxy = parseInt(parts[0]);
const parsedSystem = parseInt(parts[1]);
const parsedPlanet = parseInt(parts[2]);

Log.d(`좌표 분석: ${coord} => 은하: ${parsedGalaxy}, 시스템: ${parsedSystem}, 행성: ${parsedPlanet}`);

// 좌표가 x:y:z 형식이고, 지정된 시스템(y)과 일치하는지 확인
if (parts.length === 3 && parsedGalaxy === galaxy && parsedSystem === targetSystem) {
foundPlanets++;
Log.i(`시스템 ${targetSystem}에서 행성 발견: ${coord}, 플레이어: ${id}, 이름: ${userGameData[id].playerName || '익명'}`);

// 유효한 행성 위치(1~15)인지 확인
if (parsedPlanet >= 1 && parsedPlanet <= 15) {
planetPoints[parsedPlanet] = {
type: "행성",
name: userGameData[id].playerName || userGameData[id].lastChatInfo?.sender || "익명 행성",
owner: id === userHash ? "(내 행성)" : "",
coord: coord,
debris: false, // 기본값
moon: false // 기본값
};
}
}
}
}

// 로그 추가: 행성 정보 수집 결과 확인
Log.i(`은하지도 시스템 ${targetSystem} 검색 결과: 발견된 행성 수 ${foundPlanets}`);

// 현재 사용자의 좌표 확인 로그 추가
Log.i(`현재 사용자 좌표: ${userGameData[userHash].coordinate}, userHash: ${userHash}`);

// 시스템 내 함대 파편 정보 (전투가 있었던 위치)
// 실제 코드에서는 파편 데이터를 저장하는 구조가 필요
for (let id in userGameData) {
// 파편 데이터가 있는지 확인
if (userGameData[id].battleDebris) {
Log.d(`유저 ${id}의 battleDebris 데이터 확인: ${JSON.stringify(userGameData[id].battleDebris)}`);

for (let debrisCoord in userGameData[id].battleDebris) {
let parts = debrisCoord.split(":");

// 지정된 시스템과 일치하는 파편인지 확인
if (parts.length === 3 && parseInt(parts[0]) === galaxy && parseInt(parts[1]) === targetSystem) {
let debrisPos = parseInt(parts[2]);
Log.d(`파편 발견: ${debrisCoord}, 위치: ${debrisPos}`);

if (debrisPos >= 1 && debrisPos <= 15) {
// 해당 위치에 행성이 있으면 파편 정보만 추가, 없으면 빈 공간에 파편 표시
if (planetPoints[debrisPos].type === "행성") {
planetPoints[debrisPos].debris = true;
} else {
planetPoints[debrisPos] = {
type: "빈 공간",
name: null,
owner: null,
debris: true,
moon: false
};
}
}
}
}
}

// 달 정보가 있는지 확인
if (userGameData[id].moons) {
Log.d(`유저 ${id}의 moons 데이터 확인: ${JSON.stringify(userGameData[id].moons)}`);

for (let moonCoord in userGameData[id].moons) {
let parts = moonCoord.split(":");

// 지정된 시스템과 일치하는 달인지 확인
if (parts.length === 3 && parseInt(parts[0]) === galaxy && parseInt(parts[1]) === targetSystem) {
let moonPos = parseInt(parts[2]);
Log.d(`달 발견: ${moonCoord}, 위치: ${moonPos}`);

if (moonPos >= 1 && moonPos <= 15 && planetPoints[moonPos].type === "행성") {
planetPoints[moonPos].moon = true;
}
}
}
}
}

// 디버깅: 최종 행성 정보 확인
Log.d("최종 행성 정보:");
for (let i = 1; i <= 15; i++) {
Log.d(`위치 ${i}: ${JSON.stringify(planetPoints[i])}`);
}

// 시스템 내 행성 정보 출력
for (let i = 1; i <= 15; i++) {
const point = planetPoints[i];

mapMsg += `${galaxy}:${targetSystem}:${i} - `;

if (point.type === "행성") {
// 실제 행성 데이터 출력 - 간결하게 이름만 표시
let displayName = point.name;
if (point.owner === "(내 행성)") {
displayName += " " + point.owner;
}
mapMsg += displayName;

// 파편이나 달이 있다면 표시
if (point.debris) mapMsg += " [함대파편]";
if (point.moon) mapMsg += " [달]";
} else {
// 사용자 정보 검색: 해당 위치에 행성이 있는지 재확인
let foundPlayer = false;
for (let id in userGameData) {
if (userGameData[id].coordinate) {
let parts = userGameData[id].coordinate.split(":");
if (parts.length === 3 &&
parseInt(parts[0]) === galaxy &&
parseInt(parts[1]) === targetSystem &&
parseInt(parts[2]) === i) {

// 사용자 발견, 정보 업데이트 - 간결하게 이름만 표시
let displayName = userGameData[id].playerName || userGameData[id].lastChatInfo?.sender || "익명 행성";
if (id === userHash) {
displayName += " (내 행성)";
}
mapMsg += displayName;
foundPlayer = true;
break;
}
}
}

// 행성이 없으면 빈 공간으로 표시
if (!foundPlayer) {
mapMsg += "빈 공간";
if (point.debris) mapMsg += " [함대파편]";
}
}

mapMsg += "\n";
}

// 디버깅 정보 추가 - 간결한 사용자 수만 표시
let userCount = Object.keys(userGameData).length;
mapMsg += "\n- 전체 사용자 수: " + userCount;

// 기존 디버깅 정보 제거
// if (foundPlanets === 0) {
// mapMsg += "\n[시스템 정보] 해당 시스템에서 행성을 찾을 수 없습니다.";
// mapMsg += "\n현재 자신의 좌표: " + userGameData[userHash].coordinate;
//
// // 게임 데이터 상태 확인
// mapMsg += "\n게임 데이터 상태 확인:";
// let userCount = Object.keys(userGameData).length;
// mapMsg += `\n- 전체 사용자 수: ${userCount}`;
//
// // 좌표 데이터 분석
// let coordCount = 0;
// for (let id in userGameData) {
// if (userGameData[id].coordinate) {
// coordCount++;
// }
// }
// mapMsg += `\n- 좌표 데이터 있는 사용자 수: ${coordCount}`;
//
// // 좌표 분석 정보
// let yourCoord = userGameData[userHash].coordinate;
// if (yourCoord) {
// let parts = yourCoord.split(":");
// if (parts.length === 3) {
// mapMsg += `\n- 현재 좌표 분석: 은하 ${parts[0]}, 시스템 ${parts[1]}, 행성 ${parts[2]}`;
// }
// }
//
// // 로그인 데이터 확인
// try {
// let loginData = JSON.parse(FileStream.read("/storage/emulated/0/ChatBot/database/loginData.json") || "{}");
// mapMsg += "\n로그인 상태: " + (loginData[msg.author.hash] ? "로그인됨" : "로그인되지 않음");
// if (loginData[msg.author.hash]) {
// mapMsg += ` (${msg.author.hash} -> ${loginData[msg.author.hash]})`;
// }
// } catch (e) {
// mapMsg += "\n로그인 데이터 확인 중 오류: " + e;
// }
// }
} else {
// 기존 은하지도 - 모든 행성 표시
let count = 0;
let myCoord = userGameData[userHash].coordinate;

// 모든 행성 좌표와 소유자를 표시
for (let id in userGameData) {
if (userGameData[id].coordinate) {
let playerName = userGameData[id].playerName || userGameData[id].lastChatInfo?.sender || "익명 행성";
let coord = userGameData[id].coordinate;
let distance = calculateDistance(myCoord, coord);

mapMsg += coord + " - " + playerName;
// 자신의 행성이면 표시
if (id === userHash) {
mapMsg += " (내 행성)";
} else if (distance !== Infinity) {
// 거리 표시
mapMsg += " (거리: " + distance.toFixed(2) + ")";
}
mapMsg += "\n";
count++;

// 너무 많은 행성이 있으면 일부만 표시
if (count >= 10) {
mapMsg += "...외 다수의 행성이 있습니다.";
break;
}
}
}

if (count === 0) {
mapMsg += "은하지도에 표시할 행성이 없습니다.";
}

mapMsg += "\n\n특정 항성계 보기: '은하지도 [시스템번호]'";
}

msg.reply(mapMsg);
return;
}

// "공격" 명령어 처리
if (msg.content.startsWith("공격 ")) {
// 이미 공격 중인지 확인
if (userGameData[userHash].pendingAttack) {
// 공격이 이미 도착했는지 확인
let pa = userGameData[userHash].pendingAttack;
let elapsed = (Date.now() - pa.attackStartTime) / 1000;
let remaining = Math.max(0, pa.travelTime - elapsed);

// 이미 도착한 공격이라면 처리
if (remaining <= 0 && !pa.battleCompleted) {
processAttackArrival(userHash, pa.targetHash, pa.fleet, pa.capacity);
// 다시 공격 명령어 처리로 돌아가지만 이미 pendingAttack은 처리되었음
} else if (pa.battleCompleted && !userGameData[userHash].pendingReturn) {
// 이미 전투는 완료되었지만 귀환 정보가 없는 경우
// 자동으로 귀환 정보 생성
Log.d("전투 완료된 함대의 귀환 정보가 누락되어 자동으로 생성합니다.");

// 귀환 시간 설정 (공격과 동일한 시간)
let returnTime = pa.travelTime;
// 현재 시점에서 1분 후 도착하도록 설정
let arrivalTime = Date.now() + (60 * 1000);

// 생존한 함대 정보 생성
let survivingFleet = {};
for (let shipType in pa.fleet) {
// 함선의 50%가 생존했다고 가정
let survivingCount = Math.floor(pa.fleet[shipType] * 0.5);
if (survivingCount > 0) {
survivingFleet[shipType] = survivingCount;
}
}

// 귀환 정보 생성
userGameData[userHash].pendingReturn = {
fleet: survivingFleet,
lootedResources: {
metal: 0,
crystal: 0,
deuterium: 0
},
returnTime: arrivalTime
};

// 귀환 타이머 설정
scheduleFleetReturn(userHash, arrivalTime);
saveUserGameData(userGameData);

msg.reply("함대 귀환 정보가 누락되어 자동으로 복구했습니다. 함대가 1분 후에 귀환할 예정입니다.");
return;
} else if (pa.battleCompleted && userGameData[userHash].pendingReturn) {
// 전투 완료 및 귀환 중인 경우
let pr = userGameData[userHash].pendingReturn;
let remainingReturn = Math.max(0, (pr.returnTime - Date.now()) / 1000);
msg.reply(`함대가 전투를 마치고 귀환 중입니다. 남은 귀환 시간: ${formatTime(remainingReturn)}`);
return;
} else {
// 아직 진행 중인 공격이 있음
msg.reply("이미 함대가 출격 중입니다. 귀환 후 다시 시도해주세요.");
return;
}
}

// 명령어 파싱
let parts = msg.content.split(" ");
if (parts.length < 2) {
msg.reply("공격할 좌표를 입력해주세요. 예: 공격 1:42:7 전투기 5 공격기 2");
return;
}

let targetCoord = parts[1];
// 좌표 형식 확인 (x:y:z)
if (!/^\d+:\d+:\d+$/.test(targetCoord)) {
msg.reply("잘못된 좌표 형식입니다. 예: 1:42:7");
return;
}

// 타겟 행성 찾기
let targetHash = null;
for (let id in userGameData) {
if (userGameData[id].coordinate === targetCoord) {
targetHash = id;
break;
}
}

if (!targetHash) {
msg.reply("해당 좌표에 행성이 존재하지 않습니다.");
return;
}

// 자신의 행성은 공격할 수 없음
if (targetHash === userHash) {
msg.reply("자신의 행성은 공격할 수 없습니다.");
return;
}

// 현재 보유 함대 확인
let currentFleet = userGameData[userHash].fleet || {};
let hasFleet = false;
for (let type in currentFleet) {
if (currentFleet[type] > 0 && type !== "태양광인공위성") { // 태양광인공위성 제외
hasFleet = true;
break;
}
}

if (!hasFleet) {
msg.reply("출격할 함대가 없습니다. 함대를 먼저 건조해주세요.");
return;
}

// 출격할 함대 구성
let attackFleet = {};
let fleetSpecified = false;

// 명령어에서 함대 구성 정보 추출 (공격 1:42:7 전투기 5 공격기 2)
for (let i = 2; i < parts.length; i += 2) {
let shipType = parts[i];
let quantity = parseInt(parts[i + 1], 10);

// 태양광인공위성은 공격에 사용할 수 없음
if (shipType === "태양광인공위성") {
msg.reply("태양광인공위성은 공격에 참여할 수 없습니다.");
return;
}

// 함선 유형 확인
if (!fleetData[shipType]) {
msg.reply(`'${shipType}'은(는) 알 수 없는 함선 유형입니다.`);
return;
}

// 수량 확인
if (isNaN(quantity) || quantity < 1) {
msg.reply(`'${shipType}'의 수량은 1 이상의 숫자여야 합니다.`);
return;
}

// 보유량 확인
if (!currentFleet[shipType] || currentFleet[shipType] < quantity) {
msg.reply(`'${shipType}'을(를) ${quantity}대 보유하고 있지 않습니다. 현재 보유: ${currentFleet[shipType] || 0}대`);
return;
}

attackFleet[shipType] = quantity;
fleetSpecified = true;
}

// 함대를 따로 지정하지 않은 경우 모든 함대 출동 (태양광인공위성 제외)
if (!fleetSpecified) {
msg.reply("함대를 지정하지 않아 모든 전투 함대를 출격시킵니다.");
for (let type in currentFleet) {
if (currentFleet[type] > 0 && type !== "태양광인공위성") {
attackFleet[type] = currentFleet[type];
}
}
}

// 최종 확인 (지정된 함대가 있는지)
let hasAttackFleet = false;
for (let type in attackFleet) {
if (attackFleet[type] > 0) {
hasAttackFleet = true;
break;
}
}

if (!hasAttackFleet) {
msg.reply("출격할 함대가 지정되지 않았습니다.");
return;
}

// 거리 계산
let distance = calculateDistance(userGameData[userHash].coordinate, targetCoord);

// 함대 속도 계산 (가장 느린 함선 기준)
let minSpeed = Infinity;
for (let type in attackFleet) {
if (attackFleet[type] > 0 && fleetData[type] && fleetData[type].details) {
let shipSpeed = fleetData[type].details.shipStats?.속도 || 10000;
minSpeed = Math.min(minSpeed, shipSpeed);
}
}

if (minSpeed === Infinity) minSpeed = 10000; // 기본 속도

// 이동 시간 계산 (거리 / 속도 * 3600 = 초)
let travelTime = distance / minSpeed * 3600;

// 연료(듀테륨) 소비량 계산
let fuelConsumption = calculateFuelConsumption(attackFleet, distance, travelTime);

// 보유 듀테륨 확인
if (userGameData[userHash].자원["듀테륨"] < fuelConsumption) {
msg.reply(`듀테륨이 부족합니다. 필요: ${formatNumber(fuelConsumption)}, 보유: ${formatNumber(Math.floor(userGameData[userHash].자원["듀테륨"]))}`);
return;
}

// 듀테륨 차감
userGameData[userHash].자원["듀테륨"] -= fuelConsumption;

// 함대의 총 선적량 계산
let totalCapacity = calculateTotalCapacity(attackFleet);

// 출격할 함대 정보 표시
let fleetInfoMsg = "출격 함대 구성:\n";
for (let type in attackFleet) {
if (attackFleet[type] > 0) {
fleetInfoMsg += `${type}: ${attackFleet[type]}대\n`;
}
}

// 공격 정보 저장
userGameData[userHash].pendingAttack = {
targetCoord: targetCoord,
targetHash: targetHash,
attackStartTime: Date.now(),
travelTime: travelTime,
fleet: attackFleet,
capacity: totalCapacity,
battleCompleted: false,
fuelConsumption: fuelConsumption // 연료 소비량 정보 저장
};

// 상대방에게 공격 표시
userGameData[targetHash].incomingAttack = {
attackerCoord: userGameData[userHash].coordinate,
attackerName: userGameData[userHash].playerName || "익명 행성",
attackerHash: userHash,
attackStartTime: Date.now(),
travelTime: travelTime
};

// 출격한 함대만큼 현재 함대에서 차감
for (let type in attackFleet) {
currentFleet[type] -= attackFleet[type];
}

saveUserGameData(userGameData);

// 공격 도착 타이머 설정
let arrivalTime = Date.now() + (travelTime * 1000);
scheduleAttackArrival(userHash, targetHash, arrivalTime, attackFleet, totalCapacity);

let attackMsg = `✈️ ${targetCoord} 좌표로 함대가 출격했습니다.\n`;
attackMsg += fleetInfoMsg;
attackMsg += `선적량: ${formatNumber(totalCapacity)} 단위\n`;
attackMsg += `연료 소비: ${formatNumber(fuelConsumption)} 듀테륨\n`;
attackMsg += `도착까지 ${formatTime(travelTime)} 소요됩니다.`;
msg.reply(attackMsg);
return;
}

// "함대귀환" 명령어 처리
if (msg.content === "함대귀환") {
if (!userGameData[userHash].pendingAttack) {
msg.reply("출격 중인 함대가 없습니다.");
return;
}

let pa = userGameData[userHash].pendingAttack;
let elapsed = (Date.now() - pa.attackStartTime) / 1000;

// 이미 도착했는지 확인
if (elapsed >= pa.travelTime) {
if (!pa.battleCompleted) {
// 도착했지만 전투가 아직 처리되지 않은 경우
processAttackArrival(userHash, pa.targetHash, pa.fleet, pa.capacity);
msg.reply("함대가 이미 목적지에 도달하여 전투가 처리되었습니다. 함대는 자동으로 귀환합니다.");
} else {
msg.reply("함대가 이미 목적지에 도착했으며 전투가 완료되었습니다. 함대는 귀환 중입니다.");
}
return;
}

// 공격 취소 및 함대 귀환 처리
// 공격 대상의 incomingAttack 제거
if (pa.targetHash && userGameData[pa.targetHash]) {
userGameData[pa.targetHash].incomingAttack = null;
}

// 함대 복구
for (let type in pa.fleet) {
userGameData[userHash].fleet[type] = (userGameData[userHash].fleet[type] || 0) + pa.fleet[type];
}

// 연료(듀테륨) 복구 (일부만 - 소비량의 50%)
if (pa.fuelConsumption) {
let refundFuel = Math.floor(pa.fuelConsumption * 0.5); // 50% 환불
userGameData[userHash].자원["듀테륨"] = (userGameData[userHash].자원["듀테륨"] || 0) + refundFuel;
msg.reply(`함대가 귀환 명령을 받고 즉시 귀환했습니다. 연료 ${formatNumber(refundFuel)} 듀테륨이 반환되었습니다.`);
} else {
msg.reply("함대가 귀환 명령을 받고 즉시 귀환했습니다.");
}

// pendingAttack 완전 제거
delete userGameData[userHash].pendingAttack;
saveUserGameData(userGameData);

return;
}

if (msg.content === "자원") {
updateResources(userHash, userGameData);
let 자원 = userGameData[userHash].자원;
let mine = userGameData[userHash].광산;

// 광산들의 에너지 소비량 계산
let totalEnergyConsumption = getEnergyConsumption(mine["메탈광산"], "메탈광산") +
getEnergyConsumption(mine["크리스탈광산"], "크리스탈광산") +
getEnergyConsumption(mine["듀테륨광산"], "듀테륨광산") +
getEnergyConsumption(mine["핵융합로"], "핵융합로");

// 태양광인공위성 개수 확인
let satelliteCount = userGameData[userHash].fleet?.["태양광인공위성"] || 0;
let fusionLevel = mine["핵융합로"] || 0;

// 에너지 생산량 계산 (태양광인공위성과 핵융합로 포함)
let solarEnergy = getEnergyProduction(mine["태양광발전소"], 0, 0);
let satelliteEnergy = satelliteCount * 25;
let fusionEnergy = fusionLevel > 0 ? Math.floor(30 * fusionLevel * Math.pow(1.05, fusionLevel)) : 0;
let energyProduction = solarEnergy + satelliteEnergy + fusionEnergy;

// 순 에너지 값 계산
let netEnergy = energyProduction - totalEnergyConsumption;

// 에너지 비율 계산 (생산량 감소 로직)
let energyRatio = 1.0;
if (energyProduction < totalEnergyConsumption) {
energyRatio = Math.max(0.0, energyProduction / totalEnergyConsumption);
energyRatio = Math.max(0.1, energyRatio);
}

// 감소된 생산량을 적용하여 시간당 생산량 계산
let metalProduction = Math.floor(getResourceProduction(mine["메탈광산"], "메탈") * energyRatio);
let crystalProduction = Math.floor(getResourceProduction(mine["크리스탈광산"], "크리스탈") * energyRatio);
let deuteriumProduction = Math.floor(getResourceProduction(mine["듀테륨광산"], "듀테륨") * energyRatio);

// 핵융합로 듀테륨 소비량 계산
let fusionDeuteriumConsumption = getFusionDeuteriumConsumption(fusionLevel);

// 순수 듀테륨 생산량 (생산 - 핵융합로 소비)
let netDeuteriumProduction = deuteriumProduction - fusionDeuteriumConsumption;

let resMsg = "📦 [현재 보유 자원]\n" +
"🪨 메탈: " + formatNumber(Math.floor(자원["메탈"])) + " (+" + formatNumber(metalProduction) + "/시간)\n" +
"💎 크리스탈: " + formatNumber(Math.floor(자원["크리스탈"])) + " (+" + formatNumber(crystalProduction) + "/시간)\n" +
"🔋 듀테륨: " + formatNumber(Math.floor(자원["듀테륨"])) + " (+" + formatNumber(netDeuteriumProduction) + "/시간)\n" +
"⚡ 에너지: " + formatNumber(netEnergy);

// 에너지 생산 정보 추가
if (mine["태양광발전소"] > 0 || satelliteCount > 0 || fusionLevel > 0) {
resMsg += "\n\n💡 [에너지 정보]";
if (mine["태양광발전소"] > 0) {
resMsg += "\n태양광발전소: +" + formatNumber(solarEnergy);
}
if (satelliteCount > 0) {
resMsg += "\n태양광인공위성: +" + formatNumber(satelliteEnergy) + " (" + satelliteCount + "대)";
}
if (fusionLevel > 0) {
resMsg += "\n핵융합로: +" + formatNumber(fusionEnergy) + " (Lv" + fusionLevel + ")";
}
resMsg += "\n총 생산량: +" + formatNumber(energyProduction);
resMsg += "\n총 소비량: -" + formatNumber(totalEnergyConsumption);
}

// 에너지가 부족할 경우 경고 메시지 추가
if (netEnergy < 0) {
resMsg += "\n⚠️ 에너지 부족: 자원 생산량이 " + Math.round(energyRatio * 100) + "%로 감소했습니다.";
}

msg.reply(resMsg);
return;
}

if (msg.content === "광산") {
let 광산 = userGameData[userHash].광산;
let mineMsg = "🏗️ [나의 광산 현황]\n" +
"🪨 메탈광산 Lv" + formatNumber(광산["메탈광산"]) + "\n" +
"💎 크리스탈광산 Lv" + formatNumber(광산["크리스탈광산"]) + "\n" +
"🔋 듀테륨광산 Lv" + formatNumber(광산["듀테륨광산"]) + "\n" +
"☀️ 태양광발전소 Lv" + formatNumber(광산["태양광발전소"]) + "\n" +
"🔥 핵융합로 Lv" + formatNumber(광산["핵융합로"]);
msg.reply(mineMsg);
return;
}

if (msg.content === "군수공장") {
let 공장 = userGameData[userHash].군수공장;
let facMsg = "🏭 [군수공장 현황]\n" +
"🤖 로봇공장 Lv" + formatNumber(공장["로봇공장"]) + "\n" +
"🚢 조선소 Lv" + formatNumber(공장["조선소"]) + "\n" +
"🔬 연구소 Lv" + formatNumber(공장["연구소"]) + "\n" +
"🏗️ 나노공장 Lv" + formatNumber(공장["나노공장"]);
msg.reply(facMsg);
return;
}

if (msg.content === "연구소") {
let output = "🏫 [나의 연구 현황]\n";
for (let key in researchData) {
let level = userGameData[userHash].researchLevels[key] || 0;
output += key + " Lv" + formatNumber(level) + "\n";
}
msg.reply(output);
return;
}

if (msg.content === "함대") {
let fleetList = userGameData[userHash].fleet;
let output = "🚀 [나의 함대 현황]\n";
let hasFleet = false;
for (let key in fleetData) {
let cnt = fleetList[key] || 0;
output += key + ": " + formatNumber(cnt) + "기\n";
if (cnt > 0) { hasFleet = true; }
}
if (!hasFleet) { output += "보유한 함대가 없습니다."; }
msg.reply(output);
return;
}

if (msg.content === "방어시설") {
let defenseList = userGameData[userHash].defense || {};
let output = "🛡️ [나의 방어시설 현황]\n";
let hasDefense = false;
for (let key in defenseData) {
let cnt = defenseList[key] || 0;
output += key + ": " + formatNumber(cnt) + "대\n";
if (cnt > 0) { hasDefense = true; }
}
if (!hasDefense) { output += "보유한 방어시설이 없습니다."; }
msg.reply(output);
return;
}

if (msg.content.startsWith("연구 ")) {
// 다른 작업 진행 중인지 확인
if (userGameData[userHash].researchProgress) {
let res = userGameData[userHash].researchProgress;
let remainingTime = Math.max(0, Math.floor((res.finishTime - Date.now()) / 1000));
msg.reply("이미 " + res.researchName + " 연구가 진행 중입니다. 완료까지 " + formatTime(remainingTime) + " 남았습니다.");
return;
}

if (userGameData[userHash].pendingResearch || userGameData[userHash].researchProgress) {
msg.reply("현재 연구가 진행 중입니다. 완료될 때까지 기다려 주세요.");
return;
}

let args = msg.content.split(" ");
if (args.length < 2) {
msg.reply("연구할 연구명을 입력해주세요. 예: 연구 에너지공학");
return;
}
let researchName = args[1];
if (!researchData[researchName]) {
msg.reply("존재하지 않는 연구입니다.");
return;
}
let base = researchData[researchName];
let currentLevel = userGameData[userHash].researchLevels[researchName] || 0;

// 기본 비용 계산 로직만 사용
let reqCost = {};
for (let res in base.cost) {
reqCost[res] = base.cost[res] * Math.pow(2, currentLevel);
}

// 새로운 연구 시간 공식 적용
let totalMetal = reqCost.메탈 || 0;
let totalCrystal = reqCost.크리스탈 || 0;
let labLevel = userGameData[userHash].군수공장["연구소"] || 0;
let universeSpeed = 1; // 우주 속도 배율 (기본값 1)
let researchTimeHours = getResearchTime(totalMetal, totalCrystal, labLevel, universeSpeed);
let reqTime = Math.floor(researchTimeHours * 3600); // 시간을 초로 변환

let costMsg = researchName + " 연구에 필요한 자원:\n";
for (let res in reqCost) {
costMsg += res + ": " + formatNumber(reqCost[res]) + "\n";
}
costMsg += "연구시간: " + formatTime(reqTime) + "\n연구를 시작하시겠습니까? (연구 확인/연구 취소)";
userGameData[userHash].pendingResearch = {
researchName: researchName,
cost: reqCost,
time: reqTime
};
saveUserGameData(userGameData);
msg.reply(costMsg);
return;
}

// "함대건조" 명령어 처리 (조선소 레벨 반영)
if (msg.content.startsWith("함대건조 ")) {
// 다른 작업 진행 중인지 확인
if (userGameData[userHash].fleetProgress) {
let fp = userGameData[userHash].fleetProgress;
let remainingTime = Math.max(0, Math.floor((fp.finishTime - Date.now()) / 1000));
let completedCount = fp.quantity - fp.remainingQuantity;

let statusMsg = "🔄 " + fp.fleetName + " 건조 진행 중:\n";
statusMsg += "- 완료: " + completedCount + "기\n";
statusMsg += "- 남은 수량: " + fp.remainingQuantity + "기\n";
statusMsg += "- 다음 함선 완성까지: " + formatTime(remainingTime) + "\n";

// 전체 남은 시간 계산
let totalRemaining = Math.floor((fp.totalTime - (Date.now() - fp.startTime)) / 1000);
if (totalRemaining < 0) totalRemaining = 0;
statusMsg += "- 전체 완료까지: " + formatTime(totalRemaining);

msg.reply(statusMsg);
return;
}

let parts = msg.content.split(" ");
if (parts.length < 3) {
msg.reply("함대건조 명령어 형식이 잘못되었습니다. 예: 함대건조 전투기 3");
return;
}
let fleetName = parts[1];
let quantity = parseInt(parts[2], 10);
if (!fleetData[fleetName]) {
msg.reply("존재하지 않는 함대입니다.");
return;
}
if (isNaN(quantity) || quantity < 1) {
msg.reply("건조할 수량을 올바르게 입력해주세요.");
return;
}

// 필수 기술 요구사항 검사
if (fleetData[fleetName].details && fleetData[fleetName].details.requiredTech) {
let requiredTech = fleetData[fleetName].details.requiredTech;
let userTech = userGameData[userHash].군수공장;
let userResearch = userGameData[userHash].researchLevels; // 수정된 부분: 연구 => researchLevels
let techMissing = false;
let missingTech = [];

// 디버깅용 - 요구 기술 및 현재 기술 레벨 출력
Log.d("함대건조 요구 기술 검사 - 함대: " + fleetName);
Log.d("요구 기술: " + JSON.stringify(requiredTech));
Log.d("사용자 군수공장: " + JSON.stringify(userTech));
Log.d("사용자 연구: " + JSON.stringify(userResearch));

for (let tech in requiredTech) {
let required = requiredTech[tech];
let current = 0;
let displayTechName = tech; // 표시할 기술 이름 (오류 메시지용)

// 키 이름의 공백 여부 확인 및 매칭
let techKey = tech;
let found = false;

// 조선소와 같은 군수공장 계열 건물인지 확인
if (tech === "조선소" && userTech["조선소"] !== undefined) {
current = userTech["조선소"];
found = true;
Log.d("조선소 발견됨(군수공장): " + current);
}
// 다른 군수공장 계열 건물인지 확인
else if (userTech[techKey] !== undefined) {
current = userTech[techKey];
found = true;
// 디버깅용 - 군수공장 카테고리에서 발견된 기술
Log.d(techKey + " 발견됨(군수공장): " + current);
}
// 연구 기술인지 확인 (공백 있는 버전과 없는 버전 모두 확인)
else if (userResearch[techKey] !== undefined) {
current = userResearch[techKey];
found = true;
// 디버깅용 - 연구 카테고리에서 발견된 기술
Log.d(techKey + " 발견됨(연구): " + current);
}
// 공백 있는 버전으로 다시 확인
else if (techKey.indexOf(" ") === -1 && userResearch[techKey.replace(/(.+?)(.+)/g, "$1 $2")] !== undefined) {
techKey = techKey.replace(/(.+?)(.+)/g, "$1 $2");
current = userResearch[techKey];
found = true;
Log.d(techKey + " 발견됨(연구, 공백 추가): " + current);
}
// 공백 없는 버전으로 다시 확인
else if (techKey.indexOf(" ") !== -1 && userResearch[techKey.replace(/ /g, "")] !== undefined) {
techKey = techKey.replace(/ /g, "");
current = userResearch[techKey];
found = true;
Log.d(techKey + " 발견됨(연구, 공백 제거): " + current);
}

if (!found) {
// 디버깅용 - 기술을 찾을 수 없음
Log.d(techKey + " 찾을 수 없음, 다른 대체 이름으로 추가 검색");

// 특정 기술 이름의 변형 추가 확인
if (tech === "연소엔진" || tech === "연소 엔진") {
if (userResearch["연소 엔진"] !== undefined) {
current = userResearch["연소 엔진"];
found = true;
Log.d("연소 엔진 발견됨(연구): " + current);
} else if (userResearch["연소엔진"] !== undefined) {
current = userResearch["연소엔진"];
found = true;
Log.d("연소엔진 발견됨(연구): " + current);
}
} else if (tech === "핵추진엔진" || tech === "핵추진 엔진") {
if (userResearch["핵추진 엔진"] !== undefined) {
current = userResearch["핵추진 엔진"];
found = true;
Log.d("핵추진 엔진 발견됨(연구): " + current);
} else if (userResearch["핵추진엔진"] !== undefined) {
current = userResearch["핵추진엔진"];
found = true;
Log.d("핵추진엔진 발견됨(연구): " + current);
}
} else if (tech === "초공간엔진" || tech === "초공간 엔진") {
if (userResearch["초공간 엔진"] !== undefined) {
current = userResearch["초공간 엔진"];
found = true;
Log.d("초공간 엔진 발견됨(연구): " + current);
} else if (userResearch["초공간엔진"] !== undefined) {
current = userResearch["초공간엔진"];
found = true;
Log.d("초공간엔진 발견됨(연구): " + current);
}
}
}

// 연구 이름 변형에 대한 추가 검사 - 더 일반적인 방식으로 공백 유무 검사
if (!found) {
// 공백이 있는 이름과 없는 이름 모두 확인
const withSpace = tech.includes(" ") ? tech : tech.replace(/([가-힣]+)([가-힣]+)/g, "$1 $2");
const withoutSpace = tech.includes(" ") ? tech.replace(/ /g, "") : tech;

Log.d("추가 검사 중: " + withSpace + " / " + withoutSpace);

if (userResearch[withSpace] !== undefined) {
current = userResearch[withSpace];
found = true;
Log.d(withSpace + " 발견됨(연구): " + current);
} else if (userResearch[withoutSpace] !== undefined) {
current = userResearch[withoutSpace];
found = true;
Log.d(withoutSpace + " 발견됨(연구): " + current);
}
}

if (current < required) {
techMissing = true;
// 올바른 기술 이름으로 오류 메시지 생성
missingTech.push(displayTechName + " Lv." + required);
}
}

if (techMissing) {
msg.reply("필수 요구 기술이 부족합니다:\n" + missingTech.join(", "));
return;
}
}

let baseCost = fleetData[fleetName].cost;
let totalCost = {};
for (let res in baseCost) {
totalCost[res] = baseCost[res] * quantity;
}
let shipyardLevel = userGameData[userHash].군수공장["조선소"] || 0;
let nanoLevel = userGameData[userHash].군수공장["나노공장"] || 0;

// 건설 시간 = (메탈 비용 + 크리스탈 비용) / (25 × (1 + 조선소 레벨) × 나노봇 공장 보너스)
let totalCostMetal = baseCost.메탈 || 0;
let totalCostCrystal = baseCost.크리스탈 || 0;
let nanoBonus = Math.pow(2, nanoLevel); // 나노봇 공장 보너스 = 2^레벨

let totalTime = (totalCostMetal + totalCostCrystal) / (25 * (1 + shipyardLevel) * nanoBonus) * quantity;

// 시간을 초 단위로 변환
totalTime = totalTime;

// 개별 함선 건조 시간 계산 (1대의 함선을 건조하는 데 필요한 시간)
let singleShipTime = totalTime * 1000 / quantity;

let userRes = userGameData[userHash].자원;
let sufficient = true;
for (let res in totalCost) {
if (userRes[res] === undefined || userRes[res] < totalCost[res]) { sufficient = false; break; }
}
if (!sufficient) {
msg.reply("자원이 부족하여 함대를 건조할 수 없습니다.");
return;
}
for (var res in totalCost) {
userRes[res] -= totalCost[res];
}
userGameData[userHash].fleetProgress = {
fleetName: fleetName,
quantity: quantity,
remainingQuantity: quantity,
startTime: Date.now(),
finishTime: Date.now() + singleShipTime, // 첫 번째 함선 완성 시간
singleShipTime: singleShipTime, // 개별 함선 건조 시간
totalTime: totalTime * 1000 // 전체 건조 시간
};
saveUserGameData(userGameData);
msg.reply(fleetName + " " + quantity + "기 건조가 시작되었습니다. 총 건조시간: " + formatTime(totalTime));

// 함대 건조 타이머 설정 (첫 번째 함선)
scheduleFleetCompletion(userHash, fleetName, 1, Date.now() + singleShipTime);

return;
}

// "방시건조" 명령어 처리 (로봇공장 레벨 반영)
if (msg.content.startsWith("방시건조 ")) {
// 다른 작업 진행 중인지 확인
if (userGameData[userHash].defenseProgress) {
let dp = userGameData[userHash].defenseProgress;
let remainingTime = Math.max(0, Math.floor((dp.finishTime - Date.now()) / 1000));

let statusMsg = "🔄 " + dp.defenseName + " " + dp.quantity + "대 건조 진행 중\n";
statusMsg += "완료까지 남은 시간: " + formatTime(remainingTime);

msg.reply(statusMsg);
return;
}

// 명령어 형식 검사
let parts = msg.content.split(" ");
if (parts.length < 3) {
msg.reply("방어시설 건조 명령어 형식이 잘못되었습니다. 예: 방시건조 미사일발사기 5");
return;
}
let defenseName = parts[1];
let quantity = parseInt(parts[2], 10);
if (!defenseData[defenseName]) {
msg.reply("존재하지 않는 방어시설입니다.");
return;
}
if (isNaN(quantity) || quantity < 1) {
msg.reply("건조할 수량을 올바르게 입력해주세요.");
return;
}

// 필수 기술 검증 (일부 방어시설은 특정 연구가 필요)
let reqResearch = defenseData[defenseName].requiredResearch;
if (reqResearch) {
let missingResearch = [];
for (let tech in reqResearch) {
let requiredLevel = reqResearch[tech];
let userLevel = userGameData[userHash].researchLevels && userGameData[userHash].researchLevels[tech] || 0;
if (userLevel < requiredLevel) {
missingResearch.push(tech + " Lv" + requiredLevel);
}
}
if (missingResearch.length > 0) {
msg.reply("❌ 방어시설 건조에 필요한 기술이 부족합니다.\n필요 기술: " + missingResearch.join(", "));
return;
}
}

// 조선소 레벨 확인
let requiredShipyardLevel = defenseData[defenseName].requiredShipyardLevel || 0;
let currentShipyardLevel = userGameData[userHash].군수공장["조선소"] || 0;
if (currentShipyardLevel < requiredShipyardLevel) {
msg.reply("❌ 이 방어시설을 건조하려면 조선소가 Lv" + requiredShipyardLevel + " 이상이어야 합니다. (현재 Lv" + currentShipyardLevel + ")");
return;
}

var baseCost = defenseData[defenseName].cost;
var totalCost = {};
for (let res in baseCost) {
totalCost[res] = baseCost[res] * quantity;
}

// 건조 시간 계산 (로봇공장 레벨 반영으로 수정)
var robotLevel = userGameData[userHash].군수공장["로봇공장"] || 0;
var nanoLevel = userGameData[userHash].군수공장["나노공장"] || 0;

// 방어시설 건설 시간 공식: (메탈 비용 + 크리스탈 비용) / (25 × (1 + 로봇 공장 레벨) × 나노봇 공장 보너스) * 4
var totalCostMetal = baseCost.메탈 || 0;
var totalCostCrystal = baseCost.크리스탈 || 0;
var nanoBonus = Math.pow(2, nanoLevel); // 나노봇 공장 보너스 = 2^레벨

var totalTime = ((totalCostMetal + totalCostCrystal) / (25 * (1 + robotLevel) * nanoBonus)) * 4 * quantity;

var userRes = userGameData[userHash].자원;
var sufficient = true;
for (let res in totalCost) {
if (userRes[res] === undefined || userRes[res] < totalCost[res]) { sufficient = false; break; }
}
if (!sufficient) {
msg.reply("자원이 부족하여 방어시설을 건조할 수 없습니다.");
return;
}
for (let res in totalCost) {
userRes[res] -= totalCost[res];
}
userGameData[userHash].defenseProgress = {
defenseName: defenseName,
quantity: quantity,
startTime: Date.now(),
finishTime: Date.now() + totalTime * 1000
};
saveUserGameData(userGameData);

// 방어시설 건조 타이머 설정
scheduleDefenseCompletion(userHash, defenseName, quantity, Date.now() + totalTime * 1000);

msg.reply(defenseName + " " + quantity + "대 건조가 시작되었습니다. 총 건조시간: " + formatTime(totalTime));
return;
}

// --- "건설 (건물이름)" 명령어 처리 ---
// 지원 건물: 메탈광산, 크리스탈광산, 듀테륨광산, 태양광발전소, 로봇공장, 군수공장, 연구소, 조선소, 핵융합로, 나노공장
if (msg.content.startsWith("건설 ")) {
// 다른 작업 진행 중인지 확인
if (userGameData[userHash].construction) {
let cons = userGameData[userHash].construction;
let remainingTime = Math.max(0, Math.floor((cons.finishTime - Date.now()) / 1000));
msg.reply("이미 " + cons.building + " 건설이 진행 중입니다. 완료까지 " + formatTime(remainingTime) + " 남았습니다.");
return;
}

var args = msg.content.split(" ");
if (args.length < 2) {
msg.reply("건설할 건물이름을 입력해주세요. 예: 건설 메탈광산");
return;
}
var buildingName = args[1];
var supported = ["메탈광산", "크리스탈광산", "듀테륨광산", "태양광발전소", "로봇공장", "군수공장", "연구소", "조선소", "핵융합로", "나노공장"];
if (supported.indexOf(buildingName) === -1) {
msg.reply("해당 건물은 현재 업그레이드가 지원되지 않습니다.");
return;
}

// buildingDB.json에서 건물 정보 확인
let buildingInfo = null;
let buildingType = "";
let currentLevel = 0;

if (buildingName === "메탈광산" || buildingName === "크리스탈광산" || buildingName === "듀테륨광산") {
buildingType = "광산";
currentLevel = userGameData[userHash].광산[buildingName] || 0;
} else if (buildingName === "태양광발전소" || buildingName === "핵융합로") {
buildingType = "광산";
currentLevel = userGameData[userHash].광산[buildingName] || 0;
} else if (buildingName === "로봇공장" || buildingName === "군수공장" || buildingName === "연구소" || buildingName === "조선소" || buildingName === "나노공장") {
buildingType = "군수공장";
currentLevel = userGameData[userHash].군수공장[buildingName] || 0;
}

// 로봇공장 레벨에 따라 건설속도 조정: speedFactor = 1 + 로봇공장 레벨
var robotLevel = userGameData[userHash].군수공장["로봇공장"] || 0;
var nanoLevel = userGameData[userHash].군수공장["나노공장"] || 0;
var cost = getUpgradeCost(currentLevel, buildingName);
var buildTime = getConstructionTime(buildingName, currentLevel, robotLevel, nanoLevel);
userGameData[userHash].pendingConstruction = {
buildingName: buildingName,
buildingType: buildingType,
cost: cost,
buildTime: buildTime
};
saveUserGameData(userGameData);
var costMsg = buildingName + " 업그레이드에 필요한 자원:\n";
for (let res in cost) {
if (res === "메탈") costMsg += "🪨 메탈: " + formatNumber(cost[res]) + "\n";
else if (res === "크리스탈") costMsg += "💎 크리스탈: " + formatNumber(cost[res]) + "\n";
else if (res === "듀테륨") costMsg += "🧪 듀테륨: " + formatNumber(cost[res]) + "\n";
}
costMsg += "건설시간: " + formatTime(buildTime) + "\n건설하시겠습니까? (건설 확인/건설 취소)";
msg.reply(costMsg);
return;
}

if (msg.content === "메세지" || msg.content === "메시지" || msg.content.startsWith("메시지 확인")) {
// 사용자의 알림 메시지 확인
// 알림 메시지는 더 이상 저장되지 않으므로 안내 메시지만 표시
msg.reply("알림 메시지는 더 이상 저장되지 않습니다. 메시지는 실시간으로만 확인 가능합니다.");
return;
}

// 랭킹 명령어 처리
if (msg.content === "랭킹" || msg.content.startsWith("랭킹 ")) {
let args = msg.content.split(" ");
let rankingType = args.length > 1 ? args[1] : "전체점수";

// 랭킹 타입 체크
if (!["전체점수", "건설점수", "연구점수", "함대점수"].includes(rankingType)) {
rankingType = "전체점수";
}

// 모든 점수 재계산 (첫 실행 또는 데이터 불일치 시)
let rankingData = loadRankingData();
if (Object.keys(rankingData).length === 0) {
rankingData = recalculateAllScores();
} else {
// 데이터가 있어도 한번 더 업데이트
updatePlayerScore(userHash);
}

// 현재 사용자의 닉네임을 업데이트 (메시지 발신자 이름으로)
let userGameData = loadUserGameData();
if (userGameData[userHash]) {
userGameData[userHash].lastChatInfo = {
sender: msg.sender,
roomId: msg.room,
isGroupChat: isGroupChat
};
saveUserGameData(userGameData);
}

// 모든 종류의 랭킹 조회
let totalRanking = getRanking("전체점수");
let constructionRanking = getRanking("건설점수");
let researchRanking = getRanking("연구점수");
let fleetRanking = getRanking("함대점수");

// 선택한 랭킹 종류에 따라 메인 랭킹 설정
let mainRanking;
switch (rankingType) {
case "건설점수":
mainRanking = constructionRanking;
break;
case "연구점수":
mainRanking = researchRanking;
break;
case "함대점수":
mainRanking = fleetRanking;
break;
case "전체점수":
default:
mainRanking = totalRanking;
break;
}

// 랭킹 메시지 생성
let rankMsg = `🏆 [${rankingType} 랭킹]\n\n`;

if (mainRanking.length === 0) {
rankMsg += "아직 랭킹 데이터가 없습니다.";
} else {
// 선택한 메인 랭킹 표시
rankMsg += `[${rankingType} 상위 10위]\n`;
for (let i = 0; i < Math.min(mainRanking.length, 10); i++) {
rankMsg += `${i+1}위: ${mainRanking[i].name} - ${formatNumber(mainRanking[i].score)}점\n`;
}
rankMsg += `\n`;

// 다른 랭킹 정보도 표시 (각 10위까지만)
if (rankingType !== "전체점수") {
rankMsg += `[전체점수 상위 10위]\n`;
for (let i = 0; i < Math.min(totalRanking.length, 10); i++) {
rankMsg += `${i+1}위: ${totalRanking[i].name} - ${formatNumber(totalRanking[i].score)}점\n`;
}
rankMsg += `\n`;
}

if (rankingType !== "건설점수") {
rankMsg += `[건설점수 상위 10위]\n`;
for (let i = 0; i < Math.min(constructionRanking.length, 10); i++) {
rankMsg += `${i+1}위: ${constructionRanking[i].name} - ${formatNumber(constructionRanking[i].score)}점\n`;
}
rankMsg += `\n`;
}

if (rankingType !== "연구점수") {
rankMsg += `[연구점수 상위 10위]\n`;
for (let i = 0; i < Math.min(researchRanking.length, 10); i++) {
rankMsg += `${i+1}위: ${researchRanking[i].name} - ${formatNumber(researchRanking[i].score)}점\n`;
}
rankMsg += `\n`;
}

if (rankingType !== "함대점수") {
rankMsg += `[함대점수 상위 10위]\n`;
for (let i = 0; i < Math.min(fleetRanking.length, 10); i++) {
rankMsg += `${i+1}위: ${fleetRanking[i].name} - ${formatNumber(fleetRanking[i].score)}점\n`;
}
rankMsg += `\n`;
}

// 사용자 자신의 랭킹 표시
let totalUserRank = totalRanking.findIndex(r => r.uuid === userHash);
let constructionUserRank = constructionRanking.findIndex(r => r.uuid === userHash);
let researchUserRank = researchRanking.findIndex(r => r.uuid === userHash);
let fleetUserRank = fleetRanking.findIndex(r => r.uuid === userHash);

if (totalUserRank !== -1) {
let playerScores = rankingData[userHash];
rankMsg += `\n[내 랭킹 정보]\n`;
rankMsg += `전체점수: ${totalUserRank + 1}위 (${formatNumber(playerScores.totalScore)}점)\n`;
rankMsg += `건설점수: ${constructionUserRank + 1}위 (${formatNumber(playerScores.constructionScore)}점)\n`;
rankMsg += `연구점수: ${researchUserRank + 1}위 (${formatNumber(playerScores.researchScore)}점)\n`;
rankMsg += `함대점수: ${fleetUserRank + 1}위 (${formatNumber(playerScores.fleetScore)}점)\n`;
rankMsg += `좌표: ${userGameData[userHash].coordinate || "알 수 없음"}`;
}
}

// 랭킹 메시지 전송
if (isGroupChat) {
msg.reply(rankMsg);
} else {
msg.reply(rankMsg);
}

return;
}

// 다른 작업 진행 중인지 확인
if (userGameData[userHash].fleetProgress) {
let fp = userGameData[userHash].fleetProgress;
let remainingTime = Math.max(0, Math.floor((fp.finishTime - Date.now()) / 1000));
let completedCount = fp.quantity - fp.remainingQuantity;

let statusMsg = "🔄 " + fp.fleetName + " 건조 진행 중:\n";
statusMsg += "- 완료: " + completedCount + "기\n";
statusMsg += "- 남은 수량: " + fp.remainingQuantity + "기\n";
statusMsg += "- 다음 함선 완성까지: " + formatTime(remainingTime) + "\n";

// 전체 남은 시간 계산
let totalRemaining = Math.floor((fp.totalTime - (Date.now() - fp.startTime)) / 1000);
if (totalRemaining < 0) totalRemaining = 0;
statusMsg += "- 전체 완료까지: " + formatTime(totalRemaining);

msg.reply(statusMsg);
return;
}

// "명령어" 명령어 처리 - 사용 가능한 명령어 목록 표시
if (msg.content === "명령어") {
let helpMsg = "🚀 X-Nova 명령어 목록\n\n";
helpMsg += "⭐ 기본 명령어\n";
helpMsg += "명령어 - 사용 가능한 명령어 목록 표시\n";
helpMsg += "자원 - 현재 자원 상태 확인\n";
helpMsg += "광산 - 자원 생산시설 상태 확인\n";
helpMsg += "군수공장 - 군사 시설 상태 확인\n";
helpMsg += "함대 - 보유 함대 확인\n";
helpMsg += "방어시설 - 보유 방어시설 확인\n";
helpMsg += "연구 - 연구 상태 확인\n\n";

helpMsg += "⭐ 자원 생산\n";
helpMsg += "건설 [건물이름] - 건물 건설 정보 확인\n";
helpMsg += "건설 확인 - 건설 시작\n";
helpMsg += "건설 취소 - 건설 취소\n\n";

helpMsg += "⭐ 함대 및 방어\n";
helpMsg += "함대건조 [함선이름] [수량] - 함대 건조\n";
helpMsg += "방시건조 [방어시설이름] [수량] - 방어시설 건조\n\n";

helpMsg += "⭐ 기술 연구\n";
helpMsg += "연구 [기술이름] - 연구 정보 확인\n";
helpMsg += "연구 확인 - 연구 시작\n";
helpMsg += "연구 취소 - 연구 취소\n\n";

helpMsg += "⭐ 전투\n";
helpMsg += "공격 [좌표] - 다른 행성 공격\n";
helpMsg += "은하지도 [시스템번호] - 특정 항성계 보기\n";
helpMsg += "메세지 - 메시지 확인\n";

msg.reply(helpMsg);
return;
}
}
// 이벤트 리스너 등록
function onStartCompile() {
// 초기화 작업 수행
// 메시지 파일 초기화
initMessageFile();

// 모든 사용자의 진행 중인 작업에 대한 타이머 설정
try {
let userGameData = loadUserGameData();

for (let uuid in userGameData) {
// 건설 타이머 설정
if (userGameData[uuid].construction) {
let cons = userGameData[uuid].construction;
if (cons.finishTime > Date.now()) {
scheduleConstructionCompletion(uuid, cons.building, cons.type, cons.finishTime);
}
}

// 연구 타이머 설정
if (userGameData[uuid].researchProgress) {
let rp = userGameData[uuid].researchProgress;
if (rp.finishTime > Date.now()) {
scheduleResearchCompletion(uuid, rp.researchName, rp.finishTime);
}
}

// 함대 건조 타이머 설정
if (userGameData[uuid].fleetProgress) {
let fp = userGameData[uuid].fleetProgress;
if (fp.finishTime > Date.now()) {
scheduleFleetCompletion(uuid, fp.fleetName, fp.quantity, fp.finishTime);
}
}

// 방어시설 건조 타이머 설정
if (userGameData[uuid].defenseProgress) {
let dp = userGameData[uuid].defenseProgress;
if (dp.finishTime > Date.now()) {
scheduleDefenseCompletion(uuid, dp.defenseName, dp.quantity, dp.finishTime);
}
}

// 공격 타이머 설정
if (userGameData[uuid].pendingAttack) {
let pa = userGameData[uuid].pendingAttack;
if (!pa.battleCompleted) {
let arrivalTime = pa.attackStartTime + (pa.travelTime * 1000);
if (arrivalTime > Date.now()) {
scheduleAttackArrival(uuid, pa.targetHash, arrivalTime, pa.fleet, pa.capacity);
}
}
}

// 귀환 타이머 설정
if (userGameData[uuid].pendingReturn) {
let pr = userGameData[uuid].pendingReturn;
if (pr.returnTime > Date.now()) {
scheduleFleetReturn(uuid, pr.returnTime);
}
}
}
} catch (e) {
Log.e("onStartCompile에서 타이머 설정 중 오류 발생: " + e);
}
}

// 랭킹 시스템 관련 함수들
function initRankingData() {
try {
let filePath = "/storage/emulated/0/ChatBot/database/RankingScore.json";
if (!FileStream.exists(filePath)) {
let initialData = {};
FileStream.write(filePath, JSON.stringify(initialData, null, 2));
}
return true;
} catch (e) {
Log.e("랭킹 데이터 초기화 실패: " + e);
return false;
}
}

function loadRankingData() {
try {
let filePath = "/storage/emulated/0/ChatBot/database/RankingScore.json";
let data = FileStream.read(filePath);
return JSON.parse(data || "{}");
} catch (e) {
Log.e("랭킹 데이터 로드 실패: " + e);
return {};
}
}

function saveRankingData(rankingData) {
try {
let filePath = "/storage/emulated/0/ChatBot/database/RankingScore.json";
FileStream.write(filePath, JSON.stringify(rankingData, null, 2));
return true;
} catch (e) {
Log.e("랭킹 데이터 저장 실패: " + e);
return false;
}
}

// 우주함대 가격 계산을 위한 데이터 가져오기
function getFleetCost(fleetName) {
try {
let buildingDB = loadBuildingDB();
if (buildingDB && buildingDB.Fleet && buildingDB.Fleet[fleetName]) {
return buildingDB.Fleet[fleetName].cost;
} else {
// 하드코딩된 기본 값을 반환 (DB가 미완성인 경우)
let defaultCosts = {
"소형화물선": { 메탈: 2000, 크리스탈: 2000 },
"대형화물선": { 메탈: 6000, 크리스탈: 6000 },
"수확선": { 메탈: 10000, 크리스탈: 3000 },
"무인 정찰기": { 메탈: 3000, 크리스탈: 1000 },
"태양광인공위성": { 메탈: 0, 크리스탈: 2000 },
"전투기": { 메탈: 3000, 크리스탈: 1000 },
"공격기": { 메탈: 6000, 크리스탈: 4000 },
"구축함": { 메탈: 20000, 크리스탈: 7000 },
"순양함": { 메탈: 20000, 크리스탈: 15000 },
"전투순양함": { 메탈: 30000, 크리스탈: 40000 },
"폭격기": { 메탈: 50000, 크리스탈: 25000 },
"전함": { 메탈: 60000, 크리스탈: 50000 },
"죽음의별": { 메탈: 5000000, 크리스탈: 4000000 }
};

return defaultCosts[fleetName] || { 메탈: 0, 크리스탈: 0 };
}
} catch (e) {
Log.e("함대 비용 계산 오류: " + e);
return { 메탈: 0, 크리스탈: 0 };
}
}

// 방어시설 가격 계산을 위한 데이터 가져오기
function getDefenseCost(defenseName) {
try {
let buildingDB = loadBuildingDB();
if (buildingDB && buildingDB.Defense && buildingDB.Defense[defenseName]) {
return buildingDB.Defense[defenseName].cost;
} else {
// 하드코딩된 기본 값을 반환 (DB가 미완성인 경우)
let defaultCosts = {
"미사일 포탑": { 메탈: 2000, 크리스탈: 0 },
"레이저 포탑": { 메탈: 1500, 크리스탈: 500 },
"이온 포탑": { 메탈: 6000, 크리스탈: 2000 },
"가우스 포탑": { 메탈: 20000, 크리스탈: 15000 },
"플라즈마 포탑": { 메탈: 50000, 크리스탈: 50000 },
"소형 보호막 돔": { 메탈: 10000, 크리스탈: 10000 },
"대형 보호막 돔": { 메탈: 50000, 크리스탈: 50000 },
"대륙간 미사일": { 메탈: 12500, 크리스탈: 2500 },
"대탄도 미사일": { 메탈: 8000, 크리스탈: 2000 }
};

return defaultCosts[defenseName] || { 메탈: 0, 크리스탈: 0 };
}
} catch (e) {
Log.e("방어시설 비용 계산 오류: " + e);
return { 메탈: 0, 크리스탈: 0 };
}
}

// 연구 가격 계산을 위한 데이터 가져오기
function getResearchCost(researchName, level) {
try {
let buildingDB = loadBuildingDB();
if (buildingDB && buildingDB.Research && buildingDB.Research[researchName]) {
let baseCost = buildingDB.Research[researchName].cost;
// 레벨에 따른 비용 증가 (보통 2배씩 증가)
return {
메탈: Math.floor(baseCost.메탈 * Math.pow(2, level)),
크리스탈: Math.floor(baseCost.크리스탈 * Math.pow(2, level)),
듀테륨: Math.floor(baseCost.듀테륨 * Math.pow(2, level))
};
} else {
// 하드코딩된 기본 값을 반환 (DB가 미완성인 경우)
let defaultBaseCosts = {
"에너지공학": { 메탈: 0, 크리스탈: 800, 듀테륨: 400 },
"레이저공학": { 메탈: 200, 크리스탈: 100, 듀테륨: 0 },
"이온공학": { 메탈: 1000, 크리스탈: 300, 듀테륨: 100 },
"초공간기술": { 메탈: 0, 크리스탈: 4000, 듀테륨: 2000 },
"플라즈마공학": { 메탈: 2000, 크리스탈: 4000, 듀테륨: 1000 },
"연소엔진": { 메탈: 400, 크리스탈: 0, 듀테륨: 600 },
"핵추진엔진": { 메탈: 2000, 크리스탈: 4000, 듀테륨: 600 },
"초공간엔진": { 메탈: 10000, 크리스탈: 20000, 듀테륨: 6000 },
"정탐기술": { 메탈: 200, 크리스탈: 1000, 듀테륨: 200 },
"컴퓨터공학": { 메탈: 0, 크리스탈: 400, 듀테륨: 600 },
"원정기술": { 메탈: 4000, 크리스탈: 8000, 듀테륨: 4000 },
"은하망네트워크": { 메탈: 240000, 크리스탈: 400000, 듀테륨: 160000 },
"중력자기술": { 메탈: 0, 크리스탈: 0, 듀테륨: 0 },
"무기공학": { 메탈: 800, 크리스탈: 200, 듀테륨: 0 },
"보호막연구": { 메탈: 200, 크리스탈: 600, 듀테륨: 0 },
"장갑기술": { 메탈: 1000, 크리스탈: 0, 듀테륨: 0 }
};

const baseCost = defaultBaseCosts[researchName] || { 메탈: 0, 크리스탈: 0, 듀테륨: 0 };

return {
메탈: Math.floor(baseCost.메탈 * Math.pow(2, level)),
크리스탈: Math.floor(baseCost.크리스탈 * Math.pow(2, level)),
듀테륨: Math.floor(baseCost.듀테륨 * Math.pow(2, level))
};
}
} catch (e) {
Log.e("연구 비용 계산 오류: " + e);
return { 메탈: 0, 크리스탈: 0, 듀테륨: 0 };
}
}

// 모든 플레이어의 점수 다시 계산
function recalculateAllScores() {
let userGameData = loadUserGameData();
let rankingData = {};

for (let uuid in userGameData) {
let userData = userGameData[uuid];
let constructionScore = calculateConstructionScore(userData);
let researchScore = calculateResearchScore(userData);
let fleetScore = calculateFleetScore(userData);
let totalScore = constructionScore + researchScore + fleetScore;

rankingData[uuid] = {
totalScore: totalScore,
constructionScore: constructionScore,
researchScore: researchScore,
fleetScore: fleetScore,
lastUpdate: Date.now()
};
}

saveRankingData(rankingData);
return rankingData;
}

// 건설 점수 계산
function calculateConstructionScore(userData) {
let score = 0;

// 광산 건설 점수
if (userData.광산) {
let mines = ["메탈광산", "크리스탈광산", "듀테륨광산", "태양광발전소", "핵융합로"];
for (let mine of mines) {
let level = userData.광산[mine] || 0;
for (let i = 0; i < level; i++) {
let cost = getUpgradeCost(i, mine);
if (cost) {
score += (cost.메탈 + cost.크리스탈) / 1000;
}
}
}
}

// 군수공장 건설 점수
if (userData.군수공장) {
let facilities = ["로봇공장", "조선소", "연구소", "나노공장"];
for (let facility of facilities) {
let level = userData.군수공장[facility] || 0;
for (let i = 0; i < level; i++) {
let cost = getUpgradeCost(i, facility);
if (cost) {
score += (cost.메탈 + cost.크리스탈) / 1000;
}
}
}
}

// 방어시설 건설 점수
if (userData.defense) {
for (let defense in userData.defense) {
let quantity = userData.defense[defense] || 0;
let cost = getDefenseCost(defense);
if (cost) {
score += quantity * (cost.메탈 + cost.크리스탈) / 1000;
}
}
}

return Math.floor(score);
}

// 연구 점수 계산
function calculateResearchScore(userData) {
let score = 0;

if (userData.researchLevels) {
for (let research in userData.researchLevels) {
let level = userData.researchLevels[research] || 0;
for (let i = 0; i < level; i++) {
let cost = getResearchCost(research, i);
if (cost) {
score += (cost.메탈 + cost.크리스탈) / 1000;
}
}
}
}

return Math.floor(score);
}

// 함대 점수 계산
function calculateFleetScore(userData) {
let score = 0;

if (userData.fleet) {
for (let fleet in userData.fleet) {
let quantity = userData.fleet[fleet] || 0;

// 실제 보유 중인 함대만 점수에 포함 (건조 중인 함대는 제외)
if (quantity > 0) {
let cost = getFleetCost(fleet);
if (cost) {
score += quantity * (cost.메탈 + cost.크리스탈) / 1000;
}
}
}
}

// 건조 중이거나 건조 대기 중인 함대는 점수에 포함하지 않음
// fleetProgress에 있는 함대는 아직 완성되지 않았으므로 점수에 포함하지 않음

return Math.floor(score);
}

// 특정 플레이어의 점수 업데이트
function updatePlayerScore(uuid) {
let userGameData = loadUserGameData();
let rankingData = loadRankingData();

if (userGameData[uuid]) {
let userData = userGameData[uuid];
let constructionScore = calculateConstructionScore(userData);
let researchScore = calculateResearchScore(userData);
let fleetScore = calculateFleetScore(userData);
let totalScore = constructionScore + researchScore + fleetScore;

rankingData[uuid] = {
totalScore: totalScore,
constructionScore: constructionScore,
researchScore: researchScore,
fleetScore: fleetScore,
lastUpdate: Date.now()
};

saveRankingData(rankingData);
return rankingData[uuid];
}

return null;
}

// 특정 유형의 랭킹 조회
function getRanking(type = "전체점수") {
let rankingData = loadRankingData();
let userGameData = loadUserGameData();
let channelData = loadChannelData(); // 채널 데이터 로드
let ranking = [];

// 랭킹 타입에 따른 키 설정
let scoreKey;
switch (type) {
case "건설점수":
scoreKey = "constructionScore";
break;
case "연구점수":
scoreKey = "researchScore";
break;
case "함대점수":
scoreKey = "fleetScore";
break;
case "전체점수":
default:
scoreKey = "totalScore";
break;
}

// 랭킹 데이터 구성
for (let uuid in rankingData) {
// 유저 정보가 있는 경우만 포함
if (userGameData[uuid]) {
// 닉네임 결정 순서:
// 1. 채널 파일에서 가져오기
// 2. userGameData의 lastChatInfo.sender 사용
// 3. 없으면 "미상"으로 표시
let nickname = "미상";

// 1. channel.json 파일에서 닉네임 확인
if (channelData[uuid] && channelData[uuid].channelId) {
if (!channelData[uuid].isGroupChat) {
// 개인 채팅인 경우 channelId가 닉네임
nickname = channelData[uuid].channelId;
}
}

// 2. 아직 닉네임이 "미상"이면 userGameData에서 확인
if (nickname === "미상" && userGameData[uuid].lastChatInfo?.sender) {
nickname = userGameData[uuid].lastChatInfo.sender;
}

ranking.push({
uuid: uuid,
name: nickname,
score: rankingData[uuid][scoreKey] || 0
});
}
}

// 점수 순으로 정렬
ranking.sort((a, b) => b.score - a.score);

return ranking;
}

// API2 이벤트 리스너 추가 - 메시지 처리
bot.addListener(Event.MESSAGE, onMessage);
bot.addListener(Event.START_COMPILE, onStartCompile);