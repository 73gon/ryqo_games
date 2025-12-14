// TypeRacer constants

// Common English words for timed mode
export const COMMON_WORDS = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'is', 'are', 'was', 'were', 'been', 'being', 'has', 'had', 'does', 'did',
  'should', 'must', 'might', 'may', 'need', 'help', 'try', 'ask', 'find', 'tell',
  'feel', 'become', 'leave', 'put', 'mean', 'keep', 'let', 'begin', 'seem', 'show',
  'hear', 'play', 'run', 'move', 'live', 'believe', 'hold', 'bring', 'happen', 'write',
  'provide', 'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue', 'set', 'learn',
  'change', 'lead', 'understand', 'watch', 'follow', 'stop', 'create', 'speak', 'read', 'allow',
  'add', 'spend', 'grow', 'open', 'walk', 'win', 'offer', 'remember', 'love', 'consider',
  'appear', 'buy', 'wait', 'serve', 'die', 'send', 'expect', 'build', 'stay', 'fall',
  'cut', 'reach', 'kill', 'remain', 'suggest', 'raise', 'pass', 'sell', 'require', 'report',
  'decide', 'pull', 'develop', 'break', 'receive', 'agree', 'support', 'hit', 'produce', 'eat',
  'cover', 'catch', 'draw', 'choose', 'cause', 'point', 'listen', 'realize', 'place', 'face',
  'matter', 'case', 'right', 'line', 'program', 'world', 'house', 'area', 'money', 'story',
  'fact', 'month', 'lot', 'study', 'book', 'eye', 'job', 'word', 'business', 'issue',
  'side', 'kind', 'head', 'far', 'black', 'long', 'both', 'little', 'same', 'group',
  'always', 'music', 'those', 'every', 'party', 'start', 'still', 'found', 'answer', 'city',
  'own', 'point', 'man', 'woman', 'child', 'mother', 'father', 'friend', 'girl', 'boy',
  'part', 'place', 'reason', 'question', 'idea', 'problem', 'company', 'system', 'hand', 'high',
  'small', 'large', 'next', 'early', 'young', 'important', 'few', 'public', 'bad', 'same',
  'able', 'around', 'again', 'never', 'before', 'between', 'under', 'today', 'already', 'later',
  'home', 'order', 'power', 'old', 'great', 'before', 'while', 'water', 'call', 'history',
  'often', 'usually', 'maybe', 'almost', 'actually', 'once', 'quite', 'likely', 'rather', 'ever',
  'true', 'real', 'free', 'best', 'better', 'sure', 'clear', 'hard', 'present', 'special',
];

// Punctuation marks to add when punctuation mode is enabled
export const PUNCTUATION_MARKS = ['.', ',', '!', '?', ';', ':'];

export const RACE_TEXTS = [
  // Pangrams and classics
  'the quick brown fox jumps over the lazy dog. this pangram contains every letter of the alphabet at least once.',
  'pack my box with five dozen liquor jugs. how vexingly quick daft zebras jump over the lazy brown dogs.',
  'sphinx of black quartz, judge my vow. the five boxing wizards jump quickly through the foggy night.',
  'how quickly daft jumping zebras vex. the job requires extra pluck and zeal from every young wage earner.',
  'jived fox nymph grabs quick waltz. crazy frederick bought many very exquisite opal jewels for his wife.',

  // Programming and technology
  'programming is the art of telling a computer what to do. it requires patience, logic, and a creative mind to solve complex problems.',
  'in the heart of every great program lies elegant code. clean architecture and thoughtful design make software maintainable.',
  'code is like humor. when you have to explain it, it is bad. write code that speaks for itself and needs no documentation.',
  'debugging is twice as hard as writing the code in the first place. if you write clever code, you are not smart enough to debug it.',
  'first, solve the problem. then, write the code. understanding the problem is half the solution in programming.',
  'the best code is no code at all. every line of code you write is a liability that must be maintained forever.',
  'software is like gardening. you plant seeds, nurture them, prune dead branches, and watch your creation grow.',
  'a good programmer looks both ways before crossing a one way street. defensive coding prevents unexpected bugs.',
  'talk is cheap. show me the code. actions speak louder than words, especially in the world of software development.',
  'measuring programming progress by lines of code is like measuring aircraft building progress by weight alone.',
  'any fool can write code that a computer can understand. good programmers write code that humans understand.',
  'the computer was born to solve problems that did not exist before. technology creates new possibilities daily.',
  'technology is best when it brings people together. the internet has connected billions across the globe.',
  'we are stuck with technology when what we really want is just stuff that works. simplicity is the goal.',
  'computers are useless. they can only give you answers. the questions we ask determine everything.',
  'artificial intelligence is no match for natural stupidity. machines can compute but humans must think.',
  'the internet is becoming the town square for the global village of tomorrow. connection is everything.',

  // Science and nature
  'the nitrogen in our dna, the calcium in our teeth, the iron in our blood, were all made in stars.',
  'somewhere, something incredible is waiting to be known. the universe is under no obligation to make sense.',
  'we are all made of star stuff. the cosmos is within us. we are a way for the universe to know itself.',
  'look up at the stars and not down at your feet. try to make sense of what you see and wonder.',
  'the good thing about science is that it is true whether or not you believe in it. facts remain facts.',
  'imagination is more important than knowledge. knowledge is limited, but imagination encircles the world.',
  'the important thing is not to stop questioning. curiosity has its own reason for existing in nature.',
  'in the middle of difficulty lies opportunity. every challenge contains the seeds of its own solution.',
  'nature does not hurry, yet everything is accomplished. patience and persistence achieve great things.',
  'the earth has music for those who listen. nature speaks to those who take the time to be still.',
  'study nature, love nature, stay close to nature. it will never fail you when you need wisdom.',
  'the clearest way into the universe is through a forest wilderness. nature reveals the deepest truths.',

  // Philosophy and wisdom
  'the only true wisdom is in knowing you know nothing. humility is the beginning of all understanding.',
  'be the change you wish to see in the world. your actions ripple outward and inspire others.',
  'happiness is not something ready made. it comes from your own actions and choices every single day.',
  'the mind is everything. what you think, you become. your thoughts shape your reality completely.',
  'in the end, we only regret the chances we did not take. live boldly and embrace new experiences.',
  'success is not final, failure is not fatal. it is the courage to continue that counts the most.',
  'the future belongs to those who believe in the beauty of their dreams. dream big and work hard.',
  'life is what happens when you are busy making other plans. embrace the unexpected with grace.',
  'the only way to do great work is to love what you do. passion transforms work into purpose.',
  'knowledge is power, but enthusiasm pulls the switch. energy and wisdom together move mountains.',
  'simplicity is the ultimate sophistication. the best solutions are often the simplest ones.',
  'every expert was once a beginner. do not be afraid to start from nothing and grow.',
  'the best time to plant a tree was twenty years ago. the second best time is now.',
  'quality means doing it right when no one is looking. integrity is who you are in the dark.',
  'it does not matter how slowly you go as long as you do not stop. persistence wins every time.',
  'the journey of a thousand miles begins with a single step. every great thing starts small.',
  'what lies behind us and what lies before us are tiny matters compared to what lies within us.',
  'the only impossible journey is the one you never begin. take the first step today.',
  'do not wait for the perfect moment. take the moment and make it perfect through your actions.',
  'the secret of getting ahead is getting started. the hardest part is often just beginning.',

  // Creativity and innovation
  'innovation distinguishes between a leader and a follower. think different and challenge norms.',
  'creativity is intelligence having fun. let your mind play and discover new possibilities.',
  'the chief enemy of creativity is good sense. sometimes you must break the rules to innovate.',
  'creativity takes courage. sharing your unique vision with the world requires bravery.',
  'you cannot use up creativity. the more you use, the more you have available to give.',
  'every child is an artist. the problem is how to remain an artist once we grow up.',
  'creativity is contagious. pass it on to others and watch ideas multiply exponentially.',
  'the desire to create is one of the deepest yearnings of the human soul. create something today.',
  'logic will get you from a to b. imagination will take you everywhere across the universe.',
  'to live a creative life we must lose our fear of being wrong. embrace mistakes as learning.',

  // Life and motivation
  'life is not about finding yourself. life is about creating yourself through daily choices.',
  'the purpose of our lives is to be happy. seek joy in every moment you are given.',
  'get busy living or get busy dying. life is too short to waste on things that do not matter.',
  'in three words i can sum up everything i learned about life: it goes on. keep moving forward.',
  'life is really simple, but we insist on making it complicated. embrace simplicity.',
  'the biggest adventure you can take is to live the life of your dreams. dare to dream.',
  'do not count the days. make the days count. each moment is an opportunity.',
  'life is ten percent what happens to you and ninety percent how you react to it.',
  'you only live once, but if you do it right, once is enough. make every day count.',
  'the purpose of life is not to be happy but to matter, to be productive, to be useful.',
  'twenty years from now you will be more disappointed by the things you did not do.',
  'the best revenge is massive success. prove doubters wrong through your achievements.',
  'believe you can and you are halfway there. confidence is the foundation of success.',
  'it always seems impossible until it is done. breakthrough comes after persistence.',

  // Work and success
  'hard work beats talent when talent does not work hard. effort trumps natural ability.',
  'success usually comes to those who are too busy to be looking for it. focus on the work.',
  'the only place where success comes before work is in the dictionary. earn your victories.',
  'opportunities do not happen. you create them through preparation and consistent effort.',
  'do not be afraid to give up the good to go for the great. excellence requires sacrifice.',
  'success is walking from failure to failure with no loss of enthusiasm. keep going always.',
  'the road to success and the road to failure are almost exactly the same. persistence matters.',
  'i find that the harder i work, the more luck i seem to have. luck favors the prepared.',
  'there are no secrets to success. it is the result of preparation, hard work, and learning.',
  'success is not how high you have climbed, but how you make a positive difference.',
  'the difference between ordinary and extraordinary is that little extra effort each day.',

  // Books and literature
  'a room without books is like a body without a soul. reading expands the mind infinitely.',
  'the more that you read, the more things you will know. the more you learn, the more places you will go.',
  'books are a uniquely portable magic that can transport you anywhere in time and space.',
  'there is no friend as loyal as a book. books never judge and always welcome you back.',
  'a reader lives a thousand lives before dying. the one who never reads lives only one.',
  'reading is to the mind what exercise is to the body. keep your mind sharp and active.',
  'books are the training weights of the mind. they strengthen our thinking abilities.',
  'once you learn to read, you will be forever free. literacy opens doors to infinite worlds.',
  'a book is a dream that you hold in your hand. stories connect us across time and space.',
  'the person who does not read has no advantage over one who cannot read. knowledge is power.',

  // Music and art
  'music is the universal language of mankind. it speaks to the soul without words.',
  'where words fail, music speaks. melodies express what cannot be said in any language.',
  'music gives a soul to the universe, wings to the mind, flight to the imagination.',
  'art is not what you see, but what you make others see through your creative vision.',
  'every artist was first an amateur. mastery comes from years of dedicated practice.',
  'the earth without art is just eh. creativity makes life worth living.',
  'music is the soundtrack of your life. the right song can change everything instantly.',
  'art washes away from the soul the dust of everyday life. create beauty wherever you go.',

  // Friendship and relationships
  'a friend is someone who knows all about you and still loves you. true friendship is rare.',
  'friendship is born at that moment when one person says to another: what, you too?',
  'the only way to have a friend is to be one. give what you wish to receive.',
  'true friendship comes when the silence between two people is comfortable and peaceful.',
  'friends are the family we choose for ourselves. choose wisely and cherish deeply.',
  'a real friend walks in when the rest of the world walks out. loyalty defines friendship.',
  'friendship is not about whom you have known the longest but who came and never left.',
  'good friends are like stars. you do not always see them, but they are always there.',

  // Time and change
  'time is what we want most, but what we use worst. spend your moments wisely.',
  'yesterday is history, tomorrow is a mystery, today is a gift. that is why we call it the present.',
  'the two most powerful warriors are patience and time. nothing can withstand their force.',
  'time flies over us, but leaves its shadow behind. make memories worth remembering.',
  'lost time is never found again. value each moment as the precious gift it truly is.',
  'change is the law of life. those who look only to the past or present will miss the future.',
  'the only constant in life is change. embrace transformation and grow with it.',
  'time is free, but it is priceless. you cannot own it, but you can use it wisely.',

  // Dreams and goals
  'all our dreams can come true if we have the courage to pursue them with all our heart.',
  'a goal without a plan is just a wish. strategy transforms dreams into reality.',
  'dream big and dare to fail. great achievements require great risks and courage.',
  'the future belongs to those who prepare for it today. your actions now shape tomorrow.',
  'hold fast to dreams, for if dreams die, life is a broken winged bird that cannot fly.',
  'dreams are the touchstones of our character. they reveal who we truly aspire to become.',
  'never give up on a dream just because of the time it will take. the time will pass anyway.',
  'the biggest risk is not taking any risk. in a world that is changing, standing still is dangerous.',

  // Random interesting facts turned into sentences
  'honey never spoils. archaeologists have found three thousand year old honey in egyptian tombs.',
  'octopuses have three hearts and blue blood. they are among the most intelligent invertebrates.',
  'a group of flamingos is called a flamboyance. nature has a sense of humor in its naming.',
  'bananas are berries, but strawberries are not. botanical classification can be surprising.',
  'the shortest war in history lasted only thirty eight minutes between britain and zanzibar.',
  'a cloud can weigh more than a million pounds. water vapor is lighter than you think.',
  'sharks have been around longer than trees. they have survived for over four hundred million years.',
  'there are more possible chess games than atoms in the observable universe. strategy is infinite.',
  'venus is the only planet that spins clockwise. it also has the longest day of any planet.',
  'the human brain uses twenty percent of the body total energy. thinking is hard work.',

  // Typing and practice specific
  'practice makes perfect, but nobody is perfect, so why practice? because improvement matters.',
  'the best way to improve typing speed is consistent practice. type a little bit every day.',
  'accuracy is more important than speed when learning to type. speed comes naturally with time.',
  'keep your fingers on the home row keys and let muscle memory guide your movements.',
  'touch typing is a skill that will serve you well throughout your entire career.',
  'do not look at the keyboard. trust your fingers and keep your eyes on the screen.',
  'typing is like playing a musical instrument. practice builds speed and accuracy over time.',
  'the average person types between thirty and forty words per minute. you can do better.',
  'professional typists can reach speeds of over one hundred words per minute with high accuracy.',
  'ergonomic positioning reduces strain and helps maintain typing speed over long sessions.',
];

export const COUNTDOWN_SECONDS = 3;

export const KEYBOARD_LAYOUT = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  [' '],
];

export const SPECIAL_KEY_LABELS: Record<string, string> = {
  ' ': 'Space',
  '\\': '\\',
};

export const CAR_COLORS = [
  'hsl(210, 100%, 60%)', // Blue
  'hsl(0, 100%, 60%)', // Red
  'hsl(120, 100%, 40%)', // Green
  'hsl(45, 100%, 50%)', // Yellow
  'hsl(280, 100%, 60%)', // Purple
  'hsl(30, 100%, 50%)', // Orange
];
