var cr = Object.defineProperty;
var fr = (n, r, t) => r in n ? cr(n, r, { enumerable: !0, configurable: !0, writable: !0, value: t }) : n[r] = t;
var q = (n, r, t) => (fr(n, typeof r != "symbol" ? r + "" : r, t), t);
const D = {
  NIPPON: "nippon",
  PASSPORT: "passport",
  HEPBURN: "hepburn"
}, Z = {
  nippon: {
    // 数字と記号
    "１": "1",
    "２": "2",
    "３": "3",
    "４": "4",
    "５": "5",
    "６": "6",
    "７": "7",
    "８": "8",
    "９": "9",
    "０": "0",
    "！": "!",
    "“": '"',
    "”": '"',
    "＃": "#",
    "＄": "$",
    "％": "%",
    "＆": "&",
    "’": "'",
    "（": "(",
    "）": ")",
    "＝": "=",
    "～": "~",
    "｜": "|",
    "＠": "@",
    "‘": "`",
    "＋": "+",
    "＊": "*",
    "；": ";",
    "：": ":",
    "＜": "<",
    "＞": ">",
    "、": ",",
    "。": ".",
    "／": "/",
    "？": "?",
    "＿": "_",
    "・": "･",
    "「": '"',
    "」": '"',
    "｛": "{",
    "｝": "}",
    "￥": "\\",
    "＾": "^",
    // 直音-清音(ア～ノ)
    あ: "a",
    い: "i",
    う: "u",
    え: "e",
    お: "o",
    ア: "a",
    イ: "i",
    ウ: "u",
    エ: "e",
    オ: "o",
    か: "ka",
    き: "ki",
    く: "ku",
    け: "ke",
    こ: "ko",
    カ: "ka",
    キ: "ki",
    ク: "ku",
    ケ: "ke",
    コ: "ko",
    さ: "sa",
    し: "si",
    す: "su",
    せ: "se",
    そ: "so",
    サ: "sa",
    シ: "si",
    ス: "su",
    セ: "se",
    ソ: "so",
    た: "ta",
    ち: "ti",
    つ: "tu",
    て: "te",
    と: "to",
    タ: "ta",
    チ: "ti",
    ツ: "tu",
    テ: "te",
    ト: "to",
    な: "na",
    に: "ni",
    ぬ: "nu",
    ね: "ne",
    の: "no",
    ナ: "na",
    ニ: "ni",
    ヌ: "nu",
    ネ: "ne",
    ノ: "no",
    // 直音-清音(ハ～ヲ)
    は: "ha",
    ひ: "hi",
    ふ: "hu",
    へ: "he",
    ほ: "ho",
    ハ: "ha",
    ヒ: "hi",
    フ: "hu",
    ヘ: "he",
    ホ: "ho",
    ま: "ma",
    み: "mi",
    む: "mu",
    め: "me",
    も: "mo",
    マ: "ma",
    ミ: "mi",
    ム: "mu",
    メ: "me",
    モ: "mo",
    や: "ya",
    ゆ: "yu",
    よ: "yo",
    ヤ: "ya",
    ユ: "yu",
    ヨ: "yo",
    ら: "ra",
    り: "ri",
    る: "ru",
    れ: "re",
    ろ: "ro",
    ラ: "ra",
    リ: "ri",
    ル: "ru",
    レ: "re",
    ロ: "ro",
    わ: "wa",
    ゐ: "wi",
    ゑ: "we",
    を: "wo",
    ワ: "wa",
    ヰ: "wi",
    ヱ: "we",
    ヲ: "wo",
    // 直音-濁音(ガ～ボ)、半濁音(パ～ポ)
    が: "ga",
    ぎ: "gi",
    ぐ: "gu",
    げ: "ge",
    ご: "go",
    ガ: "ga",
    ギ: "gi",
    グ: "gu",
    ゲ: "ge",
    ゴ: "go",
    ざ: "za",
    じ: "zi",
    ず: "zu",
    ぜ: "ze",
    ぞ: "zo",
    ザ: "za",
    ジ: "zi",
    ズ: "zu",
    ゼ: "ze",
    ゾ: "zo",
    だ: "da",
    ぢ: "di",
    づ: "du",
    で: "de",
    ど: "do",
    ダ: "da",
    ヂ: "di",
    ヅ: "du",
    デ: "de",
    ド: "do",
    ば: "ba",
    び: "bi",
    ぶ: "bu",
    べ: "be",
    ぼ: "bo",
    バ: "ba",
    ビ: "bi",
    ブ: "bu",
    ベ: "be",
    ボ: "bo",
    ぱ: "pa",
    ぴ: "pi",
    ぷ: "pu",
    ぺ: "pe",
    ぽ: "po",
    パ: "pa",
    ピ: "pi",
    プ: "pu",
    ペ: "pe",
    ポ: "po",
    // 拗音-清音(キャ～リョ)
    きゃ: "kya",
    きゅ: "kyu",
    きょ: "kyo",
    しゃ: "sya",
    しゅ: "syu",
    しょ: "syo",
    ちゃ: "tya",
    ちゅ: "tyu",
    ちょ: "tyo",
    にゃ: "nya",
    にゅ: "nyu",
    にょ: "nyo",
    ひゃ: "hya",
    ひゅ: "hyu",
    ひょ: "hyo",
    みゃ: "mya",
    みゅ: "myu",
    みょ: "myo",
    りゃ: "rya",
    りゅ: "ryu",
    りょ: "ryo",
    キャ: "kya",
    キュ: "kyu",
    キョ: "kyo",
    シャ: "sya",
    シュ: "syu",
    ショ: "syo",
    チャ: "tya",
    チュ: "tyu",
    チョ: "tyo",
    ニャ: "nya",
    ニュ: "nyu",
    ニョ: "nyo",
    ヒャ: "hya",
    ヒュ: "hyu",
    ヒョ: "hyo",
    ミャ: "mya",
    ミュ: "myu",
    ミョ: "myo",
    リャ: "rya",
    リュ: "ryu",
    リョ: "ryo",
    // 拗音-濁音(ギャ～ビョ)、半濁音(ピャ～ピョ)、合拗音(クヮ、グヮ)
    ぎゃ: "gya",
    ぎゅ: "gyu",
    ぎょ: "gyo",
    じゃ: "zya",
    じゅ: "zyu",
    じょ: "zyo",
    ぢゃ: "dya",
    ぢゅ: "dyu",
    ぢょ: "dyo",
    びゃ: "bya",
    びゅ: "byu",
    びょ: "byo",
    ぴゃ: "pya",
    ぴゅ: "pyu",
    ぴょ: "pyo",
    くゎ: "kwa",
    ぐゎ: "gwa",
    ギャ: "gya",
    ギュ: "gyu",
    ギョ: "gyo",
    ジャ: "zya",
    ジュ: "zyu",
    ジョ: "zyo",
    ヂャ: "dya",
    ヂュ: "dyu",
    ヂョ: "dyo",
    ビャ: "bya",
    ビュ: "byu",
    ビョ: "byo",
    ピャ: "pya",
    ピュ: "pyu",
    ピョ: "pyo",
    クヮ: "kwa",
    グヮ: "gwa",
    // 小書きの仮名、符号
    ぁ: "a",
    ぃ: "i",
    ぅ: "u",
    ぇ: "e",
    ぉ: "o",
    ゃ: "ya",
    ゅ: "yu",
    ょ: "yo",
    ゎ: "wa",
    ァ: "a",
    ィ: "i",
    ゥ: "u",
    ェ: "e",
    ォ: "o",
    ャ: "ya",
    ュ: "yu",
    ョ: "yo",
    ヮ: "wa",
    ヵ: "ka",
    ヶ: "ke",
    ん: "n",
    ン: "n",
    // ー: "",
    "　": " ",
    // 外来音(イェ～グォ)
    いぇ: "ye",
    // うぃ: "",
    // うぇ: "",
    // うぉ: "",
    きぇ: "kye",
    // くぁ: "",
    くぃ: "kwi",
    くぇ: "kwe",
    くぉ: "kwo",
    // ぐぁ: "",
    ぐぃ: "gwi",
    ぐぇ: "gwe",
    ぐぉ: "gwo",
    イェ: "ye",
    // ウィ: "",
    // ウェ: "",
    // ウォ: "",
    // ヴ: "",
    // ヴァ: "",
    // ヴィ: "",
    // ヴェ: "",
    // ヴォ: "",
    // ヴュ: "",
    // ヴョ: "",
    キェ: "kya",
    // クァ: "",
    クィ: "kwi",
    クェ: "kwe",
    クォ: "kwo",
    // グァ: "",
    グィ: "gwi",
    グェ: "gwe",
    グォ: "gwo",
    // 外来音(シェ～フョ)
    しぇ: "sye",
    じぇ: "zye",
    すぃ: "swi",
    ずぃ: "zwi",
    ちぇ: "tye",
    つぁ: "twa",
    つぃ: "twi",
    つぇ: "twe",
    つぉ: "two",
    // てぃ: "ti",
    // てゅ: "tyu",
    // でぃ: "di",
    // でゅ: "dyu",
    // とぅ: "tu",
    // どぅ: "du",
    にぇ: "nye",
    ひぇ: "hye",
    ふぁ: "hwa",
    ふぃ: "hwi",
    ふぇ: "hwe",
    ふぉ: "hwo",
    ふゅ: "hwyu",
    ふょ: "hwyo",
    シェ: "sye",
    ジェ: "zye",
    スィ: "swi",
    ズィ: "zwi",
    チェ: "tye",
    ツァ: "twa",
    ツィ: "twi",
    ツェ: "twe",
    ツォ: "two",
    // ティ: "ti",
    // テュ: "tyu",
    // ディ: "di",
    // デュ: "dyu",
    // トゥ: "tu",
    // ドゥ: "du",
    ニェ: "nye",
    ヒェ: "hye",
    ファ: "hwa",
    フィ: "hwi",
    フェ: "hwe",
    フォ: "hwo",
    フュ: "hwyu",
    フョ: "hwyo"
  },
  passport: {
    // 数字と記号
    "１": "1",
    "２": "2",
    "３": "3",
    "４": "4",
    "５": "5",
    "６": "6",
    "７": "7",
    "８": "8",
    "９": "9",
    "０": "0",
    "！": "!",
    "“": '"',
    "”": '"',
    "＃": "#",
    "＄": "$",
    "％": "%",
    "＆": "&",
    "’": "'",
    "（": "(",
    "）": ")",
    "＝": "=",
    "～": "~",
    "｜": "|",
    "＠": "@",
    "‘": "`",
    "＋": "+",
    "＊": "*",
    "；": ";",
    "：": ":",
    "＜": "<",
    "＞": ">",
    "、": ",",
    "。": ".",
    "／": "/",
    "？": "?",
    "＿": "_",
    "・": "･",
    "「": '"',
    "」": '"',
    "｛": "{",
    "｝": "}",
    "￥": "\\",
    "＾": "^",
    // 直音-清音(ア～ノ)
    あ: "a",
    い: "i",
    う: "u",
    え: "e",
    お: "o",
    ア: "a",
    イ: "i",
    ウ: "u",
    エ: "e",
    オ: "o",
    か: "ka",
    き: "ki",
    く: "ku",
    け: "ke",
    こ: "ko",
    カ: "ka",
    キ: "ki",
    ク: "ku",
    ケ: "ke",
    コ: "ko",
    さ: "sa",
    し: "shi",
    す: "su",
    せ: "se",
    そ: "so",
    サ: "sa",
    シ: "shi",
    ス: "su",
    セ: "se",
    ソ: "so",
    た: "ta",
    ち: "chi",
    つ: "tsu",
    て: "te",
    と: "to",
    タ: "ta",
    チ: "chi",
    ツ: "tsu",
    テ: "te",
    ト: "to",
    な: "na",
    に: "ni",
    ぬ: "nu",
    ね: "ne",
    の: "no",
    ナ: "na",
    ニ: "ni",
    ヌ: "nu",
    ネ: "ne",
    ノ: "no",
    // 直音-清音(ハ～ヲ)
    は: "ha",
    ひ: "hi",
    ふ: "fu",
    へ: "he",
    ほ: "ho",
    ハ: "ha",
    ヒ: "hi",
    フ: "fu",
    ヘ: "he",
    ホ: "ho",
    ま: "ma",
    み: "mi",
    む: "mu",
    め: "me",
    も: "mo",
    マ: "ma",
    ミ: "mi",
    ム: "mu",
    メ: "me",
    モ: "mo",
    や: "ya",
    ゆ: "yu",
    よ: "yo",
    ヤ: "ya",
    ユ: "yu",
    ヨ: "yo",
    ら: "ra",
    り: "ri",
    る: "ru",
    れ: "re",
    ろ: "ro",
    ラ: "ra",
    リ: "ri",
    ル: "ru",
    レ: "re",
    ロ: "ro",
    わ: "wa",
    ゐ: "i",
    ゑ: "e",
    を: "o",
    ワ: "wa",
    ヰ: "i",
    ヱ: "e",
    ヲ: "o",
    // 直音-濁音(ガ～ボ)、半濁音(パ～ポ)
    が: "ga",
    ぎ: "gi",
    ぐ: "gu",
    げ: "ge",
    ご: "go",
    ガ: "ga",
    ギ: "gi",
    グ: "gu",
    ゲ: "ge",
    ゴ: "go",
    ざ: "za",
    じ: "ji",
    ず: "zu",
    ぜ: "ze",
    ぞ: "zo",
    ザ: "za",
    ジ: "ji",
    ズ: "zu",
    ゼ: "ze",
    ゾ: "zo",
    だ: "da",
    ぢ: "ji",
    づ: "zu",
    で: "de",
    ど: "do",
    ダ: "da",
    ヂ: "ji",
    ヅ: "zu",
    デ: "de",
    ド: "do",
    ば: "ba",
    び: "bi",
    ぶ: "bu",
    べ: "be",
    ぼ: "bo",
    バ: "ba",
    ビ: "bi",
    ブ: "bu",
    ベ: "be",
    ボ: "bo",
    ぱ: "pa",
    ぴ: "pi",
    ぷ: "pu",
    ぺ: "pe",
    ぽ: "po",
    パ: "pa",
    ピ: "pi",
    プ: "pu",
    ペ: "pe",
    ポ: "po",
    // 拗音-清音(キャ～リョ)
    きゃ: "kya",
    きゅ: "kyu",
    きょ: "kyo",
    しゃ: "sha",
    しゅ: "shu",
    しょ: "sho",
    ちゃ: "cha",
    ちゅ: "chu",
    ちょ: "cho",
    にゃ: "nya",
    にゅ: "nyu",
    にょ: "nyo",
    ひゃ: "hya",
    ひゅ: "hyu",
    ひょ: "hyo",
    みゃ: "mya",
    みゅ: "myu",
    みょ: "myo",
    りゃ: "rya",
    りゅ: "ryu",
    りょ: "ryo",
    キャ: "kya",
    キュ: "kyu",
    キョ: "kyo",
    シャ: "sha",
    シュ: "shu",
    ショ: "sho",
    チャ: "cha",
    チュ: "chu",
    チョ: "cho",
    ニャ: "nya",
    ニュ: "nyu",
    ニョ: "nyo",
    ヒャ: "hya",
    ヒュ: "hyu",
    ヒョ: "hyo",
    ミャ: "mya",
    ミュ: "myu",
    ミョ: "myo",
    リャ: "rya",
    リュ: "ryu",
    リョ: "ryo",
    // 拗音-濁音(ギャ～ビョ)、半濁音(ピャ～ピョ)、合拗音(クヮ、グヮ)
    ぎゃ: "gya",
    ぎゅ: "gyu",
    ぎょ: "gyo",
    じゃ: "ja",
    じゅ: "ju",
    じょ: "jo",
    ぢゃ: "ja",
    ぢゅ: "ju",
    ぢょ: "jo",
    びゃ: "bya",
    びゅ: "byu",
    びょ: "byo",
    ぴゃ: "pya",
    ぴゅ: "pyu",
    ぴょ: "pyo",
    // くゎ: "",
    // ぐゎ: "",
    ギャ: "gya",
    ギュ: "gyu",
    ギョ: "gyo",
    ジャ: "ja",
    ジュ: "ju",
    ジョ: "jo",
    ヂャ: "ja",
    ヂュ: "ju",
    ヂョ: "jo",
    ビャ: "bya",
    ビュ: "byu",
    ビョ: "byo",
    ピャ: "pya",
    ピュ: "pyu",
    ピョ: "pyo",
    // クヮ: "",
    // グヮ: "",
    // 小書きの仮名、符号
    ぁ: "a",
    ぃ: "i",
    ぅ: "u",
    ぇ: "e",
    ぉ: "o",
    ゃ: "ya",
    ゅ: "yu",
    ょ: "yo",
    ゎ: "wa",
    ァ: "a",
    ィ: "i",
    ゥ: "u",
    ェ: "e",
    ォ: "o",
    ャ: "ya",
    ュ: "yu",
    ョ: "yo",
    ヮ: "wa",
    ヵ: "ka",
    ヶ: "ke",
    ん: "n",
    ン: "n",
    // ー: "",
    "　": " ",
    // 外来音(イェ～グォ)
    // いぇ: "",
    // うぃ: "",
    // うぇ: "",
    // うぉ: "",
    // きぇ: "",
    // くぁ: "",
    // くぃ: "",
    // くぇ: "",
    // くぉ: "",
    // ぐぁ: "",
    // ぐぃ: "",
    // ぐぇ: "",
    // ぐぉ: "",
    // イェ: "",
    // ウィ: "",
    // ウェ: "",
    // ウォ: "",
    ヴ: "b"
    // ヴァ: "",
    // ヴィ: "",
    // ヴェ: "",
    // ヴォ: "",
    // ヴュ: "",
    // ヴョ: "",
    // キェ: "",
    // クァ: "",
    // クィ: "",
    // クェ: "",
    // クォ: "",
    // グァ: "",
    // グィ: "",
    // グェ: "",
    // グォ: "",
    // 外来音(シェ～フョ)
    // しぇ: "",
    // じぇ: "",
    // すぃ: "",
    // ずぃ: "",
    // ちぇ: "",
    // つぁ: "",
    // つぃ: "",
    // つぇ: "",
    // つぉ: "",
    // てぃ: "",
    // てゅ: "",
    // でぃ: "",
    // でゅ: "",
    // とぅ: "",
    // どぅ: "",
    // にぇ: "",
    // ひぇ: "",
    // ふぁ: "",
    // ふぃ: "",
    // ふぇ: "",
    // ふぉ: "",
    // ふゅ: "",
    // ふょ: "",
    // シェ: "",
    // ジェ: "",
    // スィ: "",
    // ズィ: "",
    // チェ: "",
    // ツァ: "",
    // ツィ: "",
    // ツェ: "",
    // ツォ: "",
    // ティ: "",
    // テュ: "",
    // ディ: "",
    // デュ: "",
    // トゥ: "",
    // ドゥ: "",
    // ニェ: "",
    // ヒェ: "",
    // ファ: "",
    // フィ: "",
    // フェ: "",
    // フォ: "",
    // フュ: "",
    // フョ: ""
  },
  hepburn: {
    // 数字と記号
    "１": "1",
    "２": "2",
    "３": "3",
    "４": "4",
    "５": "5",
    "６": "6",
    "７": "7",
    "８": "8",
    "９": "9",
    "０": "0",
    "！": "!",
    "“": '"',
    "”": '"',
    "＃": "#",
    "＄": "$",
    "％": "%",
    "＆": "&",
    "’": "'",
    "（": "(",
    "）": ")",
    "＝": "=",
    "～": "~",
    "｜": "|",
    "＠": "@",
    "‘": "`",
    "＋": "+",
    "＊": "*",
    "；": ";",
    "：": ":",
    "＜": "<",
    "＞": ">",
    "、": ",",
    "。": ".",
    "／": "/",
    "？": "?",
    "＿": "_",
    "・": "･",
    "「": '"',
    "」": '"',
    "｛": "{",
    "｝": "}",
    "￥": "\\",
    "＾": "^",
    // 直音-清音(ア～ノ)
    あ: "a",
    い: "i",
    う: "u",
    え: "e",
    お: "o",
    ア: "a",
    イ: "i",
    ウ: "u",
    エ: "e",
    オ: "o",
    か: "ka",
    き: "ki",
    く: "ku",
    け: "ke",
    こ: "ko",
    カ: "ka",
    キ: "ki",
    ク: "ku",
    ケ: "ke",
    コ: "ko",
    さ: "sa",
    し: "shi",
    す: "su",
    せ: "se",
    そ: "so",
    サ: "sa",
    シ: "shi",
    ス: "su",
    セ: "se",
    ソ: "so",
    た: "ta",
    ち: "chi",
    つ: "tsu",
    て: "te",
    と: "to",
    タ: "ta",
    チ: "chi",
    ツ: "tsu",
    テ: "te",
    ト: "to",
    な: "na",
    に: "ni",
    ぬ: "nu",
    ね: "ne",
    の: "no",
    ナ: "na",
    ニ: "ni",
    ヌ: "nu",
    ネ: "ne",
    ノ: "no",
    // 直音-清音(ハ～ヲ)
    は: "ha",
    ひ: "hi",
    ふ: "fu",
    へ: "he",
    ほ: "ho",
    ハ: "ha",
    ヒ: "hi",
    フ: "fu",
    ヘ: "he",
    ホ: "ho",
    ま: "ma",
    み: "mi",
    む: "mu",
    め: "me",
    も: "mo",
    マ: "ma",
    ミ: "mi",
    ム: "mu",
    メ: "me",
    モ: "mo",
    や: "ya",
    ゆ: "yu",
    よ: "yo",
    ヤ: "ya",
    ユ: "yu",
    ヨ: "yo",
    ら: "ra",
    り: "ri",
    る: "ru",
    れ: "re",
    ろ: "ro",
    ラ: "ra",
    リ: "ri",
    ル: "ru",
    レ: "re",
    ロ: "ro",
    わ: "wa",
    ゐ: "i",
    ゑ: "e",
    を: "o",
    ワ: "wa",
    ヰ: "i",
    ヱ: "e",
    ヲ: "o",
    // 直音-濁音(ガ～ボ)、半濁音(パ～ポ)
    が: "ga",
    ぎ: "gi",
    ぐ: "gu",
    げ: "ge",
    ご: "go",
    ガ: "ga",
    ギ: "gi",
    グ: "gu",
    ゲ: "ge",
    ゴ: "go",
    ざ: "za",
    じ: "ji",
    ず: "zu",
    ぜ: "ze",
    ぞ: "zo",
    ザ: "za",
    ジ: "ji",
    ズ: "zu",
    ゼ: "ze",
    ゾ: "zo",
    だ: "da",
    ぢ: "ji",
    づ: "zu",
    で: "de",
    ど: "do",
    ダ: "da",
    ヂ: "ji",
    ヅ: "zu",
    デ: "de",
    ド: "do",
    ば: "ba",
    び: "bi",
    ぶ: "bu",
    べ: "be",
    ぼ: "bo",
    バ: "ba",
    ビ: "bi",
    ブ: "bu",
    ベ: "be",
    ボ: "bo",
    ぱ: "pa",
    ぴ: "pi",
    ぷ: "pu",
    ぺ: "pe",
    ぽ: "po",
    パ: "pa",
    ピ: "pi",
    プ: "pu",
    ペ: "pe",
    ポ: "po",
    // 拗音-清音(キャ～リョ)
    きゃ: "kya",
    きゅ: "kyu",
    きょ: "kyo",
    しゃ: "sha",
    しゅ: "shu",
    しょ: "sho",
    ちゃ: "cha",
    ちゅ: "chu",
    ちょ: "cho",
    にゃ: "nya",
    にゅ: "nyu",
    にょ: "nyo",
    ひゃ: "hya",
    ひゅ: "hyu",
    ひょ: "hyo",
    みゃ: "mya",
    みゅ: "myu",
    みょ: "myo",
    りゃ: "rya",
    りゅ: "ryu",
    りょ: "ryo",
    キャ: "kya",
    キュ: "kyu",
    キョ: "kyo",
    シャ: "sha",
    シュ: "shu",
    ショ: "sho",
    チャ: "cha",
    チュ: "chu",
    チョ: "cho",
    ニャ: "nya",
    ニュ: "nyu",
    ニョ: "nyo",
    ヒャ: "hya",
    ヒュ: "hyu",
    ヒョ: "hyo",
    ミャ: "mya",
    ミュ: "myu",
    ミョ: "myo",
    リャ: "rya",
    リュ: "ryu",
    リョ: "ryo",
    // 拗音-濁音(ギャ～ビョ)、半濁音(ピャ～ピョ)、合拗音(クヮ、グヮ)
    ぎゃ: "gya",
    ぎゅ: "gyu",
    ぎょ: "gyo",
    じゃ: "ja",
    じゅ: "ju",
    じょ: "jo",
    ぢゃ: "ja",
    ぢゅ: "ju",
    ぢょ: "jo",
    びゃ: "bya",
    びゅ: "byu",
    びょ: "byo",
    ぴゃ: "pya",
    ぴゅ: "pyu",
    ぴょ: "pyo",
    // くゎ: "",
    // ぐゎ: "",
    ギャ: "gya",
    ギュ: "gyu",
    ギョ: "gyo",
    ジャ: "ja",
    ジュ: "ju",
    ジョ: "jo",
    ヂャ: "ja",
    ヂュ: "ju",
    ヂョ: "jo",
    ビャ: "bya",
    ビュ: "byu",
    ビョ: "byo",
    ピャ: "pya",
    ピュ: "pyu",
    ピョ: "pyo",
    // クヮ: "",
    // グヮ: "",
    // 小書きの仮名、符号
    ぁ: "a",
    ぃ: "i",
    ぅ: "u",
    ぇ: "e",
    ぉ: "o",
    ゃ: "ya",
    ゅ: "yu",
    ょ: "yo",
    ゎ: "wa",
    ァ: "a",
    ィ: "i",
    ゥ: "u",
    ェ: "e",
    ォ: "o",
    ャ: "ya",
    ュ: "yu",
    ョ: "yo",
    ヮ: "wa",
    ヵ: "ka",
    ヶ: "ke",
    ん: "n",
    ン: "n",
    // ー: "",
    "　": " ",
    // 外来音(イェ～グォ)
    いぇ: "ye",
    うぃ: "wi",
    うぇ: "we",
    うぉ: "wo",
    きぇ: "kye",
    くぁ: "kwa",
    くぃ: "kwi",
    くぇ: "kwe",
    くぉ: "kwo",
    ぐぁ: "gwa",
    ぐぃ: "gwi",
    ぐぇ: "gwe",
    ぐぉ: "gwo",
    イェ: "ye",
    ウィ: "wi",
    ウェ: "we",
    ウォ: "wo",
    ヴ: "vu",
    ヴァ: "va",
    ヴィ: "vi",
    ヴェ: "ve",
    ヴォ: "vo",
    ヴュ: "vyu",
    ヴョ: "vyo",
    キェ: "kya",
    クァ: "kwa",
    クィ: "kwi",
    クェ: "kwe",
    クォ: "kwo",
    グァ: "gwa",
    グィ: "gwi",
    グェ: "gwe",
    グォ: "gwo",
    // 外来音(シェ～フョ)
    しぇ: "she",
    じぇ: "je",
    // すぃ: "",
    // ずぃ: "",
    ちぇ: "che",
    つぁ: "tsa",
    つぃ: "tsi",
    つぇ: "tse",
    つぉ: "tso",
    てぃ: "ti",
    てゅ: "tyu",
    でぃ: "di",
    でゅ: "dyu",
    とぅ: "tu",
    どぅ: "du",
    にぇ: "nye",
    ひぇ: "hye",
    ふぁ: "fa",
    ふぃ: "fi",
    ふぇ: "fe",
    ふぉ: "fo",
    ふゅ: "fyu",
    ふょ: "fyo",
    シェ: "she",
    ジェ: "je",
    // スィ: "",
    // ズィ: "",
    チェ: "che",
    ツァ: "tsa",
    ツィ: "tsi",
    ツェ: "tse",
    ツォ: "tso",
    ティ: "ti",
    テュ: "tyu",
    ディ: "di",
    デュ: "dyu",
    トゥ: "tu",
    ドゥ: "du",
    ニェ: "nye",
    ヒェ: "hye",
    ファ: "fa",
    フィ: "fi",
    フェ: "fe",
    フォ: "fo",
    フュ: "fyu",
    フョ: "fyo"
  }
}, P = function(n = "") {
  const r = (n[0] || "").charCodeAt(0);
  return r >= 12353 && r <= 12438;
}, K = function(n = "") {
  const r = (n[0] || "").charCodeAt(0);
  return r >= 12449 && r <= 12540;
}, $ = function(n = "") {
  return P(n) || K(n);
}, B = function(n = "") {
  const r = ([...n][0] || "").codePointAt(0);
  return r >= 19968 && r <= 40959 || r >= 13312 && r <= 19903 || r >= 131072 && r <= 173791;
}, Q = function(n = "") {
  return $(n) || B(n);
}, rr = function(n = "") {
  for (let r = 0; r < n.length; r++)
    if (P(n[r]))
      return !0;
  return !1;
}, tr = function(n = "") {
  for (let r = 0; r < n.length; r++)
    if (K(n[r]))
      return !0;
  return !1;
}, yr = function(n = "") {
  for (let r = 0; r < n.length; r++)
    if ($(n[r]))
      return !0;
  return !1;
}, er = function(n = "") {
  n = [...n];
  for (let r = 0; r < n.length; r++)
    if (B(n[r]))
      return !0;
  return !1;
}, X = function(n = "") {
  n = [...n];
  for (let r = 0; r < n.length; r++)
    if (Q(n[r]))
      return !0;
  return !1;
}, S = function(n = "") {
  return [...n].map((r) => r.codePointAt(0) >= 12449 && r.codePointAt(0) <= 12534 ? String.fromCharCode(r.charCodeAt(0) + -96) : r).join("");
}, U = function(n = "") {
  return [...n].map((r) => r.codePointAt(0) >= 12353 && r.codePointAt(0) <= 12438 ? String.fromCharCode(r.charCodeAt(0) + 96) : r).join("");
}, L = function(n = "", r) {
  r = r || D.HEPBURN;
  const t = /(っ|ッ)([bcdfghijklmnopqrstuvwyz])/gm, a = /っ|ッ/gm;
  let e = 0, i, s, o = "";
  if (r === D.PASSPORT && (n = n.replace(/ー/gm, "")), r === D.NIPPON || r === D.HEPBURN) {
    const m = new RegExp(/(ん|ン)(?=あ|い|う|え|お|ア|イ|ウ|エ|オ|ぁ|ぃ|ぅ|ぇ|ぉ|ァ|ィ|ゥ|ェ|ォ|や|ゆ|よ|ヤ|ユ|ヨ|ゃ|ゅ|ょ|ャ|ュ|ョ)/g);
    let k;
    const b = [];
    for (; (k = m.exec(n)) !== null; )
      b.push(k.index + 1);
    if (b.length !== 0) {
      let v = "";
      for (let C = 0; C < b.length; C++)
        C === 0 ? v += `${n.slice(0, b[C])}'` : v += `${n.slice(b[C - 1], b[C])}'`;
      v += n.slice(b[b.length - 1]), n = v;
    }
  }
  const u = n.length;
  for (; e <= u; )
    (s = Z[r][n.substring(e, e + 2)]) ? (o += s, e += 2) : (o += (s = Z[r][i = n.substring(e, e + 1)]) ? s : i, e += 1);
  return o = o.replace(t, "$2$2"), (r === D.PASSPORT || r === D.HEPBURN) && (o = o.replace(/cc/gm, "tc")), o = o.replace(a, "tsu"), (r === D.PASSPORT || r === D.HEPBURN) && (o = o.replace(/nm/gm, "mm"), o = o.replace(/nb/gm, "mb"), o = o.replace(/np/gm, "mp")), r === D.NIPPON && (o = o.replace(/aー/gm, "â"), o = o.replace(/iー/gm, "î"), o = o.replace(/uー/gm, "û"), o = o.replace(/eー/gm, "ê"), o = o.replace(/oー/gm, "ô")), r === D.HEPBURN && (o = o.replace(/aー/gm, "ā"), o = o.replace(/iー/gm, "ī"), o = o.replace(/uー/gm, "ū"), o = o.replace(/eー/gm, "ē"), o = o.replace(/oー/gm, "ō")), o;
}, gr = function(n = "") {
  n = [...n];
  let r = !1, t = !1;
  for (let a = 0; a < n.length; a++)
    B(n[a]) ? r = !0 : (P(n[a]) || K(n[a])) && (t = !0);
  return r && t ? 1 : r ? 0 : t ? 2 : 3;
}, pr = function(n) {
  for (let r = 0; r < n.length; r++)
    X(n[r].surface_form) ? n[r].reading ? rr(n[r].reading) && (n[r].reading = U(n[r].reading)) : n[r].surface_form.split("").every($) ? n[r].reading = U(n[r].surface_form) : n[r].reading = n[r].surface_form : n[r].reading = n[r].surface_form;
  for (let r = 0; r < n.length; r++)
    n[r].pos && n[r].pos === "助動詞" && (n[r].surface_form === "う" || n[r].surface_form === "ウ") && r - 1 >= 0 && n[r - 1].pos && n[r - 1].pos === "動詞" && (n[r - 1].surface_form += "う", n[r - 1].pronunciation ? n[r - 1].pronunciation += "ー" : n[r - 1].pronunciation = `${n[r - 1].reading}ー`, n[r - 1].reading += "ウ", n.splice(r, 1), r--);
  for (let r = 0; r < n.length; r++)
    n[r].pos && (n[r].pos === "動詞" || n[r].pos === "形容詞") && n[r].surface_form.length > 1 && (n[r].surface_form[n[r].surface_form.length - 1] === "っ" || n[r].surface_form[n[r].surface_form.length - 1] === "ッ") && r + 1 < n.length && (n[r].surface_form += n[r + 1].surface_form, n[r].pronunciation ? n[r].pronunciation += n[r + 1].pronunciation : n[r].pronunciation = `${n[r].reading}${n[r + 1].reading}`, n[r].reading += n[r + 1].reading, n.splice(r + 1, 1), r--);
  return n;
}, dr = function(n) {
  return S(n);
}, _r = function(n) {
  return U(n);
}, vr = function(n, r) {
  return L(n, r);
};
class M {
  constructor(r, t, a, e, i, s, o, u) {
    this.name = r, this.cost = t, this.start_pos = a, this.length = e, this.left_id = s, this.right_id = o, this.prev = null, this.surface_form = u, i === "BOS" ? this.shortest_cost = 0 : this.shortest_cost = Number.MAX_VALUE, this.type = i;
  }
}
class mr {
  constructor() {
    this.nodes_end_at = [], this.nodes_end_at[0] = [new M(-1, 0, 0, 0, "BOS", 0, 0, "")], this.eos_pos = 1;
  }
  /**
   * Append node to ViterbiLattice
   * @param {ViterbiNode} node
   */
  append(r) {
    var t = r.start_pos + r.length - 1;
    this.eos_pos < t && (this.eos_pos = t);
    var a = this.nodes_end_at[t];
    a == null && (a = []), a.push(r), this.nodes_end_at[t] = a;
  }
  /**
   * Set ends with EOS (End of Statement)
   */
  appendEos() {
    var r = this.nodes_end_at.length;
    this.eos_pos++, this.nodes_end_at[r] = [new M(-1, 0, this.eos_pos, 0, "EOS", 0, 0, "")];
  }
}
class R {
  constructor(r) {
    this.str = r, this.index_mapping = [];
    for (var t = 0; t < r.length; t++) {
      var a = r.charAt(t);
      this.index_mapping.push(t), R.isSurrogatePair(a) && t++;
    }
    this.length = this.index_mapping.length;
  }
  static isSurrogatePair(r) {
    var t = r.charCodeAt(0);
    return t >= 55296 && t <= 56319;
  }
  slice(r) {
    if (this.index_mapping.length <= r)
      return "";
    var t = this.index_mapping[r];
    return this.str.slice(t);
  }
  charAt(r) {
    if (this.str.length <= r)
      return "";
    var t = this.index_mapping[r], a = this.index_mapping[r + 1];
    return a == null ? this.str.slice(t) : this.str.slice(t, a);
  }
  charCodeAt(r) {
    if (this.index_mapping.length <= r)
      return NaN;
    var t = this.index_mapping[r], a = this.str.charCodeAt(t), e;
    return a >= 55296 && a <= 56319 && t < this.str.length && (e = this.str.charCodeAt(t + 1), e >= 56320 && e <= 57343) ? (a - 55296) * 1024 + e - 56320 + 65536 : a;
  }
  toString() {
    return this.str;
  }
}
class br {
  constructor(r) {
    this.trie = r.trie, this.token_info_dictionary = r.token_info_dictionary, this.unknown_dictionary = r.unknown_dictionary;
  }
  /**
   * Build word lattice
   * @param {string} sentence_str Input text
   * @returns {ViterbiLattice} Word lattice
   */
  build(r) {
    for (var t = new mr(), a = new R(r), e, i, s, o, u, m = 0; m < a.length; m++) {
      for (var k = a.slice(m), b = this.trie.commonPrefixSearch(k), v = 0; v < b.length; v++) {
        i = b[v].v, e = b[v].k;
        for (var C = this.token_info_dictionary.target_map[i], E = 0; E < C.length; E++) {
          var A = parseInt(C[E]);
          s = this.token_info_dictionary.dictionary.getShort(A), o = this.token_info_dictionary.dictionary.getShort(A + 2), u = this.token_info_dictionary.dictionary.getShort(A + 4), t.append(new M(A, u, m + 1, e.length, "KNOWN", s, o, e));
        }
      }
      var T = new R(k), z = new R(T.charAt(0)), f = this.unknown_dictionary.lookup(z.toString());
      if (b == null || b.length === 0 || f.is_always_invoke === 1) {
        if (e = z, f.is_grouping === 1 && 1 < T.length)
          for (var y = 1; y < T.length; y++) {
            var d = T.charAt(y), g = this.unknown_dictionary.lookup(d);
            if (f.class_name !== g.class_name)
              break;
            e += d;
          }
        for (var h = this.unknown_dictionary.target_map[f.class_id], l = 0; l < h.length; l++) {
          var c = parseInt(h[l]);
          s = this.unknown_dictionary.dictionary.getShort(c), o = this.unknown_dictionary.dictionary.getShort(c + 2), u = this.unknown_dictionary.dictionary.getShort(c + 4), t.append(new M(c, u, m + 1, e.length, "UNKNOWN", s, o, e.toString()));
        }
      }
    }
    return t.appendEos(), t;
  }
}
class wr {
  constructor(r) {
    this.connection_costs = r;
  }
  /**
   * Search best path by forward-backward algorithm
   * @param {ViterbiLattice} lattice Viterbi lattice to search
   * @returns {Array} Shortest path
   */
  search(r) {
    return r = this.forward(r), this.backward(r);
  }
  forward(r) {
    var t, a, e;
    for (t = 1; t <= r.eos_pos; t++) {
      var i = r.nodes_end_at[t];
      if (i != null)
        for (a = 0; a < i.length; a++) {
          var s = i[a], o = Number.MAX_VALUE, u, m = r.nodes_end_at[s.start_pos - 1];
          if (m != null) {
            for (e = 0; e < m.length; e++) {
              var k = m[e], b;
              s.left_id == null || k.right_id == null ? (console.log("Left or right is null"), b = 0) : b = this.connection_costs.get(k.right_id, s.left_id);
              var v = k.shortest_cost + b + s.cost;
              v < o && (u = k, o = v);
            }
            s.prev = u, s.shortest_cost = o;
          }
        }
    }
    return r;
  }
  backward(r) {
    var t = [], a = r.nodes_end_at[r.nodes_end_at.length - 1][0], e = a.prev;
    if (e == null)
      return [];
    for (; e.type !== "BOS"; ) {
      if (t.push(e), e.prev == null)
        return [];
      e = e.prev;
    }
    return t.reverse();
  }
}
class Ar {
  constructor() {
  }
  formatEntry(r, t, a, e) {
    var i = {};
    return i.word_id = r, i.word_type = a, i.word_position = t, i.surface_form = e[0], i.pos = e[1], i.pos_detail_1 = e[2], i.pos_detail_2 = e[3], i.pos_detail_3 = e[4], i.conjugated_type = e[5], i.conjugated_form = e[6], i.basic_form = e[7], i.reading = e[8], i.pronunciation = e[9], i;
  }
  formatUnknownEntry(r, t, a, e, i) {
    var s = {};
    return s.word_id = r, s.word_type = a, s.word_position = t, s.surface_form = i, s.pos = e[1], s.pos_detail_1 = e[2], s.pos_detail_2 = e[3], s.pos_detail_3 = e[4], s.conjugated_type = e[5], s.conjugated_form = e[6], s.basic_form = e[7], s;
  }
}
var kr = /、|。/;
class V {
  constructor(r) {
    this.token_info_dictionary = r.token_info_dictionary, this.unknown_dictionary = r.unknown_dictionary, this.viterbi_builder = new br(r), this.viterbi_searcher = new wr(r.connection_costs), this.formatter = new Ar();
  }
  /**
   * Split into sentence by punctuation
   * @param {string} input Input text
   * @returns {Array.<string>} Sentences end with punctuation
   */
  static splitByPunctuation(r) {
    for (var t = [], a = r; a !== ""; ) {
      var e = a.search(kr);
      if (e < 0) {
        t.push(a);
        break;
      }
      t.push(a.substring(0, e + 1)), a = a.substring(e + 1);
    }
    return t;
  }
  /**
   * Tokenize text
   * @param {string} text Input text to analyze
   * @returns {Array} Tokens
   */
  tokenize(r) {
    for (var t = V.splitByPunctuation(r), a = [], e = 0; e < t.length; e++) {
      var i = t[e];
      this.tokenizeForSentence(i, a);
    }
    return a;
  }
  tokenizeForSentence(r, t) {
    t == null && (t = []);
    var a = this.getLattice(r), e = this.viterbi_searcher.search(a), i = 0;
    t.length > 0 && (i = t[t.length - 1].word_position);
    for (var s = 0; s < e.length; s++) {
      var o = e[s], u, m, k;
      o.type === "KNOWN" ? (k = this.token_info_dictionary.getFeatures(o.name), k == null ? m = [] : m = k.split(","), u = this.formatter.formatEntry(o.name, i + o.start_pos, o.type, m)) : o.type === "UNKNOWN" ? (k = this.unknown_dictionary.getFeatures(o.name), k == null ? m = [] : m = k.split(","), u = this.formatter.formatUnknownEntry(o.name, i + o.start_pos, o.type, m, o.surface_form)) : u = this.formatter.formatEntry(o.name, i + o.start_pos, o.type, []), t.push(u);
    }
    return t;
  }
  /**
   * Build word lattice
   * @param {string} text Input text to analyze
   * @returns {ViterbiLattice} Word lattice
   */
  getLattice(r) {
    return this.viterbi_builder.build(r);
  }
}
function xr(n) {
  return n && n.__esModule && Object.prototype.hasOwnProperty.call(n, "default") ? n.default : n;
}
var ar = { exports: {} };
(function(n) {
  (function() {
    var r = "\0", t = 0, a = 0, e = -1, i = !0, s = !0, o = 4, u = 4, m = 2, k = function(f) {
      f == null && (f = 1024);
      var y = function(p, _, w) {
        for (var F = _; F < w; F++)
          p[F] = -F + 1;
        if (0 < c.array[c.array.length - 1]) {
          for (var N = c.array.length - 2; 0 < c.array[N]; )
            N--;
          p[_] = -N;
        }
      }, d = function(p, _, w) {
        for (var F = _; F < w; F++)
          p[F] = -F - 1;
      }, g = function(p) {
        var _ = p * m, w = C(l.signed, l.bytes, _);
        y(w, l.array.length, _), w.set(l.array), l.array = null, l.array = w;
        var F = C(c.signed, c.bytes, _);
        d(F, c.array.length, _), F.set(c.array), c.array = null, c.array = F;
      }, h = a + 1, l = {
        signed: i,
        bytes: o,
        array: C(i, o, f)
      }, c = {
        signed: s,
        bytes: u,
        array: C(s, u, f)
      };
      return l.array[a] = 1, c.array[a] = a, y(l.array, a + 1, l.array.length), d(c.array, a + 1, c.array.length), {
        getBaseBuffer: function() {
          return l.array;
        },
        getCheckBuffer: function() {
          return c.array;
        },
        loadBaseBuffer: function(p) {
          return l.array = p, this;
        },
        loadCheckBuffer: function(p) {
          return c.array = p, this;
        },
        size: function() {
          return Math.max(l.array.length, c.array.length);
        },
        getBase: function(p) {
          return l.array.length - 1 < p ? -p + 1 : l.array[p];
        },
        getCheck: function(p) {
          return c.array.length - 1 < p ? -p - 1 : c.array[p];
        },
        setBase: function(p, _) {
          l.array.length - 1 < p && g(p), l.array[p] = _;
        },
        setCheck: function(p, _) {
          c.array.length - 1 < p && g(p), c.array[p] = _;
        },
        setFirstUnusedNode: function(p) {
          h = p;
        },
        getFirstUnusedNode: function() {
          return h;
        },
        shrink: function() {
          for (var p = this.size() - 1; !(0 <= c.array[p]); )
            p--;
          l.array = l.array.subarray(0, p + 2), c.array = c.array.subarray(0, p + 2);
        },
        calc: function() {
          for (var p = 0, _ = c.array.length, w = 0; w < _; w++)
            c.array[w] < 0 && p++;
          return {
            all: _,
            unused: p,
            efficiency: (_ - p) / _
          };
        },
        dump: function() {
          var p = "", _ = "", w;
          for (w = 0; w < l.array.length; w++)
            p = p + " " + this.getBase(w);
          for (w = 0; w < c.array.length; w++)
            _ = _ + " " + this.getCheck(w);
          return console.log("base:" + p), console.log("chck:" + _), "base:" + p + " chck:" + _;
        }
      };
    };
    function b(f) {
      this.bc = k(f), this.keys = [];
    }
    b.prototype.append = function(f, y) {
      return this.keys.push({ k: f, v: y }), this;
    }, b.prototype.build = function(f, y) {
      if (f == null && (f = this.keys), f == null)
        return new v(this.bc);
      y == null && (y = !1);
      var d = f.map(function(g) {
        return {
          k: A(g.k + r),
          v: g.v
        };
      });
      return y ? this.keys = d : this.keys = d.sort(function(g, h) {
        for (var l = g.k, c = h.k, p = Math.min(l.length, c.length), _ = 0; _ < p; _++)
          if (l[_] !== c[_])
            return l[_] - c[_];
        return l.length - c.length;
      }), d = null, this._build(a, 0, 0, this.keys.length), new v(this.bc);
    }, b.prototype._build = function(f, y, d, g) {
      var h = this.getChildrenInfo(y, d, g), l = this.findAllocatableBase(h);
      this.setBC(f, h, l);
      for (var c = 0; c < h.length; c = c + 3) {
        var p = h[c];
        if (p !== t) {
          var _ = h[c + 1], w = h[c + 2], F = l + p;
          this._build(F, y + 1, _, w);
        }
      }
    }, b.prototype.getChildrenInfo = function(f, y, d) {
      var g = this.keys[y].k[f], h = 0, l = new Int32Array(d * 3);
      l[h++] = g, l[h++] = y;
      for (var c = y, p = y; c < y + d; c++) {
        var _ = this.keys[c].k[f];
        g !== _ && (l[h++] = c - p, l[h++] = _, l[h++] = c, g = _, p = c);
      }
      return l[h++] = c - p, l = l.subarray(0, h), l;
    }, b.prototype.setBC = function(f, y, d) {
      var g = this.bc;
      g.setBase(f, d);
      var h;
      for (h = 0; h < y.length; h = h + 3) {
        var l = y[h], c = d + l, p = -g.getBase(c), _ = -g.getCheck(c);
        c !== g.getFirstUnusedNode() ? g.setCheck(p, -_) : g.setFirstUnusedNode(_), g.setBase(_, -p);
        var w = f;
        if (g.setCheck(c, w), l === t) {
          var F = y[h + 1], N = this.keys[F].v;
          N == null && (N = 0);
          var hr = -N - 1;
          g.setBase(c, hr);
        }
      }
    }, b.prototype.findAllocatableBase = function(f) {
      for (var y = this.bc, d, g = y.getFirstUnusedNode(); ; ) {
        if (d = g - f[0], d < 0) {
          g = -y.getCheck(g);
          continue;
        }
        for (var h = !0, l = 0; l < f.length; l = l + 3) {
          var c = f[l], p = d + c;
          if (!this.isUnusedNode(p)) {
            g = -y.getCheck(g), h = !1;
            break;
          }
        }
        if (h)
          return d;
      }
    }, b.prototype.isUnusedNode = function(f) {
      var y = this.bc, d = y.getCheck(f);
      return f === a ? !1 : d < 0;
    };
    function v(f) {
      this.bc = f, this.bc.shrink();
    }
    v.prototype.contain = function(f) {
      var y = this.bc;
      f += r;
      for (var d = A(f), g = a, h = e, l = 0; l < d.length; l++) {
        var c = d[l];
        if (h = this.traverse(g, c), h === e)
          return !1;
        if (y.getBase(h) <= 0)
          return !0;
        g = h;
      }
      return !1;
    }, v.prototype.lookup = function(f) {
      f += r;
      for (var y = A(f), d = a, g = e, h = 0; h < y.length; h++) {
        var l = y[h];
        if (g = this.traverse(d, l), g === e)
          return e;
        d = g;
      }
      var c = this.bc.getBase(g);
      return c <= 0 ? -c - 1 : e;
    }, v.prototype.commonPrefixSearch = function(f) {
      for (var y = A(f), d = a, g = e, h = [], l = 0; l < y.length; l++) {
        var c = y[l];
        if (g = this.traverse(d, c), g !== e) {
          d = g;
          var p = this.traverse(g, t);
          if (p !== e) {
            var _ = this.bc.getBase(p), w = {};
            _ <= 0 && (w.v = -_ - 1), w.k = T(E(y, 0, l + 1)), h.push(w);
          }
          continue;
        } else
          break;
      }
      return h;
    }, v.prototype.traverse = function(f, y) {
      var d = this.bc.getBase(f) + y;
      return this.bc.getCheck(d) === f ? d : e;
    }, v.prototype.size = function() {
      return this.bc.size();
    }, v.prototype.calc = function() {
      return this.bc.calc();
    }, v.prototype.dump = function() {
      return this.bc.dump();
    };
    var C = function(f, y, d) {
      if (f)
        switch (y) {
          case 1:
            return new Int8Array(d);
          case 2:
            return new Int16Array(d);
          case 4:
            return new Int32Array(d);
          default:
            throw new RangeError("Invalid newArray parameter element_bytes:" + y);
        }
      else
        switch (y) {
          case 1:
            return new Uint8Array(d);
          case 2:
            return new Uint16Array(d);
          case 4:
            return new Uint32Array(d);
          default:
            throw new RangeError("Invalid newArray parameter element_bytes:" + y);
        }
    }, E = function(f, y, d) {
      var g = new ArrayBuffer(d), h = new Uint8Array(g, 0, d), l = f.subarray(y, d);
      return h.set(l), h;
    }, A = function(f) {
      for (var y = new Uint8Array(new ArrayBuffer(f.length * 4)), d = 0, g = 0; d < f.length; ) {
        var h, l = f.charCodeAt(d++);
        if (l >= 55296 && l <= 56319) {
          var c = l, p = f.charCodeAt(d++);
          if (p >= 56320 && p <= 57343)
            h = (c - 55296) * 1024 + 65536 + (p - 56320);
          else
            return null;
        } else
          h = l;
        h < 128 ? y[g++] = h : h < 2048 ? (y[g++] = h >>> 6 | 192, y[g++] = h & 63 | 128) : h < 65536 ? (y[g++] = h >>> 12 | 224, y[g++] = h >> 6 & 63 | 128, y[g++] = h & 63 | 128) : h < 1 << 21 && (y[g++] = h >>> 18 | 240, y[g++] = h >> 12 & 63 | 128, y[g++] = h >> 6 & 63 | 128, y[g++] = h & 63 | 128);
      }
      return y.subarray(0, g);
    }, T = function(f) {
      for (var y = "", d, g, h, l, c, p, _, w = 0; w < f.length; )
        g = f[w++], g < 128 ? d = g : g >> 5 === 6 ? (h = f[w++], d = (g & 31) << 6 | h & 63) : g >> 4 === 14 ? (h = f[w++], l = f[w++], d = (g & 15) << 12 | (h & 63) << 6 | l & 63) : (h = f[w++], l = f[w++], c = f[w++], d = (g & 7) << 18 | (h & 63) << 12 | (l & 63) << 6 | c & 63), d < 65536 ? y += String.fromCharCode(d) : (d -= 65536, p = 55296 | d >> 10, _ = 56320 | d & 1023, y += String.fromCharCode(p, _));
      return y;
    }, z = {
      builder: function(f) {
        return new b(f);
      },
      load: function(f, y) {
        var d = k(0);
        return d.loadBaseBuffer(f), d.loadCheckBuffer(y), new v(d);
      }
    };
    n.exports = z;
  })();
})(ar);
var Cr = ar.exports;
const J = /* @__PURE__ */ xr(Cr);
var Fr = function(n) {
  for (var r = new Uint8Array(n.length * 4), t = 0, a = 0; t < n.length; ) {
    var e, i = n.charCodeAt(t++);
    if (i >= 55296 && i <= 56319) {
      var s = i, o = n.charCodeAt(t++);
      if (o >= 56320 && o <= 57343)
        e = (s - 55296) * 1024 + 65536 + (o - 56320);
      else
        return null;
    } else
      e = i;
    e < 128 ? r[a++] = e : e < 2048 ? (r[a++] = e >>> 6 | 192, r[a++] = e & 63 | 128) : e < 65536 ? (r[a++] = e >>> 12 | 224, r[a++] = e >> 6 & 63 | 128, r[a++] = e & 63 | 128) : e < 1 << 21 && (r[a++] = e >>> 18 | 240, r[a++] = e >> 12 & 63 | 128, r[a++] = e >> 6 & 63 | 128, r[a++] = e & 63 | 128);
  }
  return r.subarray(0, a);
}, Tr = function(n) {
  for (var r = "", t, a, e, i, s, o, u, m = 0; m < n.length; )
    a = n[m++], a < 128 ? t = a : a >> 5 === 6 ? (e = n[m++], t = (a & 31) << 6 | e & 63) : a >> 4 === 14 ? (e = n[m++], i = n[m++], t = (a & 15) << 12 | (e & 63) << 6 | i & 63) : (e = n[m++], i = n[m++], s = n[m++], t = (a & 7) << 18 | (e & 63) << 12 | (i & 63) << 6 | s & 63), t < 65536 ? r += String.fromCharCode(t) : (t -= 65536, o = 55296 | t >> 10, u = 56320 | t & 1023, r += String.fromCharCode(o, u));
  return r;
};
class I {
  constructor(r) {
    var t;
    if (r == null)
      t = 1024 * 1024;
    else if (typeof r == "number")
      t = r;
    else if (r instanceof Uint8Array) {
      this.buffer = r, this.position = 0;
      return;
    } else
      throw typeof r + " is invalid parameter type for ByteBuffer constructor";
    this.buffer = new Uint8Array(t), this.position = 0;
  }
  size() {
    return this.buffer.length;
  }
  reallocate() {
    var r = new Uint8Array(this.buffer.length * 2);
    r.set(this.buffer), this.buffer = r;
  }
  shrink() {
    return this.buffer = this.buffer.subarray(0, this.position), this.buffer;
  }
  put(r) {
    this.buffer.length < this.position + 1 && this.reallocate(), this.buffer[this.position++] = r;
  }
  get(r) {
    return r == null && (r = this.position, this.position += 1), this.buffer.length < r + 1 ? 0 : this.buffer[r];
  }
  // Write short to buffer by little endian
  putShort(r) {
    if (65535 < r)
      throw r + " is over short value";
    var t = 255 & r, a = (65280 & r) >> 8;
    this.put(t), this.put(a);
  }
  // Read short from buffer by little endian
  getShort(r) {
    if (r == null && (r = this.position, this.position += 2), this.buffer.length < r + 2)
      return 0;
    var t = this.buffer[r], a = this.buffer[r + 1], e = (a << 8) + t;
    return e & 32768 && (e = -(e - 1 ^ 65535)), e;
  }
  // Write integer to buffer by little endian
  putInt(r) {
    if (4294967295 < r)
      throw r + " is over integer value";
    var t = 255 & r, a = (65280 & r) >> 8, e = (16711680 & r) >> 16, i = (4278190080 & r) >> 24;
    this.put(t), this.put(a), this.put(e), this.put(i);
  }
  // Read integer from buffer by little endian
  getInt(r) {
    if (r == null && (r = this.position, this.position += 4), this.buffer.length < r + 4)
      return 0;
    var t = this.buffer[r], a = this.buffer[r + 1], e = this.buffer[r + 2], i = this.buffer[r + 3];
    return (i << 24) + (e << 16) + (a << 8) + t;
  }
  readInt() {
    var r = this.position;
    return this.position += 4, this.getInt(r);
  }
  putString(r) {
    for (var t = Fr(r), a = 0; a < t.length; a++)
      this.put(t[a]);
    this.put(0);
  }
  getString(r) {
    var t = [], a;
    for (r == null && (r = this.position); !(this.buffer.length < r + 1 || (a = this.get(r++), a === 0)); )
      t.push(a);
    return this.position = r, Tr(t);
  }
}
class Y {
  constructor() {
    this.dictionary = new I(10 * 1024 * 1024), this.target_map = {}, this.pos_buffer = new I(10 * 1024 * 1024);
  }
  // left_id right_id word_cost ...
  // ^ this position is token_info_id
  buildDictionary(r) {
    for (var t = {}, a = 0; a < r.length; a++) {
      var e = r[a];
      if (!(e.length < 4)) {
        var i = e[0], s = e[1], o = e[2], u = e[3], m = e.slice(4).join(",");
        (!isFinite(s) || !isFinite(o) || !isFinite(u)) && console.log(e);
        var k = this.put(s, o, u, i, m);
        t[k] = i;
      }
    }
    return this.dictionary.shrink(), this.pos_buffer.shrink(), t;
  }
  put(r, t, a, e, i) {
    var s = this.dictionary.position, o = this.pos_buffer.position;
    return this.dictionary.putShort(r), this.dictionary.putShort(t), this.dictionary.putShort(a), this.dictionary.putInt(o), this.pos_buffer.putString(e + "," + i), s;
  }
  addMapping(r, t) {
    var a = this.target_map[r];
    a == null && (a = []), a.push(t), this.target_map[r] = a;
  }
  targetMapToBuffer() {
    var r = new I(), t = Object.keys(this.target_map).length;
    r.putInt(t);
    for (var a in this.target_map) {
      var e = this.target_map[a], i = e.length;
      r.putInt(parseInt(a)), r.putInt(i);
      for (var s = 0; s < e.length; s++)
        r.putInt(e[s]);
    }
    return r.shrink();
  }
  // from tid.dat
  loadDictionary(r) {
    return this.dictionary = new I(r), this;
  }
  // from tid_pos.dat
  loadPosVector(r) {
    return this.pos_buffer = new I(r), this;
  }
  // from tid_map.dat
  loadTargetMap(r) {
    var t = new I(r);
    for (t.position = 0, this.target_map = {}, t.readInt(); !(t.buffer.length < t.position + 1); )
      for (var a = t.readInt(), e = t.readInt(), i = 0; i < e; i++) {
        var s = t.readInt();
        this.addMapping(a, s);
      }
    return this;
  }
  /**
   * Look up features in the dictionary
   * @param {string} token_info_id_str Word ID to look up
   * @returns {string} Features string concatenated by ","
   */
  getFeatures(r) {
    var t = parseInt(r);
    if (isNaN(t))
      return "";
    var a = this.dictionary.getInt(t + 6);
    return this.pos_buffer.getString(a);
  }
}
class ir {
  constructor(r, t) {
    this.forward_dimension = r, this.backward_dimension = t, this.buffer = new Int16Array(r * t + 2), this.buffer[0] = r, this.buffer[1] = t;
  }
  put(r, t, a) {
    var e = r * this.backward_dimension + t + 2;
    if (this.buffer.length < e + 1)
      throw "ConnectionCosts buffer overflow";
    this.buffer[e] = a;
  }
  get(r, t) {
    var a = r * this.backward_dimension + t + 2;
    if (this.buffer.length < a + 1)
      throw "ConnectionCosts buffer overflow";
    return this.buffer[a];
  }
  loadConnectionCosts(r) {
    this.forward_dimension = r[0], this.backward_dimension = r[1], this.buffer = r;
  }
}
class nr {
  constructor(r, t, a, e, i) {
    this.class_id = r, this.class_name = t, this.is_always_invoke = a, this.is_grouping = e, this.max_length = i;
  }
}
class H {
  constructor() {
    this.map = [], this.lookup_table = {};
  }
  /**
   * Load InvokeDefinitionMap from buffer
   * @param {Uint8Array} invoke_def_buffer
   * @returns {InvokeDefinitionMap}
   */
  static load(r) {
    for (var t = new H(), a = [], e = new I(r); e.position + 1 < e.size(); ) {
      var i = a.length, s = e.get(), o = e.get(), u = e.getInt(), m = e.getString();
      a.push(new nr(i, m, s, o, u));
    }
    return t.init(a), t;
  }
  /**
   * Initializing method
   * @param {Array.<CharacterClass>} character_category_definition Array of CharacterClass
   */
  init(r) {
    if (r != null)
      for (var t = 0; t < r.length; t++) {
        var a = r[t];
        this.map[t] = a, this.lookup_table[a.class_name] = t;
      }
  }
  /**
   * Get class information by class ID
   * @param {number} class_id
   * @returns {CharacterClass}
   */
  getCharacterClass(r) {
    return this.map[r];
  }
  /**
   * For building character definition dictionary
   * @param {string} class_name character
   * @returns {number} class_id
   */
  lookup(r) {
    var t = this.lookup_table[r];
    return t ?? null;
  }
  /**
   * Transform from map to binary buffer
   * @returns {Uint8Array}
   */
  toBuffer() {
    for (var r = new I(), t = 0; t < this.map.length; t++) {
      var a = this.map[t];
      r.put(a.is_always_invoke), r.put(a.is_grouping), r.putInt(a.max_length), r.putString(a.class_name);
    }
    return r.shrink(), r.buffer;
  }
}
var G = "DEFAULT";
class j {
  constructor() {
    this.character_category_map = new Uint8Array(65536), this.compatible_category_map = new Uint32Array(65536), this.invoke_definition_map = null;
  }
  /**
   * Load CharacterDefinition
   * @param {Uint8Array} cat_map_buffer
   * @param {Uint32Array} compat_cat_map_buffer
   * @param {InvokeDefinitionMap} invoke_def_buffer
   * @returns {CharacterDefinition}
   */
  static load(r, t, a) {
    var e = new j();
    return e.character_category_map = r, e.compatible_category_map = t, e.invoke_definition_map = H.load(a), e;
  }
  static parseCharCategory(r, t) {
    var a = t[1], e = parseInt(t[2]), i = parseInt(t[3]), s = parseInt(t[4]);
    if (!isFinite(e) || e !== 0 && e !== 1)
      return console.log("char.def parse error. INVOKE is 0 or 1 in:" + e), null;
    if (!isFinite(i) || i !== 0 && i !== 1)
      return console.log("char.def parse error. GROUP is 0 or 1 in:" + i), null;
    if (!isFinite(s) || s < 0)
      return console.log("char.def parse error. LENGTH is 1 to n:" + s), null;
    var o = e === 1, u = i === 1;
    return new nr(r, a, o, u, s);
  }
  static parseCategoryMapping(r) {
    var t = parseInt(r[1]), a = r[2], e = 3 < r.length ? r.slice(3) : [];
    return (!isFinite(t) || t < 0 || t > 65535) && console.log("char.def parse error. CODE is invalid:" + t), { start: t, default: a, compatible: e };
  }
  static parseRangeCategoryMapping(r) {
    var t = parseInt(r[1]), a = parseInt(r[2]), e = r[3], i = 4 < r.length ? r.slice(4) : [];
    return (!isFinite(t) || t < 0 || t > 65535) && console.log("char.def parse error. CODE is invalid:" + t), (!isFinite(a) || a < 0 || a > 65535) && console.log("char.def parse error. CODE is invalid:" + a), { start: t, end: a, default: e, compatible: i };
  }
  /**
   * Initializing method
   * @param {Array} category_mapping Array of category mapping
   */
  initCategoryMappings(r) {
    var t;
    if (r != null)
      for (var a = 0; a < r.length; a++) {
        var e = r[a], i = e.end || e.start;
        for (t = e.start; t <= i; t++) {
          this.character_category_map[t] = this.invoke_definition_map.lookup(e.default);
          for (var s = 0; s < e.compatible.length; s++) {
            var o = this.compatible_category_map[t], u = e.compatible[s];
            if (u != null) {
              var m = this.invoke_definition_map.lookup(u);
              if (m != null) {
                var k = 1 << m;
                o = o | k, this.compatible_category_map[t] = o;
              }
            }
          }
        }
      }
    var b = this.invoke_definition_map.lookup(G);
    if (b != null)
      for (t = 0; t < this.character_category_map.length; t++)
        this.character_category_map[t] === 0 && (this.character_category_map[t] = 1 << b);
  }
  /**
   * Lookup compatible categories for a character (not included 1st category)
   * @param {string} ch UCS2 character (just 1st character is effective)
   * @returns {Array.<CharacterClass>} character classes
   */
  lookupCompatibleCategory(r) {
    var t = [], a = r.charCodeAt(0), e;
    if (a < this.compatible_category_map.length && (e = this.compatible_category_map[a]), e == null || e === 0)
      return t;
    for (var i = 0; i < 32; i++)
      if (e << 31 - i >>> 31 === 1) {
        var s = this.invoke_definition_map.getCharacterClass(i);
        if (s == null)
          continue;
        t.push(s);
      }
    return t;
  }
  /**
   * Lookup category for a character
   * @param {string} ch UCS2 character (just 1st character is effective)
   * @returns {CharacterClass} character class
   */
  lookup(r) {
    var t, a = r.charCodeAt(0);
    return R.isSurrogatePair(r) ? t = this.invoke_definition_map.lookup(G) : a < this.character_category_map.length && (t = this.character_category_map[a]), t == null && (t = this.invoke_definition_map.lookup(G)), this.invoke_definition_map.getCharacterClass(t);
  }
}
class or extends Y {
  constructor() {
    super(), this.dictionary = new I(10 * 1024 * 1024), this.target_map = {}, this.pos_buffer = new I(10 * 1024 * 1024), this.character_definition = null;
  }
  characterDefinition(r) {
    return this.character_definition = r, this;
  }
  lookup(r) {
    return this.character_definition.lookup(r);
  }
  lookupCompatibleCategory(r) {
    return this.character_definition.lookupCompatibleCategory(r);
  }
  loadUnknownDictionaries(r, t, a, e, i, s) {
    this.loadDictionary(r), this.loadPosVector(t), this.loadTargetMap(a), this.character_definition = j.load(e, i, s);
  }
}
class sr {
  constructor(r, t, a, e) {
    r != null ? this.trie = r : this.trie = J.builder(0).build([
      { k: "", v: 1 }
    ]), t != null ? this.token_info_dictionary = t : this.token_info_dictionary = new Y(), a != null ? this.connection_costs = a : this.connection_costs = new ir(0, 0), e != null ? this.unknown_dictionary = e : this.unknown_dictionary = new or();
  }
  // from base.dat & check.dat
  loadTrie(r, t) {
    // try {
      return this.trie = J.load(new Int32Array(r), new Int32Array(t)), console.debug(`Successfully Loaded Kuromoji Trie Dict Files! 
De-compressed Size of Loaded Dicts: 
            base: ~${(r.byteLength / 1024 / 1024).toFixed(1)} MB
            check: ~${(t.byteLength / 1024 / 1024).toFixed(1)} MB`), this;
    // } catch (e) {
    //   console.error('loadTrie: ', e, ' Try decompress first:');
    //   r = brotli.decompress(r);
    //   t = brotli.decompress(t);
    //   return this.trie = J.load(new Int32Array(r), new Int32Array(t)), console.debug(`Successfully Loaded Kuromoji Trie Dict Files!
// De-compressed Size of Loaded Dicts:
//             base: ~${(r.byteLength / 1024 / 1024).toFixed(1)} MB
//             check: ~${(t.byteLength / 1024 / 1024).toFixed(1)} MB`), this;
//     }
  }
  loadTokenInfoDictionaries(r, t, a) {
    // try {
      return this.token_info_dictionary.loadDictionary(new Uint8Array(r)), this.token_info_dictionary.loadPosVector(new Uint8Array(t)), this.token_info_dictionary.loadTargetMap(new Uint8Array(a)), console.debug(`Successfully Loaded Kuromoji Token Info Dict Files! 
De-compressed Size of Loaded Dict Files: 
            token_info: ~${(r.byteLength / 1024 / 1024).toFixed(1)} MB
            pos: ~${(t.byteLength / 1024 / 1024).toFixed(1)} MB
            target_map: ~${(a.byteLength / 1024 / 1024).toFixed(1)} MB`), this;
    // } catch (e) {
    //   console.error('loadTokenInfoDictionaries: ', e, ' Try decompress first:');
      // r = brotli.decompress(r);
      // t = brotli.decompress(t);
      // a = brotli.decompress(a);
      // return this.token_info_dictionary.loadDictionary(new Uint8Array(r)), this.token_info_dictionary.loadPosVector(new Uint8Array(t)), this.token_info_dictionary.loadTargetMap(new Uint8Array(a)), console.debug(`Successfully Loaded Kuromoji Token Info Dict Files!
// De-compressed Size of Loaded Dict Files:
//             token_info: ~${(r.byteLength / 1024 / 1024).toFixed(1)} MB
//             pos: ~${(t.byteLength / 1024 / 1024).toFixed(1)} MB
//             target_map: ~${(a.byteLength / 1024 / 1024).toFixed(1)} MB`), this;
//     }
  }
  loadConnectionCosts(r) {
    // try {
    return this.connection_costs.loadConnectionCosts(new Int16Array(r)), console.debug(`Successfully Loaded Kuromoji Connection Cost Dict Files! 
De-compressed Size of Loaded Dict Files: 
            cc: ~${(r.byteLength / 1024 / 1024).toFixed(1)} MB`), this;
    // } catch (e) {
    //   console.error('loadTokenInfoDictionaries: ', e, ' Try decompress first:');
    //   r = brotli.decompress(r);
    //   return this.connection_costs.loadConnectionCosts(new Int16Array(r)), console.debug(`Successfully Loaded Kuromoji Connection Cost Dict Files!
// De-compressed Size of Loaded Dict Files:
//             cc: ~${(r.byteLength / 1024 / 1024).toFixed(1)} MB`), this;
//     }
  }
  loadUnknownDictionaries(r, t, a, e, i, s) {
    // try {
    return this.unknown_dictionary.loadUnknownDictionaries(new Uint8Array(r), new Uint8Array(t), new Uint8Array(a), new Uint8Array(e), new Uint32Array(i), new Uint8Array(s)), console.debug(`Successfully Loaded Kuromoji Unknown Dict Files! 
De-compressed Size of Loaded Dict Files: 
            unk: ~${(r.byteLength / 1024 / 1024).toFixed(1)} MB
            unk_pos: ~${(t.byteLength / 1024 / 1024).toFixed(1)} MB
            unk_map: ~${(a.byteLength / 1024 / 1024).toFixed(1)} MB
            cat_map: ~${(e.byteLength / 1024 / 1024).toFixed(1)} MB
            compat_cat_map: ~${(i.byteLength / 1024 / 1024).toFixed(1)} MB
            invoke_def: ~${(s.byteLength / 1024 / 1024).toFixed(1)} MB`), this;
    // } catch (e) {
    //   console.error('loadTokenInfoDictionaries: ', e, ' Try decompress first:');
    //   r = brotli.decompress(r);
    //   t = brotli.decompress(t);
    //   a = brotli.decompress(a);
    //   e = brotli.decompress(e);
    //   i = brotli.decompress(i);
    //   s = brotli.decompress(s);
    //   return this.unknown_dictionary.loadUnknownDictionaries(new Uint8Array(r), new Uint8Array(t), new Uint8Array(a), new Uint8Array(e), new Uint32Array(i), new Uint8Array(s)), console.debug(`Successfully Loaded Kuromoji Unknown Dict Files!
// De-compressed Size of Loaded Dict Files:
//             unk: ~${(r.byteLength / 1024 / 1024).toFixed(1)} MB
//             unk_pos: ~${(t.byteLength / 1024 / 1024).toFixed(1)} MB
//             unk_map: ~${(a.byteLength / 1024 / 1024).toFixed(1)} MB
//             cat_map: ~${(e.byteLength / 1024 / 1024).toFixed(1)} MB
//             compat_cat_map: ~${(i.byteLength / 1024 / 1024).toFixed(1)} MB
//             invoke_def: ~${(s.byteLength / 1024 / 1024).toFixed(1)} MB`), this;
//     }
  }
}
const Dr = import.meta.url.split("/").at(-2), ur = Dr != "loader", Sr = !0;
console.info(`Kuromoji is being loaded as a ${ur ? "Package/Library." : `Standalone Application.
Dictionary File paths will be adjusted once built and Loaded as a Package/Library`}`);
const x = class x {
  constructor() {
    this.dic = new sr();
  }
  static getActualDictlUrl(r, t) {
    return ur ? t ? `.${r}` : `./node_modules/kuroshiro-browser/dist${r}` : `../../..${r}`;
  }
  static getDictUrls() {
    return x.dictURLs;
  }
  static generateDictUrls(r) {
    x.dictURLs = {
      trie: {
        // base_buffer: x.getActualDictlUrl("/dict/base.dat.br", r),
        // check_buffer: x.getActualDictlUrl("/dict/check.dat.br", r)
        base_buffer: x.getActualDictlUrl("/dict/base.dat", r),
        check_buffer: x.getActualDictlUrl("/dict/check.dat", r)
      },
      tokenInfo: {
        // token_info_buffer: x.getActualDictlUrl("/dict/tid.dat.br", r),
        // pos_buffer: x.getActualDictlUrl("/dict/tid_pos.dat.br", r),
        // target_map_buffer: x.getActualDictlUrl("/dict/tid_map.dat.br", r)
        token_info_buffer: x.getActualDictlUrl("/dict/tid.dat", r),
        pos_buffer: x.getActualDictlUrl("/dict/tid_pos.dat", r),
        target_map_buffer: x.getActualDictlUrl("/dict/tid_map.dat", r)
      },
      connectionCost: {
        // cc_buffer: x.getActualDictlUrl("/dict/cc.dat.br", r)
        cc_buffer: x.getActualDictlUrl("/dict/cc.dat", r)
      },
      unknown: {
        // unk_buffer: x.getActualDictlUrl("/dict/unk.dat.br", r),
        // unk_pos_buffer: x.getActualDictlUrl("/dict/unk_pos.dat.br", r),
        // unk_map_buffer: x.getActualDictlUrl("/dict/unk_map.dat.br", r),
        // cat_map_buffer: x.getActualDictlUrl("/dict/unk_char.dat.br", r),
        // compat_cat_map_buffer: x.getActualDictlUrl("/dict/unk_compat.dat.br", r),
        // invoke_def_buffer: x.getActualDictlUrl("/dict/unk_invoke.dat.br", r)
        unk_buffer: x.getActualDictlUrl("/dict/unk.dat", r),
        unk_pos_buffer: x.getActualDictlUrl("/dict/unk_pos.dat", r),
        unk_map_buffer: x.getActualDictlUrl("/dict/unk_map.dat", r),
        cat_map_buffer: x.getActualDictlUrl("/dict/unk_char.dat", r),
        compat_cat_map_buffer: x.getActualDictlUrl("/dict/unk_compat.dat", r),
        invoke_def_buffer: x.getActualDictlUrl("/dict/unk_invoke.dat", r)
      }
    };
  }
  static loadArrayBuffer(r) {
    return new Promise((t, a) => {
      fetch(r).then((e) => {
        !e.ok ? a(e.statusText) : e.arrayBuffer().then((i) => t(i)).catch((i) => console.warn(i));
      }).catch((e) => {
        console.warn(e), a(e);
      });
    });
  }
  static loadDictCategoryBuffers(r) {
    const a = Object.entries(r).map(([e, i]) => x.loadArrayBuffer(i));
    return Promise.all(a);
  }
  static loadAllDictUrls() {
    const t = Object.entries(x.dictURLs).map(([category, buffers]) => x.loadDictCategoryBuffers(buffers));
    return Promise.all(t);
  }
  /**
   * Load dictionary files
   * @param {DictionaryLoader~onLoad} load_callback Callback function called after loaded
   */
  load(r) {
    var t = this.dic;
    x.dictURLs || x.generateDictUrls(Sr), x.loadAllDictUrls().then((a) => {
      let e = {
        trie: a[0],
        tokenInfo: a[1],
        connectionCost: a[2],
        unknown: a[3]
      };
      t.loadTrie(...e.trie);
      t.loadTokenInfoDictionaries(...e.tokenInfo);
      t.loadConnectionCosts(...e.connectionCost);
      t.loadUnknownDictionaries(...e.unknown);
      r(null, t);
    }).catch((a) => {
      console.error("Failed to Load Dicts!"), r(a, t);
    });
  }
};
q(x, "dictURLs", null);
let O = x;
class Ir {
  constructor() {
  }
  /**
   * Build Tokenizer instance by asynchronous manner
   * @param {TokenizerBuilder~onLoad} callback Callback function
   */
  build(r) {
    var t = new O();
    t.load(function(a, e) {
      r(a, new V(e));
    });
  }
}
class Er {
  constructor() {
    this.lines = 0, this.connection_cost = null;
  }
  putLine(r) {
    if (this.lines === 0) {
      var t = r.split(" "), a = t[0], e = t[1];
      if (a < 0 || e < 0)
        throw "Parse error of matrix.def";
      return this.connection_cost = new ir(a, e), this.lines++, this;
    }
    var i = r.split(" ");
    if (i.length !== 3)
      return this;
    var s = parseInt(i[0]), o = parseInt(i[1]), u = parseInt(i[2]);
    if (s < 0 || o < 0 || !isFinite(s) || !isFinite(o) || this.connection_cost.forward_dimension <= s || this.connection_cost.backward_dimension <= o)
      throw "Parse error of matrix.def";
    return this.connection_cost.put(s, o, u), this.lines++, this;
  }
  build() {
    return this.connection_cost;
  }
}
var Br = /^(\w+)\s+(\d)\s+(\d)\s+(\d)/, Nr = /^(0x[0-9A-F]{4})(?:\s+([^#\s]+))(?:\s+([^#\s]+))*/, Ur = /^(0x[0-9A-F]{4})\.\.(0x[0-9A-F]{4})(?:\s+([^#\s]+))(?:\s+([^#\s]+))*/;
class jr {
  constructor() {
    this.char_def = new j(), this.char_def.invoke_definition_map = new H(), this.character_category_definition = [], this.category_mapping = [];
  }
  putLine(r) {
    var t = Br.exec(r);
    if (t != null) {
      var a = this.character_category_definition.length, e = j.parseCharCategory(a, t);
      if (e == null)
        return;
      this.character_category_definition.push(e);
      return;
    }
    var i = Nr.exec(r);
    if (i != null) {
      var s = j.parseCategoryMapping(i);
      this.category_mapping.push(s);
    }
    var o = Ur.exec(r);
    if (o != null) {
      var u = j.parseRangeCategoryMapping(o);
      this.category_mapping.push(u);
    }
  }
  build() {
    return this.char_def.invoke_definition_map.init(this.character_category_definition), this.char_def.initCategoryMappings(this.category_mapping), this.char_def;
  }
}
class Rr {
  constructor() {
    this.tid_entries = [], this.unk_entries = [], this.cc_builder = new Er(), this.cd_builder = new jr();
  }
  addTokenInfoDictionary(r) {
    var t = r.split(",");
    return this.tid_entries.push(t), this;
  }
  /**
   * Put one line of "matrix.def" file for building ConnectionCosts object
   * @param {string} line is a line of "matrix.def"
   */
  putCostMatrixLine(r) {
    return this.cc_builder.putLine(r), this;
  }
  putCharDefLine(r) {
    return this.cd_builder.putLine(r), this;
  }
  /**
   * Put one line of "unk.def" file for building UnknownDictionary object
   * @param {string} line is a line of "unk.def"
   */
  putUnkDefLine(r) {
    return this.unk_entries.push(r.split(",")), this;
  }
  build() {
    var r = this.buildTokenInfoDictionary(), t = this.buildUnknownDictionary();
    return new sr(r.trie, r.token_info_dictionary, this.cc_builder.build(), t);
  }
  /**
   * Build TokenInfoDictionary
   *
   * @returns {{trie: *, token_info_dictionary: *}}
   */
  buildTokenInfoDictionary() {
    var r = new Y(), t = r.buildDictionary(this.tid_entries), a = this.buildDoubleArray();
    for (var e in t) {
      var i = t[e], s = a.lookup(i);
      r.addMapping(s, e);
    }
    return {
      trie: a,
      token_info_dictionary: r
    };
  }
  buildUnknownDictionary() {
    var r = new or(), t = r.buildDictionary(this.unk_entries), a = this.cd_builder.build();
    r.characterDefinition(a);
    for (var e in t) {
      var i = t[e], s = a.invoke_definition_map.lookup(i);
      r.addMapping(s, e);
    }
    return r;
  }
  /**
   * Build double array trie
   *
   * @returns {DoubleArray} Double-Array trie
   */
  buildDoubleArray() {
    var r = 0, t = this.tid_entries.map(function(e) {
      var i = e[0];
      return { k: i, v: r++ };
    }), a = J.builder(1024 * 1024);
    return a.build(t);
  }
}
var Kr = {
  builder: function() {
    return new Ir();
  },
  dictionaryBuilder: function() {
    return new Rr();
  }
};
class zr {
  /**
   * Constructor
   * @param {Object} [options] JSON object which have key-value pairs settings
   * @param {string} [options.dictUrls] Path of the dictionary files
   */
  constructor() {
    this._analyzer = null;
  }
  /**
   * Initialize the analyzer
   * @returns {Promise} Promise object represents the result of initialization
   */
  init() {
    return new Promise((r, t) => {
      const a = this;
      this._analyzer == null ? Kr.builder().build((e, i) => {
        if (e)
          return t(e);
        a._analyzer = i, r();
      }) : t(new Error("This analyzer has already been initialized."));
    });
  }
  /**
   * Parse the given string
   * @param {string} str input string
   * @returns {Promise} Promise object represents the result of parsing
   * @example The result of parsing
   * [{
   *     "surface_form": "黒白",    // 表層形
   *     "pos": "名詞",               // 品詞 (part of speech)
   *     "pos_detail_1": "一般",      // 品詞細分類1
   *     "pos_detail_2": "*",        // 品詞細分類2
   *     "pos_detail_3": "*",        // 品詞細分類3
   *     "conjugated_type": "*",     // 活用型
   *     "conjugated_form": "*",     // 活用形
   *     "basic_form": "黒白",      // 基本形
   *     "reading": "クロシロ",       // 読み
   *     "pronunciation": "クロシロ",  // 発音
   *     "verbose": {                 // Other properties
   *         "word_id": 413560,
   *         "word_type": "KNOWN",
   *         "word_position": 1
   *     }
   * }]
   */
  parse(r = "") {
    return new Promise((t, a) => {
      if (r.trim() === "")
        return t([]);
      const e = this._analyzer.tokenize(r);
      for (let i = 0; i < e.length; i++)
        e[i].verbose = {}, e[i].verbose.word_id = e[i].word_id, e[i].verbose.word_type = e[i].word_type, e[i].verbose.word_position = e[i].word_position, delete e[i].word_id, delete e[i].word_type, delete e[i].word_position;
      t(e);
    });
  }
}
const lr = {
  isHiragana: P,
  isKatakana: K,
  isKana: $,
  isKanji: B,
  isJapanese: Q,
  hasHiragana: rr,
  hasKatakana: tr,
  hasKana: yr,
  hasKanji: er,
  hasJapanese: X,
  kanaToHiragna: dr,
  kanaToKatakana: _r,
  kanaToRomaji: vr
};
class W {
  /**
   * Constructor
   * @constructs Kuroshiro
   */
  constructor() {
    this._analyzer = null, this.Util = lr;
  }
  /**
   * Initialize Kuroshiro
   * @memberOf Kuroshiro
   * @instance
   * @returns {Promise} Promise object represents the result of initialization
   */
  async init(r, t = !0) {
    if (O.generateDictUrls(t), !r || typeof r != "object" || typeof r.init != "function" || typeof r.parse != "function")
      throw new Error("Invalid initialization parameter.");
    if (this._analyzer == null)
      await r.init(), this._analyzer = r;
    else
      throw new Error("Kuroshiro has already been initialized.");
  }
  // async init (analyzer) {
  //     console.warn("Kuroshiro.init called without environment flag. \nAssuming Prod, though this will mean that dictionary links will be broken in dev. \nTo avoid this issue, please call Kuroshiro.init(analyzer, IS_PROD) indicating whether this is prod or not.")
  // }
  static buildAndInitWithKuromoji(r) {
    const t = new W();
    return new Promise((a, e) => {
      t.init(new zr(), r).then(() => a(t)).catch(e);
    });
  }
  getFurigana(r, t = { ...console, success: console.log }) {
    return new Promise((a, e) => {
      this.convert(r, { to: "hiragana", mode: "furigana" }).then((i) => {
        t.success(`Furigana Added to Message:
${i}`), a(i);
      }).catch((i) => {
        t.error(`failed to get furigana: ${i}`), e(i);
      });
    });
  }
  /**
   * Convert given string to target syllabary with options available
   * @memberOf Kuroshiro
   * @instance
   * @param {string} str Given String
   * @param {Object} [options] Settings Object
   * @param {string} [options.to="hiragana"] Target syllabary ["hiragana"|"katakana"|"romaji"]
   * @param {string} [options.mode="normal"] Convert mode ["normal"|"spaced"|"okurigana"|"furigana"]
   * @param {string} [options.romajiSystem="hepburn"] Romanization System ["nippon"|"passport"|"hepburn"]
   * @param {string} [options.delimiter_start="("] Delimiter(Start)
   * @param {string} [options.delimiter_end=")"] Delimiter(End)
   * @returns {Promise} Promise object represents the result of conversion
   */
  async convert(r, t) {
    if (t = t || {}, t.to = t.to || "hiragana", t.mode = t.mode || "normal", t.romajiSystem = t.romajiSystem || D.HEPBURN, t.delimiter_start = t.delimiter_start || "(", t.delimiter_end = t.delimiter_end || ")", r = r || "", ["hiragana", "katakana", "romaji"].indexOf(t.to) === -1)
      throw new Error("Invalid Target Syllabary.");
    if (["normal", "spaced", "okurigana", "furigana"].indexOf(t.mode) === -1)
      throw new Error("Invalid Conversion Mode.");
    if (Object.keys(D).map((s) => D[s]).indexOf(t.romajiSystem) === -1)
      throw new Error("Invalid Romanization System.");
    const e = await this._analyzer.parse(r), i = pr(e);
    if (t.mode === "normal" || t.mode === "spaced")
      switch (t.to) {
        case "katakana":
          return t.mode === "normal" ? i.map((o) => o.reading).join("") : i.map((o) => o.reading).join(" ");
        case "romaji":
          const s = (o) => {
            let u;
            return X(o.surface_form) ? u = o.pronunciation || o.reading : u = o.surface_form, L(u, t.romajiSystem);
          };
          return t.mode === "normal" ? i.map(s).join("") : i.map(s).join(" ");
        case "hiragana":
          for (let o = 0; o < i.length; o++)
            if (er(i[o].surface_form))
              if (!tr(i[o].surface_form))
                i[o].reading = S(i[o].reading);
              else {
                i[o].reading = S(i[o].reading);
                let u = "", m = "";
                for (let v = 0; v < i[o].surface_form.length; v++)
                  B(i[o].surface_form[v]) ? m += "(.*)" : m += K(i[o].surface_form[v]) ? S(i[o].surface_form[v]) : i[o].surface_form[v];
                const b = new RegExp(m).exec(i[o].reading);
                if (b) {
                  let v = 0;
                  for (let C = 0; C < i[o].surface_form.length; C++)
                    B(i[o].surface_form[C]) ? (u += b[v + 1], v++) : u += i[o].surface_form[C];
                  i[o].reading = u;
                }
              }
            else
              i[o].reading = i[o].surface_form;
          return t.mode === "normal" ? i.map((o) => o.reading).join("") : i.map((o) => o.reading).join(" ");
        default:
          throw new Error("Unknown option.to param");
      }
    else if (t.mode === "okurigana" || t.mode === "furigana") {
      const s = [];
      for (let u = 0; u < i.length; u++)
        switch (gr(i[u].surface_form)) {
          case 0:
            s.push([i[u].surface_form, 1, S(i[u].reading), i[u].pronunciation || i[u].reading]);
            break;
          case 1:
            let k = "", b = !1;
            const v = [];
            for (let A = 0; A < i[u].surface_form.length; A++)
              B(i[u].surface_form[A]) ? b ? v[v.length - 1] += i[u].surface_form[A] : (b = !0, k += "(.+)", v.push(i[u].surface_form[A])) : (b = !1, v.push(i[u].surface_form[A]), k += K(i[u].surface_form[A]) ? S(i[u].surface_form[A]) : i[u].surface_form[A]);
            const E = new RegExp(`^${k}$`).exec(S(i[u].reading));
            if (E) {
              let A = 1;
              for (let T = 0; T < v.length; T++)
                B(v[T][0]) ? (s.push([v[T], 1, E[A], U(E[A])]), A += 1) : s.push([v[T], 2, S(v[T]), U(v[T])]);
            } else
              s.push([i[u].surface_form, 1, S(i[u].reading), i[u].pronunciation || i[u].reading]);
            break;
          case 2:
            for (let A = 0; A < i[u].surface_form.length; A++)
              s.push([i[u].surface_form[A], 2, S(i[u].reading[A]), i[u].pronunciation && i[u].pronunciation[A] || i[u].reading[A]]);
            break;
          case 3:
            for (let A = 0; A < i[u].surface_form.length; A++)
              s.push([i[u].surface_form[A], 3, i[u].surface_form[A], i[u].surface_form[A]]);
            break;
          default:
            throw new Error("Unknown strType");
        }
      let o = "";
      switch (t.to) {
        case "katakana":
          if (t.mode === "okurigana")
            for (let u = 0; u < s.length; u++)
              s[u][1] !== 1 ? o += s[u][0] : o += s[u][0] + t.delimiter_start + U(s[u][2]) + t.delimiter_end;
          else
            for (let u = 0; u < s.length; u++)
              s[u][1] !== 1 ? o += s[u][0] : o += `<ruby>${s[u][0]}<rp>${t.delimiter_start}</rp><rt>${U(s[u][2])}</rt><rp>${t.delimiter_end}</rp></ruby>`;
          return o;
        case "romaji":
          if (t.mode === "okurigana")
            for (let u = 0; u < s.length; u++)
              s[u][1] !== 1 ? o += s[u][0] : o += s[u][0] + t.delimiter_start + L(s[u][3], t.romajiSystem) + t.delimiter_end;
          else {
            o += "<ruby>";
            for (let u = 0; u < s.length; u++)
              o += `${s[u][0]}<rp>${t.delimiter_start}</rp><rt>${L(s[u][3], t.romajiSystem)}</rt><rp>${t.delimiter_end}</rp>`;
            o += "</ruby>";
          }
          return o;
        case "hiragana":
          if (t.mode === "okurigana")
            for (let u = 0; u < s.length; u++)
              s[u][1] !== 1 ? o += s[u][0] : o += s[u][0] + t.delimiter_start + s[u][2] + t.delimiter_end;
          else
            for (let u = 0; u < s.length; u++)
              s[u][1] !== 1 ? o += s[u][0] : o += `<ruby>${s[u][0]}<rp>${t.delimiter_start}</rp><rt>${s[u][2]}</rt><rp>${t.delimiter_end}</rp></ruby>`;
          return o;
        default:
          throw new Error("Invalid Target Syllabary.");
      }
    }
  }
}
W.Util = lr;
export {
  Kr as Kuromoji,
  W as Kuroshiro,
  zr as KuroshiroAnalyzerKuromoji
};
