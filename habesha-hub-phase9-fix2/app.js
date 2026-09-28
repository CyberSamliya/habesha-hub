/* Habesha Hub directory application
 * Data: directory-data.js (window.HABESHA_LISTINGS, window.HABESHA_HOUSING, window.HABESHA_META)
 * Text: i18n.js (window.HH_I18N) plus the additions below.
 * No external scripts, no tracking, no network calls. Works from GitHub Pages and from file://.
 */
(function () {
  "use strict";

  // ---------- configuration ----------
  var CONTACT_EMAIL = "samra8293101@gmail.com"; // change here to move submissions to a dedicated inbox
  var SITE_URL = "https://cybersamliya.github.io/habesha-hub/";
  var GITHUB_ISSUES = "https://github.com/CyberSamliya/habesha-hub/issues/new/choose";
  var PAGE_SIZE = 48;
  var HOUSING_RECHECK_DAYS = 14, HOUSING_EXPIRE_DAYS = 45;

  var STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","District of Columbia","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"];
  var ABBR = {"Alabama":"AL","Alaska":"AK","Arizona":"AZ","Arkansas":"AR","California":"CA","Colorado":"CO","Connecticut":"CT","Delaware":"DE","District of Columbia":"DC","Florida":"FL","Georgia":"GA","Hawaii":"HI","Idaho":"ID","Illinois":"IL","Indiana":"IN","Iowa":"IA","Kansas":"KS","Kentucky":"KY","Louisiana":"LA","Maine":"ME","Maryland":"MD","Massachusetts":"MA","Michigan":"MI","Minnesota":"MN","Mississippi":"MS","Missouri":"MO","Montana":"MT","Nebraska":"NE","Nevada":"NV","New Hampshire":"NH","New Jersey":"NJ","New Mexico":"NM","New York":"NY","North Carolina":"NC","North Dakota":"ND","Ohio":"OH","Oklahoma":"OK","Oregon":"OR","Pennsylvania":"PA","Rhode Island":"RI","South Carolina":"SC","South Dakota":"SD","Tennessee":"TN","Texas":"TX","Utah":"UT","Vermont":"VT","Virginia":"VA","Washington":"WA","West Virginia":"WV","Wisconsin":"WI","Wyoming":"WY"};

  // Category order, label keys and search synonyms
  var CATEGORIES = [
    {id:"Restaurant", key:"cat1_t", schema:"Restaurant", words:"restaurant food eat dining"},
    {id:"Grocery", key:"cat2_t", schema:"GroceryStore", words:"grocery market store shop"},
    {id:"Shopping", key:"cat_shop_t", schema:"Store", words:"shopping store shop"},
    {id:"Church", key:"cat3_t", schema:"Church", words:"church faith worship congregation"},
    {id:"Beauty", key:"cat4_t", schema:"BeautySalon", words:"beauty personal care"},
    {id:"Auto", key:"cat5_t", schema:"AutoRepair", words:"auto car automotive"},
    {id:"Home", key:"cat6_t", schema:"HomeAndConstructionBusiness", words:"home services"},
    {id:"Professional", key:"cat7_t", schema:"ProfessionalService", words:"professional services"},
    {id:"Healthcare", key:"cat_health_t", schema:"MedicalBusiness", words:"health healthcare medical"},
    {id:"Childcare", key:"cat_child_t", schema:"ChildCare", words:"children child family kids"},
    {id:"Community", key:"cat_comm_t", schema:"Organization", words:"community organization"}
  ];
  var CAT_BY_ID = {}; CATEGORIES.forEach(function (c, i) { c.order = i; CAT_BY_ID[c.id] = c; });
  var DENOMS = {
    Orthodox: {key:"denom_orthodox_full", words:"orthodox tewahedo eotc"},
    Protestant: {key:"denom_protestant", words:"protestant evangelical pentecostal mekane yesus lutheran baptist"},
    Catholic: {key:"denom_catholic", words:"catholic ge'ez rite"}
  };
  var STATUS_ORDER = {"verified":0,"community":1,"needs-review":2,"temporarily-closed":3,"closed":8,"duplicate":9};
  var HIDDEN_STATUSES = {"closed":true,"duplicate":true};

  // ---------- extra interface text ----------
  var EXTRA = {
    nav_housing:{en:"Housing",am:"መኖሪያ ቤት"},
    hero_card_p2:{en:"Every listing shows where the information came from and when it was last checked. Nothing is invented to make a state look complete.",am:"እያንዳንዱ ዝርዝር መረጃው ከየት እንደመጣ እና መቼ እንደተረጋገጠ ያሳያል። አንድን ግዛት ሙሉ ለማስመሰል ምንም ነገር አይፈጠርም።"},
    stat_verified_label:{en:"verified with sources",am:"በምንጭ የተረጋገጡ"},
    stat_states_label:{en:"states with listings",am:"ዝርዝር ያላቸው ግዛቶች"},
    stat_cities_label:{en:"cities and metros",am:"ከተሞች"},
    community_p2:{en:"Choose a category, then narrow by state and city.",am:"ምድብ ይምረጡ፣ ከዚያም በግዛት እና በከተማ ያጥብቡ።"},
    cat1_d:{en:"Ethiopian food, coffee, bakeries and catering",am:"የኢትዮጵያ ምግብ፣ ቡና፣ ዳቦ ቤቶች እና ኬተሪንግ"},
    cat2_d:{en:"Injera, teff, spices, butchers and imports",am:"እንጀራ፣ ጤፍ፣ ቅመማ ቅመም፣ ስጋ ቤቶች እና ገቢ እቃዎች"},
    cat_shop_t:{en:"Clothing & Shopping",am:"ልብስ እና ግብይት"},cat_shop_d:{en:"Traditional clothing, jewelry and import stores",am:"የባህል ልብስ፣ ጌጣጌጥ እና የገቢ እቃ መደብሮች"},
    cat3_d:{en:"Orthodox, Protestant/Evangelical and Catholic",am:"ኦርቶዶክስ፣ ፕሮቴስታንት/ወንጌላዊ እና ካቶሊክ"},
    cat4_d:{en:"Hair, braiding, makeup and wedding beauty",am:"ፀጉር፣ ሹሩባ፣ ሜካፕ እና የሰርግ ውበት"},
    cat5_d:{en:"Repair, body shops, tires and transport",am:"ጥገና፣ የአካል ጥገና፣ ጎማ እና ትራንስፖርት"},
    cat6_d:{en:"Contractors, cleaning, moving and repair",am:"ኮንትራክተሮች፣ ጽዳት፣ እቃ ማጓጓዝ እና ጥገና"},
    cat7_d:{en:"Legal, tax, real estate, insurance and IT",am:"ህግ፣ ግብር፣ ሪል እስቴት፣ ኢንሹራንስ እና IT"},
    cat_health_t:{en:"Healthcare",am:"ጤና"},cat_health_d:{en:"Doctors, dentists, pharmacies and home care",am:"ሐኪሞች፣ የጥርስ ሐኪሞች፣ ፋርማሲዎች እና የቤት እንክብካቤ"},
    cat_child_t:{en:"Children & Family",am:"ልጆች እና ቤተሰብ"},cat_child_d:{en:"Childcare, tutoring and Amharic classes",am:"የልጆች እንክብካቤ፣ ማጠናከሪያ ትምህርት እና የአማርኛ ትምህርት"},
    cat_comm_t:{en:"Community & Culture",am:"ማህበረሰብ እና ባህል"},cat_comm_d:{en:"Associations, nonprofits, youth and sports",am:"ማህበራት፣ በጎ አድራጎት ድርጅቶች፣ ወጣቶች እና ስፖርት"},
    cat_house_t:{en:"Housing",am:"መኖሪያ ቤት"},cat_house_d:{en:"Rooms, roommates and rentals (dated listings)",am:"ክፍሎች፣ አብሮ ተከራዮች እና ኪራዮች (ቀን ያላቸው)"},
    f_what:{en:"What",am:"ምን"},f_state:{en:"State",am:"ግዛት"},f_city:{en:"City / metro",am:"ከተማ"},f_category:{en:"Category",am:"ምድብ"},f_denomination:{en:"Church tradition",am:"የቤተክርስቲያን ትውፊት"},
    dir_search_placeholder2:{en:"Name, service, city or ZIP",am:"ስም፣ አገልግሎት፣ ከተማ ወይም ZIP"},
    choose_state_first:{en:"Choose a state first",am:"መጀመሪያ ግዛት ይምረጡ"},
    all_cities_opt:{en:"All cities",am:"ሁሉም ከተሞች"},
    all_church_opt2:{en:"All Ethiopian churches",am:"ሁሉም የኢትዮጵያ አብያተ ክርስቲያናት"},
    denom_orthodox_full:{en:"Ethiopian Orthodox Tewahedo",am:"የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ"},
    denom_unconfirmed:{en:"Tradition not yet confirmed",am:"ትውፊቱ ገና አልተረጋገጠም"},
    verified_only:{en:"Show verified listings only",am:"የተረጋገጡትን ብቻ አሳይ"},
    copy_link:{en:"Copy link to these results",am:"የእነዚህን ውጤቶች ሊንክ ቅዳ"},
    link_copied:{en:"Link copied",am:"ሊንኩ ተቀድቷል"},
    show_more:{en:"Show more",am:"ተጨማሪ አሳይ"},
    call_btn:{en:"Call",am:"ይደውሉ"},
    website_btn:{en:"Website",am:"ድህረ ገጽ"},
    directions_btn:{en:"Directions",am:"አቅጣጫ"},
    map_btn:{en:"Map search",am:"በካርታ ፈልግ"},
    report_btn:{en:"Report correction",am:"እርማት ያሳውቁ"},
    claim_btn:{en:"Claim this listing",am:"ይህን ዝርዝር ይጠይቁ"},
    last_checked:{en:"Last checked",am:"ለመጨረሻ ጊዜ የተረጋገጠው"},
    not_checked:{en:"Not yet checked",am:"ገና አልተረጋገጠም"},
    source_link:{en:"Source",am:"ምንጭ"},
    source2_link:{en:"2nd source",am:"2ኛ ምንጭ"},
    listings_word:{en:"listings",am:"ዝርዝሮች"},
    all_states_btn:{en:"Show all 50 states + DC",am:"ሁሉንም 50 ግዛቶች እና ዲሲ አሳይ"},
    states_with:{en:"with listings",am:"ዝርዝር ያላቸው"},
    state_pages_h:{en:"Ethiopian community by state",am:"የኢትዮጵያ ማህበረሰብ በግዛት"},
    state_page_link:{en:"State page:",am:"የግዛት ገጽ፡"},
    no_listings_state:{en:"No verified community listings yet.",am:"እስካሁን የተረጋገጡ የማህበረሰብ ዝርዝሮች የሉም።"},
    state_none2:{en:"Habesha Hub has not confirmed any listings for this state yet. If you know an Ethiopian or Habesha business, church or organization here, please submit it for review.",am:"ሐበሻ ማዕከል ለዚህ ግዛት እስካሁን ምንም ዝርዝር አላረጋገጠም። እዚህ የኢትዮጵያ ወይም የሐበሻ ንግድ፣ ቤተ ክርስቲያን ወይም ድርጅት ካወቁ እባክዎ ለግምገማ ያስገቡ።"},
    cities_h:{en:"Cities and metros",am:"ከተሞች"},
    categories_h:{en:"Categories",am:"ምድቦች"},
    states_p2:{en:"All 50 states and Washington, DC. States without listings say so honestly instead of showing placeholder results.",am:"ሁሉም 50 ግዛቶች እና ዋሽንግተን ዲሲ። ዝርዝር የሌላቸው ግዛቶች ባዶ ውጤት ከማሳየት ይልቅ በግልጽ ይናገራሉ።"},
    housing_eyebrow:{en:"Rooms, roommates & rentals",am:"ክፍሎች፣ አብሮ ተከራዮች እና ኪራዮች"},
    housing_h2:{en:"Community housing board",am:"የማህበረሰብ የመኖሪያ ቤት ሰሌዳ"},
    housing_p:{en:"Housing posts change quickly. Each post shows when it was posted and last checked, and older posts are marked for recheck or expired automatically.",am:"የመኖሪያ ቤት ማስታወቂያዎች በፍጥነት ይቀየራሉ። እያንዳንዱ ማስታወቂያ መቼ እንደተለጠፈ እና መቼ እንደተረጋገጠ ያሳያል፤ የቆዩ ማስታወቂያዎች በራስ-ሰር ምልክት ይደረግባቸዋል።"},
    housing_submit:{en:"Submit a housing post",am:"የመኖሪያ ቤት ማስታወቂያ ያስገቡ"},
    h_active:{en:"Active",am:"ንቁ"},h_recheck:{en:"Needs recheck",am:"እንደገና መረጋገጥ ያስፈልገዋል"},h_expired:{en:"Expired",am:"ጊዜው አልፏል"},
    h_active_p:{en:"Checked within the last 14 days and not past its end date.",am:"ባለፉት 14 ቀናት ውስጥ የተረጋገጠ።"},
    h_recheck_p:{en:"Last checked 15 to 45 days ago. Confirm with the poster before making plans.",am:"ከ15 እስከ 45 ቀናት በፊት የተረጋገጠ። እቅድ ከማውጣትዎ በፊት ከለጣፊው ጋር ያረጋግጡ።"},
    h_expired_p:{en:"Older than 45 days or past its end date. Hidden unless you choose to show it.",am:"ከ45 ቀናት በላይ የቆየ። እርስዎ ካልመረጡ አይታይም።"},
    show_expired:{en:"Show expired posts",am:"ጊዜው ያለፈባቸውን አሳይ"},
    housing_empty:{en:"No current housing posts for this area. Housing posts are only published after review, with the date posted and date last checked.",am:"ለዚህ አካባቢ የአሁን የመኖሪያ ቤት ማስታወቂያዎች የሉም።"},
    safety_strong:{en:"Safety:",am:"ደህንነት፦"},
    housing_safety:{en:"Habesha Hub never publishes a private home address. Contact details appear only when the poster asked for them to be public. Never send a deposit before seeing a place and meeting the landlord or roommate.",am:"ሐበሻ ማዕከል የግል የቤት አድራሻ አያወጣም። የመገናኛ ዝርዝሮች የሚታዩት ለጣፊው ይፋ እንዲሆኑ ሲፈልግ ብቻ ነው። ቤቱን ሳያዩ እና አከራዩን ሳያገኙ ቅድመ ክፍያ አይላኩ።"},
    rent_word:{en:"Rent",am:"ኪራይ"},posted_word:{en:"Posted",am:"የተለጠፈው"},contact_word:{en:"Contact",am:"መገናኛ"},
    review_note:{en:"Every submission is reviewed first. New listings appear as \"Needs verification\" or \"Community listed\" and only become \"Verified\" after the details are confirmed against a public source.",am:"እያንዳንዱ ማመልከቻ መጀመሪያ ይገመገማል። አዲስ ዝርዝሮች በምንጭ ከተረጋገጡ በኋላ ብቻ \"የተረጋገጠ\" ይሆናሉ።"},
    about3_p:{en:"Verified: confirmed against a current official or reliable public source. Community listed: publicly listed but not yet independently confirmed. Needs verification: details incomplete or conflicting. Closed and duplicate records are kept for auditing but hidden from search.",am:"የተረጋገጠ፦ ከአሁኑ ኦፊሴላዊ ወይም አስተማማኝ ምንጭ ጋር የተረጋገጠ። በማህበረሰብ የተዘረዘረ፦ በይፋ የተዘረዘረ ግን ገና ያልተረጋገጠ። ማረጋገጫ ያስፈልገዋል፦ ያልተሟላ ወይም የሚጋጭ መረጃ።"},
    data_updated:{en:"Directory data updated",am:"የማውጫ መረጃ የተሻሻለው"},
    github_alt:{en:"Have a GitHub account? You can also open a review request on GitHub.",am:"የGitHub መለያ ካለዎት በGitHub ላይም ማስገባት ይችላሉ።"},
    c_bus_t:{en:"Add a business",am:"ንግድ ጨምር"},c_bus_d:{en:"Restaurant, grocery, salon, mechanic, contractor or other business.",am:"ምግብ ቤት፣ ገበያ፣ የውበት ሳሎን፣ መካኒክ ወይም ሌላ ንግድ።"},
    c_church_t:{en:"Add a church",am:"ቤተ ክርስቲያን ጨምር"},c_church_d:{en:"Include the tradition: Orthodox, Protestant/Evangelical or Catholic.",am:"ትውፊቱን ያካትቱ፦ ኦርቶዶክስ፣ ፕሮቴስታንት/ወንጌላዊ ወይም ካቶሊክ።"},
    c_pro_t:{en:"Add a professional",am:"ባለሙያ ጨምር"},c_pro_d:{en:"Lawyer, doctor, accountant, realtor or other licensed professional.",am:"ጠበቃ፣ ሐኪም፣ የሂሳብ ባለሙያ ወይም ሌላ ፈቃድ ያለው ባለሙያ።"},
    c_org_t:{en:"Add an organization",am:"ድርጅት ጨምር"},c_org_d:{en:"Association, nonprofit, youth group, soccer club or school program.",am:"ማህበር፣ በጎ አድራጎት፣ የወጣቶች ቡድን ወይም የእግር ኳስ ክለብ።"},
    c_house_t:{en:"Add housing",am:"መኖሪያ ቤት ጨምር"},c_house_d:{en:"Room, roommate or rental. General area only, no home address.",am:"ክፍል፣ አብሮ ተከራይ ወይም ኪራይ። አጠቃላይ አካባቢ ብቻ።"},
    c_fix_t:{en:"Report incorrect information",am:"የተሳሳተ መረጃ ያሳውቁ"},c_fix_d:{en:"Closed, moved, wrong phone or wrong category.",am:"የተዘጋ፣ የተዛወረ፣ የተሳሳተ ስልክ ወይም ምድብ።"},
    c_claim_t:{en:"Claim this business",am:"ንግድዎን ይጠይቁ"},c_claim_d:{en:"Owners can confirm and update their own listing.",am:"ባለቤቶች የራሳቸውን ዝርዝር ማረጋገጥ እና ማዘመን ይችላሉ።"},
    c_event_t:{en:"Submit an event",am:"ዝግጅት ያስገቡ"},c_event_d:{en:"Community, cultural, church or family events.",am:"የማህበረሰብ፣ የባህል፣ የቤተክርስቲያን ወይም የቤተሰብ ዝግጅቶች።"},
    shown_of:{en:"of",am:"ከ"},
    sort_note:{en:"Verified listings are shown first in each city.",am:"የተረጋገጡ ዝርዝሮች በእያንዳንዱ ከተማ መጀመሪያ ይታያሉ።"}
  };
  var I18N = {}; var base = window.HH_I18N || {};
  Object.keys(base).forEach(function (k) { I18N[k] = base[k]; });
  Object.keys(EXTRA).forEach(function (k) { I18N[k] = EXTRA[k]; });

  // ---------- storage (never let a blocked storage API break the page) ----------
  function storeGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function storeSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignore */ } }

  var LANG = storeGet("hh_lang") === "am" ? "am" : "en";
  function t(k) { var e = I18N[k]; if (!e) return k; return e[LANG] || e.en; }

  // ---------- data ----------
  var ALL = Array.isArray(window.HABESHA_LISTINGS) ? window.HABESHA_LISTINGS : [];
  var HOUSING = Array.isArray(window.HABESHA_HOUSING) ? window.HABESHA_HOUSING : [];
  var META = window.HABESHA_META || {};
  var STATUS_LABELS = window.HABESHA_STATUS_LABELS || {};
  if (!ALL.length) console.error("Habesha Hub directory data did not load.");
  var LISTINGS = ALL.filter(function (x) { return !HIDDEN_STATUSES[x.status]; });

  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "").replace(/[^a-z0-9ሀ-፿]+/g, " ").trim();
  }
  function stem(w) {
    if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + "y";
    if (w.length > 4 && /(ches|shes|xes|sses)$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
    return w;
  }
  // Query-time synonyms: a token matches if the listing text contains the token or any synonym.
  var SYN = {lawyer:["attorney","law "],attorney:["lawyer","law "],legal:["lawyer","attorney","law "],doctor:["physician","medical","clinic"," md "],physician:["doctor","medical"],
    cafe:["coffee","buna","cafe"],coffee:["cafe","buna"],buna:["coffee","cafe"],barber:["barbershop"],barbershop:["barber"],hair:["salon","barber","braid"],
    mechanic:["auto repair","automotive"],grocery:["market","mart","store"],market:["grocery","mart"],store:["market","mart","shop"],
    restaurant:["cuisine","kitchen","cafe","carryout"],church:["cathedral","fellowship","mekane yesus"],cathedral:["church"],
    daycare:["childcare","child care"],childcare:["daycare","child care"],tax:["accounting","accountant"],realtor:["real estate"],injera:["bakery","injera"]};
  function tokMatch(hay, tok) {
    if (hay.indexOf(tok) > -1) return true;
    var alts = SYN[tok]; if (!alts) return false;
    for (var i = 0; i < alts.length; i++) if (hay.indexOf(alts[i]) > -1) return true;
    return false;
  }
  var STOP = {"in":1,"near":1,"the":1,"and":1,"of":1,"me":1,"a":1,"an":1,"for":1,"at":1,"around":1};
  LISTINGS.forEach(function (x) {
    var c = CAT_BY_ID[x.category], d = DENOMS[x.denomination];
    x._hay = " " + norm([x.name, x.metro, (x.altNames || []).join(" "), x.category, c ? c.words + " " + I18N[c.key].en : "", x.subcategory, d ? d.words + " " + I18N[d.key].en : "", x.city, x.state, ABBR[x.state], x.zip, x.address, (x.keywords || []).join(" "), "ethiopian habesha abyssinian"].join(" ")) + " ";
  });

  // ---------- helpers ----------
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (m) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]; }); }
  function httpUrl(u) { return typeof u === "string" && /^https?:\/\//i.test(u) ? u : ""; }
  function telHref(p) { var d = String(p || "").replace(/[^0-9+]/g, ""); if (d.length === 10) d = "+1" + d; else if (d.length === 11 && d[0] === "1") d = "+" + d; return d.length >= 11 ? "tel:" + d : ""; }
  function $(id) { return document.getElementById(id); }
  // A listing's "area" is its metro (e.g. Columbus for Whitehall) when set, otherwise its city.
  function area(x) { return x.metro || x.city; }
  function catLabel(id) { var c = CAT_BY_ID[id]; return c ? t(c.key) : id; }
  function denomLabel(d) { return DENOMS[d] ? t(DENOMS[d].key) : ""; }
  function fmtDate(iso) {
    if (!iso) return "";
    var p = String(iso).split("-"); if (p.length !== 3) return iso;
    var dt = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    try { return dt.toLocaleDateString(LANG === "am" ? "am-ET" : "en-US", {year:"numeric", month:"short", day:"numeric", timeZone:"UTC"}); } catch (e) { return iso; }
  }
  function cityLine(x) { return [x.city, (ABBR[x.state] || x.state) + (x.zip ? " " + x.zip : "")].filter(Boolean).join(", "); }
  function mailto(subject, body) { return "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body); }
  function mapsHref(x) {
    if (httpUrl(x.mapsUrl)) return x.mapsUrl;
    var q = x.address ? x.name + ", " + x.address + ", " + cityLine(x) : x.name + " " + x.city + " " + x.state;
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
  }
  function statusLabel(s) { var l = STATUS_LABELS[s]; if (!l) return s; return typeof l === "string" ? l : (l[LANG] || l.en); }

  // ---------- filter state ----------
  var el = {q:$("q"), state:$("dirState"), city:$("dirCity"), cat:$("dirCategory"), denom:$("dirDenomination"), denomWrap:$("denomWrap"), verified:$("verifiedOnly"), grid:$("listingGrid"), meta:$("resultMeta"), more:$("showMore")};
  var shown = PAGE_SIZE;

  function fillCities() {
    var state = el.state.value, prev = el.city.value;
    if (!state) { el.city.innerHTML = '<option value="">' + esc(t("choose_state_first")) + "</option>"; el.city.disabled = true; return; }
    var counts = {};
    LISTINGS.forEach(function (x) { if (x.state === state) counts[area(x)] = (counts[area(x)] || 0) + 1; });
    var cities = Object.keys(counts).sort();
    el.city.innerHTML = '<option value="">' + esc(t("all_cities_opt")) + (cities.length ? "" : " (0)") + "</option>" + cities.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + " (" + counts[c] + ")</option>"; }).join("");
    el.city.disabled = !cities.length;
    el.city.value = counts[prev] ? prev : "";
  }
  function syncDenomVisibility() {
    var isChurch = el.cat.value === "Church";
    el.denomWrap.classList.toggle("hidden", !isChurch);
    if (!isChurch) el.denom.value = "";
  }

  function tokens(term) {
    return norm(term).split(" ").filter(function (w) { return w && !STOP[w]; }).map(stem);
  }
  function currentRows() {
    var toks = tokens(el.q.value), state = el.state.value, city = el.city.value, cat = el.cat.value, denom = el.denom.value, vOnly = el.verified.checked;
    return LISTINGS.filter(function (x) {
      if (state && x.state !== state) return false;
      if (city && area(x) !== city) return false;
      if (cat && x.category !== cat) return false;
      if (denom && x.denomination !== denom) return false;
      if (vOnly && x.status !== "verified") return false;
      for (var i = 0; i < toks.length; i++) if (!tokMatch(x._hay, toks[i])) return false;
      return true;
    }).sort(function (a, b) {
      return (state ? 0 : a.state.localeCompare(b.state)) || area(a).localeCompare(area(b)) ||
        (CAT_BY_ID[a.category] ? CAT_BY_ID[a.category].order : 99) - (CAT_BY_ID[b.category] ? CAT_BY_ID[b.category].order : 99) ||
        (STATUS_ORDER[a.status] || 5) - (STATUS_ORDER[b.status] || 5) || a.name.localeCompare(b.name);
    });
  }

  function card(x) {
    var c = CAT_BY_ID[x.category], isChurch = x.category === "Church";
    var typeLine = catLabel(x.category) + (isChurch ? " · " + (x.denomination ? denomLabel(x.denomination) : t("denom_unconfirmed")) : "") + (x.subcategory && !isChurch ? " · " + x.subcategory : "");
    var limited = x.privacy === "limited";
    var addr = limited || !x.address ? esc(cityLine(x)) : esc(x.address) + "<br>" + esc(cityLine(x));
    var tel = telHref(x.phone), web = httpUrl(x.website), soc = httpUrl(x.social), src = httpUrl(x.source), src2 = httpUrl(x.secondSource);
    var checked = x.verifiedDate ? t("last_checked") + " " + esc(fmtDate(x.verifiedDate)) : t("not_checked");
    var srcLinks = (src ? ' · <a href="' + esc(src) + '" target="_blank" rel="noopener nofollow">' + esc(t("source_link")) + "</a>" : "") + (src2 ? ' · <a href="' + esc(src2) + '" target="_blank" rel="noopener nofollow">' + esc(t("source2_link")) + "</a>" : "");
    var fixBody = "Listing ID: " + x.id + "\nName: " + x.name + "\nCity/State: " + x.city + ", " + x.state + "\n\nWhat is incorrect? (closed, moved, phone, website, category, church tradition, other)\n\nCorrect information:\n\nHow do you know? (link to official website, Google Maps, or your relationship to the business)\n";
    var claimBody = "Listing ID: " + x.id + "\nName: " + x.name + "\n\nYour name:\nYour role (owner, manager, pastor, board member):\nBusiness phone or email we can use to confirm:\n\nUpdates you would like to make:\n";
    var actions = [];
    if (tel) actions.push('<a class="pri" href="' + esc(tel) + '" aria-label="' + esc(t("call_btn") + " " + x.name) + '">' + esc(t("call_btn")) + "</a>");
    if (web) actions.push('<a class="sec" href="' + esc(web) + '" target="_blank" rel="noopener" aria-label="' + esc(t("website_btn") + ": " + x.name) + '">' + esc(t("website_btn")) + "</a>");
    else if (soc) actions.push('<a class="sec" href="' + esc(soc) + '" target="_blank" rel="noopener">' + esc(t("website_btn")) + "</a>");
    if (!limited) actions.push('<a class="sec" href="' + esc(mapsHref(x)) + '" target="_blank" rel="noopener" aria-label="' + esc((x.address ? t("directions_btn") : t("map_btn")) + ": " + x.name) + '">' + esc(x.address ? t("directions_btn") : t("map_btn")) + "</a>");
    var minor = '<a class="minor" href="' + esc(mailto("Habesha Hub correction: " + x.name + " [" + x.id + "]", fixBody)) + '">' + esc(t("report_btn")) + "</a>";
    if (!isChurch && x.category !== "Community") minor += ' <a class="minor" href="' + esc(mailto("Habesha Hub claim: " + x.name + " [" + x.id + "]", claimBody)) + '">' + esc(t("claim_btn")) + "</a>";
    return '<article class="listing" id="l-' + esc(x.id) + '">' +
      '<span class="type">' + esc(typeLine) + "</span>" +
      "<h3>" + esc(x.name) + "</h3>" +
      "<address>" + addr + "</address>" +
      (x.phone && !limited ? '<p><a href="' + esc(tel) + '">' + esc(x.phone) + "</a></p>" : "") +
      (x.publicNote ? '<p class="note">' + esc(x.publicNote) + "</p>" : "") +
      '<div><span class="badge s-' + esc(x.status) + '">' + esc(statusLabel(x.status)) + "</span></div>" +
      '<span class="meta-line">' + checked + srcLinks + "</span>" +
      '<div class="listing-actions">' + actions.join("") + "</div>" +
      '<div class="listing-actions">' + minor + "</div>" +
      "</article>";
  }

  function renderListings(resetPaging) {
    if (resetPaging) shown = PAGE_SIZE;
    var rows = currentRows(), state = el.state.value, city = el.city.value, cat = el.cat.value, denom = el.denom.value;
    var parts = [];
    if (city) parts.push(city); if (state) parts.push(state);
    var desc = rows.length + " " + (rows.length === 1 ? t("listing_shown_singular") : t("listing_shown_plural")) +
      (parts.length ? " " + t("in_word") + " " + parts.join(", ") : "") + (cat ? " · " + catLabel(cat) : "") + (denom ? " · " + denomLabel(denom) : "") + ".";
    el.meta.textContent = desc + (rows.length > 1 ? " " + t("sort_note") : "");
    if (!rows.length) {
      var s = state ? state : "";
      el.grid.innerHTML = '<div class="empty"><strong>' + esc(state && !LISTINGS.some(function (x) { return x.state === state; }) ? t("no_listings_state") : t("empty_title")) + "</strong><br>" + esc(t("empty_body")) + '<br><br><a href="#contribute">' + esc(t("add_listing_btn")) + (s ? " · " + esc(s) : "") + "</a></div>";
      el.more.classList.add("hidden");
    } else {
      var html = "", lastGroup = null, slice = rows.slice(0, shown);
      var groupCounts = {};
      rows.forEach(function (x) { var g = state ? area(x) : x.state; groupCounts[g] = (groupCounts[g] || 0) + 1; });
      slice.forEach(function (x) {
        var g = state ? area(x) : x.state;
        if (g !== lastGroup) { html += '<h3 class="city-group">' + esc(state ? area(x) + ", " + (ABBR[x.state] || "") + (x.metro ? " area" : "") : x.state) + "<small>" + groupCounts[g] + " " + esc(t("listings_word")) + "</small></h3>"; lastGroup = g; }
        html += card(x);
      });
      el.grid.innerHTML = html;
      el.more.classList.toggle("hidden", rows.length <= shown);
      el.more.textContent = t("show_more") + " (" + (rows.length - Math.min(shown, rows.length)) + ")";
    }
    updateUrlAndTitle();
    renderHousing();
  }

  // ---------- URL, title (shareable + crawlable filter states) ----------
  var BASE_TITLE = document.title;
  function updateUrlAndTitle() {
    var p = new URLSearchParams();
    if (el.q.value.trim()) p.set("q", el.q.value.trim());
    if (el.state.value) p.set("state", el.state.value);
    if (el.city.value) p.set("city", el.city.value);
    if (el.cat.value) p.set("category", el.cat.value);
    if (el.denom.value) p.set("denomination", el.denom.value);
    if (el.verified.checked) p.set("verified", "1");
    var qs = p.toString();
    try { history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash); } catch (e) { /* file:// in some browsers */ }
    if (!qs) { document.title = BASE_TITLE; return; }
    var what = el.denom.value ? I18N[DENOMS[el.denom.value].key].en + " churches" : el.cat.value ? "Ethiopian " + I18N[CAT_BY_ID[el.cat.value].key].en : "Ethiopian & Habesha listings";
    var where = [el.city.value, el.state.value].filter(Boolean).join(", ");
    document.title = what + (where ? " in " + where : "") + " | Habesha Hub";
  }
  function readUrl() {
    var p;
    try { p = new URLSearchParams(location.search); } catch (e) { return; }
    if (p.get("q")) el.q.value = p.get("q");
    var st = p.get("state"); if (st && STATES.indexOf(st) > -1) el.state.value = st;
    fillCities();
    var ct = p.get("city"); if (ct) { el.city.value = ct; if (el.city.value !== ct) el.city.value = ""; }
    var denom = p.get("denomination");
    var cat = p.get("category"); if (denom && DENOMS[denom]) cat = "Church";
    if (cat && CAT_BY_ID[cat]) el.cat.value = cat;
    syncDenomVisibility();
    if (denom && DENOMS[denom]) el.denom.value = denom;
    if (p.get("verified") === "1") el.verified.checked = true;
  }

  // Interpret free text like "orthodox church" or "barber" as filters where unambiguous.
  function applyIntent(term) {
    var toks = tokens(term), rest = [], cat = "", denom = "";
    var catWord = {restaurant:"Restaurant",grocery:"Grocery",church:"Church",beauty:"Beauty",healthcare:"Healthcare",childcare:"Childcare",shopping:"Shopping",clothing:"Shopping",community:"Community",auto:"Auto"};
    var denomWord = {orthodox:"Orthodox",tewahedo:"Orthodox",evangelical:"Protestant",protestant:"Protestant",catholic:"Catholic"};
    toks.forEach(function (w) {
      if (denomWord[w]) { denom = denomWord[w]; cat = "Church"; }
      else if (catWord[w] && (!cat || cat === catWord[w])) cat = catWord[w];
      else if (w !== "ethiopian" && w !== "habesha") rest.push(w);
    });
    return {q: rest.join(" "), cat: cat, denom: denom};
  }

  // ---------- state explorer ----------
  function stateSlug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function renderState() {
    var state = $("stateExplorer").value, rows = LISTINGS.filter(function (x) { return x.state === state; });
    var cities = {}, cats = {};
    rows.forEach(function (x) { cities[area(x)] = (cities[area(x)] || 0) + 1; cats[x.category] = (cats[x.category] || 0) + 1; });
    var html = '<h3 class="state-title">' + esc(state) + "</h3>";
    if (!rows.length) {
      html += "<p><strong>" + esc(t("no_listings_state")) + "</strong> " + esc(t("state_none2")) + "</p>";
    } else {
      html += "<p><strong>" + rows.length + "</strong> " + esc(rows.length === 1 ? t("state_listing_singular") : t("state_listing_plural")) + ".</p>";
      html += "<strong>" + esc(t("cities_h")) + '</strong><div class="chips">' + Object.keys(cities).sort().map(function (c) { return '<button type="button" class="chip" data-city="' + esc(c) + '">' + esc(c) + " (" + cities[c] + ")</button>"; }).join("") + "</div>";
      html += "<strong>" + esc(t("categories_h")) + '</strong><div class="chips">' + CATEGORIES.filter(function (c) { return cats[c.id]; }).map(function (c) { return '<button type="button" class="chip" data-cat="' + c.id + '">' + esc(t(c.key)) + " (" + cats[c.id] + ")</button>"; }).join("") + "</div>";
    }
    html += '<div class="quicklinks">' + (rows.length ? '<a href="' + stateSlug(state) + '.html">' + esc(t("state_page_link")) + " " + esc(state) + "</a>" : "") + '<a href="#directory" id="seeState">' + esc(t("view_directory")) + '</a><a href="' + esc(mailto("Habesha Hub listing for " + state, "State: " + state + "\nCity:\nName:\nCategory:\nAddress:\nPhone:\nWebsite or social page:\nHow is it connected to the Ethiopian/Habesha community?\n")) + '">' + esc(t("add_state_listing")) + " " + esc(state) + '</a><a href="https://www.fns.usda.gov/snap/state-directory" target="_blank" rel="noopener">' + esc(t("official_snap")) + '</a><a href="https://www.hud.gov/states" target="_blank" rel="noopener">' + esc(t("hud_resources")) + "</a></div>";
    var box = $("stateSummary"); box.innerHTML = html;
    function go(city, cat) {
      el.state.value = state; fillCities(); el.city.value = city || ""; el.cat.value = cat || ""; syncDenomVisibility(); el.q.value = "";
      renderListings(true); $("directory").scrollIntoView();
    }
    $("seeState").addEventListener("click", function () { go("", ""); });
    box.querySelectorAll("[data-city]").forEach(function (b) { b.addEventListener("click", function () { go(b.getAttribute("data-city"), ""); }); });
    box.querySelectorAll("[data-cat]").forEach(function (b) { b.addEventListener("click", function () { go("", b.getAttribute("data-cat")); }); });
    $("coverageGrid").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-state") === state ? "true" : "false"); });
  }
  function renderCoverage() {
    var counts = {}; LISTINGS.forEach(function (x) { counts[x.state] = (counts[x.state] || 0) + 1; });
    var withListings = STATES.filter(function (s) { return counts[s]; }).length;
    if ($("coverageCount")) $("coverageCount").textContent = withListings + " / " + STATES.length + " " + t("states_with");
    $("coverageGrid").innerHTML = STATES.map(function (s) {
      var n = counts[s] || 0;
      return '<button type="button" data-state="' + esc(s) + '" class="' + (n ? "has" : "") + '" aria-pressed="false">' + esc(s) + "<span>" + (n ? n + " " + esc(t("listings_word")) : esc(t("no_listings_state"))) + "</span></button>";
    }).join("");
    $("coverageGrid").querySelectorAll("button").forEach(function (b) { b.addEventListener("click", function () { $("stateExplorer").value = b.getAttribute("data-state"); renderState(); $("stateSummary").scrollIntoView({block:"nearest"}); }); });
  }

  // ---------- housing ----------
  function daysSince(iso, today) { var p = String(iso || "").split("-"); if (p.length !== 3) return Infinity; return Math.floor((today - Date.UTC(+p[0], +p[1] - 1, +p[2])) / 86400000); }
  function housingStatus(h, today) {
    if (h.expires && daysSince(h.expires, today) > 0) return "expired";
    var d = daysSince(h.dateLastChecked || h.datePosted, today);
    if (d > HOUSING_EXPIRE_DAYS) return "expired";
    if (d > HOUSING_RECHECK_DAYS) return "recheck";
    return "active";
  }
  function renderHousing() {
    var now = new Date(), today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    var showExp = $("showExpired").checked, state = el.state.value, city = el.city.value;
    var rows = HOUSING.map(function (h) { return {h: h, s: housingStatus(h, today)}; }).filter(function (r) {
      return (showExp || r.s !== "expired") && (!state || r.h.state === state) && (!city || (r.h.metro || r.h.city) === city);
    });
    var label = {active: t("h_active"), recheck: t("h_recheck"), expired: t("h_expired")};
    $("housingMeta").textContent = rows.length + " " + t("listings_word") + (state ? " " + t("in_word") + " " + [city, state].filter(Boolean).join(", ") : "") + ".";
    $("housingGrid").innerHTML = rows.length ? rows.map(function (r) {
      var h = r.h, src = httpUrl(h.sourceUrl);
      return '<article class="listing"><span class="type">' + esc(h.type || "") + '</span><h3>' + esc(h.title || "") + "</h3><p>" + esc([h.area, h.city, ABBR[h.state]].filter(Boolean).join(", ")) + "</p>" +
        (h.rent ? "<p><strong>" + esc(t("rent_word")) + ":</strong> " + esc(h.rent) + "</p>" : "") +
        "<p>" + esc(t("posted_word")) + " " + esc(fmtDate(h.datePosted)) + " · " + esc(t("last_checked")) + " " + esc(fmtDate(h.dateLastChecked)) + "</p>" +
        (h.contact ? "<p><strong>" + esc(t("contact_word")) + ":</strong> " + esc(h.contact) + "</p>" : "") +
        '<div><span class="status-pill ' + r.s + '">' + esc(label[r.s]) + "</span></div>" +
        (src ? '<span class="meta-line"><a href="' + esc(src) + '" target="_blank" rel="noopener nofollow">' + esc(t("source_link")) + (h.source ? ": " + esc(h.source) : "") + "</a></span>" : "") + "</article>";
    }).join("") : '<div class="empty">' + esc(t("housing_empty")) + "</div>";
  }

  // ---------- contribution links ----------
  var LISTING_FORM = "Name:\nCategory (restaurant, grocery, salon, mechanic, lawyer, doctor, childcare, etc.):\nStreet address (businesses only):\nCity:\nState:\nZIP:\nPhone (business line only):\nWebsite or official social page:\nHow is it Ethiopian/Habesha-owned or community-serving? (link if possible):\nYour relationship (owner, customer, member):\n";
  var CONTRIB = [
    {k:"c_bus", subj:"Add a Business", body: LISTING_FORM},
    {k:"c_church", subj:"Add a Church", body:"Church name:\nTradition (Ethiopian Orthodox Tewahedo / Protestant or Evangelical / Catholic):\nHow do you know the tradition? (church website, diocese or fellowship listing):\nStreet address:\nCity:\nState:\nZIP:\nChurch phone:\nWebsite or official social page:\n"},
    {k:"c_pro", subj:"Add a Professional", body:"Name and business name:\nProfession (lawyer, doctor, accountant, realtor...):\nLicense number or licensing board link (if licensed):\nOffice address:\nCity:\nState:\nOffice phone:\nWebsite:\nLanguages (Amharic, Tigrinya, Afaan Oromo...):\nPermission: I am this professional or have their permission to list them (yes/no):\n"},
    {k:"c_org", subj:"Add a Community Organization", body:"Organization name:\nType (association, nonprofit, youth, student, professional, soccer club, festival):\nCity:\nState:\nWebsite or official social page:\nPublic contact email or phone:\n"},
    {k:"c_house", subj:"Add Housing", body:"Type (room for rent / roommate wanted / room to share / apartment / house):\nCity:\nState:\nGeneral area or neighborhood (NO street address):\nMonthly rent:\nPrivate or shared room:\nDate available:\nDate posted:\nContact method you want PUBLIC (e.g., 'message on WhatsApp group X' or a business phone):\nOriginal post link (if any):\nI am the person offering this housing or have their permission (yes/no):\n"},
    {k:"c_fix", subj:"Correction", body:"Listing name:\nCity and state:\nWhat is incorrect? (closed, moved, phone, website, category, church tradition, duplicate):\nCorrect information:\nSource link:\n"},
    {k:"c_claim", subj:"Claim a Business", body:"Business name:\nCity and state:\nYour name and role:\nBusiness phone or email we can use to confirm:\nUpdates:\n"},
    {k:"c_event", subj:"Submit an Event", body:"Event name:\nDate and time:\nVenue and city:\nOrganizer:\nPublic link:\n"}
  ];
  function renderContrib() {
    $("contribGrid").innerHTML = CONTRIB.map(function (c) {
      return '<a class="contrib" href="' + esc(mailto("Habesha Hub - " + c.subj, c.body)) + '"><strong>' + esc(t(c.k + "_t")) + "</strong><span>" + esc(t(c.k + "_d")) + "</span></a>";
    }).join("") + '<a class="contrib" href="' + GITHUB_ISSUES + '" target="_blank" rel="noopener"><strong>GitHub</strong><span>' + esc(t("github_alt")) + "</span></a>";
    $("housingSubmit").href = mailto("Habesha Hub - Add Housing", CONTRIB[4].body);
    $("footerContact").href = "mailto:" + CONTACT_EMAIL;
  }

  // ---------- structured data for search engines ----------
  function injectSchema() {
    var items = LISTINGS.filter(function (x) { return x.status === "verified" && x.privacy !== "limited"; }).map(function (x, i) {
      var c = CAT_BY_ID[x.category], o = {"@type": c ? c.schema : "LocalBusiness", "name": x.name, "address": {"@type":"PostalAddress","addressLocality":x.city,"addressRegion":ABBR[x.state] || x.state,"addressCountry":"US"}};
      if (x.address) o.address.streetAddress = x.address;
      if (x.zip) o.address.postalCode = x.zip;
      if (x.phone) o.telephone = x.phone;
      if (httpUrl(x.website)) o.url = x.website;
      if (x.category === "Restaurant") o.servesCuisine = "Ethiopian";
      return {"@type":"ListItem","position":i + 1,"item":o};
    });
    var s = document.createElement("script"); s.type = "application/ld+json";
    s.textContent = JSON.stringify({"@context":"https://schema.org","@type":"ItemList","name":"Habesha Hub verified Ethiopian community listings","url":SITE_URL,"numberOfItems":items.length,"itemListElement":items});
    document.head.appendChild(s);
  }

  // ---------- language ----------
  function applyLang() {
    document.documentElement.lang = LANG;
    document.body.classList.toggle("lang-am", LANG === "am");
    document.querySelectorAll("[data-i18n]").forEach(function (n) { var k = n.getAttribute("data-i18n"); if (I18N[k]) n.textContent = t(k); });
    document.querySelectorAll("[data-i18n-html]").forEach(function (n) { var k = n.getAttribute("data-i18n-html"); if (I18N[k]) n.innerHTML = t(k); });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (n) { var k = n.getAttribute("data-i18n-placeholder"); if (I18N[k]) n.placeholder = t(k); });
    var lb = $("langBtn"); lb.textContent = LANG === "am" ? "Switch to English" : "Switch to አማርኛ"; lb.lang = LANG === "am" ? "en" : "am";
    lb.setAttribute("aria-label", LANG === "am" ? "Switch to English" : "Switch to Amharic");
    fillCities(); renderContrib(); renderCoverage(); renderListings(false); renderState();
  }

  // ---------- stats ----------
  function renderStats() {
    var states = {}, cities = {};
    LISTINGS.forEach(function (x) { states[x.state] = 1; cities[area(x) + "|" + x.state] = 1; });
    $("statListings").textContent = LISTINGS.length;
    $("statVerified").textContent = LISTINGS.filter(function (x) { return x.status === "verified"; }).length;
    $("statStates").textContent = Object.keys(states).length;
    $("statCities").textContent = Object.keys(cities).length;
    $("dataUpdated").textContent = META.updated ? fmtDate(META.updated) : "";
    $("year").textContent = new Date().getFullYear();
  }

  // ---------- events ----------
  el.q.addEventListener("input", function () { renderListings(true); });
  el.state.addEventListener("change", function () { fillCities(); renderListings(true); if (el.state.value) { $("stateExplorer").value = el.state.value; renderState(); } });
  el.city.addEventListener("change", function () { renderListings(true); });
  el.cat.addEventListener("change", function () { syncDenomVisibility(); renderListings(true); });
  el.denom.addEventListener("change", function () { renderListings(true); });
  el.verified.addEventListener("change", function () { renderListings(true); });
  $("filterForm").addEventListener("submit", function (e) { e.preventDefault(); renderListings(true); });
  el.more.addEventListener("click", function () { shown += PAGE_SIZE; renderListings(false); });
  $("showExpired").addEventListener("change", renderHousing);
  $("clearFilters").addEventListener("click", function () {
    el.q.value = ""; el.state.value = ""; el.cat.value = ""; el.denom.value = ""; el.verified.checked = false;
    fillCities(); syncDenomVisibility(); renderListings(true); el.q.focus();
  });
  document.querySelectorAll("#categoryGrid [data-category]").forEach(function (a) {
    a.addEventListener("click", function () {
      var c = a.getAttribute("data-category"); if (c === "Housing") return;
      el.cat.value = c; el.q.value = ""; syncDenomVisibility(); renderListings(true);
    });
  });
  $("heroSearch").addEventListener("submit", function (e) {
    e.preventDefault();
    var intent = applyIntent($("heroWhat").value);
    el.q.value = intent.q; el.state.value = $("heroState").value; fillCities();
    el.cat.value = intent.cat; syncDenomVisibility(); el.denom.value = intent.denom;
    renderListings(true);
    if (el.state.value) { $("stateExplorer").value = el.state.value; renderState(); }
    $("directory").scrollIntoView();
  });
  $("shareLink").addEventListener("click", function (e) {
    e.preventDefault();
    var url = SITE_URL + location.search + "#directory", a = this;
    function done() { a.textContent = t("link_copied"); setTimeout(function () { a.textContent = t("copy_link"); }, 2000); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { window.prompt("Copy this link:", url); });
    else window.prompt("Copy this link:", url);
  });
  $("stateExplorer").addEventListener("change", renderState);
  $("menuBtn").addEventListener("click", function () { var n = $("mainNav"), open = n.classList.toggle("open"); this.setAttribute("aria-expanded", open ? "true" : "false"); });
  document.querySelectorAll("#mainNav a").forEach(function (a) { a.addEventListener("click", function () { $("mainNav").classList.remove("open"); $("menuBtn").setAttribute("aria-expanded", "false"); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && $("mainNav").classList.contains("open")) { $("mainNav").classList.remove("open"); $("menuBtn").setAttribute("aria-expanded", "false"); $("menuBtn").focus(); } });
  $("langBtn").addEventListener("click", function () { LANG = LANG === "am" ? "en" : "am"; storeSet("hh_lang", LANG); applyLang(); });

  // ---------- init ----------
  $("stateExplorer").value = "Ohio";
  readUrl();
  if (el.state.value) $("stateExplorer").value = el.state.value;
  renderStats();
  injectSchema();
  applyLang();
  if (location.search && !location.hash) { var d = $("directory"); if (d) d.scrollIntoView(); }

  // expose for tests/maintenance
  window.HabeshaHub = {rows: currentRows, housingStatus: housingStatus, tokens: tokens};
})();
