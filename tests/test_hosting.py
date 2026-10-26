"""Deployment regressions. Actual HTTP confirms the inherited .shtml MIME."""
import unittest,tomllib
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
ROOT=Path(__file__).resolve().parents[1]
class Elements(HTMLParser):
    def __init__(self): super().__init__(); self.nodes=[]
    def handle_starttag(self,tag,attrs): self.nodes.append((tag,dict(attrs)))
def nodes():
    p=Elements(); p.feed((ROOT/'index.html').read_text(encoding='utf-8')); return p.nodes
class HostingTests(unittest.TestCase):
    def test_clock_resource_and_opaque_sandbox(self):
        frame=next(a for t,a in nodes() if t=='iframe' and a.get('title')=='Поточний час у Львові')
        self.assertEqual(frame['src'],'./widgets/clock.shtml')
        self.assertTrue((ROOT/'widgets/clock.shtml').is_file())
        self.assertEqual(set(frame['sandbox'].split()),{'allow-scripts','allow-popups'})
    def test_local_html_resources_resolve_below_repository_prefix(self):
        for tag,a in nodes():
            for k in ['src','href','poster']:
                value=a.get(k,''); u=urlsplit(value)
                if not value or value.startswith('#') or u.scheme or u.netloc: continue
                self.assertFalse(value.startswith('/'),value)
                self.assertTrue((ROOT/unquote(u.path)).is_file(),value)
    def test_initial_hero_video_has_no_eager_source(self):
        videos=[a for t,a in nodes() if t=='video']; self.assertEqual(len(videos),1)
        self.assertNotIn('src',videos[0]); self.assertNotIn('autoplay',videos[0])
        for f in ['assets/videos/hero-mobile.mp4','assets/videos/gemini_generated_video_34dc91d6.mp4']:
            self.assertGreater((ROOT/f).stat().st_size,100000)
    def test_production_css_is_local_and_compiled(self):
        self.assertNotIn('cdn.tailwindcss.com',(ROOT/'index.html').read_text(encoding='utf-8'))
        css=(ROOT/'css/tailwind.css').read_text(encoding='utf-8')
        self.assertIn('.grid',css); self.assertNotIn('@tailwind ',css)
    def test_netlify_uses_allowlisted_build_output(self):
        path=ROOT/'netlify.toml'
        self.assertTrue(path.is_file(),'Version the Netlify dist-only deployment configuration')
        cfg=tomllib.loads(path.read_text(encoding='utf-8'))
        self.assertEqual(cfg['build']['publish'],'dist')
        self.assertEqual(cfg['build']['command'],'npm run package:dist')
if __name__=='__main__': unittest.main()
