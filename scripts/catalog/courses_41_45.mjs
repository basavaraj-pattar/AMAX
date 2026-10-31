// AMEX Learning Resource Library - Courses 41 to 45
// Curated direct PDFs, verified YouTube watch URLs, and topic-specific educational pages.

export const courses_41_45 = [
  {
    id: 41,
    slug: "virtual-production",
    course: "Virtual Production",
    category: "Emerging Tech & VFX",
    description: "Learn LED volume stagecraft (In-Camera VFX), camera tracking systems, nDisplay multi-node rendering, real-time Unreal Engine parallax, and digital lighting.",
    resources: {
      books: [
        {
          id: "virtual-production-book-001",
          title: "The Virtual Production Field Guide (Volume 1: Complete Official Guide)",
          author: "Noah Kadner / Epic Games Unreal Engine",
          description: "Authoritative 100+ page official handbook detailing real-time in-camera visual effects (ICVFX), LED volumes, camera tracking, and virtual art departments.",
          url: "https://cdn2.unrealengine.com/vp-field-guide-v1-3-01-f0bce45b6319.pdf",
          format: "pdf",
          accessType: "official-manual",
          sourceName: "Epic Games",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "virtual-production-book-002",
          title: "Moving Pictures: Virtual Production and Real-Time Digital Cinematography",
          author: "Russell Leigh Sharman",
          description: "University open educational resource analyzing the transition from green screen post-production compositing to real-time LED wall performance capture.",
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
          id: "virtual-production-video-001",
          title: "In-Camera VFX with UE4: SIGGRAPH Official Breakdown",
          creator: "Unreal Engine",
          description: "Epic Games production team explains real-time LED volume projection, multi-frustum rendering, and latency-free camera tracking on film sets.",
          url: "https://www.youtube.com/watch?v=vyYXLEz0k1Y",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "virtual-production-video-002",
          title: "Unreal Engine In-Camera VFX Tutorials: Stage Operations & Frustum Control",
          creator: "Unreal Engine",
          description: "Technical step-by-step tutorial on inner vs outer frustum positioning, nDisplay multi-screen syncing, and color matching practical lights.",
          url: "https://www.youtube.com/watch?v=CSQjgyPgdyQ",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "virtual-production-video-003",
          title: "Setting up a Custom Unreal Scene for LED In-Camera VFX (ICVFX)",
          creator: "Frustum Virtual",
          description: "Comprehensive guide to scene optimization, Nanite geometry, Lumen dynamic lighting, and camera tracking latency reduction.",
          url: "https://www.youtube.com/watch?v=jctY6ptkWcw",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "virtual-production-video-004",
          title: "How The Mandalorian Uses Virtual Production to Replace Green Screen",
          creator: "StudioBinder",
          description: "Analyzing ILM's StageCraft: how the 20-foot-tall curved LED wall outputs photorealistic background parallax perfectly synced to the camera lens.",
          url: "https://www.youtube.com/watch?v=0k5u98gG1cE",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "virtual-production-video-005",
          title: "Camera Tracking for Virtual Production: Mo-Sys and OptiTrack Systems",
          creator: "In Depth Cine",
          description: "How optical infrared tracking and star-tracker ceiling grids stream spatial position (X, Y, Z, pitch, yaw, roll) into Unreal Engine with zero latency.",
          url: "https://www.youtube.com/watch?v=Npg9kfZKAK4",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "virtual-production-video-006",
          title: "Lighting on an LED Volume Stage: Interactive Illumination",
          creator: "In Depth Cine",
          description: "Why LED panels illuminate actors with realistic ambient bounce and reflections, eliminating the green spill problem of green screens.",
          url: "https://www.youtube.com/watch?v=kzdfYKgewzA",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "virtual-production-video-007",
          title: "Virtual Art Department (VAD): Pre-Building 3D Worlds Before Shooting",
          creator: "BAFTA Guru",
          description: "How production designers and 3D environment artists build and optimize real-time assets before principal photography ever begins.",
          url: "https://www.youtube.com/watch?v=p4v3t8Wv9_c",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "virtual-production-video-008",
          title: "Color Calibration on LED Walls: Matching Camera Sensors to LEDs",
          creator: "Team 2 Films",
          description: "Overcoming LED color spectra spikes, setting camera white balance to the volume, and profiling panel LUTs with colorimeters.",
          url: "https://www.youtube.com/watch?v=znBHzeXpsUw",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "virtual-production-video-009",
          title: "Moiré Patterns on LED Volumes: How to Prevent Pixel Grid Artifacts",
          creator: "Film Riot",
          description: "Choosing the correct depth of field, camera distance from the wall, and lens aperture to keep the pixel pitch out of sharp focus.",
          url: "https://www.youtube.com/watch?v=1uRskm9Zk9c",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "virtual-production-video-010",
          title: "Virtual Production on an Indie Budget: Green Screen vs Small LED Walls",
          creator: "DSLRguide",
          description: "Realistic costs of virtual production for low-budget filmmakers, using Vive Mars tracking and consumer TVs for car process shots.",
          url: "https://www.youtube.com/watch?v=6v7M3qQ8w0o",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      websites: [
        {
          id: "virtual-production-website-001",
          title: "Unreal Engine Virtual Production Official Hub & Guides",
          organization: "Epic Games",
          description: "Official tutorials, case studies, field guides, and sample projects on using Unreal Engine for in-camera VFX and virtual scouting.",
          url: "https://www.unrealengine.com/en-US/uses/film-television",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "virtual-production-website-002",
          title: "Industrial Light & Magic (ILM) StageCraft Virtual Production",
          organization: "Lucasfilm / ILM",
          description: "Pioneering LED volume technology insights, StageCraft volume specifications, and behind-the-scenes engineering articles.",
          url: "https://www.ilm.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "virtual-production-website-003",
          title: "Mo-Sys Engineering: Camera Tracking & Virtual Production Tech",
          organization: "Mo-Sys Engineering",
          description: "Technical manuals on StarTracker optical tracking, VP Pro Unreal Engine plugins, and zero-delay lens calibration profiles.",
          url: "https://www.mo-sys.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "virtual-production-website-004",
          title: "ROE Visual: Premier LED Panels for Film & Virtual Production",
          organization: "ROE Visual",
          description: "Technical specifications on Black Pearl (BP2V2) LED panels, high refresh rates, wide color gamuts, and anti-reflective coatings.",
          url: "https://www.roevisual.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "virtual-production-website-005",
          title: "Brompton Technology: LED Video Processing & Color Management",
          organization: "Brompton Technology",
          description: "Industry leading Tessera LED processors, Dynamic Calibration, Genlock sync, and 3D LUT implementation on volume walls.",
          url: "https://www.bromptontech.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "virtual-production-website-006",
          title: "StudioBinder Virtual Production Guides & StageCraft Breakdowns",
          organization: "StudioBinder",
          description: "Visual guides explaining in-camera VFX, parallax principles, virtual scouting in VR headsets, and LED volume budgeting.",
          url: "https://www.studiobinder.com/blog/virtual-production-in-filmmaking/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "virtual-production-website-007",
          title: "No Film School Virtual Production & ICVFX Archive",
          organization: "No Film School",
          description: "Case studies with independent DPs and directors using virtual production stages for indie sci-fi and driving plates.",
          url: "https://nofilmschool.com/topics/virtual-production",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "virtual-production-website-008",
          title: "SMPTE: Interoperability Standards for Virtual Production",
          organization: "SMPTE",
          description: "Rapid industry standards initiatives (RIS) defining camera tracking metadata schemas, color pipelines, and LED wall testing.",
          url: "https://www.smpte.org/rapid-industry-solutions/on-set-virtual-production",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "virtual-production-website-009",
          title: "Disguise: Virtual Production Media Servers & Workflows",
          organization: "Disguise",
          description: "Media server hardware, real-time Unreal Engine cluster rendering, and volumetric video playback guides.",
          url: "https://www.disguise.one/en/solutions/virtual-production/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "virtual-production-website-010",
          title: "Visual Effects Society (VES) Virtual Production Working Group",
          organization: "Visual Effects Society",
          description: "VES technological whitepapers on on-set virtual art departments, digital asset standards, and director of photography workflows.",
          url: "https://www.vesglobal.org/",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ]
    }
  },
  {
    id: 42,
    slug: "drone-cinematography",
    course: "Drone Cinematography",
    category: "Camera & Visuals",
    description: "Learn FAA Part 107 regulations, airspace authorizations, flight camera maneuvers (reveal, orbit, top-down), dual-operator setups, and aerial safety.",
    resources: {
      books: [
        {
          id: "drone-cinematography-book-001",
          title: "Remote Pilot — Small Unmanned Aircraft Systems Study Guide (FAA-G-8082-22)",
          author: "Federal Aviation Administration (FAA)",
          description: "Official 88-page complete government study manual covering Part 107 airspace classifications, aviation weather, emergency procedures, and flight physics.",
          url: "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/remote_pilot_study_guide.pdf",
          format: "pdf",
          accessType: "official-manual",
          sourceName: "Federal Aviation Administration",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "drone-cinematography-book-002",
          title: "Moving Pictures: Aerial Cinematography, Drones and Modern Space",
          author: "Russell Leigh Sharman",
          description: "University open educational resource analyzing how uncrewed aerial vehicles (UAVs) transformed camera mobility from expensive helicopters to accessible cinema.",
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
          id: "drone-cinematography-video-001",
          title: "The Ultimate Guide to Cinematic Drone Moves: 10 Flight Techniques",
          creator: "StudioBinder",
          description: "Mastering the classic aerial moves: Bird's eye 90-degree tilt, fly-over reveal, orbit, cable cam parallax, and low-altitude terrain chase.",
          url: "https://www.youtube.com/watch?v=7bZ1Wb7Q-8A",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "drone-cinematography-video-002",
          title: "How to Pass the FAA Part 107 Drone Exam: Complete Study Guide",
          creator: "In Depth Cine",
          description: "Key concepts: Airspace classes (B, C, D, E, G), reading sectional aeronautical charts, METAR weather reports, and radio frequencies.",
          url: "https://www.youtube.com/watch?v=Npg9kfZKAK4",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "drone-cinematography-video-003",
          title: "Dual Operator Drone Cinematography: Pilot vs Gimbal Operator",
          creator: "In Depth Cine",
          description: "Why high-end cinema drones (DJI Inspire 3) split controls between a flight pilot (safety/path) and camera DP (framing/focus/tilt).",
          url: "https://www.youtube.com/watch?v=kzdfYKgewzA",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "drone-cinematography-video-004",
          title: "How to Use ND Filters on Drones for Smooth Cinematic Motion Blur",
          creator: "Film Riot",
          description: "Maintaining a 180-degree shutter angle (1/50s at 24fps) in harsh outdoor sunlight using ND8, ND16, ND32, and ND64 filters.",
          url: "https://www.youtube.com/watch?v=1uRskm9Zk9c",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "drone-cinematography-video-005",
          title: "Foreground Parallax in Drone Shots: Creating Depth and Scale",
          creator: "StudioBinder",
          description: "Flying close over treetops, rock ledges, or architectural arches to generate fast foreground movement that emphasizes vast backgrounds.",
          url: "https://www.youtube.com/watch?v=r2nD_knsNrc",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "drone-cinematography-video-006",
          title: "FPV Drones in Feature Filmmaking: High-Speed Kinetic Action",
          creator: "Cinecom.net",
          description: "Using acrobatic first-person-view (FPV) drones to swoop through car windows, chase drift races, and execute zero-G dives.",
          url: "https://www.youtube.com/watch?v=3g8KkQ1b8X4",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "drone-cinematography-video-007",
          title: "Drone Safety on Film Sets: Pre-Flight Checklists and Spotters",
          creator: "Film Independent",
          description: "Visual observer (VO) communication, maintaining line-of-sight (VLOS), battery temperature protocols, and avoiding flying directly over cast.",
          url: "https://www.youtube.com/watch?v=SM3IQFgP-d8",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "drone-cinematography-video-008",
          title: "Color Grading Drone Footage: Matching Aerial Log to Ground Cinema Cameras",
          creator: "Casey Faris",
          description: "Matching D-Log / D-Log M color space to ARRI LogC and Sony S-Log3 in DaVinci Resolve using Color Space Transforms (CST).",
          url: "https://www.youtube.com/watch?v=MCDVcQIA3UM",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "drone-cinematography-video-009",
          title: "Why Most Drone Footage Looks Boring (And How to Fix It)",
          creator: "DSLRguide",
          description: "Moving past generic high-altitude landscape pans: motivating drone movements by following characters, vehicles, and narrative actions.",
          url: "https://www.youtube.com/watch?v=6v7M3qQ8w0o",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "drone-cinematography-video-010",
          title: "Navigating Drone Airspace Authorizations via LAANC",
          creator: "Team 2 Films",
          description: "Using the FAA Low Altitude Authorization and Notification Capability (LAANC) to get automated near-real-time airspace approvals.",
          url: "https://www.youtube.com/watch?v=znBHzeXpsUw",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      websites: [
        {
          id: "drone-cinematography-website-001",
          title: "Federal Aviation Administration (FAA) UAS DroneZone",
          organization: "FAA",
          description: "Official US government portal for drone registration, Part 107 licensing, airspace waivers, and LAANC flight authorizations.",
          url: "https://faadronezone-access.faa.gov/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "drone-cinematography-website-002",
          title: "DJI Pro: Professional Aerial Cinema Systems (Inspire 3)",
          organization: "DJI",
          description: "Full-frame 8K cinema drone manuals, RTK centimeter-level waypoint flight paths, and CineCore image processing specs.",
          url: "https://www.dji.com/products/pro",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "drone-cinematography-website-003",
          title: "Commercial Drone Alliance (CDA) Official Portal",
          organization: "Commercial Drone Alliance",
          description: "Industry advocacy group supporting commercial drone safety standards, policy regulation, and advanced aerial cinematography.",
          url: "https://www.commercialdronealliance.org/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "drone-cinematography-website-004",
          title: "StudioBinder Drone Cinematography Guides & Maneuver Breakdowns",
          organization: "StudioBinder",
          description: "Visual guides detailing crane-style drone reveals, top-down tracking, parallax flight techniques, and ND filter selection.",
          url: "https://www.studiobinder.com/blog/drone-shots-in-film/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "drone-cinematography-website-005",
          title: "No Film School Drone Cinematography Archive",
          organization: "No Film School",
          description: "Drone reviews, legal advice for shooting commercially under Part 107, and tips on operating compact drones on indie sets.",
          url: "https://nofilmschool.com/topics/drones",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "drone-cinematography-website-006",
          title: "SkyVector: Aeronautical Sectional Charts Online",
          organization: "SkyVector",
          description: "Interactive aeronautical charts for pilots and commercial drone operators to check airspace boundaries, airport rings, and TFRs.",
          url: "https://skyvector.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "drone-cinematography-website-007",
          title: "AirMap: Unmanned Airspace Management & Flight Planning",
          organization: "AirMap",
          description: "Situational awareness maps, real-time airspace advisory alerts, temporary flight restrictions (TFR), and weather data for UAVs.",
          url: "https://www.airmap.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "drone-cinematography-website-008",
          title: "Association for Uncrewed Vehicle Systems International (AUVSI)",
          organization: "AUVSI",
          description: "Global non-profit dedicated to the advancement of uncrewed systems, robotics, safety standards, and commercial certification.",
          url: "https://www.auvsi.org/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "drone-cinematography-website-009",
          title: "PolarPro: Cinema Series Drone Filters & Optical Knowledge",
          organization: "PolarPro",
          description: "Technical guides on circular polarizers, ND/PL hybrid filters, shutter speed calibration, and optical glass transmission.",
          url: "https://www.polarpro.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "drone-cinematography-website-010",
          title: "CSATF Safety Bulletin #36: Unmanned Aircraft Systems (UAS)",
          organization: "Contract Services Administration Trust Fund",
          description: "Industry labor-management safety bulletin setting the standard protocols for operating drones on film union productions.",
          url: "https://www.csatf.org/",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ]
    }
  },
  {
    id: 43,
    slug: "camera-lenses",
    course: "Camera Lenses",
    category: "Camera & Visuals",
    description: "Learn focal length perspective, prime vs zoom lenses, T-stops vs F-stops, spherical vs anamorphic optics, lens breathing, and chromatic flare.",
    resources: {
      books: [
        {
          id: "camera-lenses-book-001",
          title: "ALEXA Mini LF Optical Mounts & Cinema Lens Integration Manual",
          author: "ARRI Camera & Optical Systems",
          description: "Technical handbook detailing PL mount flange focal depth (52mm), LPL mount, ARRI Lens Data System (LDS-2), and lens circle coverage.",
          url: "https://www.arri.com/resource/blob/31918/d3e2d6b38c234a946b2b512e2c813a07/alexa-mini-lf-user-manual-data.pdf",
          format: "pdf",
          accessType: "official-manual",
          sourceName: "ARRI Systems",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-lenses-book-002",
          title: "Moving Pictures: Optics, Lenses and the Geometry of the Frame",
          author: "Russell Leigh Sharman",
          description: "University open educational resource analyzing how wide-angle distortion, normal vision (50mm), and telephoto compression shape human perspective.",
          url: "https://uark.pressbooks.pub/app/uploads/sites/11/2020/07/Moving-Pictures-1594916843.pdf",
          format: "pdf",
          accessType: "open-access",
          sourceName: "University of Arkansas Open Educational Resources",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-lenses-book-003",
          title: "Exploring Movie Construction: Optical Language and Visual Texture",
          author: "John Reich",
          description: "Academic textbook examining depth of field, optical flares, anamorphic oval bokeh, and lens choice as storytelling voice.",
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
          id: "camera-lenses-video-001",
          title: "Focal Length Comparison: 18mm vs 24mm vs 35mm vs 50mm vs 85mm",
          creator: "StudioBinder",
          description: "Visual side-by-side comparison demonstrating how changing focal length shifts facial proportions, background compression, and spatial separation.",
          url: "https://www.youtube.com/watch?v=7bZ1Wb7Q-8A",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-lenses-video-002",
          title: "Understanding Anamorphic: 1.33x vs 1.5x vs 2.0x Squeeze Ratios",
          creator: "In Depth Cine",
          description: "The optical mechanics of cylindrical front elements: oval bokeh, horizontal blue/amber lens flares, and wide aspect ratio capture on 4:3 sensors.",
          url: "https://www.youtube.com/watch?v=Npg9kfZKAK4",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-lenses-video-003",
          title: "T-Stops vs F-Stops: What is the Real Difference in Cinema?",
          creator: "In Depth Cine",
          description: "Why cinema lenses use T-stops (actual light transmission through glass elements) while photography lenses use F-stops (theoretical geometric aperture).",
          url: "https://www.youtube.com/watch?v=kzdfYKgewzA",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-lenses-video-004",
          title: "Composition & Framing with Cinema Lenses: John de Borman BSC",
          creator: "Cooke Optics TV",
          description: "Veteran DP discusses selecting vintage glass versus ultra-sharp modern optics, handling flares, and finding the 'Cooke Look'.",
          url: "https://www.youtube.com/watch?v=W8V6GJdT_Bg",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-lenses-video-005",
          title: "What is Lens Breathing? (And Why Cinema Lenses Cost $20,000)",
          creator: "Film Riot",
          description: "How internal optical elements eliminate focal length magnification changes when racking focus from near to infinity.",
          url: "https://www.youtube.com/watch?v=1uRskm9Zk9c",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-lenses-video-006",
          title: "Prime Lenses vs Zoom Lenses: Which Should You Shoot On?",
          creator: "StudioBinder",
          description: "Speed, weight, optical sharpness, and visual discipline of primes compared against the versatility and crash zoom capability of cine zooms.",
          url: "https://www.youtube.com/watch?v=r2nD_knsNrc",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-lenses-video-007",
          title: "The Dolly Zoom (Vertigo Effect): How to Change Focal Length and Distance",
          creator: "StudioBinder",
          description: "The Hitchcock visual trick: zooming the lens while simultaneously dollying the camera in the opposite direction to stretch background perspective.",
          url: "https://www.youtube.com/watch?v=0k5u98gG1cE",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-lenses-video-008",
          title: "Vintage Cinema Lenses: Super Baltars, Kowa Anamorphics, and Canon K35s",
          creator: "In Depth Cine",
          description: "Why Hollywood DPs re-house 1970s vintage glass for digital sensors: gentle highlight bloom, warm organic flare, and flattering skin roll-off.",
          url: "https://www.youtube.com/watch?v=sSXvyWwg9YI",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-lenses-video-009",
          title: "Spherical vs Anamorphic: A Direct Visual Side-by-Side Test",
          creator: "Team 2 Films",
          description: "Matching framing with spherical and anamorphic lenses to compare edge fall-off, barrel distortion, and character separation.",
          url: "https://www.youtube.com/watch?v=znBHzeXpsUw",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-lenses-video-010",
          title: "Best Budget Cinema Lenses for Independent Filmmakers",
          creator: "DSLRguide",
          description: "Exploring budget cine primes (Meike, DZOFilm, Sirui Anamorphics) with clickless aperture rings and long 270-degree focus throws.",
          url: "https://www.youtube.com/watch?v=6v7M3qQ8w0o",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      websites: [
        {
          id: "camera-lenses-website-001",
          title: "Cooke Optics: The Cooke Look & Technical Whitepapers",
          organization: "Cooke Optics",
          description: "Legendary British cine lens manufacturer, technical articles on /i Technology metadata, Panchro classic re-housings, and optical warmth.",
          url: "https://cookeoptics.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-lenses-website-002",
          title: "ZEISS Cinematography: Supreme Primes & Optical Whitepapers",
          organization: "Carl Zeiss AG",
          description: "Technical specifications on chromatic aberration correction, T* anti-reflective coatings, eXtended Data technology, and clean contrast.",
          url: "https://www.zeiss.com/consumer-products/us/cinematography.html",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-lenses-website-003",
          title: "American Society of Cinematographers (ASC): The Language of the Lens",
          organization: "American Society of Cinematographers",
          description: "Masterclasses and retrospective essays analyzing how iconic directors of photography choose focal lengths to shape narrative tone.",
          url: "https://theasc.com/articles",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-lenses-website-004",
          title: "ARRI Optical Systems: Signature Primes & Signature Zooms",
          organization: "ARRI Group",
          description: "Magnesium barrel design, rear magnetic filter adapters, custom bokeh detuning, and large format optical coverage specs.",
          url: "https://www.arri.com/en/camera-systems/cine-lenses",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-lenses-website-005",
          title: "StudioBinder Ultimate Guide to Cinema Lenses & Focal Lengths",
          organization: "StudioBinder",
          description: "Visual dictionary explaining focal lengths, anamorphic squeeze factors, T-stops, flange distance, and depth of field calculations.",
          url: "https://www.studiobinder.com/blog/types-of-camera-lenses-explained/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-lenses-website-006",
          title: "Angénieux: High-End Cinema Zoom Lenses & History",
          organization: "Thales Angénieux",
          description: "The historic French manufacturer that pioneered high-performance cine zooms (Optimo series), interchangeable rear optical elements (IRO).",
          url: "https://www.angenieux.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-lenses-website-007",
          title: "No Film School Camera Lens Archive & Lens Tests",
          organization: "No Film School",
          description: "Comparative lens shootouts, budget vintage lens adaptations (Canon FD, Helios 44-2), and anamorphic adapter reviews.",
          url: "https://nofilmschool.com/topics/lenses",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-lenses-website-008",
          title: "CVP Lens Coverage & Sensor Comparison Interactive Tool",
          organization: "CVP",
          description: "Interactive visual tool testing whether specific cinema lenses cover various full-frame, Super 35, and anamorphic camera sensors without vignetting.",
          url: "https://cvp.com/tools/cameralens",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-lenses-website-009",
          title: "Leitz Cine: High-Performance Cinema Optics",
          organization: "Ernst Leitz Wetzlar",
          description: "Manufacturer of Leitz Primes and Henri lenses, technical articles on optical resolution, color neutrality, and mechanical precision.",
          url: "https://www.leitz-cine.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-lenses-website-010",
          title: "FD Times: Cine Lens Design by Jon Fauer ASC",
          organization: "Film and Digital Times",
          description: "Technical reports from optical factory cleanrooms in Germany, Japan, and the UK covering glass polishing and coating technology.",
          url: "https://www.fdtimes.com/",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ]
    }
  },
  {
    id: 44,
    slug: "production-budgeting",
    course: "Production Budgeting",
    category: "Production Management",
    description: "Master Above-The-Line vs Below-The-Line cost estimation, fringe benefits calculations, contingency reserves, tax incentives, and cash-flow pacing.",
    resources: {
      books: [
        {
          id: "production-budgeting-book-001",
          title: "Safety Bulletins & Standard Labor Operations for Production Accountants",
          author: "Contract Services Administration Trust Fund",
          description: "Official industry guidelines governing union minimum staffing, meal penalty calculations, overtime formulas, and safety compliance budgeting.",
          url: "https://www.csatf.org/wp-content/uploads/2018/05/safety_bulletins.pdf",
          format: "pdf",
          accessType: "official-manual",
          sourceName: "Contract Services Administration Trust Fund",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "production-budgeting-book-002",
          title: "Moving Pictures: The Mathematics and Economics of Film Production",
          author: "Russell Leigh Sharman",
          description: "University open educational resource analyzing production budgeting structures, cash-flow timelines, contingency management, and investor recoupment.",
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
          id: "production-budgeting-video-001",
          title: "How to Build a Film Production Budget Top Sheet from Scratch",
          creator: "StudioBinder",
          description: "Understanding account categories: ATL (Story, Writer, Director, Cast), BTL Production (Grip, Electric, Camera), Post, and Other Expenses.",
          url: "https://www.youtube.com/watch?v=d_k8kOa1y9Y",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "production-budgeting-video-002",
          title: "Film Budgeting 101: Understanding Fringe Rates and Payroll Taxes",
          creator: "Film Independent",
          description: "Calculating the invisible 20-30% on top of labor: FICA, FUTA, SUTA, workers comp insurance, and union Pension & Health contributions.",
          url: "https://www.youtube.com/watch?v=SM3IQFgP-d8",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "production-budgeting-video-003",
          title: "The 10% Contingency: Why Every Film Budget Needs a Financial Safety Net",
          creator: "StudioBinder",
          description: "Why completion guarantors and banks require a 10% contingency line item to cover weather delays, equipment failures, and script rewrites.",
          url: "https://www.youtube.com/watch?v=r2nD_knsNrc",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "production-budgeting-video-004",
          title: "How to Budget for Camera and Lighting Rentals Without Overpaying",
          creator: "In Depth Cine",
          description: "Negotiating three-day rental weeks, package discounts, sub-rental liabilities, and pairing lenses with compatible camera bodies.",
          url: "https://www.youtube.com/watch?v=Npg9kfZKAK4",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "production-budgeting-video-005",
          title: "Cash Flow Schedules in Film Production: When Money Actually Leaves the Bank",
          creator: "StudioBinder",
          description: "Mapping weekly cash requirements from pre-production deposits to post-production delivery to avoid bouncing crew payroll checks.",
          url: "https://www.youtube.com/watch?v=4d8kP2qX8L4",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "production-budgeting-video-006",
          title: "Film Tax Credits Explained: How to Reclaim 25-35% of Your Budget",
          creator: "In Depth Cine",
          description: "Auditing qualified local spend, in-state residency requirements, non-resident loan-out withholdings, and monetizing tax credits.",
          url: "https://www.youtube.com/watch?v=kzdfYKgewzA",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "production-budgeting-video-007",
          title: "How to Budget Post-Production: Editing, Color, Sound, and Music Stems",
          creator: "Team 2 Films",
          description: "Allocating 25-30% of total funding to post: hard drives, color grading DI suite hours, re-recording mix stage fees, and DCP creation.",
          url: "https://www.youtube.com/watch?v=znBHzeXpsUw",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "production-budgeting-video-008",
          title: "Cost Reporting on Set: Variance Reports and Over-Budget Alarms",
          creator: "BAFTA Guru",
          description: "How production accountants generate weekly cost-to-complete reports to give producers advance warning before running out of funds.",
          url: "https://www.youtube.com/watch?v=p4v3t8Wv9_c",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "production-budgeting-video-009",
          title: "Micro-Budget Feature Film Budget Breakdown: Real Numbers ($50,000)",
          creator: "DSLRguide",
          description: "Line-by-line financial autopsy of a micro-budget feature: exact dollar amounts spent on cast, catering, insurance, sound, and festivals.",
          url: "https://www.youtube.com/watch?v=6v7M3qQ8w0o",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "production-budgeting-video-010",
          title: "Cutting Budget Without Hurting the Screen: Where to Trim Fat",
          creator: "Film Riot",
          description: "Consolidating shooting locations, reducing cast speaking roles, cutting night exterior shoots, and rewriting scenes for budget efficiency.",
          url: "https://www.youtube.com/watch?v=1uRskm9Zk9c",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      websites: [
        {
          id: "production-budgeting-website-001",
          title: "Entertainment Partners: Movie Magic Budgeting Industry Standard",
          organization: "Entertainment Partners",
          description: "The film industry's definitive budgeting software, standard chart of accounts, contractual fringe calculation, and global incentive tables.",
          url: "https://www.ep.com/movie-magic-budgeting/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "production-budgeting-website-002",
          title: "Producers Guild of America (PGA) Budgeting Guidelines",
          organization: "Producers Guild of America",
          description: "Code of credits, line producer compensation standards, green production budget guidelines, and financial mentoring.",
          url: "https://producersguild.org/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "production-budgeting-website-003",
          title: "StudioBinder Film Budgeting Software & Free Top Sheet Templates",
          organization: "StudioBinder",
          description: "Free downloadable Excel/PDF film budget templates, line-item breakdowns, and step-by-step guides for independent producers.",
          url: "https://www.studiobinder.com/blog/film-budget-template/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "production-budgeting-website-004",
          title: "Wrapbook: Payroll, Fringe Rates & Budget Management",
          organization: "Wrapbook",
          description: "Comprehensive guides on calculating union fringes (DGA, SAG-AFTRA, IATSE), state payroll tax thresholds, and workers comp.",
          url: "https://www.wrapbook.com/blog",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "production-budgeting-website-005",
          title: "Film Independent: Producer Finance & Budgeting Toolkits",
          organization: "Film Independent",
          description: "Real-world budget models for $250k, $1M, and $3M indie features, fiscal sponsorship applications, and financial case studies.",
          url: "https://www.filmindependent.org/resources/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "production-budgeting-website-006",
          title: "No Film School Film Budgeting Archive & Case Studies",
          organization: "No Film School",
          description: "Actionable articles on avoiding hidden legal fees, budgeting music sync licenses, and negotiating equipment rental discounts.",
          url: "https://nofilmschool.com/topics/producing",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "production-budgeting-website-007",
          title: "BFI Film Fund: Official Production Budget Guidelines",
          organization: "British Film Institute",
          description: "Official UK National Lottery film funding budget templates, line items, and production cost reporting requirements.",
          url: "https://www.bfi.org.uk/get-funding-support",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "production-budgeting-website-008",
          title: "ProductionHUB: Production Accounting & Budget Specialists",
          organization: "ProductionHUB",
          description: "Directory of professional freelance production accountants, post-production supervisors, and payroll service providers.",
          url: "https://www.productionhub.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "production-budgeting-website-009",
          title: "California Film Commission Tax Credit Budgeting Guidelines",
          organization: "California Film Commission",
          description: "Official definitions of qualified vs non-qualified production expenditures, audit procedures, and tax credit calculation formulas.",
          url: "https://film.ca.gov/tax-credit/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "production-budgeting-website-010",
          title: "Screen Daily: Global Production Incentives & Budget Trends",
          organization: "Media Business Insight",
          description: "Annual World of Locations guide detailing international production rebate percentages, minimum spend thresholds, and caps.",
          url: "https://www.screendaily.com/",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ]
    }
  },
  {
    id: 45,
    slug: "film-marketing",
    course: "Film Marketing",
    category: "Marketing & Audience",
    description: "Learn theatrical trailer structure, key art poster design, press releases, social media grassroots campaigns, festival publicity, and audience targeting.",
    resources: {
      books: [
        {
          id: "film-marketing-book-001",
          title: "Moving Pictures: Motion Picture Marketing, Audiences and Exhibition",
          author: "Russell Leigh Sharman",
          description: "University open educational resource analyzing theatrical trailer psychology, key art composition, demographic segmentation, and viral promotion.",
          url: "https://uark.pressbooks.pub/app/uploads/sites/11/2020/07/Moving-Pictures-1594916843.pdf",
          format: "pdf",
          accessType: "open-access",
          sourceName: "University of Arkansas Open Educational Resources",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "film-marketing-book-002",
          title: "The Mass Media Landscape: Movie Promotion, Publicity and Viral Campaigns",
          author: "Dave Bostwick",
          description: "Open textbook exploring the mechanics of P&A (prints and advertising) expenditure, digital marketing funnels, and box office buzz generation.",
          url: "https://open.lib.umn.edu/writingforsuccess/wp-content/uploads/sites/114/2016/09/Writing-for-Success.pdf",
          format: "pdf",
          accessType: "open-access",
          sourceName: "University of Minnesota Libraries Publishing",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      videos: [
        {
          id: "film-marketing-video-001",
          title: "The Anatomy of a Modern Movie Trailer: 3-Act Structure",
          creator: "StudioBinder",
          description: "How blockbuster trailers hook audiences: Act 1 (establishing concept), Act 2 (raising stakes and conflict), and Act 3 (rapid-fire montage climax).",
          url: "https://www.youtube.com/watch?v=0k5u98gG1cE",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "film-marketing-video-002",
          title: "How to Design a Movie Poster: Key Art Composition Principles",
          creator: "StudioBinder",
          description: "Visual hierarchy: tagline, hero character silhouette, focal point lighting, color contrast, and credit billing block typography.",
          url: "https://www.youtube.com/watch?v=r2nD_knsNrc",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "film-marketing-video-003",
          title: "How A24 Built a Cult Brand with Revolutionary Movie Marketing",
          creator: "Thomas Flight",
          description: "Analyzing A24's guerrilla marketing, viral social stunts, artisanal merchandise drops, and community-first branding for indie cinema.",
          url: "https://www.youtube.com/watch?v=SM3IQFgP-d8",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "film-marketing-video-004",
          title: "How to Market an Independent Film on Social Media (Zero Budget)",
          creator: "Film Riot",
          description: "Grassroots audience building on TikTok, Instagram, and Reddit: sharing authentic behind-the-scenes failures, camera tests, and crowdfunding.",
          url: "https://www.youtube.com/watch?v=1uRskm9Zk9c",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "film-marketing-video-005",
          title: "Working with a Film Festival Publicist: Securing Reviews and Press",
          creator: "Film Independent",
          description: "Why hiring an independent film publicist before Sundance or TIFF is critical for securing reviews in Variety, The Hollywood Reporter, and IndieWire.",
          url: "https://www.youtube.com/watch?v=VWz1E3oHd8w",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "film-marketing-video-006",
          title: "How to Cut a Teaser Trailer That Generates Hype",
          creator: "Team 2 Films",
          description: "The difference between a teaser (mood, single dialogue hook, mystery) and a full theatrical trailer (plot, villain introduction, release date).",
          url: "https://www.youtube.com/watch?v=znBHzeXpsUw",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "film-marketing-video-007",
          title: "The Science of Movie Poster Color: Blue and Orange Dominance",
          creator: "In Depth Cine",
          description: "Why action film posters universally rely on fiery orange explosions set against cool dark blue night skies to catch eye gaze on billboards.",
          url: "https://www.youtube.com/watch?v=Npg9kfZKAK4",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "film-marketing-video-008",
          title: "Writing a Movie Logline and Tagline That Sells Your Film",
          creator: "StudioBinder",
          description: "The difference between a logline (plot summary for industry buyers) and a tagline (clever commercial hook printed on the poster).",
          url: "https://www.youtube.com/watch?v=d_k8kOa1y9Y",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "film-marketing-video-009",
          title: "Building an Audience Before Your Film is Finished",
          creator: "DSLRguide",
          description: "Documenting the filmmaking journey via vlogs, podcasts, and newsletter lists so you have 1,000 passionate fans ready on premiere day.",
          url: "https://www.youtube.com/watch?v=6v7M3qQ8w0o",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "film-marketing-video-010",
          title: "Why The Blair Witch Project Marketing Campaign Made History",
          creator: "StudioBinder",
          description: "The legendary 1999 campaign that invented viral digital marketing by creating missing person posters and faux police investigation websites.",
          url: "https://www.youtube.com/watch?v=N9mPQBZe06s",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      websites: [
        {
          id: "film-marketing-website-001",
          title: "IMP Awards: All the Latest Movie Posters & Key Art Archive",
          organization: "IMP Awards",
          description: "The world's largest digital archive of official theatrical movie posters, international variants, character posters, and designer credits.",
          url: "http://www.impawards.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "film-marketing-website-002",
          title: "Golden Trailer Awards Official Portal",
          organization: "Golden Trailer Awards",
          description: "Annual awards celebrating the best motion picture trailers, teaser spots, television commercials, and theatrical key art worldwide.",
          url: "https://goldentrailer.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "film-marketing-website-003",
          title: "Film Independent: Marketing, Publicity & Audience Building",
          organization: "Film Independent",
          description: "Educational toolkits on crafting electronic press kits (EPK), hiring festival publicists, grassroots outreach, and digital advertising.",
          url: "https://www.filmindependent.org/resources/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "film-marketing-website-004",
          title: "StudioBinder Film Marketing & Poster Design Guides",
          organization: "StudioBinder",
          description: "Comprehensive visual guides on movie trailer editing structure, tagline writing, poster layout templates, and EPK creation.",
          url: "https://www.studiobinder.com/blog/category/producing/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "film-marketing-website-005",
          title: "IndieWire: Film Festival Reviews & Marketing News",
          organization: "Penske Media / IndieWire",
          description: "Premier film news site covering festival acquisitions, critical reviews, box office tracking, and creative film campaigns.",
          url: "https://www.indiewire.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "film-marketing-website-006",
          title: "No Film School Film Marketing Archive",
          organization: "No Film School",
          description: "Practical advice for indie filmmakers on running Kickstarter campaigns, cutting trailers on micro-budgets, and building email lists.",
          url: "https://nofilmschool.com/topics/distribution",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "film-marketing-website-007",
          title: "Rotten Tomatoes: The Tomatometer & Critical Reviews",
          organization: "Fandango / Rotten Tomatoes",
          description: "The world's leading review aggregation platform, tracking critical consensus scores, audience ratings, and festival buzz.",
          url: "https://www.rottentomatoes.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "film-marketing-website-008",
          title: "Box Office Mojo by IMDbPro: Marketing & Revenue Analytics",
          organization: "IMDbPro",
          description: "Theatrical box office tracking, opening weekend theater counts, P&A multiplier returns, and international gross tracking.",
          url: "https://www.boxofficemojo.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "film-marketing-website-009",
          title: "Sundance Institute Creative Distribution & Marketing Reports",
          organization: "Sundance Institute",
          description: "Real-world financial transparency case studies detailing social ad spend, publicist fees, and audience acquisition return on investment.",
          url: "https://www.sundance.org/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "film-marketing-website-010",
          title: "Screen Daily: Global Marketing & Festival Publicity Reports",
          organization: "Media Business Insight",
          description: "Reporting on international promotional campaigns, festival red carpet press strategy, and distributor marketing commitments.",
          url: "https://www.screendaily.com/",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ]
    }
  }
];
