---
description: Download all images from a website using the web scraper
---

# Web Image Scraper Workflow

This workflow allows you to download all images from any website by crawling through all its pages.

## Prerequisites

Install required Python packages:
```bash
python -m pip install beautifulsoup4 requests
```

## Steps

### 1. Configure the Scraper

Edit `.agent/web_image_scraper.py` and modify these variables:

```python
# Target website URL
WEBSITE_URL = "https://example.com"

# Output folder (optional - defaults to Downloads/domain_images)
OUTPUT_FOLDER = str(Path.home() / "Downloads" / "custom_folder_name")
```

### 2. Run the Scraper

// turbo
```bash
python .agent/web_image_scraper.py
```

### 3. Monitor Progress

The scraper will:
- ✅ Show each page being scraped
- ✅ Display each image being downloaded
- ✅ Provide final statistics including:
  - Total pages visited
  - Total images downloaded
  - Time taken
  - Output folder location

### 4. Stop Early (if needed)

If you want to stop the scraper before it completes:
- Press `Ctrl+C` to terminate

## Features

The scraper automatically:
- Crawls all pages within the same domain
- Downloads all image formats (jpg, png, gif, svg, webp, ico, bmp, tiff)
- Handles lazy-loaded images (data-src, data-lazy-src attributes)
- Extracts CSS background images
- Avoids duplicate downloads
- Creates organized folder structure
- Uses respectful crawl delays (0.5s between pages)

## Output

Images are saved to:
```
%USERPROFILE%/Downloads/{domain_name}_images/
```

Example:
- Website: https://www.example.com
- Output: `C:/Users/YourName/Downloads/example_com_images/`

## Notes

- The scraper only downloads images from the same domain (no external images)
- Each image gets a unique filename to avoid conflicts
- Original filenames are preserved when possible
- Failed downloads are logged but don't stop the process

## Troubleshooting

**Issue**: Module not found error
**Solution**: Install dependencies with `python -m pip install beautifulsoup4 requests`

**Issue**: Too many pages being crawled
**Solution**: Stop with Ctrl+C - already downloaded images are saved

**Issue**: Some images missing
**Solution**: Some websites use JavaScript to load images dynamically - those may not be captured
