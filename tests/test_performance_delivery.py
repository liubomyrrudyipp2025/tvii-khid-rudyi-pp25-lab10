"""Regression checks for parser-visible, ordered performance resources."""
from html.parser import HTMLParser
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class Resources(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.in_head = False
        self.styles = []
        self.scripts = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'head':
            self.in_head = True
        elif tag == 'link' and attrs.get('rel') == 'stylesheet' and self.in_head:
            self.styles.append(attrs.get('href'))
        elif tag == 'script' and attrs.get('src'):
            self.scripts.append(attrs)

    def handle_endtag(self, tag):
        if tag == 'head':
            self.in_head = False

class PerformanceDeliveryTests(unittest.TestCase):
    def test_fonts_are_discoverable_in_html_without_nested_css_request(self):
        resources = Resources((ROOT / 'index.html').read_text(encoding='utf-8'))
        css = (ROOT / 'css/custom-styles.css').read_text(encoding='utf-8')
        font = './assets/fonts/google-fonts.css'
        self.assertEqual(resources.styles.count(font), 1)
        self.assertLess(resources.styles.index('./css/tailwind.css'), resources.styles.index(font))
        self.assertLess(resources.styles.index(font), resources.styles.index('./css/custom-styles.css'))
        self.assertNotIn('@import', css)

    def test_library_scripts_are_ordered_nonblocking_and_theme_remains_early(self):
        resources = Resources((ROOT / 'index.html').read_text(encoding='utf-8'))
        expected = [
            'https://cdn.jsdelivr.net/npm/swiper@11.2.10/swiper-bundle.min.js',
            'https://cdn.jsdelivr.net/npm/glightbox@3.3.1/dist/js/glightbox.min.js',
            'https://cdn.jsdelivr.net/npm/typed.js@2.0.12/lib/typed.min.js',
            './js/media-components.js',
        ]
        footer = resources.scripts[-4:]
        self.assertEqual([s['src'] for s in footer], expected)
        for script in footer:
            with self.subTest(src=script['src']):
                self.assertIn('defer', script)
                self.assertNotIn('async', script)
        self.assertEqual(resources.scripts[0]['src'], './js/theme.js')
        self.assertNotIn('defer', resources.scripts[0])
        self.assertNotIn('async', resources.scripts[0])

if __name__ == '__main__':
    unittest.main()
