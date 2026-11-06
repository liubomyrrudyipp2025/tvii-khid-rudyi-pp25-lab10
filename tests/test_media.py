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
    def test_hero_album_preserves_original_design_assets_after_gallery_redesign(self):
        # User119 replaced the visible grid; assess the same design assets via Hero.
        import hashlib
        tree=Tags();tree.feed((ROOT/'index.html').read_text(encoding='utf-8'))
        triggers=[a for t,a in tree.nodes if t=='button' and a.get('id')=='heroIllustration']
        self.assertEqual(len(triggers),1,'One keyboard-accessible Hero album trigger')
        self.assertIn('hidden',triggers[0],'Hide trigger until successful plugin init')
        js=(ROOT/'js/media-components.js').read_text(encoding='utf-8')
        self.assertIn('window.GLightbox(',js)
        expected={'assets/images/lab3/hero-dark-desktop.jpg':'273f3f04814cf958b7514ba957e06f80c18fdd073a285ec4a461da4faa687cb1',
                  'assets/images/lab3/hero-dark-mobile.jpg':'9efa3e1a343de2afe1dadbb2cfe17eab7a63f3e4062c05fca1a3d765259f29f0',
                  'assets/images/lab3/hero-light-desktop.jpg':'ea65ac57dabe9c4db3596def8858f989d444c0b544211d4e121417de9d5d6a4d',
                  'assets/images/hero-light-mobile.webp':'56dec67a31f5a8b757a8b905a01861a86b8dcbbae9075704677218ca7fce162c'}
        for name,sha in expected.items():
            self.assertIn('./'+name,js)
            self.assertEqual(hashlib.sha256((ROOT/name).read_bytes()).hexdigest(),sha)
    def test_three_stock_photos_are_external_neutral_illustrations(self):
        tree=Tags();tree.feed((ROOT/'index.html').read_text(encoding='utf-8'))
        photos=[a for t,a in tree.nodes if t=='img' and a.get('src','').startswith('https://images.pexels.com/photos/')]
        self.assertEqual(len(photos),3)
        self.assertEqual({a['src'].split('/')[4] for a in photos},{'8111352','8111359','8111365'})
        for a in photos:
            self.assertTrue(a.get('alt'));self.assertTrue(a.get('width'));self.assertTrue(a.get('height'))
            self.assertEqual(a.get('loading'),'lazy');self.assertEqual(a.get('decoding'),'async')
    def test_typed_hero_has_readable_static_accessible_fallback(self):
        tree=Tags();html=(ROOT/'index.html').read_text(encoding='utf-8');tree.feed(html)
        self.assertEqual(sum(a.get('id')=='typed-text' for _,a in tree.nodes),1,'Missing migrated Typed hero')
        self.assertEqual(sum(a.get('id')=='typed-static' for _,a in tree.nodes),1)
        toggle=[a for _,a in tree.nodes if a.get('id')=='typingToggle'];self.assertEqual(len(toggle),1)
        self.assertIn('hidden',toggle[0]);self.assertEqual(toggle[0].get('aria-pressed'),'false')
        self.assertIn('Настільні ігри для дружніх зустрічей, сімейних вечорів і нових знайомств',html)
    def test_eight_hero_media_variants_keep_actual_source_bytes(self):
        import hashlib
        html=(ROOT/'index.html').read_text(encoding='utf-8');tree=Tags();tree.feed(html)
        video=next(a for t,a in tree.nodes if t=='video')
        self.assertEqual(video['data-src-light-mobile'],'./assets/videos/hero-light-mobile.mp4')
        self.assertNotIn('src',video);self.assertEqual(video['preload'],'none');self.assertNotIn('autoplay',video)
        expected={
            'assets/images/lab3/hero-dark-desktop.jpg':'273f3f04814cf958b7514ba957e06f80c18fdd073a285ec4a461da4faa687cb1',
            'assets/images/lab3/hero-dark-mobile.jpg':'9efa3e1a343de2afe1dadbb2cfe17eab7a63f3e4062c05fca1a3d765259f29f0',
            'assets/images/hero-light-desktop.webp':'d7c8cc833303b94dcc9cbb4f5f3c38844de32006db6d0e3a6d8d6eeb0d89009c',
            'assets/images/hero-light-mobile.webp':'56dec67a31f5a8b757a8b905a01861a86b8dcbbae9075704677218ca7fce162c',
            'assets/videos/gemini_generated_video_34dc91d6.mp4':'f1ccfff4f0ca27104a0cf3f3c360e13bd6b8cdce34074108e65a80581e2a8621',
            'assets/videos/hero-mobile.mp4':'f498e92f3b8b0d5b059b0b13d4c7203c0393904dd79ce55b6ee105d812f9021c',
            'assets/videos/hero-light.mp4':'69c7bfeafcbde93a99e93910eaeb6b951f46505782116304b40c82d30f6ff8f5',
            'assets/videos/hero-light-mobile.mp4':'1c6d4085ab3d3be318231c84f3f080a3da439207a69a8a0f72e3b305d72d6d6f',
        }
        self.assertEqual(len(expected),8)
        # Optimized backgrounds may use derived encodings; originals stay in the actual Hero album.
        references=html+(ROOT/'js/media-components.js').read_text(encoding='utf-8')
        for name,sha in expected.items():
            with self.subTest(asset=name):
                self.assertIn('./'+name,references)
                self.assertEqual(hashlib.sha256((ROOT/name).read_bytes()).hexdigest(),sha)
        for key in ['data-src','data-src-mobile','data-src-light','data-src-light-mobile','data-poster','data-poster-mobile','data-poster-light','data-poster-light-mobile']:
            self.assertTrue((ROOT/video[key].removeprefix('./')).is_file(),key)
if __name__=='__main__':unittest.main()
