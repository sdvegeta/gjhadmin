# 广交会项目 - 配送小程序管理看板 技术规格说明（Spec）

> 版本：V0.1  
> 日期：2026-03-01  
> 模块：配送微信小程序 / 配送管理看板  
> 对应前端仓库：`admin` (当前用于挂载 H5 高保真原型)

## 1. 原型开发与目录结构声明

本次开发为**高保真原型模拟**，为了快速验证产品设计与交互体验，代码将暂存于当前的 `admin` (Vue 3 + TailwindCSS) 工程内，而不是启动真实的 Uniapp 微信小程序工程。

**新增目录规范：**
- 页面入口：`src/views/mp-preview/DeliveryDashboard.vue`
- 该视图组件应在最外层自限宽度（模拟手机频幕）：例如 `<div class="mx-auto w-full max-w-[390px] min-h-screen bg-gray-50 shadow-2xl relative">`
- 需要在现有的 Admin 路由 (`src/router/index.ts` 或类似文件) 中，配置 `/mp-preview/dashboard` 以便本地开发时直接视察。

## 2. 接口契约设计 (Mocking)

为了让高保真原型跑通交互与状态流转，原型内可直接写死 Mock 数据或编写简单的 `simulateFetch` 伪接口。需抽象出以下数据结构流。

### 2.1 展区字典接口 (Zone List)
**请求入参：** `无`  
**响应出参 (Mock)：**
```json
[
  { "id": "ALL", "name": "全部" },
  { "id": "ZONE_A", "name": "A区" },
  { "id": "ZONE_B", "name": "B区" },
  { "id": "ZONE_C", "name": "C区" },
  { "id": "ZONE_D", "name": "D区" }
]
```

### 2.2 最新批次瀑布流指标接口 (Batch Waterfall API)
**请求入参：** `zoneId` (由顶部 Tab 控制)  
**响应出参 (Mock 示例)：**
```json
{
  "summary": {
    "totalDailyCount": 3500,
    "onlineCouriers": 120,    // 配送/主管角色的日活跃扫码人数
    "onlineSigners": 25       // 签收角色的日活跃互动人数
  },
  "batches": [
    {
      "batchId": "b_1030",
      "batchName": "10:30 批次",
      "status": "FINISHED",
      "isMidnightBatch": false,
      "finishedCount": 540,
      "completionRate": "100%"
    },
    {
      "batchId": "b_1100",
      "batchName": "11:00 批次",
      "status": "RUNNING",
      "isMidnightBatch": false,
      "totalCount": 850,
      "finishedCount": 540,
      "completionRate": "63.5%",
      "funnel": { 
         "waitAccept": { "count": 145, "bagCount": 60 }, 
         "goHub": { "count": 285, "bagCount": 110, "people": 15 }, 
         "inHub": { "count": 135, "bagCount": 42, "people": 5 }, 
         "goBooth": { "count": 445, "bagCount": 210, "people": 32 }, 
         "delivered": 540 
      },
      "efficiency": { "avgWaitAccept": 6.5, "avgGoHub": 8.2, "avgInHub": 14.5, "avgGoBooth": 12.0 },
      "warnings": [
        { "type": "NO_RIDER_ACCEPT", "count": 25, "maxDelayMins": 18, "desc": "配送员超时未接单" },
        { "type": "HUB_STAY", "count": 12, "maxDelayMins": 30, "desc": "集散分拣滞留" }
      ]
    },
    {
      "batchId": "b_1200",
      "batchName": "12:00~12:30 午餐最高峰",
      "status": "WAITING",
      "isMidnightBatch": false,
      "totalCount": 1200
    },
    {
      "batchId": "b_1330",
      "batchName": "13:30~15:00 宵夜防线",
      "status": "RUNNING",
      "isMidnightBatch": true,
      "placedOrderCount": 650,
      "printedOrderCount": 600,
      "funnel": { 
         "waitAccept": { "count": 45, "bagCount": 20 }, 
         "goHub": { "count": 68, "bagCount": 25, "people": 8 }, 
         "inHub": { "count": 42, "bagCount": 15, "people": 4 }, 
         "goBooth": { "count": 95, "bagCount": 35, "people": 12 }, 
         "delivered": 530 
      },
      "warnings": [
        { "type": "KITCHEN_DELAY", "count": 50, "maxDelayMins": 35, "desc": "后厨出餐超纲 / 压单" },
        { "type": "DELIVERY_TIMEOUT", "count": 5, "maxDelayMins": 40, "desc": "送展位在途迷失" }
      ]
    }
  ]
}
```

## 3. 核心交互流转技术实现

### 3.1 顶部 ZoneTab 与缓存的双向绑定
前端利用 `localStorage` 存放 `last_view_zone_id`。
生命周期 `onMounted` 时的策略流：
1. 提取 LocalStorage。
2. 若存在且值合法（存在于上文的 Zone字典 中），将当前高亮 `activeTab` 置为该值。
3. 若为空或不合法，重置为字典的第0项（如 "ALL"）。
4. 随后立即 `watch(activeTab, fetchDashboardData, { immediate: true })` 触发主板数据的请求。

### 3.2 骨架屏与 Loading 态
必须使用 Skeleton 占位。
当 `activeTab` 发生变动（用户点击了新区域）时：
- 设置 `isLoading = true`。
- 清空或虚化旧数据，渲染脉冲效果的占位色块。
- 请求完成后（`simulateFetch` `setTimeout` 回调），`isLoading = false`。

### 3.3 布局极限压缩（移动端窄屏 360px 及防爆排版）
为了在手机首屏展现海量指标，必须具备强抗压的容错排版机制：
- **窄屏文字瘦身与折叠**：在窄屏 (如 `max-w-[360px]`) 遇阻时，应精简长中文词汇（如将“批次总需配送”精简为“总需配送”，“预测流速”缩简为“流速”），并给包含这二者的外层 FlexBox 启用横向撞车包裹 (`flex-wrap`) 防御。
- **漏斗超大极值防爆与袋数挂载**：漏斗内同时承担 `45袋 / 120单` 以及 `xxx人` 时，容器内层必须具备 `min-w-0` 给数字收缩空间，配合 `whitespace-nowrap` 防折行。物理概念上“袋”包裹“单”，因此**排版必须袋数居上、单量居下**，两者构建视觉梯队防抢戏。若仍超宽则隐去或成比例缩放。
- **指示器独立流注**：流转速度与清货倒计时的关键因果模块，必须**起新行**悬挂于流转漏斗正上方，充分舒展阅读空间。

## 4. 样式与视觉基调
由于不需要完整的设计规范件，请调用 Tailwind 原有能力，实现与“悠饭配送”小程序高度一致的极简和视觉连续性：
- 整体视觉风格采用品牌橙色（主推 `orange-500` 或 `#FF6600` 等效色系）为主颜色。
- 顶部导航和 Tab 选中态使用**底部短粗橙色下划线条**（Border-bottom）进行强化，未选中文字采用灰黑色。
- 卡片容器采用纯白底色，外加微弱的阴影 `shadow-sm` 或浅灰色边框 `border-gray-100`。背景底色为浅灰色 `bg-gray-50` 或 `#f8f8f8`。
- **严重滞留烂尾单警示区分**：绝不能用大面积厚粉红/正红背景色涂满整张卡片（会与【送展位】节点的淡橙背景形成极其惨烈的视觉冲突）。**规范做法**：保持极净的纯白底色/或极其淡的警示微遮罩，采用【加粗红边框+卡片顶部红线 (`border-t-4`)】以及内部标题的飘红字色来实现精准降噪警报。

## 5. 原型验收准则
当研发能在本地运行 `npm run dev` 并通过 `/mp-preview/dashboard` 看到如下场景即可认为高保真原型成功：
1. PC 屏幕正中央屹立着一个宽高犹如 `iPhone 14` 的视图容器。
2. 顶部支持横拉点击切换 A区/B区。
3. 切换时下方数据卡片产生 Loading 并在零点几秒后刷新为另外一套随机数据。
4. 手动 `F5` 刷新 PC 页面，容器内的顶部 Tab 会自动停留在上一次点击选中的区域，符合缓存心智模型验证。
