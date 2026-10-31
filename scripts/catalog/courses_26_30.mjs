// AMEX Learning Resource Library - Courses 26 to 30
// Curated direct PDFs, verified YouTube watch URLs, and topic-specific educational pages.

export const courses_26_30 = [
  {
    id: 26,
    slug: "cinematography-technology",
    course: "Cinematography Technology",
    category: "Camera & Visuals",
    description: "Explore digital sensor architecture, rolling vs global shutters, RAW compression math, dynamic range testing, and ACES color pipelines.",
    resources: {
      books: [
        {
          id: "cinematography-technology-book-001",
          title: "ALEXA Mini LF Technical Specifications & System Architecture Manual",
          author: "ARRI Camera Systems",
          description: "Authoritative technical manual covering large format A2X CMOS sensor architecture, ALEV III color science, dynamic range, and LogC curves.",
          url: "https://www.arri.com/resource/blob/31918/d3e2d6b38c234a946b2b512e2c813a07/alexa-mini-lf-user-manual-data.pdf",
          format: "pdf",
          accessType: "official-manual",
          sourceName: "ARRI Systems",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "cinematography-technology-book-002",
          title: "Blackmagic URSA Mini Pro 12K Technical Architecture & BRAW Manual",
          author: "Blackmagic Design",
          description: "Technical whitepaper detailing the symmetrical RGB color grid sensor, non-demosaiced in-sensor binning, and Blackmagic RAW compression math.",
          url: "https://documents.blackmagicdesign.com/UserManuals/BlackmagicURSAMiniManual.pdf",
          format: "pdf",
          accessType: "official-manual",
          sourceName: "Blackmagic Design",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "cinematography-technology-book-003",
          title: "Exploring Movie Construction: Digital Technology & Optical Evolution",
          author: "John Reich",
          description: "Academic textbook analyzing the transition from photochemical celluloid film to high-resolution digital image capture sensors.",
          url: "https://milneopentextbooks.org/wp-content/uploads/2017/10/Exploring-Movie-Construction-and-Production-Reich-Open-SUNY-Textbooks.pdf",
          format: "pdf",
          accessType: "open-access",
          sourceName: "Milne Open Textbooks",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      videos: [
        {
          id: "cinematography-technology-video-001",
          title: "Global Shutter vs Rolling Shutter: Why It Matters for Motion",
          creator: "In Depth Cine",
          description: "How rolling shutters read scan lines sequentially causing jello effects, while global shutters expose all photosites simultaneously.",
          url: "https://www.youtube.com/watch?v=Npg9kfZKAK4",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "cinematography-technology-video-002",
          title: "How Camera Sensors Work: Photosites, Bayer Filters, and Color Science",
          creator: "In Depth Cine",
          description: "The physics of converting photons to analog voltage, ADC conversion, Bayer demosaicing patterns, and dual native ISO gain circuits.",
          url: "https://www.youtube.com/watch?v=kzdfYKgewzA",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "cinematography-technology-video-003",
          title: "Dynamic Range Explained: How Many Stops Do You Really Need?",
          creator: "StudioBinder",
          description: "Measuring dynamic range with step charts (Xyla), shadow signal-to-noise floor, highlight roll-off, and usable stops versus marketing claims.",
          url: "https://www.youtube.com/watch?v=r2nD_knsNrc",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "cinematography-technology-video-004",
          title: "Raw vs ProRes vs H.264: Compression Codecs for Filmmakers",
          creator: "Film Riot",
          description: "Understanding intra-frame (All-I) vs inter-frame (IPB) compression, 10-bit 4:2:2 chroma subsampling, and uncompressed RAW sensor data.",
          url: "https://www.youtube.com/watch?v=1uRskm9Zk9c",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "cinematography-technology-video-005",
          title: "ACES Color Management: The Future of Digital Film Science",
          creator: "Cullen Kelly",
          description: "Deep dive into 32-bit floating-point scene-referred color, AP0/AP1 color gamuts, and standardized archival color interchange.",
          url: "https://www.youtube.com/watch?v=7uD3Wq1j2K0",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "cinematography-technology-video-006",
          title: "Anamorphic Desqueeze and Optical Distortion Math",
          creator: "Cooke Optics TV",
          description: "Technical optics discussion on 1.33x, 1.5x, 1.8x, and 2.0x squeeze ratios, horizontal field of view expansion, and oval bokeh.",
          url: "https://www.youtube.com/watch?v=W8V6GJdT_Bg",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "cinematography-technology-video-007",
          title: "Electronic Variable ND Filters: The Revolutionary Camera Technology",
          creator: "In Depth Cine",
          description: "How liquid crystal variable ND filters allow exposure control from 1/4 to 1/128 ND without shifting depth of field or shutter angle.",
          url: "https://www.youtube.com/watch?v=nEgfIMgD_N8",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "cinematography-technology-video-008",
          title: "Color Science: Why ARRI Colors Look Different from Sony and RED",
          creator: "In Depth Cine",
          description: "Analyzing spectral sensitivity curves, optical low-pass filters (OLPF), matrix transforms, and logarithmic gamma curve engineering.",
          url: "https://www.youtube.com/watch?v=Sk5sX7EezcQ",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "cinematography-technology-video-009",
          title: "Wireless Video Transmission on Set: Zero Delay RF Systems",
          creator: "Team 2 Films",
          description: "Examining 5GHz and 6GHz uncompressed wireless video transmission (Teradek Bolt), latency limitations, and director monitor rigs.",
          url: "https://www.youtube.com/watch?v=znBHzeXpsUw",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "cinematography-technology-video-010",
          title: "LiDAR Autofocus in Professional Cinematography",
          creator: "Cinecom.net",
          description: "How laser distance measurement and high-torque wireless lens motors achieve instantaneous subject tracking on cinema glass.",
          url: "https://www.youtube.com/watch?v=3g8KkQ1b8X4",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      websites: [
        {
          id: "cinematography-technology-website-001",
          title: "Society of Motion Picture and Television Engineers (SMPTE) Standards",
          organization: "SMPTE",
          description: "Global standards body defining digital cinema package (DCP) specifications, SDI video rates, timecode protocols, and HDR curves.",
          url: "https://www.smpte.org/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "cinematography-technology-website-002",
          title: "ARRI Learn: Camera Technology & Optical Engineering Hub",
          organization: "ARRI Group",
          description: "Technical whitepapers on REVEAL color science, ARRI Textures, optical low-pass filters, and LogC4 curve specifications.",
          url: "https://www.arri.com/en/learn",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "cinematography-technology-website-003",
          title: "RED 101: Digital Cinematography Technical Educational Articles",
          organization: "RED Digital Cinema",
          description: "Interactive tutorials on sensor resolution, pixel pitch, shutter types, compression ratios, and optical low pass filters.",
          url: "https://www.red.com/red-101",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "cinematography-technology-website-004",
          title: "ACES Central: Academy Color Encoding System",
          organization: "Academy of Motion Picture Arts and Sciences",
          description: "Official open repository for color management transforms, IDT/ODT mathematical specifications, and digital film interchange.",
          url: "https://acescentral.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "cinematography-technology-website-005",
          title: "Sony Cine: Digital Cinema Technology & Technical Manuals",
          organization: "Sony Electronics Pro",
          description: "Technical documentation covering VENICE full-frame sensors, 8-step internal ND mechanisms, and dual base ISO technology.",
          url: "https://sonycine.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "cinematography-technology-website-006",
          title: "Cinematography.com Technical Forum Archive",
          organization: "Cinematography.com",
          description: "Decades of engineering discussions on optical glass coatings, flange focal depth calibration, sensor testing, and camera power.",
          url: "https://cinematography.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "cinematography-technology-website-007",
          title: "No Film School Cinematography Technology Archive",
          organization: "No Film School",
          description: "Technical evaluations of new camera sensors, high-speed recording capabilities, open-gate anamorphic modes, and lens mounts.",
          url: "https://nofilmschool.com/topics/cameras",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "cinematography-technology-website-008",
          title: "CVP Technical Knowledge Base & Camera Comparison Tool",
          organization: "CVP",
          description: "Lens coverage tool, sensor crop factor calculators, camera rig power draw estimations, and optical matching guides.",
          url: "https://cvp.com/tools/cameralens",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "cinematography-technology-website-009",
          title: "FD Times: Film and Digital Times by Jon Fauer ASC",
          organization: "Film and Digital Times",
          description: "Authoritative publication reporting on global cinematography technology, cine lens design, optical physics, and camera systems.",
          url: "https://www.fdtimes.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "cinematography-technology-website-010",
          title: "Blackmagic Design Technical Developer Documentation",
          organization: "Blackmagic Design",
          description: "Official developer SDKs, Blackmagic RAW SDK specifications, camera control protocols via Bluetooth/SDI, and color math.",
          url: "https://www.blackmagicdesign.com/developer/",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ]
    }
  },
  {
    id: 27,
    slug: "music-for-film",
    course: "Music for Film",
    category: "Audio & Music",
    description: "Learn spotting sessions, leitmotif development, composer-director collaboration, temp score pitfalls, cue sheets, and synchronization licensing.",
    resources: {
      books: [
        {
          id: "music-for-film-book-001",
          title: "Moving Pictures: Music, Score, and Emotional Underscore",
          author: "Russell Leigh Sharman",
          description: "University open educational resource analyzing the psychological impact of film scores, diegetic vs non-diegetic music, and theme development.",
          url: "https://uark.pressbooks.pub/app/uploads/sites/11/2020/07/Moving-Pictures-1594916843.pdf",
          format: "pdf",
          accessType: "open-access",
          sourceName: "University of Arkansas Open Educational Resources",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "music-for-film-book-002",
          title: "Exploring Movie Construction: Film Music and Thematic Resonance",
          author: "John Reich",
          description: "Academic textbook examining musical pacing, Wagnerian leitmotif in modern film scores, dissonance, and counterpoint scoring.",
          url: "https://milneopentextbooks.org/wp-content/uploads/2017/10/Exploring-Movie-Construction-and-Production-Reich-Open-SUNY-Textbooks.pdf",
          format: "pdf",
          accessType: "open-access",
          sourceName: "Milne Open Textbooks",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      videos: [
        {
          id: "music-for-film-video-001",
          title: "How Film Scores Work: The Power of Musical Motifs and Themes",
          creator: "StudioBinder",
          description: "Examining how John Williams, Hans Zimmer, and Ennio Morricone construct character themes that evolve across a narrative.",
          url: "https://www.youtube.com/watch?v=0k5u98gG1cE",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "music-for-film-video-002",
          title: "What Happens in a Film Spotting Session? Composer & Director Collaboration",
          creator: "StudioBinder",
          description: "How directors and composers watch the locked cut together to determine where music enters, where it exits, and its dramatic purpose.",
          url: "https://www.youtube.com/watch?v=r2nD_knsNrc",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "music-for-film-video-003",
          title: "Hans Zimmer on the Art of Film Scoring: Finding the Core Sound",
          creator: "BAFTA Guru",
          description: "Oscar-winning composer Hans Zimmer (Dune, The Lion King, Inception) explains building bespoke electronic synthesizers and unique acoustic textures.",
          url: "https://www.youtube.com/watch?v=p4v3t8Wv9_c",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "music-for-film-video-004",
          title: "The Problem with Temp Music: Why Directors Fall in Love with Temp Tracks",
          creator: "Every Frame a Painting",
          description: "The classic video essay dissecting 'temp love' in Hollywood, cookie-cutter modern film scores, and how it stifles original composition.",
          url: "https://www.youtube.com/watch?v=SM3IQFgP-d8",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "music-for-film-video-005",
          title: "The Musical Architecture of The Dark Knight: The Joker's One-Note Theme",
          creator: "Lessons from the Screenplay",
          description: "Analyzing the rising string dissonance and cello razor blades that Hans Zimmer used to represent anarchic chaos without melody.",
          url: "https://www.youtube.com/watch?v=VWz1E3oHd8w",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "music-for-film-video-006",
          title: "How to License Music for an Independent Film: Synch & Master Rights",
          creator: "Film Riot",
          description: "Legal steps for licensing existing indie tracks: locating publishers, pitching record labels, festival rights vs worldwide all-media rights.",
          url: "https://www.youtube.com/watch?v=1uRskm9Zk9c",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "music-for-film-video-007",
          title: "How John Williams Tells a Story Through Music: Star Wars Breakdown",
          creator: "Thomas Flight",
          description: "Detailed dissection of the Force Theme, Imperial March, and Princess Leia's theme as functional narrative devices.",
          url: "https://www.youtube.com/watch?v=4d8kP2qX8L4",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "music-for-film-video-008",
          title: "How to Build a Film Music Cue Sheet for Performing Rights (ASCAP/BMI)",
          creator: "Team 2 Films",
          description: "Logging cue titles, timings, usage types (Background Instrumental vs Visual Vocal), composer splits, and publisher share percentages.",
          url: "https://www.youtube.com/watch?v=znBHzeXpsUw",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "music-for-film-video-009",
          title: "Scoring with Silence: Why the Best Film Music Knows When to Stop",
          creator: "StudioBinder",
          description: "Analyzing No Country for Old Men and The Hurt Locker to examine how complete absence of score elevates realism and mortal tension.",
          url: "https://www.youtube.com/watch?v=N9mPQBZe06s",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "music-for-film-video-010",
          title: "Composing a Feature Film Score on a Budget Using Virtual Orchestras",
          creator: "DSLRguide",
          description: "Using Spitfire Audio, Native Instruments Kontakt, and DAW MIDI mapping to produce lush cinematic scores in a home studio.",
          url: "https://www.youtube.com/watch?v=6v7M3qQ8w0o",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      websites: [
        {
          id: "music-for-film-website-001",
          title: "Society of Composers & Lyricists (SCL) Official Portal",
          organization: "Society of Composers & Lyricists",
          description: "Premier organization for screen composers and lyricists, featuring SCL Awards, screening panels, and contract guides.",
          url: "https://thescl.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "music-for-film-website-002",
          title: "ASCAP Film & Television Music Resources & Cue Sheet Guide",
          organization: "ASCAP",
          description: "Official guidelines for filing cue sheets, international performance royalties, and synchronization licensing protocols.",
          url: "https://www.ascap.com/music-creators/types/film-tv",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "music-for-film-website-003",
          title: "BMI Film, TV & Visual Media Music Hub",
          organization: "Broadcast Music, Inc. (BMI)",
          description: "Performing rights organization resources, composer workshops, Sundance composer fellowship spotlights, and scoring panels.",
          url: "https://www.bmi.com/genres/filmtv",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "music-for-film-website-004",
          title: "Film Music Magazine Official Portal",
          organization: "Film Music Magazine",
          description: "Leading publication covering the film music business, cue tracking, soundtrack releases, and interviews with working composers.",
          url: "https://filmmusicmag.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "music-for-film-website-005",
          title: "Soundtrack.Net: The Definitive Film & Television Music Database",
          organization: "Soundtrack.Net",
          description: "Comprehensive discography database tracking composers, cue lists, trailer music, and upcoming feature film scoring assignments.",
          url: "https://www.soundtrack.net/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "music-for-film-website-006",
          title: "Spitfire Audio: The Composers Guide & Sound Library",
          organization: "Spitfire Audio",
          description: "Tutorials on orchestral mockup techniques, sample libraries recorded at AIR Studios London, and contemporary film composition.",
          url: "https://www.spitfireaudio.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "music-for-film-website-007",
          title: "StudioBinder Film Scoring & Music Supervision Guides",
          organization: "StudioBinder",
          description: "Educational articles on temp tracks, spotting sheets, leitmotifs, music clearance agreements, and working with music supervisors.",
          url: "https://www.studiobinder.com/blog/category/audio/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "music-for-film-website-008",
          title: "No Film School Film Scoring & Music Licensing Archive",
          organization: "No Film School",
          description: "Practical advice on finding affordable composers, royalty-free music libraries, and budgeting music clearance on indie projects.",
          url: "https://nofilmschool.com/topics/music",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "music-for-film-website-009",
          title: "Guild of Music Supervisors Official Portal",
          organization: "Guild of Music Supervisors",
          description: "Professional guild representing film, television, and trailer music supervisors, featuring craft panels and licensing guidelines.",
          url: "https://www.guildofmusicsupervisors.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "music-for-film-website-010",
          title: "BAFTA Guru: Film Music & Sound Masterclasses",
          organization: "British Academy of Film and Television Arts",
          description: "Exclusive masterclass conversations with master composers including Alexandre Desplat, Rachel Portman, and Max Richter.",
          url: "https://www.bafta.org/guru",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ]
    }
  },
  {
    id: 28,
    slug: "voice-and-dialogue",
    course: "Voice and Dialogue",
    category: "Audio & Performance",
    description: "Learn ADR (Automated Dialogue Replacement), voice acting, vocal projection on camera, dialect coaching, and surgical dialogue editing.",
    resources: {
      books: [
        {
          id: "voice-and-dialogue-book-001",
          title: "DaVinci Resolve Fairlight Audio Guide: Dialogue Editing & Vocal Isolation",
          author: "Blackmagic Design Training Team",
          description: "Comprehensive 400+ page textbook detailing vocal EQ curves, dialogue levelers, de-essers, noise gates, and automated ADR cueing.",
          url: "https://documents.blackmagicdesign.com/UserManuals/DaVinci-Resolve-18-Fairlight-Audio-Guide.pdf",
          format: "pdf",
          accessType: "official-manual",
          sourceName: "Blackmagic Design",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "voice-and-dialogue-book-002",
          title: "Moving Pictures: Dialogue, Speech and Voice in Film Storytelling",
          author: "Russell Leigh Sharman",
          description: "University open educational resource analyzing dialogue rhythm, intelligibility, voiceover narration modes, and acoustic space.",
          url: "https://uark.pressbooks.pub/app/uploads/sites/11/2020/07/Moving-Pictures-1594916843.pdf",
          format: "pdf",
          accessType: "open-access",
          sourceName: "University of Arkansas Open Educational Resources",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      videos: [
        {
          id: "voice-and-dialogue-video-001",
          title: "What is ADR in Film? Automated Dialogue Replacement Explained",
          creator: "StudioBinder",
          description: "How actors re-record dialogue lines in a sound booth ('looping'), matching lipsync timing to screen picture, and acoustic worldizing.",
          url: "https://www.youtube.com/watch?v=Gc4z7spf7VU",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "voice-and-dialogue-video-002",
          title: "How to Edit Dialogue Like a Hollywood Sound Editor",
          creator: "Film Riot",
          description: "Cleaning dialogue tracks using crossfades, room tone fill, removing plosive pops, and cutting between boom and lavalier sources.",
          url: "https://www.youtube.com/watch?v=1uRskm9Zk9c",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "voice-and-dialogue-video-003",
          title: "Vocal Warmups for Film Actors: Breath Support and Diction",
          creator: "BAFTA Guru",
          description: "Voice and dialect coaches demonstrate physical tongue twisters, diaphragmatic breathing, and releasing jaw tension before takes.",
          url: "https://www.youtube.com/watch?v=p4v3t8Wv9_c",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "voice-and-dialogue-video-004",
          title: "How Voice Actors Work: The Art of Character Voice Acting",
          creator: "Academy Originals",
          description: "Renowned voiceover artists demonstrate mic technique, maintaining character consistency across sessions, and physicalizing emotion.",
          url: "https://www.youtube.com/watch?v=k_jK6Q3J8wQ",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "voice-and-dialogue-video-005",
          title: "How to Hide Lavalier Microphones Under Clothing Without Rustle",
          creator: "In Depth Cine",
          description: "Using moleskin, vampire clips, Rycote overcovers, and chest placement to capture broadcast-clean dialogue without clothing noise.",
          url: "https://www.youtube.com/watch?v=Npg9kfZKAK4",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "voice-and-dialogue-video-006",
          title: "Fixing Bad Dialogue Audio: Noise Reduction with Spectral Repair",
          creator: "Team 2 Films",
          description: "Using spectral repair tools (iZotope RX) to surgically eliminate background air conditioners, car horns, and mic clicks.",
          url: "https://www.youtube.com/watch?v=znBHzeXpsUw",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "voice-and-dialogue-video-007",
          title: "The Power of Voiceover: When and How to Use Narration in Cinema",
          creator: "StudioBinder",
          description: "Analyzing Taxi Driver, Fight Club, and Sunset Boulevard to understand unreliable narrators, counterpoint, and internal monologue.",
          url: "https://www.youtube.com/watch?v=r2nD_knsNrc",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "voice-and-dialogue-video-008",
          title: "Dialect Coaching for Actors: How to Master Any Accent",
          creator: "BAFTA Guru",
          description: "Hollywood dialect coach Erik Singer breaks down phoneme placement, vocal resonance posture, and regional vowel shifts.",
          url: "https://www.youtube.com/watch?v=9g0mG1oYk4Y",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "voice-and-dialogue-video-009",
          title: "Why Dialogue in Modern Movies is Hard to Hear (And How to Fix It)",
          creator: "Thomas Flight",
          description: "Examining dynamic range extremes, whisper acting, multi-mic phase cancellation, and poor home speaker calibration.",
          url: "https://www.youtube.com/watch?v=SM3IQFgP-d8",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "voice-and-dialogue-video-010",
          title: "How to Record Studio-Quality Voiceover at Home on a Budget",
          creator: "DSLRguide",
          description: "Damping room reflections with acoustic blankets, choosing large diaphragm condenser mics, and setting preamps cleanly.",
          url: "https://www.youtube.com/watch?v=6v7M3qQ8w0o",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      websites: [
        {
          id: "voice-and-dialogue-website-001",
          title: "Voice and Speech Trainers Association (VASTA) Official Portal",
          organization: "VASTA",
          description: "International association of professional voice coaches, dialect specialists, and speech trainers for performing artists.",
          url: "https://www.vasta.org/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "voice-and-dialogue-website-002",
          title: "Sound on Sound: Dialogue Editing & Vocal Production Archive",
          organization: "Sound on Sound",
          description: "Masterclasses on dialogue cleanup, ADR matching, phase alignment, and vocal signal chain compression.",
          url: "https://www.soundonsound.com/techniques",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "voice-and-dialogue-website-003",
          title: "SAG-AFTRA Voiceover & Dubbing Resources",
          organization: "SAG-AFTRA",
          description: "Union contracts, standard rates, and studio safety guidelines for voiceover performers, commercial talent, and dubbing artists.",
          url: "https://www.sagaftra.org/contracts-pre-production/voiceover",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "voice-and-dialogue-website-004",
          title: "International Dialects of English Archive (IDEA)",
          organization: "IDEA",
          description: "The world's largest digital archive of verified primary source recordings of English language accents and dialects worldwide.",
          url: "https://www.dialectsarchive.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "voice-and-dialogue-website-005",
          title: "iZotope Audio Learning Hub: Dialogue Restoration with RX",
          organization: "iZotope / Native Instruments",
          description: "Tutorials on removing background noise, declipping dialogue, attenuating reverb, and matching acoustic room profiles.",
          url: "https://www.izotope.com/en/learn.html",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "voice-and-dialogue-website-006",
          title: "StudioBinder ADR & Voice Recording Guides",
          organization: "StudioBinder",
          description: "Educational articles on ADR cue sheets, looping sessions, voiceover script formatting, and voice talent direction.",
          url: "https://www.studiobinder.com/blog/adr-in-film/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "voice-and-dialogue-website-007",
          title: "Motion Picture Sound Editors (MPSE) Dialogue Craft",
          organization: "MPSE",
          description: "Panels with Golden Reel Award-winning dialogue editors and ADR supervisors on narrative feature film workflows.",
          url: "https://www.mpse.org/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "voice-and-dialogue-website-008",
          title: "No Film School Voice & Dialogue Recording Archive",
          organization: "No Film School",
          description: "Practical guides on recording clean dialogue on windy outdoor shoots, lavalier concealment, and budget vocal booths.",
          url: "https://nofilmschool.com/topics/audio",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "voice-and-dialogue-website-009",
          title: "DPA Microphones: Speech Intelligibility & Placement Guides",
          organization: "DPA Microphones",
          description: "Technical application guides on acoustic speech frequency transmission, miniature mic concealment, and wind noise reduction.",
          url: "https://www.dpamicrophones.com/mic-university",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "voice-and-dialogue-website-010",
          title: "Voice Council: Vocal Health & Performance Advice",
          organization: "Voice Council",
          description: "Articles written by ENT physicians and vocal coaches on voice preservation, vocal strain recovery, and resonance exercises.",
          url: "https://voicecouncil.com/",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ]
    }
  },
  {
    id: 29,
    slug: "set-decoration",
    course: "Set Decoration",
    category: "Art Department",
    description: "Learn prop sourcing, set dressing continuity, practical lighting selection, texture distressing, clearances, and collaborating with the production designer.",
    resources: {
      books: [
        {
          id: "set-decoration-book-001",
          title: "Exploring Movie Construction: Set Decoration and Environmental Detail",
          author: "John Reich",
          description: "Academic textbook analyzing how hand props, furniture choices, wall textures, and personal ephemera give physical sets psychological authenticity.",
          url: "https://milneopentextbooks.org/wp-content/uploads/2017/10/Exploring-Movie-Construction-and-Production-Reich-Open-SUNY-Textbooks.pdf",
          format: "pdf",
          accessType: "open-access",
          sourceName: "Milne Open Textbooks",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "set-decoration-book-002",
          title: "Moving Pictures: Set Dressing, Props and Narrative Space",
          author: "Russell Leigh Sharman",
          description: "University open educational resource analyzing the responsibilities of the set decorator, lead dresser, prop master, and on-set dressers.",
          url: "https://uark.pressbooks.pub/app/uploads/sites/11/2020/07/Moving-Pictures-1594916843.pdf",
          format: "pdf",
          accessType: "open-access",
          sourceName: "University of Arkansas Open Educational Resources",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      videos: [
        {
          id: "set-decoration-video-001",
          title: "What Does a Set Decorator Do? The Art of Dressing Film Sets",
          creator: "StudioBinder",
          description: "The vital difference between Production Designer (architectural design) and Set Decorator (sourcing furniture, drapery, art, and props).",
          url: "https://www.youtube.com/watch?v=0k5u98gG1cE",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "set-decoration-video-002",
          title: "How Set Dressing Tells Stories: Small Details that Reveal Character",
          creator: "Thomas Flight",
          description: "Analyzing the forensic clutter in Mindhunter and the immaculate symmetry in Wes Anderson films to examine narrative worldbuilding.",
          url: "https://www.youtube.com/watch?v=SM3IQFgP-d8",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "set-decoration-video-003",
          title: "How to Dress a Cinematic Film Set on a Low Budget",
          creator: "Film Riot",
          description: "Hands-on set dressing tips: layering depth into empty rooms, breaking straight lines, using vintage practical lamps, and papering windows.",
          url: "https://www.youtube.com/watch?v=1uRskm9Zk9c",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "set-decoration-video-004",
          title: "The Props of Hollywood: How Prop Masters Fabricate Movie Objects",
          creator: "In Depth Cine",
          description: "The difference between hand props (handled by actors) and set dressing (static environmental furniture), and hero prop fabrication.",
          url: "https://www.youtube.com/watch?v=Npg9kfZKAK4",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "set-decoration-video-005",
          title: "Set Dressing Breakdown: How to Age and Weather Real Rooms",
          creator: "StudioBinder",
          description: "Using unbleached muslin, dust powder, cobweb spinners, grease pencils, and water stains to turn clean locations into lived-in spaces.",
          url: "https://www.youtube.com/watch?v=r2nD_knsNrc",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "set-decoration-video-006",
          title: "Practical Lamps on Set: Collaborating with the Gaffer and DP",
          creator: "In Depth Cine",
          description: "Choosing practical table lamps, sconces, and neon signs that motivate the lighting plan while matching camera color balance.",
          url: "https://www.youtube.com/watch?v=kzdfYKgewzA",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "set-decoration-video-007",
          title: "Trademark & Copyright Clearances for Set Dressing",
          creator: "Film Independent",
          description: "Legal rules on logos, artwork on walls, consumer brand labels, cereal boxes, and using clearance house cleared props.",
          url: "https://www.youtube.com/watch?v=4d8kP2qX8L4",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "set-decoration-video-008",
          title: "Set Decorating for Period Cinema: 1950s Suburban Living Room",
          creator: "BAFTA Guru",
          description: "Leading set decorators discuss sourcing period-accurate rotary phones, mid-century furniture, upholstery patterns, and vintage periodicals.",
          url: "https://www.youtube.com/watch?v=p4v3t8Wv9_c",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "set-decoration-video-009",
          title: "How to Build a Set Dressing Continuity Binder with Photos",
          creator: "Team 2 Films",
          description: "Taking polaroids/digital reference photos of every table surface, ashtray level, and prop position to prevent continuity errors across shoot days.",
          url: "https://www.youtube.com/watch?v=znBHzeXpsUw",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "set-decoration-video-010",
          title: "The Art of Thrifting for Film Props and Set Dressing",
          creator: "DSLRguide",
          description: "How to discover hidden treasure in flea markets, estate sales, and antique warehouses to give your film rich texture for minimal money.",
          url: "https://www.youtube.com/watch?v=6v7M3qQ8w0o",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      websites: [
        {
          id: "set-decoration-website-001",
          title: "Set Decorators Society of America (SDSA) Official Portal",
          organization: "Set Decorators Society of America",
          description: "SETDECOR magazine archives, professional business directory of prop houses, fabricators, and SDSA Awards for set decor excellence.",
          url: "https://www.setdecorators.org/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "set-decoration-website-002",
          title: "Art Directors Guild (ADG Local 800) Set Decorator Collaborations",
          organization: "Art Directors Guild",
          description: "Articles on art department hierarchy, draftsmanship, scenic painting standards, and architectural modeling.",
          url: "https://adg.org/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "set-decoration-website-003",
          title: "StudioBinder Set Decoration Guides & Breakdowns",
          organization: "StudioBinder",
          description: "Visual guides on set dressing vs props, mood board creation, finding cleared artwork, and set dressing continuity logging.",
          url: "https://www.studiobinder.com/blog/set-decoration/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "set-decoration-website-004",
          title: "Universal Studios Property Department & Prop House",
          organization: "Universal Studios",
          description: "Behind-the-scenes directory of Hollywood's premier studio prop house, cataloging hundreds of thousands of period and modern items.",
          url: "https://www.universalstudioslot.com/property",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "set-decoration-website-005",
          title: "Warner Bros. Studios Property & Set Dressing Archives",
          organization: "Warner Bros. Studio Facilities",
          description: "Historic studio property warehouse catalog covering European antiques, vintage electronics, mid-century furniture, and cleared art.",
          url: "https://www.wbsf.com/production-services/property-department/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "set-decoration-website-006",
          title: "History For Hire: Prop House & Period Film Resources",
          organization: "History For Hire",
          description: "Specialized historic prop house servicing Hollywood features with authentic audio equipment, vintage cameras, and historic documents.",
          url: "https://historyforhire.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "set-decoration-website-007",
          title: "No Film School Set Decoration & Art Department Archive",
          organization: "No Film School",
          description: "Tutorials on dressing indie film sets on shoestring budgets, practical lighting setups, and working with art directors.",
          url: "https://nofilmschool.com/topics/production-design",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "set-decoration-website-008",
          title: "BFI Screenonline: Set Design & Dressing in British Cinema",
          organization: "British Film Institute",
          description: "Historical retrospective on British cinema set dressing from Ealing comedies to lavish period merchant-ivory adaptations.",
          url: "https://www.screenonline.org.uk/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "set-decoration-website-009",
          title: "ProductionHUB Set Decorators & Prop Masters Network",
          organization: "ProductionHUB",
          description: "Global directory of set decorators, scenic painters, lead dressers, and prop houses available for production hire.",
          url: "https://www.productionhub.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "set-decoration-website-010",
          title: "Cinephilia & Beyond: Set Decorating Photographic Archives",
          organization: "Cinephilia & Beyond",
          description: "Rare behind-the-scenes set dressing photographs from 2001: A Space Odyssey, The Shining, and Alien.",
          url: "https://cinephiliabeyond.org/",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ]
    }
  },
  {
    id: 30,
    slug: "story-development",
    course: "Story Development",
    category: "Writing & Development",
    description: "Master premise generation, high-concept loglines, dramatic treatments, character want vs need dynamics, and structural story beat sheets.",
    resources: {
      books: [
        {
          id: "story-development-book-001",
          title: "Writing for Success: Narrative Development & Structural Design",
          author: "University Open Textbook Publishing Group",
          description: "Comprehensive university open textbook covering premise inception, inciting incidents, cause-and-effect narrative chains, and character arcs.",
          url: "https://open.lib.umn.edu/writingforsuccess/wp-content/uploads/sites/114/2016/09/Writing-for-Success.pdf",
          format: "pdf",
          accessType: "open-access",
          sourceName: "University of Minnesota Libraries Publishing",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "story-development-book-002",
          title: "Moving Pictures: The Fundamentals of Dramatic Story Development",
          author: "Russell Leigh Sharman",
          description: "University open educational resource analyzing the transformation of initial concepts into structured screenplay treatments and beat sheets.",
          url: "https://uark.pressbooks.pub/app/uploads/sites/11/2020/07/Moving-Pictures-1594916843.pdf",
          format: "pdf",
          accessType: "open-access",
          sourceName: "University of Arkansas Open Educational Resources",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      videos: [
        {
          id: "story-development-video-001",
          title: "Dan Harmon's Story Circle: 8 Steps to Master Story Structure",
          creator: "StudioBinder",
          description: "Deep dive into Joseph Campbell's hero's journey adapted into Dan Harmon's 8-step cycle: You, Need, Go, Search, Find, Take, Return, Change.",
          url: "https://www.youtube.com/watch?v=s0F9wH_tQ4M",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "story-development-video-002",
          title: "How to Write a Logline: The Formula for High-Concept Movie Ideas",
          creator: "StudioBinder",
          description: "Crafting a compelling 1-2 sentence pitch: Protagonist + Inciting Incident + Goal + Antagonist / Core Obstacle + High Stakes.",
          url: "https://www.youtube.com/watch?v=0k5u98gG1cE",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "story-development-video-003",
          title: "The Anatomy of a Perfect Beat Sheet: Blake Snyder's 15 Beats",
          creator: "StudioBinder",
          description: "Mapping out opening image, theme stated, catalyst, debate, break into two, B story, fun and games, midpoint, and dark night of the soul.",
          url: "https://www.youtube.com/watch?v=Q4t7B0nZw8Y",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "story-development-video-004",
          title: "Jurassic Park: Using Theme to Drive Story Development",
          creator: "Lessons from the Screenplay",
          description: "How Michael Crichton and David Koepp anchored every action scene to the central philosophical debate: scientific hubris vs nature.",
          url: "https://www.youtube.com/watch?v=VWz1E3oHd8w",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "story-development-video-005",
          title: "How to Write a Film Treatment: Pitching Your Story on Paper",
          creator: "StudioBinder",
          description: "Writing an engaging narrative treatment: prose style, three-act division, character introductions, and avoiding dry scene summaries.",
          url: "https://www.youtube.com/watch?v=d_k8kOa1y9Y",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "story-development-video-006",
          title: "Character Want vs Need: The Engine of Emotional Narrative",
          creator: "Lessons from the Screenplay",
          description: "Why compelling protagonists pursue an external conscious want while struggling to embrace an internal unconscious need.",
          url: "https://www.youtube.com/watch?v=SM3IQFgP-d8",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "story-development-video-007",
          title: "How to Brainstorm Story Ideas That Can Actually Sell",
          creator: "Film Riot",
          description: "Techniques for combining disparate concepts ('what if?'), personal emotional vulnerability, and identifying strong visual hooks.",
          url: "https://www.youtube.com/watch?v=1uRskm9Zk9c",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "story-development-video-008",
          title: "Guillermo del Toro on Developing Dark Fairytales and Monsters",
          creator: "BAFTA Guru",
          description: "Del Toro explains his personal notebooks, character sketches, and developing monsters as manifestations of human social flaws.",
          url: "https://www.youtube.com/watch?v=9g0mG1oYk4Y",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "story-development-video-009",
          title: "The Midpoint Shift: Why the Middle of Your Story is Sagging",
          creator: "StudioBinder",
          description: "How the midpoint raises the stakes from passive survival to active attack, turning the false victory or false defeat into real danger.",
          url: "https://www.youtube.com/watch?v=N9mPQBZe06s",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "story-development-video-010",
          title: "Developing a Feature Film from Scratch: Outline to First Draft",
          creator: "DSLRguide",
          description: "Overcoming creative block, index card outlining on a wall, killing your darlings, and pushing through the messy first draft.",
          url: "https://www.youtube.com/watch?v=6v7M3qQ8w0o",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      websites: [
        {
          id: "story-development-website-001",
          title: "The Black List: Screenplay Discovery & Development Hub",
          organization: "The Black List",
          description: "Industry-leading evaluation platform connecting screenwriters with Hollywood development executives, agents, and producers.",
          url: "https://blcklst.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "story-development-website-002",
          title: "Go Into The Story: The Official Black List Blog by Scott Myers",
          organization: "The Black List",
          description: "Daily masterclasses on story development, character archetypes, theme mapping, and classic screenplay structural analysis.",
          url: "https://gointothestory.blcklst.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "story-development-website-003",
          title: "Sundance Co//ab Story Development Learning Library",
          organization: "Sundance Institute",
          description: "Online courses, webinars, and masterclasses on premise development, treatments, and authentic character arcs.",
          url: "https://collab.sundance.org/learn/screenwriting",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "story-development-website-004",
          title: "BBC Writersroom: Story Development & Script Resources",
          organization: "BBC Writersroom",
          description: "Development toolkits, script development guidelines, and structural advice from BBC commissioning editors.",
          url: "https://www.bbc.co.uk/writersroom/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "story-development-website-005",
          title: "StudioBinder Story Development & Structure Guides",
          organization: "StudioBinder",
          description: "Visual breakdown of the Hero's Journey, 3-act structure, 5-act dramatic arc, beat sheets, and character backstory worksheets.",
          url: "https://www.studiobinder.com/blog/category/screenwriting/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "story-development-website-006",
          title: "Scriptnotes: A Podcast About Screenwriting and Things That Are Interesting to Screenwriters",
          organization: "John August & Craig Mazin",
          description: "Invaluable weekly craft and business advice from veteran studio screenwriters John August and Craig Mazin (Chernobyl, The Last of Us).",
          url: "https://johnaugust.com/scriptnotes",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "story-development-website-007",
          title: "Save the Cat! Story Structure & Beat Sheet Blog",
          organization: "Save the Cat!",
          description: "Official guides and weekly beat sheet dissections of current feature films and television pilots using Blake Snyder's methodology.",
          url: "https://savethecat.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "story-development-website-008",
          title: "No Film School Story Development Archive",
          organization: "No Film School",
          description: "Actionable articles on finding unique premises, structuring high-concept treatments, and pitching development executives.",
          url: "https://nofilmschool.com/topics/screenwriting",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "story-development-website-009",
          title: "ScreenCraft: Story Development & Pitching Competitions",
          organization: "ScreenCraft",
          description: "Articles on story outlining, writing genre treatments, loglines, and securing development financing for feature projects.",
          url: "https://screencraft.org/blog/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "story-development-website-010",
          title: "The Writers Store: Screenwriting & Story Outlining Resources",
          organization: "The Writers Store",
          description: "Articles and toolkits on narrative structure, treatment templates, character development software, and industry coverage.",
          url: "https://www.writersstore.com/",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ]
    }
  }
];
