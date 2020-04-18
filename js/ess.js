const electron = require("electron");
const {dialog} = require('electron').remote;
const path = require("path");
const url = require("url");
const {PythonShell} = require('python-shell') 

const remote = electron.remote;
const ipc = electron.ipcRenderer;

const strMap = require("../js/string.js")

const defaultVal = {
    'Power Flow Battery': {
        'ei-numOfEss': 1,
        'ei-selfDischareRatio': 0,
        'ei-dimen': 40,
        'ei-cost': 470,
        'ei-othercost': 0,
        'ei-inEffi': 0.78,
        'ei-outEffi': 0.78,
        'ei-threshold': 0.2,
        'ei-maxpin': 10,
        'ei-maxpout': 10,
        'ei-minsoc': 30,
        'ei-maxsoc': 70,
        'ei-p1c': 10,
        'ei-p1d': 0,
        'ei-p2c': 10,
        'ei-p2d': 10,
        // 'ei-p3c': ,
        // 'ei-p3d': ,
        // 'ei-p4c': ,
        // 'ei-p4d': ,
        // 'ei-p5c': ,
        // 'ei-p5d': ,
        // 'ei-p6c': ,
        // 'ei-p6d': ,
    }, 'Lithium-Ion': {
        'ei-numOfEss': 1,
        'ei-selfDischareRatio': 0,
        'ei-dimen': 20,
        'ei-cost': 310,
        'ei-othercost': 0, 
        'ei-inEffi': 0.95,
        'ei-outEffi': 0.95,
        'ei-threshold': 0.2,
        'ei-maxpin': 10,
        'ei-maxpout': 10,
        'ei-minsoc': 0,
        'ei-maxsoc': 100,
        'ei-p1c': 10000000,
        'ei-p1d': 2,
        'ei-p2c': 1000000,
        'ei-p2d': 4,
        'ei-p3c': 100000,
        'ei-p3d': 17,
        'ei-p4c': 40000,
        'ei-p4d': 30,
        'ei-p5c': 10000,
        'ei-p5d': 60,
        'ei-p6c': 3000,
        'ei-p6d': 100,
    }, 'Supercapacitor': {
        'ei-numOfEss': 1,
        'ei-selfDischareRatio': 0,
        'ei-dimen': 2,
        'ei-cost': 3100,
        'ei-othercost': 0,
        'ei-inEffi': 0.95,
        'ei-outEffi': 0.95,
        'ei-threshold': 0.2,
        'ei-maxpin': 10,
        'ei-maxpout': 10,
        'ei-minsoc': 0,
        'ei-maxsoc': 100,
        'ei-p1c': 10,
        'ei-p1d': 0,
        'ei-p2c': 10,
        'ei-p2d': 10,
//        'ei-p3c': 0,
//        'ei-p3d': 0,
//        'ei-p4c': 0,
//        'ei-p4d': 0,
//        'ei-p5c': 0,
//        'ei-p5d': 0,
//        'ei-p6c': 0,
//        'ei-p6d': 0,
    }, 'Custom': {
        'ei-numOfEss': 1,
        'ei-selfDischareRatio': 0,
        'ei-dimen': 20,
        'ei-cost': 310,
        'ei-othercost': 0, 
        'ei-inEffi': 0.95,
        'ei-outEffi': 0.95,
        'ei-threshold': 0.2,
        'ei-maxpin': 10,
        'ei-maxpout': 10,
        'ei-minsoc': 30,
        'ei-maxsoc': 70,
        'ei-p1c': 546875,
        'ei-p1d': 7,
        'ei-p2c': 56000,
        'ei-p2d': 24,
        'ei-p3c': 14000,
        'ei-p3d': 49,
        'ei-p4c': 9406,
        'ei-p4d': 60,
        'ei-p5c': 5334,
        'ei-p5d': 80,
        'ei-p6c': 3571,
        'ei-p6d': 98,
    }
}

var dodprofile;
var socprofile;
var thresholdestimation;

var threshold = document.getElementsByName('ei-threshold')[0]
var dimen_input = document.getElementsByName('ei-dimen')[0]
var minsoc_input = document.getElementsByName('ei-minsoc')[0]
var maxsoc_input = document.getElementsByName('ei-maxsoc')[0]
var max_power_input = document.getElementsByName('ei-maxpin')[0]
var max_power_output = document.getElementsByName('ei-maxpout')[0]

var SoCData =[];
var RealSoCdata = [{x:0,y:1.000000},{x:1,y:0.991500},{x:2,y:0.995000},{x:3,y:1.000000},{x:4,y:0.995000},{x:5,y:0.986500},{x:6,y:0.984000},{x:7,y:0.976000},{x:8,y:0.982500},{x:9,y:0.990500},{x:10,y:0.999000},{x:11,y:1.000000},{x:12,y:1.000000},{x:13,y:0.983500},{x:14,y:0.998500},{x:15,y:0.991000},{x:16,y:0.992000},{x:17,y:0.985000},{x:18,y:0.974500},{x:19,y:0.983500},{x:20,y:0.983000},{x:21,y:0.978000},{x:22,y:0.984000},{x:23,y:0.999500},{x:24,y:0.983500},{x:25,y:1.000000},{x:26,y:1.000000},{x:27,y:0.989500},{x:28,y:0.989500},{x:29,y:0.992000},{x:30,y:0.984000},{x:31,y:0.974000},{x:32,y:0.987000},{x:33,y:0.988500},{x:34,y:0.990500},{x:35,y:0.988500},{x:36,y:0.992000},{x:37,y:0.989500},{x:38,y:1.000000},{x:39,y:0.994500},{x:40,y:0.980000},{x:41,y:0.983000},{x:42,y:0.978000},{x:43,y:0.981500},{x:44,y:0.981500},{x:45,y:0.965500},{x:46,y:0.967000},{x:47,y:0.962000},{x:48,y:0.962500},{x:49,y:0.954000},{x:50,y:0.957500},{x:51,y:0.944500},{x:52,y:0.953000},{x:53,y:0.961000},{x:54,y:0.946500},{x:55,y:0.937000},{x:56,y:0.929000},{x:57,y:0.925000},{x:58,y:0.938500},{x:59,y:0.945000},{x:60,y:0.934000},{x:61,y:0.942000},{x:62,y:0.936500},{x:63,y:0.951000},{x:64,y:0.939000},{x:65,y:0.930000},{x:66,y:0.914000},{x:67,y:0.926000},{x:68,y:0.914500},{x:69,y:0.922000},{x:70,y:0.905500},{x:71,y:0.893500},{x:72,y:0.909500},{x:73,y:0.923500},{x:74,y:0.935000},{x:75,y:0.926500},{x:76,y:0.940000},{x:77,y:0.940000},{x:78,y:0.942500},{x:79,y:0.940000},{x:80,y:0.951500},{x:81,y:0.955000},{x:82,y:0.955000},{x:83,y:0.948000},{x:84,y:0.936500},{x:85,y:0.923500},{x:86,y:0.918500},{x:87,y:0.926500},{x:88,y:0.910000},{x:89,y:0.896500},{x:90,y:0.881500},{x:91,y:0.875000},{x:92,y:0.860000},{x:93,y:0.876000},{x:94,y:0.878500},{x:95,y:0.869500},{x:96,y:0.853000},{x:97,y:0.856500},{x:98,y:0.856500},{x:99,y:0.849000},{x:100,y:0.848500},{x:101,y:0.850500},{x:102,y:0.843500},{x:103,y:0.839000},{x:104,y:0.855000},{x:105,y:0.850000},{x:106,y:0.840500},{x:107,y:0.841500},{x:108,y:0.833000},{x:109,y:0.848500},{x:110,y:0.834000},{x:111,y:0.844500},{x:112,y:0.840500},{x:113,y:0.849000},{x:114,y:0.863500},{x:115,y:0.872000},{x:116,y:0.862500},{x:117,y:0.859000},{x:118,y:0.865500},{x:119,y:0.851000},{x:120,y:0.858500},{x:121,y:0.872500},{x:122,y:0.883000},{x:123,y:0.876500},{x:124,y:0.880000},{x:125,y:0.883500},{x:126,y:0.879000},{x:127,y:0.880500},{x:128,y:0.864000},{x:129,y:0.854000},{x:130,y:0.843500},{x:131,y:0.837500},{x:132,y:0.831500},{x:133,y:0.841500},{x:134,y:0.828500},{x:135,y:0.812000},{x:136,y:0.819000},{x:137,y:0.810500},{x:138,y:0.818000},{x:139,y:0.812000},{x:140,y:0.827000},{x:141,y:0.819000},{x:142,y:0.831000},{x:143,y:0.821500},{x:144,y:0.830500},{x:145,y:0.828500},{x:146,y:0.816000},{x:147,y:0.804500},{x:148,y:0.811000},{x:149,y:0.822000},{x:150,y:0.815500},{x:151,y:0.813500},{x:152,y:0.819500},{x:153,y:0.803500},{x:154,y:0.812500},{x:155,y:0.811500},{x:156,y:0.814500},{x:157,y:0.826500},{x:158,y:0.842500},{x:159,y:0.846000},{x:160,y:0.843000},{x:161,y:0.833000},{x:162,y:0.818000},{x:163,y:0.808500},{x:164,y:0.801500},{x:165,y:0.814500},{x:166,y:0.805000},{x:167,y:0.788500},{x:168,y:0.790500},{x:169,y:0.787500},{x:170,y:0.794000},{x:171,y:0.803500},{x:172,y:0.794000},{x:173,y:0.807000},{x:174,y:0.805000},{x:175,y:0.815000},{x:176,y:0.799000},{x:177,y:0.787000},{x:178,y:0.793000},{x:179,y:0.792500},{x:180,y:0.782500},{x:181,y:0.777000},{x:182,y:0.778500},{x:183,y:0.781000},{x:184,y:0.767000},{x:185,y:0.774000},{x:186,y:0.771500},{x:187,y:0.770500},{x:188,y:0.786000},{x:189,y:0.789000},{x:190,y:0.792500},{x:191,y:0.789000},{x:192,y:0.801500},{x:193,y:0.811500},{x:194,y:0.800500},{x:195,y:0.797000},{x:196,y:0.812000},{x:197,y:0.825500},{x:198,y:0.823000},{x:199,y:0.814000},{x:200,y:0.822000},{x:201,y:0.814000},{x:202,y:0.825500},{x:203,y:0.822000},{x:204,y:0.828500},{x:205,y:0.817500},{x:206,y:0.825000},{x:207,y:0.816000},{x:208,y:0.815000},{x:209,y:0.817500},{x:210,y:0.809000},{x:211,y:0.819500},{x:212,y:0.804000},{x:213,y:0.803000},{x:214,y:0.814000},{x:215,y:0.807000},{x:216,y:0.821000},{x:217,y:0.827000},{x:218,y:0.828500},{x:219,y:0.831000},{x:220,y:0.836500},{x:221,y:0.849500},{x:222,y:0.852500},{x:223,y:0.858000},{x:224,y:0.870000},{x:225,y:0.861000},{x:226,y:0.860500},{x:227,y:0.866500},{x:228,y:0.877000},{x:229,y:0.877000},{x:230,y:0.862500},{x:231,y:0.857500},{x:232,y:0.847000},{x:233,y:0.860500},{x:234,y:0.859500},{x:235,y:0.856500},{x:236,y:0.856500},{x:237,y:0.858000},{x:238,y:0.869500},{x:239,y:0.868500},{x:240,y:0.880500},{x:241,y:0.870000},{x:242,y:0.858000},{x:243,y:0.841500},{x:244,y:0.836000},{x:245,y:0.835500},{x:246,y:0.846000},{x:247,y:0.858500},{x:248,y:0.846500},{x:249,y:0.857000},{x:250,y:0.848000},{x:251,y:0.847500},{x:252,y:0.835000},{x:253,y:0.831000},{x:254,y:0.826000},{x:255,y:0.842500},{x:256,y:0.830500},{x:257,y:0.834500},{x:258,y:0.829000},{x:259,y:0.814500},{x:260,y:0.830500},{x:261,y:0.842000},{x:262,y:0.837500},{x:263,y:0.835500},{x:264,y:0.845500},{x:265,y:0.835000},{x:266,y:0.834500},{x:267,y:0.830500},{x:268,y:0.831000},{x:269,y:0.832000},{x:270,y:0.824500},{x:271,y:0.829500},{x:272,y:0.817000},{x:273,y:0.805000},{x:274,y:0.820000},{x:275,y:0.803500},{x:276,y:0.811500},{x:277,y:0.816500},{x:278,y:0.830000},{x:279,y:0.831000},{x:280,y:0.830500},{x:281,y:0.814500},{x:282,y:0.811000},{x:283,y:0.804000},{x:284,y:0.817500},{x:285,y:0.801500},{x:286,y:0.806000},{x:287,y:0.814000},{x:288,y:0.825500},{x:289,y:0.833000},{x:290,y:0.845000},{x:291,y:0.846500},{x:292,y:0.845500},{x:293,y:0.830500},{x:294,y:0.814500},{x:295,y:0.809500},{x:296,y:0.821500},{x:297,y:0.816000},{x:298,y:0.824000},{x:299,y:0.826500},{x:300,y:0.825000},{x:301,y:0.827000},{x:302,y:0.811500},{x:303,y:0.825000},{x:304,y:0.809000},{x:305,y:0.806000},{x:306,y:0.798500},{x:307,y:0.801000},{x:308,y:0.786500},{x:309,y:0.796000},{x:310,y:0.783500},{x:311,y:0.784500},{x:312,y:0.785500},{x:313,y:0.801000},{x:314,y:0.802500},{x:315,y:0.809000},{x:316,y:0.813000},{x:317,y:0.798500},{x:318,y:0.800500},{x:319,y:0.790000},{x:320,y:0.781000},{x:321,y:0.766500},{x:322,y:0.758500},{x:323,y:0.757000},{x:324,y:0.741000},{x:325,y:0.739000},{x:326,y:0.730500},{x:327,y:0.729500},{x:328,y:0.725000},{x:329,y:0.732500},{x:330,y:0.740000},{x:331,y:0.724000},{x:332,y:0.714000},{x:333,y:0.708500},{x:334,y:0.715500},{x:335,y:0.712500},{x:336,y:0.724000},{x:337,y:0.717500},{x:338,y:0.710500},{x:339,y:0.696000},{x:340,y:0.684500},{x:341,y:0.675500},{x:342,y:0.688500},{x:343,y:0.680000},{x:344,y:0.696000},{x:345,y:0.684500},{x:346,y:0.672000},{x:347,y:0.676000},{x:348,y:0.676500},{x:349,y:0.683000},{x:350,y:0.666500},{x:351,y:0.680500},{x:352,y:0.693000},{x:353,y:0.701500},{x:354,y:0.691000},{x:355,y:0.707500},{x:356,y:0.719500},{x:357,y:0.729500},{x:358,y:0.738000},{x:359,y:0.723500},{x:360,y:0.720500},{x:361,y:0.715000},{x:362,y:0.704500},{x:363,y:0.688500},{x:364,y:0.672500},{x:365,y:0.675500},{x:366,y:0.691500},{x:367,y:0.691500},{x:368,y:0.699000},{x:369,y:0.703500},{x:370,y:0.713000},{x:371,y:0.699500},{x:372,y:0.702500},{x:373,y:0.697000},{x:374,y:0.695500},{x:375,y:0.695000},{x:376,y:0.680000},{x:377,y:0.678000},{x:378,y:0.670500},{x:379,y:0.658000},{x:380,y:0.673000},{x:381,y:0.679500},{x:382,y:0.679500},{x:383,y:0.670500},{x:384,y:0.680500},{x:385,y:0.677500},{x:386,y:0.682000},{x:387,y:0.668500},{x:388,y:0.682500},{x:389,y:0.667000},{x:390,y:0.667000},{x:391,y:0.666500},{x:392,y:0.661500},{x:393,y:0.673500},{x:394,y:0.666500},{x:395,y:0.666000},{x:396,y:0.650000},{x:397,y:0.644000},{x:398,y:0.652000},{x:399,y:0.667000},{x:400,y:0.660500},{x:401,y:0.669500},{x:402,y:0.664500},{x:403,y:0.676000},{x:404,y:0.678000},{x:405,y:0.682000},{x:406,y:0.674000},{x:407,y:0.671500},{x:408,y:0.681500},{x:409,y:0.695000},{x:410,y:0.698000},{x:411,y:0.699500},{x:412,y:0.688500},{x:413,y:0.686000},{x:414,y:0.681500},{x:415,y:0.688000},{x:416,y:0.698500},{x:417,y:0.698500},{x:418,y:0.707500},{x:419,y:0.709500},{x:420,y:0.721000},{x:421,y:0.725500},{x:422,y:0.713000},{x:423,y:0.703000},{x:424,y:0.691000},{x:425,y:0.686000},{x:426,y:0.670500},{x:427,y:0.655000},{x:428,y:0.641000},{x:429,y:0.628500},{x:430,y:0.632500},{x:431,y:0.625500},{x:432,y:0.618500},{x:433,y:0.609000},{x:434,y:0.613500},{x:435,y:0.605500},{x:436,y:0.602000},{x:437,y:0.594500},{x:438,y:0.607500},{x:439,y:0.609500},{x:440,y:0.600000},{x:441,y:0.600500},{x:442,y:0.610500},{x:443,y:0.616500},{x:444,y:0.605500},{x:445,y:0.612000},{x:446,y:0.601500},{x:447,y:0.598000},{x:448,y:0.605500},{x:449,y:0.613500},{x:450,y:0.601500},{x:451,y:0.616500},{x:452,y:0.602500},{x:453,y:0.589500},{x:454,y:0.584500},{x:455,y:0.589000},{x:456,y:0.576500},{x:457,y:0.564000},{x:458,y:0.551500},{x:459,y:0.542000},{x:460,y:0.528500},{x:461,y:0.524000},{x:462,y:0.531500},{x:463,y:0.544000},{x:464,y:0.538500},{x:465,y:0.527000},{x:466,y:0.537000},{x:467,y:0.524500},{x:468,y:0.525500},{x:469,y:0.509000},{x:470,y:0.509000},{x:471,y:0.499000},{x:472,y:0.509500},{x:473,y:0.509000},{x:474,y:0.518000},{x:475,y:0.522500},{x:476,y:0.509000},{x:477,y:0.517000},{x:478,y:0.518500},{x:479,y:0.518000},{x:480,y:0.504500},{x:481,y:0.507500},{x:482,y:0.509500},{x:483,y:0.511000},{x:484,y:0.525500},{x:485,y:0.531500},{x:486,y:0.531500},{x:487,y:0.521500},{x:488,y:0.516000},{x:489,y:0.505500},{x:490,y:0.491000},{x:491,y:0.500500},{x:492,y:0.492000},{x:493,y:0.475500},{x:494,y:0.469500},{x:495,y:0.454500},{x:496,y:0.440500},{x:497,y:0.448000},{x:498,y:0.447500},{x:499,y:0.437500},{x:500,y:0.430000},{x:501,y:0.439500},{x:502,y:0.435500},{x:503,y:0.425000},{x:504,y:0.431500},{x:505,y:0.435500},{x:506,y:0.425000},{x:507,y:0.416500},{x:508,y:0.422500},{x:509,y:0.435000},{x:510,y:0.425500},{x:511,y:0.417000},{x:512,y:0.404000},{x:513,y:0.413000},{x:514,y:0.422000},{x:515,y:0.436500},{x:516,y:0.448000},{x:517,y:0.459500},{x:518,y:0.467500},{x:519,y:0.483500},{x:520,y:0.483000},{x:521,y:0.491000},{x:522,y:0.479500},{x:523,y:0.464500},{x:524,y:0.475500},{x:525,y:0.465500},{x:526,y:0.449500},{x:527,y:0.455000},{x:528,y:0.451000},{x:529,y:0.453000},{x:530,y:0.445500},{x:531,y:0.433500},{x:532,y:0.447000},{x:533,y:0.433500},{x:534,y:0.417500},{x:535,y:0.431500},{x:536,y:0.428000},{x:537,y:0.418000},{x:538,y:0.416500},{x:539,y:0.421500},{x:540,y:0.436000},{x:541,y:0.427000},{x:542,y:0.427500},{x:543,y:0.431000},{x:544,y:0.428000},{x:545,y:0.442000},{x:546,y:0.438000},{x:547,y:0.452000},{x:548,y:0.452500},{x:549,y:0.463000},{x:550,y:0.455500},{x:551,y:0.453500},{x:552,y:0.447000},{x:553,y:0.442500},{x:554,y:0.436500},{x:555,y:0.420000},{x:556,y:0.409000},{x:557,y:0.400000},{x:558,y:0.389000},{x:559,y:0.382500},{x:560,y:0.374500},{x:561,y:0.391000},{x:562,y:0.382000},{x:563,y:0.390000},{x:564,y:0.401500},{x:565,y:0.388000},{x:566,y:0.387500},{x:567,y:0.372500},{x:568,y:0.373000},{x:569,y:0.375500},{x:570,y:0.390000},{x:571,y:0.406000},{x:572,y:0.418000},{x:573,y:0.415000},{x:574,y:0.426500},{x:575,y:0.417500},{x:576,y:0.411000},{x:577,y:0.406000},{x:578,y:0.392000},{x:579,y:0.401500},{x:580,y:0.388000},{x:581,y:0.397000},{x:582,y:0.382000},{x:583,y:0.398500},{x:584,y:0.406000},{x:585,y:0.393000},{x:586,y:0.398500},{x:587,y:0.395500},{x:588,y:0.391000},{x:589,y:0.386500},{x:590,y:0.384000},{x:591,y:0.380000},{x:592,y:0.380500},{x:593,y:0.386500},{x:594,y:0.400500},{x:595,y:0.391500},{x:596,y:0.377500},{x:597,y:0.384500},{x:598,y:0.386000},{x:599,y:0.383000},{x:600,y:0.391000},{x:601,y:0.405500},{x:602,y:0.393500},{x:603,y:0.381500},{x:604,y:0.383000},{x:605,y:0.389000},{x:606,y:0.385000},{x:607,y:0.396000},{x:608,y:0.389500},{x:609,y:0.397000},{x:610,y:0.412000},{x:611,y:0.408000},{x:612,y:0.405500},{x:613,y:0.422000},{x:614,y:0.426500},{x:615,y:0.443000},{x:616,y:0.446500},{x:617,y:0.460000},{x:618,y:0.471500},{x:619,y:0.468500},{x:620,y:0.455500},{x:621,y:0.459500},{x:622,y:0.465500},{x:623,y:0.479500},{x:624,y:0.489000},{x:625,y:0.501000},{x:626,y:0.508500},{x:627,y:0.518000},{x:628,y:0.510000},{x:629,y:0.512500},{x:630,y:0.524500},{x:631,y:0.529500},{x:632,y:0.520500},{x:633,y:0.509500},{x:634,y:0.510500},{x:635,y:0.517500},{x:636,y:0.509500},{x:637,y:0.510500},{x:638,y:0.505000},{x:639,y:0.503500},{x:640,y:0.498500},{x:641,y:0.509500},{x:642,y:0.512000},{x:643,y:0.496000},{x:644,y:0.490500},{x:645,y:0.496000},{x:646,y:0.505000},{x:647,y:0.494000},{x:648,y:0.488000},{x:649,y:0.491000},{x:650,y:0.488000},{x:651,y:0.482500},{x:652,y:0.467000},{x:653,y:0.460500},{x:654,y:0.449500},{x:655,y:0.440500},{x:656,y:0.449500},{x:657,y:0.463000},{x:658,y:0.469000},{x:659,y:0.484500},{x:660,y:0.492500},{x:661,y:0.478500},{x:662,y:0.466000},{x:663,y:0.477500},{x:664,y:0.462500},{x:665,y:0.465000},{x:666,y:0.467500},{x:667,y:0.474500},{x:668,y:0.482500},{x:669,y:0.490000},{x:670,y:0.490000},{x:671,y:0.498500},{x:672,y:0.498500},{x:673,y:0.491000},{x:674,y:0.502000},{x:675,y:0.487000},{x:676,y:0.476500},{x:677,y:0.471500},{x:678,y:0.461500},{x:679,y:0.456500},{x:680,y:0.440000},{x:681,y:0.449500},{x:682,y:0.442000},{x:683,y:0.442000},{x:684,y:0.450500},{x:685,y:0.438500},{x:686,y:0.449500},{x:687,y:0.442500},{x:688,y:0.446000},{x:689,y:0.454500},{x:690,y:0.449500},{x:691,y:0.445000},{x:692,y:0.453000},{x:693,y:0.458000},{x:694,y:0.449000},{x:695,y:0.451500},{x:696,y:0.437500},{x:697,y:0.435000},{x:698,y:0.431500},{x:699,y:0.416000},{x:700,y:0.414500},{x:701,y:0.406000},{x:702,y:0.405000},{x:703,y:0.392000},{x:704,y:0.378000},{x:705,y:0.371000},{x:706,y:0.378500},{x:707,y:0.362000},{x:708,y:0.353500},{x:709,y:0.347500},{x:710,y:0.352500},{x:711,y:0.347500},{x:712,y:0.333000},{x:713,y:0.336000},{x:714,y:0.344000},{x:715,y:0.336000},{x:716,y:0.339500},{x:717,y:0.342000},{x:718,y:0.325500},{x:719,y:0.321500}];
var soc_x_data = [0, 0, 0, 0];
var soc_y_data_charge = [0, 0, 0, undefined];
var soc_y_data_discharge = [undefined, 0, 0, 0];

var dodData = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }]


ipc.on('essType', (event, args) => {
    essType = args[0];
    essId = args[1]
    essData = args[2]

    document.getElementById('essType').innerHTML = essType + "-" + essId

    if (essData !== '') {
        essData.forEach(e => {
            document.getElementById('essForm').elements[e['name']].value = e['value']
        });
    } else {
        setDefault(defaultVal[essType])
    }

    generageThresholdChart()
    generageDodChart()
    generageSocChart()
    updateSocProfile()
    updateThresholdEstimation(threshold.value)

    $(document).ready(function(){
        $('.single-slider').jRange({
            from: 0.0,
            to: 1.0,
            step: 0.01,
            scale: [0.0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0],
            format: '%s',
            width: 500,
            showLabels: true,
            snap: true,
            theme: 'theme-blue',
            ondragend: function(val){
                updateThresholdEstimation(val)
            }
        });
    });



    document.querySelectorAll('#dodInput input').forEach(e => {
        e.addEventListener('input', updateDodProfile)
        var i = e.name[4]
        var c = (e.name[5] === 'c') ? 'y' : 'x'
        dodData[i - 1][c] = parseInt(e.value)
        dodprofile.data.datasets[0].data = dodData
        dodprofile.update()

        if(essType === "Power Flow Battery" || essType === "Supercapacitor" && i > 2) {
            e.disabled = true
        }
    })

    dimen_input.addEventListener('input', () => {
        updateSocProfile()
    })
    maxsoc_input.addEventListener('input', () => {
        updateSocProfile()
    })
    minsoc_input.addEventListener('input', () => {
        updateSocProfile()
    })
    max_power_input.addEventListener('input', () => {
        updateSocProfile()
    })
    max_power_output.addEventListener('input', () => {
        updateSocProfile()

    })
})

document.getElementById('submitBtn').addEventListener('click', (event) => {
    missing = formValidation()
    if(missing.length === 0) {
        ipc.send('submitEssObj', [essType, essId, $('form').serializeArray(), socprofile, dodprofile]);
        remote.getCurrentWindow().close();
    }else {
        dialog.showErrorBox('Please fill all the inputs!', 'Missing fields: ' + missing.toString())
    }  
})

document.getElementById('cancelBtn').addEventListener('click', (event) => {
    remote.getCurrentWindow().close();
})

function setDefault(val) {
    var keys = Object.keys(val)
    keys.forEach(e => {
        document.getElementsByName(e)[0].defaultValue = val[e]
    })
}

function generageThresholdChart() {
    thresholdestimation = new Chart(document.getElementById('thresholdestimation'), {
        type: 'scatter',
        data: {
            datasets: [{
                label: "Estimated SoC",
                data: SoCData,
                showLine: true,
                borderColor: "#3e95cd",
                fill: false,
                lineTension: 0,
                pointRadius: 1,
                borderWidth: 1

                
            },
            {
                label: "Original SoC",
                data: RealSoCdata,
                showLine: true,
                borderColor: "#8e5ea2",
                fill: false,
                lineTension: 0,
                pointRadius: 1
            }]
        },
        options: {
            title: {
                display: true,
                text: 'Estimated SoC Profile'
            },
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'State of Charge'
                    },
                }],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Time (min)'
                    },
                    ticks: {
                        max: 720,
                        stepSize: 60
                    }
                }]
            }
        }
    })
}
function generageSocChart() {
    socprofile = new Chart(document.getElementById('socprofile'), {
        type: 'line',
        data: {
            labels: soc_x_data,
            datasets: [{
                label: "Charge",
                data: soc_y_data_charge,
                borderColor: "#3e95cd",
                fill: false,
                lineTension: 0
            },
            {
                label: "Discharge",
                data: soc_y_data_discharge,
                borderColor: "#8e5ea2",
                fill: false,
                lineTension: 0
            }]
        },
        options: {
            title: {
                display: true,
                text: 'SoC Profile'
            },
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Power Input/Output'
                    },
                }],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Energy Stored'
                    },
                }]
            }
        }
    })
}

function generageDodChart() {
    dodprofile = new Chart(document.getElementById('dodprofile'), {
        type: 'scatter',
        data: {
            datasets: [{
                label: "DoD",
                data: dodData,
                showLine: true
            }]
        },
        options: {
            title: {
                display: true,
                text: 'DoD Profile'
            },
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Number of Cycles'
                    },
                }],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Deep of Discharge'
                    },
                }]
            }
        }
    })
}
function InitThresholdEstimation() {
    
    let options = {
        args: [0.0]
    }
    let pyshell = new PythonShell('__dirname/../algo/visual.py', options, {});

    let totl = 1
    pyshell.on('message', function (message) {
        // received a message sent from the Python script (a simple "print" statement)
        message = message.replace('[','')
        message = message.replace(']','')
        message = message.replace(',','')
        var datapoint = message.split(" ")
        RealSoCdata.push({
            x: parseInt(datapoint[0]),
            y: parseFloat(datapoint[1])
        });
    });
    pyshell.end(function (err) {
        if (err) throw err;
        thresholdestimation.data.datasets[1].data = RealSoCdata
        thresholdestimation.update()
    });
}
function updateThresholdEstimation(val) {
    $('#threshold').val(val); 
    let options = {
        args: [val]
    }
    let pyshell = new PythonShell('__dirname/../algo/visual.py', options, {});

    let totl = 1
    pyshell.on('message', function (message) {
        // received a message sent from the Python script (a simple "print" statement)
        message = message.replace('[','')
        message = message.replace(']','')
        message = message.replace(',','')
        var datapoint = message.split(" ")
        SoCData.push({
            x: parseInt(datapoint[0]),
            y: parseFloat(datapoint[1])
        });
    });
    pyshell.end(function (err) {
        if (err) throw err;
        thresholdestimation.data.datasets[0].data = SoCData
        thresholdestimation.data.datasets[1].data = RealSoCdata
        thresholdestimation.update()
        SoCData = []
    });
}

function updateSocProfile() {
    soc_x_data[1] = parseInt(dimen_input.value) * (parseInt(minsoc_input.value) / 100.0)
    soc_x_data[2] = parseInt(dimen_input.value) * (parseInt(maxsoc_input.value) / 100.0)
    soc_x_data[3] = parseInt(dimen_input.value)
    soc_y_data_charge[1] = parseInt(max_power_input.value)
    soc_y_data_charge[2] = parseInt(max_power_input.value)
    soc_y_data_discharge[1] = parseInt(max_power_output.value)
    soc_y_data_discharge[2] = parseInt(max_power_output.value)
    socprofile.data.labels = soc_x_data
    socprofile.data.datasets[0].data = soc_y_data_charge
    socprofile.data.datasets[1].data = soc_y_data_discharge
    socprofile.update()
}
const updateDodProfile = function (e) {
    var i = e.target.name[4]
    var c = (e.target.name[5] === 'c') ? 'y' : 'x'
    dodData[i - 1][c] = parseInt(e.target.value)
    // dodData.sort((a, b) => a.x - b.x)
    dodprofile.data.datasets[0].data = dodData
    dodprofile.update()
}


function formValidation() {
    var inputs = document.getElementsByTagName('input')
    var missing = []
    for (let input of inputs) {
        if(input.value === null || input.value === "" && input.disabled === false) {
            missing.push(strMap.eiStrMap(input.name))
        }
    }
    return missing
}

