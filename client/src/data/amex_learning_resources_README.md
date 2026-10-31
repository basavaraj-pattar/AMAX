# AMEX Learning Resources — integration notes

This catalog covers all 60 course topics in the supplied AMEX learning list. Each course has `books`, `videos`, and `websites` arrays, with `{ title, url }`-style entries.

## Important link behavior

- **Books:** links open a Google Books search/listing for the specific title and author. Preview, ebook purchase, or library-loan options vary by title, edition, account, and region. These links do **not** promise that the complete ebook is free or available to download.
- **Videos:** links open topic-specific YouTube search results, so learners can select currently available tutorials and masterclasses. They are search links rather than individually verified video URLs.
- **Websites:** links go to official organizations, learning hubs, or specialist resources. Some organizations or tools may have paid content or eligibility restrictions.

## JavaScript usage

```js
import learningResources from './amexLearningResources.js';

const course = learningResources.find((item) => item.slug === 'cinematography');
const books = course?.resources.books ?? [];
const videos = course?.resources.videos ?? [];
const websites = course?.resources.websites ?? [];
```

Example rendering pattern:

```jsx
{books.map((book) => (
  <a key={book.title} href={book.url} target="_blank" rel="noreferrer">
    {book.title}
  </a>
))}
```

This is a curated starter catalog rather than an exhaustive list of every book published or every video available online. Review individual links before shipping, especially for paid, region-restricted, or changing third-party content.
