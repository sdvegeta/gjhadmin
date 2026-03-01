<script setup lang="ts">
const props = defineProps<{
  batch: any
}>()
</script>

<template>
  <div class="bg-white rounded-[12px] px-4 py-3 shadow-sm border border-gray-50 flex items-center justify-between">
    <div class="flex items-center">
      <span class="w-1.5 h-4 bg-gray-200 rounded-sm mr-2"></span>
      <h2 class="text-[14px] font-medium text-gray-500">{{ batch.batchName }}</h2>
      <span class="ml-2 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">已结束</span>
    </div>

    <div class="flex items-center">
      <div class="flex flex-col text-right mr-3">
        <span class="text-[10px] text-gray-400">最终完成</span>
        <span class="text-[14px] font-bold text-[#333333]">{{ batch.finishedCount }}<span class="text-[9px] text-gray-400 font-normal ml-0.5">单</span></span>
      </div>
      <div class="h-6 w-px bg-gray-200 mx-2"></div>
      <div class="flex flex-col text-right w-12 text-[#FF6600]">
        <span class="text-[10px] text-gray-400">完成率</span>
        <span class="text-[14px] font-bold">{{ batch.completionRate }}</span>
      </div>
    </div>
  </div>
</template>
