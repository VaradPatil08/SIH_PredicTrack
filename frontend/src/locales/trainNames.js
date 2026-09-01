/**
 * Comprehensive Indian Railways Train Names, Stations, Types & Zones Localization in Hindi
 */

// Exact & Flagship Train Name Mappings (by Train Number)
export const TRAIN_NAMES_EXACT = {
  '12951': 'मुंबई सेंट्रल - नई दिल्ली तेजस राजधानी एक्सप्रेस',
  '12952': 'नई दिल्ली - मुंबई सेंट्रल तेजस राजधानी एक्सप्रेस',
  '22436': 'नई दिल्ली - वाराणसी वंदे भारत एक्सप्रेस',
  '22435': 'वाराणसी - नई दिल्ली वंदे भारत एक्सप्रेस',
  '12009': 'मुंबई सेंट्रल - अहमदाबाद शताब्दी एक्सप्रेस',
  '12010': 'अहमदाबाद - मुंबई सेंट्रल शताब्दी एक्सप्रेस',
  '12301': 'हावड़ा - नई दिल्ली राजधानी एक्सप्रेस',
  '12302': 'नई दिल्ली - हावड़ा राजधानी एक्सप्रेस',
  '20608': 'केएसआर बेंगलुरु - एमजीआर चेन्नई सेंट्रल वंदे भारत एक्सप्रेस',
  '20607': 'एमजीआर चेन्नई सेंट्रल - केएसआर बेंगलुरु वंदे भारत एक्सप्रेस',
  '12002': 'नई दिल्ली - रानी कमलापति शताब्दी एक्सप्रेस',
  '12001': 'रानी कमलापति - नई दिल्ली शताब्दी एक्सप्रेस',
  '12953': 'मुंबई सेंट्रल - हज़रत निज़ामुद्दीन अगस्त क्रांति राजधानी',
  '12954': 'हज़रत निज़ामुद्दीन - मुंबई सेंट्रल अगस्त क्रांति राजधानी',
  '12049': 'वीरांगना लक्ष्मीबाई झांसी - हज़रत निज़ामुद्दीन गतिमान एक्सप्रेस',
  '12050': 'हज़रत निज़ामुद्दीन - वीरांगना लक्ष्मीबाई झांसी गतिमान एक्सप्रेस',
  '12903': 'मुंबई सेंट्रल - अमृतसर गोल्डन टेम्पल मेल',
  '12904': 'अमृतसर - मुंबई सेंट्रल गोल्डन टेम्पल मेल',
  '12621': 'एमजीआर चेन्नई सेंट्रल - नई दिल्ली तमिलनाडु एक्सप्रेस',
  '12622': 'नई दिल्ली - एमजीआर चेन्नई सेंट्रल तमिलनाडु एक्सप्रेस',
  '12627': 'केएसआर बेंगलुरु - नई दिल्ली कर्नाटक एक्सप्रेस',
  '12628': 'नई दिल्ली - केएसआर बेंगलुरु कर्नाटक एक्सप्रेस',
  '12615': 'एमजीआर चेन्नई सेंट्रल - नई दिल्ली ग्रैंड ट्रंक एक्सप्रेस',
  '12616': 'नई दिल्ली - एमजीआर चेन्नई सेंट्रल ग्रैंड ट्रंक एक्सप्रेस',
  '12137': 'मुंबई सीएसएमटी - फ़िरोज़पुर छावनी पंजाब मेल',
  '12138': 'फ़िरोज़पुर छावनी - मुंबई सीएसएमटी पंजाब मेल',
  '12625': 'तिरुवनंतपुरम सेंट्रल - नई दिल्ली केरल एक्सप्रेस',
  '12626': 'नई दिल्ली - तिरुवनंतपुरम सेंट्रल केरल एक्सप्रेस',
  '12723': 'हैदराबाद डेक्कन - नई दिल्ली तेलंगाना एक्सप्रेस',
  '12724': 'नई दिल्ली - हैदराबाद डेक्कन तेलंगाना एक्सप्रेस',
  '12841': 'शालीमार - एमजीआर चेन्नई सेंट्रल कोरोमंडल एक्सप्रेस',
  '12842': 'एमजीआर चेन्नई सेंट्रल - शालीमार कोरोमंडल एक्सप्रेस',
  '12859': 'मुंबई सीएसएमटी - हावड़ा गीतांजलि एक्सप्रेस',
  '12860': 'हावड़ा - मुंबई सीएसएमटी गीतांजलि एक्सप्रेस',
  '12925': 'बांद्रा टर्मिनस - अमृतसर पश्चिम एक्सप्रेस',
  '12926': 'अमृतसर - बांद्रा टर्मिनस पश्चिम एक्सप्रेस',
  '12123': 'मुंबई सीएसएमटी - पुणे डेक्कन क्वीन',
  '12124': 'पुणे - मुंबई सीएसएमटी डेक्कन क्वीन',
  '12921': 'मुंबई सेंट्रल - सूरत फ़्लाइंग रानी',
  '12922': 'सूरत - मुंबई सेंट्रल फ़्लाइंग रानी',
  '12311': 'हावड़ा - कालका नेताजी एक्सप्रेस',
  '12312': 'कालका - हावड़ा नेताजी एक्सप्रेस',
  '12381': 'हावड़ा - नई दिल्ली पूर्वा एक्सप्रेस',
  '12382': 'नई दिल्ली - हावड़ा पूर्वा एक्सप्रेस',
  '12559': 'वाराणसी - नई दिल्ली शिव गंगा एक्सप्रेस',
  '12560': 'नई दिल्ली - वाराणसी शिव गंगा एक्सप्रेस',
  '12417': 'प्रयागराज - नई दिल्ली प्रयागराज एक्सप्रेस',
  '12418': 'नई दिल्ली - प्रयागराज प्रयागराज एक्सप्रेस',
  '12391': 'राजगीर - नई दिल्ली श्रमजीवी एक्सप्रेस',
  '12392': 'नई दिल्ली - राजगीर श्रमजीवी एक्सप्रेस',
  '12779': 'वास्को-द-गामा - हज़रत निज़ामुद्दीन गोवा एक्सप्रेस',
  '12780': 'हज़रत निज़ामुद्दीन - वास्को-द-गामा गोवा एक्सप्रेस',
  '12305': 'हावड़ा - नई दिल्ली राजधानी एक्सप्रेस (वाया पटना)',
  '12306': 'नई दिल्ली - हावड़ा राजधानी एक्सप्रेस (वाया पटना)',
  '12313': 'सियालदह - नई दिल्ली राजधानी एक्सप्रेस',
  '12314': 'नई दिल्ली - सियालदह राजधानी एक्सप्रेस',
  '12423': 'डिब्रूगढ़ - नई दिल्ली राजधानी एक्सप्रेस',
  '12424': 'नई दिल्ली - डिब्रूगढ़ राजधानी एक्सप्रेस',
  '12431': 'तिरुवनंतपुरम सेंट्रल - हज़रत निज़ामुद्दीन राजधानी एक्सप्रेस',
  '12432': 'हज़रत निज़ामुद्दीन - तिरुवनंतपुरम सेंट्रल राजधानी एक्सप्रेस',
  '12433': 'एमजीआर चेन्नई सेंट्रल - हज़रत निज़ामुद्दीन राजधानी एक्सप्रेस',
  '12434': 'हज़रत निज़ामुद्दीन - एमजीआर चेन्नई सेंट्रल राजधानी एक्सप्रेस',
  '12437': 'सिकंदराबाद - हज़रत निज़ामुद्दीन राजधानी एक्सप्रेस',
  '12438': 'हज़रत निज़ामुद्दीन - सिकंदराबाद राजधानी एक्सप्रेस',
  '12441': 'बिलासपुर - नई दिल्ली राजधानी एक्सप्रेस',
  '12442': 'नई दिल्ली - बिलासपुर राजधानी एक्सप्रेस',
  '12453': 'रांची - नई दिल्ली राजधानी एक्सप्रेस',
  '12454': 'नई दिल्ली - रांची राजधानी एक्सप्रेस',
  '12259': 'सियालदह - बीकानेर दुरंतो एक्सप्रेस',
  '12260': 'बीकानेर - सियालदह दुरंतो एक्सप्रेस',
  '12269': 'एमजीआर चेन्नई सेंट्रल - हज़रत निज़ामुद्दीन दुरंतो एक्सप्रेस',
  '12270': 'हज़रत निज़ामुद्दीन - एमजीआर चेन्नई सेंट्रल दुरंतो एक्सप्रेस',
  '12213': 'यशवंतपुर - दिल्ली सराय रोहिल्ला दुरंतो एक्सप्रेस',
  '12214': 'दिल्ली सराय रोहिल्ला - यशवंतपुर दुरंतो एक्सप्रेस',
  '12245': 'हावड़ा - यशवंतपुर दुरंतो एक्सप्रेस',
  '12246': 'यशवंतपुर - हावड़ा दुरंतो एक्सप्रेस',
  '12533': 'लखनऊ जंक्शन - मुंबई सीएसएमटी पुष्पक एक्सप्रेस',
  '12534': 'मुंबई सीएसएमटी - लखनऊ जंक्शन पुष्पक एक्सप्रेस',
  '12163': 'लोकमान्य तिलक टर्मिनस - एमजीआर चेन्नई सेंट्रल सुपरफ़ास्ट',
  '12164': 'एमजीआर चेन्नई सेंट्रल - लोकमान्य तिलक टर्मिनस सुपरफ़ास्ट',
};

// Full name lookup table for exact string matches
export const EXACT_FULL_NAMES = {
  'Mumbai Central - New Delhi Tejas Rajdhani Express': 'मुंबई सेंट्रल - नई दिल्ली तेजस राजधानी एक्सप्रेस',
  'New Delhi - Varanasi Vande Bharat Express': 'नई दिल्ली - वाराणसी वंदे भारत एक्सप्रेस',
  'Mumbai Central - Ahmedabad Shatabdi Express': 'मुंबई सेंट्रल - अहमदाबाद शताब्दी एक्सप्रेस',
  'Howrah - New Delhi Rajdhani Express': 'हावड़ा - नई दिल्ली राजधानी एक्सप्रेस',
  'KSR Bengaluru - MGR Chennai Central VB Express': 'केएसआर बेंगलुरु - एमजीआर चेन्नई सेंट्रल वंदे भारत एक्सप्रेस',
  'KSR Bengaluru - MGR Chennai Central Vande Bharat Express': 'केएसआर बेंगलुरु - एमजीआर चेन्नई सेंट्रल वंदे भारत एक्सप्रेस',
  'Hazrat Nizamuddin - Madgaon Goa Express': 'हज़रत निज़ामुद्दीन - मडगांव गोवा एक्सप्रेस',
  'New Delhi - Sealdah Rajdhani Express': 'नई दिल्ली - सियालदह राजधानी एक्सप्रेस',
  'New Delhi - Howrah Rajdhani Express': 'नई दिल्ली - हावड़ा राजधानी एक्सप्रेस',
  'August Kranti Rajdhani Express': 'अगस्त क्रांति राजधानी एक्सप्रेस',
  'Gatimaan Express': 'गतिमान एक्सप्रेस',
  'Golden Temple Mail': 'गोल्डन टेम्पल मेल',
  'Tamil Nadu Express': 'तमिलनाडु एक्सप्रेस',
  'Karnataka Express': 'कर्नाटक एक्सप्रेस',
  'Grand Trunk Express': 'ग्रैंड ट्रंक एक्सप्रेस',
  'Punjab Mail': 'पंजाब मेल',
  'Kerala Express': 'केरल एक्सप्रेस',
  'Telangana Express': 'तेलंगाना एक्सप्रेस',
  'Coromandel Express': 'कोरोमंडल एक्सप्रेस',
  'Gitanjali Express': 'गीतांजलि एक्सप्रेस',
  'Paschim Express': 'पश्चिम एक्सप्रेस',
  'Deccan Queen': 'डेक्कन क्वीन',
  'Flying Ranee': 'फ़्लाइंग रानी',
  'Netaji Express': 'नेताजी एक्सप्रेस',
  'Poorva Express': 'पूर्वा एक्सप्रेस',
  'Shiv Ganga Express': 'शिव गंगा एक्सप्रेस',
  'Prayagraj Express': 'प्रयागराज एक्सप्रेस',
  'Shramjeevi Express': 'श्रमजीवी एक्सप्रेस',
  'Goa Express': 'गोवा एक्सप्रेस',
  'Pushpak Express': 'पुष्पक एक्सप्रेस',
  'Saurashtra Express': 'सौराष्ट्र एक्सप्रेस',
  'Kalka Shatabdi': 'कालका शताब्दी',
  'Vande Bharat Express': 'वंदे भारत एक्सप्रेस',
};

// Comprehensive Stations Dictionary (Codes & English Names -> Hindi)
export const STATIONS_MAP = {
  'MMCT': 'मुंबई सेंट्रल',
  'Mumbai Central': 'मुंबई सेंट्रल',
  'BVI': 'बोरिवली',
  'Borivali': 'बोरिवली',
  'ST': 'सूरत',
  'Surat': 'सूरत',
  'BRC': 'वडोदरा जंक्शन',
  'Vadodara Junction': 'वडोदरा जंक्शन',
  'Vadodara': 'वडोदरा',
  'RTM': 'रतलाम जंक्शन',
  'Ratlam Junction': 'रतलाम जंक्शन',
  'Ratlam': 'रतलाम',
  'KOTA': 'कोटा जंक्शन',
  'Kota Junction': 'कोटा जंक्शन',
  'Kota': 'कोटा',
  'SWM': 'सवाई माधोपुर',
  'Sawai Madhopur': 'सवाई माधोपुर',
  'MTJ': 'मथुरा जंक्शन',
  'Mathura Junction': 'मथुरा जंक्शन',
  'Mathura': 'मथुरा',
  'NDLS': 'नई दिल्ली',
  'New Delhi': 'नई दिल्ली',
  'CNB': 'कानपुर सेंट्रल',
  'Kanpur Central': 'कानपुर सेंट्रल',
  'Kanpur': 'कानपुर',
  'PRYJ': 'प्रयागराज जंक्शन',
  'Prayagraj Junction': 'प्रयागराज जंक्शन',
  'Prayagraj': 'प्रयागराज',
  'BSB': 'वाराणसी जंक्शन',
  'Varanasi Junction': 'वाराणसी जंक्शन',
  'Varanasi': 'वाराणसी',
  'VAPI': 'वापी',
  'Vapi': 'वापी',
  'BH': 'भरूच जंक्शन',
  'Bharuch Junction': 'भरूच जंक्शन',
  'Bharuch': 'भरूच',
  'ANND': 'आनंद जंक्शन',
  'Anand Junction': 'आनंद जंक्शन',
  'Anand': 'आनंद',
  'ND': 'नडियाद जंक्शन',
  'Nadiad Junction': 'नडियाद जंक्शन',
  'Nadiad': 'नडियाद',
  'ADI': 'अहमदाबाद जंक्शन',
  'Ahmedabad Junction': 'अहमदाबाद जंक्शन',
  'Ahmedabad': 'अहमदाबाद',
  'ASN': 'आसनसोल जंक्शन',
  'Asansol Junction': 'आसनसोल जंक्शन',
  'Asansol': 'आसनसोल',
  'DHN': 'धनबाद जंक्शन',
  'Dhanbad Junction': 'धनबाद जंक्शन',
  'Dhanbad': 'धनबाद',
  'PNME': 'पारसनाथ',
  'Parasnath': 'पारसनाथ',
  'GAYA': 'गया जंक्शन',
  'Gaya Junction': 'गया जंक्शन',
  'Gaya': 'गया',
  'DDU': 'पं. दीनदयाल उपाध्याय जंक्शन',
  'Pt. DD Upadhyaya Junction': 'पं. दीनदयाल उपाध्याय जंक्शन',
  'Pt DD Upadhyaya Jn': 'पं. दीनदयाल उपाध्याय जंक्शन',
  'Mughalsarai': 'मुगलसराय',
  'HWH': 'हावड़ा जंक्शन',
  'Howrah Junction': 'हावड़ा जंक्शन',
  'Howrah': 'हावड़ा',
  'SBC': 'केएसआर बेंगलुरु',
  'KSR Bengaluru': 'केएसआर बेंगलुरु',
  'Bengaluru': 'बेंगलुरु',
  'Bangalore': 'बेंगलुरु',
  'BNC': 'बेंगलुरु छावनी',
  'Bengaluru Cantt': 'बेंगलुरु छावनी',
  'KJM': 'कृष्णराजपुरम',
  'Krishnarajapuram': 'कृष्णराजपुरम',
  'KPD': 'काटपाडी जंक्शन',
  'Katpadi Junction': 'काटपाडी जंक्शन',
  'Katpadi': 'काटपाडी',
  'MAS': 'एमजीआर चेन्नई सेंट्रल',
  'MGR Chennai Central': 'एमजीआर चेन्नई सेंट्रल',
  'Chennai Central': 'चेन्नई सेंट्रल',
  'Chennai': 'चेन्नई',
  'NZM': 'हज़रत निज़ामुद्दीन',
  'Hazrat Nizamuddin': 'हज़रत निज़ामुद्दीन',
  'CSMT': 'मुंबई सीएसएमटी',
  'Mumbai CSMT': 'मुंबई सीएसएमटी',
  'LTT': 'लोकमान्य तिलक टर्मिनस',
  'Lokmanya Tilak Terminus': 'लोकमान्य तिलक टर्मिनस',
  'BDTS': 'बांद्रा टर्मिनस',
  'Bandra Terminus': 'बांद्रा टर्मिनस',
  'PUNE': 'पुणे जंक्शन',
  'Pune Junction': 'पुणे जंक्शन',
  'Pune': 'पुणे',
  'NGP': 'नागपुर जंक्शन',
  'Nagpur Junction': 'नागपुर जंक्शन',
  'Nagpur': 'नागपुर',
  'BPL': 'भोपाल जंक्शन',
  'Bhopal Junction': 'भोपाल जंक्शन',
  'Bhopal': 'भोपाल',
  'RKMP': 'रानी कमलापति',
  'Rani Kamlapati': 'रानी कमलापति',
  'HBJ': 'हबीबगंज (रानी कमलापति)',
  'Habibganj': 'हबीबगंज',
  'GWL': 'ग्वालियर जंक्शन',
  'Gwalior Junction': 'ग्वालियर जंक्शन',
  'Gwalior': 'ग्वालियर',
  'AGC': 'आगरा कैंट',
  'Agra Cantt': 'आगरा कैंट',
  'AF': 'आगरा फोर्ट',
  'Agra Fort': 'आगरा फोर्ट',
  'VGLJ': 'वीरांगना लक्ष्मीबाई झांसी',
  'Virangana Lakshmibai Jhansi': 'वीरांगना लक्ष्मीबाई झांसी',
  'Jhansi': 'झांसी',
  'JP': 'जयपुर जंक्शन',
  'Jaipur Junction': 'जयपुर जंक्शन',
  'Jaipur': 'जयपुर',
  'JU': 'जोधपुर जंक्शन',
  'Jodhpur Junction': 'जोधपुर जंक्शन',
  'Jodhpur': 'जोधपुर',
  'UDZ': 'उदयपुर सिटी',
  'Udaipur City': 'उदयपुर सिटी',
  'Udaipur': 'उदयपुर',
  'ASR': 'अमृतसर जंक्शन',
  'Amritsar Junction': 'अमृतसर जंक्शन',
  'Amritsar': 'अमृतसर',
  'CDG': 'चंडीगढ़ जंक्शन',
  'Chandigarh Junction': 'चंडीगढ़ जंक्शन',
  'Chandigarh': 'चंडीगढ़',
  'KLK': 'कालका',
  'Kalka': 'कालका',
  'LKO': 'लखनऊ चारबाग',
  'Lucknow Charbagh': 'लखनऊ चारबाग',
  'Lucknow NR': 'लखनऊ उत्तर रेलवे',
  'Lucknow Jn': 'लखनऊ जंक्शन',
  'Lucknow': 'लखनऊ',
  'GKP': 'गोरखपुर जंक्शन',
  'Gorakhpur Junction': 'गोरखपुर जंक्शन',
  'Gorakhpur': 'गोरखपुर',
  'PNBE': 'पटना जंक्शन',
  'Patna Junction': 'पटना जंक्शन',
  'Patna': 'पटना',
  'RNC': 'रांची जंक्शन',
  'Ranchi Junction': 'रांची जंक्शन',
  'Ranchi': 'रांची',
  'TATA': 'टाटानगर जंक्शन',
  'Tatanagar Junction': 'टाटानगर जंक्शन',
  'Tatanagar': 'टाटानगर',
  'BBS': 'भुवनेश्वर',
  'Bhubaneswar': 'भुवनेश्वर',
  'PURI': 'पुरी',
  'Puri': 'पुरी',
  'VSKP': 'विशाखापट्टनम',
  'Visakhapatnam': 'विशाखापट्टनम',
  'BZA': 'विजयवाड़ा जंक्शन',
  'Vijayawada Junction': 'विजयवाड़ा जंक्शन',
  'Vijayawada': 'विजयवाड़ा',
  'SC': 'सिकंदराबाद जंक्शन',
  'Secunderabad Junction': 'सिकंदराबाद जंक्शन',
  'Secunderabad': 'सिकंदराबाद',
  'HYB': 'हैदराबाद डेक्कन',
  'Hyderabad Deccan': 'हैदराबाद डेक्कन',
  'Hyderabad': 'हैदराबाद',
  'CBE': 'कोयंबटूर जंक्शन',
  'Coimbatore Junction': 'कोयंबटूर जंक्शन',
  'Coimbatore': 'कोयंबटूर',
  'MDU': 'मदुरै जंक्शन',
  'Madurai Junction': 'मदुरै जंक्शन',
  'Madurai': 'मदुरै',
  'ERS': 'एर्नाकुलम जंक्शन (दक्षिण)',
  'Ernakulam Junction': 'एर्नाकुलम जंक्शन',
  'Ernakulam': 'एर्नाकुलम',
  'TVC': 'तिरुवनंतपुरम सेंट्रल',
  'Thiruvananthapuram Central': 'तिरुवनंतपुरम सेंट्रल',
  'Trivandrum': 'तिरुवनंतपुरम',
  'MAO': 'मडगांव जंक्शन',
  'Madgaon Junction': 'मडगांव जंक्शन',
  'Madgaon': 'मडगांव',
  'Goa': 'गोवा',
  'GHY': 'गुवाहाटी',
  'Guwahati': 'गुवाहाटी',
  'DBRG': 'डिब्रूगढ़',
  'Dibrugarh': 'डिब्रूगढ़',
  'SDAH': 'सियालदह',
  'Sealdah': 'सियालदह',
  'SHM': 'शालीमार',
  'Shalimar': 'शालीमार',
  'FZR': 'फ़िरोज़पुर छावनी',
  'Firozpur Cantt': 'फ़िरोज़पुर छावनी',
  'DLI': 'पुरानी दिल्ली',
  'Old Delhi': 'पुरानी दिल्ली',
  'Delhi': 'दिल्ली',
  'DEE': 'दिल्ली सराय रोहिल्ला',
  'Delhi Sarai Rohilla': 'दिल्ली सराय रोहिल्ला',
  'YPR': 'यशवंतपुर जंक्शन',
  'Yesvantpur Junction': 'यशवंतपुर जंक्शन',
  'Yesvantpur': 'यशवंतपुर',
  'BKN': 'बीकानेर जंक्शन',
  'Bikaner Junction': 'बीकानेर जंक्शन',
  'Bikaner': 'बीकानेर',
  'GGC': 'गंगापुर सिटी',
  'Gangapur City': 'गंगापुर सिटी',
  'BSP': 'बिलासपुर जंक्शन',
  'Bilaspur Junction': 'बिलासपुर जंक्शन',
  'Bilaspur': 'बिलासपुर',
};

// Common Brand and Suffix Replacements for dynamic name composition
const BRAND_REPLACEMENTS = [
  { en: /Tejas Rajdhani Express/i, hi: 'तेजस राजधानी एक्सप्रेस' },
  { en: /Tejas Rajdhani/i, hi: 'तेजस राजधानी' },
  { en: /Vande Bharat Express/i, hi: 'वंदे भारत एक्सप्रेस' },
  { en: /Vande Bharat/i, hi: 'वंदे भारत' },
  { en: /VB Express/i, hi: 'वंदे भारत एक्सप्रेस' },
  { en: /Rajdhani Express/i, hi: 'राजधानी एक्सप्रेस' },
  { en: /Rajdhani/i, hi: 'राजधानी' },
  { en: /Shatabdi Express/i, hi: 'शताब्दी एक्सप्रेस' },
  { en: /Shatabdi/i, hi: 'शताब्दी' },
  { en: /Jan Shatabdi Express/i, hi: 'जन शताब्दी एक्सप्रेस' },
  { en: /Jan Shatabdi/i, hi: 'जन शताब्दी' },
  { en: /Duronto Express/i, hi: 'दुरंतो एक्सप्रेस' },
  { en: /Duronto/i, hi: 'दुरंतो' },
  { en: /Garib Rath Express/i, hi: 'गरीब रथ एक्सप्रेस' },
  { en: /Garib Rath/i, hi: 'गरीब रथ' },
  { en: /Humsafar Express/i, hi: 'हमसफ़र एक्सप्रेस' },
  { en: /Humsafar/i, hi: 'हमसफ़र' },
  { en: /Antyodaya Express/i, hi: 'अंत्योदय एक्सप्रेस' },
  { en: /Antyodaya/i, hi: 'अंत्योदय' },
  { en: /Sampark Kranti Express/i, hi: 'संपर्क क्रांति एक्सप्रेस' },
  { en: /Sampark Kranti/i, hi: 'संपर्क क्रांति' },
  { en: /Gatimaan Express/i, hi: 'गतिमान एक्सप्रेस' },
  { en: /Gatimaan/i, hi: 'गतिमान' },
  { en: /Superfast Express/i, hi: 'सुपरफ़ास्ट एक्सप्रेस' },
  { en: /Superfast/i, hi: 'सुपरफ़ास्ट' },
  { en: /SF Express/i, hi: 'सुपरफ़ास्ट एक्सप्रेस' },
  { en: /Mail Express/i, hi: 'मेल एक्सप्रेस' },
  { en: /Mail/i, hi: 'मेल' },
  { en: /Express Train/i, hi: 'एक्सप्रेस ट्रेन' },
  { en: /Express/i, hi: 'एक्सप्रेस' },
  { en: /Special/i, hi: 'स्पेशल' },
  { en: /Passenger/i, hi: 'पैसेंजर' },
  { en: /MEMU/i, hi: 'मेमू' },
  { en: /Intercity/i, hi: 'इंटरसिटी' },
];

// Railway Zones Map
export const RAILWAY_ZONES = {
  'Western Railway': 'पश्चिम रेलवे',
  'Northern Railway': 'उत्तर रेलवे',
  'North Central Railway': 'उत्तर मध्य रेलवे',
  'North Central': 'उत्तर मध्य रेलवे',
  'Eastern Railway': 'पूर्व रेलवे',
  'Southern Railway': 'दक्षिण रेलवे',
  'Central Railway': 'मध्य रेलवे',
  'South Western Railway': 'दक्षिण पश्चिम रेलवे',
  'East Central Railway': 'पूर्व मध्य रेलवे',
  'North Eastern Railway': 'पूर्वोत्तर रेलवे',
  'South Eastern Railway': 'दक्षिण पूर्व रेलवे',
  'East Coast Railway': 'पूर्व तटीय रेलवे',
  'West Central Railway': 'पश्चिम मध्य रेलवे',
  'North Western Railway': 'उत्तर पश्चिम रेलवे',
  'South East Central Railway': 'दक्षिण पूर्व मध्य रेलवे',
  'Northeast Frontier Railway': 'पूर्वोत्तर सीमांत रेलवे',
  'Indian Railways': 'भारतीय रेल',
  'WR': 'पश्चिम रेलवे (WR)',
  'NR': 'उत्तर रेलवे (NR)',
  'NCR': 'उत्तर मध्य रेलवे (NCR)',
  'ER': 'पूर्व रेलवे (ER)',
  'SR': 'दक्षिण रेलवे (SR)',
  'CR': 'मध्य रेलवे (CR)',
  'SWR': 'दक्षिण पश्चिम रेलवे (SWR)',
  'ECR': 'पूर्व मध्य रेलवे (ECR)',
  'NER': 'पूर्वोत्तर रेलवे (NER)',
  'SER': 'दक्षिण पूर्व रेलवे (SER)',
  'ECoR': 'पूर्व तटीय रेलवे (ECoR)',
  'WCR': 'पश्चिम मध्य रेलवे (WCR)',
  'NWR': 'उत्तर पश्चिम रेलवे (NWR)',
  'SECR': 'दक्षिण पूर्व मध्य रेलवे (SECR)',
  'NFR': 'पूर्वोत्तर सीमांत रेलवे (NFR)',
};

// Service Types Map
export const SERVICE_TYPES = {
  'Rajdhani': 'राजधानी',
  'Rajdhani Express': 'राजधानी एक्सप्रेस',
  'Vande Bharat': 'वंदे भारत',
  'Vande Bharat Express': 'वंदे भारत एक्सप्रेस',
  'Shatabdi': 'शताब्दी',
  'Shatabdi Express': 'शताब्दी एक्सप्रेस',
  'Superfast': 'सुपरफ़ास्ट',
  'Superfast Express': 'सुपरफ़ास्ट एक्सप्रेस',
  'Express': 'एक्सप्रेस',
  'Mail': 'मेल',
  'Duronto': 'दुरंतो',
  'Duronto Express': 'दुरंतो एक्सप्रेस',
  'Garib Rath': 'गरीब रथ',
  'Jan Shatabdi': 'जन शताब्दी',
  'Tejas': 'तेजस',
  'Tejas Express': 'तेजस एक्सप्रेस',
  'Humsafar': 'हमसफ़र',
  'Antyodaya': 'अंत्योदय',
  'Sampark Kranti': 'संपर्क क्रांति',
  'Gatimaan': 'गतिमान',
  'MEMU': 'मेमू',
  'Passenger': 'पैसेंजर',
  'Special': 'स्पेशल',
};

/**
 * Translates a station name or station code into Hindi
 */
export function translateStationName(stationName, language = 'en') {
  if (!stationName || typeof stationName !== 'string') return stationName || '';
  if (language !== 'hi') return stationName;

  const trimmed = stationName.trim();
  if (!trimmed) return '';

  // 1. Direct lookup
  if (STATIONS_MAP[trimmed]) return STATIONS_MAP[trimmed];

  // 2. Check if code is in parentheses, e.g. "Mumbai Central (MMCT)"
  const parenMatch = trimmed.match(/^(.*?)\s*\(([A-Z0-9_-]+)\)$/);
  if (parenMatch) {
    const rawPlace = parenMatch[1].trim();
    const code = parenMatch[2].trim();
    const localizedPlace = STATIONS_MAP[rawPlace] || STATIONS_MAP[code] || rawPlace;
    return `${localizedPlace} (${code})`;
  }

  // 3. Normalized search in STATIONS_MAP
  const normKey = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(STATIONS_MAP)) {
    if (key.toLowerCase() === normKey) {
      return val;
    }
  }

  // 4. Substring replacement for common railway designations
  let result = trimmed;
  result = result.replace(/\bJunction\b/gi, 'जंक्शन');
  result = result.replace(/\bCentral\b/gi, 'सेंट्रल');
  result = result.replace(/\bCantt\b/gi, 'छावनी (कैंट)');
  result = result.replace(/\bTerminus\b/gi, 'टर्मिनस');
  result = result.replace(/\bCity\b/gi, 'सिटी');
  result = result.replace(/\bTown\b/gi, 'टाउन');
  result = result.replace(/\bRoad\b/gi, 'रोड');
  result = result.replace(/\bFort\b/gi, 'फ़ोर्ट');

  return result;
}

/**
 * Translates train names into Hindi
 */
export function translateTrainName(name, language = 'en', trainNumber = '') {
  if (!name || typeof name !== 'string') return name || '';
  if (language !== 'hi') return name;

  const trimmed = name.trim();
  if (!trimmed) return '';

  // 1. Check by train number if provided
  const numKey = String(trainNumber || '').trim();
  if (numKey && TRAIN_NAMES_EXACT[numKey]) {
    return TRAIN_NAMES_EXACT[numKey];
  }

  // 2. Direct full name lookup
  if (EXACT_FULL_NAMES[trimmed]) {
    return EXACT_FULL_NAMES[trimmed];
  }

  // Check case-insensitive exact name
  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(EXACT_FULL_NAMES)) {
    if (key.toLowerCase() === lower) return val;
  }

  // 3. Composite train names (e.g. "Origin - Destination Brand Express")
  const routeMatch = trimmed.match(/^(.*?)\s*[-–—→]\s*(.*?)(?:\s+(Tejas|Vande Bharat|Rajdhani|Shatabdi|Duronto|Garib Rath|Jan Shatabdi|Gatimaan|Superfast|Express|Mail|VB Express|Special|Passenger|MEMU|SF Express).*?)?$/i);
  
  if (routeMatch) {
    const originRaw = routeMatch[1].trim();
    let destRaw = routeMatch[2].trim();
    
    // Check if destRaw contains trailing brand words
    let matchedBrand = '';
    for (const b of BRAND_REPLACEMENTS) {
      if (b.en.test(trimmed)) {
        matchedBrand = b.hi;
        break;
      }
    }

    // Remove brand words from destination if matched
    destRaw = destRaw.replace(/\b(Tejas|Vande Bharat|Rajdhani|Shatabdi|Duronto|Garib Rath|Jan Shatabdi|Gatimaan|Superfast|Express|Mail|VB Express|Special|Passenger|MEMU|SF Express)\b/gi, '').trim();

    const originHi = translateStationName(originRaw, 'hi');
    const destHi = translateStationName(destRaw, 'hi');

    if (matchedBrand) {
      return `${originHi} - ${destHi} ${matchedBrand}`.trim();
    }
    return `${originHi} - ${destHi}`.trim();
  }

  // 4. Word-by-word / Brand replacement fallback
  let translated = trimmed;
  for (const b of BRAND_REPLACEMENTS) {
    if (b.en.test(translated)) {
      translated = translated.replace(b.en, b.hi);
    }
  }

  // Translate any known station names inside the train name
  for (const [stnEn, stnHi] of Object.entries(STATIONS_MAP)) {
    if (stnEn.length > 3) {
      const reg = new RegExp(`\\b${stnEn}\\b`, 'gi');
      translated = translated.replace(reg, stnHi);
    }
  }

  return translated;
}

/**
 * Translates train service type into Hindi
 */
export function translateTrainType(type, language = 'en') {
  if (!type || typeof type !== 'string') return type || '';
  if (language !== 'hi') return type;

  const trimmed = type.trim();
  if (SERVICE_TYPES[trimmed]) return SERVICE_TYPES[trimmed];

  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(SERVICE_TYPES)) {
    if (key.toLowerCase() === lower) return val;
  }

  return trimmed;
}

/**
 * Translates railway zone / division into Hindi
 */
export function translateRailwayZone(zone, language = 'en') {
  if (!zone || typeof zone !== 'string') return zone || '';
  if (language !== 'hi') return zone;

  const trimmed = zone.trim();
  if (RAILWAY_ZONES[trimmed]) return RAILWAY_ZONES[trimmed];

  // Handle slash combinations e.g. "WR / Northern Railway"
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/').map(p => translateRailwayZone(p.trim(), 'hi'));
    return parts.join(' / ');
  }

  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(RAILWAY_ZONES)) {
    if (key.toLowerCase() === lower) return val;
  }

  return trimmed;
}
