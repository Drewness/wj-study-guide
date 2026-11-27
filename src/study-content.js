export const studySource = {
  file: "WJ-Student-Guide.pdf",
  title: "Senior Student Guide Book",
  subtitle: "with Rank Requirements and Testing Manual",
  version: "Version 1 - October 7, 2026",
  pageCount: 20,
};

export const studySections = [
  {
    id: "overview",
    title: "Cover & contents",
    color: "cover",
    detail: "Senior Student Guide Book",
    pages: [
      {
        number: 1,
        blocks: [
          {
            heading: "Student Handbook",
            paragraphs: [
              "Wichita Judo",
              "This Senior Student Guide Book belongs to:",
            ],
            fields: ["Student name"],
          },
        ],
      },
      {
        number: 2,
        blocks: [
          {
            heading: "Senior Student Guide Book",
            paragraphs: [
              "with Rank Requirements and Testing Manual",
              "Version 1 - October 7, 2026",
            ],
          },
          {
            heading: "Table of Contents",
            columns: ["Section", "Printed page"],
            rows: [
              ["Wichita Judo Rules", "2"],
              ["Points System", "4"],
              ["Rokyu - Senior Yellow Belt", "7"],
              ["Gokyu - Senior Orange Belt", "9"],
              ["Yonkyu - Senior Green Belt", "11"],
              ["Sankyu - Senior 3rd Degree Brown Belt", "13"],
              ["Nikyu - Senior 2nd Degree Brown Belt", "15"],
              ["Ikkyu - Senior 1st Degree Brown Belt", "18"],
            ],
          },
        ],
        note: "The table of contents above preserves the printed page numbers. Source links use the actual PDF page positions.",
      },
    ],
  },
  {
    id: "rules",
    title: "Wichita Judo rules",
    color: "rules",
    detail: "Bowing, etiquette & conduct",
    pages: [
      {
        number: 3,
        blocks: [
          {
            heading: "Wichita Judo Rules",
            ordered: true,
            items: [
              "Bow when entering or leaving the Dojo.",
              "Bow when stepping on or off the mat.",
              "Instructors and students bow to each other, in mutual respect, at the opening and closing of class.",
              "Bow before and after working with a partner in class.",
              "Bow to your opponent before and after a match in contest.",
              "Bow when accepting an award. Take the award with both hands as you bow.",
              "Bow to a Sensei as he or she enters the Dojo.",
              "Bow whenever you wish to give a demonstration of respect.",
              "Bows should be performed with respect and humility. They should be slow and measured, and never hurried.",
            ],
          },
          {
            heading: "Dojo Etiquette",
            ordered: true,
            items: [
              "Strive to always be on time.",
              "Wear a Judo gi (not a jiu jitsu gi).",
              "If you are late, wait by the mat to be signaled on.",
              "No non-Judo activity is to take place during class time.",
              "No food, drink, or chewing of gum is allowed on the mat.",
              "No practicing of Judo skills and techniques without permission of the instructor.",
              "Spills are to be cleaned immediately. Trash should be placed in the proper container.",
              "Blood must be cleaned up immediately using proper procedures and materials.",
              "No talking while Sensei or Sempai are instructing or lecturing.",
              "Always turn away from Shomen and Black Belts to adjust your gi.",
              "Do not walk between people at any time during class. Walk around - this is a safety issue.",
              "Do not leave the mat without Sensei's permission.",
              "No jewelry. Including body piercings.",
              "Keep fingernails and toenails trimmed.",
              "If someone gets hurt, inform Sensei. Unless you are medically trained, don't try to help.",
              "Be a good uke.",
              "Always address Black Belts as Sensei.",
              "New students and guests should always have a partner to work with.",
              "Students are to sit in proper fashion when resting or listening to an instructor - sit in Anza or Seiza.",
              "Seek to help each other. Be responsible for your safety and that of others.",
              "Never talk while in line-up. Stand still.",
              "Arrive at class on time and mentally prepared for class. Strive to never miss practice.",
              "Never leave the mat or Dojo without the permission of the instructor.",
              "Always treat your fellow Judo players with respect and dignity, and avoid all horseplay, which disturbs or bothers fellow Judo players.",
            ],
          },
        ],
      },
      {
        number: 4,
        blocks: [
          {
            heading:
              "Behavior Outside the Dojo - Respect and Honor Are Very Important",
            ordered: true,
            items: [
              "Judo is to be practiced only in the Dojo under the guidance of a qualified Judo Instructor. Your Judo skills should never be used outside of the Dojo except in legitimate self-defense situations. Do not attempt to impress your friends with your Judo skills. Do not demonstrate Judo in public unless it is part of a club activity or unless you have received prior permission from your Judo Instructor.",
              "Judo techniques should not be taught to anyone unless they are under the guidance of a qualified Judo Instructor.",
            ],
          },
          {
            heading: "Behavior When Visiting Another Club",
            ordered: true,
            items: [
              "Remove your shoes before entering a Dojo.",
              "Introduce yourself and ask permission from the instructor to participate in class before changing into your Gi.",
              "Be attentive. Never argue or disagree with the way techniques are taught or presented.",
              "Do not show off.",
              "Make sure you follow the Wichita Judo rules and regulations on bowing. Some clubs do not require bowing - no one will take offense if you bow and they do not.",
              "Follow the rules and regulations of the Dojo you are visiting.",
              "Always thank the club members you worked with for sharing and working with you.",
              "Thank the instructor(s) for allowing you to participate.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "points",
    title: "Points system",
    color: "points",
    detail: "Points, time in grade & testing",
    pages: [
      {
        number: 5,
        blocks: [
          {
            heading: "Points and Time in Grade",
            items: [
              "Please note that you are responsible for maintaining your own competition record.",
              "Time in grade and points requirements are minimums.",
              "All promotions must be approved by a Wichita Judo Sensei.",
              "Points and time in grade accumulated reset to zero after each promotion.",
              "You may be tested on all items on your list. Be prepared to demonstrate all techniques.",
              "You must score at least 75% on the written exam to be eligible for promotion.",
              "Practical tests will be scored out of 4 (0 = failing, 1 = poor, 2 = fair, 3 = good, 4 = excellent). You need to average at least 3 to be eligible for promotion.",
            ],
          },
          {
            heading: "How to Earn Points - Winning Your Matches",
            columns: ["Achievement", "Points Awarded"],
            rows: [
              ["Defeat a player of the same rank", "1 point"],
              ["Defeat a player 1 rank higher (Kyu or Dan)", "1.5 points"],
              ["Defeat a player 2 ranks higher", "2 points"],
              ["Defeat a player 3 or more ranks higher", "3 points"],
            ],
          },
          {
            heading: "Helping at a Tournament",
            columns: ["Achievement", "Points Awarded"],
            rows: [
              ["Keep score at a tournament", "1 point"],
              ["Referee at a tournament", "1.5 points"],
              ["Tournament director", "3 points"],
            ],
          },
          {
            heading: "Placing in Kata Competitions",
            columns: ["Achievement", "Points Awarded"],
            rows: [
              ["Enter a local kata tournament", "1 point"],
              ["Enter a national kata tournament", "2 points"],
              ["Enter an international kata tournament", "3 points"],
              ["Kata 1st place", "3 points"],
              ["Kata 2nd place", "2 points"],
              ["Kata 3rd place", "1 point"],
            ],
          },
        ],
      },
      {
        number: 6,
        blocks: [
          {
            heading: "Miscellaneous",
            columns: ["Achievement", "Points Awarded"],
            rows: [
              ["Being an uke for a test", "2"],
              ["Helping at the dojo", "2"],
              [
                "Attending additional class (ex: Saturday ne waza class - good for one time a month)",
                "1",
              ],
              ["Attend judo seminar or clinic", "1"],
              ["Marking attendance on the app", "2"],
            ],
          },
          {
            heading: "Senior Point Requirements",
            columns: ["Rank", "Minimum Points"],
            rows: [
              ["Rokyu (Yellow Belt)", "10 points"],
              ["Gokyu (Orange Belt)", "15 points"],
              ["Yonkyu (Green Belt)", "20 points"],
              ["Sankyu (3rd Degree Brown Belt)", "30 points"],
              ["Nikyu (2nd Degree Brown Belt)", "30 points"],
              ["Ikkyu (1st Degree Brown Belt)", "30 points"],
              ["Shodan and above", "See USA Judo points requirements"],
            ],
          },
          {
            heading: "Time in Grade Requirements",
            columns: ["Rank", "Minimum Time"],
            rows: [
              ["Rokyu", "3 months"],
              ["Gokyu", "3 months (6 months total in Judo)"],
              ["Yonkyu", "6 months (12 months total in Judo)"],
              ["Sankyu", "12 months (24 months total in Judo)"],
              ["Nikyu", "12 months (36 months total in Judo)"],
              ["Ikkyu", "12 months (48 months total in Judo)"],
              ["Shodan and above", "See USA Judo time in grade requirements"],
            ],
            paragraphs: [
              "Promotion tests will be held a minimum of three times per year; February, June, and October. Batsugun (merit promotions) between tests are possible for outstanding performances. Time in grade is generally a minimum standard - you may or may not be eligible to test at these intervals. Time in grade is measured from the date of last promotion. When you are selected for testing, you must attend two pre test classes in order to test.",
            ],
          },
          { heading: "Other Requirements", paragraphs: [] },
        ],
        note: "Source discrepancy: this table gives Ikkyu 12 months (48 total), while the promotion record on PDF page 19 gives 18 months (54 total). Both are retained as printed; confirm the current requirement with Sensei. The Other Requirements heading has no text beneath it in the source.",
      },
    ],
  },
  {
    id: "rokyu",
    title: "Rokyu",
    color: "yellow",
    detail: "Senior Yellow Belt",
    pages: [
      {
        number: 7,
        blocks: [
          {
            heading: "Tachi Waza - Standing Techniques",
            items: [
              "O Soto Gari - Major Outside Reap",
              "O Goshi - Major Hip Throw",
              "Ippon Seoi Nage - One-Armed Shoulder Throw",
              "Seoi Nage - Shoulder Throw",
              "O Uchi Gari - Major Inside Reap",
              "Uki Goshi - Floating Hip",
            ],
          },
          {
            heading: "Ne Waza / Katame Waza - Holding Techniques",
            items: [
              "Kesa Gatame - Scarf Hold",
              "Kuzure Kesa Gatame - Modified Scarf Hold",
              "Kata Gatame - Shoulder Hold",
              "Uphill Turn Escape from kesa gatame",
              "Bridge and Roll Escape from kesa gatame",
              "Bulldog turn over",
              "Bullfighters turn over",
            ],
          },
          {
            heading: "Shime Waza - Choking Techniques",
            items: ["Okuri Eri Jime - Sliding Lapel Choke"],
          },
          {
            heading: "Ukemi Waza - Falling Techniques",
            items: [
              "Zempo Kaiten Ukemi - Forward Rolling Break falls",
              "Yoko Ukemi - Side Falls",
              "Ushiro Ukemi - Back Falls",
              "Mae Ukemi - Front Falls",
            ],
          },
          {
            heading: "Vocabulary",
            columns: ["English", "Japanese"],
            rows: [
              ["Attention", "Kyotsuke"],
              ["Bow", "Rei"],
              ["Begin", "Hajime"],
              ["Stop", "Matte"],
              ["Practice Hall / Judo School", "Dojo"],
              ["Judo Instructor", "Sensei"],
              ["Sitting on Knees", "Seiza"],
              ["Sitting Cross Legged", "Anza"],
              ["Slide Foot Walking", "Tsugi Ashi"],
              ["Normal Walking", "Ayumi Ashi"],
              ["Judo Uniform", "Judogi"],
              ["Judo Player", "Judoka"],
              ["Person Performing Technique", "Tori"],
              ["Person Receiving Technique", "Uke"],
              ["Left", "Hidari"],
              ["Falling Methods", "Ukemi"],
              ["Back Falls", "Ushiro Ukemi"],
              ["Forward Rolling Falls", "Zempo Kaiten Ukemi"],
              ["Free Practice or Sparring", "Randori"],
              ["Form Practice", "Kata"],
              ["Tournament", "Shiai"],
              ["Judo Mats", "Tatame"],
              ["Hold-down", "Osae Komi"],
              ["Hold-down Broken", "Toketa"],
              ["One Point", "Ippon"],
              ["Half Point", "Waza-ari"],
              ["Quarter Point/Advantage", "Yuko"],
              ["That is All", "Sore Made"],
              ["Sixth Class (Kyu) Judo Rank", "Rokyu"],
              ["Right", "Migi"],
            ],
          },
        ],
        note: "The source reverses these terms. The entries above have been corrected: Left is Hidari and Right is Migi.",
      },
      {
        number: 8,
        blocks: [
          {
            heading: "General Information",
            questions: [
              [1, "Who was the founder of Judo?", "Jigoro Kano"],
              [
                2,
                "What was the name of the Judo school he founded?",
                "The Kodokan",
              ],
              [3, "What was the date of the founding of Judo?", "1882"],
              [
                4,
                "What was unarmed combat called in Japan before Judo?",
                "Jujutsu",
              ],
              [
                5,
                "How many years had martial arts been practiced in Japan before Judo?",
                "About 600 to 1,000 years",
              ],
              [
                6,
                "Name the three parts of a Judo throw in Japanese and English.",
                "Kuzushi - Off-Balance; Tsukuri - Entrance; Kake - Execution",
              ],
              [
                7,
                "What are the ordinal numbers from one to ten in Japanese?",
                "Ichi (1), Ni (2), San (3), Shi (4), Go (5), Roku (6), Shichi (7), Hachi (8), Kyu (9), Jyu (10)",
              ],
              [
                8,
                "Name three parts of unarmed combat.",
                "Nage Waza / Throwing\nKatame Waza / Grappling\nAtemi Waza / Striking",
              ],
            ],
          },
        ],
      },
    ],
  },
  {
    id: "gokyu",
    title: "Gokyu",
    color: "orange",
    detail: "Senior Orange Belt",
    pages: [
      {
        number: 9,
        blocks: [
          {
            heading: "Tachi Waza - Standing Techniques",
            items: [
              "Koshi Guruma - Hip Wheel - Headlock Hip Throw",
              "Sase Tsuri Komi Ashi - Lifting Pulling Propping Ankle",
              "Hiza Guruma - Knee Wheel",
              "De Ashi Harai - Advancing Foot Sweep",
              "Okuri Ashi Harai - Sliding Foot Sweep",
              "Tani Otoshi - Valley Drop",
            ],
          },
          {
            heading: "Ne Waza / Katame Waza - Holding Techniques",
            items: [
              "Tate Shiho Gatame - Straddle Four Corner Hold",
              "Kuzure Tate Shiho Gatame - Modified Four Corner Hold",
              "Kami Shiho Gatame - Upper Four Corner Hold",
              "Kuzure Kami Shiho Gatame - Modified Upper Four Corners Hold",
              "Tate Shiho Gatame Escape - Bridge and roll",
              "Kami Shiho Gatame Escape - Pendulum Swing Escape",
              "Makikomi Turtle Defense",
            ],
          },
          {
            heading: "Shime Waza - Choking Techniques",
            items: [
              "Nami Juji Jime - Normal Cross Choke",
              "Gyaku Juji Jime - Reverse Cross Choke",
            ],
          },
          {
            heading: "Vocabulary",
            columns: ["English", "Japanese"],
            rows: [
              ["Minor Penalty", "Shido"],
              ["Disqualification", "Hansokumake"],
              ["Decision", "Hantai"],
              ["Don't Move", "Sono Mama"],
              ["Continue", "Yoshi"],
              ["Fundamental Natural Position", "Shizen Hontai"],
              ["Fundamental Defensive Position", "Jigo Hontai"],
              ["Off Balance", "Kuzushi"],
              ["Entry into a Throw", "Tsukuri"],
              ["Execution of a Throw", "Kake"],
              ["Throwing Techniques", "Nage Waza"],
              ["Fifth Class (Kyu) Judo Rank", "Gokyu"],
              ["Yes", "Hai"],
              ["Please", "Onegaishimasu"],
              ["Hand", "Te"],
              ["Hand Techniques", "Te Waza"],
              ["Foot", "Ashi"],
              ["Foot Techniques", "Ashi Waza"],
              ["Big or Major", "O"],
              ["Small or Minor", "Ko"],
              ["Hip", "Goshi or Koshi"],
              ["Hip Techniques", "Koshi Waza"],
              ["Outside", "Soto"],
              ["Inside", "Uchi"],
              ["Internal Force or Energy", "Ki"],
              ["Shout to Gather Inner Strength", "Kiai"],
              ["No", "Iie"],
              ["Thank you", "Domo arigatou gozaimasu"],
            ],
          },
        ],
      },
      {
        number: 10,
        blocks: [
          {
            heading: "General Information",
            questions: [
              [
                1,
                "Name the two divisions of throwing techniques in Judo.",
                "Tachi Waza (standing) and Sutemi Waza (sacrifice)",
              ],
              [
                2,
                "Name the two division of sacrifice techniques",
                "Ma sutemi waza (back sacrifice) and Yoko sutemi waza (side sacrifice)",
              ],
              [3, "", ""],
              [
                4,
                "Name the three divisions of ground techniques in Judo.",
                "Osaekomi Waza (Hold-down Techniques), Shime Waza (Choking Techniques), Kansetsu Waza (Arm-Locking Techniques)",
              ],
              [
                5,
                "What two styles of Jujutsu did Dr. Kano study and refine to create Judo?",
                "Tenshin Shinyo Ryu and Kito Ryu",
              ],
            ],
          },
        ],
        note: "Question 3 is blank in the source.",
      },
    ],
  },
  {
    id: "yonkyu",
    title: "Yonkyu",
    color: "green",
    detail: "Senior Green Belt",
    pages: [
      {
        number: 11,
        blocks: [
          {
            heading: "Tachi Waza - Standing Techniques",
            items: [
              "Ko Uchi Gari - Minor Inside Reap",
              "Harai Goshi - Sweeping Hip Throw",
              "Tai Otoshi - Body Drop",
              "Sode Tsuri Komi Goshi - Sleeve Lifting Pulling Hip",
              "Tsuri Goshi - Pulling Hip Throw",
              "Ko Soto Gari - Small Outside Sweep",
              "Teach one forward throw",
            ],
          },
          {
            heading: "Ne Waza / Katame Waza - Holding Techniques",
            items: [
              "Yoko Shiho Gatame - Side Four Corner Hold",
              "Kuzure Yoko Shiho Gatame - Modified Four Corner Hold",
              "Yoko Shiho Gatame Leg entanglement escape",
              "Kuzure Yoko Shiho ghost escape",
              "Teach one pin",
            ],
          },
          {
            heading: "Shime Waza - Choking Techniques",
            items: [
              "Kata Te Jime - One Hand Choke",
              "Hadaka Jime - Naked Choke",
              "Kataha Jime - Single Wing Choke",
            ],
          },
          {
            heading: "Kansetsu Waza - Arm-Locking Techniques",
            items: [
              "Ude Garami Upwards - Upwards Bent Armlock",
              "Ude Garami Downwards - Downwards Bent Armlock",
              "Ude Hishigi Juji Gatame - Cross Arm Lock",
            ],
          },
          {
            heading: "Vocabulary",
            columns: ["English", "Japanese"],
            rows: [
              ["Martial Arts", "Budo"],
              ["Knee", "Hiza"],
              ["Kneeling Bow", "Zarei"],
              ["Standing Bow", "Ritsurei"],
              ["Choke", "Shime/Jime"],
              ["Choking Techniques", "Shime Waza"],
              ["Lock or Hold", "Gatame"],
              ["The Way", "Do"],
              ["Gentle Way", "Judo"],
              ["Gentle Arts", "Jujutsu"],
              ["Favorite Technique", "Tokui Waza"],
              ["Wheel", "Guruma"],
              ["Side", "Yoko or Shiho"],
              ["Holding Techniques", "Osaekomi Waza"],
              ["Techniques From a Supine Position", "Newaza"],
              ["Joint Locking Techniques", "Kansetsu Waza"],
              ["Class of Belt Ranks Below Black Belt", "Kyu"],
              ["Degree in the Black Belt Ranks", "Dan"],
              ["Holder of any Black Belt Rank", "Yudansha"],
              ["Holder of any Rank Below Black Belt", "Mudansha"],
              ["Black Belt Association", "Yudanshakai"],
              ["Repetitive Attack Practice without Throwing", "Uchi Komi"],
            ],
          },
        ],
      },
      {
        number: 12,
        blocks: [
          {
            heading: "Vocabulary (continued)",
            columns: ["English", "Japanese"],
            rows: [
              ["Way of the Warrior", "Bushido"],
              ["Fourth Class (kyu) Judo Rank", "Yonkyu"],
              ["Repetitive Throwing Practice without Resistance", "Nage Komi"],
              ["Formal Eight Directions of Off-Balancing", "Happo No Kuzushi"],
            ],
          },
          {
            heading: "General Information",
            questions: [
              [
                1,
                "What is the ultimate goal of Judo as defined by Dr. Kano?",
                "The harmonious development and eventual perfection of the human character.",
              ],
              [
                2,
                "Name the Four Heavenly Lords of Judo.",
                "1) Shiro Saigo 2) Tsunejiro Tomita 3) Sakujiro Yokoyama 4) Yoshitsugu Yamishita",
              ],
              [
                3,
                "What are the two principles of Judo as defined by Dr. Kano?",
                "Jita Kyoei (Mutual Benefit and Welfare); Seiryoku Zenyo (Maximum Efficiency)",
              ],
              [4, "Who is the only female 10th degree?", "Keiko Fukuda"],
              [
                5,
                "What year was Judo introduced into the Olympics for women?",
                "1992",
              ],
              [6, "What is the name of your judo organization?", "USA Judo"],
              [7, "What year was judo in the Olympics?", "1964"],
            ],
          },
        ],
      },
    ],
  },
  {
    id: "sankyu",
    title: "Sankyu",
    color: "brown",
    detail: "Senior 3rd Degree Brown Belt",
    pages: [
      {
        number: 13,
        blocks: [
          {
            heading: "Tachi Waza - Standing Techniques",
            items: [
              "Hane Goshi - Spring Hip Throw",
              "Kosoto Gake - Minor Outer Hook",
              "Yoko Wakare - Side Separation",
              "Daki Wakare - Rear Trunk Turn Over",
              "Combo Throws #1",
              "Combo Throws #2",
              "Combo Throw to pin #1",
              "Combo Throw to pin #2",
              "Teach one forward throw",
              "Teach one side or rear throw",
            ],
          },
          {
            heading: "Ne Waza / Katame Waza - Holding Techniques",
            items: [
              "Uki Gatame - Floating Hold",
              "Uki Gatame escape",
              "Teach one pin and escape",
            ],
          },
          {
            heading: "Shime Waza - Choking Techniques",
            items: [
              "Jikoku Jime - Hell Strangle",
              "Teach one choke and choke defense",
            ],
          },
          {
            heading: "Kansetsu Waza - Arm-Locking Techniques",
            items: [
              "Ude Hishigi Ude Gatame - Straight Arm Lock",
              "Ude Hishigi Waki Gatame - Arm-Pit Arm Lock",
              "",
            ],
          },
          {
            heading: "Nage No Kata",
            items: ["First two sets of Nage No Kata - Te Waza and Koshi Waza"],
          },
          {
            heading: "Vocabulary",
            columns: ["English", "Japanese"],
            rows: [
              ["Third Class (Kyu) Judo Rank", "Sankyu"],
              ["Second Class (Kyu) Judo Rank", "Nikyu"],
              ["First Class (Kyu) Judo Rank", "Ikkyu"],
              ["Meditate", "Mokuso"],
              ["Judo Uniform Belt", "Obi"],
              ["Judo Uniform Jacket", "Uwagi"],
              ["Judo Uniform Pants", "Zubon"],
              ["Judo Uniform Sleeve", "Sode"],
              ["Judo Uniform Lapel", "Eri"],
              ["Normal", "Nami"],
              ["Reverse", "Gyaku"],
              ["Cross", "Juji"],
              ["Arm", "Ude"],
              ["Exercises in General", "Taiso"],
              ["Warm-up Exercises in Judo", "Junbi Undo"],
              ["Cool-down Exercises in Judo", "Shumatsu Undo"],
              ["Variation of a Technique", "Kuzure"],
              ["Counter Technique", "Kaeshi Waza"],
              ["Four Corners (as in pins)", "Shiho"],
              ["Forms of Gripping an Opponent", "Kumi Kata"],
              ["The Basic Syllabus of Judo", "Gokyo No Waza"],
              ["Newly Certified Throwing Techniques", "Shinmesho No Waza"],
              ["Instantaneous Promotion", "Batsugun"],
              ["Throwing From a Standing Position", "Tachi Waza"],
              ["Sacrifice Techniques", "Sutemi Waza"],
              ["Back Falling Sacrifice Throws", "Ma Sutemi Waza"],
            ],
          },
        ],
      },
      {
        number: 14,
        blocks: [
          {
            heading: "Vocabulary (continued)",
            columns: ["English", "Japanese"],
            rows: [
              ["Armpit", "Wake"],
              ["I Surrender", "Maitta"],
              ["Shintai", "Body movement/locomotion"],
              ["Side Falling Sacrifice Throws", "Yoko Sutemi Waza"],
              ["Striking Techniques to Vital Areas", "Atemi Waza"],
              ["Debana", "The instant an opportunity for attack appears"],
            ],
          },
          {
            heading: "General Information",
            questions: [
              [
                1,
                "Who was the first American woman to win a gold medal at the World Championships, and in what year?",
                "Annmarie Burns (1984)",
              ],
              [2, "List three American Olympic Medalist.", "1.\n2.\n3."],
              [
                3,
                "Who was the first American to win a gold medal at the Olympics, and in what year?",
                "Kayla Harrison (2012)",
              ],
              [
                4,
                "What are the five divisions of Nage No Kata in Japanese and English?",
                "Te Waza (Hand Techniques), Koshi Waza (Hip Techniques), Ashi Waza (Foot Techniques), Ma Sutemi Waza (Rear Sacrifice Techniques), Yoko Sutemi Waza (Side Sacrifice Techniques)",
              ],
              [
                5,
                "Name the six Kyu ranks and belts from highest to lowest.",
                "Ikkyu - 1st Degree Brown; Nikyu - 2nd Degree Brown; Sankyu - 3rd Degree Brown; Yonkyu - Green; Gokyu - Orange; Rokyu - Yellow",
              ],
              [
                6,
                "What are the four sides of the dojo called?",
                "1. Kamiza - upper seat\n2. Shimoiza - lower seat\n3. Joseki - upper seat\n4. Shimoseki - lower side",
              ],
              [
                2,
                "Name another uniform used to practice judo? Kano Sensei wore one frequently.",
                "Hakama",
              ],
            ],
          },
        ],
        note: "The source leaves the three Olympic medalist answers blank, repeats question number 2, and reverses the language columns for Shintai and Debana. These are retained as printed.",
      },
    ],
  },
  {
    id: "nikyu",
    title: "Nikyu",
    color: "brown",
    detail: "Senior 2nd Degree Brown Belt",
    pages: [
      {
        number: 15,
        blocks: [
          {
            heading: "Tachi Waza - Standing Techniques",
            items: [
              "Sumi Otoshi - Corner Drop",
              "Osoto Guruma - Major Outer Wheel",
              "Any Makikomi x 1",
              "Combo Throws #1",
              "Combo Throws #2",
              "Combo Throw to pin #1",
              "Combo Throw to pin #2",
              "Teach one rear throw",
              "Teach one sacrifice throw",
            ],
          },
          {
            heading: "Katame Waza - Holding Techniques",
            items: [
              "Makura Kesa Gatame - Pillow Scarf Hold",
              "Makura Kesa Gatame Escape",
              "Sankakyu Gatame - Triangle Hold",
              "Throw to pin escape #1",
              "Throw to pin escape #2",
            ],
          },
          {
            heading: "Shime Waza - Choking Techniques",
            items: [
              "Sankakyu Jime - Triangle Choke",
              "Sankakyu Jime - Escape",
              "Teach one choke and defense",
            ],
          },
          {
            heading: "Kansetsu Waza - Arm-Locking Techniques",
            items: [
              "Sankakyu Garami - Triangular Arm Lock",
              "Sankakyu Garami Escape",
              "Teach one arm bar",
            ],
          },
          {
            heading: "Nage No Kata",
            items: [
              "First three sets of Nage No Kata - Te Waza, Koshi Waza, and Ashi Waza",
            ],
          },
          {
            heading: "Vocabulary",
            columns: ["English", "Japanese"],
            rows: [
              ["1st Degree Black Belt", "Shodan"],
              ["2nd Degree Black Belt", "Nidan"],
              ["3rd Degree Black Belt", "Sandan"],
              ["4th Degree Black Belt", "Yondan"],
              ["5th Degree Black Belt", "Godan"],
              ["6th Degree Black Belt", "Rokudan"],
              ["7th Degree Black Belt", "Shichidan"],
              ["8th Degree Black Belt", "Hachidan"],
              ["9th Degree Black Belt", "Kudan"],
              ["10th Degree Black Belt", "Judan"],
              ["12th Degree Black Belt (Only Held by Dr. Kano)", "Junidan"],
              ["Master Instructor", "Shihan"],
              ["Formal Forms of Throwing", "Nage No Kata"],
              ["Formal Forms of Grappling", "Katame No Kata"],
              ["Formal Forms of Gentleness", "Ju No Kata"],
              ["Formal Forms of Self-Defense", "Goshinjitsu No Kata"],
              ["Formal Forms of Self-Defense for Women", "Joshi Goshinho Kata"],
              ["Formal Forms of Decision", "Kimi No Kata"],
              ["Ancient Forms", "Koshiki No Kata"],
              ["Forms of Five", "Itsutsu No Kata"],
            ],
          },
        ],
      },
      {
        number: 16,
        blocks: [
          {
            heading: "General Information",
            questions: [
              [
                1,
                "What other colored belts are some black belts entitled to wear?",
                "1st-3rd Dan - Black Belt; 4th-5th Dan - Black and Red Belt; 6th-8th Dan - Red and White Belt; 9th-10th Dan - Red Belt",
              ],
              [
                2,
                "What are the five divisions of Nage No Kata and the techniques that comprise them?",
                "Te Waza: Uke Otoshi, Seoi Nage, Kata Guruma. Koshi Waza: Uke Goshi, Harai Goshi, Tsurikomi Goshi. Ashi Waza: Okuri Ashi Harai, Sasae Tsurikomi Ashi, Uchi Mata. Ma Sutemi Waza: Tomoe Nage, Ura Nage, Sumi Gaeshi. Yoko Sutemi Waza: Yoko Gake, Yoko Guruma, Uki Waza",
              ],
              [
                3,
                "What are the three divisions of the Katame No Kata?",
                "Katame Waza (Pinning Techniques), Shime Waza (Choking Techniques), Kansetsu Waza (Arm Locking Techniques)",
              ],
              [
                4,
                "What kata is the Maximum Efficiency Physical Fitness Kata?",
                "Seiryoko Zenyo Kokumin Taiiku",
              ],
              [
                1,
                "What two types of techniques did Kano Sensei remove from jiujutsu to create judo.",
                "Dangerous techniques and those only using muscle.",
              ],
              [
                2,
                'Name the 10th dan judoka who earned the nickname "The God of Judo"',
                "Kyuzo Mifune",
              ],
            ],
          },
        ],
      },
    ],
  },
  {
    id: "ikkyu",
    title: "Ikkyu",
    color: "brown",
    detail: "Senior 1st Degree Brown Belt",
    pages: [
      {
        number: 17,
        blocks: [
          {
            heading: "Tachi Waza - Standing Techniques",
            items: [
              "O Guruma - Major Wheel",
              "Ashi Guruma - Leg Wheel",
              "Any Makikomi x 2",
              "Combo Throws #1",
              "Combo Throws #2",
              "Teach one rear throw to a submission",
              "Teach one sacrifice throw to a submission",
            ],
          },
          {
            heading: "Katame Waza - Holding Techniques",
            items: [
              "Pin escape #1",
              "Pin escape #2",
              "Pin escape #3",
              "Throw to pin escape #1",
              "Throw to pin escape #2",
            ],
          },
          {
            heading: "Shime Waza - Choking Techniques",
            items: [
              "Hadaka Jime - Naked Choke",
              "Kata Ha Jime - Single Wing Choke",
              "Defense against backpack hadaka jime",
            ],
          },
          {
            heading: "Kansetsu Waza - Arm-Locking Techniques",
            items: [
              "Ude hishigi hiza gatame - Knee arm lock",
              "Ude hishigi ashi gatame - Leg arm lock",
              "Ude hishigi hara gatame - stomach arm lock",
              "",
            ],
          },
          {
            heading: "Nage No Kata",
            items: ["First four sets of Nage No Kata"],
          },
          {
            heading: "Vocabulary",
            columns: ["English", "Japanese"],
            rows: [
              ["Win of Any Type", "Gachi / Kachi"],
              ["Loss of Any Type", "Make"],
              ["Win by Forfeit or Default Before a Match", "Fusen Gachi"],
              ["Win by Withdrawal During a Match", "Kiken Gachi"],
              ["Same Side Gripping (Right vs. Right)", "Ai Yotsu"],
              ["Opposite Side Gripping (Right vs. Left)", "Kenka Yotsu"],
              ["Slight Superiority", "Kinsa"],
              ['"Winner Stays Up" Team Contest', "Kohaku Shiai"],
              ["Single Handed", "Katate"],
              ["Double Handed", "Ryote"],
              ["Both Hands", "Morote"],
              ["Evasive Action", "Sukashi"],
              ["Body", "Tai"],
              ["Entangle", "Garami"],
              ["Referee", "Shimpan"],
              ["Floating", "Uki"],
            ],
          },
        ],
      },
      {
        number: 18,
        blocks: [
          {
            heading: "Vocabulary (continued)",
            columns: ["English", "Japanese"],
            rows: [
              ["Man-for-Man / Elimination Tournament", "Tentori Shiai"],
              ["Methods of Resuscitation", "Kappo"],
              ["Contest Area", "Shiaijo"],
              ["Pulling or Locking Hand", "Hikite"],
              ["Power or Drawing Hand", "Tsurite"],
              ["Entry Methods into Groundwork", "Hairi Kata"],
              ["Judogi Measuring Device", "Sokuteiki"],
              ["Lift", "Tsuri"],
              ["Pull", "Komi"],
              ["Time", "Jikan"],
              ["Decisiveness", "Kime"],
              ["To Drop", "Otoshi"],
              ["Thigh", "Mata"],
              ["Pivoting", "Tai Sabaki"],
            ],
          },
          {
            heading: "General Information",
            questions: [
              [
                1,
                "Be able to demonstrate the referee hand signals and calls for:",
                "Hajime! - Matte! - Sore Made! - Osae Komi! - Toketa! - Yuko - Waza-ari - Ippon - Shido for Stalling - Shido for False Attack - Shido for Stepping Out of Bounds",
              ],
              [
                2,
                "What are the ordinal numbers between eleven and twenty in Japanese?",
                "Ju Ichi (11), Ju Ni (12), Ju San (13), Ju Shi (14), Ju Go (15), Ju Roku (16), Ju Shichi (17), Ju Hachi (18), Ju Kyu (19), Niju (20)",
              ],
              [
                3,
                "What are the three divisions of Katame No Kata and the techniques that comprise them?",
                "Katame Waza: Kesa Gatame, Kata Gatame, Kami Shiho Gatame, Yoko Shiho Gatame, Kuzure Kami Shiho Gatame. Shime Waza: Kata Juji Jime, Hadaka Jime, Okuri Eri Jime, Kata Ha Jime, Gyaku Juji Jime. Kansetsu Waza: Ude Garami, Juji Gatame, Ude Gatame, Hiza Gatame, Ashi Garami",
              ],
              [4, "Tell us about your judo journey.", ""],
            ],
          },
        ],
      },
    ],
  },
  {
    id: "records",
    title: "Promotion records",
    color: "points",
    detail: "Senior ranks & points log",
    pages: [
      {
        number: 19,
        blocks: [
          {
            heading: "Promotion Points Record - Senior Ranks",
            fields: [
              "Student name",
              "Date started judo",
              "Current rank",
              "Date of last promotion",
            ],
          },
          {
            heading: "Rank Requirements & Promotion History",
            columns: [
              "Rank",
              "Points needed",
              "Time in grade (minimum)",
              "Points earned",
              "Date promoted",
              "Sensei initials",
            ],
            rows: [
              ["Rokyu (Yellow)", "10", "3 months", "", "", ""],
              ["Gokyu (Orange)", "15", "3 months (6 total)", "", "", ""],
              ["Yonkyu (Green)", "20", "6 months (12 total)", "", "", ""],
              ["Sankyu (3rd Brown)", "30", "12 months (24 total)", "", "", ""],
              ["Nikyu (2nd Brown)", "30", "12 months (36 total)", "", "", ""],
              ["Ikkyu (1st Brown)", "30", "18 months (54 total)", "", "", ""],
              ["Shodan and above", "See USA Judo", "See USA Judo", "", "", ""],
            ],
            paragraphs: [
              "Points and time in grade are minimums and reset to zero after each promotion. All promotions must be approved by a Wichita Judo sensei.",
              "Shodan and above follow USA Judo requirements.",
            ],
          },
          {
            heading: "How to Earn Points - Winning Your Matches",
            columns: ["Achievement", "Points"],
            rows: [
              ["Defeat player with same rank", "1 pt"],
              ["Defeat player 1 rank higher (Kyu or Dan)", "1.5 pts"],
              ["Defeat player 2 ranks higher", "2 pts"],
              ["Defeat player 3 or more ranks higher", "3 pts"],
            ],
          },
          {
            heading: "Helping at a Tournament",
            columns: ["Achievement", "Points"],
            rows: [
              ["Keep score or bracket at tournament", "1 pt"],
              ["Referee at tournament", "1.5 pts"],
              ["Tournament director", "3 pts"],
            ],
          },
          {
            heading: "Kata Competitions",
            columns: ["Achievement", "Points"],
            rows: [
              ["Enter a local kata tournament", "1 pt"],
              ["Enter a national kata tournament", "2 pts"],
              ["Enter an international kata tournament", "3 pts"],
              ["Kata 1st place", "3 pts"],
              ["Kata 2nd place", "2 pts"],
              ["Kata 3rd place", "1 pt"],
            ],
            paragraphs: [
              "Non-competitive players will have longer time in grade and lower point requirements than competitive players, determined case by case.",
            ],
          },
        ],
        note: "Source discrepancy: the Ikkyu row here says 18 months (54 total); the main time-in-grade table on PDF page 6 says 12 months (48 total). Confirm with Sensei. Empty record fields are blank in the PDF.",
      },
      {
        number: 20,
        blocks: [
          {
            heading: "Points Log",
            fields: ["Working toward", "Points needed", "Eligible to test"],
          },
          {
            heading: "Points Log Entries",
            columns: [
              "Date",
              "Event / Tournament",
              "What I did (win, ref, kata, etc.)",
              "Opponent rank or place",
              "Points",
              "Running total",
              "Sensei initials",
            ],
            rows: [["", "", "", "", "", "", ""]],
            paragraphs: [
              "Points reset to zero after each promotion. Start a new log page at your new rank.",
            ],
          },
          {
            heading: "Wichita Judo",
            paragraphs: [
              "3900 E Harry Street, Suite 500, Wichita, KS 67218",
              "913-333-2196",
              "wichitajudo.com",
            ],
          },
        ],
        note: "The source points log is an unfilled record sheet. Its field labels and column headings are retained here; no student entries have been added.",
      },
    ],
  },
];
