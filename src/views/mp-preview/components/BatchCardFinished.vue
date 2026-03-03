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
      <span class="ml-2 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">已完成</span>
    </div>

    <div class="flex items-center">
      <div class="text-[14px] font-bold text-[#333333]">
        <span class="text-[12px] font-normal text-gray-400 mr-1.5">已完成</span>
        {{ batch.finishedCount }}<span class="text-[11px] text-gray-400 font-normal ml-[2px]">单</span>
      </div>
    </div>
  </div>
</template>
