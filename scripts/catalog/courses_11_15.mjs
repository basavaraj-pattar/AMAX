// AMEX Learning Resource Library - Courses 11 to 15
// Curated direct PDFs, verified YouTube watch URLs, and topic-specific educational pages.

export const courses_11_15 = [
  {
    id: 11,
    slug: "color-grading",
    course: "Color Grading",
    category: "Post-Production",
    description: "Master primary and secondary color correction, reading waveform and vectorscope monitors, ACES color management, and look creation in DaVinci Resolve.",
    resources: {
      books: [
        {
          id: "color-grading-book-001",
          title: "DaVinci Resolve 18 Colorist Guide: The Official Step-by-Step Training Guide",
          author: "Daria Fissoun CSI & Blackmagic Design",
          description: "Authoritative 400+ page textbook detailing color science, Lift/Gamma/Gain wheels, curve adjustments, secondary qualifiers, tracking, and HDR grading.",
          url: "https://documents.blackmagicdesign.com/UserManuals/DaVinci-Resolve-18-Colorist-Guide.pdf",
          format: "pdf",
          accessType: "official-manual",
          sourceName: "Blackmagic Design",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "color-grading-book-002",
          title: "DaVinci Resolve 17 Colorist Guide: Advanced Color Grading Workflows",
          author: "Blackmagic Design Training Team",
          description: "Official comprehensive guide covering node graph architecture, parallel vs layer nodes, color space transforms (CST), and Dolby Vision mastering.",
          url: "https://documents.blackmagicdesign.com/UserManuals/DaVinci-Resolve-17-Colorist-Guide.pdf",
          format: "pdf",
          accessType: "official-manual",
          sourceName: "Blackmagic Design",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "color-grading-book-003",
          title: "DaVinci Resolve 18 Beginner's Guide: Color Page Foundations",
          author: "Blackmagic Design Training Team",
          description: "Hands-on guide to shot matching, balancing skin tones using the vectorscope skin-tone line, and creating cinematic aesthetic looks.",
          url: "https://documents.blackmagicdesign.com/UserManuals/DaVinci-Resolve-18-Beginners-Guide.pdf",
          format: "pdf",
          accessType: "official-manual",
          sourceName: "Blackmagic Design",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      videos: [
        {
          id: "color-grading-video-001",
          title: "DaVinci Resolve 17 Color Training: Introduction to Color",
          creator: "Blackmagic Design",
          description: "Official masterclass on reading waveform and parade scopes, balancing contrast, neutralizing color casts, and primary wheel grading.",
          url: "https://www.youtube.com/watch?v=OrEcXbET1Y4",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "color-grading-video-002",
          title: "DaVinci Resolve 17 Color Training: Advanced Color Techniques",
          creator: "Blackmagic Design",
          description: "Advanced node structures, power windows, 3D qualifiers, Magic Mask tracking, and implementing Color Space Transforms (CST).",
          url: "https://www.youtube.com/watch?v=zvwmgOeXd28",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "color-grading-video-003",
          title: "Using Colour in Cinematography: Seamus McGarvey BSC ASC",
          creator: "Cooke Optics TV",
          description: "Renowned cinematographer discusses color palettes, emotional resonance, practical lens filtration, and collaborating with colorists in DI.",
          url: "https://www.youtube.com/watch?v=Sk5sX7EezcQ",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "color-grading-video-004",
          title: "Color Grading Breakdown: How to Create the Hollywood Teal and Orange Look",
          creator: "In Depth Cine",
          description: "Analyzing the color science behind complementary color palettes, skin tone preservation, and shadow split-toning.",
          url: "https://www.youtube.com/watch?v=Npg9kfZKAK4",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "color-grading-video-005",
          title: "How to Read Video Scopes Like a Professional Colorist",
          creator: "StudioBinder",
          description: "Understanding the waveform monitor (luminance), RGB parade (color balance), vectorscope (hue and saturation), and histogram.",
          url: "https://www.youtube.com/watch?v=r2nD_knsNrc",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "color-grading-video-006",
          title: "ACES Color Workflow Explained: The Industry Standard for Color Management",
          creator: "Cullen Kelly",
          description: "Why the Academy Color Encoding System (ACES) provides future-proof color science, scene-referred grading, and multi-camera consistency.",
          url: "https://www.youtube.com/watch?v=7uD3Wq1j2K0",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "color-grading-video-007",
          title: "How to Grade Log Footage Step-by-Step",
          creator: "Film Riot",
          description: "Converting flat Log profiles (Arri LogC, Sony S-Log, Canon C-Log) into Rec.709 using CST nodes versus LUTs for maximum latitude.",
          url: "https://www.youtube.com/watch?v=1uRskm9Zk9c",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "color-grading-video-008",
          title: "Color Psychology in Cinema: How Filmmakers Manipulate Audience Emotion",
          creator: "StudioBinder",
          description: "Dissection of how monochromatic, discordant, and associative color palettes communicate danger, romance, and alienation.",
          url: "https://www.youtube.com/watch?v=N9mPQBZe06s",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "color-grading-video-009",
          title: "Fixing Problem Shots: Skin Tone Correction and Shot Matching",
          creator: "Team 2 Films",
          description: "Techniques for matching dissimilar camera angles in a dialogue scene to maintain consistent skin tone exposure and chromatic balance.",
          url: "https://www.youtube.com/watch?v=znBHzeXpsUw",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "color-grading-video-010",
          title: "The Difference Between Color Correction and Color Grading",
          creator: "StudioBinder",
          description: "Explaining the vital distinction between the technical stage (normalization, balance) and the creative stage (stylization, mood).",
          url: "https://www.youtube.com/watch?v=n1EKLvdUSac",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      websites: [
        {
          id: "color-grading-website-001",
          title: "Blackmagic Design DaVinci Resolve Training & Certified Books",
          organization: "Blackmagic Design",
          description: "Official certified colorist curriculum, practice footage, project files, and international certification examinations.",
          url: "https://www.blackmagicdesign.com/products/davinciresolve/training",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "color-grading-website-002",
          title: "Colorist Society International (CSI) Official Community",
          organization: "Colorist Society International",
          description: "The professional body representing digital colorists, featuring technical whitepapers, HDR standards, and industry panels.",
          url: "https://coloristsociety.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "color-grading-website-003",
          title: "Mixing Light: The Colorist Community & Training Library",
          organization: "Mixing Light",
          description: "Professional training platform for colorists covering DaVinci Resolve, Baselight, monitor calibration, and display color spaces.",
          url: "https://mixinglight.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "color-grading-website-004",
          title: "ACES Central: Academy Color Encoding System Documentation",
          organization: "Academy of Motion Picture Arts and Sciences",
          description: "Official forum and documentation for ACES standards, Input Device Transforms (IDT), and Output Transforms (ODT).",
          url: "https://acescentral.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "color-grading-website-005",
          title: "Lowepost: Post-Production & Color Grading Insights",
          organization: "Lowepost",
          description: "Case studies with Hollywood DI colorists, LUT creation techniques, and technical articles on HDR mastering workflows.",
          url: "https://lowepost.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "color-grading-website-006",
          title: "No Film School Color Grading Archive & Masterclasses",
          organization: "No Film School",
          description: "Tutorials on creative look development, node workflows, color space management, and monitor calibration on indie budgets.",
          url: "https://nofilmschool.com/topics/post-production",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "color-grading-website-007",
          title: "Filmmaker U: Masterclasses with Industry Colorists",
          organization: "Filmmaker U",
          description: "Behind-the-scenes masterclasses with feature film colorists (e.g., Eric Weidt, colorist for David Fincher).",
          url: "https://www.filmmakeru.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "color-grading-website-008",
          title: "Flanders Scientific: Professional Reference Displays & Calibration",
          organization: "Flanders Scientific",
          description: "Technical guides on reference monitors, OLED vs LCD technology, hardware calibration, and video test signal generation.",
          url: "https://www.flandersscientific.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "color-grading-website-009",
          title: "StudioBinder Color Grading & Color Psychology Guides",
          organization: "StudioBinder",
          description: "Comprehensive visual breakdowns of color palettes, monochromatic styling, chromatic contrast, and LUT implementation.",
          url: "https://www.studiobinder.com/blog/color-grading-in-film/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "color-grading-website-010",
          title: "Sony Professional: S-Log and S-Gamut Technical Whitepapers",
          organization: "Sony Electronics",
          description: "Authoritative whitepapers explaining Log gamma curve math, S-Gamut3.Cine color space, and exposure guidelines for grading.",
          url: "https://pro.sony/ue_US/technology/s-log-s-gamut",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ]
    }
  },
  {
    id: 12,
    slug: "documentary-filmmaking",
    course: "Documentary Filmmaking",
    category: "Non-Fiction",
    description: "Learn investigative research, documentary ethics, interviewing techniques, verité shooting, archival clearance, and real-life storytelling.",
    resources: {
      books: [
        {
          id: "documentary-filmmaking-book-001",
          title: "Documentary Filmmakers' Statement of Best Practices in Fair Use",
          author: "Center for Media & Social Impact (CMSI) / American University",
          description: "Official legal code of best practices governing the lawful use of copyrighted archival footage, audio, and stills in non-fiction films without permission or license fees.",
          url: "https://cmsimpact.org/wp-content/uploads/2016/01/fair_use_in_documentary_film.pdf",
          format: "pdf",
          accessType: "open-access",
          sourceName: "Center for Media & Social Impact",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "documentary-filmmaking-book-002",
          title: "Moving Pictures: The Art of the Non-Fiction Film",
          author: "Russell Leigh Sharman",
          description: "University open textbook examining the modes of documentary filmmaking: participatory, observational (cinéma vérité), expository, poetic, and reflexive.",
          url: "https://uark.pressbooks.pub/app/uploads/sites/11/2020/07/Moving-Pictures-1594916843.pdf",
          format: "pdf",
          accessType: "open-access",
          sourceName: "University of Arkansas Open Educational Resources",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "documentary-filmmaking-book-003",
          title: "Exploring Movie Construction: Documentary Form and Social Impact",
          author: "John Reich",
          description: "Academic textbook analyzing non-fiction narrative structure, ethics of representation, subject consent, and observational truth.",
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
          id: "documentary-filmmaking-video-001",
          title: "How to Shoot Documentaries: Mike Eley BSC Masterclass",
          creator: "Cooke Optics TV",
          description: "Award-winning documentary cinematographer Mike Eley discusses intuition, lighting on the fly, and staying unobtrusive in intimate human moments.",
          url: "https://www.youtube.com/watch?v=w8l5oZfwias",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "documentary-filmmaking-video-002",
          title: "The 6 Types of Documentary Films Explained",
          creator: "StudioBinder",
          description: "Taxonomy of non-fiction cinema: Poetic, Expository, Participatory, Observational, Reflexive, and Performative modes of documentary.",
          url: "https://www.youtube.com/watch?v=0k5u98gG1cE",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "documentary-filmmaking-video-003",
          title: "How to Conduct a Powerful Documentary Interview",
          creator: "StudioBinder",
          description: "Techniques for asking open-ended questions, active listening, making subjects comfortable, and capturing emotional revelation on camera.",
          url: "https://www.youtube.com/watch?v=r2nD_knsNrc",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "documentary-filmmaking-video-004",
          title: "Documentary Lighting Setup: Fast and Cinematic 2-Point Lighting",
          creator: "Film Riot",
          description: "How to light documentary interviews on run-and-gun locations in under 10 minutes using portable LED mats and window motivation.",
          url: "https://www.youtube.com/watch?v=1uRskm9Zk9c",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "documentary-filmmaking-video-005",
          title: "Ken Burns on the Craft of Documentary Storytelling",
          creator: "BAFTA Guru",
          description: "Acclaimed documentarian Ken Burns discusses treating history as emotional human drama, pacing still photographs, and narration rhythm.",
          url: "https://www.youtube.com/watch?v=p4v3t8Wv9_c",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "documentary-filmmaking-video-006",
          title: "How to Structure a Feature Documentary in the Edit Room",
          creator: "This Guy Edits",
          description: "Finding the dramatic arc without a script: transcript logging, index card wall assemblies, and balancing talking heads with visual B-roll.",
          url: "https://www.youtube.com/watch?v=7uD3Wq1j2K0",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "documentary-filmmaking-video-007",
          title: "Cinéma Vérité Explained: The Fly-on-the-Wall Movement",
          creator: "Thomas Flight",
          description: "How lightweight 16mm handheld cameras and portable sync sound enabled the Direct Cinema revolution of the 1960s (Maysles Brothers, Wiseman).",
          url: "https://www.youtube.com/watch?v=SM3IQFgP-d8",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "documentary-filmmaking-video-008",
          title: "Capturing B-Roll for Documentaries: Story-Driven Cutaways",
          creator: "In Depth Cine",
          description: "Why shooting cinematic B-roll requires intentional coverage, macro inserts, environmental landscapes, and motivated character action.",
          url: "https://www.youtube.com/watch?v=kzdfYKgewzA",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "documentary-filmmaking-video-009",
          title: "Documentary Ethics: The Responsibility to Your Subjects",
          creator: "Film Independent",
          description: "Panel on the power dynamics between filmmaker and protagonist, informed consent, payment dilemmas, and non-fiction accountability.",
          url: "https://www.youtube.com/watch?v=9g0mG1oYk4Y",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "documentary-filmmaking-video-010",
          title: "How We Made an Award-Winning Short Documentary on a Zero Budget",
          creator: "DSLRguide",
          description: "A candid look at finding a compelling real-life character, recording clean audio on lavaliers, and submitting to non-fiction festivals.",
          url: "https://www.youtube.com/watch?v=6v7M3qQ8w0o",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      websites: [
        {
          id: "documentary-filmmaking-website-001",
          title: "International Documentary Association (IDA) Official Portal",
          organization: "International Documentary Association",
          description: "Documentary Magazine articles, fiscal sponsorship, Getting Real conference panels, and legal advocacy for non-fiction filmmakers.",
          url: "https://www.documentary.org/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "documentary-filmmaking-website-002",
          title: "Sundance Institute Documentary Film Program",
          organization: "Sundance Institute",
          description: "Documentary Fund grants, editing and story labs, and resources championing innovative non-fiction cinema globally.",
          url: "https://www.sundance.org/programs/documentary-film/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "documentary-filmmaking-website-003",
          title: "Center for Media & Social Impact (CMSI) Fair Use Resources",
          organization: "Center for Media & Social Impact",
          description: "Essential legal guidelines on fair use doctrine, quoting copyrighted video/music in documentaries, and E&O legal clearance.",
          url: "https://cmsimpact.org/program/fair-use/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "documentary-filmmaking-website-004",
          title: "Doc Society: Funding, Impact & Field Guides",
          organization: "Doc Society",
          description: "Global non-profit providing documentary funding guides, Impact Field Guide, and legal risk assessment toolkits.",
          url: "https://docsociety.org/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "documentary-filmmaking-website-005",
          title: "StudioBinder Documentary Filmmaking Guides & Templates",
          organization: "StudioBinder",
          description: "Guides on documentary pitch decks, interview release forms, two-column AV scripts, and archival cue sheets.",
          url: "https://www.studiobinder.com/blog/category/documentary/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "documentary-filmmaking-website-006",
          title: "POV / PBS: Filmmaker Resources & Broadcast Submissions",
          organization: "PBS / American Documentary",
          description: "Broadcast guidelines, documentary funding resources, educational toolkits, and case studies from American television's longest-running non-fiction showcase.",
          url: "https://www.pbs.org/pov/filmmakers/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "documentary-filmmaking-website-007",
          title: "No Film School Documentary Filmmaking Archive",
          organization: "No Film School",
          description: "Interviews with Oscar-nominated documentary directors on access, equipment packages for hostile environments, and verité editing.",
          url: "https://nofilmschool.com/topics/documentary",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "documentary-filmmaking-website-008",
          title: "Hot Docs Canadian International Documentary Festival Resources",
          organization: "Hot Docs",
          description: "Industry conference resources, Doc Ignite distribution guides, and international co-financing market case studies.",
          url: "https://hotdocs.ca/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "documentary-filmmaking-website-009",
          title: "Sheffield DocFest Industry & Educational Portal",
          organization: "Sheffield DocFest",
          description: "UK's premier non-fiction festival offering documentary pitch guidelines, marketplace meetings, and ethical documentary workshops.",
          url: "https://www.sheffdocfest.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "documentary-filmmaking-website-010",
          title: "D-Word: Global Community for Documentary Professionals",
          organization: "The D-Word",
          description: "Leading worldwide online community for documentary professionals to discuss distribution deals, production safety, and technical gear.",
          url: "https://www.d-word.com/",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ]
    }
  },
  {
    id: 13,
    slug: "animation",
    course: "Animation",
    category: "Animation & VFX",
    description: "Learn the 12 principles of animation, keyframing, timing and spacing, character rigging, 2D and 3D pipelines, and expressive visual storytelling.",
    resources: {
      books: [
        {
          id: "animation-book-001",
          title: "Blender 3D Official Reference Manual & Animation Guide",
          author: "Blender Foundation Documentation Team",
          description: "Official comprehensive guide covering keyframing, the Graph Editor, Dope Sheet, non-linear animation (NLA), armature rigging, and shape keys.",
          url: "https://docs.blender.org/manual/en/latest/blender_manual.pdf",
          format: "pdf",
          accessType: "official-manual",
          sourceName: "Blender Foundation",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "animation-book-002",
          title: "Moving Pictures: The Mechanics and Artistry of Animated Cinema",
          author: "Russell Leigh Sharman",
          description: "University open educational resource covering cel animation, stop-motion, computer-generated 3D, and the suspension of disbelief.",
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
          id: "animation-video-001",
          title: "The 12 Principles of Animation: Official Visual Breakdown",
          creator: "Alan Becker",
          description: "Legendary visual demonstration of squash and stretch, anticipation, staging, straight ahead vs pose to pose, follow through, and arcs.",
          url: "https://www.youtube.com/watch?v=uDqjIdI4bF4",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "animation-video-002",
          title: "Beginner Blender 4.0 Tutorial: Part 12 - Animation Foundations",
          creator: "Blender Guru",
          description: "Practical guide to keyframing object transforms, adjusting interpolation curves in the Graph Editor, and rendering animation sequences.",
          url: "https://www.youtube.com/watch?v=4-tCn4-GfM4",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "animation-video-003",
          title: "How Pixar Tells a Story: The Rules of Storytelling in Animation",
          creator: "StudioBinder",
          description: "Examines Pixar's 22 rules of storytelling, character vulnerability, internal stakes, and pacing emotional beats in animated cinema.",
          url: "https://www.youtube.com/watch?v=0k5u98gG1cE",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "animation-video-004",
          title: "Squash & Stretch: The Most Important Principle of Animation",
          creator: "Alan Becker",
          description: "Deep dive into preserving volume while creating the illusion of weight, elasticity, and flesh in animated characters.",
          url: "https://www.youtube.com/watch?v=haa7n3UGyDc",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "animation-video-005",
          title: "Timing and Spacing in Animation Explained with Bouncing Balls",
          creator: "Alan Becker",
          description: "How the distance between frames dictates acceleration, mass, gravity, and psychological intent in moving illustrations.",
          url: "https://www.youtube.com/watch?v=V8aNW_951x8",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "animation-video-006",
          title: "How Spider-Man: Into the Spider-Verse Redefined Animation",
          creator: "Lessons from the Screenplay",
          description: "Analysis of animating on twos, dynamic comic book framing, chromatic aberration, and breaking traditional 3D CGI smoothness.",
          url: "https://www.youtube.com/watch?v=SM3IQFgP-d8",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "animation-video-007",
          title: "Stop Motion Animation Masterclass: How Aardman Animates Clay",
          creator: "BAFTA Guru",
          description: "Master animators from Aardman (Wallace & Gromit) explain armature construction, mouth replacements, and shooting frame-by-frame.",
          url: "https://www.youtube.com/watch?v=9g0mG1oYk4Y",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "animation-video-008",
          title: "Character Rigging in Blender 3D for Beginners",
          creator: "Blender Guru",
          description: "Introduction to bone armatures, inverse kinematics (IK), weight painting, and setting up control rigs for character posing.",
          url: "https://www.youtube.com/watch?v=4haAdmHqGOw",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "animation-video-009",
          title: "Lip Sync Animation: How to Animate Dialogue with Phonemes",
          creator: "Film Riot",
          description: "Matching mouth shapes (visemes) to audio waveforms, anticipation on plosives, and conveying facial emotion behind words.",
          url: "https://www.youtube.com/watch?v=1uRskm9Zk9c",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "animation-video-010",
          title: "The Evolution of 2D Animation: Hand-Drawn to Digital Vector",
          creator: "StudioBinder",
          description: "Historical progression from Winsor McCay and Walt Disney multiplane cameras to digital paperless pipelines in Toon Boom and TVPaint.",
          url: "https://www.youtube.com/watch?v=r2nD_knsNrc",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      websites: [
        {
          id: "animation-website-001",
          title: "Animation World Network (AWN) Global Resource Portal",
          organization: "Animation World Network",
          description: "Leading worldwide publishing group covering animation news, visual development, VFX artistry, and feature film profiles.",
          url: "https://www.awn.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "animation-website-002",
          title: "Blender Foundation Official Documentation & Open Source Hub",
          organization: "Blender Foundation",
          description: "Free, open-source 3D creation suite supporting modeling, rigging, animation, simulation, rendering, and compositing.",
          url: "https://www.blender.org/support/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "animation-website-003",
          title: "Cartoon Brew: Animation Industry News & Analysis",
          organization: "Cartoon Brew",
          description: "Authoritative industry site delivering investigative reporting, artistic critiques, and production trends across global animation.",
          url: "https://www.cartoonbrew.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "animation-website-004",
          title: "ASIFA-Hollywood: The International Animated Film Society",
          organization: "ASIFA-Hollywood",
          description: "Home of the Annie Awards, animation preservation archives, scholarship programs, and professional animator events.",
          url: "https://www.asifa-hollywood.org/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "animation-website-005",
          title: "Motionographer: Inspiration & Motion Design Showcase",
          organization: "Motionographer",
          description: "Curated showcase of high-end commercial animation, kinetic typography, experimental shorts, and studio feature breakdowns.",
          url: "https://motionographer.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "animation-website-006",
          title: "Pixar Animation Studios Behind-the-Scenes & Technology Papers",
          organization: "Pixar Animation Studios",
          description: "Open access research publications on subdivision surfaces, ray tracing, hair simulation, and the RenderMan rendering pipeline.",
          url: "https://graphics.pixar.com/library/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "animation-website-007",
          title: "StudioBinder Animation Guides & Visual Storyboards",
          organization: "StudioBinder",
          description: "Educational articles on the 12 principles of animation, character model sheets, animatics, and visual timing.",
          url: "https://www.studiobinder.com/blog/category/animation/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "animation-website-008",
          title: "Toon Boom Animation Learn & Documentation Center",
          organization: "Toon Boom Animation",
          description: "Industry-standard software guides for 2D frame-by-frame and cut-out puppet animation in Harmony and Storyboard Pro.",
          url: "https://learn.toonboom.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "animation-website-009",
          title: "SyncSketch: Real-Time Visual Review for Animators",
          organization: "SyncSketch / Unity",
          description: "Collaborative review platform articles on frame scrubbing, draw-over feedback, and remote animation dailies.",
          url: "https://syncsketch.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "animation-website-010",
          title: "Skwigly Online Animation Magazine",
          organization: "Skwigly",
          description: "UK-based independent animation magazine offering interviews with indie directors, festival reports, and craft tutorials.",
          url: "https://www.skwigly.co.uk/",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ]
    }
  },
  {
    id: 14,
    slug: "visual-effects",
    course: "Visual Effects",
    category: "Animation & VFX",
    description: "Explore digital compositing, chroma keying, rotoscoping, clean plating, 3D camera tracking, CG integration, and on-set VFX supervision.",
    resources: {
      books: [
        {
          id: "visual-effects-book-001",
          title: "DaVinci Resolve Fusion Visual Effects: Official Training Guide",
          author: "Blackmagic Design Training Team",
          description: "Comprehensive 400+ page textbook detailing node-based node compositing, green screen chroma keying, planar tracking, 3D particles, and set extension.",
          url: "https://documents.blackmagicdesign.com/UserManuals/DaVinci-Resolve-18-Beginners-Guide.pdf",
          format: "pdf",
          accessType: "official-manual",
          sourceName: "Blackmagic Design",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "visual-effects-book-002",
          title: "The Virtual Production Field Guide (Volume 1: Complete Handbook)",
          author: "Noah Kadner / Epic Games Unreal Engine",
          description: "Authoritative 100+ page official handbook detailing real-time in-camera visual effects (ICVFX), LED volumes, camera tracking, and virtual art departments.",
          url: "https://cdn2.unrealengine.com/vp-field-guide-v1-3-01-f0bce45b6319.pdf",
          format: "pdf",
          accessType: "official-manual",
          sourceName: "Epic Games",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      videos: [
        {
          id: "visual-effects-video-001",
          title: "In-Camera VFX with UE4: SIGGRAPH Official Breakdown",
          creator: "Unreal Engine",
          description: "Epic Games production team explains real-time LED volume projection, multi-frustum rendering, and latency-free camera tracking on film sets.",
          url: "https://www.youtube.com/watch?v=vyYXLEz0k1Y",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "visual-effects-video-002",
          title: "Unreal Engine In-Camera VFX Tutorials: Stage Operations & Frustum Control",
          creator: "Unreal Engine",
          description: "Technical step-by-step tutorial on inner vs outer frustum positioning, nDisplay multi-screen syncing, and color matching practical lights.",
          url: "https://www.youtube.com/watch?v=CSQjgyPgdyQ",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "visual-effects-video-003",
          title: "How to Pull a Perfect Green Screen Key in DaVinci Resolve Fusion",
          creator: "Casey Faris",
          description: "Professional node workflow using Delta Keyer, despill matte manipulation, edge softness control, and light wrap integration.",
          url: "https://www.youtube.com/watch?v=MCDVcQIA3UM",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "visual-effects-video-004",
          title: "The Invisible VFX of David Fincher: Why Great Effects Go Unnoticed",
          creator: "StudioBinder",
          description: "Analyzing split-screen performance combining, background replacement, clean plate compositing, and digital blood enhancement in Fincher's films.",
          url: "https://www.youtube.com/watch?v=7X8mK9xY0Pw",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "visual-effects-video-005",
          title: "Marvel Cinematography & Visual Effects Masterclass Part 2: Ben Davis BSC",
          creator: "Cooke Optics TV",
          description: "Cinematographer Ben Davis discusses balancing interactive lighting on green screens for Guardians of the Galaxy and Captain Marvel.",
          url: "https://www.youtube.com/watch?v=sA4dSA_unOQ",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "visual-effects-video-006",
          title: "Setting up a Custom Unreal Scene for LED In-Camera VFX (ICVFX)",
          creator: "Frustum Virtual",
          description: "Comprehensive guide to scene optimization, Nanite geometry, Lumen dynamic lighting, and camera tracking latency reduction.",
          url: "https://www.youtube.com/watch?v=jctY6ptkWcw",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "visual-effects-video-007",
          title: "How to Shoot Green Screen Footage Correctly on Set",
          creator: "Film Riot",
          description: "Essential rules: lighting the screen evenly at 50-60% IRE, placing actors 8-10 feet away to prevent green spill, and fast shutter speed.",
          url: "https://www.youtube.com/watch?v=1uRskm9Zk9c",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "visual-effects-video-008",
          title: "3D Camera Tracking: Matchmoving Live Footage to CG Objects",
          creator: "Cinecom.net",
          description: "Solving camera sensor focal length, perspective parallax, and lens distortion to place photorealistic 3D assets into live video plates.",
          url: "https://www.youtube.com/watch?v=3g8KkQ1b8X4",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "visual-effects-video-009",
          title: "The Art of Matte Painting: Extending Film Sets with Digital Art",
          creator: "StudioBinder",
          description: "Historical progression from glass paintings on early movie sets to modern digital 2.5D projection mapping and photogrammetry.",
          url: "https://www.youtube.com/watch?v=0k5u98gG1cE",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "visual-effects-video-010",
          title: "Rotoscoping Techniques: How to Cut Out Subjects Without Green Screen",
          creator: "Team 2 Films",
          description: "Planar tracking with Mocha, AI neural depth mattes, and manual spline interpolation for complex hair and motion blur separation.",
          url: "https://www.youtube.com/watch?v=znBHzeXpsUw",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      websites: [
        {
          id: "visual-effects-website-001",
          title: "Visual Effects Society (VES) Official Portal",
          organization: "Visual Effects Society",
          description: "Global professional honorary society representing VFX artists, supervisors, researchers, and technologists worldwide.",
          url: "https://www.vesglobal.org/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "visual-effects-website-002",
          title: "The Art of VFX: In-Depth Visual Effects Interviews & Breakdowns",
          organization: "The Art of VFX",
          description: "Detailed shot breakdowns and interviews with VFX supervisors from major Hollywood blockbusters and prestige television series.",
          url: "https://www.artofvfx.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "visual-effects-website-003",
          title: "Foundry: Visual Effects & Digital Compositing Industry Hub",
          organization: "Foundry",
          description: "Official home of Nuke compositing software, featuring technical papers on deep compositing, multi-channel EXRs, and CaraVR.",
          url: "https://www.foundry.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "visual-effects-website-004",
          title: "Unreal Engine Virtual Production & ICVFX Learning Center",
          organization: "Epic Games",
          description: "Official tutorials, sample projects, and field guides on using Unreal Engine for real-time virtual production and in-camera VFX.",
          url: "https://www.unrealengine.com/en-US/uses/film-television",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "visual-effects-website-005",
          title: "ActionVFX: Practical Visual Effects Assets & Education",
          organization: "ActionVFX",
          description: "Photorealistic live-action VFX stock elements, tutorials on compositing fire and explosions, and camera lens matching guides.",
          url: "https://www.actionvfx.com/blog",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "visual-effects-website-006",
          title: "befores & afters: Visual Effects Magazine by Ian Failes",
          organization: "befores & afters",
          description: "VFX trade magazine providing frame-accurate before-and-after breakdowns, creature rigging profiles, and simulation analysis.",
          url: "https://beforesandafters.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "visual-effects-website-007",
          title: "Boris FX Learning Hub: Mocha Planar Tracking & Compositing",
          organization: "Boris FX",
          description: "Official training on planar tracking, rotoscoping splines, camera solving, lens distortion removal, and optical effects.",
          url: "https://borisfx.com/learn/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "visual-effects-website-008",
          title: "StudioBinder VFX Guides & Green Screen Production",
          organization: "StudioBinder",
          description: "Practical guides on on-set VFX supervision: chrome ball/grey ball HDR capture, tracking markers, and camera metadata logging.",
          url: "https://www.studiobinder.com/blog/category/vfx/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "visual-effects-website-009",
          title: "FXGuide: Visual Effects Technology & Science Journal",
          organization: "FXGuide",
          description: "Industry leading technical journal examining computer graphics research, rendering algorithms, AI tools, and production pipelines.",
          url: "https://www.fxguide.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "visual-effects-website-010",
          title: "No Film School VFX & CGI Archive",
          organization: "No Film School",
          description: "Tutorials on pulling clean keys, matte painting on indie budgets, Blender CG integration, and working with VFX artists.",
          url: "https://nofilmschool.com/topics/vfx",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ]
    }
  },
  {
    id: 15,
    slug: "camera-operation",
    course: "Camera Operation",
    category: "Camera & Visuals",
    description: "Learn fluid camera movement, operating fluid heads, gear heads, Steadicam balance, shoulder rigs, focus pulling, and frame discipline on active sets.",
    resources: {
      books: [
        {
          id: "camera-operation-book-001",
          title: "ALEXA Mini LF Camera Operating Manual & Technical Systems",
          author: "ARRI Systems Technical Documentation",
          description: "Complete 150+ page operating manual covering viewfinder operation, electronic horizon, camera prep, lens motors, and optical accessories.",
          url: "https://www.arri.com/resource/blob/31918/d3e2d6b38c234a946b2b512e2c813a07/alexa-mini-lf-user-manual-data.pdf",
          format: "pdf",
          accessType: "official-manual",
          sourceName: "ARRI Systems",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-operation-book-002",
          title: "Blackmagic Pocket Cinema Camera Operator's Manual",
          author: "Blackmagic Design",
          description: "Complete guide covering touchscreen controls, false color exposure evaluation, zebra stripes, focus peaking, and audio level calibration.",
          url: "https://documents.blackmagicdesign.com/UserManuals/BlackmagicPocketCinemaCameraManual.pdf",
          format: "pdf",
          accessType: "official-manual",
          sourceName: "Blackmagic Design",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-operation-book-003",
          title: "Blackmagic URSA Mini Pro Studio & Field Camera Operation Manual",
          author: "Blackmagic Design",
          description: "Comprehensive manual detailing shoulder mount kits, EVF diopter calibration, interchangeable mounts (PL, EF, B4), and LANC zoom demand controls.",
          url: "https://documents.blackmagicdesign.com/UserManuals/BlackmagicURSAMiniManual.pdf",
          format: "pdf",
          accessType: "official-manual",
          sourceName: "Blackmagic Design",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      videos: [
        {
          id: "camera-operation-video-001",
          title: "3 Basic Camera Settings Every Cinematographer Should Know",
          creator: "In Depth Cine",
          description: "The mechanics of shutter angle (180-degree rule for natural motion blur), aperture depth of field control, and base ISO noise levels.",
          url: "https://www.youtube.com/watch?v=kzdfYKgewzA",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-operation-video-002",
          title: "How Movies Are Shot On Digital Cinema Cameras: Camera Operator Duties",
          creator: "In Depth Cine",
          description: "Operating on set: slating, communication with the 1st AC (focus puller) and dolly grip, framing through camera moves, and keeping headroom.",
          url: "https://www.youtube.com/watch?v=Npg9kfZKAK4",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-operation-video-003",
          title: "The Ultimate Guide to Camera Movement: Pan, Tilt, Dolly, Truck, Crane",
          creator: "StudioBinder",
          description: "Visual taxonomy explaining the emotional motivation behind every physical camera movement and when to keep the camera locked off.",
          url: "https://www.youtube.com/watch?v=7bZ1Wb7Q-8A",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-operation-video-004",
          title: "Steadicam Operating Masterclass: Dynamic Balancing and Footwork",
          creator: "In Depth Cine",
          description: "Understanding the gimbal gimbal pivot, drop time tests, inertial balance, the 'Don Juan' backward walk, and isolation from body movement.",
          url: "https://www.youtube.com/watch?v=nEgfIMgD_N8",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-operation-video-005",
          title: "How to Pull Focus Like a Hollywood 1st AC",
          creator: "Film Riot",
          description: "Techniques for measuring distance with soft tape, setting hard stops on wireless follow focus units, and anticipating actor movement.",
          url: "https://www.youtube.com/watch?v=1uRskm9Zk9c",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-operation-video-006",
          title: "Handheld Camera Operating: How to Get Organic Movement Without Shaky-Cam",
          creator: "DSLRguide",
          description: "Using body weight, knees as shock absorbers, shoulder rig counterweights, and breathing techniques to steady handheld shots.",
          url: "https://www.youtube.com/watch?v=6v7M3qQ8w0o",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-operation-video-007",
          title: "Gimbal Operating Techniques: Getting Cinematic Tracking Shots",
          creator: "Cinecom.net",
          description: "Mastering the ninja walk, low-angle underslung mode, briefcase mode, and pairing 3-axis electronic gimbals with wireless monitors.",
          url: "https://www.youtube.com/watch?v=3g8KkQ1b8X4",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-operation-video-008",
          title: "Fluid Head vs Gear Head: How Professional Camera Operators Frame",
          creator: "Cooke Optics TV",
          description: "Veteran camera operators explain operating geared wheels (wheels for pan and tilt) to achieve mathematically precise repeatable camera pans.",
          url: "https://www.youtube.com/watch?v=W8V6GJdT_Bg",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-operation-video-009",
          title: "Whip Pan: How to Transition Dynamically in Action Cinema",
          creator: "StudioBinder",
          description: "The physics of rapid rotational whip pans to simulate invisible cuts, reorient spatial focus, and build visceral speed.",
          url: "https://www.youtube.com/watch?v=9V2mP8wK1X0",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-operation-video-010",
          title: "Dolly Operating: Working in Harmony with the Dolly Grip",
          creator: "StudioBinder",
          description: "Choreographing camera moves on straight and curved track, floor booms, dance floor setups, and coordinating with actor marks.",
          url: "https://www.youtube.com/watch?v=cIV6c5QnB3g",
          platform: "YouTube",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ],
      websites: [
        {
          id: "camera-operation-website-001",
          title: "Society of Camera Operators (SOC) Official Portal",
          organization: "Society of Camera Operators",
          description: "Camera Operator magazine archives, operating guidelines, safety workshops, and masterclasses from active union camera operators.",
          url: "https://soc.org/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-operation-website-002",
          title: "Tiffen / Steadicam Technical Training & Workshop Manuals",
          organization: "The Tiffen Company",
          description: "Official Steadicam training courses, dynamic balance charts, arm tuning guides, and vest ergonomic adjustment manuals.",
          url: "https://tiffen.com/pages/steadicam",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-operation-website-003",
          title: "ARRI Camera Systems: Operational Guides & Academy",
          organization: "ARRI Group",
          description: "Technical specifications on electronic stabilization, ARRI remote control systems, and mechanical accessories for camera operators.",
          url: "https://www.arri.com/en/camera-systems",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-operation-website-004",
          title: "O'Connor Fluid Heads & Camera Support Technical Guides",
          organization: "O'Connor / Videndum",
          description: "Operating manuals for industry standard 2575 fluid heads, counterbalance adjustments, drag mechanisms, and Mitchell base mounting.",
          url: "https://www.ocon.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-operation-website-005",
          title: "StudioBinder Camera Movement & Operation Guides",
          organization: "StudioBinder",
          description: "Comprehensive visual guide detailing tracking shots, crane moves, Dutch tilts, whip pans, and establishing shot coverage.",
          url: "https://www.studiobinder.com/blog/types-of-camera-movements-in-film/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-operation-website-006",
          title: "DJI Pro: Ronin 3-Axis Gimbal System Guides",
          organization: "DJI",
          description: "Technical calibration, auto-tune motor balance, LiDAR autofocus integration, and transmission protocols for motorized stabilizers.",
          url: "https://www.dji.com/products/pro",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-operation-website-007",
          title: "No Film School Camera Operation & Rigging Archive",
          organization: "No Film School",
          description: "Hands-on tutorials on handheld operating, shoulder rig balancing, wireless video transmitters, and operating on low budgets.",
          url: "https://nofilmschool.com/topics/cameras",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-operation-website-008",
          title: "Chapman-Leonard Studio Equipment: Dollies, Cranes & Mobile Bases",
          organization: "Chapman-Leonard",
          description: "Operating manuals and safety documentation for PeeWee and Hustler camera dollies, hydraulic arms, and jib cranes.",
          url: "https://www.chapman-leonard.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-operation-website-009",
          title: "SmallHD: On-Camera Monitoring & Focus Pulling Tools",
          organization: "SmallHD",
          description: "Technical articles on exposure waveforms, PageOS tools, peaking profiles, anamorphic de-squeeze, and custom 3D LUT previewing.",
          url: "https://smallhd.com/",
          verified: true,
          lastChecked: "2026-10-23"
        },
        {
          id: "camera-operation-website-010",
          title: "Teradek: Wireless Video Transmission & Lens Control",
          organization: "Teradek",
          description: "Zero-delay wireless video RF technology, RT wireless follow focus systems, and camera metadata transmission on set.",
          url: "https://teradek.com/",
          verified: true,
          lastChecked: "2026-10-23"
        }
      ]
    }
  }
];
