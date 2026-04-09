<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight, Refresh, Search, Warning } from '@element-plus/icons-vue'
import DocViewer from '@/components/DocViewer.vue'

import prdRaw from '../../../docs/modules/配送管理/PRD.md?raw'
import specRaw from '../../../docs/modules/配送管理/Spec.md?raw'
import iaRaw from '../../../docs/modules/配送管理/IA.md?raw'
import orderMonitorPrdRaw from '../../../docs/modules/配送管理/订单实时监控/PRD.md?raw'
import orderMonitorSpecRaw from '../../../docs/modules/配送管理/订单实时监控/Spec.md?raw'
import orderMonitorIaRaw from '../../../docs/modules/配送管理/订单实时监控/IA.md?raw'
import staffScopePrdRaw from '../../../docs/modules/配送管理/配送员主责配置/PRD.md?raw'
import staffScopeSpecRaw from '../../../docs/modules/配送管理/配送员主责配置/Spec.md?raw'
import staffScopeIaRaw from '../../../docs/modules/配送管理/配送员主责配置/IA.md?raw'
import pointMerchantPrdRaw from '../../../docs/modules/配送管理/点位商家配置/PRD.md?raw'
import pointMerchantSpecRaw from '../../../docs/modules/配送管理/点位商家配置/Spec.md?raw'
import pointMerchantIaRaw from '../../../docs/modules/配送管理/点位商家配置/IA.md?raw'
import staffPrdRaw from '../../../docs/modules/配送管理/配送员名册/PRD.md?raw'
import staffSpecRaw from '../../../docs/modules/配送管理/配送员名册/Spec.md?raw'
import staffIaRaw from '../../../docs/modules/配送管理/配送员名册/IA.md?raw'

import {
  areas,
  locationTree,
  hallDirectory,
  merchantPool,
  pointMerchantMappings,
  allHalls
} from '@/mock/deliveryData'

const moduleDocs = { prd: prdRaw, spec: specRaw, ia: iaRaw }
const tabDocsMap = {
  preCutoffOrderMonitor: {
    title: '订单实时监控',
    docs: { prd: orderMonitorPrdRaw, spec: orderMonitorSpecRaw, ia: orderMonitorIaRaw }
  },
  staffScopeConfig: {
    title: '配送员主责配置',
    docs: { prd: staffScopePrdRaw, spec: staffScopeSpecRaw, ia: staffScopeIaRaw }
  },
  pointMerchant: {
    title: '点位商家配置',
    docs: { prd: pointMerchantPrdRaw, spec: pointMerchantSpecRaw, ia: pointMerchantIaRaw }
  },
  staff: {
    title: '配送员名册',
    docs: { prd: staffPrdRaw, spec: staffSpecRaw, ia: staffIaRaw }
  }
}
const levelLabelMap = { AREA: '展区级', FLOOR: '楼层级', HALL: '展厅级' }

const floorsByArea = Object.fromEntries(
  areas.map((area) => [area, Object.keys(locationTree[area] || {})])
)

const mappingList = ref(pointMerchantMappings.map((item) => ({ ...item })))

const seedNames = [
  '李海', '王青', '陈涛', '赵斌', '刘鹏',
  '周凯', '马骁', '孙宁', '高远', '胡峰'
]

const createMockStaffList = (count = 50) => {
  const list = []
  for (let i = 1; i <= count; i += 1) {
    const id = `S${String(i).padStart(3, '0')}`
    const name = seedNames[i - 1] || `配送员${String(i).padStart(2, '0')}`
    const mobile = `1380013${String(i).padStart(4, '0')}`
    const status = i % 11 === 0 ? 'INACTIVE' : 'ACTIVE'
    const minute = String((i * 3) % 60).padStart(2, '0')
    const updatedAt = `2026-02-28 09:${minute}`
    
    // Assign mock roles. Majority are COURIER. Some are SIGNER. A few are COURIER+SUPERVISOR.
    let roles = ['COURIER']
    if (i % 7 === 0) roles = ['SIGNER']
    else if (i % 13 === 0) roles = ['COURIER', 'SUPERVISOR']
    else if (i % 17 === 0) roles = ['SUPERVISOR'] // Just supervisor

    const scopeHalls = i % 2 !== 0 ? ['A区|1F|1.1展厅', 'A区|1F|1.2展厅'] : []
    const scopeMerchants = i % 2 !== 0 ? ['M101', 'M102'] : []

    list.push({ id, name, mobile, status, roles, updatedAt, scopeHalls, scopeMerchants })
  }
  return list
}

const staffList = ref(createMockStaffList(50))

const activeTab = ref('staffScopeConfig')
const currentDocBundle = computed(() => tabDocsMap[activeTab.value] || { title: '配送管理模块', docs: moduleDocs })

const pmFilter = reactive({ area: '', floor: '', hall: '' })

const staffDialogVisible = ref(false)
const mappingDialogVisible = ref(false)
const roleDialogVisible = ref(false)
const roleForm = reactive({ staffId: '', roles: [] })
const addStaffForm = reactive({ name: '', mobile: '' })
const mappingForm = reactive({ id: '', area: '', floor: '', hall: '', merchantIds: [] })
const mappingMerchantKeyword = ref('')

const staffKeyword = ref('')
const staffRoleFilter = ref('') // '' represents '全部', otherwise 'COURIER', 'SIGNER', 'SUPERVISOR'
const staffStatusFilter = ref('') // '' represents '全部', otherwise 'ACTIVE', 'INACTIVE'

const pmFloorOptions = computed(() => {
  if (!pmFilter.area) return []
  return floorsByArea[pmFilter.area] || []
})

const pmHallOptions = computed(() => getHallCandidates(pmFilter.area, pmFilter.floor))

const filteredMappings = computed(() => mappingList.value.filter((item) => {
  if (pmFilter.area && item.area !== pmFilter.area) return false
  if (pmFilter.floor && item.floor !== pmFilter.floor) return false
  if (pmFilter.hall && !item.hall.toLowerCase().includes(pmFilter.hall.trim().toLowerCase())) return false
  return true
}))

const filteredStaffList = computed(() => {
  let list = staffList.value
  if (staffRoleFilter.value) {
    list = list.filter((item) => item.roles.includes(staffRoleFilter.value))
  }
  if (staffStatusFilter.value) {
    list = list.filter((item) => item.status === staffStatusFilter.value)
  }
  const keyword = staffKeyword.value.trim()
  if (!keyword) return list
  return list.filter((item) => item.name.includes(keyword) || item.mobile.includes(keyword))
})

const configFilter = reactive({ area: '', floor: '', hall: '', merchantKeyword: '' })
const selectedConfigStaffIds = ref([])
const configHallDialogVisible = ref(false)
const configMerchantDialogVisible = ref(false)
const configHallForm = reactive({ areas: [], floors: [], halls: [] })
const configMerchantForm = reactive({ merchantIds: [], keyword: '' })

const configFloorOptions = computed(() => {
  if (!configFilter.area) return []
  return floorsByArea[configFilter.area] || []
})

const configHallOptions = computed(() => getHallCandidates(configFilter.area, configFilter.floor))

const configFilteredStaffList = computed(() => {
  let list = staffList.value
  
  if (configFilter.area) {
    list = list.filter(item => item.scopeHalls.some(h => h.startsWith(configFilter.area + '|')))
  }
  if (configFilter.floor) {
    list = list.filter(item => item.scopeHalls.some(h => h.includes('|' + configFilter.floor + '|')))
  }
  if (configFilter.hall) {
    list = list.filter(item => item.scopeHalls.some(h => h.toLowerCase().includes(configFilter.hall.trim().toLowerCase())))
  }
  if (configFilter.merchantKeyword) {
    const kw = configFilter.merchantKeyword.toLowerCase()
    list = list.filter(item => {
      return item.scopeMerchants.some(mId => {
        const m = merchantPool.find(mp => mp.id === mId)
        return m && m.name.toLowerCase().includes(kw)
      })
    })
  }
  return list
})

const onConfigStaffSelectionChange = (rows) => {
  selectedConfigStaffIds.value = rows.map((item) => item.id)
}

const canConfigScope = (row) => !row.roles.includes('SIGNER')

const configFormFloorOptions = computed(() => {
  if (!configHallForm.areaFilter) return []
  return floorsByArea[configHallForm.areaFilter] || []
})

const configFormHallOptions = computed(() => {
  if (!configHallForm.areaFilter) return []
  let floors = configHallForm.floorFilter ? [configHallForm.floorFilter] : (floorsByArea[configHallForm.areaFilter] || [])
  return floors.flatMap(floor => {
    return getHallCandidates(configHallForm.areaFilter, floor).map(hall => ({
      label: `${configHallForm.areaFilter} / ${floor} / ${hall}`,
      value: `${configHallForm.areaFilter}|${floor}|${hall}`,
      hallName: hall
    }))
  })
})

const unassignedHallsVisible = ref(false)
const unassignedMerchantsVisible = ref(false)

const unassignedHallsList = computed(() => {
  const staffScopeCounts = {}
  staffList.value.forEach(s => {
    s.scopeHalls.forEach(h => {
      staffScopeCounts[h] = (staffScopeCounts[h] || 0) + 1
    })
  })
  
  return allHalls.map(h => {
    const key = `${h.area}|${h.floor}|${h.hall}`
    return {
      name: key,
      count: staffScopeCounts[key] || 0
    }
  }).sort((a, b) => a.count - b.count)
})

const unassignedMerchantsList = computed(() => {
  const staffScopeCounts = {}
  staffList.value.forEach(s => {
    s.scopeMerchants.forEach(m => {
      staffScopeCounts[m] = (staffScopeCounts[m] || 0) + 1
    })
  })

  return merchantPool.map(m => {
    return {
      id: m.id,
      name: m.name,
      area: m.area,
      count: staffScopeCounts[m.id] || 0
    }
  }).sort((a, b) => a.count - b.count)
})

const getHallCandidates = (area, floor) => {
  if (area && floor) return hallDirectory[`${area}|${floor}`] || []
  if (area && !floor) {
    return Object.entries(locationTree[area] || {}).flatMap(([, halls]) => halls)
  }
  if (!area && floor) {
    return areas.flatMap((itemArea) => hallDirectory[`${itemArea}|${floor}`] || [])
  }
  return allHalls.map((item) => item.hall)
}

const getMerchantNames = (ids) => ids.map((id) => merchantPool.find((item) => item.id === id)?.name || id)

const suggestPmHalls = (queryString, cb) => {
  const query = queryString.trim().toLowerCase()
  const list = pmHallOptions.value
    .filter((item) => !query || item.toLowerCase().includes(query))
    .slice(0, 18)
    .map((value) => ({ value }))
  cb(list)
}

const suggestConfigHalls = (queryString, cb) => {
  const query = queryString.trim().toLowerCase()
  const list = configHallOptions.value
    .filter((item) => !query || item.toLowerCase().includes(query))
    .slice(0, 18)
    .map((value) => ({ value }))
  cb(list)
}

const filteredMerchantPool = computed(() => {
  let pool = merchantPool.filter((m) => m.area === mappingForm.area)
  if (mappingMerchantKeyword.value) {
    pool = pool.filter(m => m.name.toLowerCase().includes(mappingMerchantKeyword.value.toLowerCase()))
  }
  // 排除已选中的商家
  return pool.filter(m => !mappingForm.merchantIds.includes(m.id))
})

const selectedMerchantsDocs = computed(() => {
  return mappingForm.merchantIds.map(id => {
    return merchantPool.find(m => m.id === id) || { id, name: id }
  })
})

const removeSelectedMerchant = (id) => {
  mappingForm.merchantIds = mappingForm.merchantIds.filter(item => item !== id)
}

const openMappingDialog = (row) => {
  mappingForm.id = row.id
  mappingForm.area = row.area
  mappingForm.floor = row.floor
  mappingForm.hall = row.hall
  mappingForm.merchantIds = [...row.merchantIds]
  mappingMerchantKeyword.value = ''
  mappingDialogVisible.value = true
}

const saveMapping = () => {
  if (!mappingForm.merchantIds.length) {
    ElMessage.warning('至少选择一个商家')
    return
  }
  const target = mappingList.value.find((item) => item.id === mappingForm.id)
  if (!target) return
  target.merchantIds = [...new Set(mappingForm.merchantIds)]
  mappingDialogVisible.value = false
  ElMessage.success('点位商家映射已更新')
}

const openAddStaffDialog = () => {
  addStaffForm.name = ''
  addStaffForm.mobile = ''
  staffDialogVisible.value = true
}

const addStaff = () => {
  const name = addStaffForm.name.trim()
  const mobile = addStaffForm.mobile.trim()
  if (!name || !mobile) {
    ElMessage.warning('请完整填写姓名与手机号')
    return
  }
  if (!/^1\\d{10}$/.test(mobile)) {
    ElMessage.error('手机号格式不正确')
    return
  }
  const existingStaff = staffList.value.find((item) => item.mobile === mobile)
  if (existingStaff) {
    if (existingStaff.status === 'ACTIVE') {
      ElMessage.error('账号已存在且可用，不可重复创建')
      return
    }
    ElMessageBox.confirm(
      `该手机号已登记为停用员工【${existingStaff.name}】，是否直接恢复并复用此账号覆盖新信息？`,
      '恢复账号',
      {
        confirmButtonText: '恢复并复写',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      existingStaff.name = name
      existingStaff.status = 'ACTIVE'
      existingStaff.updatedAt = new Date().toLocaleString('zh-CN', { hour12: false })
      staffDialogVisible.value = false
      ElMessage.success('账号已恢复并更新')
    }).catch(() => {})
    return
  }

  staffList.value.unshift({
    id: `S${String(Date.now()).slice(-4)}`,
    name,
    mobile,
    status: 'ACTIVE',
    roles: ['COURIER'],
    updatedAt: new Date().toLocaleString('zh-CN', { hour12: false })
  })

  staffDialogVisible.value = false
  ElMessage.success('配送员新增成功')
}

const toggleStaffStatus = (row) => {
  if (row.status === 'ACTIVE') {
    row.status = 'INACTIVE'
    ElMessage.success('配送员已停用')
  } else {
    row.status = 'ACTIVE'
    ElMessage.success('配送员已恢复')
  }
}

const openRoleDialog = (row) => {
  roleForm.staffId = row.id
  roleForm.roles = [...row.roles]
  roleDialogVisible.value = true
}

const saveRoles = () => {
  if (roleForm.roles.length === 0) {
    ElMessage.warning('每个员工必须至少保留一个角色')
    return
  }

  const staff = staffList.value.find((item) => item.id === roleForm.staffId)
  if (staff) {
    staff.roles = [...roleForm.roles]
  }
  roleDialogVisible.value = false
  ElMessage.success('角色配置已更新')
}

const openConfigHallDialog = () => {
  configHallForm.areaFilter = ''
  configHallForm.floorFilter = ''
  configHallForm.halls = []
  configHallDialogVisible.value = true
}

const selectAllHalls = () => {
  const currentOptions = configFormHallOptions.value.map(opt => opt.value)
  const currentSet = new Set(configHallForm.halls)
  currentOptions.forEach(val => currentSet.add(val))
  configHallForm.halls = Array.from(currentSet)
}

const submitConfigHall = () => {
  if (!configHallForm.halls.length) {
    ElMessage.warning('请勾选需要指派的具体展厅')
    return
  }
  
  const hallArray = Array.from(new Set(configHallForm.halls))
  selectedConfigStaffIds.value.forEach(staffId => {
    const staff = staffList.value.find(s => s.id === staffId)
    if (staff) {
      staff.scopeHalls = [...hallArray]
    }
  })
  configHallDialogVisible.value = false
  ElMessage.success(`成功为选中人员覆盖配置 ${hallArray.length} 个展厅`)
}

const configMerchantFilteredPool = computed(() => {
  let pool = merchantPool
  if (configMerchantForm.keyword) {
    const kw = configMerchantForm.keyword.toLowerCase()
    pool = pool.filter(m => m.name.toLowerCase().includes(kw) || m.area.toLowerCase().includes(kw))
  }
  return pool.filter(m => !configMerchantForm.merchantIds.includes(m.id))
})

const configSelectedMerchantsDocs = computed(() => {
  return configMerchantForm.merchantIds.map(id => {
    return merchantPool.find(m => m.id === id) || { id, name: id }
  })
})

const removeConfigSelectedMerchant = (id) => {
  configMerchantForm.merchantIds = configMerchantForm.merchantIds.filter(item => item !== id)
}

const openConfigMerchantDialog = () => {
  configMerchantForm.merchantIds = []
  configMerchantForm.keyword = ''
  configMerchantDialogVisible.value = true
}

const submitConfigMerchant = () => {
  selectedConfigStaffIds.value.forEach(staffId => {
    const staff = staffList.value.find(s => s.id === staffId)
    if (staff) {
      staff.scopeMerchants = [...new Set([...configMerchantForm.merchantIds])]
    }
  })
  configMerchantDialogVisible.value = false
  ElMessage.success(`成功为 ${selectedConfigStaffIds.value.length} 名配送员配置责任商家`)
}

const monitorColumns = [
  { key: 'cutoff0900', label: '9点截单' },
  { key: 'cutoff1000', label: '10点截单' },
  { key: 'cutoff1030', label: '10:30截单' },
  { key: 'cutoff1100', label: '11:00截单' },
  { key: 'instantAfter11', label: '即时出单' }
]
const monitorDemoTime = ref('')
const monitorTimeOptions = [
  { label: '实时', value: '' },
  { label: '08:50', value: '08:50' },
  { label: '09:20', value: '09:20' },
  { label: '10:05', value: '10:05' },
  { label: '10:40', value: '10:40' },
  { label: '11:10', value: '11:10' }
]

const createMonitorCell = (orders, portions) => ({ orders, portions })

const createAreaMonitorSeed = () => ([
  {
    area: 'A区',
    merchants: [
      { id: 'A-1', name: '丽华快餐-A区', metrics: {
        cutoff0900: createMonitorCell(12, 36),
        cutoff1000: createMonitorCell(18, 52),
        cutoff1030: createMonitorCell(26, 78),
        cutoff1100: createMonitorCell(9, 24),
        instantAfter11: createMonitorCell(3, 7)
      } },
      { id: 'A-2', name: '老广记-A区', metrics: {
        cutoff0900: createMonitorCell(8, 21),
        cutoff1000: createMonitorCell(15, 44),
        cutoff1030: createMonitorCell(19, 57),
        cutoff1100: createMonitorCell(6, 18),
        instantAfter11: createMonitorCell(2, 5)
      } },
      { id: 'A-3', name: '香蕉叶-A区', metrics: {
        cutoff0900: createMonitorCell(10, 28),
        cutoff1000: createMonitorCell(11, 33),
        cutoff1030: createMonitorCell(17, 49),
        cutoff1100: createMonitorCell(4, 12),
        instantAfter11: createMonitorCell(1, 2)
      } },
      { id: 'A-4', name: '肯德基-A区', metrics: {
        cutoff0900: createMonitorCell(6, 14),
        cutoff1000: createMonitorCell(9, 26),
        cutoff1030: createMonitorCell(13, 40),
        cutoff1100: createMonitorCell(5, 15),
        instantAfter11: createMonitorCell(2, 6)
      } }
    ]
  },
  {
    area: 'B区',
    merchants: [
      { id: 'B-1', name: '真功夫-B区', metrics: {
        cutoff0900: createMonitorCell(11, 31),
        cutoff1000: createMonitorCell(17, 48),
        cutoff1030: createMonitorCell(21, 62),
        cutoff1100: createMonitorCell(8, 23),
        instantAfter11: createMonitorCell(4, 11)
      } },
      { id: 'B-2', name: '遇见小面-B区', metrics: {
        cutoff0900: createMonitorCell(9, 24),
        cutoff1000: createMonitorCell(13, 37),
        cutoff1030: createMonitorCell(19, 56),
        cutoff1100: createMonitorCell(7, 19),
        instantAfter11: createMonitorCell(3, 8)
      } },
      { id: 'B-3', name: '木屋烧烤-B区', metrics: {
        cutoff0900: createMonitorCell(7, 18),
        cutoff1000: createMonitorCell(10, 27),
        cutoff1030: createMonitorCell(15, 41),
        cutoff1100: createMonitorCell(6, 16),
        instantAfter11: createMonitorCell(2, 5)
      } }
    ]
  },
  {
    area: 'C区',
    merchants: [
      { id: 'C-1', name: '新大地-C区', metrics: {
        cutoff0900: createMonitorCell(16, 45),
        cutoff1000: createMonitorCell(25, 73),
        cutoff1030: createMonitorCell(31, 92),
        cutoff1100: createMonitorCell(10, 28),
        instantAfter11: createMonitorCell(4, 10)
      } },
      { id: 'C-2', name: '莱一煲-C区', metrics: {
        cutoff0900: createMonitorCell(10, 29),
        cutoff1000: createMonitorCell(15, 43),
        cutoff1030: createMonitorCell(20, 58),
        cutoff1100: createMonitorCell(8, 22),
        instantAfter11: createMonitorCell(3, 8)
      } },
      { id: 'C-3', name: '云吞面-C区', metrics: {
        cutoff0900: createMonitorCell(8, 22),
        cutoff1000: createMonitorCell(12, 36),
        cutoff1030: createMonitorCell(17, 51),
        cutoff1100: createMonitorCell(6, 18),
        instantAfter11: createMonitorCell(2, 6)
      } }
    ]
  },
  {
    area: 'D区',
    merchants: [
      { id: 'D-1', name: '汤粉世家-D区', metrics: {
        cutoff0900: createMonitorCell(7, 20),
        cutoff1000: createMonitorCell(12, 35),
        cutoff1030: createMonitorCell(16, 47),
        cutoff1100: createMonitorCell(7, 21),
        instantAfter11: createMonitorCell(3, 9)
      } },
      { id: 'D-2', name: '肯德基-D区', metrics: {
        cutoff0900: createMonitorCell(9, 25),
        cutoff1000: createMonitorCell(14, 39),
        cutoff1030: createMonitorCell(18, 54),
        cutoff1100: createMonitorCell(9, 27),
        instantAfter11: createMonitorCell(4, 12)
      } },
      { id: 'D-3', name: '西贝-D区', metrics: {
        cutoff0900: createMonitorCell(5, 14),
        cutoff1000: createMonitorCell(9, 26),
        cutoff1030: createMonitorCell(12, 38),
        cutoff1100: createMonitorCell(5, 16),
        instantAfter11: createMonitorCell(2, 7)
      } }
    ]
  }
])

const cloneAreaMonitor = (source) => source.map((area) => ({
  area: area.area,
  merchants: area.merchants.map((merchant) => ({
    id: merchant.id,
    name: merchant.name,
    metrics: Object.fromEntries(
      monitorColumns.map((column) => [
        column.key,
        {
          orders: merchant.metrics[column.key].orders,
          portions: merchant.metrics[column.key].portions
        }
      ])
    )
  }))
}))

const orderMonitorAreas = ref(cloneAreaMonitor(createAreaMonitorSeed()))
const expandedMonitorAreas = ref(['A区'])
const changedMetricKeys = ref(new Set())
const monitorCountdown = ref(60)
const monitorLastRefresh = ref('')
let monitorTimer = null

const formatCurrentTime = () => new Date().toLocaleTimeString('zh-CN', { hour12: false })

const parseTimeToMinutes = (value) => {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

const getCurrentMinutes = () => {
  if (monitorDemoTime.value) return parseTimeToMinutes(monitorDemoTime.value)
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

const getPrimaryOpenColumnKey = () => {
  const nowMinutes = getCurrentMinutes()
  if (nowMinutes < parseTimeToMinutes('08:50')) return 'cutoff0900'
  if (nowMinutes < parseTimeToMinutes('09:50')) return 'cutoff1000'
  if (nowMinutes < parseTimeToMinutes('10:20')) return 'cutoff1030'
  if (nowMinutes < parseTimeToMinutes('10:50')) return 'cutoff1100'
  return 'instantAfter11'
}

const monitorColumnOrder = monitorColumns.map((column) => column.key)

const currentActiveColumnKey = computed(() => getPrimaryOpenColumnKey())

const monitorColumnDisplayStatus = computed(() => {
  const primaryIndex = monitorColumnOrder.indexOf(currentActiveColumnKey.value)
  return Object.fromEntries(
    monitorColumnOrder.map((columnKey, index) => {
      if (columnKey === currentActiveColumnKey.value) return [columnKey, 'active']
      if (index < primaryIndex) return [columnKey, 'inactive']
      return [columnKey, 'upcoming']
    })
  )
})

const getMonitorColumnClasses = (columnKey) => ({
  'bg-slate-50/90': monitorColumnDisplayStatus.value[columnKey] === 'inactive',
  'bg-orange-50/35': monitorColumnDisplayStatus.value[columnKey] === 'active',
  'border-t-2 border-t-orange-300': monitorColumnDisplayStatus.value[columnKey] === 'active',
  'text-slate-500': monitorColumnDisplayStatus.value[columnKey] === 'inactive'
})

const buildScenarioMetrics = (orders, portions, columnKey, primaryKey) => {
  if (columnKey === primaryKey) return createMonitorCell(orders, portions)

  const primaryIndex = monitorColumnOrder.indexOf(primaryKey)
  const currentIndex = monitorColumnOrder.indexOf(columnKey)

  if (currentIndex < primaryIndex) {
    return createMonitorCell(Math.max(0, Math.round(orders * 0.92)), Math.max(0, Math.round(portions * 0.92)))
  }

  return createMonitorCell(0, 0)
}

const normalizeMonitorDataByScenario = () => {
  const primaryColumnKey = getPrimaryOpenColumnKey()
  const baseData = createAreaMonitorSeed()

  orderMonitorAreas.value = baseData.map((area) => ({
    area: area.area,
    merchants: area.merchants.map((merchant) => ({
      id: merchant.id,
      name: merchant.name,
      metrics: Object.fromEntries(
        monitorColumns.map((column) => {
          const rawCell = merchant.metrics[column.key]
          return [column.key, buildScenarioMetrics(rawCell.orders, rawCell.portions, column.key, primaryColumnKey)]
        })
      )
    }))
  }))

  changedMetricKeys.value = new Set()
}

const updateMonitorLastRefresh = () => {
  monitorLastRefresh.value = formatCurrentTime()
}

const areaMonitorSummaries = computed(() => orderMonitorAreas.value.map((area) => ({
  area: area.area,
  totals: Object.fromEntries(
    monitorColumns.map((column) => {
      const summary = area.merchants.reduce((acc, merchant) => {
        acc.orders += merchant.metrics[column.key].orders
        acc.portions += merchant.metrics[column.key].portions
        return acc
      }, { orders: 0, portions: 0 })

      return [column.key, summary]
    })
  )
})))

const isMetricChanged = (entityKey, columnKey, metricKey) => changedMetricKeys.value.has(`${entityKey}:${columnKey}:${metricKey}`)

const toggleMonitorArea = (area) => {
  if (expandedMonitorAreas.value.includes(area)) {
    expandedMonitorAreas.value = expandedMonitorAreas.value.filter((item) => item !== area)
    return
  }
  expandedMonitorAreas.value = [...expandedMonitorAreas.value, area]
}

const simulateMonitorRefresh = () => {
  const previousSnapshot = cloneAreaMonitor(orderMonitorAreas.value)
  const nextSnapshot = cloneAreaMonitor(orderMonitorAreas.value)
  const nextChangedKeys = new Set()
  const primaryColumnKey = getPrimaryOpenColumnKey()

  nextSnapshot.forEach((area, areaIndex) => {
    area.merchants.forEach((merchant, merchantIndex) => {
      monitorColumns.forEach((column, columnIndex) => {
        const baseDeltaSeed = (areaIndex + 1) * 7 + (merchantIndex + 2) * 3 + (columnIndex + 1)
        const cell = merchant.metrics[column.key]
        let orderDelta = 0
        let portionDelta = 0

        if (column.key === primaryColumnKey) {
          orderDelta = (baseDeltaSeed % 3) + 1
          portionDelta = orderDelta * (2 + (baseDeltaSeed % 3))
        } else if (monitorColumnOrder.indexOf(column.key) < monitorColumnOrder.indexOf(primaryColumnKey)) {
          orderDelta = baseDeltaSeed % 2 === 0 ? -1 : 0
          portionDelta = orderDelta === 0 ? 0 : -(1 + (baseDeltaSeed % 2))
        } else {
          cell.orders = 0
          cell.portions = 0
          const prevCell = previousSnapshot[areaIndex].merchants[merchantIndex].metrics[column.key]
          if (cell.orders !== prevCell.orders) {
            nextChangedKeys.add(`${merchant.id}:${column.key}:orders`)
          }
          if (cell.portions !== prevCell.portions) {
            nextChangedKeys.add(`${merchant.id}:${column.key}:portions`)
          }
          return
        }

        cell.orders = Math.max(0, cell.orders + orderDelta)
        cell.portions = Math.max(cell.orders, cell.portions + portionDelta)

        const prevCell = previousSnapshot[areaIndex].merchants[merchantIndex].metrics[column.key]
        if (cell.orders !== prevCell.orders) {
          nextChangedKeys.add(`${merchant.id}:${column.key}:orders`)
        }
        if (cell.portions !== prevCell.portions) {
          nextChangedKeys.add(`${merchant.id}:${column.key}:portions`)
        }
      })
    })
  })

  nextSnapshot.forEach((area, areaIndex) => {
    monitorColumns.forEach((column) => {
      const previousTotals = previousSnapshot[areaIndex].merchants.reduce((acc, merchant) => {
        acc.orders += merchant.metrics[column.key].orders
        acc.portions += merchant.metrics[column.key].portions
        return acc
      }, { orders: 0, portions: 0 })

      const nextTotals = area.merchants.reduce((acc, merchant) => {
        acc.orders += merchant.metrics[column.key].orders
        acc.portions += merchant.metrics[column.key].portions
        return acc
      }, { orders: 0, portions: 0 })

      if (nextTotals.orders !== previousTotals.orders) {
        nextChangedKeys.add(`${area.area}:${column.key}:orders`)
      }
      if (nextTotals.portions !== previousTotals.portions) {
        nextChangedKeys.add(`${area.area}:${column.key}:portions`)
      }
    })
  })

  orderMonitorAreas.value = nextSnapshot
  changedMetricKeys.value = nextChangedKeys
  monitorCountdown.value = 60
  updateMonitorLastRefresh()
}

const manualRefreshMonitor = () => {
  simulateMonitorRefresh()
  ElMessage.success('订单监控原型数据已刷新')
}

onMounted(() => {
  normalizeMonitorDataByScenario()
  updateMonitorLastRefresh()
  monitorTimer = setInterval(() => {
    monitorCountdown.value -= 1
    if (monitorCountdown.value <= 0) {
      simulateMonitorRefresh()
    }
  }, 1000)
})

onUnmounted(() => {
  if (monitorTimer) clearInterval(monitorTimer)
})

watch(monitorDemoTime, () => {
  normalizeMonitorDataByScenario()
  monitorCountdown.value = 60
  updateMonitorLastRefresh()
})
</script>

<template>
  <div class="mx-auto max-w-[1440px] space-y-6">
    <!-- Main Content Area -->
    <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <el-tabs v-model="activeTab" class="custom-tabs">
        <el-tab-pane label="订单实时监控" name="preCutoffOrderMonitor">
          <div class="space-y-5">
            <div class="rounded-2xl bg-slate-50/80 p-5 ring-1 ring-slate-200">
              <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <h3 class="text-lg font-bold tracking-tight text-slate-900">订单实时监控</h3>

                <div class="flex flex-wrap items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                  <div class="min-w-[128px]">
                    <div class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">演示时间</div>
                    <el-select v-model="monitorDemoTime" class="mt-1 !w-[120px]">
                      <el-option
                        v-for="item in monitorTimeOptions"
                        :key="`${item.label}-${item.value}`"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </div>
                  <div class="h-8 w-px bg-slate-200"></div>
                  <div class="min-w-[140px]">
                    <div class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">最新刷新</div>
                    <div class="mt-1 text-base font-semibold text-slate-900">{{ monitorLastRefresh }}</div>
                  </div>
                  <div class="h-8 w-px bg-slate-200"></div>
                  <div class="min-w-[150px]">
                    <div class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">自动刷新</div>
                    <div class="mt-1 text-base font-semibold text-slate-900">{{ monitorCountdown }} 秒后刷新</div>
                  </div>
                  <el-button
                    type="primary"
                    :icon="Refresh"
                    class="!ml-auto !rounded-lg !px-4"
                    @click="manualRefreshMonitor"
                  >
                    立即刷新
                  </el-button>
                </div>
              </div>
            </div>

            <div
              v-for="summary in areaMonitorSummaries"
              :key="summary.area"
              class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
            >
              <button
                type="button"
                class="flex w-full items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/70 px-5 py-4 text-left transition-colors hover:bg-slate-100"
                @click="toggleMonitorArea(summary.area)"
              >
                <div class="flex min-w-0 items-center gap-4">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
                    {{ summary.area.replace('区', '') }}
                  </div>
                  <div class="min-w-0">
                    <div class="text-base font-semibold text-slate-900">{{ summary.area }}</div>
                    <div class="mt-1 text-xs text-slate-500">展开查看该区各商家订单与餐品份数</div>
                  </div>
                </div>

                <div class="hidden flex-1 items-center justify-end gap-2 xl:flex">
                  <div
                    v-for="column in monitorColumns"
                    :key="column.key"
                    class="min-w-[124px] px-3 py-1.5 text-left"
                  >
                    <div class="truncate text-[11px] font-semibold text-slate-400">{{ column.label }}</div>
                    <div class="mt-1 flex items-baseline gap-1.5">
                      <span
                        class="text-sm font-bold"
                        :class="isMetricChanged(summary.area, column.key, 'orders') ? 'text-rose-600' : 'text-slate-900'"
                      >
                        {{ summary.totals[column.key].orders }}
                      </span>
                      <span class="text-xs text-slate-400">单</span>
                    </div>
                    <div class="mt-0.5 text-xs">
                      <span
                        class="font-semibold"
                        :class="isMetricChanged(summary.area, column.key, 'portions') ? 'text-rose-600' : 'text-slate-500'"
                      >
                        {{ summary.totals[column.key].portions }}份
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <span class="text-xs font-medium text-slate-400">{{ expandedMonitorAreas.includes(summary.area) ? '收起明细' : '展开商家' }}</span>
                  <el-icon
                    class="text-slate-400 transition-transform"
                    :class="expandedMonitorAreas.includes(summary.area) ? 'rotate-90' : ''"
                  >
                    <ArrowRight />
                  </el-icon>
                </div>
              </button>

              <div v-if="expandedMonitorAreas.includes(summary.area)" class="p-5">
                <div class="overflow-hidden rounded-xl border border-slate-200">
                  <div class="monitor-grid bg-slate-100 text-[12px] font-semibold text-slate-600">
                    <div class="border-r border-slate-200 px-4 py-3">商家</div>
                    <div
                      v-for="column in monitorColumns"
                      :key="column.key"
                      class="border-r border-slate-200 px-3 py-3 last:border-r-0"
                      :class="getMonitorColumnClasses(column.key)"
                    >
                      {{ column.label }}
                    </div>
                  </div>

                  <div
                    v-for="merchant in orderMonitorAreas.find((item) => item.area === summary.area)?.merchants || []"
                    :key="merchant.id"
                    class="monitor-grid border-t border-slate-200 bg-white text-sm"
                  >
                    <div class="border-r border-slate-200 px-4 py-4">
                      <div class="font-semibold text-slate-900">{{ merchant.name }}</div>
                      <div class="mt-1 text-xs text-slate-400">已支付未出单</div>
                    </div>
                    <div
                      v-for="column in monitorColumns"
                      :key="`${merchant.id}-${column.key}`"
                      class="border-r border-slate-200 px-3 py-4 last:border-r-0"
                      :class="getMonitorColumnClasses(column.key)"
                    >
                      <div class="flex items-end gap-1.5">
                        <span
                          class="text-lg font-bold leading-none"
                          :class="isMetricChanged(merchant.id, column.key, 'orders') ? 'text-rose-600' : 'text-slate-900'"
                        >
                          {{ merchant.metrics[column.key].orders }}
                        </span>
                        <span class="mb-0.5 text-[11px] text-slate-400">单</span>
                      </div>
                      <div class="mt-2 text-xs">
                        <span
                          class="font-semibold"
                          :class="isMetricChanged(merchant.id, column.key, 'portions') ? 'text-rose-600' : 'text-slate-500'"
                        >
                          {{ merchant.metrics[column.key].portions }}份
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="monitor-grid border-t border-slate-200 bg-slate-50 text-sm font-semibold">
                    <div class="border-r border-slate-200 px-4 py-3 text-slate-700">{{ summary.area }}小计</div>
                    <div
                      v-for="column in monitorColumns"
                      :key="`${summary.area}-${column.key}-summary`"
                      class="border-r border-slate-200 px-3 py-3 last:border-r-0"
                      :class="getMonitorColumnClasses(column.key)"
                    >
                      <div class="flex items-end gap-1.5">
                        <span
                          class="text-base font-bold"
                          :class="isMetricChanged(summary.area, column.key, 'orders') ? 'text-rose-600' : 'text-slate-900'"
                        >
                          {{ summary.totals[column.key].orders }}
                        </span>
                        <span class="text-[11px] text-slate-400">单</span>
                      </div>
                      <div class="mt-1 text-xs">
                        <span
                          class="font-semibold"
                          :class="isMetricChanged(summary.area, column.key, 'portions') ? 'text-rose-600' : 'text-slate-500'"
                        >
                          {{ summary.totals[column.key].portions }}份
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="配送员主责配置" name="staffScopeConfig">
          <div class="mb-5 space-y-4 rounded-xl bg-slate-50/50 p-4 ring-1 ring-slate-100">
            <div class="grid gap-3 lg:grid-cols-[auto_1fr]">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-xs font-medium text-slate-500">展区</span>
                <el-radio-group v-model="configFilter.area" size="small">
                  <el-radio-button label="">全部</el-radio-button>
                  <el-radio-button v-for="item in areas" :key="item" :label="item">{{ item }}</el-radio-button>
                </el-radio-group>
              </div>
              <div class="grid flex-1 gap-3 md:grid-cols-[auto_auto_1fr]">
                <div class="flex flex-wrap items-center gap-3">
                  <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">楼层</span>
                  <el-radio-group v-model="configFilter.floor" size="small">
                    <el-radio-button label="">全层</el-radio-button>
                    <el-radio-button v-for="item in configFloorOptions" :key="item" :label="item">{{ item }}</el-radio-button>
                  </el-radio-group>
                </div>
                <el-autocomplete
                  v-model="configFilter.hall"
                  :fetch-suggestions="suggestConfigHalls"
                  clearable
                  placeholder="快速定位展厅..."
                  class="w-full max-w-[200px]"
                />
                <el-select
                  v-model="configFilter.merchantKeyword"
                  filterable
                  remote
                  clearable
                  :remote-method="(query) => { configFilter.merchantKeyword = query }"
                  placeholder="商家联想选择器 (可输入名称/拼音)"
                  class="w-full max-w-[280px]"
                >
                  <el-option
                    v-for="item in merchantPool"
                    :key="item.id"
                    :label="item.name"
                    :value="item.name"
                  />
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-select>
              </div>
            </div>
          </div>

          <div class="grid gap-6 xl:grid-cols-[1fr]">
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between px-1">
                <div class="flex items-center gap-3">
                  <div class="text-sm font-semibold text-slate-800">配送员主责配置表</div>
                </div>
                <div class="flex gap-3">
                  <el-button 
                    type="primary" 
                    plain 
                    class="!rounded-md" 
                    :disabled="selectedConfigStaffIds.length === 0"
                    @click="openConfigHallDialog"
                  >
                    配置展厅点位
                  </el-button>
                  <el-button 
                    type="warning" 
                    plain 
                    class="!rounded-md" 
                    :disabled="selectedConfigStaffIds.length === 0"
                    @click="openConfigMerchantDialog"
                  >
                    配置责任商家
                  </el-button>
                </div>
              </div>
              <el-table 
                :data="configFilteredStaffList" 
                border 
                stripe 
                height="500" 
                class="!rounded-xl shadow-sm"
                @selection-change="onConfigStaffSelectionChange"
              >
                <el-table-column type="selection" width="45" :selectable="canConfigScope" />
                <el-table-column prop="name" label="姓名" width="100" />
                <el-table-column prop="mobile" label="手机号" width="125" />
                <el-table-column label="角色" width="120">
                  <template #default="scope">
                    <div class="flex flex-col gap-1 py-1">
                      <span v-for="role in scope.row.roles" :key="role" class="text-[11px] text-slate-500">{{ role === 'COURIER' ? '配送员' : role === 'SIGNER' ? '分拣签收员' : '配送主管' }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="主责展厅点位" min-width="200">
                  <template #default="scope">
                    <div class="flex flex-wrap gap-1 py-1">
                      <span v-for="hall in scope.row.scopeHalls" :key="hall" class="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                        {{ hall }}
                      </span>
                      <span v-if="scope.row.scopeHalls.length === 0" class="text-xs text-slate-400">未配置</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="主责商家" min-width="200">
                  <template #default="scope">
                    <div class="flex flex-wrap gap-1 py-1">
                      <span v-for="mName in getMerchantNames(scope.row.scopeMerchants)" :key="mName" class="inline-flex items-center rounded bg-orange-50 px-1.5 py-0.5 text-[11px] font-medium text-orange-700">
                        {{ mName }}
                      </span>
                      <span v-if="scope.row.scopeMerchants.length === 0" class="text-xs text-slate-400">未配置</span>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="点位-商家配置" name="pointMerchant">
          <div class="mb-5 space-y-4 rounded-xl bg-slate-50/50 p-4 ring-1 ring-slate-100">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div class="flex flex-wrap items-center gap-6">
                <div class="flex items-center gap-3">
                  <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">筛选展区</span>
                  <el-radio-group v-model="pmFilter.area" size="small">
                    <el-radio-button label="">全局</el-radio-button>
                    <el-radio-button v-for="item in areas" :key="item" :label="item">{{ item }}</el-radio-button>
                  </el-radio-group>
                </div>
                <!-- 楼层联动筛选 -->
                <div class="flex items-center gap-3" v-if="pmFloorOptions.length > 0">
                  <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">楼层</span>
                  <el-radio-group v-model="pmFilter.floor" size="small">
                    <el-radio-button label="">全部</el-radio-button>
                    <el-radio-button v-for="item in pmFloorOptions" :key="item" :label="item">{{ item }}</el-radio-button>
                  </el-radio-group>
                </div>
              </div>
              <div class="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-1.5 text-xs text-orange-700 ring-1 ring-inset ring-orange-600/20">
                <el-icon><Warning /></el-icon>
                <span>此处展厅点位排期仅能选择此处配置的对应商家。</span>
              </div>
            </div>
          </div>
          <el-table :data="filteredMappings" border stripe class="!rounded-xl shadow-sm">
            <el-table-column prop="area" label="物理大区" width="90" />
            <el-table-column prop="floor" label="楼层" width="90" />
            <el-table-column prop="hall" label="具体厅馆" min-width="170" />
            <el-table-column label="供给商家池" min-width="280">
              <template #default="scope">
                <div class="flex flex-wrap gap-1.5 py-1">
                  <span
                    v-for="name in getMerchantNames(scope.row.merchantIds)"
                    :key="name"
                    class="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                  >
                    {{ name }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="scope">
                <el-button size="small" type="primary" plain @click="openMappingDialog(scope.row)" class="!rounded-md">配置</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="配送员名册" name="staff">
          <div class="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50/50 p-4 ring-1 ring-slate-100">
            <div class="flex items-center gap-4 flex-wrap">
              <el-input v-model="staffKeyword" placeholder="搜姓名/手机号" clearable class="!w-[280px]" >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <div class="flex items-center gap-3 border-l border-slate-200 pl-4">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">角色快筛</span>
                <el-radio-group v-model="staffRoleFilter" size="small">
                  <el-radio-button label="">全部</el-radio-button>
                  <el-radio-button label="COURIER">配送员</el-radio-button>
                  <el-radio-button label="SIGNER">分拣签收员</el-radio-button>
                  <el-radio-button label="SUPERVISOR">配送主管</el-radio-button>
                </el-radio-group>
              </div>
              <div class="flex items-center gap-3 border-l border-slate-200 pl-4">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">帐号状态</span>
                <el-radio-group v-model="staffStatusFilter" size="small">
                  <el-radio-button label="">全部</el-radio-button>
                  <el-radio-button label="ACTIVE">启用</el-radio-button>
                  <el-radio-button label="INACTIVE">停用</el-radio-button>
                </el-radio-group>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-sm text-slate-500">目前检索到 <strong class="text-slate-900">{{ filteredStaffList.length }}</strong> 名</span>
              <el-button type="primary" class="!rounded-lg !px-5 shadow-sm" @click="openAddStaffDialog">录入新成员</el-button>
            </div>
          </div>

          <el-table :data="filteredStaffList" border stripe class="!rounded-xl shadow-sm">
            <el-table-column prop="name" label="姓名" width="110" class-name="font-medium" />
            <el-table-column prop="mobile" label="注册手机" width="140" />
            <el-table-column label="当前角色" width="260" show-overflow-tooltip>
              <template #default="scope">
                <div class="flex items-center gap-1.5 py-1 overflow-hidden whitespace-nowrap">
                  <span
                    v-for="role in scope.row.roles"
                    :key="role"
                    class="inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap"
                    :class="{
                      'bg-blue-50 text-blue-700 ring-blue-700/10': role === 'COURIER',
                      'bg-emerald-50 text-emerald-700 ring-emerald-600/20': role === 'SIGNER',
                      'bg-purple-50 text-purple-700 ring-purple-600/20': role === 'SUPERVISOR'
                    }"
                  >
                    {{ role === 'COURIER' ? '配送员' : role === 'SIGNER' ? '分拣签收员' : '配送主管' }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="帐号状态" width="110">
              <template #default="scope">
                <span
                  class="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="scope.row.status === 'ACTIVE' ? 'bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/20' : 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/10'"
                >
                  {{ scope.row.status === 'ACTIVE' ? '启用' : '停用' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="updatedAt" label="最后变更线" width="160" class-name="text-slate-500 text-sm" />
            <el-table-column label="操作" min-width="160" fixed="right">
              <template #default="scope">
                 <div class="flex gap-1 items-center">
                   <el-button type="primary" link @click="openRoleDialog(scope.row)" class="!font-medium text-xs">配置角色</el-button>
                   <el-divider direction="vertical" class="opacity-50" />
                   <el-button :type="scope.row.status === 'ACTIVE' ? 'warning' : 'primary'" link @click="toggleStaffStatus(scope.row)" class="!font-medium text-xs">
                     {{ scope.row.status === 'ACTIVE' ? '停用' : '恢复' }}
                   </el-button>
                 </div>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <DocViewer :title="currentDocBundle.title" :docs="currentDocBundle.docs" />

    <el-dialog v-model="mappingDialogVisible" title="配置点位商家映射" width="560px">
      <el-form label-position="top">
        <el-form-item label="当前配置点位">
          <div class="text-base font-semibold text-slate-800 tracking-wide pb-1">
            {{ mappingForm.area }} / {{ mappingForm.floor }} / {{ mappingForm.hall }}
          </div>
        </el-form-item>
        <el-form-item label="商家池选择（多选）">
          <!-- 追加独立已选区域 -->
          <div v-if="selectedMerchantsDocs.length > 0" class="mb-3 w-full rounded-lg bg-orange-50/50 p-3 ring-1 ring-inset ring-orange-600/10">
            <div class="mb-2 text-xs font-semibold text-orange-800">已选商家 ({{ selectedMerchantsDocs.length }})</div>
            <div class="max-h-[84px] overflow-y-auto pr-1">
              <div class="flex flex-wrap gap-2">
                <el-tag 
                  v-for="merchant in selectedMerchantsDocs" 
                  :key="merchant.id"
                  closable
                  type="primary"
                  effect="light"
                  class="!border-blue-200 !bg-white !text-blue-700 shadow-sm"
                  @close="removeSelectedMerchant(merchant.id)"
                >
                  {{ merchant.name }}
                </el-tag>
              </div>
            </div>
          </div>
          
          <el-input 
            v-model="mappingMerchantKeyword" 
            placeholder="快捷过滤商家 (例如: 肯德基或A区)" 
            clearable 
            class="mb-3"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <div class="max-h-[220px] overflow-auto rounded-lg border border-slate-200 p-3 shadow-inner bg-slate-50 w-full relative">
            <el-checkbox-group v-model="mappingForm.merchantIds" class="grid grid-cols-2 gap-2">
              <el-checkbox v-for="item in filteredMerchantPool" :key="item.id" :label="item.id" class="!w-full">
                {{ item.name }}
              </el-checkbox>
            </el-checkbox-group>
            <div v-if="filteredMerchantPool.length === 0" class="text-sm text-center text-slate-400 py-4">
              未找到匹配的商家
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="mappingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveMapping">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="staffDialogVisible" title="新增配送员" width="420px">
      <el-form label-position="top">
        <el-form-item label="姓名">
          <el-input v-model="addStaffForm.name" maxlength="20" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="addStaffForm.mobile" maxlength="11" placeholder="请输入手机号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="staffDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addStaff">确定新增</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="roleDialogVisible" title="配置人员角色" width="480px">
      <div class="mb-4 rounded-lg bg-blue-50 p-3 text-xs leading-relaxed text-blue-800 ring-1 ring-inset ring-blue-600/20">
        <strong class="font-semibold">角色分配规则：</strong><br/>
        1. 必须至少保留一个角色。<br/>
        2. 【配送主管】可兼任多个角色。
      </div>
      <el-form label-position="top">
        <el-form-item label="人员">
          <div class="rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 ring-1 ring-inset ring-slate-200/50 w-full">{{ staffList.find(s => s.id === roleForm.staffId)?.name || '' }}</div>
        </el-form-item>
        <el-form-item label="赋予角色">
          <el-checkbox-group v-model="roleForm.roles" class="flex flex-col gap-3 w-full">
            <el-checkbox label="COURIER" class="!mr-0 !h-auto !items-start rounded-xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-all bg-white data-[checked=true]:border-blue-500 data-[checked=true]:bg-blue-50/30">
              <div class="flex flex-col gap-1.5 ml-1">
                <span class="font-semibold text-slate-800">配送员</span>
                <span class="text-xs text-slate-500 font-normal whitespace-normal leading-relaxed w-full">负责将餐品从商家配送到集散地，从集散地配送到展位。</span>
              </div>
            </el-checkbox>
            <el-checkbox label="SIGNER" class="!mr-0 !h-auto !items-start rounded-xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-all bg-white data-[checked=true]:border-blue-500 data-[checked=true]:bg-blue-50/30">
              <div class="flex flex-col gap-1.5 ml-1">
                <span class="font-semibold text-slate-800">分拣签收员</span>
                <span class="text-xs text-slate-500 font-normal whitespace-normal leading-relaxed w-full">负责在集散地签收餐品并按展厅分拣餐品。</span>
              </div>
            </el-checkbox>
            <el-checkbox label="SUPERVISOR" class="!mr-0 !h-auto !items-start rounded-xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-all bg-white data-[checked=true]:border-blue-500 data-[checked=true]:bg-blue-50/30">
              <div class="flex flex-col gap-1.5 ml-1">
                <span class="font-semibold text-slate-800">配送主管</span>
                <span class="text-xs text-slate-500 font-normal whitespace-normal leading-relaxed w-full">负责关注配送。</span>
              </div>
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRoles">确认配置</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="configHallDialogVisible" title="配置关联展厅" width="540px" top="5vh" destroy-on-close>
      <div class="text-xs text-slate-500 mb-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100 leading-relaxed flex items-center justify-between gap-4">
        <span>此操作将全量覆盖选中人员的责任展厅点位，<span class="font-bold text-red-600">原有配置将被清空并替换</span>，请谨慎操作。</span>
        <el-button type="primary" link @click="unassignedHallsVisible = true" class="shrink-0 flex items-center !h-auto !p-0">
          <span class="font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-500">查询展厅点位人员配置</span>
        </el-button>
      </div>
      <div class="grid gap-5 mb-2 border rounded-xl p-4 bg-slate-50/50">
        <div>
          <div class="mb-3 text-[13px] font-semibold text-slate-800 flex items-center gap-2">1. 筛选展区</div>
          <el-radio-group v-model="configHallForm.areaFilter" class="flex flex-wrap gap-x-4 gap-y-2">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button v-for="item in areas" :key="item" :label="item">{{ item }}</el-radio-button>
          </el-radio-group>
        </div>
        <div v-show="configHallForm.areaFilter">
          <div class="mb-3 text-[13px] font-semibold text-slate-800 flex items-center gap-2">2. 筛选楼层 (可选)</div>
          <el-radio-group v-model="configHallForm.floorFilter" class="flex flex-wrap gap-x-4 gap-y-2">
            <el-radio-button label="">全层</el-radio-button>
            <el-radio-button v-for="item in configFormFloorOptions" :key="item" :label="item">{{ item }}</el-radio-button>
          </el-radio-group>
        </div>
        <el-divider class="!my-2" />
        <div>
          <div class="mb-3 text-[13px] font-semibold text-slate-800 flex items-center justify-between">
            <span>3. 勾选需要指派的具体展厅</span>
            <el-button type="primary" link @click="selectAllHalls" class="!font-medium" style="padding: 0; min-height: auto;">全选</el-button>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-4 max-h-[220px] overflow-auto">
            <el-checkbox-group v-model="configHallForm.halls" class="grid grid-cols-2 gap-2">
              <el-checkbox v-for="item in configFormHallOptions" :key="item.value" :label="item.value" class="!w-full">
                {{ item.hallName }}
              </el-checkbox>
            </el-checkbox-group>
            <div v-if="configFormHallOptions.length === 0" class="text-sm text-center text-slate-400 py-4">
              请先在上方进行区层过滤筛选
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="configHallDialogVisible = false">取消</el-button>
        <el-button type="primary" color="#b42318" @click="submitConfigHall">确定指派展厅</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="unassignedHallsVisible" title="展厅点位人员配置分布" width="540px">
      <div class="text-xs text-slate-500 mb-3">展示所有展厅点位的当前主责责任人数。（按无配置人员优先排序）</div>
      <div class="max-h-[400px] overflow-auto border rounded bg-slate-50 p-2">
        <ul class="space-y-1">
          <li v-for="hall in unassignedHallsList" :key="hall.name" class="text-sm px-3 py-2 bg-white rounded border border-slate-200 text-slate-700 font-medium flex justify-between items-center group hover:bg-slate-100 transition-colors">
            <span>{{ hall.name.replace(/\|/g, ' / ') }}</span>
            <span class="text-xs ml-2 px-2 py-0.5 rounded" :class="hall.count > 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600 font-bold'">已配 {{ hall.count }} 人</span>
          </li>
        </ul>
      </div>
    </el-dialog>

    <el-dialog v-model="unassignedMerchantsVisible" title="商家人员配置分布" width="540px">
      <div class="text-xs text-slate-500 mb-3">展示所有商家的当前主责责任人数。（按无配置人员优先排序）</div>
      <div class="max-h-[400px] overflow-auto border rounded bg-slate-50 p-2">
        <ul class="space-y-1">
          <li v-for="merchant in unassignedMerchantsList" :key="merchant.id" class="text-sm px-3 py-2 bg-white rounded border border-slate-200 text-slate-700 font-medium flex justify-between items-center group hover:bg-slate-100 transition-colors">
            <div>
              <span>{{ merchant.name }}</span>
              <span class="text-xs text-slate-400 ml-2">({{ merchant.area }})</span>
            </div>
            <span class="text-xs ml-2 px-2 py-0.5 rounded" :class="merchant.count > 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600 font-bold'">已配 {{ merchant.count }} 人</span>
          </li>
        </ul>
      </div>
    </el-dialog>

    <el-dialog v-model="configMerchantDialogVisible" title="批量配置责任商家" width="560px">
      <div class="mb-4 text-xs text-slate-500 bg-blue-50/50 p-3 rounded-lg border border-blue-100 leading-relaxed">
        此操作将全量覆盖选中人员的责任商家，<span class="font-bold text-red-600">原有配置将被清空并替换</span>，请谨慎操作。商家列表包含此前由运营配置的全局商户。
      </div>
      <el-form label-position="top">
        <el-form-item>
          <template #label>
            <div class="flex items-center justify-between w-full">
              <span>责任商家池选择（联想推荐多选）</span>
              <el-button type="primary" link @click="unassignedMerchantsVisible = true" class="shrink-0 flex items-center !h-auto !p-0">
                <span class="font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-500">查询商家人员配置</span>
              </el-button>
            </div>
          </template>
          <!-- 追加独立已选区域 -->
          <div v-if="configSelectedMerchantsDocs.length > 0" class="mb-3 w-full rounded-lg bg-orange-50/50 p-3 ring-1 ring-inset ring-orange-600/10">
            <div class="mb-2 text-xs font-semibold text-orange-800">已选商家 ({{ configSelectedMerchantsDocs.length }})</div>
            <div class="max-h-[84px] overflow-y-auto pr-1">
              <div class="flex flex-wrap gap-2">
                <el-tag 
                  v-for="merchant in configSelectedMerchantsDocs" 
                  :key="merchant.id"
                  closable
                  type="primary"
                  effect="light"
                  class="!border-orange-200 !bg-white !text-orange-700 shadow-sm"
                  @close="removeConfigSelectedMerchant(merchant.id)"
                >
                  {{ merchant.name }}
                </el-tag>
              </div>
            </div>
          </div>
          
          <el-input 
            v-model="configMerchantForm.keyword" 
            placeholder="快捷过滤全局商家 (例如: 肯德基或A区)" 
            clearable 
            class="mb-3"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <div class="max-h-[220px] overflow-auto rounded-lg border border-slate-200 p-3 shadow-inner bg-slate-50 w-full relative">
            <el-checkbox-group v-model="configMerchantForm.merchantIds" class="grid grid-cols-2 gap-2">
              <el-checkbox v-for="item in configMerchantFilteredPool" :key="item.id" :label="item.id" class="!w-full">
                {{ item.name }}
              </el-checkbox>
            </el-checkbox-group>
            <div v-if="configMerchantFilteredPool.length === 0" class="text-sm text-center text-slate-400 py-4">
              未找到匹配的商家
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="configMerchantDialogVisible = false">取消</el-button>
        <el-button type="primary" color="#b42318" @click="submitConfigMerchant">执行覆盖</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.monitor-grid {
  display: grid;
  grid-template-columns: minmax(220px, 1.25fr) repeat(5, minmax(140px, 1fr));
}
</style>
