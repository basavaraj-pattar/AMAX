const commonsFile = filename => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=900`
const commonsPage = filename => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename).replaceAll('%20', '_')}`

// A researched, reusable portrait set for the Learn course tiles. The display
// treatment is applied in CSS; the image itself remains hosted by Commons.
export const learnCoursePortraits = [
  {
    name: 'Satyajit Ray',
    file: 'Satyajit Ray in New York (cropped).jpg',
    credit: 'Dinu Alam Newyork · CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    position: '55% 42%',
  },
  {
    name: 'Girish Kasaravalli',
    file: 'Girish Kasaravalli Crop.jpg',
    credit: 'Dhvraju · Public domain',
    position: '50% 36%',
  },
  {
    name: 'Upendra',
    file: 'Upendra(actor).jpg',
    credit: 'Gpkp · CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    position: '50% 30%',
  },
  {
    name: 'Rakshit Shetty',
    file: 'RakshitShetty.jpg',
    credit: 'Movie89buff · CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    position: '53% 33%',
  },
  {
    name: 'Rishab Shetty',
    file: 'Rishab Shetty in 2023.jpg',
    credit: 'Narendra Modi · CC BY 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    position: '53% 42%',
  },
  {
    name: 'Adoor Gopalakrishnan',
    file: 'Director Adoor Gopalakrishnan.jpg',
    credit: 'Hareesh N. Nampoothiri · CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    position: '50% 32%',
  },
  {
    name: 'Mani Ratnam',
    file: 'Mani Ratnam at the Museum of the Moving Image.jpg',
    credit: 'Santosh Kumar T K · CC BY-SA 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    position: '50% 36%',
  },
  {
    name: 'Anurag Kashyap',
    file: 'Anurag kashyap.jpg',
    credit: 'Mayank.hc · Public domain',
    position: '50% 30%',
  },
  {
    name: 'Stanley Kubrick',
    file: 'Stanley Kubrick (1949 portrait by Phillip Harrington - cropped).jpg',
    credit: 'Phillip Harrington / LOOK · Public domain',
    position: '50% 36%',
  },
  {
    name: 'Takeshi Kitano',
    file: 'Takeshi Kitano 20180511 (cropped).jpg',
    credit: 'Japan Ministry of Education, Culture, Sports, Science and Technology · CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    position: '50% 32%',
  },
  {
    name: 'Wong Kar-wai',
    file: 'Wong Kar-wai Berlin cropped.jpg',
    credit: 'Siebbi · CC BY 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    position: '50% 32%',
  },
  {
    name: 'Alfred Hitchcock',
    file: 'Alfred Hitchcock NYWTS.jpg',
    credit: 'Fred Palumbo / Library of Congress · Public domain',
    position: '50% 30%',
  },
  {
    name: 'Quentin Tarantino',
    file: 'Quentin Tarantino by Gage Skidmore.jpg',
    credit: 'Gage Skidmore · CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    position: '52% 31%',
  },
  {
    name: 'Martin Scorsese',
    file: 'Martin Scorsese by David Shankbone.jpg',
    credit: 'David Shankbone · CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    position: '50% 30%',
  },
  {
    name: 'Agnès Varda',
    file: 'Agnes varda.jpg',
    credit: 'Puchku · CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    position: '58% 38%',
  },
  {
    name: 'Werner Herzog',
    file: 'Werner herzog portrait.jpg',
    credit: 'Raffi Asdourian · CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
    position: '52% 30%',
  },
  {
    name: 'Christopher Nolan',
    file: 'Chris Nolan.jpg',
    credit: 'Peter Andersen · Public domain',
    position: '54% 32%',
  },
  {
    name: 'Franz Kafka',
    file: 'Franz Kafka 1910.jpg',
    credit: 'Atelier Schlosser & Wenisch · Public domain',
    position: '50% 30%',
  },
  {
    name: 'Fyodor Dostoevsky',
    file: 'Dostoevskij 1872.jpg',
    credit: 'Vasily Perov · Public domain',
    position: '50% 32%',
  },
].map(portrait => ({
  ...portrait,
  src: commonsFile(portrait.file),
  sourceUrl: commonsPage(portrait.file),
}))

export const getLearnCoursePortrait = course => {
  const selected = learnCoursePortraits[(Math.max(1, Number(course?.id) || 1) - 1) % learnCoursePortraits.length]
  if (Number(course?.id) === 2) {
    return {
      ...selected,
      file: 'girish-kasaravalli-screenwriting.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      position: '50% 38%',
      src: '/learn-course-portraits/girish-kasaravalli-screenwriting.png',
    }
  }
  if (Number(course?.id) === 9) {
    return {
      ...selected,
      file: 'stanley-kubrick-producing.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      position: '58% 42%',
      src: '/learn-course-portraits/stanley-kubrick-producing.png',
    }
  }
  if (Number(course?.id) === 10) {
    return {
      ...selected,
      name: 'Robin Williams',
      file: 'robin-williams-acting.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      position: '50% 36%',
      src: '/learn-course-portraits/robin-williams-acting.png',
    }
  }
  if (Number(course?.id) === 13) {
    return {
      ...selected,
      name: 'Hayao Miyazaki',
      file: 'hayao-miyazaki-animation.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      position: '67% 38%',
      src: '/learn-course-portraits/hayao-miyazaki-animation.png',
    }
  }
  if (Number(course?.id) === 21) {
    return {
      ...selected,
      name: 'K. Asif',
      file: 'k-asif-line-producing.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      position: '50% 34%',
      src: '/learn-course-portraits/k-asif-line-producing.png',
    }
  }
  if (Number(course?.id) === 22) {
    return {
      ...selected,
      name: 'Shankar Nag',
      file: 'shankar-nag-production-management.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      position: '50% 30%',
      src: '/learn-course-portraits/shankar-nag-production-management.png',
    }
  }
  if (Number(course?.id) === 23) {
    return {
      ...selected,
      name: 'Bong Joon Ho',
      file: 'bong-joon-ho-film-business.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      position: '57% 32%',
      src: '/learn-course-portraits/bong-joon-ho-film-business.png',
    }
  }
  if (Number(course?.id) === 24) {
    return {
      ...selected,
      name: 'Dr. Rajkumar',
      file: 'dr-rajkumar-camera-lenses.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      position: '50% 36%',
      src: '/learn-course-portraits/dr-rajkumar-camera-lenses.png',
    }
  }
  if (Number(course?.id) === 25) {
    return {
      ...selected,
      name: 'Akira Kurosawa',
      file: 'akira-kurosawa-film-festivals.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      position: '58% 42%',
      src: '/learn-course-portraits/akira-kurosawa-film-festivals.png',
    }
  }
  if (Number(course?.id) === 26) {
    return {
      ...selected,
      name: 'Albert Camus',
      file: 'albert-camus-cinematography-technology.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      position: '50% 34%',
      src: '/learn-course-portraits/albert-camus-cinematography-technology.png',
    }
  }
  if (Number(course?.id) === 27) {
    return {
      ...selected,
      name: 'Robert Eggers',
      file: 'robert-eggers-music-for-film.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      position: '52% 38%',
      src: '/learn-course-portraits/robert-eggers-music-for-film.png',
    }
  }
  if (Number(course?.id) === 28) {
    return {
      ...selected,
      name: 'Puttanna Kanagal',
      file: 'puttanna-kanagal-voice-and-dialogue.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      position: '58% 38%',
      src: '/learn-course-portraits/puttanna-kanagal-voice-and-dialogue.png',
    }
  }
  if (Number(course?.id) === 30) {
    return {
      ...selected,
      name: 'Rahul Sadasivan',
      file: 'rahul-sadasivan-story-development.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      position: '50% 42%',
      src: '/learn-course-portraits/rahul-sadasivan-story-development.png',
    }
  }
  if (Number(course?.id) === 32) {
    return {
      ...selected,
      name: 'Anant Nag',
      file: 'anant-nag-screen-acting.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      position: '50% 34%',
      src: '/learn-course-portraits/anant-nag-screen-acting.png',
    }
  }
  if (Number(course?.id) === 38) {
    return {
      ...selected,
      name: 'Raj B Shetty',
      file: 'raj-b-shetty-film-scoring.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      position: '52% 34%',
      src: '/learn-course-portraits/raj-b-shetty-film-scoring.png',
    }
  }
  if (Number(course?.id) === 37) {
    return {
      ...selected,
      name: 'Charlie Chaplin',
      file: 'charlie-chaplin-foley-artistry.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      position: '57% 36%',
      src: '/learn-course-portraits/charlie-chaplin-foley-artistry.png',
    }
  }
  if (Number(course?.id) === 43) {
    return {
      ...selected,
      name: 'Dr. Rajkumar',
      file: 'dr-rajkumar-camera-lenses.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      position: '50% 36%',
      src: '/learn-course-portraits/dr-rajkumar-camera-lenses.png',
    }
  }
  if (Number(course?.id) === 46) {
    return {
      ...selected,
      name: 'Quentin Tarantino',
      file: 'quentin-tarantino-pitching.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      position: '55% 40%',
      flip: true,
      src: '/learn-course-portraits/quentin-tarantino-pitching.png',
    }
  }
  if (Number(course?.id) === 50) {
    return {
      ...selected,
      name: 'Irfan Khan',
      file: 'irfan-khan-post-production.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      position: '45% 34%',
      src: '/learn-course-portraits/irfan-khan-post-production.png',
    }
  }
  if (Number(course?.id) === 51) {
    return {
      ...selected,
      name: 'Werner Herzog',
      file: 'werner-herzog-visual-storytelling.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      position: '51% 40%',
      src: '/learn-course-portraits/werner-herzog-visual-storytelling.png',
    }
  }
  if (Number(course?.id) === 54) {
    return {
      ...selected,
      name: 'Michael Jackson',
      file: 'michael-jackson-directing-actors.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      position: '52% 42%',
      src: '/learn-course-portraits/michael-jackson-directing-actors.png',
    }
  }
  if (Number(course?.id) === 57) {
    return {
      ...selected,
      name: 'Francis Ford Coppola',
      file: 'francis-ford-coppola-world-building.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      position: '68% 42%',
      src: '/learn-course-portraits/francis-ford-coppola-world-building.png',
    }
  }
  if (Number(course?.id) === 20) {
    return {
      ...selected,
      name: 'Dadasaheb Phalke',
      file: 'location-scouting-bimal-roy.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      src: '/learn-course-portraits/location-scouting-bimal-roy.png',
    }
  }
  if (Number(course?.id) === 3) {
    return {
      ...selected,
      file: 'lighting-filmmaker.png',
      credit: 'Image provided by the studio',
      licenseUrl: undefined,
      sourceUrl: undefined,
      src: '/learn-course-portraits/lighting-filmmaker.png',
    }
  }
  return selected
}
