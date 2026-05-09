import type { Region } from '../types/drivee'

export const REGIONS: Region[] = [
  {
    id: 'toshkent',
    nameUz: 'Toshkent',
    mode: 'zones',
    districts: [],
  },
  {
    id: 'samarkand',
    nameUz: 'Samarqand',
    mode: 'tuman_match',
    districts: [
      { id: 'samarkand-markaz', regionId: 'samarkand', nameUz: 'Markaz' },
      { id: 'samarkand-juma', regionId: 'samarkand', nameUz: 'Juma' },
      { id: 'samarkand-urgut', regionId: 'samarkand', nameUz: "Urgut" },
      { id: 'samarkand-kattaqorgon', regionId: 'samarkand', nameUz: "Kattaqo'rg'on" },
    ],
  },
  {
    id: 'fargona',
    nameUz: "Farg'ona",
    mode: 'tuman_match',
    districts: [
      { id: 'fargona-markaz', regionId: 'fargona', nameUz: 'Markaz' },
      { id: 'fargona-qoqon', regionId: 'fargona', nameUz: "Qo'qon" },
      { id: 'fargona-margilon', regionId: 'fargona', nameUz: "Marg'ilon" },
      { id: 'fargona-rishton', regionId: 'fargona', nameUz: 'Rishton' },
    ],
  },
  {
    id: 'buxoro',
    nameUz: 'Buxoro',
    mode: 'tuman_match',
    districts: [{ id: 'buxoro-markaz', regionId: 'buxoro', nameUz: 'Markaz' }],
  },
  {
    id: 'namangan',
    nameUz: 'Namangan',
    mode: 'tuman_match',
    districts: [{ id: 'namangan-markaz', regionId: 'namangan', nameUz: 'Markaz' }],
  },
  {
    id: 'andijon',
    nameUz: 'Andijon',
    mode: 'tuman_match',
    districts: [{ id: 'andijon-markaz', regionId: 'andijon', nameUz: 'Markaz' }],
  },
  {
    id: 'qashqadaryo',
    nameUz: 'Qashqadaryo',
    mode: 'tuman_match',
    districts: [{ id: 'qashqadaryo-markaz', regionId: 'qashqadaryo', nameUz: 'Markaz' }],
  },
]

export function getRegion(regionId: Region['id']) {
  return REGIONS.find((r) => r.id === regionId) ?? null
}

export function getDistrict(districtId: string) {
  for (const region of REGIONS) {
    const found = region.districts.find((d) => d.id === districtId)
    if (found) return found
  }
  return null
}

