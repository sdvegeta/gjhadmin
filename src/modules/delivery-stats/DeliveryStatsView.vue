<script setup>
import { computed, reactive, ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning, Clock, User, Box, ArrowRight, DataLine, List, Refresh, Phone } from '@element-plus/icons-vue'
import DocViewer from '@/components/DocViewer.vue'

import prdRaw from '../../../docs/modules/配送统计/PRD.md?raw'
import specRaw from '../../../docs/modules/配送统计/Spec.md?raw'
import iaRaw from '../../../docs/modules/配送统计/IA.md?raw'

const docs = { prd: prdRaw, spec: specRaw, ia: iaRaw }

// 自动获取用户所处时区的当日日期 YYYY-MM-DD
const getTodayString = () => {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const TODAY = getTodayString()

const disableFutureDates = (time) => {
  // 禁止选择等于或晚于今天的日期，即仅开放历史日期供复盘使用
  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)
  return time.getTime() >= todayDate.getTime()
}

const goToToday = () => {
  filterForm.date = TODAY
  applyFilter()
}

const filterForm = reactive({
  date: TODAY,
  areas: []
})

const areaOptions = ['A区', 'B区', 'C区', 'D区']

const isRealtime = computed(() => filterForm.date === TODAY)

const loading = ref(false)

// =============== Realtime Mock Data ===============
const realtimeSnapshot = reactive({
  todayTotalOrders: 15420,
  activeDeliveryStaff: 124,
  activeSorterStaff: 36,
  idleDeliveryStaff: 8,
  idleSorterStaff: 2
})

const realtimeBatches = ref([
  {
    id: '0', 
    name: '08:15~09:00 批次',
    statusText: '配送超时',
    total: 3200, 
    delivered: 3120, 
    speed: 2, 
    restAvg: 40,
    funnel: [
      { stage: '待接单', code: 'PENDING', bags: 0, orders: 0, staffs: 0, avgMin: 0 },
      { stage: '赴集散', code: 'TO_HUB', bags: 10, orders: 30, staffs: 2, avgMin: 12.5 },
      { stage: '在集散', code: 'IN_HUB', bags: 15, orders: 45, staffs: 1, avgMin: 15.8 },
      { stage: '送展位', code: 'DELIVERING', bags: 2, orders: 5, staffs: 2, avgMin: 32.4 }
    ],
    alerts: [
      { title: '送集散地超时', list: [{ target: '李海', count: 30, maxMin: 14 }] },
      { title: '在集散地滞留超时', list: [{ target: 'A区1F东集散', count: 45, maxMin: 22 }] },
      { title: '送展位超时', list: [{ target: '张强', count: 5, maxMin: 38 }] }
    ]
  },
  {
    id: '1', 
    name: '10:15~11:00 批次',
    statusText: '进行中',
    total: 4500, 
    delivered: 1200, 
    speed: 125, 
    restAvg: 26,
    funnel: [
      { stage: '待接单', code: 'PENDING', bags: 120, orders: 340, staffs: 0, avgMin: 4.2 },
      { stage: '赴集散', code: 'TO_HUB', bags: 330, orders: 1170, staffs: 54, avgMin: 6.5 },
      { stage: '在集散', code: 'IN_HUB', bags: 435, orders: 1515, staffs: 27, avgMin: 5.8 },
      { stage: '送展位', code: 'DELIVERING', bags: 278, orders: 815, staffs: 58, avgMin: 18.4 }
    ],
    alerts: [
      { title: '待接单超时', list: [{ target: '新大地(C区)', count: 32, maxMin: 18 }, { target: '肯德基(D区)', count: 18, maxMin: 15 }] },
      { title: '送集散地超时', list: [{ target: '王青', count: 5, maxMin: 11 }] },
      { title: '在集散地滞留超时', list: [{ target: 'B区2F集散', count: 89, maxMin: 15 }] }
    ]
  },
  {
    id: '2', 
    name: '11:45~12:30 批次',
    statusText: '未开始',
    total: 2600, 
    delivered: 0, 
    speed: 0, 
    restAvg: 0,
    funnel: [],
    alerts: []
  },
  {
    id: '3', 
    name: '09:15~10:00 批次',
    statusText: '已完成',
    total: 1200, 
    delivered: 1200, 
    speed: 0, 
    restAvg: 0,
    funnel: [],
    alerts: []
  }
])

// =============== History Mock Data ===============
const historyOverview = reactive({
  ontimeRate: 92.5,
  deadRate: 0.8,
  totalOrders: 42560
})

const historyDuration = ref([
  { stage: '待接单', avg: 5.2, p90: 12.1 },
  { stage: '赴集散', avg: 7.4, p90: 14.5 },
  { stage: '在集散', avg: 6.1, p90: 15.2 },
  { stage: '送展位', avg: 19.5, p90: 32.4 }
])

const historyBlacklists = ref([
  { title: '商家拖单Top5', list: [{ target: '遇见小面(A区)', ratio: '24%' }, { target: '真功夫(B区)', ratio: '18%' }, { target: '莱一煲(C区)', ratio: '12%' }] },
  { title: '集散爆仓Top5', list: [{ target: 'A区1层东集散', ratio: '15%' }, { target: 'C区首层集散', ratio: '11%' }, { target: 'B区3层集散', ratio: '9%' }] },
  { title: '骑手延误Top5', list: [{ target: '周凯', ratio: '8%' }, { target: '马骁', ratio: '6%' }, { target: '赵斌', ratio: '5%' }] }
])

// UI Interactions
const showDrillDown = ref(false)
const currentDrillDownTitle = ref('')

const openDrillDown = (alertItem, boardTitle) => {
  if (!isRealtime.value) {
    ElMessage.warning('历史评估模式下禁止下钻到具体明细单号！')
    return
  }
  currentDrillDownTitle.value = `${boardTitle} - 积压大表`
  showDrillDown.value = true
}

const handleExport = () => {
  ElMessage.success('已导出当前明细台账大表 (Excel)')
}

const checkStageTimeout = (code, avg) => {
  const thresholds = { PENDING: 10, TO_HUB: 8, IN_HUB: 7, DELIVERING: 25 }
  return thresholds[code] && avg >= thresholds[code]
}

const applyFilter = async () => {
  loading.value = true
  await new Promise(r => setTimeout(r, 600))
  loading.value = false
}

// 模拟空闲人员数据
const MockIdleStaffs = [
  { name: '陈志强', role: '配送员', phone: '13800138001', lastActiveTime: '2026-03-11 11:20:00' },
  { name: '李阿海', role: '配送员', phone: '13800138002', lastActiveTime: '2026-03-11 11:25:32' },
  { name: '王启东', role: '配送员', phone: '13800138003', lastActiveTime: '2026-03-11 11:30:15' },
  { name: '刘小鹏', role: '配送员', phone: '13800138004', lastActiveTime: '2026-03-11 11:35:44' },
  { name: '马超', role: '配送员', phone: '13800138005', lastActiveTime: '2026-03-11 11:42:10' },
  { name: '张小强', role: '配送员', phone: '13800138006', lastActiveTime: '2026-03-11 11:55:00' },
  { name: '赵信', role: '配送员', phone: '13800138007', lastActiveTime: '2026-03-11 12:05:00' },
  { name: '孙策', role: '配送员', phone: '13800138008', lastActiveTime: '2026-03-11 12:10:30' },
  { name: '吴秀妹', role: '分拣签收员', phone: '13900139001', lastActiveTime: '2026-03-11 11:58:20' },
  { name: '白云龙', role: '分拣签收员', phone: '13900139002', lastActiveTime: '2026-03-11 12:02:40' }
]

const showIdleStaffDrawer = ref(false)
const idleStaffTitle = ref('')
const currentIdleList = ref([])

const openIdleStaffList = (role) => {
  idleStaffTitle.value = `当前空闲 ${role} 列表`
  // 过滤，并按最后操作时间倒序排序 (最近操作的排前面)
  currentIdleList.value = MockIdleStaffs.filter(s => s.role === role)
    .sort((a, b) => new Date(b.lastActiveTime) - new Date(a.lastActiveTime))
  showIdleStaffDrawer.value = true
}
const lastRefreshTime = ref('')
const countdown = ref(30)
let timer = null

const updateLastRefreshTime = () => {
  const now = new Date()
  lastRefreshTime.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
}

const manualRefresh = async () => {
  countdown.value = 30
  await applyFilter()
  updateLastRefreshTime()
}

onMounted(() => {
  updateLastRefreshTime()
  timer = setInterval(() => {
    if (isRealtime.value && !loading.value) {
      countdown.value--
      if (countdown.value <= 0) {
        countdown.value = 30
        manualRefresh()
      }
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="space-y-6 mx-auto max-w-[1600px]">
    
    <!-- 全局模式切换与筛选项 -->
    <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sticky top-0 z-40 bg-opacity-95 backdrop-blur">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="text-lg font-bold text-slate-900 tracking-tight">调度统计中心</div>
          <div class="h-6 w-px bg-slate-200"></div>
          <div class="flex items-center gap-2">
            <el-date-picker 
              v-model="filterForm.date" 
              type="date" 
              value-format="YYYY-MM-DD" 
              placeholder="选择历史日期" 
              class="!w-[140px]" 
              :disabled-date="disableFutureDates"
              :clearable="false"
              @change="applyFilter"
            />
            <el-button v-if="!isRealtime" type="primary" plain @click="goToToday" :icon="Clock" class="!rounded-lg !px-3 shadow-sm border-blue-200">看今日</el-button>
          </div>
          <el-select v-model="filterForm.areas" multiple collapse-tags placeholder="全展区" class="!w-64" clearable>
            <el-option v-for="area in areaOptions" :key="area" :label="area" :value="area" />
          </el-select>
          <el-button type="primary" @click="applyFilter" class="!rounded-lg" :loading="loading">拉取数据</el-button>
        </div>
        
        <div class="flex items-center gap-3">
          <div v-if="isRealtime" class="flex items-center gap-3 rounded-full bg-slate-50 pl-2 pr-4 py-1.5 ring-1 ring-slate-200">
             <el-button size="small" circle :icon="Refresh" @click="manualRefresh" :loading="loading" class="!border-none shadow-sm"></el-button>
             <div class="flex flex-col">
                <span class="text-xs font-bold text-slate-700 tracking-wide flex items-center gap-1.5">
                  <span class="relative flex h-2 w-2">
                    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  自动刷新 ({{countdown}}s)
                </span>
                <span class="text-[10px] text-slate-400 leading-none mt-0.5">上次刷新: {{ lastRefreshTime }}</span>
             </div>
          </div>
          <div v-else class="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 ring-1 ring-slate-300">
             <el-icon class="text-slate-500"><DataLine /></el-icon>
             <span class="text-xs font-bold text-slate-700 tracking-wide">战后复盘(宏观锁库)</span>
          </div>
        </div>
      </div>
    </div>

    <transition name="el-fade-in-linear" mode="out-in">
      <!-- 模式一：当日实时看板模式 -->
      <div v-if="isRealtime" class="space-y-6" key="realtime">
        
        <!-- 顶部宏观大盘区 -->
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div class="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-white shadow-lg shadow-blue-500/20">
            <div class="text-blue-100 text-sm font-medium">今日总单量</div>
            <div class="mt-2 text-4xl font-black tracking-tight">{{ realtimeSnapshot.todayTotalOrders }}</div>
            <div class="mt-2 text-xs text-blue-200">排除已取消单据</div>
          </div>
          <div class="rounded-2xl bg-white p-5 ring-1 ring-slate-200 shadow-sm flex flex-col justify-between">
            <div class="text-slate-500 text-sm font-medium flex items-center gap-1.5"><el-icon><User/></el-icon>当班配送员 (活跃)</div>
            <div class="text-3xl font-bold text-slate-900">{{ realtimeSnapshot.activeDeliveryStaff }} <span class="text-sm font-normal text-slate-500">人</span></div>
          </div>
          <div class="rounded-2xl bg-white p-5 ring-1 ring-slate-200 shadow-sm flex flex-col justify-between">
            <div class="text-slate-500 text-sm font-medium flex items-center gap-1.5"><el-icon><User/></el-icon>当班签收员 (活跃)</div>
            <div class="text-3xl font-bold text-slate-900">{{ realtimeSnapshot.activeSorterStaff }} <span class="text-sm font-normal text-slate-500">人</span></div>
          </div>
          <div @click="openIdleStaffList('配送员')" class="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-500/20 shadow-sm flex flex-col justify-between relative overflow-hidden cursor-pointer hover:bg-emerald-100 hover:ring-emerald-500/40 transition-all group">
            <div class="text-emerald-700 text-sm font-bold flex items-center justify-between">
              <span>空闲配送员</span>
              <el-icon class="text-emerald-500/50 group-hover:text-emerald-600 transition-colors"><ArrowRight/></el-icon>
            </div>
            <div class="text-3xl font-black text-emerald-600">{{ realtimeSnapshot.idleDeliveryStaff }} <span class="text-sm font-normal text-emerald-600/70">人</span></div>
          </div>
          <div @click="openIdleStaffList('分拣签收员')" class="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-500/20 shadow-sm flex flex-col justify-between relative overflow-hidden cursor-pointer hover:bg-emerald-100 hover:ring-emerald-500/40 transition-all group">
             <div class="text-emerald-700 text-sm font-bold flex items-center justify-between">
              <span>空闲签收员</span>
              <el-icon class="text-emerald-500/50 group-hover:text-emerald-600 transition-colors"><ArrowRight/></el-icon>
            </div>
            <div class="text-3xl font-black text-emerald-600">{{ realtimeSnapshot.idleSorterStaff }} <span class="text-sm font-normal text-emerald-600/70">人</span></div>
          </div>
        </div>

        <!-- 批次瀑布宽表与四段流流转漏斗 -->
        <!-- 批次流主体：不同餐段独立互不干扰 -->
        <div class="space-y-6">
          <div v-for="batch in realtimeBatches" :key="batch.id" 
               class="rounded-2xl p-6 ring-1 shadow-sm transition-all relative overflow-hidden"
               :class="{
                 'bg-white ring-rose-200 border-t-4 border-t-rose-500': batch.statusText === '配送超时',
                 'bg-white ring-blue-200 border-t-4 border-t-blue-500': batch.statusText === '进行中',
                 'bg-slate-50 ring-slate-200': batch.statusText === '已完成' || batch.statusText === '未开始'
               }">
               
            <!-- 头部：批次信息与进度槽 -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 relative z-10">
               <div class="flex items-center gap-3">
                 <h3 class="text-xl font-bold" :class="batch.statusText === '配送超时' ? 'text-rose-600' : 'text-slate-800'">{{ batch.name }}</h3>
                 <span class="px-2 py-1 rounded text-xs font-bold" 
                       :class="{
                         'bg-rose-100 text-rose-700': batch.statusText === '配送超时',
                         'bg-blue-100 text-blue-700': batch.statusText === '进行中',
                         'bg-emerald-100 text-emerald-700': batch.statusText === '已完成',
                         'bg-slate-200 text-slate-500': batch.statusText === '未开始'
                       }">{{ batch.statusText }}</span>
               </div>
               
               <div v-if="batch.statusText === '进行中' || batch.statusText === '配送超时'" class="flex items-center gap-8">
                  <div class="flex flex-col items-end">
                    <span class="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">已送达 / 总需配送</span>
                    <span class="font-mono font-bold text-slate-800 text-xl leading-none">{{batch.delivered}} <span class="text-sm font-normal text-slate-400">/ {{batch.total}}</span></span>
                  </div>
                  <div class="flex flex-col items-end">
                    <span class="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">完成进度</span>
                    <span class="font-mono font-bold text-lg leading-none" :class="batch.statusText === '配送超时' ? 'text-rose-600' : 'text-blue-600'">{{ Math.round((batch.delivered/batch.total)*100) }}%</span>
                  </div>
               </div>
               
               <div v-else class="flex flex-col items-end">
                  <span class="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-0.5" v-if="batch.statusText === '已完成'">最终完结单量</span>
                  <span class="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-0.5" v-if="batch.statusText === '未开始'">目前接单量</span>
                  <span class="font-mono font-bold text-slate-800 text-xl leading-none">{{batch.total}} <span class="text-sm font-normal text-slate-400">单</span></span>
               </div>
            </div>
            
            <!-- 进度条与流速底栏 -->
            <div v-if="batch.statusText === '进行中' || batch.statusText === '配送超时'" class="mb-5 relative z-10">
               <div class="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div class="h-full rounded-full transition-all" 
                       :class="batch.statusText === '配送超时' ? 'bg-rose-500' : 'bg-blue-500'" 
                       :style="{width: `${(batch.delivered / batch.total)*100}%`}"></div>
               </div>
               <div class="flex items-center gap-6 text-sm">
                  <div class="flex items-center gap-1.5"><el-icon class="text-emerald-500"><DataLine/></el-icon><span class="text-slate-600">近5分流速: <strong class="text-slate-900 font-mono text-base">{{batch.speed}}</strong> 单/分</span></div>
                  <div class="flex items-center gap-1.5"><el-icon class="text-amber-500"><Clock/></el-icon><span class="text-slate-600">预估送完还需: <strong class="text-slate-900 font-mono text-base">{{batch.restAvg}}</strong> 分钟</span></div>
               </div>
            </div>
            
            <!-- 该批次专属的流转漏斗与预警区 -->
            <div v-if="batch.funnel && batch.funnel.length > 0" class="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6 pt-5 border-t border-slate-100 relative z-10">
              
              <!-- 专属四段漏斗 -->
              <div>
                 <div class="text-xs font-bold text-slate-500 mb-3 tracking-wider">{{ batch.name.split(' ')[0] }} 实时配送流转节点</div>
                 <div class="flex w-full items-stretch justify-between relative z-10 gap-2">
                    <template v-for="(node, idx) in batch.funnel" :key="node.code">
                       <div class="flex-1 rounded-lg bg-slate-50 ring-1 ring-slate-200 p-2.5">
                         <div class="text-sm font-bold text-slate-700 mb-2 text-center">{{ node.stage }}</div>
                         <div class="flex flex-col gap-1.5">
                           <div class="bg-white py-1.5 rounded border border-slate-200 shadow-sm grid grid-cols-2 divide-x divide-slate-100">
                             <div class="flex flex-col items-center justify-center">
                               <span class="text-[10px] text-slate-400 font-medium mb-0.5">在途单数</span>
                               <span class="font-bold text-slate-800 text-lg leading-none">{{node.orders}}</span>
                             </div>
                             <div class="flex flex-col items-center justify-center">
                               <span class="text-[10px] text-slate-400 font-medium mb-0.5">打包袋数</span>
                               <span class="font-bold text-slate-700 text-lg leading-none">{{node.bags}}</span>
                             </div>
                           </div>
                           <div v-if="node.staffs > 0" class="bg-white px-2 py-1.5 rounded border border-slate-100 flex items-center justify-between shadow-sm">
                              <span class="text-[10px] text-slate-500">实操人数</span>
                              <span class="font-bold text-slate-700 text-xs">{{node.staffs}} <span class="font-normal">人</span></span>
                           </div>
                           <div v-else class="bg-slate-100/50 px-2 py-1.5 rounded border border-slate-100 flex items-center justify-center opacity-50">
                              <span class="text-[10px] text-slate-400 font-medium">无活体运力</span>
                           </div>
                           <div class="px-2 py-1.5 rounded border flex justify-between items-center" :class="checkStageTimeout(node.code, node.avgMin) ? 'bg-rose-50/50 border-rose-100' : 'bg-blue-50/50 border-blue-100'">
                              <span class="text-[10px]" :class="checkStageTimeout(node.code, node.avgMin) ? 'text-rose-600/70' : 'text-blue-600/70'">平均耗时</span>
                              <span class="font-bold text-xs" :class="checkStageTimeout(node.code, node.avgMin) ? 'text-rose-600' : 'text-blue-700'">{{node.avgMin}} <span class="font-normal">分</span></span>
                           </div>
                         </div>
                       </div>
                       <!-- 箭头 -->
                       <div v-if="idx < 3" class="w-3 flex items-center justify-center text-slate-300">
                         <el-icon><ArrowRight/></el-icon>
                       </div>
                    </template>
                 </div>
              </div>
              
              <!-- 专属预警榜 -->
              <div v-if="batch.alerts && batch.alerts.length > 0">
                 <div class="text-xs font-bold text-rose-800 mb-3 tracking-wider flex items-center gap-1.5">
                   <el-icon><Warning/></el-icon> 实时堵点预警榜
                 </div>
                 <div class="grid grid-cols-2 md:grid-cols-3 gap-3 items-start">
                    <template v-for="alert in batch.alerts" :key="alert.title">
                      <div v-if="alert.list.length > 0" 
                           @click="openDrillDown(alert, alert.title)" 
                           class="bg-rose-50/40 rounded border border-rose-100 cursor-pointer hover:border-rose-300 hover:bg-rose-50 transition-all p-2.5 flex flex-col justify-center relative overflow-hidden group">
                         <div class="text-[11px] font-bold text-rose-800 mb-1.5">{{ alert.title }}</div>
                         <div class="flex items-baseline gap-1.5">
                            <span class="text-rose-600 font-bold text-lg">{{ Math.max(...alert.list.map(i => i.maxMin)) }}<span class="text-[10px] font-normal text-rose-500/70 ml-0.5">分钟</span></span>
                            <span class="text-rose-700 font-bold text-sm ml-1">{{ alert.list.reduce((sum, i) => sum + i.count, 0) }}<span class="text-[10px] font-normal text-rose-500/70 ml-0.5">单</span></span>
                         </div>
                         <!-- 提示小角标或背板效果 -->
                         <div class="absolute right-2 bottom-2 text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity">
                            <el-icon><ArrowRight/></el-icon>
                         </div>
                      </div>
                    </template>
                 </div>
              </div>
              
            </div>
            
            <div v-if="batch.statusText === '配送超时'" class="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-rose-500/5 blur-2xl"></div>
          </div>
        </div>
      </div>

      <!-- 模式二：历史评估模式 -->
      <div v-else class="space-y-6" key="history">
        <!-- 结果大盘：履约质量 -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
            <div class="text-sm font-bold text-slate-500 mb-2">闭环准时达成率总计</div>
            <div class="text-5xl font-black text-emerald-600">{{ historyOverview.ontimeRate }}<span class="text-2xl">%</span></div>
          </div>
          <div class="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
            <div class="text-sm font-bold text-slate-500 mb-2">超时未送达 (死单率)</div>
            <div class="text-5xl font-black text-rose-600">{{ historyOverview.deadRate }}<span class="text-2xl">%</span></div>
          </div>
           <div class="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
            <div class="text-sm font-bold text-slate-500 mb-2">核算周期发单总量</div>
            <div class="text-4xl font-black text-slate-800">{{ historyOverview.totalOrders }} <span class="text-lg font-normal text-slate-500">单</span></div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 均耗沉淀柱图 -->
          <div class="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
             <div class="text-base font-bold text-slate-900 mb-6">全周期物理流水均耗与极差 P90定调</div>
             <div class="space-y-5">
               <div v-for="item in historyDuration" :key="item.stage">
                 <div class="flex justify-between text-sm mb-1.5"><span class="font-bold text-slate-700">{{item.stage}}</span></div>
                 <div class="relative h-6 w-full bg-slate-50 rounded ring-1 ring-slate-100 flex items-center">
                    <div class="absolute left-0 top-0 bottom-0 bg-blue-400 rounded-l flex items-center px-2 text-xs text-white font-bold whitespace-nowrap overflow-hidden" :style="{width: `${Math.min(item.avg*2, 100)}%`}">
                      均耗 {{item.avg}}分
                    </div>
                    <div class="absolute top-1 bottom-1 bg-amber-200 w-1 ml-[-2px] z-10" :style="{left: `${Math.min(item.p90*2, 100)}%`}" title="P90水位线"></div>
                    <div class="absolute text-[10px] text-amber-700 font-bold -top-4" :style="{left: `max(0%, calc(${Math.min(item.p90*2, 100)}% - 20px))`}">P90: {{item.p90}}分</div>
                 </div>
               </div>
             </div>
          </div>

          <!-- 黑榜大系 -->
          <div class="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
             <div class="text-base font-bold text-slate-900 mb-6">全周期违规溯源 Top 定位 (验尸报告)</div>
             <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div v-for="bl in historyBlacklists" :key="bl.title" class="flex flex-col gap-2">
                  <div class="text-xs font-bold text-slate-500 uppercase">{{bl.title}}</div>
                  <div class="bg-slate-50 rounded-lg p-2 flex-1 border border-slate-100 space-y-1.5">
                    <div v-for="(item, idx) in bl.list" :key="idx" class="flex items-center justify-between text-xs p-1.5 bg-white border border-slate-100 rounded shadow-sm">
                      <span class="truncate pr-2 font-medium" :class="idx===0?'text-rose-600':'text-slate-700'">{{idx+1}}. {{item.target}}</span>
                      <span class="font-mono bg-rose-50 text-rose-600 px-1 rounded">{{item.ratio}}</span>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>

      </div>
    </transition>

    <!-- 下钻台账抽屉 (仅限战中) -->
    <el-drawer v-model="showDrillDown" size="65%" :title="currentDrillDownTitle" destroy-on-close class="!bg-slate-50">
       <div class="p-4 bg-white rounded-lg shadow-sm ring-1 ring-slate-200 m-4 h-[calc(100vh-120px)] flex flex-col">
         <div class="flex justify-between items-center mb-4">
            <span class="text-sm font-bold text-slate-800">当前符合该异常条件的单据大表</span>
            <el-button type="primary" size="small" @click="handleExport" :icon="List">导出拨打台账</el-button>
         </div>
         <div class="flex-1 bg-slate-50 rounded border border-slate-200 flex items-center justify-center text-slate-400">
            [ 高保真组件: AlertBoardDetails Table Data... ]
         </div>
       </div>
    </el-drawer>

    <!-- 空闲人员列表抽屉 -->
    <el-drawer v-model="showIdleStaffDrawer" size="450px" :title="idleStaffTitle" destroy-on-close>
      <div class="p-4 bg-slate-50 min-h-full">
         <div class="text-sm text-slate-500 mb-4 bg-white p-3 rounded border border-slate-200 shadow-sm flex items-center gap-2">
            <el-icon class="text-emerald-500"><User/></el-icon>
            共拦截到 <strong>{{ currentIdleList.length }}</strong> 位正处于游离空闲状态的活体运力，可拨打电话即刻调度。
         </div>
         <div class="space-y-3">
            <div v-for="(staff, idx) in currentIdleList" :key="idx" class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 hover:border-emerald-300 transition-colors">
              <div class="flex justify-between items-start">
                 <div class="flex items-center gap-2">
                   <div class="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg ring-1 ring-emerald-200">{{ staff.name.charAt(0) }}</div>
                   <div class="flex flex-col">
                     <span class="font-bold text-slate-800">{{ staff.name }}</span>
                     <span class="text-[10px] text-slate-500 uppercase tracking-wider">{{ staff.role }}</span>
                   </div>
                 </div>
                 <div class="text-right flex flex-col items-end">
                   <span class="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{{ staff.lastActiveTime.split(' ')[1] }}</span>
                   <span class="text-[10px] text-slate-400 mt-1">最后活跃点</span>
                 </div>
              </div>
              <div class="bg-slate-50 p-2 rounded flex justify-start items-center border border-slate-100 gap-2">
                 <el-icon class="text-slate-400"><Phone /></el-icon>
                 <span class="text-xs font-medium text-slate-600 font-mono">{{ staff.phone }}</span>
              </div>
            </div>
         </div>
      </div>
    </el-drawer>

    <!-- 底部文档锚点 -->
    <DocViewer title="调度统计模块" :docs="docs" />
  </div>
</template>

<style scoped>
.el-drawer__header {
  margin-bottom: 0 !important;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}
</style>
