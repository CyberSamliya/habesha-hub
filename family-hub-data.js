// Family Hub content. Edit this file to publish introductions and announcements.
// Every entry is reviewed by Habesha Hub before it is added here.
// Lessons follow the teaching of the Ethiopian Orthodox Tewahedo Church and are
// written as an introduction for families, in ten parts from beginning to end; a parish priest should review any change.
window.FAMILY_HUB = {
  contactEmail: 'info@habeshahubusa.com',

  // Lesson uploads are stored in the "Habesha Hub" Supabase project.
  // The publishable key is safe to show in a web page; uploads are limited to admins by
  // the database rules in supabase/family-hub-setup.sql. Set the key to '' to turn uploads off.
  uploads: { url: 'https://yfzydixypuronzoeargv.supabase.co', key: 'sb_publishable_IgrQc77kE1x_vQan5lLUyg_gCGkLdq3' },

  // Countries for the join form. 'common' are listed first; 'all' is every country.
  countries: {
    common: ["United States", "Ethiopia", "Eritrea", "Canada", "United Kingdom", "Germany", "Sweden", "Norway", "Netherlands", "Italy", "Israel", "Saudi Arabia", "United Arab Emirates", "South Africa", "Kenya", "Australia"],
    all: ["Afghanistan", "Åland Islands", "Albania", "Algeria", "American Samoa", "Andorra", "Angola", "Anguilla", "Antarctica", "Antigua & Barbuda", "Argentina", "Armenia", "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia", "Bosnia & Herzegovina", "Botswana", "Bouvet Island", "Brazil", "British Indian Ocean Territory", "British Virgin Islands", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", "Caribbean Netherlands", "Cayman Islands", "Central African Republic", "Chad", "Chile", "China", "Christmas Island", "Cocos (Keeling) Islands", "Colombia", "Comoros", "Congo - Brazzaville", "Congo - Kinshasa", "Cook Islands", "Costa Rica", "Côte d’Ivoire", "Croatia", "Cuba", "Curaçao", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Falkland Islands", "Faroe Islands", "Fiji", "Finland", "France", "French Guiana", "French Polynesia", "French Southern Territories", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Gibraltar", "Greece", "Greenland", "Grenada", "Guadeloupe", "Guam", "Guatemala", "Guernsey", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Heard & McDonald Islands", "Honduras", "Hong Kong SAR China", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Isle of Man", "Israel", "Italy", "Jamaica", "Japan", "Jersey", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macao SAR China", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Martinique", "Mauritania", "Mauritius", "Mayotte", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Montserrat", "Morocco", "Mozambique", "Myanmar (Burma)", "Namibia", "Nauru", "Nepal", "Netherlands", "New Caledonia", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Niue", "Norfolk Island", "North Korea", "North Macedonia", "Northern Mariana Islands", "Norway", "Oman", "Pakistan", "Palau", "Palestinian Territories", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Pitcairn Islands", "Poland", "Portugal", "Puerto Rico", "Qatar", "Réunion", "Romania", "Russia", "Rwanda", "Samoa", "San Marino", "São Tomé & Príncipe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Sint Maarten", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Georgia & South Sandwich Islands", "South Korea", "South Sudan", "Spain", "Sri Lanka", "St. Barthélemy", "St. Helena", "St. Kitts & Nevis", "St. Lucia", "St. Martin", "St. Pierre & Miquelon", "St. Vincent & Grenadines", "Sudan", "Suriname", "Svalbard & Jan Mayen", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tokelau", "Tonga", "Trinidad & Tobago", "Tunisia", "Türkiye", "Turkmenistan", "Turks & Caicos Islands", "Tuvalu", "U.S. Outlying Islands", "U.S. Virgin Islands", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Wallis & Futuna", "Western Sahara", "Yemen", "Zambia", "Zimbabwe"]
  },

  // Published family introductions. Add one object per approved introduction:
  // {family:'Tesfaye family', city:'Columbus', state:'Ohio', country:'United States', parish:'Holy Trinity EOTC', text:'...', added:'2026-11-25'}
  introductions: [],

  // Announcements shown on the family board, newest first.
  // {title:'...', text:'...', from:'Habesha Hub', date:'2026-11-25'}
  announcements: [
    { title: 'Welcome to the Family Hub', from: 'Habesha Hub', date: '2026-11-25',
      text: 'This is our family space: introduce your family, share news and prayer requests, and learn the teaching of the Church from A to Z together. Every post is reviewed before it appears here.' }
  ],

  // Church teaching from beginning to end, in ten parts. Each part may also list
  // uploaded lesson materials: {title:'...', type:'pdf'|'audio'|'video'|'link', url:'...', added:'2026-11-25'}
  parts: [
    {
      "part": 1,
      "title": "God: the Holy Trinity and Jesus Christ",
      "am": "እግዚአብሔር",
      "intro": "We begin where the faith begins: who God is, and who Jesus Christ is.",
      "sections": [
        {
          "title": "The Holy Trinity",
          "am": "ቅድስት ሥላሴ",
          "text": "We believe in one God in three Persons: the Father, the Son and the Holy Spirit, equal in glory and one in essence. Every prayer begins \"In the name of the Father, the Son and the Holy Spirit, one God\" (Besme Ab, Wewold, Wemenfes Qidus, Ahadu Amlak). The 7th day of each Ethiopian month is dedicated to the Holy Trinity (Selassie)."
        },
        {
          "title": "Jesus Christ and Tewahedo",
          "am": "ተዋሕዶ",
          "text": "\"Tewahedo\" means \"made one.\" The Church teaches that in Jesus Christ the divine nature and the human nature are united in one nature, without mixing, change or separation. He is fully God and fully man. This faith is shared with the other Oriental Orthodox churches: the Coptic, Armenian, Syriac, Indian (Malankara) and Eritrean churches."
        }
      ],
      "reflect": [
        "Make the sign of the cross slowly and say the words together as a family.",
        "What does it mean to you that God became fully human?"
      ],
      "uploads": []
    },
    {
      "part": 2,
      "title": "The Word of God: our Bible and Ge'ez",
      "am": "ቃለ እግዚአብሔር",
      "intro": "How God speaks to us through Holy Scripture, and the ancient language in which our Church prays.",
      "sections": [
        {
          "title": "Old and New Testament: our Bible",
          "am": "መጽሐፍ ቅዱስ",
          "text": "The Ethiopian Orthodox Bible has 81 books, the largest biblical canon of any church. Besides the books found in other Bibles, it includes books such as Enoch and Jubilees. The Gospel is read at every Liturgy, and families are encouraged to read Scripture at home."
        },
        {
          "title": "Ge'ez, the language of worship",
          "am": "ግዕዝ",
          "text": "Ge'ez is the ancient language of the Church. The Bible, the Liturgy, hymns and the lives of the saints were written in Ge'ez, and much of the service is still prayed in it today, alongside Amharic, Tigrinya, Afaan Oromo and English. The Ethiopic script (Fidel) that we use for Amharic grew from Ge'ez."
        }
      ],
      "reflect": [
        "Pick one Psalm to read together each evening this week.",
        "Can you say \"Abatachin\" (the Lord's Prayer) or \"Selam Leki Mariam\" in Ge'ez or Amharic?"
      ],
      "uploads": []
    },
    {
      "part": 3,
      "title": "The history of our Church",
      "am": "ታሪከ ቤተ ክርስቲያን",
      "intro": "How the faith came to Ethiopia and was kept alive for more than 1,600 years.",
      "sections": [
        {
          "title": "Abba Selama and the coming of the faith",
          "am": "አባ ሰላማ",
          "text": "Christianity became the faith of the Aksumite kingdom in the 4th century under King Ezana. Frumentius, a young Syrian Christian who served at the royal court, was consecrated the first bishop of Ethiopia by St. Athanasius of Alexandria. Ethiopians remember him as Abba Selama, Kesate Birhan: \"Father of Peace, Revealer of Light.\""
        },
        {
          "title": "The Nine Saints",
          "am": "ተስዓቱ ቅዱሳን",
          "text": "In the late 5th century, nine holy monks came to Ethiopia from the Roman (Byzantine) lands. They founded monasteries, such as Debre Damo founded by Abune Aregawi, spread the monastic life and helped translate the Holy Scriptures into Ge'ez."
        },
        {
          "title": "Lalibela",
          "am": "ላሊበላ",
          "text": "King Lalibela (12th to 13th century) had eleven churches carved out of solid rock, as a \"New Jerusalem\" for pilgrims. They are still used for worship today and are a UNESCO World Heritage Site. Many families make pilgrimage there, especially for Genna (Christmas)."
        },
        {
          "title": "Unity of the Church and the Patriarchate",
          "am": "ፓትርያርክ",
          "text": "For about 1,600 years the bishops of Ethiopia were sent from the Coptic Church of Alexandria. In 1959 the Ethiopian Church became autocephalous (self-governing), and Abune Basilios became its first Patriarch. Parishes in the diaspora, including in the United States, belong to the same one Church."
        }
      ],
      "reflect": [
        "Why do you think the faith has lasted in Ethiopia for more than 1,600 years?",
        "Why do you think monasteries were so important for keeping the faith alive?",
        "Look at a picture of Bete Giyorgis together. How do you think it was carved?",
        "How can families far from Ethiopia stay connected to the whole Church?"
      ],
      "uploads": []
    },
    {
      "part": 4,
      "title": "Becoming a Christian: Baptism",
      "am": "ጥምቀት",
      "intro": "How each of us enters the family of the Church.",
      "sections": [
        {
          "title": "Baptism",
          "am": "ጥምቀተ ክርስትና",
          "text": "Baptism is the door into the Church. Following the tradition of the Church, a baby boy is baptized on the 40th day after birth and a baby girl on the 80th day. The child is baptized by triple immersion in the name of the Father, the Son and the Holy Spirit, receives the holy Meron (chrism), and takes a baptismal (Christian) name. Godparents promise to help raise the child in the faith."
        }
      ],
      "reflect": [
        "Do you know your baptismal name and the saint it honors?"
      ],
      "uploads": []
    },
    {
      "part": 5,
      "title": "The house of God",
      "am": "ቤተ እግዚአብሔር",
      "intro": "The church building, the Tabot, the icons, and the clergy who serve us.",
      "sections": [
        {
          "title": "The church building",
          "am": "ቤተ ክርስቲያን",
          "text": "A traditional Ethiopian church has three parts. The outer ring, Qene Mahlet, is where the debteras chant hymns. The middle part, Qiddist, is where the faithful receive Holy Communion. The innermost sanctuary, Mekdes (the Holy of Holies), holds the Tabot and is entered only by the clergy. We remove our shoes, cover our heads (women) and enter with reverence."
        },
        {
          "title": "The Tabot",
          "am": "ታቦት",
          "text": "Every Ethiopian Orthodox church has a Tabot, a consecrated tablet that recalls the Ark of the Covenant and the tablets of the Law. A church is named for the saint or feast of its Tabot, and the Liturgy cannot be celebrated without it. Only priests may touch it, and it is carried in procession, wrapped in cloth, on great feasts such as Timket."
        },
        {
          "title": "Icons",
          "am": "ሥዕላት",
          "text": "Icons are holy paintings of Christ, the Virgin Mary, the angels and the saints. We honor them because we honor the holy person shown, not the wood or paint. Ethiopian icons have their own style, with large eyes that remind us that heaven sees and cares for us."
        },
        {
          "title": "Deacons, priests and bishops",
          "am": "ዲያቆን፣ ቄስ፣ ጳጳስ",
          "text": "The Church is served by deacons (Diyakon), priests (Qes or Kahin) and bishops (Episqopos, called Abun), led by the Patriarch. Deacons assist at the Liturgy and are often young boys trained in the church school. Debteras are learned lay singers and teachers of chant, poetry and church tradition."
        }
      ],
      "reflect": [
        "What do you do, step by step, when you arrive at church?",
        "What is the name of the Tabot at your parish?",
        "Which icon is in your home, and what is its story?",
        "Who are the clergy at your parish, and how can your family support them?"
      ],
      "uploads": []
    },
    {
      "part": 6,
      "title": "Prayer and worship",
      "am": "ጸሎትና አምልኮ",
      "intro": "How we pray at home and worship together in the Divine Liturgy, with the chant of St. Yared and the poetry of the Church.",
      "sections": [
        {
          "title": "Prayer",
          "am": "ጸሎት",
          "text": "The Church teaches prayer seven times a day, following Psalm 119:164: \"Seven times a day I praise You.\" Simple daily prayers include the Lord's Prayer (Abatachin), the greeting of Mary (Selam Leki), and the Creed (Tselote Haymanot). We pray facing east, standing, with bows (sigdet), and we begin and end with the sign of the cross."
        },
        {
          "title": "Eucharist and the Divine Liturgy",
          "am": "ቅዳሴ",
          "text": "The Qiddase (Divine Liturgy) is the center of worship, where bread and wine become the Body and Blood of Christ. The Church uses fourteen anaphoras (prayers of offering) through the year. Those who receive Holy Communion prepare by confession, fasting before the Liturgy, and living in peace with others."
        },
        {
          "title": "Saint Yared and church chant",
          "am": "ቅዱስ ያሬድ",
          "text": "St. Yared (6th century) composed the chant (Zema) of the Ethiopian Church. Tradition teaches that he received the hymns through three birds from heaven. His chant uses three modes: Ge'ez, Ezel and Araray, and is still sung with the drum (kebero), the sistrum (tsenatsil) and the prayer staff (mequamia)."
        },
        {
          "title": "Qine, the poetry of the Church",
          "am": "ቅኔ",
          "text": "Qine is a form of Ge'ez poetry composed in church schools and sung in praise. It is famous for \"sem ena werq\" (wax and gold): a surface meaning (the wax) that hides a deeper spiritual meaning (the gold). Learning Qine trains the mind to look for deeper truth."
        }
      ],
      "reflect": [
        "Choose one time each day when your whole family prays together.",
        "How does your family prepare the night before receiving Communion?",
        "Listen to a Mahlet hymn together. Can you hear the change between modes?",
        "Can you think of a saying with a hidden meaning in Amharic?"
      ],
      "uploads": []
    },
    {
      "part": 7,
      "title": "Repentance and fasting",
      "am": "ንስሐና ጾም",
      "intro": "How we turn back to God, confess, and grow through fasting.",
      "sections": [
        {
          "title": "Repentance and the father of confession",
          "am": "ንስሐና የንስሐ አባት",
          "text": "Through repentance (Nisiha) we turn back to God. Every Orthodox Christian is encouraged to have a father of confession (Yenisiha Abat), a priest who hears confession, gives counsel and a penance (qenona), and guides the family in fasting and prayer."
        },
        {
          "title": "Fasting",
          "am": "ጾም",
          "text": "Fasting means abstaining from all animal products and, on fasting days, eating nothing until the afternoon, joined with prayer and almsgiving. The main fasts are: the Great Lent (Abiy Tsom or Hudade, 55 days), the Fast of the Apostles, the Fast of the Assumption (Filseta, the first two weeks of Nehase, in August), the Advent Fast (Tsome Nebiyat), the Fast of Nineveh (3 days), the Gahad (eves of Christmas and Epiphany), and every Wednesday and Friday. Children, the sick and the elderly fast according to their strength, with guidance from their father of confession."
        }
      ],
      "reflect": [
        "Does every member of your family have a father of confession?",
        "What is one thing your family can give to others during the next fast?"
      ],
      "uploads": []
    },
    {
      "part": 8,
      "title": "The Virgin Mary, the saints and the angels",
      "am": "ቅድስት ማርያም፣ ቅዱሳንና መላእክት",
      "intro": "The great cloud of witnesses who pray with us and for us.",
      "sections": [
        {
          "title": "The Virgin Mary",
          "am": "ቅድስት ድንግል ማርያም",
          "text": "The Church honors the Virgin Mary as Theotokos, the Mother of God, and as the one who intercedes for us. She is commemorated on the 21st of every Ethiopian month and has many feasts through the year. The Weddase Mariam (praises of Mary) is prayed daily by many faithful."
        },
        {
          "title": "Kidane Mehret, the Covenant of Mercy",
          "am": "ኪዳነ ምሕረት",
          "text": "Kidane Mehret is the covenant of mercy that, according to Church tradition, Christ gave to His mother: that He would show mercy to those who call on her name and honor her memory. It is celebrated on the 16th of every Ethiopian month, with its great feast on Yekatit 16."
        },
        {
          "title": "Saints and angels",
          "am": "ቅዱሳንና መላእክት",
          "text": "Each day of the Ethiopian month remembers saints and angels, and many families keep a monthly commemoration (zikir). Some well known days: St. Michael the Archangel on the 12th, St. Gabriel on the 19th, St. George (Giyorgis) on the 23rd, Abune Tekle Haymanot on the 24th, and Abune Gebre Menfes Kidus on the 5th. We ask the saints to pray for us, as members of one family in Christ."
        }
      ],
      "reflect": [
        "Learn one line of the Weddase Mariam this week.",
        "Who in your life needs mercy and prayer this week?",
        "Which saint is your family's patron, and on which day is their commemoration?"
      ],
      "uploads": []
    },
    {
      "part": 9,
      "title": "The year of the Church: calendar and feasts",
      "am": "ዘመንና በዓላት",
      "intro": "How the Church calendar, the great feasts and the Cross shape the whole year.",
      "sections": [
        {
          "title": "Zemen: the Church calendar",
          "am": "ዘመን",
          "text": "The Church keeps the Ethiopian calendar of 13 months: twelve months of 30 days and Pagume of 5 or 6 days. The new year (Enkutatash) begins on Meskerem 1, around September 11. Each year is named after one of the four Evangelists in turn: Matthew, Mark, Luke and John. The calendar guides every fast and feast of the family's year."
        },
        {
          "title": "Vigils and the great feasts",
          "am": "ዐበይት በዓላት",
          "text": "Great feasts are celebrated with an all-night vigil of hymns (Mahlet) and the Liturgy. The great feasts include Genna (Christmas, around January 7), Timket (Epiphany, Tir 11, around January 19), Hosanna (Palm Sunday), Siklet (Good Friday), Fasika (Easter), Erget (Ascension), Pentecost and Debre Tabor (Transfiguration)."
        },
        {
          "title": "The Cross and Meskel",
          "am": "መስቀል",
          "text": "The Cross is the sign of our salvation. Clergy carry a hand cross to bless the faithful, who kiss it with reverence. The feast of Meskel (Meskerem 17, around September 27) remembers how Empress Helena (Eleni) found the True Cross, guided by the smoke of a fire. On its eve, families gather for the Demera bonfire."
        }
      ],
      "reflect": [
        "Which Evangelist's year is it now, and when does the next fast begin?",
        "Which feast does your family love most, and why?",
        "Look at the cross your family owns. What patterns do you see in it?"
      ],
      "uploads": []
    },
    {
      "part": 10,
      "title": "Living the faith as a family",
      "am": "ሕይወተ ክርስትና በቤተሰብ",
      "intro": "Holy matrimony and the Christian home: bringing everything we have learned into daily family life.",
      "sections": [
        {
          "title": "Holy matrimony",
          "am": "ተክሊል",
          "text": "The Church's marriage service is called Teklil, \"crowning.\" The couple is crowned and blessed by the priest and together receives Holy Communion, beginning their life as a small church at home. Christian marriage is a lifelong covenant of love, faithfulness and mutual service."
        }
      ],
      "reflect": [
        "Ask the married couples in your family to share how they were married.",
        "Looking back over all ten parts, what is one practice your family will keep from now on?"
      ],
      "uploads": []
    }
  ]
};
