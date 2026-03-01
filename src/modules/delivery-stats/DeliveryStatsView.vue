<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'
import DocViewer from '@/components/DocViewer.vue'

import prdRaw from '../../../docs/modules/配送统计/PRD.md?raw'
import specRaw from '../../../docs/modules/配送统计/Spec.md?raw'
import iaRaw from '../../../docs/modules/配送统计/IA.md?raw'

import {
  areas as areaList,
  allFloors,
  allHalls,
  hallDirectory,
  locationTree,
  statusStages
} from '@/mock/deliveryData'

const docs = { prd: prdRaw, spec: specRaw, ia: iaRaw }

const mealSlots = ['早餐', '午餐', '下午茶']

const filterForm = reactive({
  date: '2026-02-28',
  area: '',
  floor: '',
  hall: '',
  courier: '',
  mealSlot: '',
  status: ''
})

const loading = ref(false)

const allRows = ref([
  { orderId: 'O24001', area: 'A区', floor: '1F', hall: '8.0展厅-1', courier: '李海', mealSlot: '午餐', status: '在集散', elapsed: 16 },
  { orderId: 'O24002', area: 'A区', floor: '1F', hall: '8.1展厅', courier: '王青', mealSlot: '午餐', status: '送展位', elapsed: 23 },
  { orderId: 'O24003', area: 'B区', floor: 'M1', hall: '13.0展厅', courier: '陈涛', mealSlot: '午餐', status: '在集散', elapsed: 12 },
  { orderId: 'O24004', area: 'B区', floor: '2F', hall: '11.2展厅', courier: '赵斌', mealSlot: '午餐', status: '送展位', elapsed: 19 },
  { orderId: 'O24005', area: 'C区', floor: '3F', hall: '16.3展厅', courier: '刘鹏', mealSlot: '午餐', status: '待接单', elapsed: 8 },
  { orderId: 'O24006', area: 'D区', floor: '1F', hall: '20.1展厅', courier: '周凯', mealSlot: '午餐', status: '已送达', elapsed: 31 },
  { orderId: 'O24007', area: 'D区', floor: 'LF', hall: '21.2展厅', courier: '马骁', mealSlot: '午餐', status: '赴集散', elapsed: 11 },
  { orderId: 'O24008', area: 'A区', floor: '2F', hall: '5.2展厅', courier: '李海', mealSlot: '午餐', status: '已送达', elapsed: 29 },
  { orderId: 'O24009', area: 'C区', floor: '4F', hall: '16.4展厅', courier: '刘鹏', mealSlot: '下午茶', status: '送展位', elapsed: 15 },
  { orderId: 'O24010', area: 'B区', floor: '3F', hall: '9.3展厅', courier: '赵斌', mealSlot: '下午茶', status: '待接单', elapsed: 7 },
  { orderId: 'O24011', area: 'A区', floor: 'LF', hall: 'A区会议厅', courier: '孙宁', mealSlot: '早餐', status: '已送达', elapsed: 18 },
  { orderId: 'O24012', area: 'D区', floor: '2F', hall: '18.2展厅', courier: '高远', mealSlot: '下午茶', status: '送展位', elapsed: 21 }
])

const rows = ref([...allRows.value])

const overview = reactive({
  total: 0,
  completed: 0,
  inProgress: 0,
  risk: 0,
  completionRate: 0
})

const statusBuckets = ref([])

const trendRows = ref([
  { slot: '10:30', completionRate: 76, riskRate: 12 },
  { slot: '11:00', completionRate: 82, riskRate: 15 },
  { slot: '11:30', completionRate: 88, riskRate: 11 },
  { slot: '12:00', completionRate: 84, riskRate: 16 },
  { slot: '12:30', completionRate: 91, riskRate: 8 }
])

const exceptionRows = ref([])

const couriers = computed(() => Array.from(new Set(allRows.value.map((item) => item.courier))))

const floorOptions = computed(() => {
  if (filterForm.area) return Object.keys(locationTree[filterForm.area] || {})
  return allFloors
})

const getHallCandidates = (area, floor) => {
  if (area && floor) return hallDirectory[`${area}|${floor}`] || []
  if (area && !floor) {
    return Object.values(locationTree[area] || {}).flatMap((halls) => halls)
  }
  if (!area && floor) {
    return areaList.flatMap((itemArea) => hallDirectory[`${itemArea}|${floor}`] || [])
  }
  return allHalls.map((item) => item.hall)
}

const suggestHalls = (queryString, cb) => {
  const query = queryString.trim().toLowerCase()
  const list = getHallCandidates(filterForm.area, filterForm.floor)
    .filter((hall) => !query || hall.toLowerCase().includes(query))
    .slice(0, 20)
    .map((value) => ({ value }))
  cb(list)
}

const toggleFilter = (field, value) => {
  filterForm[field] = filterForm[field] === value ? '' : value
}

const pickArea = (area) => {
  const nextArea = filterForm.area === area ? '' : area
  filterForm.area = nextArea
  filterForm.floor = ''
  filterForm.hall = ''
}

const pickFloor = (floor) => {
  const nextFloor = filterForm.floor === floor ? '' : floor
  filterForm.floor = nextFloor
  filterForm.hall = ''
}

watch(() => filterForm.area, () => {
  if (filterForm.floor && !floorOptions.value.includes(filterForm.floor)) {
    filterForm.floor = ''
  }
})

const derive = () => {
  const total = rows.value.length
  const completed = rows.value.filter((item) => item.status === '已送达').length
  const inProgress = total - completed
  const risk = rows.value.filter((item) => item.status !== '已送达' && item.elapsed >= 20).length

  overview.total = total
  overview.completed = completed
  overview.inProgress = inProgress
  overview.risk = risk
  overview.completionRate = total ? Math.round((completed / total) * 100) : 0

  statusBuckets.value = statusStages.map((status) => {
    const count = rows.value.filter((item) => item.status === status).length
    const percent = total ? Math.round((count / total) * 100) : 0
    return { status, count, percent }
  })

  exceptionRows.value = rows.value
    .filter((item) => item.status !== '已送达' && item.elapsed >= 20)
    .map((item) => ({
      ...item,
      exceptionType: item.status === '待接单' ? '分派延迟' : '状态停留超阈值'
    }))
}

const runFilter = async () => {
  loading.value = true
  await new Promise((resolve) => setTimeout(resolve, 280))

  rows.value = allRows.value.filter((item) => {
    if (filterForm.area && item.area !== filterForm.area) return false
    if (filterForm.floor && item.floor !== filterForm.floor) return false
    if (filterForm.hall && !item.hall.toLowerCase().includes(filterForm.hall.trim().toLowerCase())) return false
    if (filterForm.courier && !item.courier.includes(filterForm.courier.trim())) return false
    if (filterForm.mealSlot && item.mealSlot !== filterForm.mealSlot) return false
    if (filterForm.status && item.status !== filterForm.status) return false
    return true
  })

  derive()
  loading.value = false
}

const resetFilter = async () => {
  filterForm.area = ''
  filterForm.floor = ''
  filterForm.hall = ''
  filterForm.courier = ''
  filterForm.mealSlot = ''
  filterForm.status = ''
  await runFilter()
}

const exportExceptions = () => {
  ElMessage.success(`已触发导出，当前异常单 ${exceptionRows.value.length} 条（原型演示）`)
}

derive()
</script>

<template>
  <div class="space-y-6 mx-auto max-w-[1440px]">
    <!-- Header -->
    <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div class="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 ring-1 ring-inset ring-blue-600/20">Delivery Observatory</div>
          <h2 class="mt-4 text-2xl font-bold tracking-tight text-slate-900">配送统计驾驶舱</h2>
          <p class="mt-2 text-sm leading-relaxed text-slate-500">实时看进度，历史看趋势，异常单可追踪可导出。</p>
        </div>
        <div class="flex items-center gap-2">
           <span class="relative flex h-2.5 w-2.5">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          </span>
          <span class="text-xs font-medium text-slate-500">实时监控模式</span>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <el-form class="flex flex-col gap-4">
        <!-- Main Filter Row -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <el-form-item label="检索时段" class="!mb-0 w-full col-span-1 lg:col-span-2">
            <el-date-picker v-model="filterForm.date" type="date" value-format="YYYY-MM-DD" placeholder="选择查询日期" class="!w-full" />
          </el-form-item>
          <el-form-item label="直接定位" class="!mb-0 w-full col-span-1 lg:col-span-2">
            <el-autocomplete
              v-model="filterForm.hall"
              :fetch-suggestions="suggestHalls"
              clearable
              placeholder="展厅短链输入..."
              class="!w-full"
            />
          </el-form-item>
          <el-form-item label="追查人员" class="!mb-0 w-full col-span-1 lg:col-span-2">
            <el-input v-model="filterForm.courier" placeholder="输入账号或姓名" class="!w-full" clearable />
          </el-form-item>
        </div>

        <el-divider class="!my-0 border-slate-100" />
        
        <!-- Tags Row -->
        <div class="flex flex-col gap-4">
          <div class="flex items-start gap-3">
             <span class="shrink-0 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">大区快筛</span>
             <div class="flex flex-wrap gap-2">
              <el-tag :type="!filterForm.area ? 'primary' : 'info'" effect="plain" class="cursor-pointer !rounded-md" @click="pickArea('')">全局</el-tag>
              <el-tag
                v-for="item in areaList"
                :key="item"
                :type="filterForm.area === item ? 'primary' : 'info'"
                effect="plain"
                class="cursor-pointer !rounded-md"
                @click="pickArea(item)"
              >
                {{ item }}
              </el-tag>
            </div>
          </div>
          
           <div class="flex items-start gap-3">
             <span class="shrink-0 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">楼层快筛</span>
             <div class="flex flex-wrap gap-2">
              <el-tag :type="!filterForm.floor ? 'primary' : 'info'" effect="plain" class="cursor-pointer !rounded-md" @click="pickFloor('')">全栈</el-tag>
              <el-tag
                v-for="item in floorOptions"
                :key="item"
                :type="filterForm.floor === item ? 'primary' : 'info'"
                effect="plain"
                class="cursor-pointer !rounded-md"
                @click="pickFloor(item)"
              >
                {{ item }}
              </el-tag>
            </div>
          </div>
          
          <div class="flex items-start gap-3">
             <span class="shrink-0 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">业务快筛</span>
             <div class="flex w-full flex-wrap justify-between gap-4">
               <div class="flex flex-wrap gap-2 border-r border-slate-100 pr-5">
                   <el-tag :type="!filterForm.mealSlot ? 'primary' : 'info'" effect="plain" class="cursor-pointer !rounded-md" @click="filterForm.mealSlot = ''">全天</el-tag>
                   <el-tag
                     v-for="item in mealSlots"
                     :key="item"
                     :type="filterForm.mealSlot === item ? 'primary' : 'info'"
                     effect="plain"
                     class="cursor-pointer !rounded-md"
                     @click="toggleFilter('mealSlot', item)"
                   >
                     {{ item }}
                   </el-tag>
               </div>
               
               <div class="flex flex-1 flex-wrap gap-2">
                 <el-tag :type="!filterForm.status ? 'primary' : 'info'" effect="plain" class="cursor-pointer !rounded-md" @click="filterForm.status = ''">全节点</el-tag>
                 <el-tag
                   v-for="item in statusStages"
                   :key="item"
                   :type="filterForm.status === item ? 'primary' : 'info'"
                   effect="plain"
                   class="cursor-pointer !rounded-md border-0"
                   :class="filterForm.status === item ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' : 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/10'"
                   @click="toggleFilter('status', item)"
                 >
                   {{ item }}
                 </el-tag>
               </div>
               
               <!-- Action Buttons -->
               <div class="flex items-center gap-2">
                  <el-button @click="resetFilter" plain class="!rounded-lg">清除</el-button>
                  <el-button type="primary" :loading="loading" @click="runFilter" class="!rounded-lg shadow-sm">应用筛查</el-button>
               </div>
             </div>
          </div>
        </div>
      </el-form>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div class="text-sm font-medium text-slate-500">累计投放量</div>
        <div class="mt-3 flex items-baseline gap-2 text-3xl font-bold tracking-tight text-slate-900">
          {{ overview.total }} <span class="text-sm font-medium text-slate-400">单</span>
        </div>
      </div>
      <div class="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div class="flex items-center justify-between">
           <div class="text-sm font-medium text-slate-500">完结核销</div>
           <span class="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">正向指标</span>
        </div>
        <div class="mt-3 flex items-baseline gap-2 text-3xl font-bold tracking-tight text-emerald-600">
          {{ overview.completed }} <span class="text-sm font-medium text-emerald-500/70">单</span>
        </div>
      </div>
      <div class="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm ring-1 ring-blue-100">
        <div class="flex items-center justify-between">
            <div class="text-sm font-medium text-blue-700">流转途经</div>
            <span class="flex h-2 w-2 rounded-full bg-blue-500"></span>
        </div>
        <div class="mt-3 flex items-baseline gap-2 text-3xl font-bold tracking-tight text-blue-700">
          {{ overview.inProgress }} <span class="text-sm font-medium text-blue-500/70">单</span>
        </div>
      </div>
      <div class="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm ring-1 ring-rose-200 relative overflow-hidden">
        <div class="flex items-center justify-between relative z-10">
           <div class="text-sm font-medium text-rose-800">隐患/超时风险</div>
           <el-icon class="text-rose-500" size="16"><Warning /></el-icon>
        </div>
        <div class="mt-3 flex items-baseline gap-2 text-3xl font-bold tracking-tight text-rose-700 relative z-10">
          {{ overview.risk }} <span class="text-sm font-medium text-rose-600/70">单</span>
        </div>
        <!-- Decorative pulse -->
        <div class="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-rose-500/10 blur-xl"></div>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
      <!-- Status Chart Concept -->
      <div class="flex flex-col rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div class="border-b border-slate-100 bg-slate-50/50 px-5 py-4 flex items-center justify-between">
          <span class="text-sm font-semibold text-slate-800">履约全链路漏斗</span>
          <div class="rounded bg-white px-2 py-1 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200">
             即时流转率 {{ overview.completionRate }}%
          </div>
        </div>
        <div class="p-6 space-y-5">
          <div v-for="item in statusBuckets" :key="item.status" class="relative">
            <div class="flex items-center justify-between text-xs font-medium mb-1.5">
              <span class="text-slate-700">{{ item.status }}</span>
              <span class="text-slate-500">{{ item.count }} 笔</span>
            </div>
            <div class="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div 
                class="h-full rounded-full transition-all duration-500 ease-out"
                :class="item.status === '已送达' ? 'bg-emerald-500' : 'bg-blue-500'" 
                :style="{ width: `${item.percent}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Trend Chart Concept -->
      <div class="flex flex-col rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div class="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
          <span class="text-sm font-semibold text-slate-800">波峰衰减趋势 (推演)</span>
        </div>
        <div class="p-2">
          <el-table :data="trendRows" class="!border-0 text-sm" style="--el-table-border-color: transparent">
            <el-table-column prop="slot" label="刻度" width="90" class-name="font-mono text-slate-600" />
            <el-table-column label="核销健康度" min-width="150">
              <template #default="scope">
                <div class="flex items-center gap-3">
                  <div class="h-1.5 flex-1 rounded-full bg-slate-100">
                    <div class="h-1.5 rounded-full bg-emerald-500" :style="{ width: `${scope.row.completionRate}%` }" />
                  </div>
                  <span class="w-10 text-right text-xs font-medium text-slate-700">{{ scope.row.completionRate }}%</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="拥塞风险值" min-width="150">
              <template #default="scope">
                <div class="flex items-center gap-3">
                  <div class="h-1.5 flex-1 rounded-full bg-slate-100">
                    <div class="h-1.5 rounded-full bg-rose-500" :style="{ width: `${scope.row.riskRate}%` }" />
                  </div>
                  <span class="w-10 text-right text-xs font-medium text-slate-700">{{ scope.row.riskRate }}%</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <!-- Exception List -->
    <div class="flex flex-col rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
       <div class="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
        <span class="text-sm font-semibold text-slate-800">异动与超时干预池</span>
        <el-button color="#122235" plain class="!rounded-lg text-xs" size="small" @click="exportExceptions">拉取溯源切片</el-button>
      </div>

      <div class="p-4">
        <el-table :data="exceptionRows" border stripe class="!rounded-xl text-xs" :empty-text="loading ? '索引重构中...' : '大盘脉象平稳，无异常'">
          <el-table-column prop="orderId" label="单据根源号" width="110" class-name="font-mono" />
          <el-table-column label="劣变类型" width="140">
             <template #default="scope">
                 <div class="flex items-center gap-1.5">
                    <div class="h-1.5 w-1.5 rounded-full bg-rose-500 flex-shrink-0"></div>
                    <span class="font-medium text-rose-700 truncate min-w-0">{{ scope.row.exceptionType }}</span>
                 </div>
             </template>
          </el-table-column>
          <el-table-column prop="area" label="大区" width="70" />
          <el-table-column prop="floor" label="层级" width="70" />
          <el-table-column prop="hall" label="终点终端" min-width="130" />
          <el-table-column prop="courier" label="捕获责任方" width="110" />
          <el-table-column label="挂起于" width="100">
            <template #default="scope">
              <span class="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">{{ scope.row.status }}</span>
            </template>
          </el-table-column>
          <el-table-column label="驻留刻度" width="100" class-name="font-mono text-rose-600 font-medium">
             <template #default="scope">
                +{{ scope.row.elapsed }}m
             </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <DocViewer title="配送统计模块" :docs="docs" />
  </div>
</template>
