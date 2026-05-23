# 游戏配置（public/config/game.properties）

## 文件位置与目的

- 位置：`public/config/game.properties`
- 目的：把“难度与生成参数”从代码中抽离出来，修改后刷新即可生效

Web 端与 Server 端都读取同一份配置，避免联机时难度不一致。

## 加载路径

- Web（前端）
  - 拉取地址：`/config/game.properties`
  - 实现：`src/game/config/loadConfig.ts`
  - 解析：
    - `src/game/config/properties.ts`（properties 解析）
    - `src/game/config/gameConfig.ts`（映射为强类型 GameConfig，并做范围限制）
- Server（后端）
  - 读取路径：`../public/config/game.properties`（相对 server 进程工作目录）
  - 实现：`server/src/config/loadConfig.ts`
  - 解析：`server/src/config/properties.ts`、`server/src/config/gameConfig.ts`

## 语法

- 每行 `key=value`
- 以 `#` 开头的行视为注释
- 空行会被忽略

## Key 列表（当前版本）

### 时间（毫秒）

- `time.startMs`：开局时间（越大越容易）
- `time.maxMs`：时间条上限（最大值）
- `time.addPerChopMs`：每次成功砍击/得分返还的时间（越大越容易）
- `time.decayScale`：时间流逝倍率
  - `1.0`：正常
  - `< 1.0`：更慢（更容易）
  - `> 1.0`：更快（更难）

说明：
- 前端在解析后会保证 `time.startMs` 与 `time.maxMs` 一致（取两者的较大值），避免出现“开局时间比上限还大/还小”的不一致。
  - 实现：`src/game/config/gameConfig.ts`

### 障碍生成

- `obstacle.noneChance`：出现“空位”（没有树枝）的概率（0~1，越大越容易）
- `obstacle.avoidSameSide`：是否尽量避免连续同侧（true/false）

## 常见调整建议

- 想让游戏更容易：
  - 增大 `time.addPerChopMs`
  - 降低 `time.decayScale`（例如从 1.0 降到 0.9）
  - 增大 `obstacle.noneChance`
  - 保持 `obstacle.avoidSameSide=true`

