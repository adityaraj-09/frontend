export const IDEA_TABS = [
  "All",
  "Viral Video Formats",
  "Video Special Effects",
  "Content Creation",
  "Branding & Design",
  "Image & Editing",
] as const;

export type IdeaTab = (typeof IDEA_TABS)[number];

export type Idea = {
  title: string;
  prompt: string;
  image: string;
  tab: Exclude<IdeaTab, "All">;
};

const img = (file: string) =>
  `https://g.tlcdn.com/preview-assets/image/galaxymainsiteexamples/explore_ideas/${file}?hsh=optimize`;
const thumb = (file: string) =>
  `https://g.tlcdn.com/original-assets/image/galaxymainsiteexamples/explore_ideas/thumbnails/${file}`;

export const IDEAS: Idea[] = [
  {
    title: "Hop Onto the 80s Trend",
    tab: "Image & Editing",
    image: img("image_1789196460286_Hop_Onto_the_80s_Trend.png"),
    prompt:
      "Recreate this as a cinematic 1980s nightclub portrait: velvet blazer, warm tungsten lamps, film grain, and a confident gaze.",
  },
  {
    title: "Travel Journal Poster",
    tab: "Branding & Design",
    image: img("image_1788627654563__Travel_Journal_Poster.png"),
    prompt:
      "Design a travel-journal poster of a cliffside tram over a Mediterranean town — clean typography, sun-washed palette, editorial layout.",
  },
  {
    title: "Create PPTs",
    tab: "Content Creation",
    image: thumb("video_1787662857905__Create_PPTs_thumbnail.jpg"),
    prompt:
      "Build a visually striking presentation with clean typography, curated color palettes, and layout choices that feel more mood board than boardroom.",
  },
  {
    title: "Generate a Music Track",
    tab: "Content Creation",
    image: thumb("video_1787662870588__Generate_a_Music_Track_thumbnail.jpg"),
    prompt: "Compose an original music track with a clear hook, verse/chorus structure, and a polished mix.",
  },
  {
    title: "Anatomy Archive Video",
    tab: "Video Special Effects",
    image: thumb("video_1787576495576__Anatomy_Archive_Video_thumbnail.jpg"),
    prompt: "Make an educational anatomy archive video with labeled overlays and a calm documentary voice.",
  },
  {
    title: "Rainbow Light Portrait",
    tab: "Image & Editing",
    image: img("image_1787572823122__Rainbow_Light_Portrait_.png"),
    prompt: "Create a portrait lit by prismatic rainbow caustics on the face and background.",
  },
  {
    title: "Giant in the Pool",
    tab: "Video Special Effects",
    image: thumb("video_1787572898606__Giant_in_the_Pool_thumbnail.jpg"),
    prompt: "A photoreal giant relaxing in a backyard pool, water displacement and scale tricks, cinematic camera.",
  },
  {
    title: "Miniature World Commercial",
    tab: "Video Special Effects",
    image: thumb("video_1787572931041_Miniature_World_Commercial_thumbnail.jpg"),
    prompt: "A miniature-world product commercial with tilt-shift, tiny sets, and playful camera moves.",
  },
  {
    title: "Collectible Stamp Sheet",
    tab: "Branding & Design",
    image: img("image_1787068819854__Collectible_Stamp_Sheet.png"),
    prompt: "Design a collectible postage-stamp sheet with a cohesive illustration system and perforation details.",
  },
  {
    title: "Giant Banner Reveal",
    tab: "Video Special Effects",
    image: thumb("video_1787068863416__Giant_Banner_Reveal_thumbnail.jpg"),
    prompt: "Film a giant banner reveal in a city square — scale, wind, and crowd reaction.",
  },
  {
    title: "Awakening Giant Cinematic Scene",
    tab: "Video Special Effects",
    image: thumb("video_1786521675167__Awakening_Giant_Cinematic_Scene_thumbnail.jpg"),
    prompt: "A cinematic scene of a stone giant awakening from a volcanic landscape, lava light and dust.",
  },
  {
    title: "Viral Food Trend",
    tab: "Viral Video Formats",
    image: thumb("video_1789045274650__Viral_Food_Trend__thumbnail.jpg"),
    prompt: "Shoot a viral food-trend video: satisfying close-ups, punchy cuts, trending audio energy.",
  },
  {
    title: "Pre-Wedding Shoot",
    tab: "Image & Editing",
    image: img("image_1788627690526__Pre-Wedding_Shoot.png"),
    prompt: "A romantic pre-wedding editorial: golden hour, filmic color, and posed-but-natural intimacy.",
  },
  {
    title: "Upscale Low-Quality Video",
    tab: "Video Special Effects",
    image: thumb("video_1787576473243__Upscale_Low-Quality_Video_thumbnail.jpg"),
    prompt: "Upscale and restore this low-quality video: sharpen faces, reduce noise, keep motion natural.",
  },
  {
    title: "Fashion Lookbook",
    tab: "Content Creation",
    image: thumb("video_1787576531164__Fashion_Lookbook_thumbnail.jpg"),
    prompt: "A fashion lookbook sequence with consistent lighting, outfit changes, and magazine pacing.",
  },
  {
    title: "Multi-Shot Product Commercial",
    tab: "Viral Video Formats",
    image: thumb("video_1787572876277__Multi-Shot_Product_Commercial_thumbnail.jpg"),
    prompt: "A multi-shot product commercial: hero angles, macro textures, and a clean end-card.",
  },
  {
    title: "Trending Birthday Video",
    tab: "Viral Video Formats",
    image: thumb("video_1787572898604__Trending_Birthday_Video_thumbnail.jpg"),
    prompt: "Make a trending birthday video with kinetic type, confetti, and a personal photo montage.",
  },
  {
    title: "Sticker Peel Illusion",
    tab: "Viral Video Formats",
    image: thumb("video_1787572968495__Sticker_Peel_Illusion_thumbnail.jpg"),
    prompt: "A sticker-peel illusion video — the scene peels away like vinyl to reveal another world.",
  },
  {
    title: "Swiss-Style City Poster",
    tab: "Branding & Design",
    image: img("image_1787068820420__Swiss-Style_City_Poster.png"),
    prompt: "A Swiss-style city poster: bold grid, limited palette, geometric landmarks, Helvetica-like type.",
  },
  {
    title: "Motion Clones",
    tab: "Viral Video Formats",
    image: thumb("video_1786626075078__Motion_Clones__thumbnail.jpg"),
    prompt: "A motion-clones video of the same person performing in sync across the frame.",
  },
  {
    title: "Boarding Pass to Paradise",
    tab: "Branding & Design",
    image: thumb("video_1788627654421__Boarding_Pass_to_Paradise_thumbnail.jpg"),
    prompt: "Design a boarding-pass-to-paradise campaign: ticket typography, tropical destination, travel-brand polish.",
  },
  {
    title: "Mini-Me Companion",
    tab: "Image & Editing",
    image: img("image_1788260454397_Mini-Me_Companion.png"),
    prompt: "Create a tiny mini-me companion version of the subject, photoreal, standing on a desk or shoulder.",
  },
  {
    title: "Global Pop Star Music Video",
    tab: "Viral Video Formats",
    image: thumb("video_1787576473690__Global_Pop_Star_Music_Video_thumbnail.jpg"),
    prompt: "A global pop-star music video: stadium lights, costume changes, and chorus-level spectacle.",
  },
  {
    title: "Beat-Sync Outfit Transition",
    tab: "Viral Video Formats",
    image: thumb("video_1787576502809__Beat-Sync_Outfit_Transition_thumbnail.jpg"),
    prompt: "Beat-synced outfit transitions on every downbeat, clean cuts, street fashion.",
  },
  {
    title: "Glass Jar Editorial Portrait",
    tab: "Image & Editing",
    image: thumb("video_1787572876713__Glass_Jar_Editorial_Portrait_thumbnail.jpg"),
    prompt: "An editorial portrait of a person posed inside a giant glass jar, studio lighting, fashion-magazine crop.",
  },
  {
    title: "Miniature Refrigerator Adventure",
    tab: "Video Special Effects",
    image: thumb("video_1787572931039__Miniature_Refrigerator_Adventure_thumbnail.jpg"),
    prompt: "A miniature adventure inside a refrigerator: tiny characters, giant food, playful lighting.",
  },
  {
    title: "Bond-Style Op-Art Title Sequence",
    tab: "Branding & Design",
    image: thumb("video_1787572956981__Bond-Style_Op-Art_Title_Sequence_thumbnail.jpg"),
    prompt: "A Bond-style op-art title sequence: silhouettes, gun-barrel, kinetic type, gold and black.",
  },
  {
    title: "Animated Storybook",
    tab: "Content Creation",
    image: thumb("video_1787068863255__Animated_Storybook__thumbnail.jpg"),
    prompt: "An animated storybook: painted pages that come alive as the camera pushes through each spread.",
  },
  {
    title: "Jello World ASMR",
    tab: "Video Special Effects",
    image: thumb("video_1787068904373__Jello_World_ASMR__thumbnail.jpg"),
    prompt: "ASMR in a world made of jello: wobbly architecture, satisfying cuts, close-mic foley.",
  },
  {
    title: "Street Art Illusion",
    tab: "Viral Video Formats",
    image: thumb("video_1786626074642__Street_Art_Illusion_thumbnail.jpg"),
    prompt: "A street-art illusion that looks 3D from one angle — pedestrians walking into a painted void.",
  },
];
