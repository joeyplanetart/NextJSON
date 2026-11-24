export type CompanySite = { code: string; id: number; url: string; icon: string }
export type SiteGroup = { title: string; description: string; icon: string; sites: CompanySite[] }

// URLs and IDs transcribed from the supplied company site list. Some regions intentionally share a URL.
export const companySiteGroups: SiteGroup[] = [
  { title: 'CafePress', description: 'CafePress 多区域站点', icon: '☕', sites: [
    { code: 'CPBUS', id: 169, url: 'https://www.cafepress.com/business', icon: '🇺🇸' },
    { code: 'CAFUS', id: 170, url: 'https://www.cafepress.com', icon: '🔬' },
    { code: 'CAFAU', id: 171, url: 'https://www.cafepress.com.au', icon: '🇦🇺' },
    { code: 'CAFUK', id: 172, url: 'https://www.cafepress.co.uk', icon: '🇬🇧' },
    { code: 'CAFCA', id: 173, url: 'https://www.cafepress.ca', icon: '🇨🇦' },
  ] },
  { title: '卡片 & 印刷', description: '贺卡、照片印刷、Canvas 业务', icon: '🃏', sites: [
    { code: 'STI', id: 1, url: 'https://www.simplytoimpress.com', icon: '💌' },
    { code: 'PA', id: 2, url: 'https://www.photoaffections.com', icon: '📷' },
    { code: 'CW', id: 3, url: 'https://www.canvasworld.com', icon: '🖼️' },
  ] },
  { title: '礼品 & 生活', description: '礼品、手机壳、个性化定制、装饰品类', icon: '🎁', sites: [
    { code: 'MCC', id: 6, url: 'https://www.mycustomcase.com', icon: '📱' },
    { code: 'LLANE', id: 160, url: 'https://www.legacylane.com', icon: '🛤️' },
    { code: 'GIFTS', id: 161, url: 'https://www.gifts.com', icon: '🎁' },
    { code: 'PKPIP', id: 162, url: 'https://www.parkerandpip.com', icon: '🐾' },
    { code: 'PCRUS', id: 163, url: 'https://www.personalcreations.com', icon: '🇺🇸' },
    { code: 'PCRUK', id: 164, url: 'https://www.personalcreations.com', icon: '🇬🇧' },
    { code: 'STKUS', id: 165, url: 'https://www.stockingshop.com', icon: '🧦' },
    { code: 'STKUK', id: 166, url: 'https://www.stockingshop.com', icon: '🇬🇧' },
    { code: 'ORNUS', id: 167, url: 'https://www.ornamentstreet.com', icon: '🎄' },
    { code: 'BAUUK', id: 168, url: 'https://www.baubles.co.uk', icon: '💎' },
  ] },
]

export const companySites = companySiteGroups.flatMap(group => group.sites)
