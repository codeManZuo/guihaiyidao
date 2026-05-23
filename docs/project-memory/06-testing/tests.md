# 测试说明

## 测试框架

- Vitest
- 测试环境：jsdom（见 `vitest.config.ts`）
- 测试文件匹配：`src/**/*.test.ts`

## 运行命令（仓库根）

- 单次运行：
  - `npm run test`
- 监听模式：
  - `npm run test:watch`

## 测试覆盖重点（当前项目）

- 配置解析与映射：
  - `src/game/config/properties.test.ts`
  - `src/game/config/gameConfig.test.ts`
- 单人运行时：
  - `src/game/state/singlePlayer.test.ts`
- 障碍生成器：
  - `src/game/obstacles/ObstacleGenerator.test.ts`
- 联机协议：
  - `src/game/net/protocol.test.ts`
- UI overlays/actions/flow：
  - `src/game/ui/*.test.ts`

