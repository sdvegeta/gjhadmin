export const locationTree = {
  A区: {
    '1F': [
      '1.1展厅', '1.1Y展厅', '2.1展厅', '2.1Y展厅', '3.1展厅', '3.1Y展厅',
      '4.0展厅', '4.1展厅', '4.1Y展厅', '5.0展厅', '5.1展厅', '5.1Y展厅',
      '6.0展厅', '6.1展厅', '7.1展厅', '8.0展厅-1', '8.0展厅-2', '8.0展厅-3', '8.1展厅'
    ],
    LF: ['A区会议厅', '新闻直播间', '1展厅', '2展厅', '3展厅', '4展厅', '5展厅', '6展厅', '7展厅', '8展厅'],
    '2F': ['1.2展厅', '2.2展厅', '3.2展厅', '4.2展厅', '5.2展厅']
  },
  B区: {
    '1F': ['9.1展厅', '10.1展厅', '11.1展厅', '12.1展厅', '13.1展厅'],
    M1: ['9.0展厅', '12.0展厅', '13.0展厅'],
    '2F': ['9.2展厅', '10.2展厅', '11.2展厅', '12.2展厅', '13.2展厅', 'B区会议厅'],
    '3F': ['9.3展厅', '10.3展厅', '11.3展厅']
  },
  C区: {
    '1F': ['C区会议厅', '14.1展厅', '15.1展厅'],
    '2F': ['14.2展厅', '15.2展厅', '16.2展厅'],
    '3F': ['14.3展厅', '15.3展厅', '16.3展厅'],
    '4F': ['14.4展厅', '15.4展厅', '16.4展厅']
  },
  D区: {
    '1F': ['D区-1F广交会堂', '17.1展厅', '18.1展厅', '19.1展厅', '20.1展厅'],
    LF: ['友谊大厅', '17展厅', '18展厅', '19展厅', '20展厅', '21.2展厅'],
    '2F': ['D区-2F广交会堂', '17.2展厅', '18.2展厅', '19.2展厅', '20.2展厅']
  }
}

const merchantByArea = {
  A区: ['真功夫', '麦当劳', '新大地餐饮', '宝相荟', '和府捞面', '遇见小面', '肯德基', '莱一煲', '赏一面'],
  B区: ['真功夫', '麦当劳', '新大地餐饮', '金成潮州酒楼', '白云机场航食', '湘庭里', '荟意', '莱一煲', '赏一面'],
  C区: ['真功夫', '麦当劳', '新大地餐饮', '白云机场航食', '赏一面'],
  D区: ['西海拾光', '蒸一味', '德克士', '肯德基', '新大地餐饮', '莱一煲', '赏一面']
}

const areaOrder = ['A区', 'B区', 'C区', 'D区']

export const areas = areaOrder

export const allFloors = Array.from(
  new Set(
    areaOrder.flatMap((area) => Object.keys(locationTree[area]))
  )
)

export const allHalls = areaOrder.flatMap((area) =>
  Object.entries(locationTree[area]).flatMap(([floor, halls]) =>
    halls.map((hall) => ({ area, floor, hall }))
  )
)

export const merchantPool = areaOrder.flatMap((area, aIndex) =>
  merchantByArea[area].map((name, mIndex) => ({
    id: `M${String(aIndex + 1)}${String(mIndex + 1).padStart(2, '0')}`,
    name: `${name}（${area}）`,
    area
  }))
)

const merchantIdsByArea = areaOrder.reduce((acc, area) => {
  acc[area] = merchantPool.filter((item) => item.area === area).map((item) => item.id)
  return acc
}, {})

export const hallDirectory = areaOrder.reduce((acc, area) => {
  Object.entries(locationTree[area]).forEach(([floor, halls]) => {
    acc[`${area}|${floor}`] = halls
  })
  return acc
}, {})

export const pointMerchantMappings = allHalls.map((item, idx) => {
  const areaIds = merchantIdsByArea[item.area]
  const len = areaIds.length
  const seed = idx % len
  const merchantIds = [
    areaIds[seed],
    areaIds[(seed + 1) % len],
    areaIds[(seed + 2) % len]
  ]

  return {
    id: `PM-${String(idx + 1).padStart(3, '0')}`,
    area: item.area,
    floor: item.floor,
    hall: item.hall,
    merchantIds
  }
})

export const statusStages = ['待接单', '赴集散', '在集散', '送展位', '已送达']
