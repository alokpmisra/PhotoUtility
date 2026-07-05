import { PrismaClient, QuestionType } from "@prisma/client";

const prisma = new PrismaClient();

type QuestionSeed = {
  type: QuestionType;
  difficulty: number;
  prompt: string;
  choices?: string[];
  answer: string;
  explanation: string;
  hint?: string;
};

type SkillSeed = {
  slug: string;
  name: string;
  description: string;
  prerequisiteSlugs: string[]; // referenced by globally-unique skill slug within this seed
  questions: QuestionSeed[];
};

type UnitSeed = {
  slug: string;
  name: string;
  gradeBand: "K-2" | "3-5" | "6-8";
  skills: SkillSeed[];
};

type SubjectSeed = {
  slug: string;
  name: string;
  color: string;
  icon: string;
  units: UnitSeed[];
};

const MC = QuestionType.MULTIPLE_CHOICE;
const NUM = QuestionType.NUMERIC;
const TXT = QuestionType.SHORT_TEXT;

const curriculum: SubjectSeed[] = [
  {
    slug: "math",
    name: "Math",
    color: "#2563eb",
    icon: "🔢",
    units: [
      {
        slug: "add-subtract",
        name: "Addition & Subtraction",
        gradeBand: "K-2",
        skills: [
          {
            slug: "adding-within-20",
            name: "Adding within 20",
            description: "Build fluency adding whole numbers up to 20.",
            prerequisiteSlugs: [],
            questions: [
              { type: NUM, difficulty: 1, prompt: "What is 3 + 4?", answer: "7", explanation: "Count on from 3: 4, 5, 6, 7. So 3 + 4 = 7.", hint: "Try counting up from the bigger number." },
              { type: NUM, difficulty: 2, prompt: "What is 8 + 6?", answer: "14", explanation: "Make a ten: 8 + 2 = 10, then add the remaining 4 → 14.", hint: "Try making a ten first." },
              { type: NUM, difficulty: 3, prompt: "What is 9 + 7?", answer: "16", explanation: "Round 9 up to 10 (add 1), then subtract 1 from 7: 10 + 6 = 16.", hint: "Round 9 up to 10, then adjust." },
              { type: NUM, difficulty: 4, prompt: "A farmer has 13 chickens and buys 8 more. How many chickens now?", answer: "21", explanation: "13 + 8 = 13 + 7 + 1 = 20 + 1 = 21.", hint: "Break 8 into 7 + 1 to reach a friendly number." },
              { type: NUM, difficulty: 5, prompt: "Sam had 17 marbles. He found 15 more, then gave away 6. How many does he have now?", answer: "26", explanation: "17 + 15 = 32, then 32 - 6 = 26.", hint: "Solve step by step: add first, then subtract." },
            ],
          },
          {
            slug: "subtracting-within-20",
            name: "Subtracting within 20",
            description: "Build fluency subtracting whole numbers up to 20.",
            prerequisiteSlugs: ["adding-within-20"],
            questions: [
              { type: NUM, difficulty: 1, prompt: "What is 9 - 4?", answer: "5", explanation: "Count back 4 from 9: 8, 7, 6, 5.", hint: "Count backwards from 9." },
              { type: NUM, difficulty: 2, prompt: "What is 15 - 6?", answer: "9", explanation: "15 - 5 = 10, then subtract 1 more → 9.", hint: "Subtract in two friendly steps." },
              { type: NUM, difficulty: 3, prompt: "What is 16 - 8?", answer: "8", explanation: "16 - 8 is the same as half of 16, which is 8.", hint: "Notice 8 is half of 16." },
              { type: NUM, difficulty: 4, prompt: "There are 20 apples. 13 are eaten. How many are left?", answer: "7", explanation: "20 - 13 = 7.", hint: "Subtract 13 from 20 in two steps: 20-10=10, 10-3=7." },
              { type: NUM, difficulty: 5, prompt: "Mia had 18 stickers. She gave 6 to a friend and then received 4 more. How many does she have now?", answer: "16", explanation: "18 - 6 = 12, then 12 + 4 = 16.", hint: "Do the subtraction first, then the addition." },
            ],
          },
        ],
      },
      {
        slug: "multiply-divide",
        name: "Multiplication & Division",
        gradeBand: "3-5",
        skills: [
          {
            slug: "multiplication-facts",
            name: "Multiplication facts",
            description: "Recall and apply multiplication facts up to 12x12.",
            prerequisiteSlugs: ["subtracting-within-20"],
            questions: [
              { type: NUM, difficulty: 1, prompt: "What is 3 × 4?", answer: "12", explanation: "3 groups of 4 is 4+4+4 = 12.", hint: "Add 4 three times." },
              { type: NUM, difficulty: 2, prompt: "What is 6 × 7?", answer: "42", explanation: "6 × 7 = 6 × 5 + 6 × 2 = 30 + 12 = 42.", hint: "Split 7 into 5 + 2." },
              { type: NUM, difficulty: 3, prompt: "What is 8 × 9?", answer: "72", explanation: "8 × 9 = 8 × 10 - 8 = 80 - 8 = 72.", hint: "Use 8 × 10 and subtract one group of 8." },
              { type: NUM, difficulty: 4, prompt: "A box holds 12 eggs. How many eggs are in 7 boxes?", answer: "84", explanation: "12 × 7 = 84.", hint: "Break 12 into 10 + 2 and multiply each by 7." },
              { type: NUM, difficulty: 5, prompt: "If one shelf holds 15 books and there are 9 shelves, how many books total?", answer: "135", explanation: "15 × 9 = 15 × 10 - 15 = 150 - 15 = 135.", hint: "Multiply by 10 first, then subtract one group of 15." },
            ],
          },
          {
            slug: "long-division",
            name: "Long division",
            description: "Divide multi-digit numbers using long division.",
            prerequisiteSlugs: ["multiplication-facts"],
            questions: [
              { type: NUM, difficulty: 1, prompt: "What is 12 ÷ 3?", answer: "4", explanation: "3 × 4 = 12, so 12 ÷ 3 = 4.", hint: "Think: what times 3 makes 12?" },
              { type: NUM, difficulty: 2, prompt: "What is 84 ÷ 4?", answer: "21", explanation: "4 × 21 = 84.", hint: "80 ÷ 4 = 20, and 4 ÷ 4 = 1, so 21." },
              { type: NUM, difficulty: 3, prompt: "What is 156 ÷ 6?", answer: "26", explanation: "6 × 26 = 156.", hint: "Try 6 × 25 = 150, then add one more 6." },
              { type: NUM, difficulty: 4, prompt: "What is 245 ÷ 5?", answer: "49", explanation: "5 × 49 = 245.", hint: "5 × 50 = 250, one group of 5 too many." },
              { type: NUM, difficulty: 5, prompt: "A rope 372 cm long is cut into 12 equal pieces. How long is each piece, in cm?", answer: "31", explanation: "372 ÷ 12 = 31.", hint: "12 × 30 = 360, then 12 more to reach 372." },
            ],
          },
          {
            slug: "fractions-basics",
            name: "Fractions basics",
            description: "Understand, simplify, and add/subtract simple fractions.",
            prerequisiteSlugs: ["multiplication-facts"],
            questions: [
              { type: MC, difficulty: 1, prompt: "Which fraction represents 'one half'?", choices: ["1/3", "1/2", "2/1", "1/4"], answer: "1/2", explanation: "One half means 1 out of 2 equal parts, written 1/2.", hint: "Half means splitting into 2 equal parts." },
              { type: TXT, difficulty: 2, prompt: "What is 1/4 + 1/4? (answer as a fraction, e.g. 1/2)", answer: "1/2", explanation: "1/4 + 1/4 = 2/4, which simplifies to 1/2.", hint: "Add the numerators since the denominators match." },
              { type: TXT, difficulty: 3, prompt: "Simplify 4/8 to lowest terms.", answer: "1/2", explanation: "4/8 = (4÷4)/(8÷4) = 1/2.", hint: "Divide the top and bottom by their greatest common factor." },
              { type: TXT, difficulty: 4, prompt: "What is 2/3 + 1/6? (answer as a fraction, e.g. 5/6)", answer: "5/6", explanation: "2/3 = 4/6, and 4/6 + 1/6 = 5/6.", hint: "Convert 2/3 to sixths first." },
              { type: TXT, difficulty: 5, prompt: "What is 3/4 - 1/3? (answer as a fraction, e.g. 5/12)", answer: "5/12", explanation: "Common denominator 12: 9/12 - 4/12 = 5/12.", hint: "Use 12 as the common denominator." },
            ],
          },
        ],
      },
      {
        slug: "pre-algebra",
        name: "Pre-Algebra",
        gradeBand: "6-8",
        skills: [
          {
            slug: "ratios-proportions",
            name: "Ratios & proportions",
            description: "Solve problems involving ratios and proportional reasoning.",
            prerequisiteSlugs: ["long-division", "fractions-basics"],
            questions: [
              { type: TXT, difficulty: 1, prompt: "Write the ratio of 4 apples to 2 oranges in simplest form (e.g. 2:1).", answer: "2:1", explanation: "4:2 simplifies to 2:1 by dividing both sides by 2.", hint: "Divide both numbers by their greatest common factor." },
              { type: NUM, difficulty: 2, prompt: "If 3 pencils cost $6, how much do 5 pencils cost (in dollars)?", answer: "10", explanation: "Each pencil costs $2, so 5 pencils cost $10.", hint: "Find the cost of one pencil first." },
              { type: NUM, difficulty: 3, prompt: "A recipe needs 2 cups of flour for 8 cookies. How many cups for 20 cookies?", answer: "5", explanation: "2/8 = 0.25 cups per cookie; 0.25 × 20 = 5.", hint: "Find cups per cookie, then scale up." },
              { type: NUM, difficulty: 4, prompt: "A map scale is 1 inch = 25 miles. How many miles are 4.5 inches?", answer: "112.5", explanation: "4.5 × 25 = 112.5 miles.", hint: "Multiply the inches by the scale factor." },
              { type: NUM, difficulty: 5, prompt: "Two numbers are in ratio 3:5 and their sum is 96. What is the larger number?", answer: "60", explanation: "The ratio splits 96 into 8 parts of 12; the larger share is 5 × 12 = 60.", hint: "Divide the total into 3+5=8 equal parts." },
            ],
          },
          {
            slug: "linear-equations",
            name: "Solving linear equations",
            description: "Solve one and two-step linear equations for x.",
            prerequisiteSlugs: ["ratios-proportions"],
            questions: [
              { type: NUM, difficulty: 1, prompt: "Solve for x: x + 5 = 12", answer: "7", explanation: "Subtract 5 from both sides: x = 7.", hint: "Undo the +5 by subtracting 5 from both sides." },
              { type: NUM, difficulty: 2, prompt: "Solve for x: 3x = 21", answer: "7", explanation: "Divide both sides by 3: x = 7.", hint: "Divide both sides by the coefficient of x." },
              { type: NUM, difficulty: 3, prompt: "Solve for x: 2x + 4 = 18", answer: "7", explanation: "Subtract 4: 2x = 14. Divide by 2: x = 7.", hint: "Isolate the term with x first." },
              { type: NUM, difficulty: 4, prompt: "Solve for x: 5x - 3 = 4x + 9", answer: "12", explanation: "Subtract 4x from both sides: x - 3 = 9, so x = 12.", hint: "Get all x terms on one side first." },
              { type: NUM, difficulty: 5, prompt: "Solve for x: 2(x - 3) + 4 = 3x - 5", answer: "3", explanation: "Expand: 2x - 6 + 4 = 3x - 5 → 2x - 2 = 3x - 5 → 3 = x.", hint: "Distribute the 2 first, then collect like terms." },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "reading",
    name: "Reading & English",
    color: "#7c3aed",
    icon: "📖",
    units: [
      {
        slug: "phonics-vocab",
        name: "Phonics & Vocabulary",
        gradeBand: "K-2",
        skills: [
          {
            slug: "sight-words-phonics",
            name: "Sight words & phonics",
            description: "Recognize common sight words and letter sounds.",
            prerequisiteSlugs: [],
            questions: [
              { type: MC, difficulty: 1, prompt: "Which word rhymes with 'cat'?", choices: ["dog", "hat", "car", "fish"], answer: "hat", explanation: "'Hat' and 'cat' both end in the '-at' sound.", hint: "Listen for the ending sound of 'cat'." },
              { type: MC, difficulty: 2, prompt: "Which word is spelled correctly?", choices: ["freind", "friend", "frend", "freand"], answer: "friend", explanation: "The correct spelling is f-r-i-e-n-d.", hint: "Remember: 'i' before 'e' except after 'c' - but this one's an exception, just memorize it!" },
              { type: MC, difficulty: 3, prompt: "What sound does 'sh' make in the word 'ship'?", choices: ["s", "sh", "ch", "h"], answer: "sh", explanation: "'sh' is a digraph making one blended sound, as in 'ship' or 'shop'.", hint: "Say 'ship' slowly and listen to the first sound." },
              { type: MC, difficulty: 4, prompt: "Which word has a silent letter?", choices: ["knee", "nose", "hand", "cup"], answer: "knee", explanation: "The 'k' in 'knee' is silent.", hint: "Say each word out loud - one letter won't be heard." },
              { type: MC, difficulty: 5, prompt: "Which word is a compound word?", choices: ["basketball", "running", "happy", "yellow"], answer: "basketball", explanation: "'Basketball' combines 'basket' and 'ball' into one word.", hint: "Look for a word made of two smaller words." },
            ],
          },
          {
            slug: "basic-vocabulary",
            name: "Basic vocabulary",
            description: "Understand synonyms, antonyms, and word meanings.",
            prerequisiteSlugs: ["sight-words-phonics"],
            questions: [
              { type: MC, difficulty: 1, prompt: "What is a synonym for 'happy'?", choices: ["sad", "joyful", "angry", "tired"], answer: "joyful", explanation: "'Joyful' means the same as 'happy'.", hint: "A synonym means 'the same as'." },
              { type: MC, difficulty: 2, prompt: "What is an antonym for 'big'?", choices: ["large", "huge", "small", "tall"], answer: "small", explanation: "'Small' is the opposite of 'big'.", hint: "An antonym is the opposite word." },
              { type: MC, difficulty: 3, prompt: "Which word means 'to look at closely'?", choices: ["examine", "ignore", "forget", "sleep"], answer: "examine", explanation: "'Examine' means to inspect or look at closely.", hint: "Think about what a doctor does at a checkup." },
              { type: MC, difficulty: 4, prompt: "Which word means the same as 'enormous'?", choices: ["tiny", "huge", "quiet", "fast"], answer: "huge", explanation: "'Enormous' and 'huge' both describe something very large.", hint: "'Enormous' describes size." },
              { type: MC, difficulty: 5, prompt: "Which word best completes: 'The detective began to ___ the mysterious clues.'", choices: ["investigate", "decorate", "celebrate", "hesitate"], answer: "investigate", explanation: "'Investigate' fits the context of a detective examining clues.", hint: "What does a detective do with clues?" },
            ],
          },
        ],
      },
      {
        slug: "grammar-comprehension",
        name: "Grammar & Comprehension",
        gradeBand: "3-5",
        skills: [
          {
            slug: "parts-of-speech",
            name: "Parts of speech",
            description: "Identify nouns, verbs, adjectives, adverbs, and more.",
            prerequisiteSlugs: ["basic-vocabulary"],
            questions: [
              { type: MC, difficulty: 1, prompt: "In 'The dog runs fast,' which word is the verb?", choices: ["The", "dog", "runs", "fast"], answer: "runs", explanation: "'Runs' shows the action, making it the verb.", hint: "A verb is the action word." },
              { type: MC, difficulty: 2, prompt: "Which word in 'She quickly closed the door' is an adverb?", choices: ["She", "quickly", "closed", "door"], answer: "quickly", explanation: "'Quickly' describes how the action was done, making it an adverb.", hint: "Adverbs often end in '-ly' and describe verbs." },
              { type: MC, difficulty: 3, prompt: "Identify the adjective in: 'The tall boy jumped.'", choices: ["The", "tall", "boy", "jumped"], answer: "tall", explanation: "'Tall' describes the noun 'boy', making it an adjective.", hint: "Adjectives describe nouns." },
              { type: MC, difficulty: 4, prompt: "Which sentence uses a preposition correctly?", choices: ["The cat sat on the mat.", "The cat sat the mat.", "The cat the mat sat.", "Sat cat the mat on."], answer: "The cat sat on the mat.", explanation: "'On' is a preposition showing the cat's position relative to the mat.", hint: "Prepositions show location or relationship, like 'on', 'in', 'under'." },
              { type: MC, difficulty: 5, prompt: "Which word is a conjunction in: 'I wanted to go, but it rained.'", choices: ["wanted", "go", "but", "rained"], answer: "but", explanation: "'But' connects two clauses, making it a conjunction.", hint: "Conjunctions join two parts of a sentence, like 'and', 'but', 'or'." },
            ],
          },
          {
            slug: "reading-comprehension",
            name: "Reading comprehension",
            description: "Understand sequence, cause/effect, and main ideas in short passages.",
            prerequisiteSlugs: ["parts-of-speech"],
            questions: [
              { type: MC, difficulty: 1, prompt: "Passage: 'Tom fed his dog and then went to school.' What did Tom do first?", choices: ["Went to school", "Fed his dog", "Did homework", "Slept"], answer: "Fed his dog", explanation: "The passage states he fed the dog before going to school.", hint: "Look for the word 'then' to find the order of events." },
              { type: MC, difficulty: 2, prompt: "Passage: 'The sky turned dark and rain began to fall.' What is likely happening?", choices: ["A sunny day", "A storm", "A snowstorm", "Nighttime"], answer: "A storm", explanation: "Dark skies and rain together suggest a storm.", hint: "Think about what weather causes dark skies and rain." },
              { type: MC, difficulty: 3, prompt: "Passage: 'Maria practiced piano every day, so she won the recital.' Why did Maria win?", choices: ["Luck", "She practiced daily", "She was older", "She had a new piano"], answer: "She practiced daily", explanation: "The word 'so' shows practicing daily caused her to win.", hint: "Find the cause connected by the word 'so'." },
              { type: MC, difficulty: 4, prompt: "Passage: 'Although he was tired, Jake finished the race.' What does 'although' signal?", choices: ["Cause", "Contrast", "Time", "Location"], answer: "Contrast", explanation: "'Although' introduces a contrast between being tired and still finishing.", hint: "'Although' shows two contrasting ideas." },
              { type: MC, difficulty: 5, prompt: "Passage: 'The town's only bridge collapsed, forcing residents to take a two-hour detour.' What is the main effect described?", choices: ["The bridge was old", "Residents face a longer commute", "The town built a new bridge", "No one uses the bridge"], answer: "Residents face a longer commute", explanation: "The collapse's effect is the long detour residents must now take.", hint: "Look for what changed for residents because of the collapse." },
            ],
          },
        ],
      },
      {
        slug: "advanced-reading",
        name: "Advanced Reading",
        gradeBand: "6-8",
        skills: [
          {
            slug: "context-clues-inference",
            name: "Context clues & inference",
            description: "Infer word meanings and ideas using surrounding context.",
            prerequisiteSlugs: ["reading-comprehension"],
            questions: [
              { type: MC, difficulty: 1, prompt: "'The arid desert had no water for miles.' 'Arid' most likely means:", choices: ["Wet", "Dry", "Cold", "Green"], answer: "Dry", explanation: "The context 'no water for miles' signals 'arid' means dry.", hint: "Look at the clue 'no water for miles'." },
              { type: MC, difficulty: 2, prompt: "'She was ecstatic when she won the prize.' 'Ecstatic' means:", choices: ["Very sad", "Very happy", "Confused", "Angry"], answer: "Very happy", explanation: "Winning a prize is associated with great happiness.", hint: "Think about how someone feels after winning." },
              { type: MC, difficulty: 3, prompt: "'He was so famished he ate three plates of food.' 'Famished' means:", choices: ["Very hungry", "Very full", "Very tired", "Very happy"], answer: "Very hungry", explanation: "Eating three plates suggests extreme hunger.", hint: "Consider why someone would eat three plates of food." },
              { type: MC, difficulty: 4, prompt: "'Despite the meager harvest, the farmers remained hopeful.' 'Meager' likely means:", choices: ["Abundant", "Small/insufficient", "Colorful", "Fast"], answer: "Small/insufficient", explanation: "'Despite' signals a contrast with 'hopeful', so the harvest was poor/small.", hint: "'Despite' shows the harvest was a problem, not a triumph." },
              { type: MC, difficulty: 5, prompt: "'The diplomat's conciliatory tone eased tensions between the two nations.' 'Conciliatory' likely means:", choices: ["Aggressive", "Peace-making", "Confusing", "Loud"], answer: "Peace-making", explanation: "A tone that 'eased tensions' is calming and peace-making.", hint: "Focus on the effect: tensions were eased." },
            ],
          },
          {
            slug: "figurative-language",
            name: "Figurative language",
            description: "Identify similes, metaphors, personification, hyperbole, and alliteration.",
            prerequisiteSlugs: ["context-clues-inference"],
            questions: [
              { type: MC, difficulty: 1, prompt: "'The classroom was a zoo.' This is an example of:", choices: ["Simile", "Metaphor", "Alliteration", "Onomatopoeia"], answer: "Metaphor", explanation: "It directly compares the classroom to a zoo without using 'like' or 'as'.", hint: "A metaphor compares without using 'like' or 'as'." },
              { type: MC, difficulty: 2, prompt: "'Her smile was as bright as the sun.' This is an example of:", choices: ["Simile", "Metaphor", "Personification", "Hyperbole"], answer: "Simile", explanation: "It compares using 'as', which makes it a simile.", hint: "Look for the word 'as' or 'like'." },
              { type: MC, difficulty: 3, prompt: "'The wind whispered through the trees.' This is an example of:", choices: ["Simile", "Personification", "Hyperbole", "Alliteration"], answer: "Personification", explanation: "Giving wind the human ability to 'whisper' is personification.", hint: "Can wind actually whisper? This gives it a human trait." },
              { type: MC, difficulty: 4, prompt: "'I've told you a million times!' This is an example of:", choices: ["Simile", "Metaphor", "Hyperbole", "Onomatopoeia"], answer: "Hyperbole", explanation: "This is an extreme exaggeration, which is hyperbole.", hint: "Has anyone really said something a literal million times?" },
              { type: MC, difficulty: 5, prompt: "'Peter Piper picked a peck of pickled peppers.' This is an example of:", choices: ["Alliteration", "Simile", "Metaphor", "Hyperbole"], answer: "Alliteration", explanation: "The repeated 'p' sound at the start of words is alliteration.", hint: "Notice the repeated starting sound." },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "science",
    name: "Science",
    color: "#0d9488",
    icon: "🔬",
    units: [
      {
        slug: "life-science-basics",
        name: "Life Science Basics",
        gradeBand: "K-2",
        skills: [
          {
            slug: "living-nonliving",
            name: "Living vs non-living & basic needs",
            description: "Distinguish living and non-living things and their basic needs.",
            prerequisiteSlugs: [],
            questions: [
              { type: MC, difficulty: 1, prompt: "Which of these is a living thing?", choices: ["Rock", "Tree", "Chair", "Cloud"], answer: "Tree", explanation: "Trees grow, need water, and reproduce, making them living things.", hint: "Living things grow and need food or water." },
              { type: MC, difficulty: 2, prompt: "All living things need which of these to survive?", choices: ["Water", "Television", "Money", "Cars"], answer: "Water", explanation: "All living things need water to survive.", hint: "Think about what every plant and animal needs daily." },
              { type: MC, difficulty: 3, prompt: "Which is NOT a basic need of living things?", choices: ["Food", "Air", "Shelter", "Video games"], answer: "Video games", explanation: "Video games are not required for survival, unlike food, air, and shelter.", hint: "Which of these is just for fun, not survival?" },
              { type: MC, difficulty: 4, prompt: "A cactus surviving in the desert with little water shows:", choices: ["It doesn't need water", "Adaptation to environment", "It's non-living", "It's a rock"], answer: "Adaptation to environment", explanation: "Cacti have adapted to store water and survive in dry climates.", hint: "Think about how living things change to survive their surroundings." },
              { type: MC, difficulty: 5, prompt: "Which best explains why fish have gills instead of lungs?", choices: ["They are adapted to breathe underwater", "They prefer land", "Gills help them see", "Gills are decorative"], answer: "They are adapted to breathe underwater", explanation: "Gills let fish extract oxygen from water, an adaptation to their habitat.", hint: "Consider where fish live and what they need to breathe there." },
            ],
          },
          {
            slug: "life-cycles",
            name: "Animal & plant life cycles",
            description: "Understand the stages of animal and plant life cycles.",
            prerequisiteSlugs: ["living-nonliving"],
            questions: [
              { type: MC, difficulty: 1, prompt: "What comes after an egg in a butterfly's life cycle?", choices: ["Adult butterfly", "Caterpillar (larva)", "Cocoon", "Nothing"], answer: "Caterpillar (larva)", explanation: "The egg hatches into a caterpillar, also called a larva.", hint: "What hatches out of an egg first?" },
              { type: MC, difficulty: 2, prompt: "What do seeds need to germinate?", choices: ["Water, warmth, and air", "Only sunlight", "Only soil", "Nothing"], answer: "Water, warmth, and air", explanation: "Seeds need water, warmth, and air (oxygen) to begin growing.", hint: "Think of the conditions needed to start a seed sprouting." },
              { type: MC, difficulty: 3, prompt: "Which stage comes between caterpillar and adult butterfly?", choices: ["Egg", "Pupa (chrysalis)", "Larva", "Seed"], answer: "Pupa (chrysalis)", explanation: "The caterpillar forms a chrysalis (pupa) before becoming an adult butterfly.", hint: "This stage looks like a hard shell or cocoon." },
              { type: MC, difficulty: 4, prompt: "Which sequence is correct for a frog's life cycle?", choices: ["Egg → Tadpole → Froglet → Adult frog", "Egg → Adult frog → Tadpole", "Tadpole → Egg → Frog", "Adult frog → Egg → Adult"], answer: "Egg → Tadpole → Froglet → Adult frog", explanation: "Frogs start as eggs, hatch into tadpoles, grow legs as froglets, then become adults.", hint: "Tadpoles come before frogs with legs." },
              { type: MC, difficulty: 5, prompt: "Why do some plants produce flowers before fruit?", choices: ["Flowers attract pollinators needed for fruit to form", "Flowers are decorative only", "Fruit forms before flowers", "Flowers replace fruit"], answer: "Flowers attract pollinators needed for fruit to form", explanation: "Pollination by insects or wind is often required before fruit can develop.", hint: "Think about what bees do with flowers." },
            ],
          },
        ],
      },
      {
        slug: "earth-physical-science",
        name: "Earth & Physical Science",
        gradeBand: "3-5",
        skills: [
          {
            slug: "states-of-matter",
            name: "States of matter",
            description: "Explore solids, liquids, gases, and phase changes.",
            prerequisiteSlugs: ["life-cycles"],
            questions: [
              { type: MC, difficulty: 1, prompt: "Ice is which state of matter?", choices: ["Liquid", "Solid", "Gas", "Plasma"], answer: "Solid", explanation: "Ice holds a fixed shape, making it a solid.", hint: "Does ice hold its shape or flow?" },
              { type: MC, difficulty: 2, prompt: "What happens to water when it boils?", choices: ["It becomes a gas", "It becomes a solid", "It disappears forever", "It becomes colder"], answer: "It becomes a gas", explanation: "Boiling turns liquid water into water vapor, a gas.", hint: "Think of steam rising from a boiling pot." },
              { type: MC, difficulty: 3, prompt: "What is the process called when a solid turns directly into a gas?", choices: ["Melting", "Freezing", "Sublimation", "Condensation"], answer: "Sublimation", explanation: "Sublimation skips the liquid stage, like dry ice turning to fog.", hint: "This process skips the liquid stage entirely." },
              { type: MC, difficulty: 4, prompt: "Why does a balloon expand when heated?", choices: ["Gas particles move faster and spread out", "The balloon material shrinks", "Cold air enters", "Gravity decreases"], answer: "Gas particles move faster and spread out", explanation: "Heating gas increases particle motion, causing expansion.", hint: "Think about particle energy and movement when heated." },
              { type: MC, difficulty: 5, prompt: "At the particle level, what mainly differs between a solid and a gas?", choices: ["The types of atoms present", "The energy and spacing of particles", "The color of particles", "Nothing, they are identical"], answer: "The energy and spacing of particles", explanation: "Gas particles have more energy and are spread farther apart than solid particles.", hint: "Consider how tightly packed and how fast particles move in each state." },
            ],
          },
          {
            slug: "weather-water-cycle",
            name: "Weather & the water cycle",
            description: "Understand evaporation, condensation, precipitation, and weather patterns.",
            prerequisiteSlugs: ["states-of-matter"],
            questions: [
              { type: MC, difficulty: 1, prompt: "What is precipitation?", choices: ["Water falling from clouds (rain, snow)", "Water evaporating", "Water freezing underground", "Sunlight"], answer: "Water falling from clouds (rain, snow)", explanation: "Precipitation is any water that falls from clouds, like rain or snow.", hint: "Think of rain or snow falling." },
              { type: MC, difficulty: 2, prompt: "What causes clouds to form?", choices: ["Water vapor condensing around dust particles", "Wind blowing dust", "Sunlight melting ice", "Ocean waves"], answer: "Water vapor condensing around dust particles", explanation: "Water vapor cools and condenses onto tiny particles to form clouds.", hint: "Clouds form when water vapor changes state." },
              { type: MC, difficulty: 3, prompt: "Which step follows evaporation in the water cycle?", choices: ["Condensation", "Precipitation", "Collection", "Freezing"], answer: "Condensation", explanation: "After evaporation, water vapor rises and condenses into clouds.", hint: "What happens right after water vapor rises?" },
              { type: MC, difficulty: 4, prompt: "Why is the water cycle described as continuous?", choices: ["Water is constantly recycled between Earth and atmosphere", "Water is created and destroyed", "Water only moves once", "Water cycle stops at night"], answer: "Water is constantly recycled between Earth and atmosphere", explanation: "The water cycle repeats endlessly as water moves between land, sea, and sky.", hint: "Does the water cycle ever truly stop?" },
              { type: MC, difficulty: 5, prompt: "A meteorologist predicts rain because humidity is rising and pressure is dropping. This is an example of:", choices: ["Random guessing", "Using data patterns to forecast weather", "Ignoring evidence", "Measuring only temperature"], answer: "Using data patterns to forecast weather", explanation: "Meteorologists use multiple data points, like humidity and pressure, to make forecasts.", hint: "Think about how scientists use evidence to make predictions." },
            ],
          },
        ],
      },
      {
        slug: "scientific-reasoning",
        name: "Scientific Reasoning",
        gradeBand: "6-8",
        skills: [
          {
            slug: "scientific-method",
            name: "The scientific method",
            description: "Apply the steps of the scientific method to investigations.",
            prerequisiteSlugs: ["weather-water-cycle"],
            questions: [
              { type: MC, difficulty: 1, prompt: "What is the first step of the scientific method?", choices: ["Ask a question", "Write a conclusion", "Publish results", "Buy equipment"], answer: "Ask a question", explanation: "Scientific investigations begin with a question to explore.", hint: "What sparks an investigation in the first place?" },
              { type: MC, difficulty: 2, prompt: "What is a hypothesis?", choices: ["A testable prediction", "A proven fact", "A random guess with no reasoning", "The final answer"], answer: "A testable prediction", explanation: "A hypothesis is an educated, testable guess about an outcome.", hint: "It's a guess, but a scientific and testable one." },
              { type: MC, difficulty: 3, prompt: "Why do scientists use a control group in an experiment?", choices: ["To compare results against a baseline", "To make the experiment longer", "To use more supplies", "It's not necessary"], answer: "To compare results against a baseline", explanation: "A control group shows what happens without the tested variable, for comparison.", hint: "What do you need to compare your results against?" },
              { type: MC, difficulty: 4, prompt: "If an experiment's results don't support the hypothesis, a scientist should:", choices: ["Hide the data", "Revise the hypothesis and investigate further", "Never experiment again", "Assume equipment is broken without checking"], answer: "Revise the hypothesis and investigate further", explanation: "Unexpected results should lead to revised hypotheses and further study, not concealment.", hint: "Good science means learning from unexpected results." },
              { type: MC, difficulty: 5, prompt: "Why is it important for experiments to be repeatable by other scientists?", choices: ["It confirms results are reliable, not a fluke", "It wastes time", "It's only for famous scientists", "It's not important"], answer: "It confirms results are reliable, not a fluke", explanation: "Repeatability helps confirm findings aren't due to chance or error.", hint: "Think about how we know a result wasn't just luck." },
            ],
          },
          {
            slug: "energy-forces",
            name: "Energy & forces",
            description: "Understand potential/kinetic energy, gravity, and Newton's laws.",
            prerequisiteSlugs: ["scientific-method"],
            questions: [
              { type: MC, difficulty: 1, prompt: "Which is an example of potential energy?", choices: ["A ball rolling downhill", "A stretched rubber band", "A moving car", "Sound waves"], answer: "A stretched rubber band", explanation: "A stretched rubber band stores energy until released, making it potential energy.", hint: "Potential energy is stored energy, waiting to be released." },
              { type: MC, difficulty: 2, prompt: "What force pulls objects toward Earth?", choices: ["Magnetism", "Gravity", "Friction", "Tension"], answer: "Gravity", explanation: "Gravity is the force that pulls objects toward Earth's center.", hint: "This force is why things fall down, not up." },
              { type: MC, difficulty: 3, prompt: "What force opposes motion between two surfaces?", choices: ["Gravity", "Friction", "Magnetism", "Inertia"], answer: "Friction", explanation: "Friction resists the relative motion between surfaces in contact.", hint: "This force is why rubbing your hands together makes heat." },
              { type: MC, difficulty: 4, prompt: "According to Newton's third law, if you push on a wall, the wall:", choices: ["Pushes back equally", "Does nothing", "Absorbs the force forever", "Moves toward you"], answer: "Pushes back equally", explanation: "Newton's third law: for every action, there is an equal and opposite reaction.", hint: "Remember: for every action there's an equal and opposite reaction." },
              { type: MC, difficulty: 5, prompt: "A heavier object and a lighter object are dropped from the same height in a vacuum. Which hits the ground first?", choices: ["The heavier object", "The lighter object", "They land at the same time", "Neither falls"], answer: "They land at the same time", explanation: "Without air resistance, gravity accelerates all objects equally regardless of mass.", hint: "Without air resistance, mass doesn't affect fall speed." },
            ],
          },
        ],
      },
    ],
  },
];

const badgeSeeds = [
  { slug: "first-steps", name: "First Steps", description: "Completed your very first practice question.", icon: "🌱" },
  { slug: "five-in-a-row", name: "On a Roll", description: "Answered 5 questions correctly in a row.", icon: "🔥" },
  { slug: "skill-master", name: "Skill Master", description: "Fully mastered your first skill.", icon: "🏅" },
  { slug: "champion-math", name: "Math Champion", description: "Mastered every skill in Math.", icon: "🧮" },
  { slug: "champion-reading", name: "Reading Champion", description: "Mastered every skill in Reading & English.", icon: "📚" },
  { slug: "champion-science", name: "Science Champion", description: "Mastered every skill in Science.", icon: "🧪" },
];

async function main() {
  console.log("Seeding badges...");
  for (const badge of badgeSeeds) {
    await prisma.badge.upsert({ where: { slug: badge.slug }, update: badge, create: badge });
  }

  console.log("Seeding curriculum...");
  const skillIdBySlug = new Map<string, string>();
  const prereqSlugsBySlug = new Map<string, string[]>();

  for (let subjectOrder = 0; subjectOrder < curriculum.length; subjectOrder++) {
    const subjectSeed = curriculum[subjectOrder];
    const subject = await prisma.subject.upsert({
      where: { slug: subjectSeed.slug },
      update: { name: subjectSeed.name, color: subjectSeed.color, icon: subjectSeed.icon, order: subjectOrder },
      create: { slug: subjectSeed.slug, name: subjectSeed.name, color: subjectSeed.color, icon: subjectSeed.icon, order: subjectOrder },
    });

    for (let unitOrder = 0; unitOrder < subjectSeed.units.length; unitOrder++) {
      const unitSeed = subjectSeed.units[unitOrder];
      const unit = await prisma.unit.upsert({
        where: { subjectId_slug: { subjectId: subject.id, slug: unitSeed.slug } },
        update: { name: unitSeed.name, gradeBand: unitSeed.gradeBand, order: unitOrder },
        create: { subjectId: subject.id, slug: unitSeed.slug, name: unitSeed.name, gradeBand: unitSeed.gradeBand, order: unitOrder },
      });

      for (let skillOrder = 0; skillOrder < unitSeed.skills.length; skillOrder++) {
        const skillSeed = unitSeed.skills[skillOrder];
        const skill = await prisma.skill.upsert({
          where: { unitId_slug: { unitId: unit.id, slug: skillSeed.slug } },
          update: { name: skillSeed.name, description: skillSeed.description, order: skillOrder },
          create: { unitId: unit.id, slug: skillSeed.slug, name: skillSeed.name, description: skillSeed.description, order: skillOrder },
        });
        skillIdBySlug.set(skillSeed.slug, skill.id);
        prereqSlugsBySlug.set(skillSeed.slug, skillSeed.prerequisiteSlugs);

        // Replace this skill's questions on every reseed to keep content in sync with this file.
        await prisma.question.deleteMany({ where: { skillId: skill.id } });
        for (const q of skillSeed.questions) {
          await prisma.question.create({
            data: {
              skillId: skill.id,
              type: q.type,
              difficulty: q.difficulty,
              prompt: q.prompt,
              choices: q.choices ? JSON.stringify(q.choices) : null,
              answer: q.answer,
              explanation: q.explanation,
              hint: q.hint,
            },
          });
        }
      }
    }
  }

  console.log("Linking skill prerequisites...");
  for (const [slug, prereqSlugs] of prereqSlugsBySlug.entries()) {
    if (prereqSlugs.length === 0) continue;
    const skillId = skillIdBySlug.get(slug);
    if (!skillId) continue;
    await prisma.skill.update({
      where: { id: skillId },
      data: {
        prerequisites: {
          set: prereqSlugs.map((p) => ({ id: skillIdBySlug.get(p)! })),
        },
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
