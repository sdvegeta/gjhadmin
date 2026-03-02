<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
    <div class="relative w-full max-w-[390px] h-[844px] bg-gray-50 rounded-[40px] shadow-2xl overflow-hidden border-[8px] border-gray-800 flex flex-col">
      
      <!-- 模拟手机状态栏 -->
      <div class="h-12 bg-white w-full flex items-center justify-between px-6 text-xs font-semibold shrink-0">
        <span>09:41</span>
        <div class="flex gap-1.5 items-center">
          <div class="w-4 h-3 bg-black rounded-[2px]"></div>
          <div class="w-3 h-3 bg-black rounded-full"></div>
          <div class="w-5 h-3 bg-black rounded-[2px]"></div>
        </div>
      </div>

      <!-- 顶部 Header -->
      <div class="bg-white shrink-0 z-10 relative">
        <div class="h-12 flex items-center justify-center relative">
           <span class="font-medium text-[17px] text-[#333333]">悠饭配送</span>
           <!-- 模拟右上圆角胶囊组件 -->
           <div class="absolute right-4 w-[80px] h-[30px] rounded-full border border-gray-200 flex items-center justify-evenly bg-white/50">
             <div class="flex gap-0.5"><div class="w-1 h-1 bg-black rounded-full"></div><div class="w-1.5 h-1.5 bg-black rounded-full"></div><div class="w-1 h-1 bg-black rounded-full"></div></div>
             <div class="w-[1px] h-3.5 bg-gray-200"></div>
             <div class="w-4 h-4 rounded-full border-[1.5px] border-black flex items-center justify-center"><div class="w-1.5 h-1.5 bg-black rounded-full"></div></div>
           </div>
           <!-- 关闭按钮模拟 -->
           <button @click="$router.push('/delivery-management/responsibility')" class="absolute left-4 p-2 text-gray-400 hover:text-gray-600">
             <span class="text-xl">◁</span>
           </button>
        </div>
        
        <!-- 区域 Tab (悠饭橙底横条风格) -->
        <div class="flex overflow-x-auto hide-scrollbar px-2 h-11 border-b border-gray-100">
          <button 
            v-for="zone in zones" 
            :key="zone.id"
            @click="selectZone(zone.id)"
            class="px-4 h-full relative text-[15px] whitespace-nowrap transition-colors flex flex-col justify-center items-center"
            :class="activeZone === zone.id ? 'text-[#333333] font-bold' : 'text-gray-400 font-normal'"
          >
            {{ zone.name }}
            <div v-if="activeZone === zone.id" class="absolute bottom-0 w-5 h-0.5 bg-[#FF6600] rounded-full"></div>
          </button>
        </div>
      </div>

      <!-- 主体内容区 -->
      <div class="flex-1 overflow-y-auto px-4 py-3 space-y-4 pb-20 relative bg-[#F8F8F8] styled-scroll">
        
        <!-- Loading 遮罩 -->
        <div v-if="isLoading" class="absolute inset-0 bg-[#F8F8F8]/80 z-20 flex flex-col items-center justify-center">
          <div class="w-7 h-7 rounded-full border-[3px] border-[#FF6600] border-t-transparent animate-spin"></div>
          <span class="text-xs text-gray-500 mt-2">数据加载中...</span>
        </div>

        <!-- 只有当有数据时才渲染批次瀑布流 -->
        <template v-if="dashboardData && dashboardData.batches">
          <!-- TODO: 空状态优化，如果没有批次则在此提示 -->
          <div v-if="dashboardData.batches.length === 0" class="flex flex-col items-center justify-center h-40 text-gray-400">
             暂无配送批次数据
          </div>
          
          <!-- 批次流容器 (基于强力心智排序引擎 sortedBatches 输出) -->
          <div class="space-y-4">
            <template v-for="batch in sortedBatches" :key="batch.batchId">
               <BatchCardFinished v-if="batch.status === 'FINISHED' && (batch.remainCount || 0) === 0" :batch="batch" />
               <BatchCardRunning v-if="batch.status === 'RUNNING' || (batch.status === 'FINISHED' && (batch.remainCount || 0) > 0)" :batch="batch" />
               <BatchCardWaiting v-if="batch.status === 'WAITING'" :batch="batch" />
            </template>
          </div>
        </template>

        <!-- 直观运力与结果 (下半屏辅助 / 全局置底) -->
        <div v-if="dashboardData && dashboardData.summary" class="bg-white rounded-[12px] p-4 shadow-sm mb-4 mt-6">
           <div class="flex items-center justify-between pb-3 border-b border-gray-50 mb-3">
             <div class="text-[13px] text-gray-500">今日总单量</div>
             <div class="text-[18px] font-bold text-[#FF6600]">{{ dashboardData.summary.totalDailyCount }}</div>
          </div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-[#333333] text-[13px] font-bold shrink-0">当班活跃总计</span>
            <div class="flex items-center gap-4">
              <div class="flex items-baseline">
                <span class="text-[12px] text-gray-500 mr-1">配送员</span>
                <span class="font-bold text-[#333333] text-[16px]">{{ dashboardData.summary.onlineCouriers }}</span>
                <span class="text-[10px] text-gray-400 ml-0.5">人</span>
              </div>
              <div class="flex items-baseline">
                <span class="text-[12px] text-gray-500 mr-1">分拣员</span>
                <span class="font-bold text-[#333333] text-[16px]">{{ dashboardData.summary.onlineSigners }}</span>
                <span class="text-[10px] text-gray-400 ml-0.5">人</span>
              </div>
            </div>
          </div>
          <!-- 核心：空闲待命兵力萃取 -->
          <div class="flex items-center justify-between pt-2 border-t border-dashed border-gray-100">
            <div class="flex items-center">
               <span class="text-[#333333] text-[13px] font-bold shrink-0">当前空闲</span>
            </div>
            <div class="flex items-center gap-4">
              <div class="flex items-baseline">
                <span class="text-[12px] text-gray-500 mr-1">配送员</span>
                <span class="font-bold text-[#333333] text-[16px]">{{ Math.max(0, dashboardData.summary.onlineCouriers - dashboardData.summary.busyCouriers) }}</span>
                <span class="text-[10px] text-gray-400 ml-0.5">人</span>
              </div>
              <div class="flex items-baseline">
                <span class="text-[12px] text-gray-500 mr-1">分拣员</span>
                <span class="font-bold text-[#333333] text-[16px]">{{ Math.max(0, dashboardData.summary.onlineSigners - dashboardData.summary.busySigners) }}</span>
                <span class="text-[10px] text-gray-400 ml-0.5">人</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- 底部 TabBar 模拟 -->
      <div class="h-[50px] bg-[#FAFAFA] border-t border-gray-200 shrink-0 w-full flex justify-around items-center pb-safe">
        <div class="flex flex-col items-center justify-center text-[#FF6600]">
          <svg class="w-6 h-6 mb-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/></svg>
          <span class="text-[10px]">看板</span>
        </div>
        <div class="flex flex-col items-center justify-center text-gray-400 opacity-50">
          <svg class="w-6 h-6 mb-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          <span class="text-[10px]">我的</span>
        </div>
      </div>
    </div>
    
    <!-- 追加产品/技术规格文档查看悬浮按钮 -->
    <DocViewer title="小程序管理看板" :docs="docs" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import DocViewer from '@/components/DocViewer.vue'
import prdRaw from '../../../docs/modules/配送小程序_管理看板/PRD.md?raw'
import specRaw from '../../../docs/modules/配送小程序_管理看板/Spec.md?raw'
import iaRaw from '../../../docs/modules/配送小程序_管理看板/IA.md?raw'

import BatchCardRunning from './components/BatchCardRunning.vue'
import BatchCardWaiting from './components/BatchCardWaiting.vue'
import BatchCardFinished from './components/BatchCardFinished.vue'

const router = useRouter()
const docs = { prd: prdRaw, spec: specRaw, ia: iaRaw }

// ===== 核心数据定义 =====
const CACHE_KEY = 'mp_last_view_zone_id'

const zones = [
  { id: 'ALL', name: '全展馆' },
  { id: 'ZONE_A', name: 'A区' },
  { id: 'ZONE_B', name: 'B区' },
  { id: 'ZONE_C', name: 'C区' },
  { id: 'ZONE_D', name: 'D区' }
]

const activeZone = ref('ALL')
const isLoading = ref(true)

interface BatchItem {
  batchId: string;
  batchName: string;
  status: 'RUNNING' | 'WAITING' | 'FINISHED';
  isMidnightBatch: boolean;
  // 以下为状态动态挂载字段
  totalCount?: number;
  finishedCount?: number;
  completionRate?: string;
  remainCount?: number;
  placedOrderCount?: number;
  printedOrderCount?: number;
  funnel?: any;
  efficiency?: any;
  riderLoad?: any;
  warnings?: any[];
}

interface DashboardData {
  summary: {
    totalDailyCount: number;
    onlineCouriers: number;
    onlineSigners: number;
    busyCouriers: number;
    busySigners: number;
  };
  batches: BatchItem[];
}

// 缺省数据
const dashboardData = ref<DashboardData>({
  summary: { totalDailyCount: 0, onlineCouriers: 0, onlineSigners: 0, busyCouriers: 0, busySigners: 0 },
  batches: []
})

// ===== 排序心智引擎 (Batch Waterfall Sorting Engine) =====
/**
 * 现场调度心智优先级（从高到低）：
 * 1. Type 2: 致命烂尾单（已过清货时间，即 status === FINISHED，但且 remainCount > 0）-> 最高优救援
 * 2. Type 1: 主视野进行中（当前交战批次，即 status === RUNNING）-> 紧盯不放
 * 3. Type 4: 下一个将至未至（未开始，即 status === WAITING）-> 备选防区预期
 * 4. Type 3: 完美结案单（已过清货时间且全送完，status === FINISHED, remainCount === 0）-> 扫尾折叠
 */
const sortedBatches = computed(() => {
  if (!dashboardData.value || !dashboardData.value.batches) return []
  
  const cloned = [...dashboardData.value.batches]
  
  const getBatchType = (b: BatchItem) => {
    if (b.status === 'FINISHED' && (b.remainCount && b.remainCount > 0)) return 2 // Type 2 烂尾
    if (b.status === 'RUNNING') return 1 // Type 1 进行中
    if (b.status === 'WAITING') return 4 // Type 4 备战区
    if (b.status === 'FINISHED' && (!b.remainCount || b.remainCount === 0)) return 3 // Type 3 结案区
    return 99
  }

  cloned.sort((a, b) => {
    const typeA = getBatchType(a)
    const typeB = getBatchType(b)
    
    // 如果大类不同，按类型值降序（即倒序：2开头最大最在上面，其实我们想要 2 > 1 > 4 > 3）
    // 为了直观编写排序映射：
    const typePriorityMap: Record<number, number> = {
      2: 100, // 最高危，得分最高排最前
      1: 90,
      4: 80,
      3: 70,
      99: 0
    }
    
    const scoreA = typePriorityMap[typeA]
    const scoreB = typePriorityMap[typeB]
    
    if (scoreA !== scoreB) {
      return scoreB - scoreA // 分数高的排前面
    }
    
    // 如果大类一样（比如有两三个进行中），就按名字时间轴升序？（实际上广交会一个时点通常只有一个进行中）
    return a.batchId.localeCompare(b.batchId)
  })
  
  return cloned
})

// ===== Mock 数据生成器 (全流数据装载) =====
const generateMockData = (zoneId: string) => {
  const baseMulti = zoneId === 'ALL' ? 5 : 1
  const rand = () => Math.random()
  
  const onlineCouriers = Math.floor((80 + rand() * 40) * baseMulti)
  const onlineSigners = Math.floor((15 + rand() * 10) * baseMulti)
  const busyCouriers = Math.floor(onlineCouriers * (0.6 + rand() * 0.3)) // 60%~90% 在忙
  const busySigners = Math.floor(onlineSigners * (0.5 + rand() * 0.4))
  
  return {
    summary: {
      totalDailyCount: Math.floor((3000 + rand() * 1000) * baseMulti),
      onlineCouriers,
      onlineSigners,
      busyCouriers,
      busySigners
    },
    batches: [
      // Batch C: 未开始批次
      {
        batchId: 'b_1015',
        batchName: '10:15~11:00',
        status: 'WAITING',
        isMidnightBatch: false,
        totalCount: Math.floor(1050 * baseMulti)
      },
        // Batch A: 致命烂尾批次（兼做：5位数极限抗压测试）
      {
        batchId: 'b_0915',
        batchName: '09:15~10:00',
        status: 'FINISHED',
        isMidnightBatch: false,
        totalCount: Math.floor(15420 * baseMulti),
        finishedCount: Math.floor(11200 * baseMulti),
        completionRate: '72.6%',
        remainCount: Math.floor(4200 * baseMulti), // <- 这是它触发烂尾被排到第一位的关键
        funnel: {
           waitAccept: { count: Math.floor(1250 * baseMulti), bagCount: Math.floor(480 * baseMulti) },
           goHub: { count: Math.floor(820 * baseMulti), bagCount: Math.floor(350 * baseMulti), people: Math.floor(105 * baseMulti) },
           inHub: { count: Math.floor(630 * baseMulti), bagCount: Math.floor(210 * baseMulti), people: Math.floor(42 * baseMulti) },
           goBooth: { count: Math.floor(1500 * baseMulti), bagCount: Math.floor(580 * baseMulti), people: Math.floor(218 * baseMulti) },
           delivered: Math.floor(11200 * baseMulti)
        },
        efficiency: {
           avgWaitAccept: 0,
           avgGoHub: 12,
           avgInHub: 28,
           avgGoBooth: 45,
           clearRate: '2.5',
           estimateMins: 45
        },
        warnings: [
          { type: 'DELIVERY_TIMEOUT', count: Math.floor(10 * baseMulti), maxDelayMins: 45, desc: '送展位超时' }
        ]
      },
      // Batch E: 宵夜连轴段
      {
        batchId: 'b_1046',
        batchName: '10:46~14:00',
        status: 'RUNNING',
        isMidnightBatch: true,
        placedOrderCount: Math.floor(650 * baseMulti),
        printedOrderCount: Math.floor(600 * baseMulti),
        funnel: {
           waitAccept: { count: Math.floor(15 * baseMulti), bagCount: Math.floor(6 * baseMulti) },
           goHub: { count: Math.floor(18 * baseMulti), bagCount: Math.floor(8 * baseMulti), people: Math.floor(8 * baseMulti) },
           inHub: { count: Math.floor(12 * baseMulti), bagCount: Math.floor(5 * baseMulti), people: Math.floor(4 * baseMulti) },
           goBooth: { count: Math.floor(25 * baseMulti), bagCount: Math.floor(10 * baseMulti), people: Math.floor(12 * baseMulti) },
           delivered: Math.floor(530 * baseMulti)
        },
        efficiency: {
           avgWaitAccept: (5 + rand() * 7),
           avgGoHub: (8 + rand() * 5),
           avgInHub: (12 + rand() * 8),
           avgGoBooth: (15 + rand() * 10),
           clearRate: (6 + rand() * 4).toFixed(1), // 单/分钟
           estimateMins: Math.floor(20 + rand() * 30) // 预计清货倒计时
        },
        warnings: [
          { type: 'KITCHEN_DELAY', count: Math.floor(50 * baseMulti), maxDelayMins: 35, desc: '出单超时' },
          { type: 'NO_RIDER_ACCEPT', count: Math.floor(15 * baseMulti), maxDelayMins: 16, desc: '待接单超时' }
        ]
      },
      // Batch B: 正常的交战进行中
      {
        batchId: 'b_0945',
        batchName: '09:45~10:30',
        status: 'RUNNING',
        isMidnightBatch: false,
        totalCount: Math.floor(850 * baseMulti),
        finishedCount: Math.floor(540 * baseMulti),
        completionRate: '63.5%',
        remainCount: Math.floor(310 * baseMulti),
        funnel: {
           waitAccept: { count: Math.floor((10 + rand() * 40) * baseMulti), bagCount: Math.floor((5 + rand() * 15) * baseMulti) },
           goHub: { count: Math.floor((80 + rand() * 50) * baseMulti), bagCount: Math.floor((30 + rand() * 25) * baseMulti), people: Math.floor(20 * baseMulti) },
           inHub: { count: Math.floor((30 + rand() * 20) * baseMulti), bagCount: Math.floor((12 + rand() * 10) * baseMulti), people: Math.floor(6 * baseMulti) },
           goBooth: { count: Math.floor((120 + rand() * 80) * baseMulti), bagCount: Math.floor((45 + rand() * 30) * baseMulti), people: Math.floor(35 * baseMulti) },
           delivered: Math.floor(540 * baseMulti)
        },
        efficiency: {
           avgWaitAccept: (5 + rand() * 7),
           avgGoHub: (8 + rand() * 5),
           avgInHub: (12 + rand() * 8),
           avgGoBooth: (15 + rand() * 10),
           clearRate: (12 + rand() * 8).toFixed(1),
           estimateMins: Math.floor(15 + rand() * 20)
        },
        warnings: [
          { type: 'NO_RIDER_ACCEPT', count: Math.floor((5 + rand()*10)*baseMulti), maxDelayMins: Math.floor(10 + rand()*20), desc: '待接单超时' },
          ...(rand() > 0.5 ? [{ type: 'HUB_STAY', count: Math.floor((2 + rand()*5)*baseMulti), maxDelayMins: Math.floor(15 + rand()*10), desc: '在集散地滞留超时' }] : [])
        ]
      },
      // Batch D: 尚未截单的极远期批次
      {
        batchId: 'b_1045',
        batchName: '10:45~11:30',
        status: 'WAITING',
        isMidnightBatch: false,
        totalCount: Math.floor(1200 * baseMulti)
      }
    ]
  } as DashboardData
}

// ===== 视图逻辑 =====
const selectZone = (id: string) => {
  if (activeZone.value === id) return
  activeZone.value = id
  localStorage.setItem(CACHE_KEY, id)
  fetchData(id)
}

const fetchData = (id: string) => {
  isLoading.value = true
  // 模拟网络延迟
  setTimeout(() => {
    dashboardData.value = generateMockData(id)
    isLoading.value = false
  }, 400 + Math.random() * 400)
}

// 初始化
onMounted(() => {
  // 1. 读取缓存
  const cachedZone = localStorage.getItem(CACHE_KEY)
  const isValidZone = zones.some(z => z.id === cachedZone)
  
  // 2. 赋予活性状态
  if (cachedZone && isValidZone) {
    activeZone.value = cachedZone
  } else {
    activeZone.value = zones[0].id
    localStorage.setItem(CACHE_KEY, activeZone.value)
  }
  
  // 3. 首次拉取数据
  fetchData(activeZone.value)
})

</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.styled-scroll::-webkit-scrollbar {
  width: 4px;
}
.styled-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.styled-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
</style>
