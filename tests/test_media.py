"""ЛР10: contract for actual migration, distinct from cloud snapshots."""
from pathlib import Path
from html.parser import HTMLParser
import unittest
ROOT=Path(__file__).resolve().parents[1]
class Tags(HTMLParser):
    def __init__(self): super().__init__();self.nodes=[]
    def handle_starttag(self,t,a): self.nodes.append((t,dict(a)))
class MediaMigration(unittest.TestCase):
    def test_reviews_migrated_with_six_cards_and_pinned_cdn(self):
        html=(ROOT/'index.html').read_text(encoding='utf-8');tree=Tags();tree.feed(html)
        self.assertEqual(sum(a.get('id')=='reviews' for _,a in tree.nodes),1,'Missing migrated reviews section')
        self.assertEqual(sum(t=='article' and 'swiper-slide' in a.get('class','').split() for t,a in tree.nodes),6)
        cdn='https://cdn.jsdelivr.net/npm/swiper@11.2.10/'
        self.assertIn(cdn+'swiper-bundle.min.css',html.split('</head>')[0])
        self.assertIn(cdn+'swiper-bundle.min.js',html.split('</head>')[1])
        self.assertLess(html.index(cdn+'swiper-bundle.min.js'),html.index('./js/media-components.js'))
        self.assertNotIn('cdn.tailwindcss.com',html)
    def test_gallery_is_one_album_with_original_lab3_assets(self):
        import hashlib
        tree=Tags();tree.feed((ROOT/'index.html').read_text(encoding='utf-8'))
        links=[a for t,a in tree.nodes if t=='a' and 'lab3-gallery-item' in a.get('class','').split()]
        self.assertEqual(len(links),3,'Missing migrated gallery with three original assets')
        self.assertEqual({a.get('data-gallery') for a in links},{'lab3-gallery'})
        for a in links:
            target=ROOT/a['href']
            expected={'hero-dark-desktop.jpg': '273f3f04814cf958b7514ba957e06f80c18fdd073a285ec4a461da4faa687cb1', 'hero-dark-mobile.jpg': '9efa3e1a343de2afe1dadbb2cfe17eab7a63f3e4062c05fca1a3d765259f29f0', 'hero-light-desktop.jpg': 'ea65ac57dabe9c4db3596def8858f989d444c0b544211d4e121417de9d5d6a4d'}
            self.assertEqual(hashlib.sha256(target.read_bytes()).hexdigest(),expected[target.name])
            self.assertTrue(a.get('data-glightbox'))
    def test_typed_hero_has_readable_static_accessible_fallback(self):
        tree=Tags();html=(ROOT/'index.html').read_text(encoding='utf-8');tree.feed(html)
        self.assertEqual(sum(a.get('id')=='typed-text' for _,a in tree.nodes),1,'Missing migrated Typed hero')
        self.assertEqual(sum(a.get('id')=='typed-static' for _,a in tree.nodes),1)
        toggle=[a for _,a in tree.nodes if a.get('id')=='typingToggle'];self.assertEqual(len(toggle),1)
        self.assertIn('hidden',toggle[0]);self.assertEqual(toggle[0].get('aria-pressed'),'false')
        self.assertIn('Настільні ігри для дружніх зустрічей, сімейних вечорів і нових знайомств',html)
if __name__=='__main__':unittest.main()
