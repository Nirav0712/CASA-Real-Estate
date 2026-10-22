'use client';

import * as React from 'react';
import {
  fetchLocations,
  fetchLocationChildren,
  LocationSearchParams,
} from '@/services/location-service';
import { LocationItem, LocationType } from '@/types';
import { useLanguage } from '@/contexts/language-context';
import {
  MapPin,
  Globe2,
  Building2,
  ChevronDown,
  Check,
  Search,
  X,
  RefreshCw,
} from 'lucide-react';

export interface SelectedLocationData {
  country?: string;
  countryName?: string;
  countryId?: string;
  state?: string;
  stateName?: string;
  stateId?: string;
  city?: string;
  cityName?: string;
  cityId?: string;
}

interface GlobalLocationSelectorProps {
  value?: SelectedLocationData;
  onChange?: (location: SelectedLocationData) => void;
  variant?: 'hero' | 'header' | 'compact' | 'stacked';
  className?: string;
}

// Global fallback dataset if backend locations API is cold/offline
const FALLBACK_COUNTRIES: Array<{ id: string; name: string; slug: string; code: string; localizedNames?: Record<string, string> }> = [
  { id: 'c-in', name: 'India', slug: 'india', code: 'IN', localizedNames: { en: 'India', hi: 'भारत', ar: 'الهند', ur: 'ہندوستان' } },
  { id: 'c-ae', name: 'United Arab Emirates', slug: 'united-arab-emirates', code: 'AE', localizedNames: { en: 'UAE / Dubai', ar: 'الإمارات', hi: 'दुबई (यूएई)' } },
  { id: 'c-us', name: 'United States', slug: 'united-states', code: 'US', localizedNames: { en: 'United States', hi: 'यूएसए' } },
  { id: 'c-gb', name: 'United Kingdom', slug: 'united-kingdom', code: 'GB', localizedNames: { en: 'United Kingdom (London)', hi: 'यूके' } },
];

const FALLBACK_STATES: Record<string, Array<{ id: string; name: string; slug: string; code: string }>> = {
  india: [
    { id: 's-ap', name: 'Andhra Pradesh', slug: 'andhra-pradesh', code: 'AP' },
    { id: 's-ar', name: 'Arunachal Pradesh', slug: 'arunachal-pradesh', code: 'AR' },
    { id: 's-as', name: 'Assam', slug: 'assam', code: 'AS' },
    { id: 's-br', name: 'Bihar', slug: 'bihar', code: 'BR' },
    { id: 's-cg', name: 'Chhattisgarh', slug: 'chhattisgarh', code: 'CG' },
    { id: 's-ga', name: 'Goa', slug: 'goa', code: 'GA' },
    { id: 's-gj', name: 'Gujarat', slug: 'gujarat', code: 'GJ' },
    { id: 's-hr', name: 'Haryana', slug: 'haryana', code: 'HR' },
    { id: 's-hp', name: 'Himachal Pradesh', slug: 'himachal-pradesh', code: 'HP' },
    { id: 's-jh', name: 'Jharkhand', slug: 'jharkhand', code: 'JH' },
    { id: 's-ka', name: 'Karnataka', slug: 'karnataka', code: 'KA' },
    { id: 's-kl', name: 'Kerala', slug: 'kerala', code: 'KL' },
    { id: 's-mp', name: 'Madhya Pradesh', slug: 'madhya-pradesh', code: 'MP' },
    { id: 's-mh', name: 'Maharashtra', slug: 'maharashtra', code: 'MH' },
    { id: 's-mn', name: 'Manipur', slug: 'manipur', code: 'MN' },
    { id: 's-ml', name: 'Meghalaya', slug: 'meghalaya', code: 'ML' },
    { id: 's-mz', name: 'Mizoram', slug: 'mizoram', code: 'MZ' },
    { id: 's-nl', name: 'Nagaland', slug: 'nagaland', code: 'NL' },
    { id: 's-or', name: 'Odisha', slug: 'odisha', code: 'OR' },
    { id: 's-pb', name: 'Punjab', slug: 'punjab', code: 'PB' },
    { id: 's-rj', name: 'Rajasthan', slug: 'rajasthan', code: 'RJ' },
    { id: 's-sk', name: 'Sikkim', slug: 'sikkim', code: 'SK' },
    { id: 's-tn', name: 'Tamil Nadu', slug: 'tamil-nadu', code: 'TN' },
    { id: 's-ts', name: 'Telangana', slug: 'telangana', code: 'TS' },
    { id: 's-tr', name: 'Tripura', slug: 'tripura', code: 'TR' },
    { id: 's-up', name: 'Uttar Pradesh', slug: 'uttar-pradesh', code: 'UP' },
    { id: 's-uk', name: 'Uttarakhand', slug: 'uttarakhand', code: 'UK' },
    { id: 's-wb', name: 'West Bengal', slug: 'west-bengal', code: 'WB' },
    // Union Territories (8)
    { id: 's-an', name: 'Andaman and Nicobar Islands', slug: 'andaman-and-nicobar-islands', code: 'AN' },
    { id: 's-ch', name: 'Chandigarh', slug: 'chandigarh', code: 'CH' },
    { id: 's-dn', name: 'Dadra and Nagar Haveli and Daman and Diu', slug: 'dadra-and-nagar-haveli-and-daman-and-diu', code: 'DN' },
    { id: 's-dl', name: 'Delhi NCR', slug: 'delhi-ncr', code: 'DL' },
    { id: 's-jk', name: 'Jammu and Kashmir', slug: 'jammu-and-kashmir', code: 'JK' },
    { id: 's-la', name: 'Ladakh', slug: 'ladakh', code: 'LA' },
    { id: 's-ld', name: 'Lakshadweep', slug: 'lakshadweep', code: 'LD' },
    { id: 's-py', name: 'Puducherry', slug: 'puducherry', code: 'PY' },
  ],
  'united-arab-emirates': [
    { id: 's-dxb', name: 'Dubai Emirate', slug: 'dubai-emirate', code: 'DXB' },
    { id: 's-auh', name: 'Abu Dhabi', slug: 'abu-dhabi-emirate', code: 'AUH' },
    { id: 's-shj', name: 'Sharjah', slug: 'sharjah', code: 'SHJ' },
    { id: 's-ajm', name: 'Ajman', slug: 'ajman', code: 'AJM' },
    { id: 's-rak', name: 'Ras Al Khaimah', slug: 'ras-al-khaimah', code: 'RAK' },
  ],
  'united-states': [
    { id: 's-ca', name: 'California', slug: 'california', code: 'CA' },
    { id: 's-ny', name: 'New York', slug: 'new-york-state', code: 'NY' },
    { id: 's-tx', name: 'Texas', slug: 'texas', code: 'TX' },
    { id: 's-fl', name: 'Florida', slug: 'florida', code: 'FL' },
  ],
  'united-kingdom': [
    { id: 's-eng', name: 'England', slug: 'england', code: 'ENG' },
    { id: 's-sct', name: 'Scotland', slug: 'scotland', code: 'SCT' },
    { id: 's-wls', name: 'Wales', slug: 'wales', code: 'WLS' },
  ],
};

const FALLBACK_CITIES: Record<string, Array<{ id: string; name: string; slug: string }>> = {
  // Andhra Pradesh
  'andhra-pradesh': [
    { id: 'ct-vzg', name: 'Visakhapatnam', slug: 'visakhapatnam' },
    { id: 'ct-vja', name: 'Vijayawada', slug: 'vijayawada' },
    { id: 'ct-gnt', name: 'Guntur', slug: 'guntur' },
    { id: 'ct-nel', name: 'Nellore', slug: 'nellore' },
    { id: 'ct-tpt', name: 'Tirupati', slug: 'tirupati' },
    { id: 'ct-knl', name: 'Kurnool', slug: 'kurnool' },
    { id: 'ct-rjy', name: 'Rajahmundry', slug: 'rajahmundry' },
    { id: 'ct-kkd', name: 'Kakinada', slug: 'kakinada' },
    { id: 'ct-amr', name: 'Amaravati', slug: 'amaravati' },
    { id: 'ct-kdp', name: 'Kadapa', slug: 'kadapa' },
    { id: 'ct-atp', name: 'Anantapur', slug: 'anantapur' },
  ],
  // Arunachal Pradesh
  'arunachal-pradesh': [
    { id: 'ct-ita', name: 'Itanagar', slug: 'itanagar' },
    { id: 'ct-nhl', name: 'Naharlagun', slug: 'naharlagun' },
    { id: 'ct-psg', name: 'Pasighat', slug: 'pasighat' },
    { id: 'ct-twg', name: 'Tawang', slug: 'tawang' },
    { id: 'ct-zir', name: 'Ziro', slug: 'ziro' },
  ],
  // Assam
  assam: [
    { id: 'ct-gah', name: 'Guwahati', slug: 'guwahati' },
    { id: 'ct-slc', name: 'Silchar', slug: 'silchar' },
    { id: 'ct-dbr', name: 'Dibrugarh', slug: 'dibrugarh' },
    { id: 'ct-jht', name: 'Jorhat', slug: 'jorhat' },
    { id: 'ct-ngn', name: 'Nagaon', slug: 'nagaon' },
    { id: 'ct-tsk', name: 'Tinsukia', slug: 'tinsukia' },
    { id: 'ct-tzp', name: 'Tezpur', slug: 'tezpur' },
  ],
  // Bihar
  bihar: [
    { id: 'ct-pat', name: 'Patna', slug: 'patna' },
    { id: 'ct-gay', name: 'Gaya', slug: 'gaya' },
    { id: 'ct-bgp', name: 'Bhagalpur', slug: 'bhagalpur' },
    { id: 'ct-muz', name: 'Muzaffarpur', slug: 'muzaffarpur' },
    { id: 'ct-purn', name: 'Purnia', slug: 'purnia' },
    { id: 'ct-dar', name: 'Darbhanga', slug: 'darbhanga' },
    { id: 'ct-bhr', name: 'Bihar Sharif', slug: 'bihar-sharif' },
    { id: 'ct-ara', name: 'Arrah', slug: 'arrah' },
  ],
  // Chhattisgarh
  chhattisgarh: [
    { id: 'ct-rpr', name: 'Raipur', slug: 'raipur' },
    { id: 'ct-bhl', name: 'Bhilai', slug: 'bhilai' },
    { id: 'ct-bsp', name: 'Bilaspur', slug: 'bilaspur' },
    { id: 'ct-krb', name: 'Korba', slug: 'korba' },
    { id: 'ct-drg', name: 'Durg', slug: 'durg' },
    { id: 'ct-rjn', name: 'Rajnandgaon', slug: 'rajnandgaon' },
  ],
  // Goa
  goa: [
    { id: 'ct-pnj', name: 'Panaji', slug: 'panaji' },
    { id: 'ct-mrg', name: 'Margao', slug: 'margao' },
    { id: 'ct-vsc', name: 'Vasco da Gama', slug: 'vasco-da-gama' },
    { id: 'ct-map', name: 'Mapusa', slug: 'mapusa' },
    { id: 'ct-pnd', name: 'Ponda', slug: 'ponda' },
    { id: 'ct-can', name: 'Candolim', slug: 'candolim' },
    { id: 'ct-clg', name: 'Calangute', slug: 'calangute' },
    { id: 'ct-prv', name: 'Porvorim', slug: 'porvorim' },
  ],
  // Gujarat
  gujarat: [
    { id: 'ct-ahm', name: 'Ahmedabad', slug: 'ahmedabad' },
    { id: 'ct-sur', name: 'Surat', slug: 'surat' },
    { id: 'ct-vad', name: 'Vadodara', slug: 'vadodara' },
    { id: 'ct-raj', name: 'Rajkot', slug: 'rajkot' },
    { id: 'ct-gnr', name: 'Gandhinagar', slug: 'gandhinagar' },
    { id: 'ct-bhav', name: 'Bhavnagar', slug: 'bhavnagar' },
    { id: 'ct-jam', name: 'Jamnagar', slug: 'jamnagar' },
    { id: 'ct-jun', name: 'Junagadh', slug: 'junagadh' },
    { id: 'ct-and', name: 'Anand', slug: 'anand' },
    { id: 'ct-bhc', name: 'Bharuch', slug: 'bharuch' },
    { id: 'ct-vapi', name: 'Vapi', slug: 'vapi' },
    { id: 'ct-nav', name: 'Navsari', slug: 'navsari' },
    { id: 'ct-mhs', name: 'Mehsana', slug: 'mehsana' },
    { id: 'ct-mrb', name: 'Morbi', slug: 'morbi' },
  ],
  // Haryana
  haryana: [
    { id: 'ct-ggn', name: 'Gurugram', slug: 'gurugram' },
    { id: 'ct-fbd', name: 'Faridabad', slug: 'faridabad' },
    { id: 'ct-pnp', name: 'Panipat', slug: 'panipat' },
    { id: 'ct-amb', name: 'Ambala', slug: 'ambala' },
    { id: 'ct-knl-hr', name: 'Karnal', slug: 'karnal' },
    { id: 'ct-rtk', name: 'Rohtak', slug: 'rohtak' },
    { id: 'ct-hsr', name: 'Hisar', slug: 'hisar' },
    { id: 'ct-spt', name: 'Sonipat', slug: 'sonipat' },
    { id: 'ct-pck', name: 'Panchkula', slug: 'panchkula' },
    { id: 'ct-bhg', name: 'Bahadurgarh', slug: 'bahadurgarh' },
  ],
  // Himachal Pradesh
  'himachal-pradesh': [
    { id: 'ct-sml', name: 'Shimla', slug: 'shimla' },
    { id: 'ct-dhs', name: 'Dharamshala', slug: 'dharamshala' },
    { id: 'ct-sln', name: 'Solan', slug: 'solan' },
    { id: 'ct-mnd', name: 'Mandi', slug: 'mandi' },
    { id: 'ct-kll', name: 'Kullu', slug: 'kullu' },
    { id: 'ct-mnl', name: 'Manali', slug: 'manali' },
    { id: 'ct-bdd', name: 'Baddi', slug: 'baddi' },
  ],
  // Jharkhand
  jharkhand: [
    { id: 'ct-rnc', name: 'Ranchi', slug: 'ranchi' },
    { id: 'ct-jsr', name: 'Jamshedpur', slug: 'jamshedpur' },
    { id: 'ct-dhn', name: 'Dhanbad', slug: 'dhanbad' },
    { id: 'ct-bkr', name: 'Bokaro Steel City', slug: 'bokaro-steel-city' },
    { id: 'ct-dgh', name: 'Deoghar', slug: 'deoghar' },
    { id: 'ct-hzb', name: 'Hazaribagh', slug: 'hazaribagh' },
  ],
  // Karnataka
  karnataka: [
    { id: 'ct-blr', name: 'Bengaluru', slug: 'bengaluru' },
    { id: 'ct-mys', name: 'Mysuru', slug: 'mysuru' },
    { id: 'ct-hub', name: 'Hubli-Dharwad', slug: 'hubli-dharwad' },
    { id: 'ct-mng', name: 'Mangalore', slug: 'mangalore' },
    { id: 'ct-blg', name: 'Belgaum', slug: 'belgaum' },
    { id: 'ct-glb', name: 'Gulbarga', slug: 'gulbarga' },
    { id: 'ct-dvn', name: 'Davanagere', slug: 'davanagere' },
    { id: 'ct-bly', name: 'Bellary', slug: 'bellary' },
    { id: 'ct-smg', name: 'Shimoga', slug: 'shimoga' },
    { id: 'ct-tmk', name: 'Tumkur', slug: 'tumkur' },
    { id: 'ct-udp', name: 'Udupi', slug: 'udupi' },
  ],
  // Kerala
  kerala: [
    { id: 'ct-koc', name: 'Kochi', slug: 'kochi' },
    { id: 'ct-trv', name: 'Thiruvananthapuram', slug: 'thiruvananthapuram' },
    { id: 'ct-clt', name: 'Kozhikode', slug: 'kozhikode' },
    { id: 'ct-tsr', name: 'Thrissur', slug: 'thrissur' },
    { id: 'ct-klm', name: 'Kollam', slug: 'kollam' },
    { id: 'ct-plk', name: 'Palakkad', slug: 'palakkad' },
    { id: 'ct-alp', name: 'Alappuzha', slug: 'alappuzha' },
    { id: 'ct-knr', name: 'Kannur', slug: 'kannur' },
    { id: 'ct-ktm', name: 'Kottayam', slug: 'kottayam' },
  ],
  // Madhya Pradesh
  'madhya-pradesh': [
    { id: 'ct-ind', name: 'Indore', slug: 'indore' },
    { id: 'ct-bpl', name: 'Bhopal', slug: 'bhopal' },
    { id: 'ct-jbl', name: 'Jabalpur', slug: 'jabalpur' },
    { id: 'ct-gwl', name: 'Gwalior', slug: 'gwalior' },
    { id: 'ct-ujn', name: 'Ujjain', slug: 'ujjain' },
    { id: 'ct-sgr', name: 'Sagar', slug: 'sagar' },
    { id: 'ct-dws', name: 'Dewas', slug: 'dewas' },
    { id: 'ct-stn', name: 'Satna', slug: 'satna' },
    { id: 'ct-rtm', name: 'Ratlam', slug: 'ratlam' },
  ],
  // Maharashtra
  maharashtra: [
    { id: 'ct-mum', name: 'Mumbai', slug: 'mumbai' },
    { id: 'ct-pun', name: 'Pune', slug: 'pune' },
    { id: 'ct-nag', name: 'Nagpur', slug: 'nagpur' },
    { id: 'ct-tha', name: 'Thane', slug: 'thane' },
    { id: 'ct-nvm', name: 'Navi Mumbai', slug: 'navi-mumbai' },
    { id: 'ct-nsk', name: 'Nashik', slug: 'nashik' },
    { id: 'ct-aur', name: 'Aurangabad (Chhatrapati Sambhajinagar)', slug: 'aurangabad' },
    { id: 'ct-slp', name: 'Solapur', slug: 'solapur' },
    { id: 'ct-kop', name: 'Kolhapur', slug: 'kolhapur' },
    { id: 'ct-kly', name: 'Kalyan-Dombivli', slug: 'kalyan-dombivli' },
    { id: 'ct-vsv', name: 'Vasai-Virar', slug: 'vasai-virar' },
    { id: 'ct-pmc', name: 'Pimpri-Chinchwad', slug: 'pimpri-chinchwad' },
    { id: 'ct-amv', name: 'Amravati', slug: 'amravati' },
  ],
  // Manipur
  manipur: [
    { id: 'ct-imp', name: 'Imphal', slug: 'imphal' },
    { id: 'ct-thb', name: 'Thoubal', slug: 'thoubal' },
    { id: 'ct-bsp-mn', name: 'Bishnupur', slug: 'bishnupur' },
    { id: 'ct-ccp', name: 'Churachandpur', slug: 'churachandpur' },
  ],
  // Meghalaya
  meghalaya: [
    { id: 'ct-shl', name: 'Shillong', slug: 'shillong' },
    { id: 'ct-tur', name: 'Tura', slug: 'tura' },
    { id: 'ct-jow', name: 'Jowai', slug: 'jowai' },
    { id: 'ct-ngp', name: 'Nongpoh', slug: 'nongpoh' },
  ],
  // Mizoram
  mizoram: [
    { id: 'ct-azl', name: 'Aizawl', slug: 'aizawl' },
    { id: 'ct-lng', name: 'Lunglei', slug: 'lunglei' },
    { id: 'ct-cmp', name: 'Champhai', slug: 'champhai' },
    { id: 'ct-src', name: 'Serchhip', slug: 'serchhip' },
  ],
  // Nagaland
  nagaland: [
    { id: 'ct-khm', name: 'Kohima', slug: 'kohima' },
    { id: 'ct-dmp', name: 'Dimapur', slug: 'dimapur' },
    { id: 'ct-mkc', name: 'Mokokchung', slug: 'mokokchung' },
    { id: 'ct-tsg', name: 'Tuensang', slug: 'tuensang' },
  ],
  // Odisha
  odisha: [
    { id: 'ct-bbs', name: 'Bhubaneswar', slug: 'bhubaneswar' },
    { id: 'ct-ctk', name: 'Cuttack', slug: 'cuttack' },
    { id: 'ct-rkl', name: 'Rourkela', slug: 'rourkela' },
    { id: 'ct-bmp', name: 'Berhampur', slug: 'berhampur' },
    { id: 'ct-sbp', name: 'Sambalpur', slug: 'sambalpur' },
    { id: 'ct-pri', name: 'Puri', slug: 'puri' },
    { id: 'ct-bls', name: 'Balasore', slug: 'balasore' },
  ],
  // Punjab
  punjab: [
    { id: 'ct-ldh', name: 'Ludhiana', slug: 'ludhiana' },
    { id: 'ct-asr', name: 'Amritsar', slug: 'amritsar' },
    { id: 'ct-jld', name: 'Jalandhar', slug: 'jalandhar' },
    { id: 'ct-ptl', name: 'Patiala', slug: 'patiala' },
    { id: 'ct-btd', name: 'Bathinda', slug: 'bathinda' },
    { id: 'ct-mhl', name: 'Mohali (SAS Nagar)', slug: 'mohali' },
    { id: 'ct-hsp', name: 'Hoshiarpur', slug: 'hoshiarpur' },
    { id: 'ct-ptk', name: 'Pathankot', slug: 'pathankot' },
    { id: 'ct-zkp', name: 'Zirakpur', slug: 'zirakpur' },
  ],
  // Rajasthan
  rajasthan: [
    { id: 'ct-jpr', name: 'Jaipur', slug: 'jaipur' },
    { id: 'ct-jdh', name: 'Jodhpur', slug: 'jodhpur' },
    { id: 'ct-kta', name: 'Kota', slug: 'kota' },
    { id: 'ct-udp-rj', name: 'Udaipur', slug: 'udaipur' },
    { id: 'ct-bkn', name: 'Bikaner', slug: 'bikaner' },
    { id: 'ct-ajm-rj', name: 'Ajmer', slug: 'ajmer' },
    { id: 'ct-blw', name: 'Bhilwara', slug: 'bhilwara' },
    { id: 'ct-alw', name: 'Alwar', slug: 'alwar' },
    { id: 'ct-skr', name: 'Sikar', slug: 'sikar' },
    { id: 'ct-bwd', name: 'Bhiwadi', slug: 'bhiwadi' },
  ],
  // Sikkim
  sikkim: [
    { id: 'ct-gtk', name: 'Gangtok', slug: 'gangtok' },
    { id: 'ct-nmc', name: 'Namchi', slug: 'namchi' },
    { id: 'ct-gyz', name: 'Geyzing', slug: 'geyzing' },
    { id: 'ct-mgn', name: 'Mangan', slug: 'mangan' },
  ],
  // Tamil Nadu
  'tamil-nadu': [
    { id: 'ct-che', name: 'Chennai', slug: 'chennai' },
    { id: 'ct-cbe', name: 'Coimbatore', slug: 'coimbatore' },
    { id: 'ct-mdu', name: 'Madurai', slug: 'madurai' },
    { id: 'ct-trc', name: 'Tiruchirappalli', slug: 'tiruchirappalli' },
    { id: 'ct-slm', name: 'Salem', slug: 'salem' },
    { id: 'ct-tpr', name: 'Tiruppur', slug: 'tiruppur' },
    { id: 'ct-erd', name: 'Erode', slug: 'erode' },
    { id: 'ct-tnv', name: 'Tirunelveli', slug: 'tirunelveli' },
    { id: 'ct-vlr', name: 'Vellore', slug: 'vellore' },
    { id: 'ct-tht', name: 'Thoothukudi', slug: 'thoothukudi' },
    { id: 'ct-kpm', name: 'Kanchipuram', slug: 'kanchipuram' },
  ],
  // Telangana
  telangana: [
    { id: 'ct-hyd', name: 'Hyderabad', slug: 'hyderabad' },
    { id: 'ct-wgl', name: 'Warangal', slug: 'warangal' },
    { id: 'ct-nzb', name: 'Nizamabad', slug: 'nizamabad' },
    { id: 'ct-knr-ts', name: 'Karimnagar', slug: 'karimnagar' },
    { id: 'ct-kmm', name: 'Khammam', slug: 'khammam' },
    { id: 'ct-rmg', name: 'Ramagundam', slug: 'ramagundam' },
    { id: 'ct-mbn', name: 'Mahbubnagar', slug: 'mahbubnagar' },
    { id: 'ct-scb', name: 'Secunderabad', slug: 'secunderabad' },
  ],
  // Tripura
  tripura: [
    { id: 'ct-agt', name: 'Agartala', slug: 'agartala' },
    { id: 'ct-udp-tr', name: 'Udaipur (Tripura)', slug: 'udaipur-tripura' },
    { id: 'ct-dhn-tr', name: 'Dharmanagar', slug: 'dharmanagar' },
    { id: 'ct-kls', name: 'Kailashahar', slug: 'kailashahar' },
  ],
  // Uttar Pradesh
  'uttar-pradesh': [
    { id: 'ct-lko', name: 'Lucknow', slug: 'lucknow' },
    { id: 'ct-knp', name: 'Kanpur', slug: 'kanpur' },
    { id: 'ct-noida', name: 'Noida', slug: 'noida' },
    { id: 'ct-gnoida', name: 'Greater Noida', slug: 'greater-noida' },
    { id: 'ct-ghz', name: 'Ghaziabad', slug: 'ghaziabad' },
    { id: 'ct-vns', name: 'Varanasi', slug: 'varanasi' },
    { id: 'ct-agr', name: 'Agra', slug: 'agra' },
    { id: 'ct-pry', name: 'Prayagraj (Allahabad)', slug: 'prayagraj' },
    { id: 'ct-mrt', name: 'Meerut', slug: 'meerut' },
    { id: 'ct-brl', name: 'Bareilly', slug: 'bareilly' },
    { id: 'ct-alg', name: 'Aligarh', slug: 'aligarh' },
    { id: 'ct-mbd', name: 'Moradabad', slug: 'moradabad' },
    { id: 'ct-gkp', name: 'Gorakhpur', slug: 'gorakhpur' },
    { id: 'ct-ayd', name: 'Ayodhya', slug: 'ayodhya' },
    { id: 'ct-jhs', name: 'Jhansi', slug: 'jhansi' },
    { id: 'ct-mth', name: 'Mathura', slug: 'mathura' },
  ],
  // Uttarakhand
  uttarakhand: [
    { id: 'ct-ddn', name: 'Dehradun', slug: 'dehradun' },
    { id: 'ct-hwd', name: 'Haridwar', slug: 'haridwar' },
    { id: 'ct-rke', name: 'Roorkee', slug: 'roorkee' },
    { id: 'ct-hdw', name: 'Haldwani', slug: 'haldwani' },
    { id: 'ct-rsk', name: 'Rishikesh', slug: 'rishikesh' },
    { id: 'ct-ntl', name: 'Nainital', slug: 'nainital' },
    { id: 'ct-rdp', name: 'Rudrapur', slug: 'rudrapur' },
    { id: 'ct-msr', name: 'Mussoorie', slug: 'mussoorie' },
  ],
  // West Bengal
  'west-bengal': [
    { id: 'ct-kol', name: 'Kolkata', slug: 'kolkata' },
    { id: 'ct-hwh', name: 'Howrah', slug: 'howrah' },
    { id: 'ct-dgp', name: 'Durgapur', slug: 'durgapur' },
    { id: 'ct-asn', name: 'Asansol', slug: 'asansol' },
    { id: 'ct-slg', name: 'Siliguri', slug: 'siliguri' },
    { id: 'ct-bdn', name: 'Bardhaman', slug: 'bardhaman' },
    { id: 'ct-kgp', name: 'Kharagpur', slug: 'kharagpur' },
    { id: 'ct-ntw', name: 'New Town / Rajarhat', slug: 'new-town-rajarhat' },
  ],
  // Union Territories
  'andaman-and-nicobar-islands': [
    { id: 'ct-ptb', name: 'Port Blair', slug: 'port-blair' },
    { id: 'ct-hvl', name: 'Havelock Island', slug: 'havelock-island' },
    { id: 'ct-dgl', name: 'Diglipur', slug: 'diglipur' },
  ],
  chandigarh: [
    { id: 'ct-chd', name: 'Chandigarh City', slug: 'chandigarh-city' },
  ],
  'dadra-and-nagar-haveli-and-daman-and-diu': [
    { id: 'ct-dmn', name: 'Daman', slug: 'daman' },
    { id: 'ct-diu', name: 'Diu', slug: 'diu' },
    { id: 'ct-slv', name: 'Silvassa', slug: 'silvassa' },
  ],
  'delhi-ncr': [
    { id: 'ct-ndl', name: 'New Delhi', slug: 'new-delhi' },
    { id: 'ct-cdl', name: 'Central Delhi', slug: 'central-delhi' },
    { id: 'ct-sdl', name: 'South Delhi', slug: 'south-delhi' },
    { id: 'ct-ndl2', name: 'North Delhi', slug: 'north-delhi' },
    { id: 'ct-edl', name: 'East Delhi', slug: 'east-delhi' },
    { id: 'ct-wdl', name: 'West Delhi', slug: 'west-delhi' },
    { id: 'ct-dwk', name: 'Dwarka', slug: 'dwarka' },
    { id: 'ct-rhn', name: 'Rohini', slug: 'rohini' },
  ],
  'jammu-and-kashmir': [
    { id: 'ct-snr', name: 'Srinagar', slug: 'srinagar' },
    { id: 'ct-jmu', name: 'Jammu', slug: 'jammu' },
    { id: 'ct-ant', name: 'Anantnag', slug: 'anantnag' },
    { id: 'ct-brm', name: 'Baramulla', slug: 'baramulla' },
    { id: 'ct-udp-jk', name: 'Udhampur', slug: 'udhampur' },
    { id: 'ct-ktr', name: 'Katra', slug: 'katra' },
  ],
  ladakh: [
    { id: 'ct-leh', name: 'Leh', slug: 'leh' },
    { id: 'ct-kgl', name: 'Kargil', slug: 'kargil' },
  ],
  lakshadweep: [
    { id: 'ct-kvr', name: 'Kavaratti', slug: 'kavaratti' },
    { id: 'ct-agt-lk', name: 'Agatti', slug: 'agatti' },
  ],
  puducherry: [
    { id: 'ct-pdy', name: 'Puducherry City', slug: 'puducherry-city' },
    { id: 'ct-kkl', name: 'Karaikal', slug: 'karaikal' },
    { id: 'ct-mhe', name: 'Mahe', slug: 'mahe' },
    { id: 'ct-ynm', name: 'Yanam', slug: 'yanam' },
  ],
  // International markets
  'dubai-emirate': [
    { id: 'ct-dxb', name: 'Dubai City', slug: 'dubai' },
    { id: 'ct-downtown', name: 'Downtown Dubai', slug: 'downtown-dubai' },
    { id: 'ct-marina', name: 'Dubai Marina', slug: 'dubai-marina' },
    { id: 'ct-palm', name: 'Palm Jumeirah', slug: 'palm-jumeirah' },
    { id: 'ct-jlt', name: 'Jumeirah Lake Towers', slug: 'jlt' },
  ],
  'abu-dhabi-emirate': [
    { id: 'ct-auh', name: 'Abu Dhabi City', slug: 'abu-dhabi' },
    { id: 'ct-yas', name: 'Yas Island', slug: 'yas-island' },
    { id: 'ct-saadiyat', name: 'Saadiyat Island', slug: 'saadiyat-island' },
  ],
  sharjah: [
    { id: 'ct-shj-city', name: 'Sharjah City', slug: 'sharjah-city' },
    { id: 'ct-al-majaz', name: 'Al Majaz', slug: 'al-majaz' },
  ],
  ajman: [
    { id: 'ct-ajm-city', name: 'Ajman City', slug: 'ajman-city' },
  ],
  'ras-al-khaimah': [
    { id: 'ct-rak-city', name: 'Ras Al Khaimah City', slug: 'ras-al-khaimah-city' },
    { id: 'ct-marjan', name: 'Al Marjan Island', slug: 'al-marjan-island' },
  ],
  california: [
    { id: 'ct-sfo', name: 'San Francisco', slug: 'san-francisco' },
    { id: 'ct-la', name: 'Los Angeles', slug: 'los-angeles' },
    { id: 'ct-sd', name: 'San Diego', slug: 'san-diego' },
    { id: 'ct-sj', name: 'San Jose / Silicon Valley', slug: 'san-jose' },
  ],
  'new-york-state': [
    { id: 'ct-nyc', name: 'New York City', slug: 'new-york-city' },
    { id: 'ct-manhattan', name: 'Manhattan', slug: 'manhattan' },
    { id: 'ct-brooklyn', name: 'Brooklyn', slug: 'brooklyn' },
  ],
  texas: [
    { id: 'ct-atx', name: 'Austin', slug: 'austin' },
    { id: 'ct-dfw', name: 'Dallas', slug: 'dallas' },
    { id: 'ct-hou', name: 'Houston', slug: 'houston' },
  ],
  florida: [
    { id: 'ct-mia', name: 'Miami', slug: 'miami' },
    { id: 'ct-orl', name: 'Orlando', slug: 'orlando' },
    { id: 'ct-tpa', name: 'Tampa', slug: 'tampa' },
  ],
  england: [
    { id: 'ct-lon', name: 'London', slug: 'london' },
    { id: 'ct-man', name: 'Manchester', slug: 'manchester' },
    { id: 'ct-brm-uk', name: 'Birmingham', slug: 'birmingham' },
  ],
  scotland: [
    { id: 'ct-edn', name: 'Edinburgh', slug: 'edinburgh' },
    { id: 'ct-glw', name: 'Glasgow', slug: 'glasgow' },
  ],
  wales: [
    { id: 'ct-cdf', name: 'Cardiff', slug: 'cardiff' },
  ],
};

export function GlobalLocationSelector({
  value,
  onChange,
  variant = 'hero',
  className = '',
}: GlobalLocationSelectorProps) {
  const { locale, t } = useLanguage();

  // Internal state
  const [countries, setCountries] = React.useState<Array<{ id: string; name: string; slug: string; code?: string; localizedNames?: any }>>([]);
  const [states, setStates] = React.useState<Array<{ id: string; name: string; slug: string; code?: string }>>([]);
  const [cities, setCities] = React.useState<Array<{ id: string; name: string; slug: string }>>([]);

  const [selectedCountry, setSelectedCountry] = React.useState<string>(value?.country || 'india');
  const [selectedState, setSelectedState] = React.useState<string>(value?.state || 'all');
  const [selectedCity, setSelectedCity] = React.useState<string>(value?.city || 'all');

  const [loadingCountries, setLoadingCountries] = React.useState(false);
  const [loadingStates, setLoadingStates] = React.useState(false);
  const [loadingCities, setLoadingCities] = React.useState(false);

  // Sync with incoming value if changed
  React.useEffect(() => {
    if (value) {
      if (value.country && value.country !== selectedCountry) setSelectedCountry(value.country);
      if (value.state !== undefined && value.state !== selectedState) setSelectedState(value.state);
      if (value.city !== undefined && value.city !== selectedCity) setSelectedCity(value.city);
    }
  }, [value?.country, value?.state, value?.city]);

  // Deduplicate array by slug
  const dedupeBySlug = React.useCallback(<T extends { slug: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    const result: T[] = [];
    for (const item of items) {
      const key = (item.slug || '').toLowerCase().trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }
    return result;
  }, []);

  // Load countries on mount
  React.useEffect(() => {
    async function loadCountries() {
      setLoadingCountries(true);
      try {
        const data = await fetchLocations({ type: 'COUNTRY' });
        if (data && data.length > 0) {
          const raw = data.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            code: c.countryCode,
            localizedNames: c.localizedNames,
          }));
          setCountries(dedupeBySlug(raw));
        } else {
          setCountries(dedupeBySlug(FALLBACK_COUNTRIES));
        }
      } catch {
        setCountries(dedupeBySlug(FALLBACK_COUNTRIES));
      } finally {
        setLoadingCountries(false);
      }
    }
    loadCountries();
  }, [dedupeBySlug]);

  // Load states when country changes
  React.useEffect(() => {
    if (!selectedCountry || selectedCountry === 'all') {
      setStates([]);
      setSelectedState('all');
      setCities([]);
      setSelectedCity('all');
      return;
    }

    async function loadStates() {
      setLoadingStates(true);
      try {
        const countryObj = countries.find(
          (c) =>
            c.slug === selectedCountry ||
            c.name.toLowerCase() === selectedCountry.toLowerCase(),
        );
        const parentId = countryObj?.id;
        const countryCode = countryObj?.code || (selectedCountry === 'india' ? 'IN' : undefined);

        const data = await fetchLocations({
          type: 'STATE',
          parentId: parentId && !parentId.startsWith('c-') ? parentId : undefined,
          countryCode,
          limit: 200,
        });

        const fallback = FALLBACK_STATES[selectedCountry] || [];
        if (data && data.length > 0) {
          const raw = data.map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            code: s.stateCode,
          }));
          setStates(dedupeBySlug([...raw, ...fallback]));
        } else {
          setStates(dedupeBySlug(fallback));
        }
      } catch {
        const fallback = FALLBACK_STATES[selectedCountry] || [];
        setStates(dedupeBySlug(fallback));
      } finally {
        setLoadingStates(false);
      }
    }
    loadStates();
  }, [selectedCountry, countries, dedupeBySlug]);

  // Load cities when state changes
  React.useEffect(() => {
    if (!selectedState || selectedState === 'all') {
      // If no state selected but country is selected, offer top cities for fallback or empty
      const stateFallbackKeys = Object.keys(FALLBACK_CITIES);
      const matchingStateKey = stateFallbackKeys.find((k) => k.includes(selectedCountry));
      if (matchingStateKey) {
        setCities(dedupeBySlug(FALLBACK_CITIES[matchingStateKey] || []));
      } else {
        setCities([]);
      }
      setSelectedCity('all');
      return;
    }

    async function loadCities() {
      setLoadingCities(true);
      try {
        const stateObj = states.find(
          (s) =>
            s.slug === selectedState ||
            s.name.toLowerCase() === selectedState.toLowerCase(),
        );
        const parentId = stateObj?.id;
        const stateCode = stateObj?.code;

        const data = await fetchLocations({
          type: 'CITY',
          parentId: parentId && !parentId.startsWith('s-') ? parentId : undefined,
          stateCode,
          limit: 200,
        });

        const fallback = FALLBACK_CITIES[selectedState] || [];
        if (data && data.length > 0) {
          const raw = data.map((ct) => ({
            id: ct.id,
            name: ct.name,
            slug: ct.slug,
          }));
          setCities(dedupeBySlug([...raw, ...fallback]));
        } else {
          setCities(dedupeBySlug(fallback));
        }
      } catch {
        const fallback = FALLBACK_CITIES[selectedState] || [];
        setCities(dedupeBySlug(fallback));
      } finally {
        setLoadingCities(false);
      }
    }
    loadCities();
  }, [selectedState, states, selectedCountry, dedupeBySlug]);

  // Notify parent on change
  const notifyChange = (newCountry: string, newState: string, newCity: string) => {
    if (!onChange) return;
    const countryObj = countries.find((c) => c.slug === newCountry);
    const stateObj = states.find((s) => s.slug === newState);
    const cityObj = cities.find((ct) => ct.slug === newCity);

    onChange({
      country: newCountry !== 'all' ? newCountry : undefined,
      countryName: countryObj?.name,
      countryId: countryObj?.id,
      state: newState !== 'all' ? newState : undefined,
      stateName: stateObj?.name,
      stateId: stateObj?.id,
      city: newCity !== 'all' ? newCity : undefined,
      cityName: cityObj?.name,
      cityId: cityObj?.id,
    });
  };

  const handleCountryChange = (slug: string) => {
    setSelectedCountry(slug);
    setSelectedState('all');
    setSelectedCity('all');
    notifyChange(slug, 'all', 'all');
  };

  const handleStateChange = (slug: string) => {
    setSelectedState(slug);
    setSelectedCity('all');
    notifyChange(selectedCountry, slug, 'all');
  };

  const handleCityChange = (slug: string) => {
    setSelectedCity(slug);
    notifyChange(selectedCountry, selectedState, slug);
  };

  // Helper for localized country name
  const getCountryDisplayName = (c: { name: string; localizedNames?: any }) => {
    if (c.localizedNames && c.localizedNames[locale]) {
      return c.localizedNames[locale];
    }
    return c.name;
  };

  if (variant === 'stacked') {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Country */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-casa-text-muted flex items-center gap-1.5 mb-1">
            <Globe2 className="w-3.5 h-3.5 text-casa-brand" />
            <span>Country</span>
          </label>
          <select
            value={selectedCountry}
            onChange={(e) => handleCountryChange(e.target.value)}
            aria-label="Select Country"
            className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/30"
          >
            <option value="all">All Countries (Global)</option>
            {countries.map((c, idx) => (
              <option key={`${c.slug}-${c.id || idx}`} value={c.slug}>
                {getCountryDisplayName(c)}
              </option>
            ))}
          </select>
        </div>

        {/* State / Region */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-casa-text-muted flex items-center gap-1.5 mb-1">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span>State / Region</span>
          </label>
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={selectedCountry === 'all' || loadingStates}
            aria-label="Select State or Region"
            className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/30 disabled:opacity-50"
          >
            <option value="all">
              {loadingStates ? 'Loading States...' : 'All States / Regions'}
            </option>
            {states.map((s, idx) => (
              <option key={`${s.slug}-${s.id || idx}`} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-casa-text-muted flex items-center gap-1.5 mb-1">
            <Building2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>City</span>
          </label>
          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            disabled={loadingCities}
            aria-label="Select City"
            className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/30 disabled:opacity-50"
          >
            <option value="all">
              {loadingCities ? 'Loading Cities...' : 'All Cities'}
            </option>
            {cities.map((ct, idx) => (
              <option key={`${ct.slug}-${ct.id || idx}`} value={ct.slug}>
                {ct.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  // Default: Responsive Hero / Grid layout
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2.5 ${className}`}>
      {/* 1. Country Selection */}
      <div className="relative">
        <label className="text-[10px] font-bold uppercase tracking-wider text-casa-text-muted flex items-center gap-1 mb-1">
          <Globe2 className="w-3 h-3 text-casa-brand" />
          <span>Country</span>
        </label>
        <div className="relative">
          <select
            value={selectedCountry}
            onChange={(e) => handleCountryChange(e.target.value)}
            aria-label="Select Country"
            className="w-full pl-2.5 pr-7 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-casa-brand/30 cursor-pointer appearance-none truncate"
          >
            <option value="all">🌍 All Countries (Global)</option>
            {countries.map((c, idx) => (
              <option key={`${c.slug}-${c.id || idx}`} value={c.slug}>
                📍 {getCountryDisplayName(c)}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-casa-text-muted pointer-events-none" />
        </div>
      </div>

      {/* 2. State / Region Selection */}
      <div className="relative">
        <label className="text-[10px] font-bold uppercase tracking-wider text-casa-text-muted flex items-center gap-1 mb-1">
          <MapPin className="w-3 h-3 text-amber-500" />
          <span>State / Region</span>
        </label>
        <div className="relative">
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={selectedCountry === 'all' || loadingStates}
            aria-label="Select State or Region"
            className="w-full pl-2.5 pr-7 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-casa-brand/30 cursor-pointer appearance-none truncate disabled:opacity-50"
          >
            <option value="all">
              {loadingStates ? 'Loading regions...' : 'All States / Regions'}
            </option>
            {states.map((s, idx) => (
              <option key={`${s.slug}-${s.id || idx}`} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-casa-text-muted pointer-events-none" />
        </div>
      </div>

      {/* 3. City Selection */}
      <div className="relative">
        <label className="text-[10px] font-bold uppercase tracking-wider text-casa-text-muted flex items-center gap-1 mb-1">
          <Building2 className="w-3 h-3 text-emerald-500" />
          <span>City / Market</span>
        </label>
        <div className="relative">
          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            disabled={loadingCities}
            aria-label="Select City"
            className="w-full pl-2.5 pr-7 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-casa-brand/30 cursor-pointer appearance-none truncate disabled:opacity-50"
          >
            <option value="all">
              {loadingCities ? 'Loading cities...' : 'All Cities / Micro-markets'}
            </option>
            {cities.map((ct, idx) => (
              <option key={`${ct.slug}-${ct.id || idx}`} value={ct.slug}>
                {ct.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-casa-text-muted pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
