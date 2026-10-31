# AMEX Learning Resource Library — Production Catalog

## Executive Summary

The **AMEX Learning Resource Library** provides a complete, curated, and directly accessible repository of educational materials for all **60 filmmaking courses** in the AMEX platform.

Every single course includes:
- **10 Books / E-books**: Direct open-access PDFs, official technical manuals (ARRI, RED, Sony, Blackmagic, Avid, Epic Games), and public domain foundational cinema texts. No generic book store search pages or paywall previews.
- **10 Video Tutorials**: Curated, verified individual YouTube watch links from premier filmmaking educators (StudioBinder, Every Frame a Painting, Lessons from the Screenplay, In Depth Cine, Thomas Flight, Film Riot, Standard Story Company, BAFTA Guru, AFI). No search result URLs or channel homepages.
- **10 Recommended Websites**: Direct topic-specific educational pages, guild resources (DGA, WGA, ASC, ACE, SAG-AFTRA), and industry reference hubs.

### Total Library Inventory
- **Courses Supported**: 60
- **Books / E-books**: 600 verified digital books / direct PDFs
- **Video Tutorials**: 600 verified YouTube watch videos
- **Recommended Websites**: 600 verified educational pages
- **Total Curated Assets**: **1,800 resources**

## Delivered Files
1. `client/src/data/learningCourses.js` — Primary application data module integrated with the AMEX React client.
2. `client/src/data/amexLearningResources.js` — Standard ES module export for external consumers.
3. `amex_learning_resources.json` — Machine-readable JSON catalog (in both `client/src/data` and workspace root).
4. `amex_learning_resources_inventory.csv` — Full tabular inventory with course IDs, slugs, titles, authors, and URLs.
5. `amex_learning_resources_QA.json` — Machine-readable QA audit.
6. `amex_learning_resources_README.md` — Complete documentation and usage guide.
