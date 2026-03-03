<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps<{
  batch: any
}>()

// 判断是普通批次还是宵夜动态批次
const isMidnight = computed(() => props.batch.isMidnightBatch)

// 判断是否是 Type 2 绝命烂尾单：已经过清货时间，但还有未送达的订单
const isRotten = computed(() => props.batch.status === 'FINISHED' && (props.batch.remainCount || 0) > 0)
</script>

<template>
  <!-- 如果是烂尾单，改用极静纯白底色配合鲜红警报边框（防色彩淤积） -->
  <div class="rounded-[12px] p-4 shadow-sm relative overflow-hidden transition-colors"
       :class="isRotten ? 'bg-white border-2 border-red-500 border-t-[6px]' : 'bg-white border border-transparent'">
    <!-- 头部：批次名与状态栏 -->
    <div class="flex items-center justify-between mb-4 border-b pb-3"
         :class="isRotten ? 'border-red-100' : 'border-gray-50'">
      <div class="flex items-center">
        <span class="w-1.5 h-4 rounded-sm mr-2" :class="isRotten ? 'bg-red-600' : 'bg-[#FF6600]'"></span>
        <h2 class="text-base font-bold text-[#333333]">{{ batch.batchName }}</h2>
        <span v-if="isMidnight" class="ml-2 bg-purple-100 text-purple-600 px-1.5 py-0.5 text-xs rounded">动态餐段</span>
      </div>
      <div class="flex items-center">
        <span class="relative flex h-2 w-2 mr-1.5">
          <span v-if="isRotten" class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-red-400"></span>
          <span class="relative inline-flex rounded-full h-2 w-2"
                :class="isRotten ? 'bg-red-500' : 'bg-blue-500'"></span>
        </span>
        <span class="text-xs font-medium" :class="isRotten ? 'text-red-600' : 'text-blue-600'">
           {{ isRotten ? '严重滞留' : '进行中' }}
        </span>
      </div>
    </div>

    <!-- 顶部大数字区与流速摘要 (因果强聚合版) -->
    <div class="flex justify-between items-end mb-4">
       <!-- 常规批次：展示总预订、完成进度与清货流速预测 -->
       <template v-if="!isMidnight">
         <div class="flex flex-col flex-shrink-0 mr-2">
           <div class="text-[13px] text-gray-500 mb-1.5 whitespace-nowrap">总需配送</div>
           <div class="flex items-baseline gap-1">
             <div class="text-[32px] font-bold text-[#333333] leading-none tracking-tight">{{ batch.totalCount }}</div>
             <div class="text-[13px] font-medium text-gray-400">单</div>
           </div>
         </div>
         <div class="flex flex-col items-end flex-grow text-right min-w-0">
           <div class="flex items-center justify-end gap-1.5 mb-1.5">
             <span class="text-[12px] text-gray-500">已送达 / 完成率</span>
           </div>
           <div class="flex items-baseline justify-end gap-1.5 mb-1.5">
             <div class="text-[18px] font-bold text-[#FF6600] leading-none">{{ batch.finishedCount }}</div>
             <span class="text-gray-300 text-[14px]">/</span>
             <div class="text-[16px] font-bold text-[#333333] leading-none">{{ batch.completionRate }}</div>
           </div>
         </div>
       </template>
       
       <!-- 宵夜批次：展示实时下单池与打签出单/已送达 -->
       <template v-else>
         <div class="flex flex-col">
           <div class="text-[13px] text-purple-500 mb-1.5 font-medium">当前下单总量</div>
           <div class="flex items-baseline gap-1">
             <div class="text-[32px] font-bold text-[#333333] leading-none tracking-tight">{{ batch.placedOrderCount }}</div>
             <div class="text-[13px] font-medium text-gray-400">单</div>
           </div>
         </div>
         <div class="flex flex-col items-end flex-grow text-right min-w-0">
           <div class="flex items-center justify-end gap-1.5 mb-1.5">
             <span class="text-[12px] text-gray-500">已出单 / 已送达</span>
           </div>
           <div class="flex items-baseline justify-end gap-1.5 mb-1.5">
             <div class="text-[18px] font-bold text-[#FF6600] leading-none">{{ batch.printedOrderCount }}</div>
             <span class="text-gray-300 text-[14px]">/</span>
             <div class="text-[16px] font-bold text-[#333333] leading-none">{{ batch.funnel?.delivered || 0 }}</div>
           </div>
         </div>
       </template>
    </div>

    <div v-if="batch.efficiency && batch.efficiency.clearRate !== undefined && !isMidnight" class="mb-3 px-2 py-1 flex items-center justify-between border-b border-gray-100/50">
      <div class="flex items-center text-gray-500">
        <span class="text-[11px] font-medium whitespace-nowrap">送达流速: <span class="text-[13px] font-bold text-gray-700 mx-0.5">{{ batch.efficiency.clearRate === 0 ? '未知' : batch.efficiency.clearRate }}</span> <span v-if="batch.efficiency.clearRate !== 0" class="text-[10px]">单/分</span></span>
      </div>
      <div class="flex items-center text-gray-500">
        <span class="text-[11px] font-medium whitespace-nowrap">预计还需: <span class="text-[13px] font-bold text-gray-700 mx-0.5">{{ batch.efficiency.clearRate === 0 ? '未知' : Math.max(1, batch.efficiency.estimateMins) }}</span> <span v-if="batch.efficiency.clearRate !== 0" class="text-[10px]">分钟</span></span>
      </div>
    </div>

    <!-- 漏斗流向区 (三位一体超级网格层，带单位防折行) -->
    <div class="text-[13px] text-gray-600 mb-2 font-bold flex items-center">
      <div class="w-1 h-3 bg-gray-300 rounded-sm mr-1.5"></div>
      实时配送流转节点
    </div>
    <div class="flex w-full mb-3 rounded-xl border border-gray-100 overflow-hidden shadow-sm">
       <!-- 待接单 (纯积压，无人承接) -->
       <div class="flex flex-col flex-1 border-r border-gray-100 min-w-0">
          <div class="bg-gray-50 text-center py-1.5 border-b border-gray-100">
            <span class="text-[12px] text-gray-600 font-medium whitespace-nowrap">待接单</span>
          </div>
          <div class="bg-white flex flex-col items-center justify-center py-2 h-[82px] px-0.5">
            <div class="flex flex-col items-center justify-center w-full leading-none mb-1">
              <span v-if="batch.funnel.waitAccept?.bagCount" class="font-bold text-gray-800 text-[17px] whitespace-nowrap mb-0.5">{{ batch.funnel.waitAccept.bagCount }}<span class="text-[10px] font-normal mx-0.5">袋</span></span>
              <span class="font-medium text-gray-400 text-[11px] whitespace-nowrap">{{ batch.funnel.waitAccept?.count ?? batch.funnel.waitAccept }}<span class="text-[9px] font-normal ml-[1px]">单</span></span>
            </div>
            <div class="h-[18px]"></div> <!-- 无兵力挂载，保位 -->
            <span v-if="batch.efficiency?.avgWaitAccept" class="mt-auto text-[10px] sm:text-[11px] font-medium whitespace-nowrap" :class="batch.efficiency.avgWaitAccept > 10 ? 'text-red-500' : 'text-gray-400'">
              均耗 {{ batch.efficiency.avgWaitAccept.toFixed(1) }}m
            </span>
          </div>
       </div>

       <!-- 赴集散 -->
       <div class="flex flex-col flex-1 border-r border-gray-100 min-w-0">
          <div class="bg-gray-50 text-center py-1.5 border-b border-gray-100">
            <span class="text-[12px] text-gray-600 font-medium whitespace-nowrap">赴集散</span>
          </div>
          <div class="bg-white flex flex-col items-center justify-center py-2 h-[82px] px-0.5">
            <div class="flex flex-col items-center justify-center w-full leading-none mb-1">
              <span v-if="batch.funnel.goHub?.bagCount" class="font-bold text-gray-800 text-[17px] whitespace-nowrap mb-0.5">{{ batch.funnel.goHub.bagCount }}<span class="text-[10px] font-normal mx-0.5">袋</span></span>
              <span class="font-medium text-gray-400 text-[11px] whitespace-nowrap">{{ batch.funnel.goHub?.count ?? batch.funnel.goHub }}<span class="text-[9px] font-normal ml-[1px]">单</span></span>
            </div>
            <span class="text-[10px] text-gray-500 bg-gray-50 px-1 rounded h-[18px] flex items-center justify-center mb-1 whitespace-nowrap overflow-hidden text-ellipsis w-[90%] mx-auto">
              <template v-if="batch.funnel.goHub?.people">{{ batch.funnel.goHub.people }} <span class="scale-90 opacity-70 ml-0.5">人</span></template>
            </span>
            <span v-if="batch.efficiency?.avgGoHub" class="mt-auto text-[10px] sm:text-[11px] font-medium whitespace-nowrap" :class="batch.efficiency.avgGoHub > 10 ? 'text-red-500' : 'text-gray-400'">
              均耗 {{ batch.efficiency.avgGoHub.toFixed(1) }}m
            </span>
          </div>
       </div>

       <!-- 在集散 -->
       <div class="flex flex-col flex-1 border-r border-gray-100 min-w-0">
          <div class="bg-gray-50 text-center py-1.5 border-b border-gray-100">
            <span class="text-[12px] text-gray-600 font-medium whitespace-nowrap">在集散</span>
          </div>
          <div class="bg-white flex flex-col items-center justify-center py-2 h-[82px] px-0.5">
            <div class="flex flex-col items-center justify-center w-full leading-none mb-1">
              <span v-if="batch.funnel.inHub?.bagCount" class="font-bold text-gray-800 text-[17px] whitespace-nowrap mb-0.5">{{ batch.funnel.inHub.bagCount }}<span class="text-[10px] font-normal mx-0.5">袋</span></span>
              <span class="font-medium text-gray-400 text-[11px] whitespace-nowrap">{{ batch.funnel.inHub?.count ?? batch.funnel.inHub }}<span class="text-[9px] font-normal ml-[1px]">单</span></span>
            </div>
            <span class="text-[10px] text-gray-500 bg-gray-50 px-1 rounded h-[18px] flex items-center justify-center mb-1 whitespace-nowrap overflow-hidden text-ellipsis w-[90%] mx-auto">
               <template v-if="batch.funnel.inHub?.people">{{ batch.funnel.inHub.people }} <span class="scale-90 opacity-70 ml-0.5">人</span></template>
            </span>
            <span v-if="batch.efficiency?.avgInHub" class="mt-auto text-[10px] sm:text-[11px] font-medium whitespace-nowrap" :class="batch.efficiency.avgInHub > 10 ? 'text-red-500' : 'text-gray-400'">
              均耗 {{ batch.efficiency.avgInHub.toFixed(1) }}m
            </span>
          </div>
       </div>

       <!-- 送展位 -->
       <div class="flex flex-col flex-[1.1] min-w-0">
          <div class="bg-gray-50 text-center py-1.5 border-b border-gray-100">
            <span class="text-[12px] text-gray-600 font-medium whitespace-nowrap">送展位</span>
          </div>
          <div class="bg-white flex flex-col items-center justify-center py-2 h-[82px] px-0.5">
            <div class="flex flex-col items-center justify-center w-full leading-none mb-1">
              <span v-if="batch.funnel.goBooth?.bagCount" class="font-bold text-gray-800 text-[17px] whitespace-nowrap mb-0.5">{{ batch.funnel.goBooth.bagCount }}<span class="text-[10px] font-normal mx-0.5">袋</span></span>
              <span class="font-medium text-gray-400 text-[11px] whitespace-nowrap">{{ batch.funnel.goBooth?.count ?? batch.funnel.goBooth }}<span class="text-[9px] font-normal ml-[1px]">单</span></span>
            </div>
            <span class="text-[10px] text-gray-500 bg-gray-50 px-1 rounded h-[18px] flex items-center justify-center mb-1 whitespace-nowrap overflow-hidden text-ellipsis w-[90%] mx-auto">
               <template v-if="batch.funnel.goBooth?.people">{{ batch.funnel.goBooth.people }} <span class="scale-90 opacity-70 ml-0.5">人</span></template>
            </span>
            <span v-if="batch.efficiency?.avgGoBooth" class="mt-auto text-[10px] sm:text-[11px] font-medium whitespace-nowrap" :class="batch.efficiency.avgGoBooth > 25 ? 'text-red-500' : 'text-gray-400'">
              均耗 {{ batch.efficiency.avgGoBooth.toFixed(1) }}m
            </span>
          </div>
       </div>
    </div>

    <!-- 实时堵点预警榜 -->
    <div class="mt-4 pt-4 border-t border-dashed border-gray-200">
      <h3 class="text-xs font-bold text-red-500 mb-3 flex items-center justify-between">
        <div class="flex items-center">
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          实时堵点预警榜
        </div>
      </h3>
      
      <div v-if="!batch.warnings || batch.warnings.length === 0" class="text-center py-4 text-xs text-gray-400 bg-gray-50 rounded">
        当前批次履约通畅，暂无节点预警
      </div>
      
      <div v-else class="space-y-2.5">
         <div v-for="(warn, idx) in batch.warnings" :key="idx" 
              class="flex items-center justify-between p-2.5 bg-red-50/50 rounded-lg border border-red-100 relative overflow-hidden cursor-pointer"
              @click="router.push({ path: '/mp-preview/warning-detail', query: { type: warn.type, batchId: batch.batchId } })">
            <!-- 涟漪点击反馈遮罩预留 -->
            <div class="absolute inset-0 hover:bg-black/5 transition-colors"></div>
            <div class="flex flex-col relative z-10">
              <span class="text-xs font-bold text-[#333333]">{{ warn.desc }}</span>
              <span class="text-xs text-red-500 mt-1">最长滞留: <span class="font-bold">{{ warn.maxDelayMins }}</span> 分钟</span>
            </div>
            <div class="text-right flex items-center relative z-10 text-red-600">
              <span class="text-base font-bold mr-1">{{ warn.count }}</span><span class="text-xs">单</span>
              <svg class="w-4 h-4 ml-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </div>
         </div>
      </div>
    </div>
  </div>
</template>
