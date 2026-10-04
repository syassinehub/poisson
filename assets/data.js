// Données extraites de https://www.youtube.com/@karimaquariophilietn2039 (scrape du 04/10/2026)
const CHANNEL = {
  name: "Karim Aquariophilie TN",
  handle: "@karimaquariophilietn2039",
  url: "https://www.youtube.com/@karimaquariophilietn2039",
  subscribers: "71",
  videoCount: "23",
};

// cat: crevettes | poissons | escargots | plantes | nuisibles
const VIDEOS = [
  { id: "oqxI9kIU5RY", title: "La beauté de mon poisson Hara jerdoni / poisson-chat", views: "116", date: "il y a 3 ans", dur: "0:18", cat: "poissons" },
  { id: "ydY_JTFGxok", title: "Clea helena (escargots assassins) à l'attaque", views: "1 k", date: "il y a 5 ans", dur: "0:17", cat: "escargots" },
  { id: "XmkJa6_xMXU", title: "Ruby Red tunisiennes", views: "60", date: "il y a 5 ans", dur: "0:04", cat: "crevettes" },
  { id: "VlItt7yfQxc", title: "Aquascaping, poissons & crevettes", views: "221", date: "il y a 5 ans", dur: "0:22", cat: "plantes" },
  { id: "6fGn9fGL0Xc", title: "Reproduction crevettes japonica (crevette Amano)", views: "946", date: "il y a 6 ans", dur: "0:12", cat: "crevettes" },
  { id: "TYVXJ3NreY4", title: "Breeding Mikrogeophagus ramirezi", views: "138", date: "il y a 6 ans", dur: "0:25", cat: "poissons" },
  { id: "hPZOdsrZiac", title: "Reproduction japonica (crevette Amano)", views: "991", date: "il y a 7 ans", dur: "0:11", cat: "crevettes" },
  { id: "IHMUH2i2h-k", title: "Crevette Atya gabonensis (crevette filtrante)", views: "190", date: "il y a 8 ans", dur: "0:19", cat: "crevettes" },
  { id: "lihkVrCpbPY", title: "Plante gazonnante Monte Carlo – Aquascaping Tunisie", views: "978", date: "il y a 8 ans", dur: "0:12", cat: "plantes" },
  { id: "G9AOtkbo-Mk", title: "Les planaires immortelles", views: "458", date: "il y a 8 ans", dur: "0:59", cat: "nuisibles" },
  { id: "5APHMJ5RhV0", title: "Escargots assassins Anentome helena attaquent", views: "1,2 k", date: "il y a 8 ans", dur: "0:23", cat: "escargots" },
  // Shorts
  { id: "nSHG_CKl7uI", title: "Nourriture pour crevettes Red Cherry (orties)", views: "6,8 k", short: true, cat: "crevettes" },
  { id: "BKBzTW9KKvo", title: "Reproduction japonica (crevette d'Amano)", views: "2,5 k", short: true, cat: "crevettes" },
  { id: "nauNbMX4mzI", title: "Nourriture pour crevettes Red Cherry", views: "2 k", short: true, cat: "crevettes" },
  { id: "XJolXxbqQ44", title: "Alevins Corydoras panda", views: "376", short: true, cat: "poissons" },
  { id: "bep0JZq-rgE", title: "Reproduction des crevettes japonica J+2", views: "338", short: true, cat: "crevettes" },
  { id: "KTmqWk5O3sI", title: "Zoés japonica en eau salée depuis 3 jours", views: "276", short: true, cat: "crevettes" },
  { id: "5tnM9PvwnXE", title: "Ma belle crevette Blue Velvet", views: "259", short: true, cat: "crevettes" },
  { id: "tpQz642n2WM", title: "Red Cherry au repas", views: "251", short: true, cat: "crevettes" },
  { id: "yJ9bL8YLOdg", title: "Crevettes japonica (multidentata)", views: "213", short: true, cat: "crevettes" },
  { id: "JHXV8Qewlow", title: "Crevettes, poissons & escargots", views: "174", short: true, cat: "crevettes" },
  { id: "zLpjWRBGHGU", title: "Crevettes japonica (multidentata) – suite", views: "107", short: true, cat: "crevettes" },
  { id: "o_Ov8P1nJSg", title: "Parade Blue Velvet : 4 mâles et 1 femelle", views: "41", short: true, cat: "crevettes" },
];

const CATEGORIES = {
  crevettes: "Crevettes",
  poissons: "Poissons",
  escargots: "Escargots",
  plantes: "Plantes & aquascaping",
  nuisibles: "Nuisibles",
};

// Articles de blog, rédigés à partir des thèmes de la chaîne.
// body : HTML simple. videos : ids YouTube intégrés dans l'article.
const ARTICLES = [
  {
    slug: "reproduction-crevette-amano",
    title: "Réussir la reproduction de la crevette Amano à la maison",
    cat: "crevettes",
    date: "2026-09-20",
    read: 7,
    cover: "BKBzTW9KKvo",
    excerpt: "Larves en eau salée, zoés minuscules, métamorphose : le défi le plus excitant de l'aquariophilie crevette, étape par étape.",
    videos: ["BKBzTW9KKvo", "KTmqWk5O3sI", "bep0JZq-rgE", "hPZOdsrZiac"],
    body: `
      <p>La crevette Amano (<em>Caridina multidentata</em>, longtemps appelée <em>japonica</em>) est la reine des nettoyeuses d'algues. Elle pond sans problème en aquarium… mais ses larves ne survivent pas en eau douce. C'est ce qui rend sa reproduction si particulière.</p>
      <h2>1. Repérer une femelle grainée</h2>
      <p>La femelle porte ses œufs sous l'abdomen pendant 4 à 6 semaines. Quand ils deviennent gris-argenté et qu'on distingue de petits yeux, l'éclosion approche.</p>
      <h2>2. Isoler la femelle</h2>
      <p>Placez-la dans un petit bac d'eau douce (même eau que l'aquarium) avec un bulleur doux. Les larves (zoés) éclosent souvent la nuit et nagent vers la lumière : récupérez-les avec une lampe et une pipette.</p>
      <h2>3. Passer les zoés en eau salée</h2>
      <p>Dans la nature, les larves dévalent les rivières jusqu'à la mer. Transférez-les dans une eau saumâtre à salée (environ 30 à 35 g de sel marin par litre). Comme on le voit dans la vidéo « J+3 en eau salée », les zoés restent alors actives.</p>
      <h2>4. Nourrir les larves</h2>
      <p>Phytoplancton vivant, eau verte ou spiruline très finement diluée. Petites doses, souvent. La qualité de l'eau est le facteur n°1 de réussite.</p>
      <h2>5. La métamorphose et le retour en eau douce</h2>
      <p>Après 3 à 5 semaines, les larves se transforment en mini-crevettes qui se posent au fond. Réduisez alors progressivement la salinité sur plusieurs jours avant de les transférer dans l'aquarium.</p>
      <div class="tip"><strong>Astuce de Karim :</strong> notez chaque jour la date, la salinité et le comportement des zoés. C'est le meilleur moyen de comprendre ce qui marche dans <em>votre</em> installation.</div>
    `,
  },
  {
    slug: "orties-nourriture-red-cherry",
    title: "Les orties : la nourriture maison préférée des Red Cherry",
    cat: "crevettes",
    date: "2026-09-05",
    read: 4,
    cover: "nSHG_CKl7uI",
    excerpt: "Une plante gratuite, riche en minéraux, que les crevettes adorent. La vidéo la plus vue de la chaîne explique pourquoi.",
    videos: ["nSHG_CKl7uI", "nauNbMX4mzI"],
    body: `
      <p>Avec plus de 6 800 vues, c'est la vidéo star de la chaîne : des Red Cherry (<em>Neocaridina davidi</em>) qui se jettent sur une feuille d'ortie. Et ce n'est pas un hasard.</p>
      <h2>Pourquoi l'ortie ?</h2>
      <ul>
        <li>Riche en calcium et en minéraux, utiles à la mue.</li>
        <li>Se décompose lentement : elle nourrit aussi le biofilm.</li>
        <li>Gratuite, à cueillir loin des routes et des champs traités.</li>
      </ul>
      <h2>Préparation</h2>
      <ol>
        <li>Cueillir de jeunes feuilles (avec des gants !).</li>
        <li>Rincer, puis faire sécher à l'air ou blanchir 1 à 2 minutes dans l'eau bouillante.</li>
        <li>Donner une à deux feuilles, retirer les restes après 24 à 48 h.</li>
      </ol>
      <div class="tip"><strong>À retenir :</strong> une crevette bien nourrie se reproduit mieux. Variez avec feuilles de mûrier, d'amandier indien et un peu de nourriture sèche.</div>
    `,
  },
  {
    slug: "escargot-assassin-clea-helena",
    title: "Clea helena, l'escargot assassin qui nettoie votre bac",
    cat: "escargots",
    date: "2026-08-22",
    read: 5,
    cover: "5APHMJ5RhV0",
    excerpt: "Une solution naturelle contre l'invasion d'escargots indésirables. Mais attention à qui il partage l'aquarium.",
    videos: ["5APHMJ5RhV0", "ydY_JTFGxok"],
    body: `
      <p><em>Anentome helena</em> (ou <em>Clea helena</em>) est un petit escargot rayé jaune et brun, originaire d'Asie du Sud-Est. Son régime : les autres escargots.</p>
      <h2>Un prédateur efficace</h2>
      <p>Il repère sa proie, s'y accroche et insère sa trompe dans la coquille. Planorbes, physes et mélanoïdes disparaissent peu à peu. Les vidéos de la chaîne montrent bien l'attaque.</p>
      <h2>Maintenance</h2>
      <ul>
        <li>Température : 22 à 28 °C.</li>
        <li>Eau plutôt dure (bonne pour la coquille).</li>
        <li>Sol de sable : il aime s'enfouir.</li>
      </ul>
      <h2>Reproduction lente, c'est un avantage</h2>
      <p>Il pond des œufs isolés dans de petites capsules. Sa population reste maîtrisée : pas de nouvelle invasion.</p>
      <div class="tip"><strong>Attention :</strong> il peut s'attaquer aux escargots que vous voulez garder (néritines, ampullaires jeunes). Les crevettes adultes ne craignent en général rien.</div>
    `,
  },
  {
    slug: "planaires-aquarium",
    title: "Planaires : les vers « immortels » de l'aquarium",
    cat: "nuisibles",
    date: "2026-08-08",
    read: 5,
    cover: "G9AOtkbo-Mk",
    excerpt: "Coupés en morceaux, ils repoussent. Comment les reconnaître, pourquoi ils apparaissent et comment s'en débarrasser.",
    videos: ["G9AOtkbo-Mk"],
    body: `
      <p>Les planaires sont de petits vers plats, blancs ou bruns, avec une tête triangulaire. Leur particularité : une capacité de régénération spectaculaire. Un fragment suffit à reformer un ver complet.</p>
      <h2>Pourquoi ils apparaissent</h2>
      <p>Presque toujours à cause d'un excès de nourriture. Ils arrivent avec les plantes ou le sol, puis prolifèrent quand les restes s'accumulent.</p>
      <h2>Pourquoi c'est un problème</h2>
      <p>Dans un bac à crevettes, ils peuvent s'attaquer aux œufs, aux jeunes et aux crevettes en mue.</p>
      <h2>Solutions</h2>
      <ol>
        <li>Réduire la nourriture et siphonner le sol.</li>
        <li>Piège à planaires appâté la nuit.</li>
        <li>Traitement spécifique en dernier recours. Vérifiez toujours sa compatibilité avec les crevettes et les escargots : certains produits les tuent.</li>
      </ol>
    `,
  },
  {
    slug: "monte-carlo-tapis-vert",
    title: "Monte Carlo : réussir un tapis vert en aquascaping",
    cat: "plantes",
    date: "2026-07-25",
    read: 6,
    cover: "lihkVrCpbPY",
    excerpt: "La plante gazonnante idéale pour débuter un aquascape. Lumière, CO2 et plantation, nos conseils depuis la Tunisie.",
    videos: ["lihkVrCpbPY", "VlItt7yfQxc"],
    body: `
      <p><em>Micranthemum tweediei</em> « Monte Carlo » forme un tapis dense de petites feuilles rondes. Elle est plus tolérante que la célèbre <em>Hemianthus callitrichoides</em> « Cuba ».</p>
      <h2>Les conditions</h2>
      <ul>
        <li><strong>Lumière :</strong> moyenne à forte, 8 heures par jour.</li>
        <li><strong>CO2 :</strong> fortement conseillé pour un tapis rapide et serré.</li>
        <li><strong>Sol :</strong> substrat nutritif (soil).</li>
      </ul>
      <h2>Plantation</h2>
      <p>Divisez les pots en petites touffes de la taille d'une pièce de monnaie. Plantez-les à 2 ou 3 cm d'écart avec une pince. Démarrez souvent en mode « dry start » (sol humide, bac fermé, sans eau) pendant 3 à 4 semaines pour un enracinement solide.</p>
      <h2>Entretien</h2>
      <p>Taillez régulièrement à ras pour éviter que le tapis se décolle du sol.</p>
    `,
  },
  {
    slug: "reproduction-ramirezi",
    title: "Reproduction du Ramirezi : un couple de cichlidés nains",
    cat: "poissons",
    date: "2026-07-10",
    read: 5,
    cover: "TYVXJ3NreY4",
    excerpt: "Mikrogeophagus ramirezi, petit cichlidé coloré, protège ses œufs avec soin. Les clés pour réussir.",
    videos: ["TYVXJ3NreY4"],
    body: `
      <p>Le Ramirezi (<em>Mikrogeophagus ramirezi</em>) vient des llanos du Venezuela et de Colombie. C'est l'un des plus beaux cichlidés nains.</p>
      <h2>L'eau idéale</h2>
      <ul>
        <li>Température : 27 à 30 °C.</li>
        <li>Eau douce et acide (pH 5,5 à 7).</li>
        <li>Eau très propre : changements d'eau réguliers.</li>
      </ul>
      <h2>La ponte</h2>
      <p>Le couple nettoie une pierre plate ou une feuille, puis la femelle y dépose 100 à 300 œufs. Les deux parents ventilent et défendent la ponte. Les œufs éclosent en 2 à 3 jours, et les alevins nagent librement 4 à 5 jours plus tard.</p>
      <h2>Nourrir les alevins</h2>
      <p>Infusoires puis nauplies d'artémia. Petits repas fréquents, eau impeccable.</p>
    `,
  },
  {
    slug: "atya-gabonensis-crevette-filtrante",
    title: "Atya gabonensis, la crevette filtrante géante",
    cat: "crevettes",
    date: "2026-06-28",
    read: 4,
    cover: "IHMUH2i2h-k",
    excerpt: "Elle ne mange pas avec ses pinces mais avec des éventails. Portrait d'une crevette paisible et impressionnante.",
    videos: ["IHMUH2i2h-k"],
    body: `
      <p>Originaire d'Afrique de l'Ouest et d'Amérique du Sud, <em>Atya gabonensis</em> peut atteindre 10 à 15 cm. Malgré sa taille, elle est totalement pacifique.</p>
      <h2>Une crevette filtrante</h2>
      <p>À la place des pinces, elle a des éventails qu'elle ouvre dans le courant pour capter les particules en suspension.</p>
      <h2>Conseils</h2>
      <ul>
        <li>Prévoir un courant (sortie de filtre, pompe) où elle se postera.</li>
        <li>Si elle « balaie » le sol, c'est qu'elle a faim : ajoutez de la poudre de nourriture dans le courant.</li>
        <li>Cachettes indispensables pour la mue.</li>
      </ul>
    `,
  },
  {
    slug: "blue-velvet-parade",
    title: "Blue Velvet : comprendre la « parade » des crevettes",
    cat: "crevettes",
    date: "2026-06-12",
    read: 3,
    cover: "5tnM9PvwnXE",
    excerpt: "Quand les mâles nagent dans tous les sens, ce n'est pas un problème : c'est l'accouplement.",
    videos: ["5tnM9PvwnXE", "o_Ov8P1nJSg"],
    body: `
      <p>La Blue Velvet est une variété bleue de <em>Neocaridina davidi</em>, aussi facile que la Red Cherry.</p>
      <h2>La parade</h2>
      <p>Juste après la mue, la femelle libère des phéromones. Les mâles nagent alors frénétiquement dans tout le bac à sa recherche. Dans la vidéo, 4 mâles poursuivent 1 seule femelle !</p>
      <h2>Et ensuite ?</h2>
      <p>Quelques jours plus tard, la femelle est grainée. Environ 3 à 4 semaines après, des crevettes miniatures apparaissent, sans phase larvaire.</p>
      <div class="tip"><strong>Bon à savoir :</strong> ne mélangez pas les couleurs de Neocaridina si vous voulez garder une lignée bleue. Les croisements reviennent vers une couleur brune.</div>
    `,
  },
];
